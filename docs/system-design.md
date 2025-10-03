# MCPHub 系统设计（最新架构）

本系统设计基于当前实际实现，详细描述了 MCPHub 的完整架构，包括前端组件、API 设计、数据模型、抓取流水线、AI 处理、缓存策略、认证授权、性能优化等核心模块。

## 总体架构

### 技术栈
- **前端框架**: Next.js 15 (App Router) + React 18
- **UI 组件**: Tailwind CSS + shadcn/ui + Framer Motion
- **运行时环境**: 
  - Edge Runtime: 高频读取 API 和公共页面
  - Node.js Runtime: 数据写入、AI 处理、管理操作
- **数据库**: Neon PostgreSQL (Serverless) + Drizzle ORM
- **AI 服务**: DeepSeek API (可扩展多 Provider)
- **部署平台**: Vercel (Edge Network + Serverless Functions)
- **监控分析**: Vercel Analytics + Sentry
- **缓存策略**: Vercel Edge Cache + ISR + SWR

### 架构原则
1. **边缘优先**: 公共内容通过 Edge Runtime 提供，降低 TTFB
2. **渐进增强**: 基础功能 SSR，交互功能 CSR
3. **类型安全**: 全栈 TypeScript + Zod 验证
4. **性能优化**: 智能缓存 + 代码分割 + 图片优化
5. **可观测性**: 结构化日志 + 性能监控 + 错误追踪

## 前端架构

### 页面结构
```
app/
├── (public)/                 # 公共页面组
│   ├── page.tsx              # 首页 - 展示热门工具
│   ├── tools/                # 工具相关页面
│   │   ├── page.tsx          # 工具列表页
│   │   └── [slug]/           # 工具详情页
│   ├── categories/           # 分类页面
│   ├── tags/                 # 标签页面
│   └── submit/               # 工具提交页
├── admin/                    # 管理后台
│   ├── layout.tsx            # 管理后台布局
│   ├── page.tsx              # 仪表板
│   ├── tools/                # 工具管理
│   ├── submissions/          # 提交审核
│   ├── sources/              # 数据源管理
│   └── analytics/            # 数据分析
├── api/                      # API 路由
│   ├── tools/                # 工具相关 API
│   ├── admin/                # 管理 API
│   ├── cron/                 # 定时任务
│   └── og/                   # OG 图片生成
└── globals.css               # 全局样式
```

### 核心组件
```typescript
// 基础组件
components/
├── ui/                       # shadcn/ui 基础组件
├── layout/                   # 布局组件
│   ├── NavBar.tsx           # 导航栏
│   ├── Footer.tsx           # 页脚
│   └── Sidebar.tsx          # 侧边栏
├── tools/                    # 工具相关组件
│   ├── ToolCard.tsx         # 工具卡片
│   ├── ToolList.tsx         # 工具列表
│   ├── ToolFilters.tsx      # 筛选器
│   └── ToolDetail.tsx       # 工具详情
├── forms/                    # 表单组件
│   ├── SubmitForm.tsx       # 提交表单
│   └── SearchForm.tsx       # 搜索表单
└── admin/                    # 管理组件
    ├── AdminTable.tsx       # 管理表格
    ├── ReviewPanel.tsx      # 审核面板
    └── SourceManager.tsx    # 数据源管理
```

### 状态管理
- **URL 状态**: 搜索、筛选、分页参数通过 URL 管理
- **服务端状态**: SWR 管理 API 数据缓存和同步
- **客户端状态**: React useState/useReducer 管理 UI 状态
- **全局状态**: Context API 管理主题、用户信息等

### 性能优化
- **代码分割**: 动态导入管理后台和详情页组件
- **图片优化**: next/image 自动优化和懒加载
- **字体优化**: next/font 优化字体加载
- **预加载**: 关键页面和 API 预加载
- **缓存策略**: 静态资源长期缓存，API 响应智能缓存

## API 架构

