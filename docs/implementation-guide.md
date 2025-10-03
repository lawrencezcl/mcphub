# MCPHub 实施指南

## 概述
本指南基于优化后的系统设计，提供详细的实施步骤、代码示例和最佳实践，确保开发团队能够高效、准确地实现 MCPHub 系统。

## 阶段一：项目初始化与基础设施

### 1.1 项目脚手架搭建

```bash
# 创建 Next.js 项目
npx create-next-app@latest mcphub --typescript --tailwind --eslint --app --src-dir

cd mcphub

# 安装核心依赖
npm install @neondatabase/serverless drizzle-orm drizzle-kit
npm install zod @hookform/resolvers react-hook-form
npm install @radix-ui/react-slot @radix-ui/react-dialog
npm install lucide-react class-variance-authority clsx tailwind-merge

# 安装开发依赖
npm install -D @types/node tsx dotenv-cli
npm install -D vitest @vitejs/plugin-react jsdom
npm install -D @playwright/test
npm install -D prettier prettier-plugin-tailwindcss
```

### 1.2 环境配置

创建 `.env.local`：
```env
# 数据库
DATABASE_URL="postgresql://neondb_owner:npg_hYQK4Dl9MELZ@ep-rapid-mouse-adk1ua6k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

# 认证
ADMIN_TOKEN="your-secure-admin-token-here"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# 外部服务
GITHUB_TOKEN="your-github-token"
AI_PROVIDER_API_KEY="your-ai-provider-key"
UPSTASH_REDIS_URL="your-redis-url"
UPSTASH_REDIS_TOKEN="your-redis-token"

# 应用配置
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_APP_NAME="MCPHub"
```

### 1.3 项目结构创建

```bash
mkdir -p src/{db,lib,components,types}
mkdir -p src/lib/{auth,cache,crawl,llm,validators}
mkdir -p src/lib/crawl/fetchers
mkdir -p src/components/{ui,cards,filters,admin}
mkdir -p app/{admin,api,tools,categories,tags,submit,og}
mkdir -p app/api/{admin,cron}
mkdir -p app/admin/{sources,crawl,ingests}
```

## 阶段二：数据层实现

### 2.1 数据库 Schema 定义

