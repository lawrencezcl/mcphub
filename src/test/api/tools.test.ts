import { describe, it, expect, beforeEach, vi } from 'vitest';

// 模拟数据库
vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    offset: vi.fn().mockReturnThis(),
  },
}));

// 模拟 schema
vi.mock('@/db/schema', () => ({
  tools: {
    id: 'id',
    slug: 'slug',
    name: 'name',
    description: 'description',
    status: 'status',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
}));

describe('Tools API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should validate search parameters', () => {
    const { SearchQuerySchema } = require('@/lib/validators');
    
    const validParams = {
      page: '1',
      pageSize: '20',
      q: 'test',
      sort: 'latest',
    };

    const result = SearchQuerySchema.safeParse(validParams);
    expect(result.success).toBe(true);
    expect(result.data.page).toBe(1);
    expect(result.data.pageSize).toBe(20);
  });

  it('should reject invalid parameters', () => {
    const { SearchQuerySchema } = require('@/lib/validators');
    
    const invalidParams = {
      page: '0', // 应该 >= 1
      pageSize: '200', // 应该 <= 100
    };

    const result = SearchQuerySchema.safeParse(invalidParams);
    expect(result.success).toBe(false);
  });

  it('should generate correct cache keys', () => {
    const { cache } = require('@/lib/cache');
    
    const key1 = cache.key.tools({ page: 1, q: 'test' });
    const key2 = cache.key.tools({ q: 'test', page: 1 });
    
    // 参数顺序不同但内容相同，应该生成相同的键
    expect(key1).toBe(key2);
  });
});