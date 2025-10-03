import { EnhancedMultiChannelFetcher, MultiChannelConfig, CollectedInformation } from './fetchers/enhanced-multi-channel';
import { InformationProcessor, ProcessedInformation, DeduplicationConfig } from './information-processor';
import { DeepSeekFormatter, FormattedReport, FormattingOptions, DeepSeekConfig } from './deepseek-formatter';

// 报告生成配置
export interface ReportGenerationConfig {
  // 多渠道配置
  multiChannel: {
    githubToken?: string;
    stackOverflowKey?: string;
  };
  
  // 去重配置
  deduplication: DeduplicationConfig;
  
  // DeepSeek配置
  deepseek: DeepSeekConfig;
  
  // 格式化选项
  formatting: Partial<FormattingOptions>;
  
  // 其他选项
  options: {
    maxRetries: number;
    retryDelay: number;
    enableCache: boolean;
    cacheExpiry: number; // 小时
    enableLogging: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
}

// 生成进度回调
export interface ProgressCallback {
  (stage: string, progress: number, message: string): void;
}

// 生成结果
export interface GenerationResult {
  success: boolean;
  report?: FormattedReport;
  error?: string;
  metadata: {
    toolName: string;
    startTime: Date;
    endTime: Date;
    duration: number; // 毫秒
    stages: {
      collection: { duration: number; itemsFound: number };
      processing: { duration: number; itemsProcessed: number };
      formatting: { duration: number; success: boolean };
    };
    performance: {
      totalApiCalls: number;
      totalDataSize: number; // 字节
      cacheHits: number;
      retries: number;
    };
  };
  logs: string[];
}

// 缓存项
interface CacheItem {
  data: any;
  timestamp: Date;
  expiry: Date;
}

// 主要的报告生成器
export class ToolReportGenerator {
  private fetcher: EnhancedMultiChannelFetcher;
  private processor: InformationProcessor;
  private formatter: DeepSeekFormatter;
  private config: ReportGenerationConfig;
  private cache: Map<string, CacheItem> = new Map();
  private logs: string[] = [];

  constructor(config: ReportGenerationConfig) {
    this.config = config;
    this.fetcher = new EnhancedMultiChannelFetcher(config.multiChannel);
    this.processor = new InformationProcessor();
    this.formatter = new DeepSeekFormatter(config.deepseek);
  }

  // 生成单个工具报告
  async generateReport(
    toolName: string,
    progressCallback?: ProgressCallback
  ): Promise<GenerationResult> {
    const startTime = new Date();
    const logs: string[] = [];
    let totalApiCalls = 0;
    let totalDataSize = 0;
    let cacheHits = 0;
    const retries = 0;

    const updateProgress = (stage: string, progress: number, message: string) => {
      const logMessage = `[${stage}] ${progress}% - ${message}`;
      logs.push(logMessage);
      if (this.config.options.enableLogging) {
        console.log(logMessage);
      }
      progressCallback?.(stage, progress, message);
    };

    try {
      updateProgress('初始化', 0, `开始生成工具 "${toolName}" 的报告`);

      // 验证DeepSeek连接
      updateProgress('验证', 5, '验证DeepSeek API连接');
      const isConnected = await this.formatter.validateConnection();
      if (!isConnected) {
        throw new Error('DeepSeek API连接失败');
      }
      totalApiCalls++;

      // 阶段1: 信息收集
      updateProgress('收集', 10, '开始多渠道信息收集');
      const collectionStart = Date.now();
      
      let collectedInfo: CollectedInformation[];
      const cacheKey = `collection_${toolName}`;
      
      if (this.config.options.enableCache && this.isCacheValid(cacheKey)) {
        collectedInfo = this.getFromCache(cacheKey);
        cacheHits++;
        updateProgress('收集', 30, '从缓存获取信息');
      } else {
        collectedInfo = await this.retryOperation(
          () => this.fetcher.collectInformation({
            toolName,
            channels: ['official_docs', 'stackoverflow', 'reddit', 'github_issues'] as any,
            maxResultsPerChannel: 10,
            timeoutMs: 30000,
            includeRelatedTerms: true,
            language: 'all'
          }),
          '信息收集',
          updateProgress
        );
        
        if (this.config.options.enableCache) {
          this.setCache(cacheKey, collectedInfo);
        }
        
        totalApiCalls += this.estimateApiCalls(collectedInfo);
        totalDataSize += this.calculateDataSize(collectedInfo);
      }
      
      const collectionDuration = Date.now() - collectionStart;
      updateProgress('收集', 40, `收集完成，获得 ${collectedInfo.length} 条信息`);

      // 阶段2: 信息处理
      updateProgress('处理', 45, '开始信息去重和整理');
      const processingStart = Date.now();
      
      const processedInfo = await this.retryOperation(
        () => this.processor.processInformation(collectedInfo, this.config.deduplication),
        '信息处理',
        updateProgress
      );
      
      const processingDuration = Date.now() - processingStart;
      updateProgress('处理', 70, `处理完成，整理出 ${processedInfo.length} 个信息组`);

      // 生成处理报告
      const processingReport = this.processor.generateProcessingReport(collectedInfo, processedInfo);
      logs.push(`处理报告: 原始${processingReport.summary.originalCount}条，处理后${processingReport.summary.processedCount}条`);
      logs.push(`去重率: ${(processingReport.summary.deduplicationRate * 100).toFixed(1)}%`);
      logs.push(`平均可靠性: ${(processingReport.summary.averageReliability * 100).toFixed(1)}%`);

      // 阶段3: 智能格式化
      updateProgress('格式化', 75, '开始DeepSeek智能格式化');
      const formattingStart = Date.now();
      
      const formattedReport = await this.retryOperation(
        () => this.formatter.formatToolReport(toolName, processedInfo, this.config.formatting),
        'DeepSeek格式化',
        updateProgress
      );
      
      const formattingDuration = Date.now() - formattingStart;
      totalApiCalls += this.estimateFormattingApiCalls(processedInfo);
      
      updateProgress('完成', 100, '报告生成完成');

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      return {
        success: true,
        report: formattedReport,
        metadata: {
          toolName,
          startTime,
          endTime,
          duration,
          stages: {
            collection: { 
              duration: collectionDuration, 
              itemsFound: collectedInfo.length 
            },
            processing: { 
              duration: processingDuration, 
              itemsProcessed: processedInfo.length 
            },
            formatting: { 
              duration: formattingDuration, 
              success: true 
            }
          },
          performance: {
            totalApiCalls,
            totalDataSize,
            cacheHits,
            retries
          }
        },
        logs
      };

    } catch (error: any) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      updateProgress('错误', 0, `生成失败: ${error.message}`);
      
      return {
        success: false,
        error: error.message,
        metadata: {
          toolName,
          startTime,
          endTime,
          duration,
          stages: {
            collection: { duration: 0, itemsFound: 0 },
            processing: { duration: 0, itemsProcessed: 0 },
            formatting: { duration: 0, success: false }
          },
          performance: {
            totalApiCalls,
            totalDataSize,
            cacheHits,
            retries
          }
        },
        logs
      };
    }
  }

