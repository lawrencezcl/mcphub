# MCPHub 系统设计（最小颗粒度）

本系统设计基于 `design.md` 的总体方案，进一步细化到可落地实现的最小颗粒度，涵盖组件划分、目录结构、数据模型（Drizzle/Neon）、接口契约（Zod）、运行时选择（Edge/Node）、抓取与 LLM 聚合流水线、缓存与 SEO、认证与限流、安全与合规，以及部署与观测方案。

## 总体架构
- 前端交付：Next.js 14（App Router），主要页面 SSR/SSG + ISR；UI 使用 Tailwind + shadcn/ui。
- 后端运行时：
  - Edge Runtime（高频读）：公共页面与只读 API，走 Vercel Edge 网络与 CDN，降低 TTFB。
  - Node.js Runtime（写/重任务）：爬虫抓取、LLM 处理、管理员操作 API，便于使用丰富依赖与更稳定的网络特性。
- 数据层：Neon PostgreSQL（Serverless），HTTP 驱动 `@neondatabase/serverless` + Drizzle ORM。
- 缓存层：Vercel Edge Cache（`Cache-Control`）、ISR（页面级）、SWR（客户端）、可选 Upstash Redis 作为限流/任务状态缓存。
- 定时任务：Vercel Cron 触发 `/api/cron/crawl`，控制并发与预算，定期聚合数据。

## 模块设计（详细）

### 前端模块（App Router）
- 页面职责
  - `/` 首页：展示精选与热门工具；接入 `GET /api/tools?sort=popular&page=1`；骨架屏；Edge SSR。
  - `/tools` 列表：支持 `q/tag/category/sort/order/page/pageSize`；URL 作为单一状态源；Edge SSR + ISR；分页组件。
  - `/tools/[slug]` 详情：展示结构化元数据、安装命令、示例代码段、分享卡片；Edge SSR + ISR。
  - `/categories/[slug]`、`/tags/[slug]`：复用列表逻辑；预取筛选数据；Edge SSR。
  - `/submit` 提交页：表单校验（Zod），POST 提交到 Node 路由；成功后 toast 并引导返回列表。
  - `/admin/*` 管理后台：Node SSR；鉴权保护；包含源管理、抓取任务查看、LLM 入库审核、工具编辑。
- 组件划分
  - `NavBar`、`Footer`、`SearchBar`、`ToolCard`、`ToolFilters`、`Pagination`、`Badge`、`Skeleton`、`Breadcrumbs`。
  - `AdminTable`（表格与筛选）、`DiffViewer`（原始 vs LLM 输出差异）、`SourceForm`、`IngestReview`。
- 状态管理
  - 以 URL 查询参数为主，通过 React Server Components 读取参数；客户端轻量状态（SWR 用于局部刷新）。
  - 对分页与筛选采用 `useRouter().push` 更新 URL；服务端重新渲染避免 CSR 负担。
- 性能与可访问性
  - 优先 SSR 与边缘渲染；图片使用 `next/image`；图标按需导入。
  - 语义标签与 ARIA 属性；键盘导航；色彩对比度校验。
  - 代码分割：管理后台单独 chunk；详情页示例代码块懒加载。
- 错误边界
  - 页面级 `error.tsx` 捕获渲染错误；展示重试按钮与反馈入口。
  - API 错误转为用户友好提示，避免泄漏内部信息。

### API 模块（Edge/Node 路由）
- Edge 路由（只读）
  - 输入：`PaginationQuery`（Zod）；输出：`{ items: Tool[], page, pageSize, total? }`。
  - 缓存：`Cache-Control: public, s-maxage=60, stale-while-revalidate=300`。
  - 错误码：400（参数错误）、404（不存在）、500（服务器错误）。
- Node 路由（写/重任务）
  - 认证：`ADMIN_TOKEN` 或 OAuth；返回 401/403。
  - 幂等：对重复提交（依据 `slug`/指纹）返回 200 并附上现有记录。
  - 限流：提交与管理操作 1 分钟内不超过 N 次；超过返回 429。
