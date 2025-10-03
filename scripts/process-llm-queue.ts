import { CrawlProcessor } from '../src/lib/crawl/processor';
import { db } from '../src/db';
import { llmJobs, ingests, crawlResults } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

async function processLLMQueue() {
  console.log('🤖 开始处理 LLM 队列...');

  try {
    const processor = new CrawlProcessor();
    
    // 检查当前状态
    const [queuedJobs, completedJobs] = await Promise.all([
      db.select({ count: db.$count(llmJobs) }).from(llmJobs).where(eq(llmJobs.status, 'queued')),
      db.select({ count: db.$count(llmJobs) }).from(llmJobs).where(eq(llmJobs.status, 'completed'))
    ]);

    console.log(`📊 LLM 任务状态:`);
    console.log(`   - 队列中: ${queuedJobs[0]?.count || 0}`);
    console.log(`   - 已完成: ${completedJobs[0]?.count || 0}`);

    if (queuedJobs[0]?.count === 0) {
      console.log('✅ 没有待处理的 LLM 任务');
      
      // 检查是否需要创建入库请求
      await checkAndCreateIngests();
      return;
    }

    // 分批处理 LLM 任务
    const batchSize = 20;
    let processed = 0;
    const totalToProcess = Math.min(queuedJobs[0]?.count || 0, 100); // 最多处理100个

    console.log(`🔄 开始处理 ${totalToProcess} 个 LLM 任务（批次大小: ${batchSize}）`);

    while (processed < totalToProcess) {
      const currentBatch = Math.min(batchSize, totalToProcess - processed);
      
      console.log(`\n📝 处理批次 ${Math.floor(processed / batchSize) + 1}，任务数: ${currentBatch}`);
      
      try {
        await processor.processLLMQueue(currentBatch);
        processed += currentBatch;
        
        console.log(`✅ 批次完成，已处理: ${processed}/${totalToProcess}`);
        
        // 批次间延迟，避免 API 限制
        if (processed < totalToProcess) {
          console.log('⏳ 等待 5 秒...');
          await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
      } catch (error) {
        console.error(`❌ 批次处理失败:`, error);
        
        // 如果是 API 限制错误，等待更长时间
        if (error instanceof Error && error.message.includes('rate limit')) {
          console.log('⏳ API 限制，等待 30 秒...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        } else {
          // 其他错误，跳过这个批次
          processed += currentBatch;
        }
      }
    }

    console.log(`\n🎉 LLM 队列处理完成！处理了 ${processed} 个任务`);

    // 检查并创建入库请求
    await checkAndCreateIngests();

  } catch (error) {
    console.error('❌ LLM 队列处理失败:', error);
    throw error;
  }
}

async function checkAndCreateIngests() {
  console.log('\n🔍 检查是否需要创建入库请求...');

  try {
    // 查找已完成但没有入库请求的 LLM 任务
    const completedLLMJobs = await db
      .select({
        id: llmJobs.id,
        resultId: llmJobs.resultId,
        output: llmJobs.output,
      })
      .from(llmJobs)
      .where(eq(llmJobs.status, 'completed'))
      .limit(50); // 限制数量避免过多

    if (completedLLMJobs.length === 0) {
      console.log('❌ 没有已完成的 LLM 任务');
      return;
    }

    console.log(`📋 找到 ${completedLLMJobs.length} 个已完成的 LLM 任务`);

    let createdIngests = 0;

    for (const llmJob of completedLLMJobs) {
      try {
        // 检查是否已经有入库请求
        const existingIngest = await db
          .select({ id: ingests.id })
          .from(ingests)
          .where(eq(ingests.llmJobId, llmJob.id))
          .limit(1);

        if (existingIngest.length > 0) {
          continue; // 已经有入库请求，跳过
        }

        // 创建入库请求
        await db.insert(ingests).values({
          llmJobId: llmJob.id,
          status: 'pending_review',
          createdAt: new Date(),
        });

        createdIngests++;

      } catch (error) {
        console.error(`❌ 创建入库请求失败 (LLM Job ${llmJob.id}):`, error);
      }
    }

    console.log(`✅ 创建了 ${createdIngests} 个入库请求`);

    if (createdIngests > 0) {
      console.log('\n🎯 下一步建议:');
      console.log('   1. 访问管理后台审核: http://localhost:3000/admin/ingests');
      console.log('   2. 或运行自动审核脚本');
    }

  } catch (error) {
    console.error('❌ 创建入库请求失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  processLLMQueue()
    .then(() => {
      console.log('\n✅ LLM 队列处理完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ LLM 队列处理失败:', error);
      process.exit(1);
    });
}

export { processLLMQueue };