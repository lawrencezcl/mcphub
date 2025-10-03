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
  config: z.record(z.string(), z.any()).optional(),
});

// 类型导出
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type ToolCreate = z.infer<typeof ToolCreateSchema>;
export type ToolUpdate = z.infer<typeof ToolUpdateSchema>;
export type Submission = z.infer<typeof SubmissionSchema>;
export type Review = z.infer<typeof ReviewSchema>;
export type SourceInput = z.infer<typeof SourceSchema>;