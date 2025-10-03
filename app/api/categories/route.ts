export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { categories } from '@/db/schema';
import { createSuccessResponse, createErrorResponse, ApiError, ErrorCode } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const categoriesResult = await db
      .select({
        id: categories.id,
        slug: categories.slug,
        name: categories.name,
        description: categories.description,
        icon: categories.icon,
      })
      .from(categories)
      .orderBy(categories.name);

    const response = createSuccessResponse(categoriesResult, {
      timing: {
        requestId,
        duration: Date.now() - startTime,
      },
    });

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error('Categories API Error:', error);
    
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