`src/db/schema.ts`：
```typescript
import { 
  pgTable, 
  bigint, 
  text, 
  timestamp, 
  jsonb, 
  integer, 
  boolean, 
  primaryKey,
  decimal,
  date,
  inet
} from 'drizzle-orm/pg-core';

// 工具表
export const tools = pgTable('tools', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  repoUrl: text('repo_url'),
  homepageUrl: text('homepage_url'),
  packageName: text('package_name'),
  installCmd: text('install_cmd'),
  runtimeSupport: jsonb('runtime_support').$type<{
    node?: boolean;
    edge?: boolean;
    browser?: boolean;
  }>(),
  author: text('author'),
  license: text('license'),
  logoUrl: text('logo_url'),
  version: text('version'),
  status: text('status', { enum: ['pending', 'approved', 'rejected', 'archived'] }).default('pending'),
  sourceScore: integer('source_score').default(0),
  popularityScore: integer('popularity_score').default(0),
  qualityScore: decimal('quality_score', { precision: 3, scale: 2 }).default('0.0'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastCrawledAt: timestamp('last_crawled_at', { withTimezone: true }),
});

// 分类表
export const categories = pgTable('categories', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  icon: text('icon'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 标签表
export const tags = pgTable('tags', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  color: text('color').default('#6B7280'),
});

// 工具标签关联表
export const toolTags = pgTable('tool_tags', {
  toolId: bigint('tool_id', { mode: 'number' }).notNull().references(() => tools.id, { onDelete: 'cascade' }),
  tagId: bigint('tag_id', { mode: 'number' }).notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.toolId, t.tagId] }),
}));

// 工具分类关联表
export const toolCategories = pgTable('tool_categories', {
  toolId: bigint('tool_id', { mode: 'number' }).notNull().references(() => tools.id, { onDelete: 'cascade' }),
  categoryId: bigint('category_id', { mode: 'number' }).notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.toolId, t.categoryId] }),
}));

// 用户表
export const users = pgTable('users', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  provider: text('provider').notNull(),
  providerId: text('provider_id').notNull().unique(),
  displayName: text('display_name'),
  email: text('email'),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['user', 'admin', 'editor'] }).default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 提交表
export const submissions = pgTable('submissions', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  submitterEmail: text('submitter_email'),
  payload: jsonb('payload').$type<Partial<typeof tools.$inferInsert>>(),
  status: text('status', { enum: ['pending', 'approved', 'rejected'] }).default('pending'),
  moderatorNote: text('moderator_note'),
  moderatorId: bigint('moderator_id', { mode: 'number' }).references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 浏览量统计表
export const views = pgTable('views', {
  toolId: bigint('tool_id', { mode: 'number' }).notNull().references(() => tools.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  count: integer('count').default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.toolId, t.date] }),
}));

// 点赞表
export const likes = pgTable('likes', {
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  toolId: bigint('tool_id', { mode: 'number' }).notNull().references(() => tools.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.toolId] }),
}));

// 收藏表
export const favorites = pgTable('favorites', {
  userId: bigint('user_id', { mode: 'number' }).notNull().references(() => users.id, { onDelete: 'cascade' }),
  toolId: bigint('tool_id', { mode: 'number' }).notNull().references(() => tools.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.toolId] }),
}));

// 数据源表
export const sources = pgTable('sources', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  type: text('type', { enum: ['github_topic', 'npm_query', 'awesome_list', 'website'] }).notNull(),
  identifier: text('identifier').notNull(),
  enabled: boolean('enabled').default(true),
  config: jsonb('config').$type<Record<string, any>>(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 抓取任务表
export const crawlJobs = pgTable('crawl_jobs', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  sourceId: bigint('source_id', { mode: 'number' }).notNull().references(() => sources.id),
  status: text('status', { enum: ['queued', 'running', 'completed', 'failed'] }).notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  stats: jsonb('stats').$type<{
    itemsFound?: number;
    itemsProcessed?: number;
    errors?: number;
    duration?: number;
  }>(),
  error: text('error'),
});

// 抓取结果表
export const crawlResults = pgTable('crawl_results', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  jobId: bigint('job_id', { mode: 'number' }).notNull().references(() => crawlJobs.id),
  canonicalUrl: text('canonical_url'),
  rawTitle: text('raw_title'),
  rawDescription: text('raw_description'),
  rawReadme: text('raw_readme'),
  rawMetadata: jsonb('raw_metadata'),
  dedupeHash: text('dedupe_hash').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// LLM 处理任务表
export const llmJobs = pgTable('llm_jobs', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  resultId: bigint('result_id', { mode: 'number' }).notNull().references(() => crawlResults.id),
  status: text('status', { enum: ['queued', 'running', 'completed', 'failed'] }).notNull(),
  model: text('model'),
  promptVersion: text('prompt_version'),
  output: jsonb('output').$type<{
    summary?: string;
    tags?: string[];
    category?: string;
    runtimeSupport?: {
      node?: boolean;
      edge?: boolean;
      browser?: boolean;
    };
    risks?: string[];
  }>(),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});

// 入库映射表
export const ingests = pgTable('ingests', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  toolId: bigint('tool_id', { mode: 'number' }).references(() => tools.id),
  llmJobId: bigint('llm_job_id', { mode: 'number' }).notNull().references(() => llmJobs.id),
  status: text('status', { enum: ['pending_review', 'approved', 'rejected'] }).notNull(),
  reason: text('reason'),
  moderatorId: bigint('moderator_id', { mode: 'number' }).references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 审计日志表
export const auditLogs = pgTable('audit_logs', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  tableName: text('table_name').notNull(),
  recordId: bigint('record_id', { mode: 'number' }).notNull(),
  action: text('action', { enum: ['INSERT', 'UPDATE', 'DELETE'] }).notNull(),
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  userId: bigint('user_id', { mode: 'number' }).references(() => users.id),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// 类型导出
export type Tool = typeof tools.$inferSelect;
export type NewTool = typeof tools.$inferInsert;
export type Category = typeof categories.$inferSelect;
export type Tag = typeof tags.$inferSelect;
export type User = typeof users.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Source = typeof sources.$inferSelect;
export type CrawlJob = typeof crawlJobs.$inferSelect;
export type CrawlResult = typeof crawlResults.$inferSelect;
export type LLMJob = typeof llmJobs.$inferSelect;
export type Ingest = typeof ingests.$inferSelect;
```

### 2.2 数据库连接配置

`src/db/index.ts`：
```typescript
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

const sql = neon(process.env.DATABASE_URL);
export const db = drizzle(sql, { schema });

// 类型安全的查询构建器
export type Database = typeof db;
```

### 2.3 Drizzle 配置

`drizzle.config.ts`：
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
} satisfies Config;
```

### 2.4 数据库迁移脚本

`package.json` 添加脚本：
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:migrate": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "db:seed": "tsx src/db/seed.ts"
  }
}
```

创建种子数据 `src/db/seed.ts`：
```typescript
import { db } from './index';
import { categories, tags, sources } from './schema';

async function seed() {
  console.log('🌱 开始种子数据...');

  // 插入默认分类
  const defaultCategories = [
    { name: 'AI & Machine Learning', slug: 'ai-ml', description: 'AI和机器学习相关工具', icon: '🤖' },
    { name: 'Development Tools', slug: 'dev-tools', description: '开发工具和实用程序', icon: '🛠️' },
    { name: 'Data Processing', slug: 'data-processing', description: '数据处理和分析工具', icon: '📊' },
    { name: 'Web Scraping', slug: 'web-scraping', description: '网页抓取和数据提取', icon: '🕷️' },
    { name: 'API Integration', slug: 'api-integration', description: 'API集成和连接器', icon: '🔌' },
  ];

  await db.insert(categories).values(defaultCategories).onConflictDoNothing();

  // 插入默认标签
  const defaultTags = [
    { name: 'TypeScript', slug: 'typescript', color: '#3178C6' },
    { name: 'JavaScript', slug: 'javascript', color: '#F7DF1E' },
    { name: 'Python', slug: 'python', color: '#3776AB' },
    { name: 'Edge Runtime', slug: 'edge-runtime', color: '#000000' },
    { name: 'Node.js', slug: 'nodejs', color: '#339933' },
    { name: 'Browser', slug: 'browser', color: '#FF6B6B' },
    { name: 'OpenAI', slug: 'openai', color: '#412991' },
    { name: 'Anthropic', slug: 'anthropic', color: '#D4A574' },
  ];

  await db.insert(tags).values(defaultTags).onConflictDoNothing();

  // 插入默认数据源
  const defaultSources = [
    {
      type: 'github_topic' as const,
      identifier: 'mcp',
      enabled: true,
      config: { minStars: 1, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'model-context-protocol',
      enabled: true,
      config: { minStars: 1, language: null }
    },
    {
      type: 'npm_query' as const,
      identifier: 'mcp',
      enabled: true,
      config: { minDownloads: 100 }
    },
  ];

  await db.insert(sources).values(defaultSources).onConflictDoNothing();

  console.log('✅ 种子数据完成');
}

seed().catch(console.error);
```