- 契约示例
  - `POST /api/submissions`
    - Body：`SubmissionInput`
    - 响应：`{ id, status: 'pending' }` 或错误码。
  - `POST /api/admin/crawl/run`
    - Body：`{ sourceId?: number }`
    - 响应：`{ jobId, status: 'queued' }`。
  - `POST /api/admin/llm/process`
    - Body：`{ resultId: number }`
    - 响应：`{ llmJobId, status: 'queued'|'completed', output? }`。

### 数据模块（Drizzle/Neon）
- 关系与约束
  - `tool_tags`, `tool_categories` 外键级联删除；保证数据一致性。
  - `crawl_results.dedupe_hash` 唯一约束避免重复插入；如冲突则合并策略。
  - `ingests.tool_id` 可空，表示待审核；批准后设置引用并更新工具状态。
- 迁移策略
  - 使用 `drizzle-kit` 生成 SQL；在 CI/CD 或部署前执行；版本化管理。
  - 对扩展（`pg_trgm`, `vector`）在迁移中声明 `CREATE EXTENSION IF NOT EXISTS`。
- 数据一致性
  - 管理员编辑工具时，更新 `updated_at`；视图计数按日聚合入 `views`。
  - 审核批准后触发重建向量嵌入（可选）。

### 抓取模块（Crawler）
- 源管理（`sources`）
  - 类型：`github_topic`, `npm_query`, `awesome_list`, `website`。
  - 字段：`identifier`（topic 名/查询词/URL）；`enabled` 控制是否参与定时任务。
- 任务编排（`crawl_jobs`）
  - 流程：`queued -> running -> completed|failed`；记录 `stats`（数量/耗时/错误）。
  - 并发：每次 Cron 限并发 3~5（依 Vercel 路由执行时间）；对大源分页分批执行。
- 抓取实现
  - GitHub：优先使用 API（搜索 repos with topics/keywords）；读取 `README` via contents API；尊重速率限制与 ETag。
  - NPM：使用 npm registry 搜索端点与 package metadata；读取 readme 字段；过滤非 MCP。
  - Website：仅 allowlist 域名；使用 `undici` + `cheerio` 解析；遵守 `robots.txt`。
- 解析器（`parser.ts`）
  - 识别安装命令：匹配 `npm i`, `pnpm add`, `yarn add`、`npx` 等模式。
  - 兼容性信号：README 中提到 `Edge Runtime`、Next.js App Router；源码包含 `export const runtime = 'edge'`；package 元数据标记。
  - 许可证：README 徽章或 `package.json.license`；仓库 `LICENSE` 文件。
  - 输出：规范化对象 `{ name, description, repoUrl, homepageUrl, packageName, installCmd, runtimeSupport, author, license, logoUrl, version }`。
- 去重（`dedupe.ts`）
  - 哈希输入：`canonicalUrl || repoUrl || homepageUrl` + `packageName`；
  - 算法：`sha256`；写入 `crawl_results.dedupe_hash`；
  - 冲突：若已存在，比较更新鲜度（内容变化/时间），决定是否覆盖或追加版本信息。
- 失败处理
  - 分类错误码：网络、解析、速率限制、源格式变更；
  - 重试策略：指数退避；超过阈值标记 `failed` 并报警。

### LLM 模块
- 客户端与 Provider
  - 支持多 Provider；以 `AI_PROVIDER_API_KEY` 切换；超时与重试控制；
  - 输出结构化 JSON，避免自由文本；长度裁剪，字段校验。
- 提示词与 Schema（示例）
  - 输入：`raw_title`, `raw_description`, `raw_readme`, `raw_metadata`。
  - 目标：生成 `summary`（<=300 汉字）、`tags[]`（<=10）、`runtimeSupport{node,edge,browser}`、`category`、`risks`（可选）。
  - 校验：Zod 校验字段与长度；拒绝无效输出并记录失败原因。
- 成本控制
  - 以 `dedupe_hash` 作为缓存键；若内容相同不重复调用；批处理控制并发（如 2~3）。
  - 优先处理热门或高质量来源；低质量源降级为人工审核。