### 路由设计
```typescript
// Edge Runtime API (只读操作)
/api/tools                    # 工具列表 (GET)
/api/tools/[slug]            # 工具详情 (GET)
/api/categories              # 分类列表 (GET)
/api/tags                    # 标签列表 (GET)
/api/search                  # 搜索接口 (GET)
/api/stats                   # 统计数据 (GET)

// Node.js Runtime API (写操作)
/api/submissions             # 提交工具 (POST)
/api/admin/tools             # 工具管理 (POST/PUT/DELETE)
/api/admin/submissions       # 提交审核 (POST/PUT)
/api/admin/sources           # 数据源管理 (POST/PUT/DELETE)
/api/admin/crawl             # 抓取任务 (POST)
/api/admin/llm               # AI 处理 (POST)
/api/cron/crawl              # 定时抓取 (POST)
/api/cron/cleanup            # 数据清理 (POST)
```

### 数据验证
```typescript
// 使用 Zod 进行类型安全的数据验证
export const ToolCreateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  repoUrl: z.string().url().optional(),
  homepageUrl: z.string().url().optional(),
  packageName: z.string().optional(),
  installCmd: z.string().optional(),
  runtimeSupport: z.object({
    node: z.boolean().optional(),
    edge: z.boolean().optional(),
    browser: z.boolean().optional(),
  }).optional(),
  // ... 详细字段定义
});
```

### 错误处理
```typescript
// 统一错误响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationMeta;
    timing?: TimingMeta;
  };
}

// 错误码定义
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
```

## 数据架构

### 数据库设计
```sql
-- 核心业务表
tools                        # 工具主表
├── id (bigint, PK)         # 主键
├── slug (text, unique)     # URL 友好标识
├── name (text)             # 工具名称
├── description (text)      # 描述
├── detail (jsonb)          # 详细信息 (结构化)
├── repo_url (text)         # 仓库地址
├── homepage_url (text)     # 主页地址
├── package_name (text)     # 包名
├── install_cmd (text)      # 安装命令
├── runtime_support (jsonb) # 运行时支持
├── author (text)           # 作者
├── license (text)          # 许可证
├── logo_url (text)         # Logo 地址
├── version (text)          # 版本
├── status (enum)           # 状态: pending/approved/rejected/archived
├── source_score (int)      # 来源评分
├── popularity_score (int)  # 人气评分
├── quality_score (decimal) # 质量评分
├── created_at (timestamp)  # 创建时间
├── updated_at (timestamp)  # 更新时间
└── last_crawled_at (timestamp) # 最后抓取时间

-- 分类和标签
categories                   # 分类表
├── id (bigint, PK)
├── name (text, unique)
├── slug (text, unique)
├── description (text)
├── icon (text)
└── created_at (timestamp)

tags                        # 标签表
├── id (bigint, PK)
├── name (text, unique)
├── slug (text, unique)
└── color (text)

-- 关联表
tool_tags                   # 工具-标签关联
├── tool_id (bigint, FK)
└── tag_id (bigint, FK)

tool_categories             # 工具-分类关联
├── tool_id (bigint, FK)
└── category_id (bigint, FK)

-- 用户和交互
users                       # 用户表
├── id (bigint, PK)
├── telegram_id (bigint)
├── username (text)
├── first_name (text)
├── analytics_opt_in (boolean)
├── data_retention (text)
├── last_active (timestamp)
├── notification_frequency (text)
├── max_notifications_per_day (int)
├── created_at (timestamp)
└── updated_at (timestamp)

submissions                 # 提交表
├── id (bigint, PK)
├── submitter_email (text)
├── payload (jsonb)         # 提交的工具数据
├── status (enum)           # pending/approved/rejected
├── moderator_note (text)
├── moderator_id (bigint, FK)
├── created_at (timestamp)
└── updated_at (timestamp)

-- 统计表
views                       # 浏览统计
├── tool_id (bigint, FK)
├── date (date)
└── count (int)

likes                       # 点赞记录
├── user_id (bigint, FK)
├── tool_id (bigint, FK)
└── created_at (timestamp)

favorites                   # 收藏记录
├── user_id (bigint, FK)
├── tool_id (bigint, FK)
└── created_at (timestamp)

shares                      # 分享记录
├── id (bigint, PK)
├── tool_id (bigint, FK)
├── share_id (text, unique)
├── platform (enum)        # link/twitter/linkedin/facebook/email/wechat/weibo
├── user_agent (text)
├── ip_address (inet)
└── created_at (timestamp)

-- 数据处理流水线
sources                     # 数据源配置
├── id (bigint, PK)
├── type (enum)             # github_topic/npm_query/awesome_list/website
├── identifier (text)       # 标识符 (topic名/查询词/URL)
├── enabled (boolean)       # 是否启用
├── config (jsonb)          # 配置参数
├── created_at (timestamp)
└── updated_at (timestamp)

crawl_jobs                  # 抓取任务
├── id (bigint, PK)
├── source_id (bigint, FK)
├── status (enum)           # queued/running/completed/failed
├── started_at (timestamp)
├── finished_at (timestamp)
├── stats (jsonb)           # 统计信息
└── error (text)

crawl_results               # 抓取结果
├── id (bigint, PK)
├── job_id (bigint, FK)
├── canonical_url (text)
├── raw_title (text)
├── raw_description (text)
├── raw_readme (text)
├── raw_metadata (jsonb)
├── dedupe_hash (text, unique) # 去重哈希
└── created_at (timestamp)

llm_jobs                    # LLM 处理任务
├── id (bigint, PK)
├── result_id (bigint, FK)
├── status (enum)           # queued/running/completed/failed
├── model (text)
├── prompt_version (text)
├── output (jsonb)          # AI 处理结果
├── error (text)
├── created_at (timestamp)
└── finished_at (timestamp)

ingests                     # 入库审核
├── id (bigint, PK)
├── tool_id (bigint, FK)
├── llm_job_id (bigint, FK)
├── status (enum)           # pending_review/approved/rejected
├── reason (text)
├── moderator_id (bigint, FK)
├── created_at (timestamp)
└── updated_at (timestamp)

-- 审计日志
audit_logs                  # 操作审计
├── id (bigint, PK)
├── table_name (text)
├── record_id (bigint)
├── action (enum)           # INSERT/UPDATE/DELETE
├── old_values (jsonb)
├── new_values (jsonb)
├── user_id (bigint, FK)
├── ip_address (inet)
├── user_agent (text)
└── created_at (timestamp)
```