## 阶段三：API 层实现

### 3.1 验证器定义

`src/lib/validators.ts`：
```typescript
import { z } from 'zod';

// 分页查询
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['latest', 'popular', 'name', 'updated']).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// 搜索查询
export const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200).optional(),
  category: z.string().optional(),
  tag: z.string().optional(),
  runtime: z.enum(['node', 'edge', 'browser']).optional(),
}).merge(PaginationQuerySchema);

// 工具创建
export const ToolCreateSchema = z.object({
  slug: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, '只能包含小写字母、数字和连字符'),
  name: z.string().min(1).max(100),
  description: z.string().max(1000).optional(),
  repoUrl: z.string().url().optional(),
  homepageUrl: z.string().url().optional(),
  packageName: z.string()
    .regex(/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/, '无效的包名格式')
    .optional(),
  installCmd: z.string().max(200).optional(),
  runtimeSupport: z.object({
    node: z.boolean().optional(),
    edge: z.boolean().optional(),
    browser: z.boolean().optional(),
  }).optional(),
  author: z.string().max(100).optional(),
  license: z.string().max(50).optional(),
  logoUrl: z.string().url().optional(),
  version: z.string().max(20).optional(),
});

// 工具更新
export const ToolUpdateSchema = ToolCreateSchema.partial().omit({ slug: true });

// 提交
export const SubmissionSchema = z.object({
  submitterEmail: z.string().email().optional(),
  payload: ToolCreateSchema,
});

// 审核
export const ReviewSchema = z.object({
  action: z.enum(['approve', 'reject']),
  reason: z.string().max(500).optional(),
});

// 数据源
export const SourceSchema = z.object({
  type: z.enum(['github_topic', 'npm_query', 'awesome_list', 'website']),
  identifier: z.string().min(1).max(200),
  enabled: z.boolean().default(true),
  config: z.record(z.any()).optional(),
});

// 类型导出
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type ToolCreate = z.infer<typeof ToolCreateSchema>;
export type ToolUpdate = z.infer<typeof ToolUpdateSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type SourceInput = z.infer<typeof SourceSchema>;
```

### 3.2 API 响应格式

`src/lib/api-response.ts`：
```typescript
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
    timing?: {
      requestId: string;
      duration: number;
    };
  };
}

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  RATE_LIMITED = 'RATE_LIMITED',
  CONFLICT = 'CONFLICT',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function createSuccessResponse<T>(
  data: T,
  meta?: ApiResponse<T>['meta']
): ApiResponse<T> {
  return {
    success: true,
    data,
    meta,
  };
}

export function createErrorResponse(
  error: ApiError | Error,
  requestId?: string
): ApiResponse {
  const isApiError = error instanceof ApiError;
  
  return {
    success: false,
    error: {
      code: isApiError ? error.code : ErrorCode.INTERNAL_ERROR,
      message: error.message,
      details: isApiError ? error.details : undefined,
    },
    meta: requestId ? {
      timing: { requestId, duration: 0 }
    } : undefined,
  };
}
```

### 3.3 Edge API 路由示例

`app/api/tools/route.ts`：
```typescript
export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { tools, toolTags, toolCategories, tags, categories } from '@/src/db/schema';
import { SearchQuerySchema } from '@/src/lib/validators';
import { createSuccessResponse, createErrorResponse, ApiError, ErrorCode } from '@/src/lib/api-response';
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
        validatedQuery.error.errors
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
      conditions.push(
        sql`${tools.runtimeSupport}->>${runtime} = true`
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
      status: error instanceof ApiError ? error.statusCode : 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    });
  }
}
```

### 3.4 Node API 路由示例