- 安全
  - 屏蔽危险链接与脚本；对摘要进行 XSS 过滤；
  - 仅保存必要信息；对 Provider 错误进行掩码处理。

### 审核与入库模块
- 审核 UI
  - 列表：`ingests` 状态筛选；详情：原始数据与 LLM 输出对比；
  - 操作：`approve`/`reject`，填写 `reason`；批量操作（可选）。
- 入库逻辑
  - 批准：将数据写入 `tools`，设置 `status='approved'`，更新 `source_score`；
  - 触发：`revalidatePath('/tools')`、详情页与相关分类/标签页；（在 Node 路由内触发）。
  - 审计：记录管理员 ID 与操作；可查询历史。

### 搜索模块
- 关键字检索
  - SQL：`to_tsvector(simple, name || ' ' || description) @@ plainto_tsquery(q)`；
  - 排序：匹配度 + 人气（views/likes/favorites）加权；分页。
- 模糊检索
  - `pg_trgm`：`similarity(name, q) > threshold`；与全文结果合并去重。
- 语义检索（可选）
  - 嵌入：从摘要生成向量写入 `embeddings`；
  - 查询：按余弦距离排序；与全文结果融合（学习权重）。

### 缓存模块
- 边缘缓存
  - API 响应设置 `s-maxage` 与 `stale-while-revalidate`；
  - 页面 ISR：列表与详情设置 `revalidate`（120~300s）。
- 失效与再生成
  - 管理员发布/编辑、审核批准后，主动触发相关路径与标签失效；
  - 列表、详情、分类/标签页统一纳入 `tools` 标签管理（Next `revalidateTag`）。

### 认证与权限模块
- 管理员认证
  - 首期：`ADMIN_TOKEN`（Bearer）；中间件校验；
  - 后续：NextAuth + GitHub OAuth；角色：`admin`、`editor`、`viewer`。
- 权限控制
  - 仅管理员访问 `/admin/*` 与相关 API；公共写操作需登录或严格限流。

### 限流模块
- 实现
  - Upstash Redis（优先）或内存令牌桶（Edge 生命周期）；
  - 键规则：`route:ip` 或 `userId`；配额按路由定义（提交/点赞更严格）。
- 响应
  - 超限返回 429 与 `Retry-After`；记录日志用于分析。

### 日志与观测模块
- 结构化日志
  - 字段：`timestamp`, `route`, `runtime`, `requestId`, `userId?`, `status`, `latency`, `error?`；
  - 级别：info/warn/error；Node 路由更详细。
- 指标
  - API 成功率、P95 延迟；抓取与 LLM 成功率与耗时；
  - 页面 Web Vitals（FCP/LCP/CLS/TTFB）；Vercel Analytics 集成。
- 报警
  - 抓取失败率阈值、LLM 超时、数据库错误；邮件或 Slack 通知。

### SEO/OG 模块
- SEO
  - `metadata` 完整：title/description/openGraph/twitter；站点地图；robots。
  - 面包屑与语义 HTML；canonical 链接。
- 动态 OG 图
  - `/og/[slug]`：Edge 路由生成（satori/canvas）；包含名称、标签、logo；
  - 缓存与失效：与详情页一致。

### 部署与配置模块
- Vercel 项目
  - 环境：Production/Preview；配置环境变量（`DATABASE_URL`, `ADMIN_TOKEN`, `AI_PROVIDER_API_KEY`）。
  - Cron：配置每日/每周任务；预览环境可关闭或降频。
- 构建
  - Next 自动构建；确保 Node 路由未引入与 Edge 不兼容依赖；
  - 预览链接供审核与测试。

### 测试与质量保障模块
- 单元测试
  - 解析器与去重：输入样本与预期输出；
  - 验证器（Zod）：边界值与非法输入。
- 集成测试
  - API 路由：只读与写操作；模拟数据库（测试库或事务回滚）。
- 端到端测试
  - 页面流程：搜索、筛选、详情、提交；
  - 管理后台：审核入库流程；
- 任务测试
  - Cron 路由：在预览环境以小样本执行；防止长时间阻塞。

