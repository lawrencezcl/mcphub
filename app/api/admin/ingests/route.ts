export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { ingests, llmJobs, crawlResults, tools, toolTags, toolCategories, tags, categories } from '@/db/schema';
import { requireAdmin } from '@/lib/auth';
import { createSuccessResponse, createErrorResponse, ApiError, ErrorCode } from '@/lib/api-response';
import { PaginationQuerySchema, ReviewSchema } from '@/lib/validators';
import { eq, desc, and } from 'drizzle-orm';

// 获取待审核的入库请求
export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    await requireAdmin(request);

    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams);
    
    const validatedQuery = PaginationQuerySchema.safeParse(searchParams);
    if (!validatedQuery.success) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        '查询参数无效',
        400,
        validatedQuery.error.issues
      );
    }

    const { page, pageSize } = validatedQuery.data;
    const offset = (page - 1) * pageSize;

    // 获取待审核的入库请求
    const ingestResults = await db
      .select({
        id: ingests.id,
        status: ingests.status,
        reason: ingests.reason,
        createdAt: ingests.createdAt,
        llmJobId: ingests.llmJobId,
        llmOutput: llmJobs.output,
        crawlResult: {
          id: crawlResults.id,
          canonicalUrl: crawlResults.canonicalUrl,
          rawTitle: crawlResults.rawTitle,
          rawDescription: crawlResults.rawDescription,
          rawMetadata: crawlResults.rawMetadata,
        },
      })
      .from(ingests)
      .innerJoin(llmJobs, eq(ingests.llmJobId, llmJobs.id))
      .innerJoin(crawlResults, eq(llmJobs.resultId, crawlResults.id))
      .where(eq(ingests.status, 'pending_review'))
      .orderBy(desc(ingests.createdAt))
      .limit(pageSize)
      .offset(offset);

    // 获取总数
    const totalResult = await db
      .select({ count: db.$count(ingests) })
      .from(ingests)
      .where(eq(ingests.status, 'pending_review'));

    const total = totalResult[0]?.count || 0;
    const totalPages = Math.ceil(total / pageSize);

    const response = createSuccessResponse(ingestResults, {
      pagination: {
        page,
        pageSize,
        total,
        totalPages,
      },
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error('Get ingests error:', error);
    
    const errorResponse = createErrorResponse(
      error instanceof ApiError ? error : new ApiError(
        ErrorCode.INTERNAL_ERROR,
        '获取入库请求失败',
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

// 审核入库请求
export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();

  try {
    const admin = await requireAdmin(request);
    const body = await request.json();

    const { ingestId, action, reason } = body;

    if (!ingestId || !action) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '缺少必需参数', 400);
    }

    const validatedReview = ReviewSchema.safeParse({ action, reason });
    if (!validatedReview.success) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        '审核参数无效',
        400,
        validatedReview.error.issues
      );
    }

    // 获取入库请求详情
    const ingestResult = await db
      .select({
        id: ingests.id,
        status: ingests.status,
        llmJobId: ingests.llmJobId,
        llmOutput: llmJobs.output,
        crawlResult: {
          id: crawlResults.id,
          canonicalUrl: crawlResults.canonicalUrl,
          rawTitle: crawlResults.rawTitle,
          rawDescription: crawlResults.rawDescription,
          rawMetadata: crawlResults.rawMetadata,
        },
      })
      .from(ingests)
      .innerJoin(llmJobs, eq(ingests.llmJobId, llmJobs.id))
      .innerJoin(crawlResults, eq(llmJobs.resultId, crawlResults.id))
      .where(eq(ingests.id, ingestId))
      .limit(1);

    if (ingestResult.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '入库请求不存在', 404);
    }

    const ingest = ingestResult[0];

    if (ingest.status !== 'pending_review') {
      throw new ApiError(ErrorCode.CONFLICT, '该请求已被处理', 409);
    }

    if (action === 'approve') {
      // 批准入库
      await approveIngest(ingest, admin.role);
    }

    // 更新入库请求状态
    await db.update(ingests)
      .set({
        status: action === 'approve' ? 'approved' : 'rejected',
        reason: reason || null,
        moderatorId: 1, // TODO: 使用真实的管理员 ID
        updatedAt: new Date(),
      })
      .where(eq(ingests.id, ingestId));

    const response = createSuccessResponse({
      message: action === 'approve' ? '入库请求已批准' : '入库请求已拒绝',
      ingestId,
      action,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    });

  } catch (error) {
    console.error('Review ingest error:', error);
    
    const errorResponse = createErrorResponse(
      error instanceof ApiError ? error : new ApiError(
        ErrorCode.INTERNAL_ERROR,
        '审核入库请求失败',
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

async function approveIngest(ingest: any, adminRole: string) {
  const llmOutput = ingest.llmOutput;
  const crawlResult = ingest.crawlResult;
  const metadata = crawlResult.rawMetadata;

  // 生成工具 slug
  const slug = generateSlug(crawlResult.rawTitle);

  // 创建工具记录
  const toolResult = await db.insert(tools).values({
    slug,
    name: crawlResult.rawTitle,
    description: llmOutput.summary || crawlResult.rawDescription,
    repoUrl: metadata.repository || crawlResult.canonicalUrl,
    homepageUrl: metadata.homepage,
    packageName: metadata.packageName,
    installCmd: metadata.installCmd,
    runtimeSupport: llmOutput.runtimeSupport,
    author: metadata.author,
    license: metadata.license,
    version: metadata.version,
    status: 'approved',
    sourceScore: calculateSourceScore(metadata),
    popularityScore: calculatePopularityScore(metadata),
    qualityScore: calculateQualityScore(llmOutput, metadata),
  }).returning({ id: tools.id });

  const toolId = toolResult[0].id;

  // 处理标签
  if (llmOutput.tags && llmOutput.tags.length > 0) {
    for (const tagName of llmOutput.tags) {
      const tagSlug = generateSlug(tagName);
      
      // 创建或获取标签
      const existingTag = await db
        .select({ id: tags.id })
        .from(tags)
        .where(eq(tags.slug, tagSlug))
        .limit(1);

      let tagId;
      if (existingTag.length > 0) {
        tagId = existingTag[0].id;
      } else {
        const newTag = await db.insert(tags).values({
          name: tagName,
          slug: tagSlug,
        }).returning({ id: tags.id });
        tagId = newTag[0].id;
      }

      // 关联工具和标签
      await db.insert(toolTags).values({
        toolId,
        tagId,
      }).onConflictDoNothing();
    }
  }

  // 处理分类
  if (llmOutput.category) {
    const categorySlug = generateSlug(llmOutput.category);
    
    const existingCategory = await db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.slug, categorySlug))
      .limit(1);

    if (existingCategory.length > 0) {
      await db.insert(toolCategories).values({
        toolId,
        categoryId: existingCategory[0].id,
      }).onConflictDoNothing();
    }
  }

  // 更新入库记录
  await db.update(ingests)
    .set({ toolId })
    .where(eq(ingests.id, ingest.id));
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function calculateSourceScore(metadata: any): number {
  let score = 50; // 基础分数

  if (metadata.type === 'github') {
    score += Math.min(metadata.stars || 0, 100);
    score += Math.min((metadata.forks || 0) * 2, 50);
  } else if (metadata.type === 'npm') {
    score += Math.min((metadata.downloads || 0) / 1000, 100);
  }

  return Math.min(score, 100);
}

function calculatePopularityScore(metadata: any): number {
  let score = 0;

  if (metadata.type === 'github') {
    score = Math.min((metadata.stars || 0) * 2, 100);
  } else if (metadata.type === 'npm') {
    score = Math.min((metadata.downloads || 0) / 500, 100);
  }

  return Math.min(score, 100);
}

function calculateQualityScore(llmOutput: any, metadata: any): string {
  let score = 0.5; // 基础分数

  // 基于 LLM 输出质量
  if (llmOutput.summary && llmOutput.summary.length > 50) score += 0.1;
  if (llmOutput.tags && llmOutput.tags.length > 0) score += 0.1;
  if (llmOutput.category) score += 0.1;

  // 基于元数据完整性
  if (metadata.license) score += 0.1;
  if (metadata.homepage) score += 0.05;
  if (metadata.installCmd) score += 0.05;

  return Math.min(score, 1.0).toFixed(2);
}