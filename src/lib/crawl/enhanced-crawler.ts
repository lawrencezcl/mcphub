import { ToolReportGenerator, ReportGenerationConfig, GenerationResult, ProgressCallback } from './report-generator';
import { DeduplicationConfig } from './information-processor';
import { FormattingOptions, DeepSeekConfig } from './deepseek-formatter';
import { InformationChannelType } from './fetchers/enhanced-multi-channel';

// 预设配置模板
export const DEFAULT_CONFIGS = {
  // 高质量配置 - 适用于重要工具的详细报告
  HIGH_QUALITY: {
    deduplication: {
      contentSimilarityThreshold: 0.8,
      titleSimilarityThreshold: 0.7,
      urlSimilarityThreshold: 0.9,
      enableSemanticDeduplication: true
    } as DeduplicationConfig,
    
    formatting: {
      language: 'zh' as const,
      style: 'professional' as const,
      includeCodeExamples: true,
      includeTroubleshooting: true,
      maxLength: 8000,
      sections: {
        overview: true,
        installation: true,
        usage: true,
        features: true,
        troubleshooting: true,
        references: true
      }
    } as FormattingOptions,
    
    options: {
      maxRetries: 3,
      retryDelay: 2000,
      enableCache: true,
      cacheExpiry: 24, // 24小时
      enableLogging: true,
      logLevel: 'info' as const
    }
  },

  // 快速配置 - 适用于批量处理或快速预览
  FAST: {
    deduplication: {
      contentSimilarityThreshold: 0.6,
      titleSimilarityThreshold: 0.5,
      urlSimilarityThreshold: 0.8,
      enableSemanticDeduplication: false
    } as DeduplicationConfig,
    
    formatting: {
      language: 'zh' as const,
      style: 'casual' as const,
      includeCodeExamples: false,
      includeTroubleshooting: false,
      maxLength: 3000,
      sections: {
        overview: true,
        installation: true,
        usage: true,
        features: false,
        troubleshooting: false,
        references: false
      }
    } as FormattingOptions,
    
    options: {
      maxRetries: 1,
      retryDelay: 1000,
      enableCache: true,
      cacheExpiry: 12, // 12小时
      enableLogging: false,
      logLevel: 'error' as const
    }
  },

  // 技术配置 - 适用于开发者文档
  TECHNICAL: {
    deduplication: {
      contentSimilarityThreshold: 0.7,
      titleSimilarityThreshold: 0.6,
      urlSimilarityThreshold: 0.85,
      enableSemanticDeduplication: true
    } as DeduplicationConfig,
    
    formatting: {
      language: 'zh' as const,
      style: 'technical' as const,
      includeCodeExamples: true,
      includeTroubleshooting: true,
      maxLength: 6000,
      sections: {
        overview: true,
        installation: true,
        usage: true,
        features: true,
        troubleshooting: true,
        references: true
      }
    } as FormattingOptions,
    
    options: {
      maxRetries: 2,
      retryDelay: 1500,
      enableCache: true,
      cacheExpiry: 18, // 18小时
      enableLogging: true,
      logLevel: 'debug' as const
    }
  }
};

// 增强版MCP工具信息收集器
export class EnhancedMCPCrawler {
  private generator: ToolReportGenerator;
  private config: ReportGenerationConfig;

  constructor(
    deepseekApiKey: string,
    options: {
      githubToken?: string;
      stackOverflowKey?: string;
      preset?: keyof typeof DEFAULT_CONFIGS;
      customConfig?: Partial<ReportGenerationConfig>;
    } = {}
  ) {
    const preset = options.preset || 'HIGH_QUALITY';
    const baseConfig = DEFAULT_CONFIGS[preset];

    this.config = {
      multiChannel: {
        githubToken: options.githubToken,
        stackOverflowKey: options.stackOverflowKey
      },
      deduplication: baseConfig.deduplication,
      deepseek: {
        apiKey: deepseekApiKey,
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
        maxTokens: 4000,
        temperature: 0.3,
        timeout: 30000
      } as DeepSeekConfig,
      formatting: baseConfig.formatting,
      options: baseConfig.options,
      ...options.customConfig
    };

    this.generator = new ToolReportGenerator(this.config);
  }