### 性能预算与优化细则
- TTFB（Edge）：< 250ms；API P95：< 500ms；Node 写操作 < 800ms。
- 资源：图片懒加载；组件按需加载；
- SQL：使用索引；分页避免 `OFFSET` 大量；可用 keyset 分页。

### 风险与回滚策略
- 功能开关（feature flags）：对自动聚合与语义检索可配置开关。
- 蓝绿发布：通过 Preview 验证后再 Promote；如故障回滚到上一个稳定版本。
- 手动兜底：自动抓取故障时，允许手工提交与人工维护热门条目。

## 目录结构（建议）
```
mcphub/
  app/
    layout.tsx
    page.tsx                  # 首页（Edge）
    tools/
      page.tsx                # 列表页（Edge）
      [slug]/page.tsx         # 详情页（Edge）
    categories/[slug]/page.tsx
    tags/[slug]/page.tsx
    submit/page.tsx           # 提交页（Node 或 Edge）
    admin/                    # 管理后台（Node）
      page.tsx                # 权限保护
      sources/page.tsx
      crawl/page.tsx
      ingests/page.tsx
    og/[slug]/route.ts        # 动态 OG 图（Edge）
    api/
      tools/route.ts          # GET 列表（Edge）
      tools/[slug]/route.ts   # GET 详情（Edge）
      search/route.ts         # GET 搜索（Edge）
      categories/route.ts     # GET（Edge）
      tags/route.ts           # GET（Edge）
      submissions/route.ts    # POST 提交（Node）
      admin/
        tools/[id]/route.ts   # PATCH 编辑（Node）
        tools/approve/route.ts
        tools/reject/route.ts
        sources/route.ts      # GET/POST 源（Node）
        crawl/run/route.ts    # 手动触发（Node）
        crawl/jobs/route.ts   # GET 任务（Node）
        llm/process/route.ts  # POST LLM（Node）
      cron/
        crawl/route.ts        # 定时抓取入口（Node）
  src/
    db/
      schema.ts               # Drizzle 表定义
      index.ts                # Drizzle 连接（neon）
      migrations/             # drizzle-kit 迁移输出
    lib/
      auth.ts                 # 管理员认证（token/OAuth）
      rate-limit.ts           # 限流器（Upstash/自研）
      cache.ts                # Revalidate 工具
      validators.ts           # Zod Schema
      search.ts               # SQL 全文/向量检索封装
      crawl/
        sources.ts            # 源配置与发现策略
        fetchers/
          github.ts           # GitHub 抓取
          npm.ts              # NPM 抓取
          website.ts          # 通用站点抓取
        parser.ts             # README/package.json 解析
        dedupe.ts             # 去重指纹
      llm/
        client.ts             # Provider 客户端
        prompts.ts            # 提示词模板
        process.ts            # LLM 处理逻辑
    components/
      ui/...                  # 组件库封装
      cards/ToolCard.tsx      # 工具卡片
      filters/ToolFilters.tsx # 列表筛选
    styles/
      globals.css
  .env.local                  # 本地环境变量（不提交）
  drizzle.config.ts           # 迁移配置
  package.json
  README.md
```

## 环境变量
- `DATABASE_URL`：Neon Postgres 连接字符串（已提供，务必放入环境变量）。
- `ADMIN_TOKEN`：管理员 Bearer Token（首期简化）。
- `NEXT_PUBLIC_SITE_URL`：站点 URL，用于 OG/SEO。
- `GITHUB_TOKEN`（可选）：GitHub API 提升速率与权限。
- `NPM_TOKEN`（可选）：NPM API/下载统计。
- `AI_PROVIDER_API_KEY`：LLM 提供商密钥（如 OpenAI/Anthropic 等）。
- `UPSTASH_REDIS_URL`/`UPSTASH_REDIS_TOKEN`（可选）：限流与任务缓存。

## 数据模型（Drizzle ORM / Neon）
在 `src/db/schema.ts` 中定义。以下为核心表的最小颗粒定义范例（TypeScript）：

