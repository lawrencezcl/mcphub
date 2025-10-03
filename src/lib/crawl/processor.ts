import { db } from '@/db';
import { sources, crawlJobs, crawlResults, llmJobs } from '@/db/schema';
import { GitHubFetcher } from './fetchers/github';
import { NPMFetcher } from './fetchers/npm';
import { createLLMClient } from '../llm/client';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export interface CrawlJobResult {
  jobId: number;
  itemsFound: number;
  itemsProcessed: number;
  errors: number;
  duration: number;
}

export class CrawlProcessor {
  private githubFetcher: GitHubFetcher;
  private npmFetcher: NPMFetcher;
  private llmClient: ReturnType<typeof createLLMClient>;

  constructor() {
    this.githubFetcher = new GitHubFetcher(process.env.GITHUB_TOKEN);
    this.npmFetcher = new NPMFetcher();
    this.llmClient = createLLMClient();
  }

  async processCrawlJob(sourceId: number): Promise<CrawlJobResult> {
    const startTime = Date.now();
    let itemsFound = 0;
    let itemsProcessed = 0;
    let errors = 0;

    // 创建爬取任务记录
    const jobResult = await db.insert(crawlJobs).values({
      sourceId,
      status: 'running',
      startedAt: new Date(),
    }).returning({ id: crawlJobs.id });

    const jobId = jobResult[0].id;

    try {
      // 获取数据源配置
      const sourceResult = await db
        .select()
        .from(sources)
        .where(eq(sources.id, sourceId))
        .limit(1);

      if (sourceResult.length === 0) {
        throw new Error(`数据源 ${sourceId} 不存在`);
      }

      const source = sourceResult[0];

      // 根据数据源类型处理
      switch (source.type) {
        case 'github_topic':
          const githubResults = await this.processGitHubTopic(source.identifier, source.config);
          itemsFound = githubResults.length;
          
          for (const result of githubResults) {
            try {
              await this.saveCrawlResult(jobId, result);
              itemsProcessed++;
            } catch (error) {
              console.error('保存 GitHub 结果失败:', error);
              errors++;
            }
          }
          break;

        case 'npm_query':
          const npmResults = await this.processNPMQuery(source.identifier, source.config);
          itemsFound = npmResults.length;
          
          for (const result of npmResults) {
            try {
              await this.saveCrawlResult(jobId, result);
              itemsProcessed++;
            } catch (error) {
              console.error('保存 NPM 结果失败:', error);
              errors++;
            }
          }
          break;

        default:
          throw new Error(`不支持的数据源类型: ${source.type}`);
      }

      // 更新任务状态为完成
      const duration = Date.now() - startTime;
      await db.update(crawlJobs)
        .set({
          status: 'completed',
          finishedAt: new Date(),
          stats: {
            itemsFound,
            itemsProcessed,
            errors,
            duration,
          },
        })
        .where(eq(crawlJobs.id, jobId));

      return {
        jobId,
        itemsFound,
        itemsProcessed,
        errors,
        duration,
      };

    } catch (error) {
      console.error('爬取任务失败:', error);
      
      // 更新任务状态为失败
      await db.update(crawlJobs)
        .set({
          status: 'failed',
          finishedAt: new Date(),
          error: error instanceof Error ? error.message : '未知错误',
        })
        .where(eq(crawlJobs.id, jobId));

      throw error;
    }
  }

  private async processGitHubTopic(topic: string, config: any = {}): Promise<any[]> {
    const { minStars = 1, language = null } = config;
    const results = [];

    try {
      let query = `topic:${topic}`;
      if (language) {
        query += ` language:${language}`;
      }
      if (minStars > 0) {
        query += ` stars:>=${minStars}`;
      }

      const repos = await this.githubFetcher.searchRepositories(query, {
        sort: 'stars',
        per_page: 50,
      });

      for (const repo of repos) {
        try {
          // 使用增强的仓库信息获取方法
          const enhancedInfo = await this.githubFetcher.getEnhancedRepositoryInfo(
            repo.owner.login, 
            repo.name
          );

          // 检查是否与 MCP 相关
          if (!this.githubFetcher.isMCPRelated(repo, enhancedInfo.readme, enhancedInfo.packageJson)) {
            continue;
          }

          const installCmd = this.githubFetcher.extractInstallCommand(enhancedInfo.packageJson, repo);

          // 构建包含详细文档和配置信息的README
          const rawReadme = [
            enhancedInfo.readme,
            enhancedInfo.documentation.docs.join('\n\n---\n\n'),
            enhancedInfo.documentation.examples.join('\n\n---\n\n'),
            enhancedInfo.additionalFiles.join('\n\n---\n\n')
          ].filter(content => content && content.trim()).join('\n\n===\n\n');

          results.push({
            canonicalUrl: repo.html_url,
            rawTitle: repo.name,
            rawDescription: repo.description,
            rawReadme: rawReadme || '',
            rawMetadata: {
              type: 'github',
              stars: repo.stargazers_count,
              forks: repo.forks_count,
              language: repo.language,
              license: repo.license?.name,
              topics: repo.topics,
              author: repo.owner.login,
              homepage: repo.homepage,
              installCmd,
              packageName: enhancedInfo.packageJson?.name,
              createdAt: repo.created_at,
              updatedAt: repo.updated_at,
              // 添加增强的元数据
              hasReadme: !!enhancedInfo.readme,
              hasPackageJson: !!enhancedInfo.packageJson,
              hasDocumentation: enhancedInfo.documentation.docs.length > 0,
              hasExamples: enhancedInfo.documentation.examples.length > 0,
              hasConfigFiles: enhancedInfo.additionalFiles.length > 0,
              documentationCount: enhancedInfo.documentation.docs.length,
              exampleCount: enhancedInfo.documentation.examples.length,
              configFileCount: enhancedInfo.additionalFiles.length,
            },
          });
        } catch (error) {
          console.error(`处理仓库 ${repo.full_name} 失败:`, error);
        }
      }
    } catch (error) {
      console.error('GitHub topic 处理失败:', error);
      throw error;
    }

    return results;
  }