`app/api/admin/tools/[id]/route.ts`：
```typescript
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/db';
import { tools } from '@/src/db/schema';
import { ToolUpdateSchema } from '@/src/lib/validators';
import { createSuccessResponse, createErrorResponse, ApiError, ErrorCode } from '@/src/lib/api-response';
import { requireAdmin } from '@/src/lib/auth';
import { eq } from 'drizzle-orm';
import { revalidatePath, revalidateTag } from 'next/cache';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestId = crypto.randomUUID();

  try {
    // 验证管理员权限
    await requireAdmin(request);

    const toolId = parseInt(params.id);
    if (isNaN(toolId)) {
      throw new ApiError(ErrorCode.VALIDATION_ERROR, '无效的工具ID', 400);
    }

    const body = await request.json();
    const validatedData = ToolUpdateSchema.safeParse(body);
    
    if (!validatedData.success) {
      throw new ApiError(
        ErrorCode.VALIDATION_ERROR,
        '数据验证失败',
        400,
        validatedData.error.errors
      );
    }

    // 检查工具是否存在
    const existingTool = await db
      .select()
      .from(tools)
      .where(eq(tools.id, toolId))
      .limit(1);

    if (existingTool.length === 0) {
      throw new ApiError(ErrorCode.NOT_FOUND, '工具不存在', 404);
    }

    // 更新工具
    const updatedTool = await db
      .update(tools)
      .set({
        ...validatedData.data,
        updatedAt: new Date(),
      })
      .where(eq(tools.id, toolId))
      .returning();

    // 清除缓存
    revalidatePath('/tools');
    revalidatePath(`/tools/${existingTool[0].slug}`);
    revalidateTag('tools');

    const response = createSuccessResponse(updatedTool[0], {
      timing: {
        requestId,
        duration: Date.now() - Date.now(),
      },
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Tool Update Error:', error);
    
    const errorResponse = createErrorResponse(
      error instanceof ApiError ? error : new ApiError(
        ErrorCode.INTERNAL_ERROR,
        '服务器内部错误',
        500
      ),
      requestId
    );

    return NextResponse.json(errorResponse, {
      status: error instanceof ApiError ? error.statusCode : 500,
    });
  }
}
```

## 阶段四：认证与授权

### 4.1 认证中间件

`src/lib/auth.ts`：
```typescript
import { NextRequest } from 'next/server';
import { ApiError, ErrorCode } from './api-response';
import { db } from '@/src/db';
import { users } from '@/src/db/schema';
import { eq } from 'drizzle-orm';

export async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, '缺少认证令牌', 401);
  }

  const token = authHeader.substring(7);
  
  // 简单的 token 验证（生产环境应使用更安全的方式）
  if (token !== process.env.ADMIN_TOKEN) {
    throw new ApiError(ErrorCode.UNAUTHORIZED, '无效的认证令牌', 401);
  }

  return { role: 'admin' };
}

export async function getUser(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // 这里应该实现真正的 JWT 验证
    // 暂时返回 null，表示未登录用户
    return null;
  } catch {
    return null;
  }
}

export function requireRole(allowedRoles: string[]) {
  return async (request: NextRequest) => {
    const user = await getUser(request);
    
    if (!user) {
      throw new ApiError(ErrorCode.UNAUTHORIZED, '需要登录', 401);
    }

    if (!allowedRoles.includes(user.role)) {
      throw new ApiError(ErrorCode.FORBIDDEN, '权限不足', 403);
    }

    return user;
  };
}
```

### 4.2 限流中间件

`src/lib/rate-limit.ts`：
```typescript
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
    const windowStart = now - config.windowMs;

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
```

## 阶段五：前端组件实现

### 5.1 基础 UI 组件

使用 shadcn/ui 初始化：
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input label textarea select badge
npx shadcn-ui@latest add dialog dropdown-menu pagination skeleton
```

### 5.2 工具卡片组件

`src/components/cards/ToolCard.tsx`：
```typescript
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github, Heart, Star } from 'lucide-react';
import type { Tool } from '@/src/db/schema';

interface ToolCardProps {
  tool: Tool & {
    tags?: Array<{ name: string; slug: string; color?: string }>;
    stats?: {
      likes: number;
      views: number;
      favorites: number;
    };
  };
  showActions?: boolean;
}

