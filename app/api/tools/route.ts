export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tools } from '@/db/schema';
import { SearchQuerySchema } from '@/lib/validators';
import { createSuccessResponse, createErrorResponse, ApiError, ErrorCode } from '@/lib/api-response';
import { eq, desc, asc, and, or, ilike, sql } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams);
    
    const validatedQuery = SearchQuerySchema.safeParse(searchParams);
    if (!validatedQuery.success) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        '查询参数无效',
        400,
        validatedQuery.error.issues
      );
    }

    const { page, pageSize, sort, order, q, category, tag, runtime } = validatedQuery.data;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const conditions = [eq(tools.status, 'approved')];

    if (q) {
      conditions.push(
        or(
          ilike(tools.name, `%${q}%`),
          ilike(tools.description, `%${q}%`)
        )!
      );
    }

    if (runtime) {
      const filterJson = { [runtime]: true };
      conditions.push(
        sql`${tools.runtimeSupport} @> ${JSON.stringify(filterJson)}::jsonb`
      );
    }

    // 构建排序
    let orderBy;
    switch (sort) {
      case 'popular':
        orderBy = order === 'asc' ? asc(tools.popularityScore) : desc(tools.popularityScore);
        break;
      case 'name':
        orderBy = order === 'asc' ? asc(tools.name) : desc(tools.name);
        break;
      case 'updated':
        orderBy = order === 'asc' ? asc(tools.updatedAt) : desc(tools.updatedAt);
        break;
      default:
        orderBy = order === 'asc' ? asc(tools.createdAt) : desc(tools.createdAt);
    }

    // 执行查询
    const [toolsResult, totalResult] = await Promise.all([
      db
        .select({
          id: tools.id,
          slug: tools.slug,
          name: tools.name,
          description: tools.description,
          author: tools.author,
          logoUrl: tools.logoUrl,
          runtimeSupport: tools.runtimeSupport,
          popularityScore: tools.popularityScore,
          createdAt: tools.createdAt,
          updatedAt: tools.updatedAt,
        })
        .from(tools)
        .where(and(...conditions))
        .orderBy(orderBy)
        .limit(pageSize)
        .offset(offset),
      
      db
        .select({ count: sql<number>`count(*)` })
        .from(tools)
        .where(and(...conditions))
    ]);

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    const response = createSuccessResponse(toolsResult, {
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
      timing: {
        requestId,
        duration: Date.now() - startTime,
      },
    });

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error('Tools API Error:', error);
    
    const errorResponse = createErrorResponse(
      error instanceof ApiError ? error : new ApiError(
        ErrorCode.INTERNAL_ERROR,
        '服务器内部错误',
        500
      ),
      requestId
    );

    return new NextResponse(JSON.stringify(errorResponse), {
      status: error instanceof ApiError ? (error as ApiError).statusCode : 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    });
  }
}