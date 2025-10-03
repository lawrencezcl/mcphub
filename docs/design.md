# MCPHub：MCP 工具导航网站设计方案

## 概述
- 目标：构建一个面向开发者的 MCP（Model Context Protocol）工具导航网站，聚合、检索、评测与分发 MCP 工具生态，方便开发者发现、筛选和快速集成。
- 托管：部署在 Vercel，充分利用其 Edge Runtime 与全球 CDN 分发能力。
- 数据库：使用 Neon PostgreSQL（Serverless），通过 Edge 兼容驱动在边缘节点访问数据库。
- 本文档：需求拆解、技术架构、数据模型、API 设计、页面规划、性能与安全策略、里程碑与风险评估。
 - 自动化内容来源：内置爬虫与 LLM 聚合管线，定期抓取与结构化工具信息。

## 目标与非目标
- 目标
  - 提供 MCP 工具聚合与导航：分类/标签、搜索、详情页、安装与使用说明。
  - 支持开发者提交新工具，建立审核与维护机制。
  - 具备基础的收藏、点赞与人气统计，提升社区参与度。
  - 具备良好 SEO 与分享卡片（OG Image），兼顾移动端表现。
  - 数据与接口尽量在 Edge Runtime 运行，提升首屏与交互体验。
  - 自动抓取与 LLM 聚合：从开放数据源发现 MCP 工具、解析元数据，通过 LLM 生成摘要与标签，并经人工/半自动审核后入库。
- 非目标（首期不做）
  - 完整的论坛/讨论系统，仅提供轻量评论或外链（可选）。
  - 深度 CI/CD 集成 MCP 工具测试平台。
  - 收费或分发市场，首期专注导航信息。

## 用户角色与关键场景
- 游客/开发者：浏览、搜索 MCP 工具；查看详情；复制安装命令；收藏/点赞（可选登录）。
- 提交者：提交新工具信息，等待审核；收到更新/拒绝反馈。
- 管理员：审核工具、编辑资料、维护分类与标签、下线违规工具。

## 需求拆解
- 导航与发现
  - 工具列表页：支持分类、标签、排序（最新、热度）、分页。
  - 搜索：关键词检索（名称、描述、作者、标签），高亮匹配（可选）。
  - 工具卡片：名称、简介、图标、标签、支持平台（Node/Edge/Browser）、作者、评分/点赞（可选）。
- 工具详情页
  - 结构化元数据：名称、唯一 slug、版本、仓库链接、NPM/包、安装命令、兼容性（如 Edge 兼容）、示例代码片段、文档链接、截图/OG 图。
  - 统计：浏览量、点赞、收藏。
  - 社交：分享链接、OG/Image、Twitter 卡片。
- 提交与审核
  - 提交页面：表单采集基础信息与链接、可选 JSON Schema 校验。
  - 审核后台：列表、筛选、批量通过/拒绝；变更历史与审计。
- 社区互动（可选）
  - 点赞/收藏、评论（或外链到 GitHub 讨论/Issue）。
- 性能与 SEO
  - SSR/SSG + ISR（增量静态再生成），Edge 缓存与 stale-while-revalidate。
  - 页面结构语义化、元数据完善；站点地图与 robots.txt。
- 安全与可靠性
  - 提交表单校验与速率限制；XSS/CSRF 防护；SQL 注入防护。
  - Neon 连接强制 SSL 与 channel binding；审计日志记录。

## 技术架构
- 前端
  - 框架：Next.js 14（App Router）。
  - UI：Tailwind CSS + shadcn/ui 组件库（快速构建一致化 UI）。
  - 国际化：next-intl（可选，首期中文为主，英文可选）。
  - 图标与品牌：lucide-react 或类似。
