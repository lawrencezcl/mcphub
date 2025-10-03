import { db } from '../src/db';
import { ingests, llmJobs, crawlResults, tools, toolTags, toolCategories, tags, categories } from '../src/db/schema';
import { eq, and } from 'drizzle-orm';

async function autoApproveIngests() {
  console.log('🤖 开始自动审核入库请求...');

  try {
    // 获取待审核的入库请求
    const pendingIngests = await db
      .select({
        id: ingests.id,
        llmJobId: ingests.llmJobId,
        llmOutput: llmJobs.output,
        crawlResult: {
          id: crawlResults.id,
          canonicalUrl: crawlResults.canonicalUrl,
          rawTitle: crawlResults.rawTitle,
          rawDescription: crawlResults.rawDescription,
          rawMetadata: crawlResults.rawMetadata,
        },
      })
      .from(ingests)
      .innerJoin(llmJobs, eq(ingests.llmJobId, llmJobs.id))
      .innerJoin(crawlResults, eq(llmJobs.resultId, crawlResults.id))
      .where(eq(ingests.status, 'pending_review'))
      .limit(50); // 限制数量

    if (pendingIngests.length === 0) {
      console.log('❌ 没有待审核的入库请求');
      return;
    }

    console.log(`📋 找到 ${pendingIngests.length} 个待审核的入库请求`);

    let approvedCount = 0;
    let rejectedCount = 0;

    for (const ingest of pendingIngests) {
      try {
        const llmOutput = ingest.llmOutput;
        const crawlResult = ingest.crawlResult;
        const metadata = crawlResult.rawMetadata;

        // 自动审核规则
        const shouldApprove = evaluateForApproval(llmOutput, crawlResult, metadata);

        if (shouldApprove) {
          // 批准并创建工具
          await approveIngest(ingest);
          approvedCount++;
          console.log(`✅ 批准: ${crawlResult.rawTitle}`);
        } else {
          // 拒绝
          await db.update(ingests)
            .set({
              status: 'rejected',
              reason: '自动审核：不符合质量标准',
              updatedAt: new Date(),
            })
            .where(eq(ingests.id, ingest.id));
          
          rejectedCount++;
          console.log(`❌ 拒绝: ${crawlResult.rawTitle}`);
        }

      } catch (error) {
        console.error(`❌ 处理入库请求 ${ingest.id} 失败:`, error);
      }
    }

    console.log(`\n🎉 自动审核完成！`);
    console.log(`   - 批准: ${approvedCount}`);
    console.log(`   - 拒绝: ${rejectedCount}`);

    if (approvedCount > 0) {
      console.log('\n🎯 建议下一步:');
      console.log('   1. 访问前端查看工具: http://localhost:3000/tools');
      console.log('   2. 检查工具详情页面');
      console.log('   3. 继续运行爬取任务获取更多数据');
    }

  } catch (error) {
    console.error('❌ 自动审核失败:', error);
    throw error;
  }
}

function evaluateForApproval(llmOutput: any, crawlResult: any, metadata: any): boolean {
  try {
    // 基本质量检查
    if (!llmOutput || !llmOutput.summary || !crawlResult.rawTitle) {
      return false;
    }

    // 检查是否与 MCP 相关
    const title = crawlResult.rawTitle.toLowerCase();
    const description = (crawlResult.rawDescription || '').toLowerCase();
    const summary = llmOutput.summary.toLowerCase();
    
    const mcpKeywords = ['mcp', 'model context protocol', 'context protocol', 'anthropic', 'claude'];
    const hasMCPKeyword = mcpKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword) || summary.includes(keyword)
    );

    // 如果明确与 MCP 相关，优先批准
    if (hasMCPKeyword) {
      return true;
    }

    // 检查是否是高质量的 AI/开发工具
    const aiKeywords = ['ai', 'llm', 'gpt', 'openai', 'machine learning', 'natural language', 'chatbot'];
    const devKeywords = ['api', 'sdk', 'cli', 'tool', 'library', 'framework'];
    
    const hasAIKeyword = aiKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword) || summary.includes(keyword)
    );
    
    const hasDevKeyword = devKeywords.some(keyword => 
      title.includes(keyword) || description.includes(keyword) || summary.includes(keyword)
    );

    // 检查受欢迎程度
    let popularityScore = 0;
    if (metadata.type === 'github' && metadata.stars) {
      popularityScore = metadata.stars;
    } else if (metadata.type === 'npm' && metadata.downloads) {
      popularityScore = metadata.downloads / 1000; // 转换为相对分数
    }

    // 综合评分
    let score = 0;
    
    if (hasMCPKeyword) score += 50;
    if (hasAIKeyword) score += 30;
    if (hasDevKeyword) score += 20;
    if (popularityScore > 10) score += 20;
    if (popularityScore > 100) score += 30;
    if (llmOutput.summary.length > 100) score += 10;
    if (llmOutput.tags && llmOutput.tags.length > 0) score += 10;
    if (metadata.license) score += 5;
    if (metadata.repository || metadata.homepage) score += 5;

    // 质量阈值
    return score >= 40;

  } catch (error) {
    console.error('评估失败:', error);
    return false;
  }
}