### ORM 配置
```typescript
// Drizzle 配置
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

// 数据库连接
 const sql = neon(process.env.DATABASE_URL);
 export const db = drizzle(sql, { schema });
 ```

## 抓取流水线架构

### 数据源管理
```typescript
// 数据源类型定义
export enum SourceType {
  GITHUB_TOPIC = 'github_topic',
  NPM_QUERY = 'npm_query', 
  AWESOME_LIST = 'awesome_list',
  WEBSITE = 'website'
}

// 数据源配置
interface SourceConfig {
  github_topic: {
    topic: string;
    minStars?: number;
    language?: string;
    sort?: 'stars' | 'updated' | 'created';
  };
  npm_query: {
    query: string;
    scope?: string;
    keywords?: string[];
    minDownloads?: number;
  };
  awesome_list: {
    repoUrl: string;
    section?: string;
    pattern?: string;
  };
  website: {
    baseUrl: string;
    selectors: {
      title: string;
      description: string;
      links: string;
    };
    pagination?: {
      nextSelector: string;
      maxPages: number;
    };
  };
}
```

### 抓取任务编排
```typescript
// 任务状态管理
export enum CrawlJobStatus {
  QUEUED = 'queued',
  RUNNING = 'running', 
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// 抓取统计
interface CrawlStats {
  totalItems: number;
  newItems: number;
  updatedItems: number;
  duplicateItems: number;
  errorItems: number;
  duration: number;
  apiCalls: number;
  rateLimitHits: number;
}

// 任务执行器
class CrawlJobExecutor {
  async execute(job: CrawlJob): Promise<CrawlStats> {
    const fetcher = this.getFetcher(job.source.type);
    const results = await fetcher.fetch(job.source);
    
    // 解析和去重
    const parsedResults = await this.parseResults(results);
    const deduplicatedResults = await this.deduplicateResults(parsedResults);
    
    // 保存到数据库
    await this.saveResults(job.id, deduplicatedResults);
    
    return this.generateStats(results, parsedResults, deduplicatedResults);
  }
}
```