- 后端与运行时
  - Edge Runtime：大部分 API 路由与页面在 Edge 上运行，`export const runtime = 'edge'`。
  - 数据层：Neon PostgreSQL（Serverless）。驱动选择：`@neondatabase/serverless` 或 `postgres`（neon 适配）。ORM：Drizzle ORM（良好 TS 支持与 Edge 兼容）。
  - 缓存：Vercel Edge Cache（Cache-Control）、SWR（客户端）、ISR（静态页）与按路由粒度的 revalidate。
  - 搜索：Postgres 全文检索或 `pg_trgm` 模糊搜索；必要时建立物化视图与定期刷新。
 - 抓取与聚合管线
   - 爬虫服务：优先在 Node.js Runtime 路由中运行（如 `/api/cron/crawl`），便于使用 HTML 解析与更广依赖；由 Vercel Cron 触发定时任务。
   - 发现策略：GitHub Topics（如 `mcp`, `model context protocol`）、NPM 包（关键字检索）、Awesome 列表与官方生态站点。
   - 解析策略：抓取仓库 README、`package.json`、项目文档页，提取名称、简介、安装命令、兼容性信号（Edge/Node/Browser）、标签与截图链接。
   - LLM 聚合：调用外部 LLM API（通过 Vercel AI SDK 或直连 Provider），对原始文本生成规范化摘要、标签、类别与兼容性判断说明；产出受限长度（防止 UI 溢出）。
   - 审核流：自动评分与规则过滤后进入“待审核”，管理员在后台批准或退回；批准后合并到 `tools` 主表并触发页面缓存失效。
- 部署与分发
  - 托管：Vercel 项目，绑定自定义域名。
  - CDN：使用 Vercel 全球 CDN 与 Edge 网络；静态资源（图片、字体）自动分发。
  - 构建产物：App Router SSG/SSR 页面、Edge Route Handlers。

## 环境与配置
- 环境变量
  - `DATABASE_URL=postgresql://neondb_owner:npg_hYQK4Dl9MELZ@ep-rapid-mouse-adk1ua6k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`
  - `NEXT_PUBLIC_SITE_URL=https://your-domain.com`
  - `ADMIN_TOKEN=...`（如首期采用简单的 Admin Token 认证）或 NextAuth（GitHub OAuth）。
- Next.js 运行时
  - 边缘路由：在 `app/api/*/route.ts` 中标注 `export const runtime = 'edge'`。
  - 数据库连接：Edge 兼容驱动 + Drizzle 连接池，应对高并发（Neon serverless 使用 HTTP，避免 TCP keep-alive 问题）。
- Vercel 项目设置
  - 自动部署：连接 Git 仓库；设置环境变量（Production/Preview）。
  - 构建输出：默认 Next.js 构建；确保路由配置与 ISR 正常。

## 数据库设计（Neon PostgreSQL）

### 表结构
- `tools`（工具主表）
  - `id` BIGSERIAL PK
  - `slug` TEXT UNIQUE NOT NULL
  - `name` TEXT NOT NULL
  - `description` TEXT
  - `repo_url` TEXT
  - `homepage_url` TEXT
  - `package_name` TEXT（如 npm 包名）
  - `install_cmd` TEXT（安装命令，如 `npm i @foo/bar`）
  - `runtime_support` JSONB（如 `{ node: true, edge: true, browser: false }`）
  - `author` TEXT
  - `license` TEXT
  - `logo_url` TEXT
  - `version` TEXT
  - `status` TEXT（`approved` | `pending` | `rejected` | `archived`）
  - `created_at` TIMESTAMPTZ DEFAULT now()
  - `updated_at` TIMESTAMPTZ DEFAULT now()
  - `source_score` INT DEFAULT 0（来源可信度与质量评分）
  - `last_crawled_at` TIMESTAMPTZ NULL

- `categories`
  - `id` BIGSERIAL PK
  - `name` TEXT UNIQUE NOT NULL
  - `slug` TEXT UNIQUE NOT NULL
  - `created_at` TIMESTAMPTZ DEFAULT now()

- `tags`
  - `id` BIGSERIAL PK
  - `name` TEXT UNIQUE NOT NULL
  - `slug` TEXT UNIQUE NOT NULL