```ts
import { pgTable, serial, bigint, text, timestamp, jsonb, integer, boolean, primaryKey } from 'drizzle-orm/pg-core';

export const tools = pgTable('tools', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  repoUrl: text('repo_url'),
  homepageUrl: text('homepage_url'),
  packageName: text('package_name'),
  installCmd: text('install_cmd'),
  runtimeSupport: jsonb('runtime_support'),
  author: text('author'),
  license: text('license'),
  logoUrl: text('logo_url'),
  version: text('version'),
  status: text('status').default('pending'),
  sourceScore: integer('source_score').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  lastCrawledAt: timestamp('last_crawled_at', { withTimezone: true }),
});

export const categories = pgTable('categories', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const tags = pgTable('tags', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
});

export const toolTags = pgTable('tool_tags', {
  toolId: bigint('tool_id', { mode: 'number' }).notNull(),
  tagId: bigint('tag_id', { mode: 'number' }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.toolId, t.tagId] }),
}));

export const toolCategories = pgTable('tool_categories', {
  toolId: bigint('tool_id', { mode: 'number' }).notNull(),
  categoryId: bigint('category_id', { mode: 'number' }).notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.toolId, t.categoryId] }),
}));

export const submissions = pgTable('submissions', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  submitterEmail: text('submitter_email'),
  payload: jsonb('payload'),
  status: text('status').default('pending'),
  moderatorNote: text('moderator_note'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const views = pgTable('views', {
  toolId: bigint('tool_id', { mode: 'number' }).notNull(),
  date: text('date').notNull(), // 可改为 date 类型，drizzle 需封装
  count: integer('count').default(0),
}, (t) => ({
  pk: primaryKey({ columns: [t.toolId, t.date] }),
}));

export const sources = pgTable('sources', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  type: text('type').notNull(),
  identifier: text('identifier').notNull(),
  enabled: boolean('enabled').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

export const crawlJobs = pgTable('crawl_jobs', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  sourceId: bigint('source_id', { mode: 'number' }).notNull(),
  status: text('status').notNull(),
  startedAt: timestamp('started_at', { withTimezone: true }),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  stats: jsonb('stats'),
});

export const crawlResults = pgTable('crawl_results', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  jobId: bigint('job_id', { mode: 'number' }).notNull(),
  canonicalUrl: text('canonical_url'),
  rawTitle: text('raw_title'),
  rawDescription: text('raw_description'),
  rawReadme: text('raw_readme'),
  rawMetadata: jsonb('raw_metadata'),
  dedupeHash: text('dedupe_hash'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const llmJobs = pgTable('llm_jobs', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  resultId: bigint('result_id', { mode: 'number' }).notNull(),
  status: text('status').notNull(),
  model: text('model'),
  promptVersion: text('prompt_version'),
  output: jsonb('output'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
});

export const ingests = pgTable('ingests', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  toolId: bigint('tool_id', { mode: 'number' }),
  llmJobId: bigint('llm_job_id', { mode: 'number' }).notNull(),
  status: text('status').notNull(),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
```

索引与扩展（迁移脚本执行）：
- `tools(slug)`、`categories(slug)`、`tags(slug)` 唯一索引。
- 全文搜索 GIN 索引：`to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,''))`。
- `pg_trgm` 支持模糊检索；可选 `vector` 扩展用于语义索引（`embeddings`）。

## 数据库连接（Edge 兼容）
`src/db/index.ts`
```ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);
```
注意：
- `DATABASE_URL` 必须启用 `sslmode=require&channel_binding=require`。
- Edge 路由仅进行只读查询；写操作优先用 Node.js Runtime 路由。

## 接口契约（Zod）
`src/lib/validators.ts`
```ts
import { z } from 'zod';

export const PaginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.enum(['latest', 'popular']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  q: z.string().max(200).optional(),
  tag: z.string().optional(),
  category: z.string().optional(),
});

export const ToolCreateInput = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  repoUrl: z.string().url().optional(),
  homepageUrl: z.string().url().optional(),
  packageName: z.string().optional(),
  installCmd: z.string().optional(),
  runtimeSupport: z.record(z.boolean()).optional(),
  author: z.string().optional(),
  license: z.string().optional(),
  logoUrl: z.string().url().optional(),
  version: z.string().optional(),
});

export const SubmissionInput = z.object({
  submitterEmail: z.string().email().optional(),
  payload: ToolCreateInput,
});
```

