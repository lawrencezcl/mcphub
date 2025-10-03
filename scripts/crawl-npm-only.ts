import { CrawlProcessor } from '../src/lib/crawl/processor';
import { db } from '../src/db';
import { sources, crawlResults, llmJobs } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

async function crawlNPMOnly() {
  console.log('🚀 开始 NPM 专用爬取任务...');
  
  try {
    // 获取所有 NPM 数据源
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

    if (npmSources.length === 0) {
      console.log('❌ 没有启用的 NPM 数据源');
      return;
    }

    const processor = new CrawlProcessor();
    let totalProcessed = 0;
    const targetCount = 1000;

    // 处理每个 NPM 数据源
    for (const source of npmSources) {
      if (totalProcessed >= targetCount) {
        console.log(`✅ 已达到目标数量 ${targetCount}，停止爬取`);
        break;
      }

      console.log(`\n🔄 处理 NPM 数据源: ${source.identifier}`);
      
      try {
        const startTime = Date.now();
        const result = await processor.processCrawlJob(source.id);
        const duration = Date.now() - startTime;
        
        totalProcessed += result.itemsProcessed;
        
        console.log(`✅ NPM 数据源 ${source.id} 处理完成:`);
        console.log(`   - 发现项目: ${result.itemsFound}`);
        console.log(`   - 处理成功: ${result.itemsProcessed}`);
        console.log(`   - 错误数量: ${result.errors}`);
        console.log(`   - 耗时: ${duration}ms`);
        console.log(`   - 累计处理: ${totalProcessed}/${targetCount}`);

        // 短暂延迟，避免过于频繁的请求
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        console.error(`❌ NPM 数据源 ${source.id} 处理失败:`, error);
      }
    }

    // 处理 LLM 队列
    console.log('\n🤖 开始处理 LLM 队列...');
    try {
      const llmBatchSize = Math.min(200, totalProcessed);
      console.log(`📝 处理 ${llmBatchSize} 个 LLM 任务...`);
      
      await processor.processLLMQueue(llmBatchSize);
      console.log('✅ LLM 队列处理完成');
    } catch (error) {
      console.error('❌ LLM 队列处理失败:', error);
    }

    // 显示最终统计
    console.log(`\n🎉 NPM 爬取任务完成！`);
    console.log(`📈 总计处理了 ${totalProcessed} 个项目`);

    // 显示数据库统计
    const stats = await getDbStats();
    console.log('\n📊 数据库统计:');
    console.log(`   - 爬取结果总数: ${stats.crawlResults}`);
    console.log(`   - LLM 任务总数: ${stats.llmJobs}`);
    console.log(`   - 已完成 LLM: ${stats.completedLLM}`);
    console.log(`   - 待处理 LLM: ${stats.pendingLLM}`);

    if (stats.crawlResults > 0) {
      console.log('\n🎯 建议下一步:');
      console.log('   1. 访问 http://localhost:3000/admin 查看管理后台');
      console.log('   2. 审核 LLM 处理结果');
      console.log('   3. 批准优质工具入库');
      console.log('   4. 访问 http://localhost:3000/tools 查看前台效果');
    }

  } catch (error) {
    console.error('❌ NPM 爬取任务执行失败:', error);
    process.exit(1);
  }
}

async function getDbStats() {
  const [crawlCount, llmCount, completedLLMCount] = await Promise.all([
    db.select({ count: db.$count(crawlResults) }).from(crawlResults),
    db.select({ count: db.$count(llmJobs) }).from(llmJobs),
    db.select({ count: db.$count(llmJobs) }).from(llmJobs).where(eq(llmJobs.status, 'completed')),
  ]);

  const totalCrawl = crawlCount[0]?.count || 0;
  const totalLLM = llmCount[0]?.count || 0;
  const completedLLM = completedLLMCount[0]?.count || 0;

  return {
    crawlResults: totalCrawl,
    llmJobs: totalLLM,
    completedLLM: completedLLM,
    pendingLLM: totalLLM - completedLLM,
  };
}

// 如果直接运行此脚本
if (require.main === module) {
  crawlNPMOnly()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { crawlNPMOnly };