- `tool_tags`（多对多）
  - `tool_id` BIGINT FK -> tools(id)
  - `tag_id` BIGINT FK -> tags(id)
  - PK(`tool_id`, `tag_id`)

- `tool_categories`（多对一/多对多均可，首期一个主分类 + 可选多分类）
  - `tool_id` BIGINT FK -> tools(id)
  - `category_id` BIGINT FK -> categories(id)
  - PK(`tool_id`, `category_id`)

- `users`（可选，若需要登录与互动）
  - `id` BIGSERIAL PK
  - `provider` TEXT（github/google/email）
  - `provider_id` TEXT UNIQUE
  - `display_name` TEXT
  - `avatar_url` TEXT
  - `role` TEXT（`user` | `admin`）
  - `created_at` TIMESTAMPTZ DEFAULT now()

- `favorites`
  - `user_id` BIGINT FK -> users(id)
  - `tool_id` BIGINT FK -> tools(id)
  - PK(`user_id`, `tool_id`)
  - `created_at` TIMESTAMPTZ DEFAULT now()

- `likes`
  - `user_id` BIGINT FK -> users(id)
  - `tool_id` BIGINT FK -> tools(id)
  - PK(`user_id`, `tool_id`)
  - `created_at` TIMESTAMPTZ DEFAULT now()

- `views`
  - `tool_id` BIGINT FK -> tools(id)
  - `date` DATE
  - `count` INT
  - PK(`tool_id`, `date`)

- `submissions`（用户提交）
  - `id` BIGSERIAL PK
  - `submitter_email` TEXT
  - `payload` JSONB（提交内容快照）
  - `status` TEXT（`pending` | `approved` | `rejected`）
  - `moderator_note` TEXT
  - `created_at` TIMESTAMPTZ DEFAULT now()
  - `updated_at` TIMESTAMPTZ DEFAULT now()

- `audits`（审计日志）
  - `id` BIGSERIAL PK
  - `actor_user_id` BIGINT NULL FK -> users(id)
  - `action` TEXT（`create_tool`/`update_tool`/`approve`/`reject`/...）
  - `target_tool_id` BIGINT NULL FK -> tools(id)
  - `metadata` JSONB
  - `created_at` TIMESTAMPTZ DEFAULT now()

### 索引与扩展
- 索引
  - `tools(slug)` 唯一
  - `tools(name)` BTREE
  - `tools USING GIN(to_tsvector('simple', coalesce(name,'') || ' ' || coalesce(description,'')))`（全文）
  - `tags(slug)`、`categories(slug)` 唯一
  - `views(tool_id, date)` PK
- 扩展
  - `CREATE EXTENSION IF NOT EXISTS pg_trgm;` 模糊搜索支持
  - `CREATE EXTENSION IF NOT EXISTS pgcrypto;`（如需生成随机 ID/加密）
  - `CREATE EXTENSION IF NOT EXISTS vector;`（语义检索向量存储）

### 示例 DDL（可根据 ORM 迁移生成）
```sql
CREATE TABLE IF NOT EXISTS tools (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT,
  homepage_url TEXT,
  package_name TEXT,
  install_cmd TEXT,
  runtime_support JSONB,
  author TEXT,
  license TEXT,
  logo_url TEXT,
  version TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tags (
  id BIGSERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS tool_tags (
  tool_id BIGINT REFERENCES tools(id) ON DELETE CASCADE,
  tag_id BIGINT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (tool_id, tag_id)
);

CREATE TABLE IF NOT EXISTS tool_categories (
  tool_id BIGINT REFERENCES tools(id) ON DELETE CASCADE,
  category_id BIGINT REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (tool_id, category_id)
);

CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
  submitter_email TEXT,
  payload JSONB,
  status TEXT DEFAULT 'pending',
  moderator_note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS views (
  tool_id BIGINT REFERENCES tools(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  count INT DEFAULT 0,
  PRIMARY KEY (tool_id, date)
);

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS vector;
```