### GitHub 抓取实现
```typescript
class GitHubFetcher {
  private client: Octokit;
  
  async fetch(source: Source): Promise<RawResult[]> {
    const config = source.config as SourceConfig['github_topic'];
    
    // 搜索仓库
    const searchQuery = this.buildSearchQuery(config);
    const repos = await this.searchRepositories(searchQuery);
    
    // 获取详细信息
    const results: RawResult[] = [];
    for (const repo of repos) {
      try {
        const readme = await this.getReadme(repo.owner.login, repo.name);
        const packageJson = await this.getPackageJson(repo.owner.login, repo.name);
        
        results.push({
          canonicalUrl: repo.html_url,
          rawTitle: repo.name,
          rawDescription: repo.description,
          rawReadme: readme,
          rawMetadata: {
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            language: repo.language,
            topics: repo.topics,
            license: repo.license?.spdx_id,
            packageJson: packageJson,
            lastUpdated: repo.updated_at
          }
        });
      } catch (error) {
        console.error(`Failed to fetch details for ${repo.full_name}:`, error);
      }
    }
    
    return results;
  }
  
  private buildSearchQuery(config: SourceConfig['github_topic']): string {
    let query = `topic:${config.topic}`;
    
    if (config.minStars) {
      query += ` stars:>=${config.minStars}`;
    }
    
    if (config.language) {
      query += ` language:${config.language}`;
    }
    
    // 过滤 MCP 相关
    query += ' (mcp OR "model context protocol" OR "claude computer use")';
    
    return query;
  }
}
```

### NPM 抓取实现
```typescript
class NPMFetcher {
  async fetch(source: Source): Promise<RawResult[]> {
    const config = source.config as SourceConfig['npm_query'];
    
    // 搜索包
    const searchUrl = this.buildSearchUrl(config);
    const searchResults = await fetch(searchUrl).then(r => r.json());
    
    const results: RawResult[] = [];
    for (const pkg of searchResults.objects) {
      try {
        // 获取包详情
        const packageData = await this.getPackageDetails(pkg.package.name);
        
        // 检查是否为 MCP 工具
        if (this.isMCPTool(packageData)) {
          results.push({
            canonicalUrl: packageData.homepage || packageData.repository?.url,
            rawTitle: packageData.name,
            rawDescription: packageData.description,
            rawReadme: packageData.readme,
            rawMetadata: {
              version: packageData.version,
              keywords: packageData.keywords,
              license: packageData.license,
              author: packageData.author,
              downloads: pkg.package.downloads,
              repository: packageData.repository,
              dependencies: packageData.dependencies
            }
          });
        }
      } catch (error) {
        console.error(`Failed to fetch package ${pkg.package.name}:`, error);
      }
    }
    
    return results;
  }
  
  private isMCPTool(packageData: any): boolean {
    const indicators = [
      'mcp',
      'model-context-protocol',
      'claude-computer-use',
      '@modelcontextprotocol'
    ];
    
    const searchText = [
      packageData.name,
      packageData.description,
      ...(packageData.keywords || []),
      packageData.readme
    ].join(' ').toLowerCase();
    
    return indicators.some(indicator => searchText.includes(indicator));
  }
}
```

