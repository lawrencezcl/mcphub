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
  // 新增详细信息字段，存储结构化的全面信息
  detail: jsonb('detail').$type<{
    overview?: {
      serviceName?: string;
      serviceDescription?: string;
      summary?: string;
    };
    usageGuide?: {
      deploymentProcess?: string[];
      deploymentMethod?: string;
      quickStart?: string;
      examples?: string[];
    };
    coreFeatures?: string[];
    applicationScenarios?: string[];
    faq?: Array<{
      question: string;
      answer: string;
    }>;
    serverConfig?: {
      configExample?: any;
      installationSteps?: string[];
      requirements?: string[];
    };
    additionalInfo?: {
      documentationLinks?: string[];
      apiReference?: string;
      limitations?: string[];
      performanceMetrics?: any;
      errorCodes?: Array<{
        code: string;
        description: string;
      }>;
    };
  }>(),
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
  analyticsOptIn: boolean('analytics_opt_in').default(false).notNull(),
  dataRetention: text('data_retention').default('90days').notNull(),
  firstName: text('first_name').notNull(),
  lastActive: timestamp('last_active', { precision: 3, withTimezone: true }).defaultNow().notNull(),
  maxNotificationsPerDay: integer('max_notifications_per_day').default(10).notNull(),
  notificationFrequency: text('notification_frequency').default('daily').notNull(),
  telegramId: bigint('telegram_id', { mode: 'number' }).notNull(),
  username: text('username'),
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

// 分享记录表
export const shares = pgTable('shares', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
  toolId: bigint('tool_id', { mode: 'number' }).notNull().references(() => tools.id, { onDelete: 'cascade' }),
  shareId: text('share_id').notNull().unique(), // 唯一分享ID
  platform: text('platform', { enum: ['link', 'twitter', 'linkedin', 'facebook', 'email', 'wechat', 'weibo'] }).notNull(),
  userAgent: text('user_agent'),
  ipAddress: inet('ip_address'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

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
export type Share = typeof shares.$inferSelect;
export type NewShare = typeof shares.$inferInsert;