## API 设计（Edge Route Handlers）
- 公共 API（GET）
  - `GET /api/tools`：分页、排序、筛选（`category`、`tag`、`q`）。
  - `GET /api/tools/[slug]`：工具详情。
  - `GET /api/search`：关键词搜索（全文/模糊）。
  - `GET /api/categories`、`GET /api/tags`：基础数据。
- 提交与互动（POST/DELETE）
  - `POST /api/submissions`：提交新工具信息（验证与速率限制）。
  - `POST /api/tools/[slug]/like`、`DELETE .../like`：点赞（需登录或匿名限流）。
  - `POST /api/tools/[slug]/favorite`、`DELETE .../favorite`：收藏。
- 管理员（POST/PATCH/DELETE）
  - `PATCH /api/admin/tools/[id]`：编辑工具（认证）。
  - `POST /api/admin/tools/approve`、`POST /api/admin/tools/reject`：审核。
  - `POST /api/admin/categories`、`POST /api/admin/tags`：维护基础数据。
 - 抓取与聚合（Node Runtime 路由优先）
   - `POST /api/admin/sources`：新增/维护数据源。
   - `GET /api/admin/sources`：查看源列表与状态。
   - `POST /api/admin/crawl/run`：手动触发抓取任务（可指定 source）。
   - `GET /api/admin/crawl/jobs`：查看抓取任务与结果。
   - `POST /api/admin/llm/process`：对指定 `crawl_result` 触发 LLM 处理。
   - `POST /api/admin/ingests/approve`、`POST /api/admin/ingests/reject`：审核入库映射。
 - 定时任务（Vercel Cron）
   - `GET /api/cron/crawl`：按计划遍历启用源，批量创建 `crawl_jobs` 并执行，受并发限制。
- 约定
  - 分页：`page`、`pageSize`，默认 `pageSize=20`。
  - 排序：`sort=latest|popular`，`order=asc|desc`。
  - 认证：首期可用 `ADMIN_TOKEN` Bearer 方案；后续迁移 NextAuth + GitHub OAuth。
  - 速率限制：基于 Edge 中间件（IP + 指纹），例如 1 分钟内提交不超过 N 次。

## 页面与路由规划（App Router）
- `/` 首页：精选工具、热门分类、最新提交、搜索入口。
- `/tools` 列表页：筛选、排序、分页、卡片视图。
- `/tools/[slug]` 详情页：元信息、安装指南、示例、统计、分享。
- `/categories/[slug]` 分类页：分类下工具列表。
- `/tags/[slug]` 标签页：标签下工具列表。
- `/submit` 提交页：表单、校验、提交成功反馈。
- `/admin` 管理后台：登录/授权、审核列表、编辑工具、分类/标签维护。
  - 扩展：数据源管理、抓取任务与结果查看、LLM 入库审核。
- 静态资源：`/og/[slug]` 生成分享图（Edge 动态生成）。

## 数据访问与 ORM（Edge 兼容）
- 驱动：`@neondatabase/serverless`（HTTP）或 `postgres`（neon adapter）。
- ORM：Drizzle ORM（TypeScript 类型安全、迁移工具）。
- 连接示例（伪代码）
```ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!); // 必须 sslmode=require, channel_binding=require
export const db = drizzle(sql);
```
- 迁移：使用 drizzle-kit 生成与应用迁移；或在 CI 步骤中执行。
 - 注意：
   - 爬虫/LLM 路由建议使用 Node.js runtime，以便使用更广泛的解析库与网络特性（在 Vercel 中设置 `export const runtime = 'nodejs'`）。
   - Edge 路由用于高频读请求；写与重任务避免在 Edge 执行。

## CDN 与缓存策略（Vercel Edge）
- 静态资源：由 Vercel CDN 自动分发；图片与字体设置长缓存（immutable）。
- 页面缓存
  - 列表页与详情页：`revalidate: 60~300s`（根据更新频率调节）。
  - API 响应：设置 `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`。
  - 客户端：SWR 缓存与回源；骨架屏优化 FCP。