  // 批量生成报告
  async generateMultipleReports(
    toolNames: string[],
    progressCallback?: ProgressCallback
  ): Promise<GenerationResult[]> {
    const results: GenerationResult[] = [];
    const totalTools = toolNames.length;

    for (let i = 0; i < totalTools; i++) {
      const toolName = toolNames[i];
      const overallProgress = Math.floor((i / totalTools) * 100);
      
      progressCallback?.('批量处理', overallProgress, `处理工具 ${i + 1}/${totalTools}: ${toolName}`);
      
      try {
        const result = await this.generateReport(toolName, (stage, progress, message) => {
          const adjustedProgress = overallProgress + Math.floor(progress / totalTools);
          progressCallback?.(stage, adjustedProgress, `[${toolName}] ${message}`);
        });
        
        results.push(result);
        
        // 添加延迟以避免API限制
        if (i < totalTools - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.options.retryDelay));
        }
        
      } catch (error: any) {
        results.push({
          success: false,
          error: error.message,
          metadata: {
            toolName,
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
            stages: {
              collection: { duration: 0, itemsFound: 0 },
              processing: { duration: 0, itemsProcessed: 0 },
              formatting: { duration: 0, success: false }
            },
            performance: {
              totalApiCalls: 0,
              totalDataSize: 0,
              cacheHits: 0,
              retries: 0
            }
          },
          logs: [`批量处理中出现错误: ${error.message}`]
        });
      }
    }

    progressCallback?.('批量处理', 100, `完成处理 ${totalTools} 个工具`);
    return results;
  }

  // 重试机制
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    progressCallback?: (stage: string, progress: number, message: string) => void
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.options.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        if (attempt < this.config.options.maxRetries) {
          const delay = this.config.options.retryDelay * attempt;
          progressCallback?.(operationName, 0, `第${attempt}次尝试失败，${delay}ms后重试`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new Error(`${operationName}失败，已重试${this.config.options.maxRetries}次: ${lastError!.message}`);
  }

  // 缓存管理
  private isCacheValid(key: string): boolean {
    const item = this.cache.get(key);
    return item !== undefined && new Date() < item.expiry;
  }

  private getFromCache<T>(key: string): T {
    const item = this.cache.get(key);
    return item!.data as T;
  }

  private setCache(key: string, data: any): void {
    const now = new Date();
    const expiry = new Date(now.getTime() + this.config.options.cacheExpiry * 60 * 60 * 1000);
    
    this.cache.set(key, {
      data,
      timestamp: now,
      expiry
    });
  }

  // 清理过期缓存
  private cleanupCache(): void {
    const now = new Date();
    for (const [key, item] of this.cache.entries()) {
      if (now >= item.expiry) {
        this.cache.delete(key);
      }
    }
  }

  // 估算API调用次数
  private estimateApiCalls(collectedInfo: CollectedInformation[]): number {
    // 基于信息源数量和类型估算
    return collectedInfo.length * 0.5; // 平均每个信息源0.5次API调用
  }

  private estimateFormattingApiCalls(processedInfo: ProcessedInformation[]): number {
    // DeepSeek格式化通常需要多次API调用
    return Math.max(5, processedInfo.length * 2);
  }

  // 计算数据大小
  private calculateDataSize(collectedInfo: CollectedInformation[]): number {
    return collectedInfo.reduce((total, info) => {
      return total + (info.content?.length || 0) + (info.title?.length || 0);
    }, 0);
  }

  // 生成性能报告
  generatePerformanceReport(results: GenerationResult[]): {
    summary: {
      totalTools: number;
      successCount: number;
      failureCount: number;
      averageDuration: number;
      totalApiCalls: number;
      totalDataProcessed: number;
      cacheEfficiency: number;
    };
    recommendations: string[];
  } {
    const totalTools = results.length;
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    const totalDuration = results.reduce((sum, r) => sum + r.metadata.duration, 0);
    const totalApiCalls = results.reduce((sum, r) => sum + r.metadata.performance.totalApiCalls, 0);
    const totalDataProcessed = results.reduce((sum, r) => sum + r.metadata.performance.totalDataSize, 0);
    const totalCacheHits = results.reduce((sum, r) => sum + r.metadata.performance.cacheHits, 0);
    
    const cacheEfficiency = totalApiCalls > 0 ? totalCacheHits / totalApiCalls : 0;
    
    const recommendations: string[] = [];
    
    if (failed.length > successful.length * 0.2) {
      recommendations.push('失败率较高，建议检查API配置和网络连接');
    }
    
    if (cacheEfficiency < 0.3) {
      recommendations.push('缓存命中率较低，建议增加缓存时间或优化缓存策略');
    }
    
    const avgDuration = totalDuration / totalTools;
    if (avgDuration > 60000) { // 超过1分钟
      recommendations.push('平均处理时间较长，建议优化并发处理或减少信息源');
    }

    return {
      summary: {
        totalTools,
        successCount: successful.length,
        failureCount: failed.length,
        averageDuration: avgDuration,
        totalApiCalls,
        totalDataProcessed,
        cacheEfficiency
      },
      recommendations
    };
  }

  // 导出报告为不同格式
  async exportReport(report: FormattedReport, format: 'markdown' | 'html' | 'json' | 'pdf'): Promise<string> {
    switch (format) {
      case 'markdown':
        return this.exportToMarkdown(report);
      case 'html':
        return this.exportToHTML(report);
      case 'json':
        return JSON.stringify(report, null, 2);
      case 'pdf':
        // 这里可以集成PDF生成库
        throw new Error('PDF导出功能待实现');
      default:
        throw new Error(`不支持的导出格式: ${format}`);
    }
  }

  private exportToMarkdown(report: FormattedReport): string {
    let markdown = `# ${report.title}\n\n`;
    markdown += `${report.summary}\n\n`;
    
    Object.entries(report.sections).forEach(([key, content]) => {
      if (content) {
        markdown += `## ${key.charAt(0).toUpperCase() + key.slice(1)}\n\n`;
        markdown += `${content}\n\n`;
      }
    });
    
    markdown += `---\n\n`;
    markdown += `**生成信息:**\n`;
    markdown += `- 工具名称: ${report.metadata.toolName}\n`;
    markdown += `- 生成时间: ${report.metadata.lastUpdated.toLocaleString()}\n`;
    markdown += `- 信息源数量: ${report.metadata.sources}\n`;
    markdown += `- 可靠性: ${(report.metadata.reliability * 100).toFixed(1)}%\n`;
    markdown += `- 完整性: ${(report.metadata.completeness * 100).toFixed(1)}%\n`;
    
    return markdown;
  }

  private exportToHTML(report: FormattedReport): string {
    let html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${report.title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #333; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow-x: auto; }
        .metadata { background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 30px; }
    </style>
</head>
<body>
    <h1>${report.title}</h1>
    <p><strong>${report.summary}</strong></p>
`;

    Object.entries(report.sections).forEach(([key, content]) => {
      if (content) {
        html += `    <h2>${key.charAt(0).toUpperCase() + key.slice(1)}</h2>\n`;
        html += `    <div>${content.replace(/\n/g, '<br>')}</div>\n`;
      }
    });

    html += `    <div class="metadata">
        <h3>生成信息</h3>
        <ul>
            <li>工具名称: ${report.metadata.toolName}</li>
            <li>生成时间: ${report.metadata.lastUpdated.toLocaleString()}</li>
            <li>信息源数量: ${report.metadata.sources}</li>
            <li>可靠性: ${(report.metadata.reliability * 100).toFixed(1)}%</li>
            <li>完整性: ${(report.metadata.completeness * 100).toFixed(1)}%</li>
        </ul>
    </div>
</body>
</html>`;

    return html;
  }

  // 清理资源
  cleanup(): void {
    this.cleanupCache();
    this.logs = [];
  }
}