  // 生成单个工具报告
  async generateToolReport(
    toolName: string,
    options: {
      onProgress?: ProgressCallback;
      exportFormat?: 'markdown' | 'html' | 'json';
      saveToFile?: string;
    } = {}
  ): Promise<{
    success: boolean;
    report?: any;
    exportedContent?: string;
    filePath?: string;
    error?: string;
    metadata: any;
  }> {
    try {
      console.log(`开始生成工具 "${toolName}" 的信息报告...`);
      
      const result = await this.generator.generateReport(toolName, options.onProgress);
      
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          metadata: result.metadata
        };
      }

      let exportedContent: string | undefined;
      let filePath: string | undefined;

      // 导出报告
      if (options.exportFormat && result.report) {
        exportedContent = await this.generator.exportReport(result.report, options.exportFormat);
        
        // 保存到文件
        if (options.saveToFile) {
          const fs = await import('fs/promises');
          const path = await import('path');
          
          const extension = options.exportFormat === 'json' ? 'json' : 
                          options.exportFormat === 'html' ? 'html' : 'md';
          filePath = path.resolve(options.saveToFile, `${toolName}-report.${extension}`);
          
          await fs.writeFile(filePath, exportedContent, 'utf-8');
          console.log(`报告已保存到: ${filePath}`);
        }
      }

      console.log(`工具 "${toolName}" 报告生成完成`);
      console.log(`- 处理时长: ${result.metadata.duration}ms`);
      console.log(`- 信息源数量: ${result.metadata.stages.collection.itemsFound}`);
      console.log(`- API调用次数: ${result.metadata.performance.totalApiCalls}`);