- 失效策略：提交新工具或管理员变更后，主动触发 `revalidatePath('/tools')`、`revalidateTag('tools')`。
 - 聚合影响：当 `ingests` 审核为 `approved` 后，触发相关页面（列表、详情、分类/标签页）的缓存失效与 ISR 再生成。

## 性能与可观测性
- 指标：FCP、LCP、CLS、TTFB；通过 Vercel Analytics 与 Speed Insights 观测。
- 日志：Edge Route 使用结构化日志（如 pino）输出到 Vercel 日志；错误栈上报（Sentry 可选）。
 - 爬虫与 LLM 观测：记录每次抓取与处理耗时、成功率、失败原因；对异常源自动降级或禁用；对 LLM 输出长度与字段完整性做校验。

## 安全策略
- 数据库：`sslmode=require` 与 `channel_binding=require`（Neon 连接安全），仅通过环境变量注入。
- 输入校验：服务端 Zod/Valibot 校验；避免 XSS（对富文本/Markdown 做白名单或转义）。
- CSRF：对需要登录态的写操作采用 CSRF Token 或 SameSite Cookie；对匿名操作使用限流。
- 认证与授权：管理员接口强制鉴权；审核与编辑操作记录审计日志。
- 速率限制：基于 Edge 中间件 + KV（可选）或轻量 in-memory token bucket（Edge 请求生命周期内）。
 - 爬虫合规：遵守站点 `robots.txt` 与许可协议；限制并发与速率；尊重版权与商标；对抓取来源保留引用与链接。
 - LLM 安全：避免提交敏感数据到第三方 API；对模型输出进行 XSS 过滤与危险链接检测；保存最小必要信息。

## 开发与部署流程
- 开发
  - 初始化 Next.js + TypeScript + Tailwind + shadcn/ui。
  - 引入 Drizzle ORM 与 Neon serverless 驱动；配置 `DATABASE_URL`。
  - 编写数据模型与迁移；实现基础 API 与页面。
  - 本地：使用 `vercel dev` 或 `next dev`（本地数据库可用 Neon 分支或 Docker Postgres）。
- 部署
  - 推送到 GitHub/GitLab；Vercel 自动构建与预览环境。
  - 在 Vercel 项目中配置环境变量：`DATABASE_URL`、`ADMIN_TOKEN` 等。
  - 审核通过后推广到 Production；观察日志与性能。
   - 配置 Vercel Cron：定时调用 `/api/cron/crawl`（如每日 02:00 UTC），并在路由内做并发与时间预算控制。

## 里程碑
- M1：设计与需求梳理（当前文档）。
- M2：数据模型与迁移；基础驱动接入（Edge 兼容）。
- M3：公共 API（列表、详情、搜索）；提交 API（速率限制）。
- M4：前端页面（首页、列表、详情、提交）。
- M5：管理后台与审核流；审计日志。
- M6：SEO、OG、缓存优化；性能指标达标。
- M7：上线与监控；迭代与社区反馈。
 - 增补（自动聚合路线）
   - C1：源定义与抓取原型（GitHub/NPM/Awesome）；去重与规范化。
   - C2：LLM 提示工程与输出 Schema；字段校验与限制。
   - C3：后台审核 UI 与入库流程；缓存失效集成。
   - C4：向量检索（可选）与语义搜索；性能压测与成本评估。

## 风险与备选方案
- Prisma 在 Edge 的限制：需使用 Accelerate/Data Proxy，否则不建议。备选：Drizzle + Neon serverless（推荐）。
- Neon 扩展可用性：`pg_trgm` 通常可用，若受限则退回简单全文检索或前端索引（性能较差）。
- 高并发与冷启动：Edge 冷启动较小；需避免每请求新建连接，使用 HTTP driver（neon）而非 TCP。
- 管理后台的复杂度：若后台功能复杂，可让其运行在 Node.js runtime（`export const runtime = 'nodejs'`）以便使用更多依赖。
 - LLM 成本与限流：为降低成本与波动，可引入缓存（按哈希去重）、批量处理、对热门条目优先更新；可切换多家 Provider 以容灾。
 - 抓取阻塞与反爬：对站点设置合规速率与 UA 标识；必要时手动集成官方 API（GitHub/NPM）替代 HTML 抓取；对于复杂站点暂不列入自动源。
 - 数据质量失真：通过规则校验（安装命令存在、许可证合法、仓库活跃度阈值）与人工审核兜底；提供纠错入口。