async function approveIngest(ingest: any) {
  const llmOutput = ingest.llmOutput;
  const crawlResult = ingest.crawlResult;
  const metadata = crawlResult.rawMetadata;

  // 生成工具 slug
  const slug = generateSlug(crawlResult.rawTitle);

  // 创建工具记录
  const toolResult = await db.insert(tools).values({
    slug,
    name: crawlResult.rawTitle,
    description: llmOutput.summary || crawlResult.rawDescription,
    repoUrl: metadata.repository || crawlResult.canonicalUrl,
    homepageUrl: metadata.homepage,
    packageName: metadata.packageName,
    installCmd: metadata.installCmd,
    runtimeSupport: llmOutput.runtimeSupport || { node: true },
    author: metadata.author,
    license: metadata.license,
    version: metadata.version,
    status: 'approved',
    sourceScore: calculateSourceScore(metadata),
    popularityScore: calculatePopularityScore(metadata),
    qualityScore: '0.8', // 自动审核的默认质量分数
  }).returning({ id: tools.id });

  const toolId = toolResult[0].id;

  // 处理标签
  if (llmOutput.tags && llmOutput.tags.length > 0) {
    for (const tagName of llmOutput.tags.slice(0, 5)) { // 最多5个标签
      try {
        const tagSlug = generateSlug(tagName);
        
        // 创建或获取标签
        let tagId;
        const existingTag = await db
          .select({ id: tags.id })
          .from(tags)
          .where(eq(tags.slug, tagSlug))
          .limit(1);

        if (existingTag.length > 0) {
          tagId = existingTag[0].id;
        } else {
          const newTag = await db.insert(tags).values({
            name: tagName,
            slug: tagSlug,
            color: generateRandomColor(),
          }).returning({ id: tags.id });
          tagId = newTag[0].id;
        }

        // 关联工具和标签
        await db.insert(toolTags).values({
          toolId,
          tagId,
        }).onConflictDoNothing();
      } catch (error) {
        console.error(`标签处理失败: ${tagName}`, error);
      }
    }
  }

  // 处理分类
  if (llmOutput.category) {
    try {
      const categorySlug = generateSlug(llmOutput.category);
      
      const existingCategory = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, categorySlug))
        .limit(1);

      if (existingCategory.length > 0) {
        await db.insert(toolCategories).values({
          toolId,
          categoryId: existingCategory[0].id,
        }).onConflictDoNothing();
      }
    } catch (error) {
      console.error(`分类处理失败: ${llmOutput.category}`, error);
    }
  }

  // 更新入库记录
  await db.update(ingests)
    .set({
      status: 'approved',
      toolId,
      reason: '自动审核通过',
      updatedAt: new Date(),
    })
    .where(eq(ingests.id, ingest.id));
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
    .substring(0, 50);
}

function calculateSourceScore(metadata: any): number {
  let score = 50;

  if (metadata.type === 'github') {
    score += Math.min(metadata.stars || 0, 50);
    score += Math.min((metadata.forks || 0) * 2, 25);
  } else if (metadata.type === 'npm') {
    score += Math.min((metadata.downloads || 0) / 1000, 50);
  }

  return Math.min(score, 100);
}

function calculatePopularityScore(metadata: any): number {
  if (metadata.type === 'github') {
    return Math.min((metadata.stars || 0) * 2, 100);
  } else if (metadata.type === 'npm') {
    return Math.min((metadata.downloads || 0) / 500, 100);
  }
  return 0;
}

function generateRandomColor(): string {
  const colors = [
    '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
    '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
    '#ec4899', '#6366f1', '#14b8a6', '#eab308'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// 如果直接运行此脚本
if (require.main === module) {
  autoApproveIngests()
    .then(() => {
      console.log('\n✅ 自动审核完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 自动审核失败:', error);
      process.exit(1);
    });
}

export { autoApproveIngests };