import { db } from '../src/db';
import { sources } from '../src/db/schema';

async function addMoreSources() {
  console.log('📝 添加更多数据源...');

  const newSources = [
    // GitHub Topics - MCP 相关
    {
      type: 'github_topic' as const,
      identifier: 'mcp',
      enabled: true,
      config: { minStars: 0, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'model-context-protocol',
      enabled: true,
      config: { minStars: 0, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'anthropic',
      enabled: true,
      config: { minStars: 1, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'claude',
      enabled: true,
      config: { minStars: 1, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'ai-tools',
      enabled: true,
      config: { minStars: 5, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'llm-tools',
      enabled: true,
      config: { minStars: 3, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'context-protocol',
      enabled: true,
      config: { minStars: 0, language: null }
    },
    
    // NPM 查询 - MCP 相关
    {
      type: 'npm_query' as const,
      identifier: 'mcp',
      enabled: true,
      config: { minDownloads: 10 }
    },
    {
      type: 'npm_query' as const,
      identifier: 'model-context-protocol',
      enabled: true,
      config: { minDownloads: 5 }
    },
    {
      type: 'npm_query' as const,
      identifier: 'anthropic',
      enabled: true,
      config: { minDownloads: 50 }
    },
    {
      type: 'npm_query' as const,
      identifier: 'claude',
      enabled: true,
      config: { minDownloads: 20 }
    },
    {
      type: 'npm_query' as const,
      identifier: 'ai-sdk',
      enabled: true,
      config: { minDownloads: 100 }
    },
    {
      type: 'npm_query' as const,
      identifier: 'llm',
      enabled: true,
      config: { minDownloads: 200 }
    },
    {
      type: 'npm_query' as const,
      identifier: 'openai',
      enabled: true,
      config: { minDownloads: 500 }
    },
    
    // GitHub Topics - 更广泛的 AI 工具
    {
      type: 'github_topic' as const,
      identifier: 'openai',
      enabled: true,
      config: { minStars: 10, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'chatgpt',
      enabled: true,
      config: { minStars: 20, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'gpt',
      enabled: true,
      config: { minStars: 15, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'ai-assistant',
      enabled: true,
      config: { minStars: 10, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'machine-learning',
      enabled: true,
      config: { minStars: 50, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'natural-language-processing',
      enabled: true,
      config: { minStars: 30, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'text-generation',
      enabled: true,
      config: { minStars: 20, language: null }
    },
    {
      type: 'github_topic' as const,
      identifier: 'language-model',
      enabled: true,
      config: { minStars: 25, language: null }
    },
  ];

  try {
    let addedCount = 0;
    
    for (const source of newSources) {
      try {
        await db.insert(sources).values(source).onConflictDoNothing();
        addedCount++;
        console.log(`✅ 添加数据源: ${source.type} - ${source.identifier}`);
      } catch (error) {
        console.log(`⚠️  数据源已存在: ${source.type} - ${source.identifier}`);
      }
    }

    console.log(`\n🎉 成功添加 ${addedCount} 个新数据源`);
    
    // 显示所有数据源统计
    const allSources = await db.select().from(sources);
    const enabledCount = allSources.filter(s => s.enabled).length;
    
    console.log(`📊 数据源统计:`);
    console.log(`   - 总数据源: ${allSources.length}`);
    console.log(`   - 启用数量: ${enabledCount}`);
    console.log(`   - GitHub Topics: ${allSources.filter(s => s.type === 'github_topic').length}`);
    console.log(`   - NPM 查询: ${allSources.filter(s => s.type === 'npm_query').length}`);

  } catch (error) {
    console.error('❌ 添加数据源失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  addMoreSources()
    .then(() => {
      console.log('✅ 数据源添加完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 数据源添加失败:', error);
      process.exit(1);
    });
}

export { addMoreSources };