interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  requestId?: string;
  userId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private context: Record<string, any> = {};

  constructor(private defaultContext: Record<string, any> = {}) {
    this.context = { ...defaultContext };
  }

  // 设置上下文
  setContext(context: Record<string, any>): Logger {
    return new Logger({ ...this.context, ...context });
  }

  // 添加请求ID
  withRequestId(requestId: string): Logger {
    return this.setContext({ requestId });
  }

  // 添加用户ID
  withUserId(userId: string): Logger {
    return this.setContext({ userId });
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: { ...this.context, ...context },
    };

    if (this.context.requestId) {
      entry.requestId = this.context.requestId;
    }

    if (this.context.userId) {
      entry.userId = this.context.userId;
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // 在开发环境下使用彩色输出
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(entry);
    } else {
      // 生产环境使用结构化JSON输出
      console.log(JSON.stringify(entry));
    }
  }

  private consoleLog(entry: LogEntry): void {
    const colors = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
    };

    const reset = '\x1b[0m';
    const color = colors[entry.level];

    const contextStr = entry.context && Object.keys(entry.context).length > 0
      ? ` ${JSON.stringify(entry.context)}`
      : '';

    console.log(
      `${color}[${entry.level.toUpperCase()}]${reset} ${entry.timestamp} ${entry.message}${contextStr}`
    );

    if (entry.error) {
      console.error(entry.error.stack || entry.error.message);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('error', message, context, error);
  }

  // 性能监控
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.info(`Timer: ${label}`, { duration });
    };
  }

  // API请求日志
  apiRequest(method: string, path: string, context?: Record<string, any>): void {
    this.info(`API Request: ${method} ${path}`, {
      type: 'api_request',
      method,
      path,
      ...context,
    });
  }

  // API响应日志
  apiResponse(method: string, path: string, statusCode: number, duration: number, context?: Record<string, any>): void {
    this.info(`API Response: ${method} ${path} ${statusCode}`, {
      type: 'api_response',
      method,
      path,
      statusCode,
      duration,
      ...context,
    });
  }

  // 数据库查询日志
  dbQuery(query: string, duration: number, context?: Record<string, any>): void {
    this.debug('Database Query', {
      type: 'db_query',
      query: query.substring(0, 200), // 限制查询长度
      duration,
      ...context,
    });
  }

  // 缓存操作日志
  cacheOperation(operation: 'hit' | 'miss' | 'set' | 'delete', key: string, context?: Record<string, any>): void {
    this.debug(`Cache ${operation}: ${key}`, {
      type: 'cache_operation',
      operation,
      key,
      ...context,
    });
  }

  // 爬虫任务日志
  crawlJob(jobId: number, status: string, context?: Record<string, any>): void {
    this.info(`Crawl Job ${jobId}: ${status}`, {
      type: 'crawl_job',
      jobId,
      status,
      ...context,
    });
  }

  // LLM处理日志
  llmProcessing(jobId: number, model: string, duration: number, context?: Record<string, any>): void {
    this.info(`LLM Processing: Job ${jobId} with ${model}`, {
      type: 'llm_processing',
      jobId,
      model,
      duration,
      ...context,
    });
  }
}

// 全局日志实例
export const logger = new Logger({
  service: 'mcphub',
  version: process.env.npm_package_version || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
});

// 性能监控装饰器
export function monitored(label?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    const methodLabel = label || `${target.constructor.name}.${propertyName}`;

    descriptor.value = async function (...args: any[]) {
      const endTimer = logger.time(methodLabel);
      
      try {
        const result = await method.apply(this, args);
        endTimer();
        return result;
      } catch (error) {
        endTimer();
        logger.error(`Method ${methodLabel} failed`, error as Error);
        throw error;
      }
    };
  };
}

// 错误追踪
export class ErrorTracker {
  private static errors = new Map<string, { count: number; lastSeen: Date; samples: Error[] }>();

  static track(error: Error, context?: Record<string, any>): void {
    const key = `${error.name}:${error.message}`;
    const existing = this.errors.get(key);

    if (existing) {
      existing.count++;
      existing.lastSeen = new Date();
      if (existing.samples.length < 5) {
        existing.samples.push(error);
      }
    } else {
      this.errors.set(key, {
        count: 1,
        lastSeen: new Date(),
        samples: [error],
      });
    }

    logger.error('Error tracked', error, {
      errorKey: key,
      count: this.errors.get(key)?.count,
      ...context,
    });
  }

  static getStats(): Array<{
    key: string;
    count: number;
    lastSeen: Date;
    sample: string;
  }> {
    return Array.from(this.errors.entries()).map(([key, data]) => ({
      key,
      count: data.count,
      lastSeen: data.lastSeen,
      sample: data.samples[0]?.stack || data.samples[0]?.message || '',
    }));
  }

  static clear(): void {
    this.errors.clear();
  }
}

// 性能指标收集
export class MetricsCollector {
  private static metrics = new Map<string, number[]>();

  static record(name: string, value: number): void {
    const existing = this.metrics.get(name) || [];
    existing.push(value);
    
    // 保持最近1000个数据点
    if (existing.length > 1000) {
      existing.shift();
    }
    
    this.metrics.set(name, existing);
  }

  static getMetric(name: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const values = this.metrics.get(name);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const min = sorted[0];
    const max = sorted[count - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index];

    return { count, avg, min, max, p95 };
  }

  static getAllMetrics(): Record<string, ReturnType<typeof MetricsCollector.getMetric>> {
    const result: Record<string, any> = {};
    for (const [name] of this.metrics) {
      result[name] = this.getMetric(name);
    }
    return result;
  }

  static clear(): void {
    this.metrics.clear();
  }
}

// 健康检查
export class HealthChecker {
  private static checks = new Map<string, () => Promise<boolean>>();

  static register(name: string, check: () => Promise<boolean>): void {
    this.checks.set(name, check);
  }

  static async runAll(): Promise<Record<string, { status: 'healthy' | 'unhealthy'; error?: string }>> {
    const results: Record<string, any> = {};

    for (const [name, check] of this.checks) {
      try {
        const isHealthy = await check();
        results[name] = { status: isHealthy ? 'healthy' : 'unhealthy' };
      } catch (error) {
        results[name] = {
          status: 'unhealthy',
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return results;
  }
}

// 注册默认健康检查
HealthChecker.register('database', async () => {
  try {
    const { db } = await import('@/db');
    await db.execute('SELECT 1');
    return true;
  } catch {
    return false;
  }
});

HealthChecker.register('memory', async () => {
  const usage = process.memoryUsage();
  const maxMemory = 512 * 1024 * 1024; // 512MB
  return usage.heapUsed < maxMemory;
});

export { Logger };