  private async processNPMQuery(query: string, config: any = {}): Promise<any[]> {
    const { minDownloads = 100 } = config;
    const results = [];

    try {
      const searchResults = await this.npmFetcher.searchPackages(query, {
        size: 50,
      });

      for (const searchResult of searchResults) {
        try {
          const pkg = searchResult.package;

          // 检查是否与 MCP 相关
          if (!this.npmFetcher.isMCPRelated(pkg)) {
            continue;
          }

          // 使用增强的包详情获取方法
          const enhancedDetails = await this.npmFetcher.getEnhancedPackageDetails(pkg.name);

          // 检查下载量阈值
          if (enhancedDetails.downloads < minDownloads) {
            continue;
          }

          const repoUrl = this.npmFetcher.extractRepositoryUrl(enhancedDetails.package);
          const author = this.npmFetcher.extractAuthor(enhancedDetails.package);
          const installCmd = this.npmFetcher.generateInstallCommand(pkg.name);

          // 构建包含详细README和仓库信息的结果
          const rawReadme = [
            enhancedDetails.readme,
            enhancedDetails.repositoryContent
          ].filter(Boolean).join('\n\n---\n\n');

          results.push({
            canonicalUrl: `https://www.npmjs.com/package/${pkg.name}`,
            rawTitle: pkg.name,
            rawDescription: pkg.description,
            rawReadme: rawReadme || '',
            rawMetadata: {
              type: 'npm',
              version: pkg.version,
              keywords: pkg.keywords,
              author,
              license: enhancedDetails.package.license,
              homepage: pkg.links.homepage,
              repository: repoUrl,
              downloads: enhancedDetails.downloads,
              installCmd,
              packageName: pkg.name,
              createdAt: enhancedDetails.package.time.created,
              updatedAt: enhancedDetails.package.time.modified,
              score: searchResult.score,
              // 添加增强的元数据
              hasReadme: !!enhancedDetails.readme,
              hasRepositoryInfo: !!enhancedDetails.repositoryContent,
              repositoryType: repoUrl?.includes('github.com') ? 'github' : 'other',
            },
          });
        } catch (error) {
          console.error(`处理包 ${searchResult.package.name} 失败:`, error);
        }
      }
    } catch (error) {
      console.error('NPM query 处理失败:', error);
      throw error;
    }

    return results;
  }

  private async saveCrawlResult(jobId: number, result: any): Promise<void> {
    // 生成去重哈希
    const dedupeHash = crypto
      .createHash('md5')
      .update(result.canonicalUrl)
      .digest('hex');

    try {
      // 保存爬取结果
      const crawlResult = await db.insert(crawlResults).values({
        jobId,
        canonicalUrl: result.canonicalUrl,
        rawTitle: result.rawTitle,
        rawDescription: result.rawDescription,
        rawReadme: result.rawReadme,
        rawMetadata: result.rawMetadata,
        dedupeHash,
      }).returning({ id: crawlResults.id });

      // 创建 LLM 处理任务
      await db.insert(llmJobs).values({
        resultId: crawlResult[0].id,
        status: 'queued',
        model: 'deepseek-chat',
        promptVersion: '1.0',
      });

    } catch (error) {
      // 如果是重复数据，忽略错误
      if (error instanceof Error && error.message.includes('duplicate')) {
        console.log(`跳过重复数据: ${result.canonicalUrl}`);
        return;
      }
      throw error;
    }
  }

  // 处理 LLM 任务队列
  async processLLMQueue(limit: number = 10): Promise<void> {
    const pendingJobs = await db
      .select({
        id: llmJobs.id,
        resultId: llmJobs.resultId,
      })
      .from(llmJobs)
      .where(eq(llmJobs.status, 'queued'))
      .limit(limit);

    for (const job of pendingJobs) {
      try {
        await this.processLLMJob(job.id, job.resultId);
      } catch (error) {
        console.error(`LLM 任务 ${job.id} 处理失败:`, error);
      }
    }
  }

  private async processLLMJob(jobId: number, resultId: number): Promise<void> {
    try {
      // 更新任务状态
      await db.update(llmJobs)
        .set({ status: 'running' })
        .where(eq(llmJobs.id, jobId));

      // 获取爬取结果
      const result = await db
        .select()
        .from(crawlResults)
        .where(eq(crawlResults.id, resultId))
        .limit(1);

      if (result.length === 0) {
        throw new Error(`爬取结果 ${resultId} 不存在`);
      }

      const crawlResult = result[0];

      // 使用 LLM 处理内容
      const llmOutput = await this.llmClient.processToolData({
        title: crawlResult.rawTitle || '',
        description: crawlResult.rawDescription || '',
        readme: crawlResult.rawReadme || '',
        metadata: crawlResult.rawMetadata,
      });

      // 更新 LLM 任务结果
      await db.update(llmJobs)
        .set({
          status: 'completed',
          output: llmOutput,
          finishedAt: new Date(),
        })
        .where(eq(llmJobs.id, jobId));

    } catch (error) {
      console.error('LLM 任务处理失败:', error);
      
      await db.update(llmJobs)
        .set({
          status: 'failed',
          error: error instanceof Error ? error.message : '未知错误',
          finishedAt: new Date(),
        })
        .where(eq(llmJobs.id, jobId));

      throw error;
    }
  }
}