export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sources } from '@/db/schema';
import { CrawlProcessor } from '@/lib/crawl/processor';
import { createSuccessResponse, createErrorResponse, ApiError, ErrorCode } from '@/lib/api-response';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // 验证 Cron 密钥（Vercel Cron 会发送特殊的头部）
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || process.env.ADMIN_TOKEN;
    
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      throw new ApiError(ErrorCode.UNAUTHORIZED, '无效的 Cron 认证', 401);
    }

    // 获取所有启用的数据源
    const enabledSources = await db
      .select()
      .from(sources)
      .where(eq(sources.enabled, true));

    if (enabledSources.length === 0) {
      return NextResponse.json(
        createSuccessResponse({
          message: '没有启用的数据源',
          processed: 0,
        }),
        { status: 200 }
      );
    }

    const processor = new CrawlProcessor();
    const results = [];

    // 处理每个数据源
    for (const source of enabledSources) {
      try {
        console.log(`开始处理数据源: ${source.type} - ${source.identifier}`);
        
        const result = await processor.processCrawlJob(source.id);
        results.push({
          sourceId: source.id,
          sourceType: source.type,
          identifier: source.identifier,
          ...result,
        });

        console.log(`数据源 ${source.id} 处理完成:`, result);
      } catch (error) {
        console.error(`数据源 ${source.id} 处理失败:`, error);
        results.push({
          sourceId: source.id,
          sourceType: source.type,
          identifier: source.identifier,
          error: error instanceof Error ? error.message : '未知错误',
        });
      }
    }

    // 处理 LLM 队列
    try {
      console.log('开始处理 LLM 队列...');
      await processor.processLLMQueue(20); // 每次处理最多 20 个任务
      console.log('LLM 队列处理完成');
    } catch (error) {
      console.error('LLM 队列处理失败:', error);
    }

    const response = createSuccessResponse({
      message: '爬虫任务执行完成',
      processed: results.length,
      results,
      duration: Date.now() - startTime,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error('Cron crawl error:', error);
    
    const errorResponse = createErrorResponse(
      error instanceof ApiError ? error : new ApiError(
        ErrorCode.INTERNAL_ERROR,
        '爬虫任务执行失败',
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

// 手动触发爬虫任务（仅管理员）
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    // 验证管理员权限
    const authHeader = request.headers.get('authorization');
    const adminToken = process.env.ADMIN_TOKEN;
    
    if (!authHeader || authHeader !== `Bearer ${adminToken}`) {
      throw new ApiError(ErrorCode.UNAUTHORIZED, '需要管理员权限', 401);
    }

    // 获取查询参数
    const url = new URL(request.url);
    const sourceId = url.searchParams.get('sourceId');

    if (sourceId) {
      // 处理单个数据源
      const processor = new CrawlProcessor();
      const result = await processor.processCrawlJob(parseInt(sourceId));

      return NextResponse.json(
        createSuccessResponse({
          message: '单个数据源处理完成',
          result,
        }),
        { status: 200 }
      );
    } else {
      // 触发完整的爬虫任务
      return await POST(request);
    }

  } catch (error) {
    console.error('Manual crawl error:', error);
    
    const errorResponse = createErrorResponse(
      error instanceof ApiError ? error : new ApiError(
        ErrorCode.INTERNAL_ERROR,
        '手动爬虫任务失败',
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