### 内容解析器
```typescript
class ContentParser {
  parseToolInfo(result: RawResult): ParsedToolInfo {
    const metadata = result.rawMetadata;
    
    return {
      name: this.extractName(result),
      description: this.extractDescription(result),
      repoUrl: this.extractRepoUrl(result),
      homepageUrl: this.extractHomepageUrl(result),
      packageName: this.extractPackageName(result),
      installCmd: this.extractInstallCommand(result),
      runtimeSupport: this.extractRuntimeSupport(result),
      author: this.extractAuthor(result),
      license: this.extractLicense(result),
      logoUrl: this.extractLogoUrl(result),
      version: this.extractVersion(result),
      tags: this.extractTags(result),
      category: this.extractCategory(result)
    };
  }
  
  private extractInstallCommand(result: RawResult): string | null {
    const readme = result.rawReadme || '';
    const packageJson = result.rawMetadata?.packageJson;
    
    // 从 README 中提取安装命令
    const installPatterns = [
      /npm install\s+([^\s\n]+)/gi,
      /yarn add\s+([^\s\n]+)/gi,
      /pnpm add\s+([^\s\n]+)/gi,
      /npx\s+([^\s\n]+)/gi
    ];
    
    for (const pattern of installPatterns) {
      const match = readme.match(pattern);
      if (match) {
        return match[0];
      }
    }
    
    // 从 package.json 推断
    if (packageJson?.name) {
      return `npm install ${packageJson.name}`;
    }
    
    return null;
  }
  
  private extractRuntimeSupport(result: RawResult): RuntimeSupport {
    const readme = result.rawReadme || '';
    const packageJson = result.rawMetadata?.packageJson;
    
    return {
      node: this.checkNodeSupport(readme, packageJson),
      edge: this.checkEdgeSupport(readme, packageJson),
      browser: this.checkBrowserSupport(readme, packageJson)
    };
  }
  
  private checkEdgeSupport(readme: string, packageJson: any): boolean {
    const edgeIndicators = [
      'edge runtime',
      'vercel edge',
      'cloudflare workers',
      'export const runtime = "edge"',
      'runtime: "edge"'
    ];
    
    const searchText = (readme + JSON.stringify(packageJson || {})).toLowerCase();
    return edgeIndicators.some(indicator => searchText.includes(indicator));
  }
}
```

### 去重策略
```typescript
class DeduplicationService {
  async deduplicateResults(results: ParsedToolInfo[]): Promise<ParsedToolInfo[]> {
    const deduplicatedResults: ParsedToolInfo[] = [];
    const seenHashes = new Set<string>();
    
    for (const result of results) {
      const hash = this.generateDedupeHash(result);
      
      if (!seenHashes.has(hash)) {
        seenHashes.add(hash);
        deduplicatedResults.push(result);
      } else {
        // 检查是否需要更新现有记录
        await this.handleDuplicate(result, hash);
      }
    }
    
    return deduplicatedResults;
  }
  
  private generateDedupeHash(result: ParsedToolInfo): string {
    // 使用多个字段生成唯一标识
    const identifiers = [
      result.repoUrl,
      result.homepageUrl,
      result.packageName,
      result.name
    ].filter(Boolean);
    
    const primaryIdentifier = identifiers[0] || result.name;
    return crypto.createHash('sha256')
      .update(primaryIdentifier.toLowerCase())
      .digest('hex');
  }
  
  private async handleDuplicate(result: ParsedToolInfo, hash: string): Promise<void> {
    // 查找现有记录
    const existing = await db.select()
      .from(crawlResults)
      .where(eq(crawlResults.dedupeHash, hash))
      .limit(1);
    
    if (existing.length > 0) {
      const existingResult = existing[0];
      
      // 比较内容是否有更新
      if (this.hasContentChanged(existingResult, result)) {
        // 更新现有记录
        await db.update(crawlResults)
          .set({
            rawTitle: result.name,
            rawDescription: result.description,
            rawReadme: result.rawReadme,
            rawMetadata: result.rawMetadata,
            updatedAt: new Date()
          })
          .where(eq(crawlResults.id, existingResult.id));
      }
    }
  }
}
```

## AI 处理架构

### LLM 客户端
```typescript
class LLMClient {
  private provider: AIProvider;
  
  constructor(provider: 'deepseek' | 'openai' | 'anthropic' = 'deepseek') {
    this.provider = this.createProvider(provider);
  }
  
  async processToolInfo(result: CrawlResult): Promise<LLMOutput> {
    const prompt = this.buildPrompt(result);
    
    try {
      const response = await this.provider.complete({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });
      
      const output = this.parseResponse(response.content);
      return this.validateOutput(output);
      
    } catch (error) {
      throw new LLMProcessingError(`Failed to process tool info: ${error.message}`);
    }
  }
  
  private buildPrompt(result: CrawlResult): string {
    return `