## API 路由与运行时
- Edge 路由（只读）
  - `GET /api/tools`：分页/筛选/排序，返回工具列表。
  - `GET /api/tools/[slug]`：详情。
  - `GET /api/search`：全文/模糊查询（`q`）。
  - `GET /api/categories`、`GET /api/tags`。
- Node 路由（写/重任务）
  - `POST /api/submissions`：用户提交，入 `submissions`。
  - `PATCH /api/admin/tools/[id]`、`POST /api/admin/tools/approve|reject`。
  - `GET|POST /api/admin/sources`：维护数据源。
  - `POST /api/admin/crawl/run`、`GET /api/admin/crawl/jobs`。
  - `POST /api/admin/llm/process`：对指定结果进行 LLM 处理。
  - `GET /api/cron/crawl`：由 Vercel Cron 调用，批量执行抓取。

示例：`app/api/tools/route.ts`（Edge）
```ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { PaginationQuery } from '@/src/lib/validators';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = PaginationQuery.safeParse(Object.fromEntries(url.searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const { page, pageSize, q, tag, category, sort, order } = parsed.data;

  // 组装 SQL（略），示意返回：
  const data = await db.execute(/* SQL or drizzle query */);
  return new NextResponse(JSON.stringify({ page, pageSize, items: data.rows }), {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  });
}
```

示例：管理员编辑（Node）`app/api/admin/tools/[id]/route.ts`
```ts
export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { db } from '@/src/db';
import { requireAdmin } from '@/src/lib/auth';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  requireAdmin(req); // 校验 Bearer Token 或 OAuth
  const payload = await req.json();
  // 校验并更新（略）
  await db.execute(/* UPDATE ... */);
  // 触发缓存失效
  // revalidatePath('/tools'); revalidateTag('tools');
  return NextResponse.json({ ok: true });
}
```

## 抓取流水线（Node Runtime）
- 入口：`GET /api/cron/crawl`（由 Vercel Cron 触发），遍历 `sources.enabled = true` 的数据源。
- 并发/预算：限制并发（如 3~5），路由总体执行时间控制在数十秒；如需长任务，拆分到多个 job。
- 步骤：
  1) 创建 `crawl_jobs` 记录 `queued` -> `running`。
  2) 针对源类型调用对应 fetcher：
     - GitHub：用 API（优先）或合理抓取 README/metadata；过滤非 MCP 相关。
     - NPM：搜索含 MCP 关键词的包，读取 `package.json` 与 README。
     - website：限定白名单域名或明确 URL。
  3) 解析：抽取名称、安装命令、兼容性信号（如 `export const runtime = 'edge'`）、链接、截图。
  4) 去重：对 `canonical_url + packageName + repoUrl` 计算指纹（`dedupe_hash`），比对历史结果/工具。
  5) 保存 `crawl_results`；更新 `crawl_jobs.stats`。
  6) 触发或排队 `llm_jobs`。

## LLM 聚合
- 客户端：`src/llm/client.ts` 封装 Provider（OpenAI/Anthropic 等）。
- 提示词：`src/llm/prompts.ts`，输出 Schema 包含：摘要（<=300 字）、标签数组（<=10）、兼容性布尔集、推荐分类、风险提示。
- 处理：`POST /api/admin/llm/process` 接收 `crawl_result_id`，生成 `llm_jobs.output` 并落库。
- 校验：对输出字段长度、URL 安全性、内容合法性进行校验与过滤。
- 入库映射：在 `ingests` 里生成条目并标记 `pending_review`。

## 审核与发布
- 后台 UI：管理员查看 `ingests` 列表，支持 diff 原始 vs LLM 输出。
- 审核通过：写入/更新 `tools` 主表；更新 `status='approved'`；触发 `revalidate`。
- 审核拒绝：记录 `reason`；可回溯。

