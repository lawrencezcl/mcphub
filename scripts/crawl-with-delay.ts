import { CrawlProcessor } from '../src/lib/crawl/processor';
import { db } from '../src/db';
import { sources } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

// 延迟函数
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runCrawlWithDelay() {
  console.log('🚀 开始带延迟的本地爬取任务...');
  
  try {
    // 优先处理 NPM 数据源（没有速率限制）
    const npmSources = await db
      .select()
      .from(sources)
      .where(
        and(
          eq(sources.type, 'npm_query'),
          eq(sources.enabled, true)
        )
      );

    console.log(`📊 找到 ${npmSources.length} 个 NPM 数据源`);

    const processor = new CrawlProcessor();
    let totalProcessed = 0;
    const targetCount = 1000;

    // 先处理所有 NPM 数据源
    for (const source of npmSources) {
      if (totalProcessed >= targetCount) {
        console.log(`✅ 已达到目标数量 ${targetCount}，停止爬取`);
        break;
      }

      console.log(`\n🔄 处理 NPM 数据源: ${source.identifier}`);
      
      try {
        const result = await processor.processCrawlJob(source.id);
        totalProcessed += result.itemsProcessed;
        
        console.log(`✅ NPM 数据源 ${source.id} 处理完成:`);
        console.log(`   - 发现项目: ${result.itemsFound}`);
        console.log(`   - 处理成功: ${result.itemsProcessed}`);
        console.log(`   - 错误数量: ${result.errors}`);
        console.log(`   - 耗时: ${result.duration}ms`);
        console.log(`   - 累计处理: ${totalProcessed}/${targetCount}`);

        // NPM 之间也稍微延迟一下
        await delay(2000);

      } catch (error) {
        console.error(`❌ NPM 数据源 ${source.id} 处理失败:`, error);
      }
    }

    // 如果还没达到目标，处理一些 GitHub 数据源（带更长延迟）
    if (totalProcessed < targetCount) {
      const githubSources = await db
        .select()
        .from(sources)
        .where(
          and(
            eq(sources.type, 'github_topic'),
            eq(sources.enabled, true)
          )
        )
        .limit(5); // 只处理前5个，避免速率限制

      console.log(`\n📊 处理 ${githubSources.length} 个 GitHub 数据源（带延迟）`);

      for (const source of githubSources) {
        if (totalProcessed >= targetCount) {
          break;
        }

        console.log(`\n🔄 处理 GitHub 数据源: ${source.identifier}`);
        console.log('⏳ 等待 10 秒避免速率限制...');
        await delay(10000); // 10秒延迟
        
        try {
          const result = await processor.processCrawlJob(source.id);
          totalProcessed += result.itemsProcessed;
          
          console.log(`✅ GitHub 数据源 ${source.id} 处理完成:`);
          console.log(`   - 发现项目: ${result.itemsFound}`);
          console.log(`   - 处理成功: ${result.itemsProcessed}`);
          console.log(`   - 错误数量: ${result.errors}`);
          console.log(`   - 耗时: ${result.duration}ms`);
          console.log(`   - 累计处理: ${totalProcessed}/${targetCount}`);

        } catch (error) {
          console.error(`❌ GitHub 数据源 ${source.id} 处理失败:`, error);
          // GitHub 失败后等待更长时间
          await delay(30000);
        }
      }
    }

    // 处理 LLM 队列
    console.log('\n🤖 开始处理 LLM 队列...');
    try {
      await processor.processLLMQueue(Math.min(100, totalProcessed));
      console.log('✅ LLM 队列处理完成');
    } catch (error) {
      console.error('❌ LLM 队列处理失败:', error);
    }

    console.log(`\n🎉 带延迟的爬取任务完成！`);
    console.log(`📈 总计处理了 ${totalProcessed} 个项目`);

    // 显示数据库统计
    const stats = await getDbStats();
    console.log('\n📊 数据库统计:');
    console.log(`   - 爬取结果: ${stats.crawlResults}`);
    console.log(`   - LLM 任务: ${stats.llmJobs}`);
    console.log(`   - 待审核: ${stats.pendingIngests}`);

  } catch (error) {
    console.error('❌ 爬取任务执行失败:', error);
    process.exit(1);
  }
}

async function getDbStats() {
  const { crawlResults, llmJobs, ingests } = await import('../src/db/schema');
  
  const [crawlCount, llmCount, ingestCount] = await Promise.all([
    db.select({ count: db.$count(crawlResults) }).from(crawlResults),
    db.select({ count: db.$count(llmJobs) }).from(llmJobs),
    db.select({ count: db.$count(ingests) }).from(ingests).where(eq(ingests.status, 'pending_review')),
  ]);

  return {
    crawlResults: crawlCount[0]?.count || 0,
    llmJobs: llmCount[0]?.count || 0,
    pendingIngests: ingestCount[0]?.count || 0,
  };
}

// 如果直接运行此脚本
if (require.main === module) {
  runCrawlWithDelay()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { runCrawlWithDelay };