import { db } from '../src/db';
import { llmJobs, ingests } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function createIngests(limit = 200) {
  console.log('🔍 开始为已完成的 LLM 任务创建入库请求...');

  try {
    // 查询已完成的 LLM 任务
    const completedLLMJobs = await db
      .select({ id: llmJobs.id })
      .from(llmJobs)
      .where(eq(llmJobs.status, 'completed'))
      .limit(limit);

    if (completedLLMJobs.length === 0) {
      console.log('❌ 没有已完成的 LLM 任务');
      return { created: 0 };
    }

    let createdIngests = 0;

    for (const job of completedLLMJobs) {
      try {
        // 检查是否已存在入库请求
        const existing = await db
          .select({ id: ingests.id })
          .from(ingests)
          .where(eq(ingests.llmJobId, job.id))
          .limit(1);

        if (existing.length > 0) {
          continue; // 已存在则跳过
        }

        // 创建入库请求
        await db.insert(ingests).values({
          llmJobId: job.id,
          status: 'pending_review',
          createdAt: new Date(),
        });

        createdIngests++;
      } catch (error) {
        console.error(`❌ 创建入库请求失败 (LLM Job ${job.id}):`, error);
      }
    }

    console.log(`✅ 本次共创建 ${createdIngests} 个入库请求`);
    if (createdIngests > 0) {
      console.log('👉 现在可以运行自动审核脚本：npm run ingests:auto-approve');
    }

    return { created: createdIngests };
  } catch (error) {
    console.error('❌ 入库请求创建流程失败:', error);
    throw error;
  }
}

if (require.main === module) {
  createIngests()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { createIngests };