请分析以下 MCP 工具信息，并生成结构化的输出：

工具名称: ${result.rawTitle}
描述: ${result.rawDescription}
README: ${result.rawReadme?.substring(0, 4000)}
元数据: ${JSON.stringify(result.rawMetadata, null, 2)}

请提供以下信息的 JSON 格式输出：
1. summary: 工具的简洁描述（不超过300字）
2. tags: 相关标签数组（最多10个）
3. category: 主要分类
4. runtimeSupport: 运行时支持情况 {node, edge, browser}
5. qualityScore: 质量评分（0-100）
6. risks: 潜在风险或注意事项（可选）
    `;
  }
  
  private validateOutput(output: any): LLMOutput {
    const schema = z.object({
      summary: z.string().max(300),
      tags: z.array(z.string()).max(10),
      category: z.string(),
      runtimeSupport: z.object({
        node: z.boolean(),
        edge: z.boolean(),
        browser: z.boolean()
      }),
      qualityScore: z.number().min(0).max(100),
      risks: z.string().optional()
    });
    
    return schema.parse(output);
  }
}
```

### 成本控制
```typescript
class LLMCostController {
  private dailyBudget: number = 100; // USD
  private currentSpend: number = 0;
  private requestQueue: LLMRequest[] = [];
  
  async processWithBudgetControl(requests: LLMRequest[]): Promise<LLMResult[]> {
    const results: LLMResult[] = [];
    
    // 按优先级排序
    const sortedRequests = this.prioritizeRequests(requests);
    
    for (const request of sortedRequests) {
      if (this.currentSpend >= this.dailyBudget) {
        console.warn('Daily LLM budget exceeded, queuing remaining requests');
        this.requestQueue.push(...sortedRequests.slice(results.length));
        break;
      }
      
      try {
        const result = await this.processRequest(request);
        results.push(result);
        
        // 更新成本
        this.currentSpend += this.estimateCost(request, result);
        
      } catch (error) {
        console.error(`LLM processing failed for request ${request.id}:`, error);
        results.push({ id: request.id, status: 'failed', error: error.message });
      }
    }
    
    return results;
  }
  
  private prioritizeRequests(requests: LLMRequest[]): LLMRequest[] {
    return requests.sort((a, b) => {
      // 优先处理高质量来源
      const aScore = this.getSourceQualityScore(a.source);
      const bScore = this.getSourceQualityScore(b.source);
      
      if (aScore !== bScore) {
        return bScore - aScore;
      }
      
      // 其次按创建时间
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  }
  
  private estimateCost(request: LLMRequest, result: LLMResult): number {
    // 基于 token 数量估算成本
    const inputTokens = this.countTokens(request.prompt);
    const outputTokens = this.countTokens(result.output);
    
    // DeepSeek 定价 (示例)
    const inputCostPerToken = 0.00014 / 1000; // $0.14 per 1M tokens
    const outputCostPerToken = 0.00028 / 1000; // $0.28 per 1M tokens
    
    return (inputTokens * inputCostPerToken) + (outputTokens * outputCostPerToken);
  }
}
```

## 缓存架构

### 多层缓存策略
```typescript
class CacheManager {
  private edgeCache: EdgeCache;
  private redisCache: RedisCache;
  private memoryCache: MemoryCache;
  
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    // L1: 内存缓存 (最快)
    let value = await this.memoryCache.get<T>(key);
    if (value) {
      return value;
    }
    
    // L2: Redis 缓存 (中等速度)
    value = await this.redisCache.get<T>(key);
    if (value) {
      // 回填内存缓存
      await this.memoryCache.set(key, value, { ttl: 60 });
      return value;
    }
    
    // L3: Edge 缓存 (CDN)
    value = await this.edgeCache.get<T>(key);
    if (value) {
      // 回填上层缓存
      await this.redisCache.set(key, value, { ttl: 300 });
      await this.memoryCache.set(key, value, { ttl: 60 });
      return value;
    }
    
    return null;
  }
  
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || 300;
    
    // 写入所有层级
    await Promise.all([
      this.memoryCache.set(key, value, { ttl: Math.min(ttl, 60) }),
      this.redisCache.set(key, value, { ttl }),
      this.edgeCache.set(key, value, { ttl: ttl * 2 }) // Edge 缓存更长时间
    ]);
  }
  
  async invalidate(pattern: string): Promise<void> {
    await Promise.all([
      this.memoryCache.invalidate(pattern),
      this.redisCache.invalidate(pattern),
      this.edgeCache.invalidate(pattern)
    ]);
  }
}
```

