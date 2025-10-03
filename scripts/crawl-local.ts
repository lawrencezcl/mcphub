import { CrawlProcessor } from '../src/lib/crawl/processor';
import { db } from '../src/db';
import { sources } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function runLocalCrawl() {
  console.log('🚀 开始本地爬取任务...');
  
  try {
    // 获取所有启用的数据源
    const enabledSources = await db
      .select()
      .from(sources)
      .where(eq(sources.enabled, true));

    console.log(`📊 找到 ${enabledSources.length} 个启用的数据源`);

    if (enabledSources.length === 0) {
      console.log('❌ 没有启用的数据源，请先添加数据源');
      return;
    }

    const processor = new CrawlProcessor();
    let totalProcessed = 0;
    const targetCount = 1000;

    // 处理每个数据源
    for (const source of enabledSources) {
      if (totalProcessed >= targetCount) {
        console.log(`✅ 已达到目标数量 ${targetCount}，停止爬取`);
        break;
      }

      console.log(`\n🔄 处理数据源: ${source.type} - ${source.identifier}`);
      
      try {
        const result = await processor.processCrawlJob(source.id);
        totalProcessed += result.itemsProcessed;
        
        console.log(`✅ 数据源 ${source.id} 处理完成:`);
        console.log(`   - 发现项目: ${result.itemsFound}`);
        console.log(`   - 处理成功: ${result.itemsProcessed}`);
        console.log(`   - 错误数量: ${result.errors}`);
        console.log(`   - 耗时: ${result.duration}ms`);
        console.log(`   - 累计处理: ${totalProcessed}/${targetCount}`);

        // 如果已经达到目标，跳出循环
        if (totalProcessed >= targetCount) {
          break;
        }

      } catch (error) {
        console.error(`❌ 数据源 ${source.id} 处理失败:`, error);
      }
    }

    // 处理 LLM 队列
    console.log('\n🤖 开始处理 LLM 队列...');
    try {
      await processor.processLLMQueue(Math.min(50, totalProcessed)); // 处理最多50个LLM任务
      console.log('✅ LLM 队列处理完成');
    } catch (error) {
      console.error('❌ LLM 队列处理失败:', error);
    }

    console.log(`\n🎉 本地爬取任务完成！`);
    console.log(`📈 总计处理了 ${totalProcessed} 个项目`);

  } catch (error) {
    console.error('❌ 爬取任务执行失败:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runLocalCrawl()
    .then(() => {
      console.log('✅ 脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 脚本执行失败:', error);
      process.exit(1);
    });
}

export { runLocalCrawl };