export function ToolCard({ tool, showActions = true }: ToolCardProps) {
  return (
    <Card className="group hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {tool.logoUrl && (
              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={tool.logoUrl}
                  alt={`${tool.name} logo`}
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div>
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                <Link href={`/tools/${tool.slug}`}>
                  {tool.name}
                </Link>
              </CardTitle>
              {tool.author && (
                <p className="text-sm text-gray-600">by {tool.author}</p>
              )}
            </div>
          </div>
          
          {tool.runtimeSupport && (
            <div className="flex space-x-1">
              {tool.runtimeSupport.browser && (
                <Badge variant="secondary">Browser</Badge>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 主要内容 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 安装说明 */}
            {tool.installCmd && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Download className="w-5 h-5 mr-2" />
                    安装
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                    {tool.installCmd}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 使用示例 */}
            <Card>
              <CardHeader>
                <CardTitle>使用示例</CardTitle>
                <CardDescription>
                  以下是如何在你的项目中使用 {tool.name} 的基本示例
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm">
                  <pre>{`// 基本使用示例
import { ${tool.name.replace(/[^a-zA-Z0-9]/g, '')} } from '${tool.packageName || tool.name}';

// 初始化
const tool = new ${tool.name.replace(/[^a-zA-Z0-9]/g, '')}();

// 使用
await tool.execute();`}</pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 侧边栏信息 */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>工具信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tool.version && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">版本</span>
                    <Badge variant="outline">{tool.version}</Badge>
                  </div>
                )}
                
                {tool.license && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <License className="w-4 h-4 mr-1" />
                      许可证
                    </span>
                    <span className="text-sm">{tool.license}</span>
                  </div>
                )}

                {tool.packageName && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 flex items-center">
                      <Package className="w-4 h-4 mr-1" />
                      包名
                    </span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {tool.packageName}
                    </code>
                  </div>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    发布时间
                  </span>
                  <span className="text-sm">
                    {new Date(tool.createdAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">最后更新</span>
                  <span className="text-sm">
                    {new Date(tool.updatedAt).toLocaleDateString('zh-CN')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* 相关工具推荐 */}
            <Card>
              <CardHeader>
                <CardTitle>相关工具</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  即将推出相关工具推荐功能
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

async function getToolBySlug(slug: string) {
  const result = await db
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

  if (result.length === 0) {
    return null;
  }

  const tool = result[0];

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

  return {
    ...tool,
    tags: toolTagsResult,
    categories: toolCategoriesResult,
  };
}

export async function generateMetadata({ params }: ToolDetailPageProps): Promise<Metadata> {
  const tool = await getToolBySlug(params.slug);

  if (!tool) {
    return {
      title: '工具未找到 - MCPHub',
    };
  }

  return {
    title: `${tool.name} - MCPHub`,
    description: tool.description || `了解更多关于 ${tool.name} 的信息`,
    openGraph: {
      title: tool.name,
      description: tool.description || `了解更多关于 ${tool.name} 的信息`,
      images: tool.logoUrl ? [tool.logoUrl] : [],
    },
  };
}
```

## 阶段七：抓取与 LLM 模块

### 7.1 GitHub 抓取器

`src/lib/crawl/fetchers/github.ts`：
```typescript
import { Octokit } from '@octokit/rest';

interface GitHubFetcher {
  searchRepositories(query: string, options?: SearchOptions): Promise<Repository[]>;
  getRepository(owner: string, repo: string): Promise<Repository | null>;
  getReadme(owner: string, repo: string): Promise<string | null>;
}

interface SearchOptions {
  minStars?: number;
  language?: string;
  sort?: 'stars' | 'updated' | 'created';
  order?: 'asc' | 'desc';
  perPage?: number;
}

interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  htmlUrl: string;
  cloneUrl: string;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  license: {
    key: string;
    name: string;
  } | null;
  topics: string[];
  createdAt: string;
  updatedAt: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
}

export class GitHubFetcher implements GitHubFetcher {
  private octokit: Octokit;

  constructor(token?: string) {
    this.octokit = new Octokit({
      auth: token || process.env.GITHUB_TOKEN,
    });
  }

  async searchRepositories(query: string, options: SearchOptions = {}): Promise<Repository[]> {
    const {
      minStars = 1,
      language,
      sort = 'updated',
      order = 'desc',
      perPage = 30
    } = options;

    let searchQuery = `${query} in:name,description,readme`;
    
    if (minStars > 0) {
      searchQuery += ` stars:>=${minStars}`;
    }
    
    if (language) {
      searchQuery += ` language:${language}`;
    }

    try {
      const response = await this.octokit.rest.search.repos({
        q: searchQuery,
        sort,
        order,
        per_page: perPage,
      });

      return response.data.items.map(this.transformRepository);
    } catch (error) {
      console.error('GitHub search error:', error);
      throw new Error(`GitHub 搜索失败: ${error.message}`);
    }
  }

  async getRepository(owner: string, repo: string): Promise<Repository | null> {
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      return this.transformRepository(response.data);
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw new Error(`获取仓库信息失败: ${error.message}`);
    }
  }

  async getReadme(owner: string, repo: string): Promise<string | null> {
    try {
      const response = await this.octokit.rest.repos.getReadme({
        owner,
        repo,
      });

      if (response.data.encoding === 'base64') {
        return Buffer.from(response.data.content, 'base64').toString('utf-8');
      }

      return response.data.content;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      console.warn(`获取 README 失败 ${owner}/${repo}:`, error.message);
      return null;
    }
  }

  private transformRepository(repo: any): Repository {
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      htmlUrl: repo.html_url,
      cloneUrl: repo.clone_url,
      language: repo.language,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      license: repo.license ? {
        key: repo.license.key,
        name: repo.license.name,
      } : null,
      topics: repo.topics || [],
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      owner: {
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
      },
    };
  }
}
```

### 7.2 NPM 抓取器

`src/lib/crawl/fetchers/npm.ts`：
```typescript
interface NPMPackage {
  name: string;
  version: string;
  description: string;
  keywords: string[];
  author: {
    name: string;
    email?: string;
  } | string;
  license: string;
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
  readme: string;
  maintainers: Array<{
    name: string;
    email: string;
  }>;
  time: {
    created: string;
    modified: string;
    [version: string]: string;
  };
  downloads?: {
    weekly: number;
    monthly: number;
  };
}

export class NPMFetcher {
  private baseUrl = 'https://registry.npmjs.org';
  private searchUrl = 'https://api.npms.io/v2';

  async searchPackages(query: string, options: {
    size?: number;
    from?: number;
    minDownloads?: number;
  } = {}): Promise<NPMPackage[]> {
    const { size = 20, from = 0, minDownloads = 100 } = options;

    try {
      const searchParams = new URLSearchParams({
        q: query,
        size: size.toString(),
        from: from.toString(),
      });

      const response = await fetch(`${this.searchUrl}/search?${searchParams}`);
      
      if (!response.ok) {
        throw new Error(`NPM 搜索失败: ${response.statusText}`);
      }

      const data = await response.json();
      const packages: NPMPackage[] = [];

      for (const result of data.results) {
        const packageData = await this.getPackage(result.package.name);
        if (packageData && this.isRelevantPackage(packageData, minDownloads)) {
          packages.push(packageData);
        }
      }

      return packages;
    } catch (error) {
      console.error('NPM search error:', error);
      throw new Error(`NPM 搜索失败: ${error.message}`);
    }
  }

  async getPackage(packageName: string): Promise<NPMPackage | null> {
    try {
      const response = await fetch(`${this.baseUrl}/${encodeURIComponent(packageName)}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`获取包信息失败: ${response.statusText}`);
      }

      const data = await response.json();
      const latestVersion = data['dist-tags'].latest;
      const versionData = data.versions[latestVersion];

      // 获取下载统计
      const downloads = await this.getDownloadStats(packageName);

      return {
        name: data.name,
        version: latestVersion,
        description: versionData.description || '',
        keywords: versionData.keywords || [],
        author: versionData.author || '',
        license: versionData.license || '',
        homepage: versionData.homepage,
        repository: versionData.repository,
        readme: data.readme || '',
        maintainers: data.maintainers || [],
        time: data.time,
        downloads,
      };
    } catch (error) {
      console.error(`获取包 ${packageName} 失败:`, error);
      return null;
    }
  }

  private async getDownloadStats(packageName: string): Promise<{ weekly: number; monthly: number } | undefined> {
    try {
      const [weeklyResponse, monthlyResponse] = await Promise.all([
        fetch(`https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`),
        fetch(`https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(packageName)}`)
      ]);

      const weekly = weeklyResponse.ok ? (await weeklyResponse.json()).downloads : 0;
      const monthly = monthlyResponse.ok ? (await monthlyResponse.json()).downloads : 0;

      return { weekly, monthly };
    } catch (error) {
      console.warn(`获取下载统计失败 ${packageName}:`, error);
      return undefined;
    }
  }

  private isRelevantPackage(pkg: NPMPackage, minDownloads: number): boolean {
    // 检查是否与 MCP 相关
    const mcpKeywords = ['mcp', 'model-context-protocol', 'context-protocol'];
    const hasRelevantKeywords = pkg.keywords.some(keyword => 
      mcpKeywords.some(mcpKeyword => keyword.toLowerCase().includes(mcpKeyword))
    );

    const hasRelevantDescription = mcpKeywords.some(keyword =>
      pkg.description.toLowerCase().includes(keyword)
    );

    const hasRelevantName = mcpKeywords.some(keyword =>
      pkg.name.toLowerCase().includes(keyword)
    );

    const isRelevant = hasRelevantKeywords || hasRelevantDescription || hasRelevantName;

    // 检查下载量
    const meetsDownloadThreshold = !pkg.downloads || 
      pkg.downloads.weekly >= minDownloads || 
      pkg.downloads.monthly >= minDownloads * 4;

    return isRelevant && meetsDownloadThreshold;
  }
}
```

### 7.3 LLM 处理模块

`src/lib/llm/client.ts`：
```typescript
interface LLMProvider {
  name: string;
  generateContent(prompt: string, options?: GenerateOptions): Promise<string>;
}

interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export class OpenAIProvider implements LLMProvider {
  name = 'openai';
  private apiKey: string;
  private baseUrl = 'https://api.openai.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string, options: GenerateOptions = {}): Promise<string> {
    const {
      maxTokens = 1000,
      temperature = 0.3,
      model = 'gpt-3.5-turbo'
    } = options;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API 错误: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('OpenAI generation error:', error);
      throw new Error(`内容生成失败: ${error.message}`);
    }
  }
}

export class LLMClient {
  private provider: LLMProvider;

  constructor(provider: LLMProvider) {
    this.provider = provider;
  }

  async processToolData(rawData: {
    title: string;
    description: string;
    readme: string;
    metadata: any;
  }): Promise<{
    summary: string;
    tags: string[];
    category: string;
    runtimeSupport: {
      node?: boolean;
      edge?: boolean;
      browser?: boolean;
    };
    risks?: string[];
  }> {
    const prompt = this.buildPrompt(rawData);
    
    try {
      const response = await this.provider.generateContent(prompt, {
        maxTokens: 800,
        temperature: 0.2,
      });

      return this.parseResponse(response);
    } catch (error) {
      console.error('LLM processing error:', error);
      throw new Error(`LLM 处理失败: ${error.message}`);
    }
  }

  private buildPrompt(data: {
    title: string;
    description: string;
    readme: string;
    metadata: any;
  }): string {
    return `请分析以下 MCP (Model Context Protocol) 工具的信息，并以 JSON 格式返回结构化数据：

标题: ${data.title}
描述: ${data.description}
README: ${data.readme.substring(0, 2000)}...
元数据: ${JSON.stringify(data.metadata, null, 2)}

请返回以下格式的 JSON：
{
  "summary": "工具的简洁摘要（不超过300字）",
  "tags": ["相关标签数组，最多10个"],
  "category": "主要分类（从以下选择：AI & Machine Learning, Development Tools, Data Processing, Web Scraping, API Integration）",
  "runtimeSupport": {
    "node": true/false,
    "edge": true/false,
    "browser": true/false
  },
  "risks": ["潜在风险或注意事项，可选"]
}

要求：
1. 摘要要准确反映工具的核心功能
2. 标签要具体且有用，避免过于宽泛
3. 根据代码和文档判断运行时支持
4. 如果发现安全风险或使用限制，请在 risks 中说明
5. 只返回 JSON，不要其他文字`;
  }

  private parseResponse(response: string): any {
    try {
      // 提取 JSON 部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('响应中未找到有效的 JSON');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // 验证必需字段
      if (!parsed.summary || !parsed.tags || !parsed.category) {
        throw new Error('响应缺少必需字段');
      }

      // 限制字段长度
      parsed.summary = parsed.summary.substring(0, 300);
      parsed.tags = parsed.tags.slice(0, 10);
      
      return parsed;
    } catch (error) {
      console.error('解析 LLM 响应失败:', error);
      throw new Error(`响应解析失败: ${error.message}`);
    }
  }
}
```

## 总结

这份实施指南提供了 MCPHub 系统的详细实现步骤，包括：

1. **项目初始化**：脚手架搭建、依赖安装、环境配置
2. **数据层**：完整的数据库 Schema、连接配置、迁移脚本
3. **API 层**：标准化的 API 设计、验证器、错误处理
4. **认证授权**：管理员认证、权限控制、限流机制
5. **前端组件**：可复用的 UI 组件、页面实现
6. **抓取模块**：GitHub 和 NPM 数据源抓取
7. **LLM 集成**：智能内容处理和结构化

每个模块都提供了完整的代码示例和最佳实践，确保开发团队能够高效实施这个企业级的 MCP 工具导航平台。Support.node && (
                <Badge variant="secondary" className="text-xs">Node</Badge>
              )}
              {tool.runtimeSupport.edge && (
                <Badge variant="secondary" className="text-xs">Edge</Badge>
              )}
              {tool.runtimeSupport.browser && (
                <Badge variant="secondary" className="text-xs">Browser</Badge>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {tool.description && (
          <CardDescription className="line-clamp-3">
            {tool.description}
          </CardDescription>
        )}

        {tool.tags && tool.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {tool.tags.slice(0, 3).map((tag) => (
              <Badge
                key={tag.slug}
                variant="outline"
                className="text-xs"
                style={{ borderColor: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
            {tool.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tool.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {showActions && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              {tool.stats && (
                <>
                  <div className="flex items-center space-x-1">
                    <Heart className="w-4 h-4" />
                    <span>{tool.stats.likes}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4" />
                    <span>{tool.stats.favorites}</span>
                  </div>
                </>
              )}
            </div>

            <div className="flex space-x-2">
              {tool.repoUrl && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={tool.repoUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4" />
                  </Link>
                </Button>
              )}
              {tool.homepageUrl && (
                <Button size="sm" variant="outline" asChild>
                  <Link href={tool.homepageUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### 5.3 搜索和筛选组件

`src/components/filters/ToolFilters.tsx`：
```typescript
'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, X, Filter } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

interface ToolFiltersProps {
  categories: Array<{ slug: string; name: string }>;
  tags: Array<{ slug: string; name: string }>;
}

export function ToolFilters({ categories, tags }: ToolFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  
  const updateURL = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    // 重置页码
    params.delete('page');
    
    router.push(`/tools?${params.toString()}`);
  }, [router, searchParams]);

  const debouncedSearch = useDebouncedCallback((query: string) => {
    updateURL({ q: query });
  }, 300);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    debouncedSearch(value);
  };

  const clearFilters = () => {
    setSearchQuery('');
    router.push('/tools');
  };

  const activeFilters = [
    searchParams.get('category'),
    searchParams.get('tag'),
    searchParams.get('runtime'),
  ].filter(Boolean);

  return (
    <div className="space-y-4">
      {/* 搜索框 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="搜索 MCP 工具..."
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* 筛选器 */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={searchParams.get('category') || ''}
          onValueChange={(value) => updateURL({ category: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.slug} value={category.slug}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('tag') || ''}
          onValueChange={(value) => updateURL({ tag: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择标签" />
          </SelectTrigger>
          <SelectContent>
            {tags.map((tag) => (
              <SelectItem key={tag.slug} value={tag.slug}>
                {tag.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('runtime') || ''}
          onValueChange={(value) => updateURL({ runtime: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="运行时环境" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="node">Node.js</SelectItem>
            <SelectItem value="edge">Edge Runtime</SelectItem>
            <SelectItem value="browser">Browser</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get('sort') || 'latest'}
          onValueChange={(value) => updateURL({ sort: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">最新发布</SelectItem>
            <SelectItem value="popular">最受欢迎</SelectItem>
            <SelectItem value="name">名称排序</SelectItem>
            <SelectItem value="updated">最近更新</SelectItem>
          </SelectContent>
        </Select>

        {activeFilters.length > 0 && (
          <Button variant="outline" onClick={clearFilters} size="sm">
            <X className="w-4 h-4 mr-1" />
            清除筛选
          </Button>
        )}
      </div>

      {/* 活跃筛选器显示 */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {searchParams.get('category') && (
            <Badge variant="secondary" className="flex items-center gap-1">
              分类: {categories.find(c => c.slug === searchParams.get('category'))?.name}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateURL({ category: null })}
              />
            </Badge>
          )}
          {searchParams.get('tag') && (
            <Badge variant="secondary" className="flex items-center gap-1">
              标签: {tags.find(t => t.slug === searchParams.get('tag'))?.name}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateURL({ tag: null })}
              />
            </Badge>
          )}
          {searchParams.get('runtime') && (
            <Badge variant="secondary" className="flex items-center gap-1">
              运行时: {searchParams.get('runtime')}
              <X 
                className="w-3 h-3 cursor-pointer" 
                onClick={() => updateURL({ runtime: null })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
```

## 阶段六：页面实现

### 6.1 工具列表页

`app/tools/page.tsx`：
```typescript
import { Suspense } from 'react';
import { db } from '@/src/db';
import { tools, categories, tags, toolTags, toolCategories } from '@/src/db/schema';
import { SearchQuerySchema } from '@/src/lib/validators';
import { ToolCard } from '@/src/components/cards/ToolCard';
import { ToolFilters } from '@/src/components/filters/ToolFilters';
import { Pagination } from '@/src/components/ui/pagination';
import { Skeleton } from '@/src/components/ui/skeleton';
import { eq, desc, and, or, ilike, sql } from 'drizzle-orm';

interface ToolsPageProps {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function ToolsPage({ searchParams }: ToolsPageProps) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">MCP 工具库</h1>
        <p className="text-gray-600">
          发现和探索 Model Context Protocol 生态系统中的优秀工具
        </p>
      </div>

      <Suspense fallback={<FiltersSkeleton />}>
        <FiltersSection />
      </Suspense>

      <Suspense fallback={<ToolsGridSkeleton />}>
        <ToolsGrid searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function FiltersSection() {
  const [categoriesData, tagsData] = await Promise.all([
    db.select({ slug: categories.slug, name: categories.name }).from(categories),
    db.select({ slug: tags.slug, name: tags.name }).from(tags),
  ]);

  return <ToolFilters categories={categoriesData} tags={tagsData} />;
}

async function ToolsGrid({ searchParams }: { searchParams: Record<string, any> }) {
  const validatedQuery = SearchQuerySchema.safeParse(searchParams);
  
  if (!validatedQuery.success) {
    return <div>查询参数无效</div>;
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
    conditions.push(
      sql`${tools.runtimeSupport}->>${runtime} = true`
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

  const [toolsResult, totalResult] = await Promise.all([
    db
      .select({
        id: tools.id,
        slug: tools.slug,
        name: tools.name,
        description: tools.description,
        author: tools.author,
        logoUrl: tools.logoUrl,
        repoUrl: tools.repoUrl,
        homepageUrl: tools.homepageUrl,
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

  if (toolsResult.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">没有找到匹配的工具</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {toolsResult.map((tool) => (
          <ToolCard key={tool.id} tool={tool} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            baseUrl="/tools"
            searchParams={searchParams}
          />
        </div>
      )}
    </div>
  );
}

function FiltersSkeleton() {
  return (
    <div className="space-y-4 mb-8">
      <Skeleton className="h-10 w-full" />
      <div className="flex gap-3">
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>
    </div>
  );
}

function ToolsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="border rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const metadata = {
  title: 'MCP 工具库 - MCPHub',
  description: '发现和探索 Model Context Protocol 生态系统中的优秀工具',
};
```

### 6.2 工具详情页

`app/tools/[slug]/page.tsx`：
```typescript
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { db } from '@/src/db';
import { tools, toolTags, toolCategories, tags, categories } from '@/src/db/schema';
import { Button } from '@/src/components/ui/button';
import { Badge } from '@/src/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card';
import { Separator } from '@/src/components/ui/separator';
import { ExternalLink, Github, Download, Calendar, User, License, Package } from 'lucide-react';
import { eq } from 'drizzle-orm';

interface ToolDetailPageProps {
  params: { slug: string };
}

export default async function ToolDetailPage({ params }: ToolDetailPageProps) {
  const tool = await getToolBySlug(params.slug);

  if (!tool) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 工具头部信息 */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center space-x-4">
              {tool.logoUrl && (
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                  <Image
                    src={tool.logoUrl}
                    alt={`${tool.name} logo`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-3xl font-bold mb-2">{tool.name}</h1>
                {tool.author && (
                  <p className="text-gray-600 flex items-center">
                    <User className="w-4 h-4 mr-1" />
                    {tool.author}
                  </p>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              {tool.repoUrl && (
                <Button asChild>
                  <Link href={tool.repoUrl} target="_blank" rel="noopener noreferrer">
                    <Github className="w-4 h-4 mr-2" />
                    GitHub
                  </Link>
                </Button>
              )}
              {tool.homepageUrl && (
                <Button variant="outline" asChild>
                  <Link href={tool.homepageUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    网站
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {tool.description && (
            <p className="text-lg text-gray-700 mb-6">{tool.description}</p>
          )}

          {/* 标签和分类 */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tool.categories?.map((category) => (
              <Badge key={category.slug} variant="default">
                {category.name}
              </Badge>
            ))}
            {tool.tags?.map((tag) => (
              <Badge 
                key={tag.slug} 
                variant="outline"
                style={{ borderColor: tag.color }}
              >
                {tag.name}
              </Badge>
            ))}
          </div>

          {/* 运行时支持 */}
          {tool.runtimeSupport && (
            <div className="flex space-x-2 mb-6">
              <span className="text-sm font-medium text-gray-600">支持环境:</span>
              {tool.runtimeSupport.node && (
                <Badge variant="secondary">Node.js</Badge>
              )}
              {tool.runtimeSupport.edge && (
                <Badge variant="secondary">Edge Runtime</Badge>
              )}
              {tool.runtime