interface CacheOptions {
  ttl?: number; // 生存时间（秒）
  tags?: string[]; // 缓存标签，用于批量失效
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: string[];
}

class InMemoryCache {
  private cache = new Map<string, CacheEntry<any>>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> keys

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = 300, tags = [] } = options; // 默认5分钟
    const timestamp = Date.now();

    // 清理过期的缓存项
    this.cleanup();

    const entry: CacheEntry<T> = {
      data,
      timestamp,
      ttl: ttl * 1000, // 转换为毫秒
      tags,
    };

    this.cache.set(key, entry);

    // 更新标签索引
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(key);
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      // 从标签索引中移除
      entry.tags.forEach(tag => {
        const keys = this.tagIndex.get(tag);
        if (keys) {
          keys.delete(key);
          if (keys.size === 0) {
            this.tagIndex.delete(tag);
          }
        }
      });
    }
    
    return this.cache.delete(key);
  }

  // 根据标签批量删除
  deleteByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys) return 0;

    let deletedCount = 0;
    keys.forEach(key => {
      if (this.delete(key)) {
        deletedCount++;
      }
    });

    return deletedCount;
  }

  // 清理过期缓存
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.delete(key));
  }

  // 获取缓存统计信息
  getStats(): {
    size: number;
    tags: number;
    hitRate?: number;
  } {
    return {
      size: this.cache.size,
      tags: this.tagIndex.size,
    };
  }

  clear(): void {
    this.cache.clear();
    this.tagIndex.clear();
  }
}

// 全局缓存实例
const globalCache = new InMemoryCache();

// 缓存装饰器
export function cached<T extends (...args: any[]) => Promise<any>>(
  keyGenerator: (...args: Parameters<T>) => string,
  options: CacheOptions = {}
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: Parameters<T>) {
      const cacheKey = keyGenerator(...args);
      
      // 尝试从缓存获取
      const cached = globalCache.get(cacheKey);
      if (cached !== null) {
        return cached;
      }

      // 执行原方法
      const result = await method.apply(this, args);
      
      // 存入缓存
      globalCache.set(cacheKey, result, options);
      
      return result;
    };
  };
}

// 缓存工具函数
export const cache = {
  // 获取缓存
  get: <T>(key: string): T | null => globalCache.get<T>(key),
  
  // 设置缓存
  set: <T>(key: string, data: T, options?: CacheOptions): void => 
    globalCache.set(key, data, options),
  
  // 删除缓存
  delete: (key: string): boolean => globalCache.delete(key),
  
  // 根据标签删除
  deleteByTag: (tag: string): number => globalCache.deleteByTag(tag),
  
  // 清空所有缓存
  clear: (): void => globalCache.clear(),
  
  // 获取统计信息
  getStats: () => globalCache.getStats(),
  
  // 生成缓存键
  key: {
    tools: (params: Record<string, any> = {}) => {
      const sorted = Object.keys(params).sort().reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);
      return `tools:${JSON.stringify(sorted)}`;
    },
    
    tool: (slug: string) => `tool:${slug}`,
    
    categories: () => 'categories:all',
    
    tags: () => 'tags:all',
    
    admin: (endpoint: string, params: Record<string, any> = {}) => {
      const sorted = Object.keys(params).sort().reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);
      return `admin:${endpoint}:${JSON.stringify(sorted)}`;
    },
  },
  
  // 缓存标签
  tags: {
    TOOLS: 'tools',
    CATEGORIES: 'categories', 
    TAGS: 'tags',
    ADMIN: 'admin',
    CRAWL: 'crawl',
  },
};

// 缓存失效策略
export const cacheInvalidation = {
  // 工具相关缓存失效
  invalidateTools: () => {
    cache.deleteByTag(cache.tags.TOOLS);
  },
  
  // 分类相关缓存失效
  invalidateCategories: () => {
    cache.deleteByTag(cache.tags.CATEGORIES);
  },
  
  // 标签相关缓存失效
  invalidateTags: () => {
    cache.deleteByTag(cache.tags.TAGS);
  },
  
  // 管理相关缓存失效
  invalidateAdmin: () => {
    cache.deleteByTag(cache.tags.ADMIN);
  },
  
  // 全部失效
  invalidateAll: () => {
    cache.clear();
  },
};

// Next.js 缓存集成
export const nextCache = {
  // 重新验证路径
  revalidatePath: async (path: string) => {
    try {
      const { revalidatePath } = await import('next/cache');
      revalidatePath(path);
    } catch (error) {
      console.warn('Failed to revalidate path:', path, error);
    }
  },
  
  // 重新验证标签
  revalidateTag: async (tag: string) => {
    try {
      const { revalidateTag } = await import('next/cache');
      revalidateTag(tag);
    } catch (error) {
      console.warn('Failed to revalidate tag:', tag, error);
    }
  },
};

// 缓存中间件
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator: (...args: Parameters<T>) => string,
  options: CacheOptions = {}
): T {
  return (async (...args: Parameters<T>) => {
    const cacheKey = keyGenerator(...args);
    
    // 尝试从缓存获取
    const cached = cache.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // 执行原函数
    const result = await fn(...args);
    
    // 存入缓存
    cache.set(cacheKey, result, options);
    
    return result;
  }) as T;
}