### 智能缓存失效
```typescript
class CacheInvalidationService {
  async invalidateToolRelatedCaches(toolId: number): Promise<void> {
    const tool = await this.getToolById(toolId);
    if (!tool) return;
    
    // 失效相关的缓存键
    const patterns = [
      `tools:${toolId}`,
      `tools:slug:${tool.slug}`,
      `tools:list:*`, // 所有列表页
      `categories:${tool.categories.map(c => c.slug).join(',')}:*`,
      `tags:${tool.tags.map(t => t.slug).join(',')}:*`,
      `search:*`, // 搜索结果
      `stats:*` // 统计数据
    ];
    
    for (const pattern of patterns) {
      await this.cacheManager.invalidate(pattern);
    }
    
    // 触发 Next.js 重新验证
    await this.revalidateNextJSPaths(tool);
  }
  
  private async revalidateNextJSPaths(tool: Tool): Promise<void> {
    const paths = [
      '/', // 首页
      '/tools', // 工具列表
      `/tools/${tool.slug}`, // 工具详情
      ...tool.categories.map(c => `/categories/${c.slug}`),
      ...tool.tags.map(t => `/tags/${t.slug}`)
    ];
    
    for (const path of paths) {
      try {
        await revalidatePath(path);
      } catch (error) {
        console.error(`Failed to revalidate path ${path}:`, error);
      }
    }
  }
}
```

## 性能监控架构

### 指标收集
```typescript
class MetricsCollector {
  private metrics: Map<string, Metric[]> = new Map();
  
  recordAPILatency(route: string, method: string, duration: number, status: number): void {
    const key = `api.latency.${route}.${method}`;
    this.addMetric(key, {
      value: duration,
      timestamp: Date.now(),
      tags: { status: status.toString() }
    });
  }
  
  recordCrawlStats(sourceType: string, stats: CrawlStats): void {
    const metrics = [
      { key: `crawl.items.total.${sourceType}`, value: stats.totalItems },
      { key: `crawl.items.new.${sourceType}`, value: stats.newItems },
      { key: `crawl.duration.${sourceType}`, value: stats.duration },
      { key: `crawl.api_calls.${sourceType}`, value: stats.apiCalls }
    ];
    
    metrics.forEach(({ key, value }) => {
      this.addMetric(key, {
        value,
        timestamp: Date.now(),
        tags: { sourceType }
      });
    });
  }
  
  recordLLMUsage(model: string, inputTokens: number, outputTokens: number, cost: number): void {
    const metrics = [
      { key: `llm.tokens.input.${model}`, value: inputTokens },
      { key: `llm.tokens.output.${model}`, value: outputTokens },
      { key: `llm.cost.${model}`, value: cost }
    ];
    
    metrics.forEach(({ key, value }) => {
      this.addMetric(key, {
        value,
        timestamp: Date.now(),
        tags: { model }
      });
    });
  }
  
  async flush(): Promise<void> {
    // 发送到监控服务 (Vercel Analytics, Sentry, etc.)
    for (const [key, metrics] of this.metrics) {
      await this.sendMetrics(key, metrics);
    }
    
    this.metrics.clear();
  }
}
```