## 搜索设计
- 全文：`to_tsvector(simple)` + 查询 `plainto_tsquery`；名称 + 描述联合。
- 模糊：`pg_trgm` 相似度阈值（如 `similarity(name, q) > 0.3`）。
- 语义（可选）：`pgvector` 存储嵌入，余弦距离排序；按需更新。

## 缓存与 SEO
- API：`s-maxage=60` + `stale-while-revalidate=300`。
- 页面：列表/详情设置 `revalidate: 120~300s`；发布/审核后主动失效。
- SEO：站点地图、语义化 HTML、`metadata` 完整；OG 卡片由 `/og/[slug]` 动态生成。

## 认证与限流
- 管理员认证：
  - 首期：`ADMIN_TOKEN` Bearer；后续迁移 NextAuth + GitHub OAuth。
- 限流：
  - 公共写操作（提交/点赞/收藏）每 IP 每分钟 N 次；
  - 优先使用 Upstash（Edge 友好），无则按请求生命周期做轻量令牌桶（效果有限）。

## 安全与合规
- 数据库连接：强制 SSL 与 channel binding；密钥仅在环境变量。
- XSS/CSRF：对富文本进行白名单，写操作引入 CSRF Token 或仅限 Bearer 接口。
- 爬虫合规：遵守 `robots.txt`，限速与并发控制，保留来源引用；避免抓取私有或受限内容。
- LLM 安全：不上传敏感数据；输出过滤危险链接与脚本；记录最小化信息。

## 观测与运维
- 日志：结构化日志输出到 Vercel；Node 路由加详细事件与耗时记录。
- 指标：FCP/LCP/CLS/TTFB；API 成功率与 P95 延迟；抓取与 LLM 成本与失败率。
- 报警：抓取失败率超过阈值、LLM 超时、数据库错误。

## 部署流程
- 初始化仓库并接入 Vercel；配置环境变量。
- 构建与预览：每次 PR 提供 Preview；管理员路由在 Preview 环境仅限私用。
- Cron 配置：例如每日 02:00 UTC 调用 `/api/cron/crawl`。
- 数据迁移：使用 drizzle-kit 在部署前执行迁移脚本。

## 模块就绪准则（Definition of Done）
- 前端页面：通过可访问性检查（aria/对比度）、SEO 元数据完整、SSR 正常、骨架屏。
- Edge API：通过 Zod 校验、缓存头正确、错误码统一、日志记录。
- Node API：鉴权与限流生效、审计日志记录、并发控制与幂等。
- 数据层：迁移脚本执行成功、索引与扩展启用、基本查询性能达标。
- 抓取：对至少两类源（GitHub/NPM）成功抓取与解析；失败重试与统计。
- LLM：结构化输出稳定、成本与并发受控、校验与过滤生效。
- 审核：后台页面可用、批准/拒绝流程可追踪、触发缓存失效。
- 搜索：全文与模糊检索可用、分页与排序正确。
- 安全：XSS/CSRF 基本防护、敏感信息不泄露、机器人合规。

## 性能预算（首期）
- 首屏 TTFB：< 250ms（Edge）
- 列表页 LCP：< 2.5s；详情页 LCP：< 2.0s
- API P95：< 500ms（只读）；写接口 < 800ms（Node）
- 抓取任务：单次路由执行 < 10s；LLM 单次处理 < 2s（视 Provider）

## 风险与缓解
- LLM 成本与波动：批量/去重、缓存、按需处理热门条目；多 Provider 容灾。
- 抓取反爬：使用官方 API；限速与 UA；设白名单。
- 数据质量：规则校验 + 人工审核兜底；纠错入口。
- Edge 限制：复杂计算移至 Node；数据库事务量控制；避免每请求建连接。

---

附注：数据库连接字符串请以 `DATABASE_URL` 环境变量注入（Neon），例如：
`postgresql://neondb_owner:npg_hYQK4Dl9MELZ@ep-rapid-mouse-adk1ua6k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`