import { db } from '../src/db';
import { tools, crawlResults, llmJobs, ingests, sources } from '../src/db/schema';
import { eq, count } from 'drizzle-orm';

async function checkDbData() {
  console.log('🔍 检查数据库数据状态...\n');

  try {
    // 检查各表的数据量
    const [
      toolsCount,
      crawlCount,
      llmCount,
      ingestCount,
      sourcesCount
    ] = await Promise.all([
      db.select({ count: count() }).from(tools),
      db.select({ count: count() }).from(crawlResults),
      db.select({ count: count() }).from(llmJobs),
      db.select({ count: count() }).from(ingests),
      db.select({ count: count() }).from(sources)
    ]);

    console.log('📊 数据库统计:');
    console.log(`   - 工具 (tools): ${toolsCount[0]?.count || 0}`);
    console.log(`   - 爬取结果 (crawl_results): ${crawlCount[0]?.count || 0}`);
    console.log(`   - LLM 任务 (llm_jobs): ${llmCount[0]?.count || 0}`);
    console.log(`   - 入库请求 (ingests): ${ingestCount[0]?.count || 0}`);
    console.log(`   - 数据源 (sources): ${sourcesCount[0]?.count || 0}`);

    // 检查工具表的详细情况
    if (toolsCount[0]?.count > 0) {
      console.log('\n✅ 工具表有数据，检查详细信息:');
      const toolsList = await db.select({
        id: tools.id,
        name: tools.name,
        slug: tools.slug,
        status: tools.status,
        description: tools.description
      }).from(tools).limit(5);
      toolsList.forEach((tool, index) => {
        console.log(`   ${index + 1}. ${tool.name} (${tool.status}) - ${tool.slug}`);
      });
    } else {
      console.log('\n❌ 工具表为空！');
    }

    // 检查爬取结果
    if (crawlCount[0]?.count > 0) {
      console.log('\n📦 爬取结果详情:');
      const crawlList = await db.select().from(crawlResults).limit(5);
      crawlList.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.rawTitle} - ${result.canonicalUrl}`);
      });
    }

    // 检查 LLM 任务状态
    if (llmCount[0]?.count > 0) {
      const [completedLLM, failedLLM, queuedLLM] = await Promise.all([
        db.select({ count: count() }).from(llmJobs).where(eq(llmJobs.status, 'completed')),
        db.select({ count: count() }).from(llmJobs).where(eq(llmJobs.status, 'failed')),
        db.select({ count: count() }).from(llmJobs).where(eq(llmJobs.status, 'queued'))
      ]);

      console.log('\n🤖 LLM 任务状态:');
      console.log(`   - 已完成: ${completedLLM[0]?.count || 0}`);
      console.log(`   - 失败: ${failedLLM[0]?.count || 0}`);
      console.log(`   - 队列中: ${queuedLLM[0]?.count || 0}`);
    }

    // 检查入库请求状态
    if (ingestCount[0]?.count > 0) {
      const [pendingIngests, approvedIngests, rejectedIngests] = await Promise.all([
        db.select({ count: count() }).from(ingests).where(eq(ingests.status, 'pending_review')),
        db.select({ count: count() }).from(ingests).where(eq(ingests.status, 'approved')),
        db.select({ count: count() }).from(ingests).where(eq(ingests.status, 'rejected'))
      ]);

      console.log('\n📋 入库请求状态:');
      console.log(`   - 待审核: ${pendingIngests[0]?.count || 0}`);
      console.log(`   - 已批准: ${approvedIngests[0]?.count || 0}`);
      console.log(`   - 已拒绝: ${rejectedIngests[0]?.count || 0}`);
    }

    // 诊断问题
    console.log('\n🔧 问题诊断:');
    
    if (toolsCount[0]?.count === 0) {
      console.log('❌ 主要问题：工具表为空');
      
      if (crawlCount[0]?.count === 0) {
        console.log('   - 爬取结果为空，爬虫可能还在运行或失败');
      } else if (llmCount[0]?.count === 0) {
        console.log('   - 有爬取结果但没有 LLM 任务，LLM 处理可能失败');
      } else if (ingestCount[0]?.count === 0) {
        console.log('   - 有 LLM 任务但没有入库请求，入库流程可能有问题');
      } else {
        console.log('   - 有入库请求但没有审核通过，需要手动审核');
      }
    } else {
      console.log('✅ 工具表有数据，前端显示问题可能在 API 或缓存');
    }

    // 提供解决方案
    console.log('\n💡 建议解决方案:');
    
    if (toolsCount[0]?.count === 0) {
      if (ingestCount[0]?.count > 0) {
        console.log('   1. 访问管理后台审核入库请求: http://localhost:3000/admin/ingests');
        console.log('   2. 或运行自动审核脚本');
      } else if (crawlCount[0]?.count > 0) {
        console.log('   1. 等待 LLM 处理完成');
        console.log('   2. 检查 DeepSeek API 配置');
      } else {
        console.log('   1. 等待爬虫任务完成');
        console.log('   2. 检查网络连接和 API 限制');
      }
    } else {
      console.log('   1. 检查 API 端点: http://localhost:3000/api/tools');
      console.log('   2. 清除缓存重新加载页面');
      console.log('   3. 检查工具状态是否为 approved');
    }

  } catch (error) {
    console.error('❌ 检查数据库失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  checkDbData()
    .then(() => {
      console.log('\n✅ 数据库检查完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 数据库检查失败:', error);
      process.exit(1);
    });
}

export { checkDbData };