import { NextRequest } from 'next/server';
import { ApiError, ErrorCode } from './api-response';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: NextRequest) => string;
}

class InMemoryRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();

  async isAllowed(key: string, config: RateLimitConfig): Promise<boolean> {
    const now = Date.now();

    // 清理过期记录
    for (const [k, v] of this.requests.entries()) {
      if (v.resetTime < now) {
        this.requests.delete(k);
      }
    }

    const record = this.requests.get(key);
    
    if (!record) {
      this.requests.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    if (record.count >= config.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getResetTime(key: string): number {
    const record = this.requests.get(key);
    return record ? Math.ceil((record.resetTime - Date.now()) / 1000) : 0;
  }
}

const limiter = new InMemoryRateLimiter();

export function rateLimit(config: RateLimitConfig) {
  return async (request: NextRequest) => {
    const key = config.keyGenerator 
      ? config.keyGenerator(request)
      : getClientIP(request);

    const allowed = await limiter.isAllowed(key, config);

    if (!allowed) {
      const resetTime = limiter.getResetTime(key);
      throw new ApiError(
        ErrorCode.RATE_LIMITED,
        '请求过于频繁，请稍后再试',
        429,
        { retryAfter: resetTime }
      );
    }
  };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return 'unknown';
}

// 预定义的限流配置
export const rateLimitConfigs = {
  api: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 100,
  },
  submission: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 5,
  },
  admin: {
    windowMs: 60 * 1000, // 1分钟
    maxRequests: 200,
  },
};

// 创建特定的限流中间件
export const createRateLimitMiddleware = (configName: keyof typeof rateLimitConfigs) => {
  return rateLimit(rateLimitConfigs[configName]);
};