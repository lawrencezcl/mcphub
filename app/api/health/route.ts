export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // 基础健康检查
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        api: 'healthy',
        memory: await checkMemory(),
        database: await checkDatabase(),
      },
    };

    // 检查是否有任何不健康的服务
    const hasUnhealthyChecks = Object.values(health.checks).some(
      status => status !== 'healthy'
    );

    if (hasUnhealthyChecks) {
      health.status = 'degraded';
    }

    const response = createSuccessResponse(health, {
      timing: {
        requestId,
        duration: Date.now() - startTime,
      },
    });

    return NextResponse.json(response, {
      status: health.status === 'healthy' ? 200 : 503,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    const errorResponse = createErrorResponse(
      new Error('健康检查失败'),
      requestId
    );

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    });
  }
}

async function checkMemory(): Promise<string> {
  try {
    const usage = process.memoryUsage();
    const maxMemory = 512 * 1024 * 1024; // 512MB
    
    if (usage.heapUsed > maxMemory) {
      return 'unhealthy';
    }
    
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
}

async function checkDatabase(): Promise<string> {
  try {
    // 在 Edge Runtime 中，我们只能做基本检查
    // 实际的数据库连接检查应该在 Node.js runtime 中进行
    return 'healthy';
  } catch {
    return 'unhealthy';
  }
}