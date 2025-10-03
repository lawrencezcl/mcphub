import { GitHubFetcher } from './github';
import { NPMFetcher } from './npm';
import { ErrorHandler, createErrorHandler, MCPCrawlerError, ErrorType, ErrorSeverity } from '../error-handler';

// 信息源类型定义
export enum InformationChannelType {
  OFFICIAL_DOCS = 'official_docs',
  TECH_FORUM = 'tech_forum',
  COMMUNITY_DISCUSSION = 'community_discussion',
  BLOG_ARTICLE = 'blog_article',
  VIDEO_TUTORIAL = 'video_tutorial',
  SOCIAL_MEDIA = 'social_media',
  GITHUB_ISSUES = 'github_issues',
  STACKOVERFLOW = 'stackoverflow',
  REDDIT = 'reddit',
  HACKERNEWS = 'hackernews'
}

// 统一的信息结构
export interface CollectedInformation {
  source: InformationChannelType;
  url: string;
  title: string;
  content: string;
  author?: string;
  publishDate?: Date;
  score?: number;
  tags?: string[];
  metadata?: Record<string, any>;
  reliability: number; // 0-1 可靠性评分
}

// 多渠道采集配置
export interface MultiChannelConfig {
  toolName: string;
  channels: InformationChannelType[];
  maxResultsPerChannel?: number;
  timeoutMs?: number;
  includeRelatedTerms?: boolean;
  language?: 'en' | 'zh' | 'all';
}

// 官方文档获取器
export class OfficialDocsFetcher {
  async fetchDocumentation(toolName: string): Promise<CollectedInformation[]> {
    const results: CollectedInformation[] = [];
    
    // 常见的官方文档模式
    const docPatterns = [
      `https://${toolName}.dev`,
      `https://docs.${toolName}.com`,
      `https://${toolName}.readthedocs.io`,
      `https://${toolName}.github.io`,
      `https://www.${toolName}.org/docs`,
    ];

    for (const url of docPatterns) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'MCPHub-Bot/1.0 (+https://mcphub.vercel.app)'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          const html = await response.text();
          const content = this.extractDocContent(html);
          
          if (content.length > 100) { // 确保有实质内容
            results.push({
              source: InformationChannelType.OFFICIAL_DOCS,
              url,
              title: this.extractTitle(html) || `${toolName} Official Documentation`,
              content,
              reliability: 0.95, // 官方文档可靠性最高
              metadata: {
                contentLength: content.length,
                hasCodeExamples: content.includes('```') || content.includes('<code>'),
                hasInstallInstructions: /install|npm|pip|yarn|setup/i.test(content)
              }
            });
          }
        }
      } catch (error) {
        console.warn(`Failed to fetch docs from ${url}:`, error);
      }
    }

    return results;
  }

  private extractDocContent(html: string): string {
    // 移除HTML标签，保留文本内容
    const textContent = html
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 提取主要内容区域（通常在body中间部分）
    const lines = textContent.split('\n');
    const contentStart = Math.floor(lines.length * 0.1);
    const contentEnd = Math.floor(lines.length * 0.9);
    
    return lines.slice(contentStart, contentEnd).join('\n').substring(0, 5000);
  }

  private extractTitle(html: string): string | null {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : null;
  }
}

