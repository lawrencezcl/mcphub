import { db } from './index';
import { categories, tags, sources } from './schema';

async function seed() {
  console.log('🌱 开始种子数据...');

  try {
    // 插入默认分类
    const defaultCategories = [
      { name: 'AI & Machine Learning', slug: 'ai-ml', description: 'AI和机器学习相关工具', icon: '🤖' },
      { name: 'Development Tools', slug: 'dev-tools', description: '开发工具和实用程序', icon: '🛠️' },
      { name: 'Data Processing', slug: 'data-processing', description: '数据处理和分析工具', icon: '📊' },
      { name: 'Web Scraping', slug: 'web-scraping', description: '网页抓取和数据提取', icon: '🕷️' },
      { name: 'API Integration', slug: 'api-integration', description: 'API集成和连接器', icon: '🔌' },
    ];

    await db.insert(categories).values(defaultCategories).onConflictDoNothing();
    console.log('✅ 默认分类已插入');

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
    console.log('✅ 默认标签已插入');

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
    console.log('✅ 默认数据源已插入');

    console.log('✅ 种子数据完成');
  } catch (error) {
    console.error('❌ 种子数据失败:', error);
    throw error;
  }
}

// 如果直接运行此文件，执行种子数据
if (require.main === module) {
  seed().catch(console.error);
}

export { seed };