### 性能预算
```typescript
const PERFORMANCE_BUDGETS = {
  // API 响应时间 (ms)
  api: {
    edge: {
      p50: 200,
      p95: 500,
      p99: 1000
    },
    node: {
      p50: 400,
      p95: 800,
      p99: 1500
    }
  },
  
  // 页面加载时间 (ms)
  pages: {
    ttfb: 250,
    fcp: 1000,
    lcp: 2000,
    cls: 0.1,
    fid: 100
  },
  
  // 资源大小 (KB)
  resources: {
    javascript: 500,
    css: 100,
    images: 1000,
    fonts: 200
  },
  
  // 数据库查询 (ms)
  database: {
    simple: 50,
    complex: 200,
    aggregation: 500
  }
};
```

## 安全架构

### 认证授权
```typescript
class AuthService {
  async authenticateAdmin(token: string): Promise<AdminUser | null> {
    // 简单 token 认证
    if (token === process.env.ADMIN_TOKEN) {
      return {
        id: 'admin',
        role: 'admin',
        permissions: ['read', 'write', 'delete', 'manage']
      };
    }
    
    // OAuth 认证 (未来扩展)
    return await this.authenticateOAuth(token);
  }
  
  async checkPermission(user: AdminUser, action: string, resource: string): Promise<boolean> {
    const requiredPermissions = this.getRequiredPermissions(action, resource);
    return requiredPermissions.every(permission => 
      user.permissions.includes(permission)
    );
  }
  
  private getRequiredPermissions(action: string, resource: string): string[] {
    const permissionMap = {
      'read:tools': ['read'],
      'write:tools': ['write'],
      'delete:tools': ['delete'],
      'manage:sources': ['manage'],
      'manage:crawl': ['manage']
    };
    
    return permissionMap[`${action}:${resource}`] || [];
  }
}
```

### 输入验证和清理
```typescript
class SecurityService {
  sanitizeUserInput(input: string): string {
    // XSS 防护
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  }
  
  validateURL(url: string): boolean {
    try {
      const parsed = new URL(url);
      
      // 只允许 HTTP/HTTPS
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return false;
      }
      
      // 阻止内网地址
      const hostname = parsed.hostname;
      if (this.isPrivateIP(hostname)) {
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }
  
  private isPrivateIP(hostname: string): boolean {
    const privateRanges = [
      /^127\./, // localhost
      /^10\./, // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./, // 192.168.0.0/16
      /^169\.254\./, // 169.254.0.0/16 (link-local)
    ];
    
    return privateRanges.some(range => range.test(hostname));
  }
}
```

## 部署架构

### Vercel 配置
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "functions": {
    "app/api/admin/**": {
      "maxDuration": 30
    },
    "app/api/cron/**": {
      "maxDuration": 300
    }
  },
  "crons": [
    {
      "path": "/api/cron/crawl",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/cleanup",
      "schedule": "0 3 * * 0"
    }
  ],
  "env": {
    "DATABASE_URL": "@database_url",
    "ADMIN_TOKEN": "@admin_token",
    "DEEPSEEK_API_KEY": "@deepseek_api_key",
    "GITHUB_TOKEN": "@github_token"
  }
}
```

### 环境配置
```bash
# 生产环境
DATABASE_URL="postgresql://..."
ADMIN_TOKEN="secure-random-token"
NEXTAUTH_SECRET="nextauth-secret"
NEXTAUTH_URL="https://mcphub.io"
DEEPSEEK_API_KEY="sk-..."
DEEPSEEK_BASE_URL="https://api.deepseek.com"
GITHUB_TOKEN="ghp_..."

# 应用配置
NEXT_PUBLIC_APP_NAME="MCPHub"
NEXT_PUBLIC_APP_DESCRIPTION="MCP 工具发现平台"
NEXT_PUBLIC_APP_URL="https://mcphub.io"

# 监控配置
SENTRY_DSN="https://..."
VERCEL_ANALYTICS_ID="..."
```

### CI/CD 流程
```yaml
name: Deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test
      - run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

这个系统设计文档详细描述了 MCPHub 的完整架构，包括前端组件设计、API 架构、数据模型、抓取流水线、AI 处理、缓存策略、性能监控、安全措施和部署配置。每个模块都有具体的实现细节和代码示例，为开发和维护提供了全面的技术指导。
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