## 后续扩展
- 工具元数据标准化：引入 JSON Schema，便于校验与导入导出。
- 批量导入：从 GitHub Topics/awesome 列表同步；定时任务（Edge Scheduler 或外部任务）。
- 推广与生态：RSS/Atom 输出、Webhook 通知、Twitter 卡片自动化。
- 排名算法：结合点击率、转化率、星标数；防作弊与异常检测。

---

### 附：环境变量与安全注意
- 切勿将 `DATABASE_URL` 明文写入仓库代码；仅在 Vercel 环境变量中配置。
- 当前使用的数据库连接字符串（请放入环境变量，不要硬编码）：

```
postgresql://neondb_owner:npg_hYQK4Dl9MELZ@ep-rapid-mouse-adk1ua6k-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

- Neon 推荐通过 HTTP 驱动（`@neondatabase/serverless`）在 Edge 访问，确保连接复用与安全。
- `sources`（数据源配置）
  - `id` BIGSERIAL PK
  - `type` TEXT（`github_topic` | `npm_query` | `awesome_list` | `website`）
  - `identifier` TEXT（如 topic 名、查询词、URL）
  - `enabled` BOOLEAN DEFAULT true
  - `created_at` TIMESTAMPTZ DEFAULT now()
  - `updated_at` TIMESTAMPTZ DEFAULT now()

- `crawl_jobs`（抓取任务）
  - `id` BIGSERIAL PK
  - `source_id` BIGINT FK -> sources(id)
  - `status` TEXT（`queued` | `running` | `completed` | `failed`）
  - `started_at` TIMESTAMPTZ NULL
  - `finished_at` TIMESTAMPTZ NULL
  - `stats` JSONB（计数、耗时、错误等）

- `crawl_results`（原始抓取结果）
  - `id` BIGSERIAL PK
  - `job_id` BIGINT FK -> crawl_jobs(id)
  - `canonical_url` TEXT
  - `raw_title` TEXT
  - `raw_description` TEXT
  - `raw_readme` TEXT
  - `raw_metadata` JSONB（如 package.json, repo stars, license）
  - `dedupe_hash` TEXT（去重指纹）
  - `created_at` TIMESTAMPTZ DEFAULT now()

- `llm_jobs`（LLM 处理记录）
  - `id` BIGSERIAL PK
  - `result_id` BIGINT FK -> crawl_results(id)
  - `status` TEXT（`queued` | `running` | `completed` | `failed`）
  - `model` TEXT（提供商/模型名，不保存机密）
  - `prompt_version` TEXT
  - `output` JSONB（摘要、标签、分类、兼容性判断）
  - `created_at` TIMESTAMPTZ DEFAULT now()
  - `finished_at` TIMESTAMPTZ NULL

- `ingests`（入库映射）
  - `id` BIGSERIAL PK
  - `tool_id` BIGINT NULL FK -> tools(id)
  - `llm_job_id` BIGINT FK -> llm_jobs(id)
  - `status` TEXT（`pending_review` | `approved` | `rejected`）
  - `reason` TEXT（拒绝说明）
  - `created_at` TIMESTAMPTZ DEFAULT now()
  - `updated_at` TIMESTAMPTZ DEFAULT now()

- `embeddings`（可选：语义检索）
  - `tool_id` BIGINT PK FK -> tools(id)
  - `vector` VECTOR(1536)（需启用 `pgvector` 扩展；维度视所用嵌入模型而定）
  - `updated_at` TIMESTAMPTZ DEFAULT now()