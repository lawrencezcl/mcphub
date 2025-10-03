export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tools, toolTags, toolCategories, tags, categories } from '@/db/schema';
import { createSuccessResponse, createErrorResponse, ApiError, ErrorCode } from '@/lib/api-response';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    const { slug } = await params;

    if (!slug) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '工具标识符不能为空', 400);
    }

    // 获取工具基本信息
    const toolResult = await db
      .select({
        id: tools.id,
        slug: tools.slug,
        name: tools.name,
        description: tools.description,
        repoUrl: tools.repoUrl,
        homepageUrl: tools.homepageUrl,
        packageName: tools.packageName,
        installCmd: tools.installCmd,
        runtimeSupport: tools.runtimeSupport,
        author: tools.author,
        license: tools.license,
        logoUrl: tools.logoUrl,
        version: tools.version,
        createdAt: tools.createdAt,
        updatedAt: tools.updatedAt,
      })
      .from(tools)
      .where(eq(tools.slug, slug))
      .limit(1);

    if (toolResult.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '工具不存在', 404);
    }

    const tool = toolResult[0];

    // 获取标签和分类
    const [toolTagsResult, toolCategoriesResult] = await Promise.all([
      db
        .select({
          slug: tags.slug,
          name: tags.name,
          color: tags.color,
        })
        .from(toolTags)
        .innerJoin(tags, eq(toolTags.tagId, tags.id))
        .where(eq(toolTags.toolId, tool.id)),
      
      db
        .select({
          slug: categories.slug,
          name: categories.name,
        })
        .from(toolCategories)
        .innerJoin(categories, eq(toolCategories.categoryId, categories.id))
        .where(eq(toolCategories.toolId, tool.id)),
    ]);

    const response = createSuccessResponse({
      ...tool,
      tags: toolTagsResult,
      categories: toolCategoriesResult,
    }, {
      timing: {
        requestId,
        duration: Date.now() - startTime,
      },
    });

    return new NextResponse(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error('Tool Detail API Error:', error);
    
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