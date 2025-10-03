export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse, ApiError, ErrorCode } from '@/lib/api-response';
import { MetricsCollector, ErrorTracker } from '@/lib/monitoring/logger';
import { cache } from '@/lib/cache';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    await requireAdmin(request);

    const metrics = {
      timestamp: new Date().toISOString(),
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
      performance: MetricsCollector.getAllMetrics(),
      errors: ErrorTracker.getStats().slice(0, 10), // 最近10个错误
      cache: cache.getStats(),
    };

    const response = createSuccessResponse(metrics);

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error('Metrics API error:', error);
    
    const errorResponse = createErrorResponse(
      error instanceof ApiError ? error : new ApiError(
        ErrorCode.INTERNAL_ERROR,
        '获取指标失败',
        500
      ),
      requestId
    );

    return NextResponse.json(errorResponse, {
      status: error instanceof ApiError ? error.statusCode : 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    });
  }
}

// 清除指标数据
export async function DELETE(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    await requireAdmin(request);

    MetricsCollector.clear();
    ErrorTracker.clear();

    const response = createSuccessResponse({
      message: '指标数据已清除',
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error('Clear metrics error:', error);
    
    const errorResponse = createErrorResponse(
      error instanceof ApiError ? error : new ApiError(
        ErrorCode.INTERNAL_ERROR,
        '清除指标失败',
        500
      ),
      requestId
    );

    return NextResponse.json(errorResponse, {
      status: error instanceof ApiError ? error.statusCode : 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    });
  }
}