      return {
        success: true,
        report: result.report,
        exportedContent,
        filePath,
        metadata: result.metadata
      };

    } catch (error: any) {
      console.error(`生成工具 "${toolName}" 报告时出错:`, error);
      return {
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
        }
      };
    }
  }

  // 批量生成工具报告
  async generateMultipleReports(
    toolNames: string[],
    options: {
      onProgress?: ProgressCallback;
      exportFormat?: 'markdown' | 'html' | 'json';
      saveToDirectory?: string;
      generateSummary?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    results: any[];
    summary?: any;
    error?: string;
  }> {
    try {
      console.log(`开始批量生成 ${toolNames.length} 个工具的报告...`);
      
      const results = await this.generator.generateMultipleReports(toolNames, options.onProgress);
      
      // 导出报告
      if (options.exportFormat && options.saveToDirectory) {
        const fs = await import('fs/promises');
        const path = await import('path');
        
        // 确保目录存在
        await fs.mkdir(options.saveToDirectory, { recursive: true });
        
        for (const result of results) {
          if (result.success && result.report) {
            const exportedContent = await this.generator.exportReport(result.report, options.exportFormat);
            const extension = options.exportFormat === 'json' ? 'json' : 
                            options.exportFormat === 'html' ? 'html' : 'md';
            const filePath = path.join(options.saveToDirectory, `${result.metadata.toolName}-report.${extension}`);
            
            await fs.writeFile(filePath, exportedContent, 'utf-8');
          }
        }
        
        console.log(`批量报告已保存到目录: ${options.saveToDirectory}`);
      }

      // 生成汇总报告
      let summary;
      if (options.generateSummary) {
        summary = this.generator.generatePerformanceReport(results);
        
        if (options.saveToDirectory) {
          const fs = await import('fs/promises');
          const path = await import('path');
          
          const summaryPath = path.join(options.saveToDirectory, 'batch-summary.json');
          await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf-8');
          console.log(`汇总报告已保存到: ${summaryPath}`);
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`批量生成完成: ${successCount}/${toolNames.length} 成功`);

      return {
        success: true,
        results,
        summary
      };

    } catch (error: any) {
      console.error('批量生成报告时出错:', error);
      return {
        success: false,
        results: [],
        error: error.message
      };
    }
  }

  // 验证配置
  async validateConfiguration(): Promise<{
    valid: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // 验证DeepSeek API连接
      const isConnected = await this.generator['formatter'].validateConnection();
      if (!isConnected) {
        issues.push('DeepSeek API连接失败，请检查API密钥');
      }

      // 检查GitHub Token
      if (!this.config.multiChannel.githubToken) {
        recommendations.push('建议配置GitHub Token以提高API限制和数据质量');
      }

      // 检查StackOverflow Key
      if (!this.config.multiChannel.stackOverflowKey) {
        recommendations.push('建议配置StackOverflow API Key以获取更多技术讨论');
      }

      // 检查缓存配置
      if (!this.config.options.enableCache) {
        recommendations.push('建议启用缓存以提高性能和减少API调用');
      }

      // 检查重试配置
      if (this.config.options.maxRetries < 2) {
        recommendations.push('建议设置至少2次重试以提高成功率');
      }

      return {
        valid: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error: any) {
      issues.push(`配置验证失败: ${error.message}`);
      return {
        valid: false,
        issues,
        recommendations
      };
    }
  }

  // 获取支持的信息渠道
  getSupportedChannels(): InformationChannelType[] {
    return [
      InformationChannelType.OFFICIAL_DOCS,
      InformationChannelType.STACKOVERFLOW,
      InformationChannelType.REDDIT,
      InformationChannelType.GITHUB_ISSUES
    ];
  }

  // 更新配置
  updateConfig(updates: Partial<ReportGenerationConfig>): void {
    this.config = { ...this.config, ...updates };
    this.generator = new ToolReportGenerator(this.config);
  }

  // 清理资源
  cleanup(): void {
    this.generator.cleanup();
  }

  // 获取当前配置
  getConfig(): ReportGenerationConfig {
    return { ...this.config };
  }
}

// 便捷函数：快速生成单个工具报告
export async function generateQuickReport(
  toolName: string,
  deepseekApiKey: string,
  options: {
    githubToken?: string;
    preset?: keyof typeof DEFAULT_CONFIGS;
    exportFormat?: 'markdown' | 'html' | 'json';
    saveToFile?: string;
  } = {}
): Promise<any> {
  const crawler = new EnhancedMCPCrawler(deepseekApiKey, {
    githubToken: options.githubToken,
    preset: options.preset || 'FAST'
  });

  try {
    const result = await crawler.generateToolReport(toolName, {
      exportFormat: options.exportFormat,
      saveToFile: options.saveToFile
    });

    crawler.cleanup();
    return result;
  } catch (error) {
    crawler.cleanup();
    throw error;
  }
}

// 便捷函数：批量生成报告
export async function generateBatchReports(
  toolNames: string[],
  deepseekApiKey: string,
  options: {
    githubToken?: string;
    preset?: keyof typeof DEFAULT_CONFIGS;
    exportFormat?: 'markdown' | 'html' | 'json';
    saveToDirectory?: string;
    onProgress?: ProgressCallback;
  } = {}
): Promise<any> {
  const crawler = new EnhancedMCPCrawler(deepseekApiKey, {
    githubToken: options.githubToken,
    preset: options.preset || 'TECHNICAL'
  });

  try {
    const result = await crawler.generateMultipleReports(toolNames, {
      exportFormat: options.exportFormat,
      saveToDirectory: options.saveToDirectory,
      generateSummary: true,
      onProgress: options.onProgress
    });

    crawler.cleanup();
    return result;
  } catch (error) {
    crawler.cleanup();
    throw error;
  }
}

// 导出主要类和接口
export { ToolReportGenerator };
export type {
  ReportGenerationConfig,
  GenerationResult,
  ProgressCallback,
  DeduplicationConfig,
  FormattingOptions,
  DeepSeekConfig
};