// Stack Overflow 获取器
export class StackOverflowFetcher {
  private apiKey?: string;
  private baseUrl = 'https://api.stackexchange.com/2.3';

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  async searchQuestions(toolName: string, maxResults: number = 10): Promise<CollectedInformation[]> {
    const results: CollectedInformation[] = [];
    
    try {
      const params = new URLSearchParams({
        order: 'desc',
        sort: 'votes',
        intitle: toolName,
        site: 'stackoverflow',
        pagesize: maxResults.toString(),
        filter: 'withbody'
      });

      if (this.apiKey) {
        params.append('key', this.apiKey);
      }

      const response = await fetch(`${this.baseUrl}/questions?${params}`);
      
      if (!response.ok) {
        throw new Error(`StackOverflow API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      for (const question of data.items || []) {
        results.push({
          source: InformationChannelType.STACKOVERFLOW,
          url: question.link,
          title: question.title,
          content: this.cleanHtmlContent(question.body || ''),
          author: question.owner?.display_name,
          publishDate: new Date(question.creation_date * 1000),
          score: question.score,
          tags: question.tags,
          reliability: Math.min(0.8, 0.5 + (question.score / 100)), // 基于投票数计算可靠性
          metadata: {
            answerCount: question.answer_count,
            viewCount: question.view_count,
            isAnswered: question.is_answered
          }
        });
      }
    } catch (error) {
      console.error('StackOverflow fetch error:', error);
    }

    return results;
  }

  private cleanHtmlContent(html: string): string {
    return html
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 2000);
  }
}

// Reddit 获取器
export class RedditFetcher {
  private baseUrl = 'https://www.reddit.com';

  async searchPosts(toolName: string, maxResults: number = 10): Promise<CollectedInformation[]> {
    const results: CollectedInformation[] = [];
    
    try {
      // 搜索相关subreddits
      const subreddits = ['programming', 'javascript', 'node', 'webdev', 'MachineLearning', 'artificial'];
      
      for (const subreddit of subreddits) {
        const searchUrl = `${this.baseUrl}/r/${subreddit}/search.json?q=${encodeURIComponent(toolName)}&sort=top&limit=${Math.ceil(maxResults / subreddits.length)}`;
        
        const response = await fetch(searchUrl, {
          headers: {
            'User-Agent': 'MCPHub-Bot/1.0'
          }
        });

        if (response.ok) {
          const data = await response.json();
          
          for (const post of data.data?.children || []) {
            const postData = post.data;
            
            if (postData.selftext && postData.selftext.length > 50) {
              results.push({
                source: InformationChannelType.REDDIT,
                url: `https://reddit.com${postData.permalink}`,
                title: postData.title,
                content: postData.selftext.substring(0, 2000),
                author: postData.author,
                publishDate: new Date(postData.created_utc * 1000),
                score: postData.score,
                reliability: Math.min(0.7, 0.3 + (postData.score / 50)), // Reddit内容可靠性相对较低
                metadata: {
                  subreddit: postData.subreddit,
                  commentCount: postData.num_comments,
                  upvoteRatio: postData.upvote_ratio
                }
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Reddit fetch error:', error);
    }

    return results;
  }
}

// GitHub Issues 获取器
export class GitHubIssuesFetcher {
  private githubFetcher: GitHubFetcher;

  constructor(apiKey?: string) {
    this.githubFetcher = new GitHubFetcher(apiKey);
  }

  async searchIssues(toolName: string, maxResults: number = 10): Promise<CollectedInformation[]> {
    const results: CollectedInformation[] = [];
    
    try {
      // 首先搜索相关仓库
      const repos = await this.githubFetcher.searchRepositories(toolName, { per_page: 5 });
      
      for (const repo of repos) {
        const issuesUrl = `https://api.github.com/repos/${repo.full_name}/issues?state=all&sort=comments&per_page=${Math.ceil(maxResults / repos.length)}`;
        
        const response = await fetch(issuesUrl, {
          headers: {
            'Authorization': process.env.GITHUB_TOKEN ? `token ${process.env.GITHUB_TOKEN}` : '',
            'Accept': 'application/vnd.github.v3+json'
          }
        });

        if (response.ok) {
          const issues = await response.json();
          
          for (const issue of issues) {
            if (issue.body && issue.body.length > 100) {
              results.push({
                source: InformationChannelType.GITHUB_ISSUES,
                url: issue.html_url,
                title: issue.title,
                content: issue.body.substring(0, 2000),
                author: issue.user?.login,
                publishDate: new Date(issue.created_at),
                reliability: 0.75, // GitHub issues 有一定可靠性
                metadata: {
                  repository: repo.full_name,
                  state: issue.state,
                  commentCount: issue.comments,
                  labels: issue.labels?.map((l: any) => l.name) || []
                }
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('GitHub Issues fetch error:', error);
    }

    return results;
  }
}

// 主要的多渠道信息收集器
export class EnhancedMultiChannelFetcher {
  private officialDocsFetcher: OfficialDocsFetcher;
  private stackOverflowFetcher: StackOverflowFetcher;
  private redditFetcher: RedditFetcher;
  private githubIssuesFetcher: GitHubIssuesFetcher;
  private errorHandler: ErrorHandler;

  constructor(config: {
    githubToken?: string;
    stackOverflowKey?: string;
  } = {}) {
    this.officialDocsFetcher = new OfficialDocsFetcher();
    this.stackOverflowFetcher = new StackOverflowFetcher(config.stackOverflowKey);
    this.redditFetcher = new RedditFetcher();
    this.githubIssuesFetcher = new GitHubIssuesFetcher(config.githubToken);
    this.errorHandler = createErrorHandler();
  }

  async collectInformation(config: MultiChannelConfig): Promise<CollectedInformation[]> {
    const { toolName, channels, maxResultsPerChannel = 10, timeoutMs = 30000 } = config;
    
    return this.errorHandler.executeWithRetry(async () => {
      const allResults: CollectedInformation[] = [];

      // 并行收集各渠道信息，每个渠道都有独立的错误处理
      const fetchPromises: Promise<CollectedInformation[]>[] = [];

      if (channels.includes(InformationChannelType.OFFICIAL_DOCS)) {
        fetchPromises.push(
          this.errorHandler.executeWithRetry(
            () => this.officialDocsFetcher.fetchDocumentation(toolName),
            `官方文档收集-${toolName}`
          ).catch(error => {
            console.warn(`官方文档收集失败: ${error.message}`);
            return [];
          })
        );
      }

      if (channels.includes(InformationChannelType.STACKOVERFLOW)) {
        fetchPromises.push(
          this.errorHandler.executeWithRetry(
            () => this.stackOverflowFetcher.searchQuestions(toolName, maxResultsPerChannel),
            `StackOverflow搜索-${toolName}`
          ).catch(error => {
            console.warn(`StackOverflow搜索失败: ${error.message}`);
            return [];
          })
        );
      }

      if (channels.includes(InformationChannelType.REDDIT)) {
        fetchPromises.push(
          this.errorHandler.executeWithRetry(
            () => this.redditFetcher.searchPosts(toolName, maxResultsPerChannel),
            `Reddit搜索-${toolName}`
          ).catch(error => {
            console.warn(`Reddit搜索失败: ${error.message}`);
            return [];
          })
        );
      }

      if (channels.includes(InformationChannelType.GITHUB_ISSUES)) {
        fetchPromises.push(
          this.errorHandler.executeWithRetry(
            () => this.githubIssuesFetcher.searchIssues(toolName, maxResultsPerChannel),
            `GitHub Issues搜索-${toolName}`
          ).catch(error => {
            console.warn(`GitHub Issues搜索失败: ${error.message}`);
            return [];
          })
        );
      }

      // 设置超时
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new MCPCrawlerError(
            ErrorType.TIMEOUT_ERROR,
            `信息收集超时 (${timeoutMs}ms)`,
            ErrorSeverity.MEDIUM,
            { toolName, channels, timeoutMs }
          ));
        }, timeoutMs);
      });

      // 等待所有请求完成或超时
      const results = await Promise.race([
        Promise.allSettled(fetchPromises),
        timeoutPromise
      ]);
      
      for (const result of results as PromiseSettledResult<CollectedInformation[]>[]) {
        if (result.status === 'fulfilled') {
          allResults.push(...result.value);
        } else {
          await this.errorHandler.handleError(result.reason, `渠道信息收集-${toolName}`);
        }
      }

      if (allResults.length === 0) {
        throw new MCPCrawlerError(
          ErrorType.INVALID_RESPONSE,
          `未能从任何渠道收集到 ${toolName} 的信息`,
          ErrorSeverity.HIGH,
          { toolName, channels }
        );
      }

      // 按可靠性和相关性排序
      return allResults.sort((a, b) => {
        const scoreA = a.reliability * (a.score || 1);
        const scoreB = b.reliability * (b.score || 1);
        return scoreB - scoreA;
      });
    }, `多渠道信息收集-${toolName}`);
  }

  // 生成信息收集报告
  generateCollectionReport(results: CollectedInformation[]): {
    summary: {
      totalSources: number;
      channelBreakdown: Record<string, number>;
      averageReliability: number;
      topSources: CollectedInformation[];
    };
    recommendations: string[];
  } {
    const channelBreakdown: Record<string, number> = {};
    let totalReliability = 0;

    for (const result of results) {
      channelBreakdown[result.source] = (channelBreakdown[result.source] || 0) + 1;
      totalReliability += result.reliability;
    }

    const averageReliability = results.length > 0 ? totalReliability / results.length : 0;
    const topSources = results.slice(0, 5);

    const recommendations: string[] = [];
    
    if (averageReliability < 0.6) {
      recommendations.push('建议增加官方文档渠道以提高信息可靠性');
    }
    
    if (results.length < 10) {
      recommendations.push('信息源较少，建议扩展搜索范围或关键词');
    }

    if (!channelBreakdown[InformationChannelType.OFFICIAL_DOCS]) {
      recommendations.push('缺少官方文档信息，建议手动补充');
    }

    return {
      summary: {
        totalSources: results.length,
        channelBreakdown,
        averageReliability,
        topSources
      },
      recommendations
    };
  }
}