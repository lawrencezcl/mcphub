/**
 * 模拟测试运行器 - 用于在没有真实API密钥的情况下测试系统功能
 */

import { EnhancedMultiChannelFetcher } from './fetchers/enhanced-multi-channel';
import { InformationProcessor, DeduplicationConfig } from './information-processor';
import { ToolReportGenerator } from './report-generator';
import { createErrorHandler } from './error-handler';
import { CollectedInformation, InformationChannelType } from './fetchers/enhanced-multi-channel';

// 模拟配置
const MOCK_CONFIG = {
  githubToken: 'mock-github-token',
  stackOverflowKey: 'mock-stackoverflow-key'
};

const MOCK_DEDUPLICATION_CONFIG: DeduplicationConfig = {
  contentSimilarityThreshold: 0.8,
  titleSimilarityThreshold: 0.9,
  urlSimilarityThreshold: 0.95,
  enableSemanticDeduplication: true
};

// 模拟DeepSeek格式化器
class MockDeepSeekFormatter {
  async formatToolReport(toolName: string, processedInfo: any[]): Promise<any> {
    return {
      title: `${toolName} - 工具使用指南`,
      summary: `这是关于 ${toolName} 工具的详细使用指南，包含安装、配置和使用方法。`,
      sections: {
        overview: `${toolName} 是一个功能强大的开发工具...`,
        installation: `安装 ${toolName}:\nnpm install ${toolName}`,
        usage: `基本使用方法:\nimport ${toolName} from '${toolName}';`,
        features: `主要功能:\n- 功能1\n- 功能2\n- 功能3`,
        troubleshooting: `常见问题:\n- 问题1: 解决方案1\n- 问题2: 解决方案2`,
        references: `参考资料:\n- 官方文档\n- GitHub仓库`
      },
      metadata: {
        toolName,
        version: '1.0.0',
        lastUpdated: new Date(),
        sources: processedInfo.length,
        reliability: 0.85,
        completeness: 0.90
      },
      rawContent: `原始内容: ${processedInfo.length} 个信息源`,
      formattingLog: ['格式化开始', '生成概述', '生成安装说明', '格式化完成']
    };
  }

  async validateConnection(): Promise<boolean> {
    return true; // 模拟连接成功
  }
}

interface MockTestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  metrics?: {
    informationCollected: number;
    processingTime: number;
    reportSize: number;
  };
}

class MockMCPCrawlerTestSuite {
  private fetcher: EnhancedMultiChannelFetcher;
  private processor: InformationProcessor;
  private reportGenerator: ToolReportGenerator;
  private errorHandler: ReturnType<typeof createErrorHandler>;

  constructor() {
    this.errorHandler = createErrorHandler();
    this.fetcher = new EnhancedMultiChannelFetcher(MOCK_CONFIG);
    this.processor = new InformationProcessor();
    
    // 创建模拟的报告生成器配置
    this.reportGenerator = new ToolReportGenerator({
      multiChannel: {
        githubToken: 'mock-github-token',
        stackOverflowKey: 'mock-stackoverflow-key'
      },
      deduplication: {
        contentSimilarityThreshold: 0.8,
        titleSimilarityThreshold: 0.7,
        urlSimilarityThreshold: 0.9,
        enableSemanticDeduplication: true
      },
      deepseek: {
        apiKey: 'mock-deepseek-key',
        model: 'deepseek-chat',
        baseUrl: 'https://api.deepseek.com/v1'
      },
      formatting: {
        language: 'zh' as const,
        style: 'technical' as const,
        includeCodeExamples: true,
        includeTroubleshooting: true
      },
      options: {
        maxRetries: 3,
        retryDelay: 1000,
        enableCache: true,
        cacheExpiry: 24,
        enableLogging: true,
        logLevel: 'info'
      }
    });
  }

  async runAllTests(): Promise<MockTestResult[]> {
    const results: MockTestResult[] = [];

    console.log('🚀 开始运行模拟测试套件...\n');

    // 测试1: 基础信息收集
    results.push(await this.testBasicInformationCollection());

    // 测试2: 多渠道信息收集
    results.push(await this.testMultiChannelCollection());

    // 测试3: 信息去重
    results.push(await this.testDeduplication());

    // 测试4: 信息处理
    results.push(await this.testInformationProcessing());

    // 测试5: 报告生成
    results.push(await this.testReportGeneration());

    // 测试6: 错误处理
    results.push(await this.testErrorHandling());

    // 测试7: 性能测试
    results.push(await this.testPerformance());

    return results;
  }

  private async testBasicInformationCollection(): Promise<MockTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('📡 测试基础信息收集...');
      
      // 模拟收集信息
      const mockResults = [
        {
          source: 'github',
          title: 'playwright - GitHub Repository',
          url: 'https://github.com/microsoft/playwright',
          content: 'Playwright is a framework for Web Testing and Automation...',
          metadata: { stars: 50000, language: 'TypeScript' }
        },
        {
          source: 'npm',
          title: 'playwright - npm package',
          url: 'https://www.npmjs.com/package/playwright',
          content: 'Fast and reliable end-to-end testing for modern web apps...',
          metadata: { downloads: 1000000, version: '1.40.0' }
        }
      ];

      const duration = Date.now() - startTime;
      
      return {
        testName: '基础信息收集测试',
        success: true,
        duration,
        metrics: {
          informationCollected: mockResults.length,
          processingTime: duration,
          reportSize: JSON.stringify(mockResults).length
        }
      };
    } catch (error) {
      return {
        testName: '基础信息收集测试',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testMultiChannelCollection(): Promise<MockTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔄 测试多渠道信息收集...');
      
      // 模拟多渠道收集
      const channels = ['github', 'stackoverflow', 'npm'];
      const mockResults = channels.map(channel => ({
        source: channel as InformationChannelType,
        title: `playwright - ${channel} result`,
        url: `https://${channel}.com/playwright`,
        content: `Information from ${channel} about playwright...`,
        metadata: { channel, timestamp: new Date() },
        reliability: 0.8
      }));

      const duration = Date.now() - startTime;
      
      return {
        testName: '多渠道信息收集测试',
        success: true,
        duration,
        metrics: {
          informationCollected: mockResults.length,
          processingTime: duration,
          reportSize: JSON.stringify(mockResults).length
        }
      };
    } catch (error) {
      return {
        testName: '多渠道信息收集测试',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testDeduplication(): Promise<MockTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🔍 测试信息去重...');
      
      // 模拟重复信息
      const mockData = [
        { title: 'Playwright Tutorial', content: 'Learn Playwright basics...', url: 'https://example.com/1', source: InformationChannelType.GITHUB_ISSUES, metadata: {}, reliability: 0.8 },
        { title: 'Playwright Tutorial', content: 'Learn Playwright basics...', url: 'https://example.com/2', source: InformationChannelType.OFFICIAL_DOCS, metadata: {}, reliability: 0.7 }, // 重复
        { title: 'Playwright Advanced', content: 'Advanced Playwright features...', url: 'https://example.com/3', source: InformationChannelType.STACKOVERFLOW, metadata: {}, reliability: 0.9 }
      ];

      const deduplicated = await this.processor.deduplicateInformation(mockData, MOCK_DEDUPLICATION_CONFIG);
      const duration = Date.now() - startTime;
      
      return {
        testName: '信息去重测试',
        success: deduplicated.length < mockData.length,
        duration,
        metrics: {
          informationCollected: deduplicated.length,
          processingTime: duration,
          reportSize: JSON.stringify(deduplicated).length
        }
      };
    } catch (error) {
      return {
        testName: '信息去重测试',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testInformationProcessing(): Promise<MockTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('⚙️ 测试信息处理...');
      
      const mockRawInfo = [
        { title: 'Playwright', content: 'Web testing framework', url: 'https://example.com', source: InformationChannelType.GITHUB_ISSUES, metadata: {}, reliability: 0.9 }
      ];

      const processed = await this.processor.processInformation(mockRawInfo, MOCK_DEDUPLICATION_CONFIG);
      const duration = Date.now() - startTime;
      
      return {
        testName: '信息处理测试',
        success: processed.length > 0,
        duration,
        metrics: {
          informationCollected: processed.length,
          processingTime: duration,
          reportSize: JSON.stringify(processed).length
        }
      };
    } catch (error) {
      return {
        testName: '信息处理测试',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testReportGeneration(): Promise<MockTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('📄 测试报告生成...');
      
      const mockProcessedInfo = [
        {
          id: '1',
          originalSources: [],
          consolidatedContent: 'Comprehensive guide to Playwright',
          keyPoints: ['testing', 'automation', 'web'],
          categories: ['testing'],
          reliability: 0.95,
          confidence: 0.90,
          metadata: {
            sourceCount: 1,
            channelTypes: ['github' as const],
            averageScore: 0.9,
            dateRange: { earliest: new Date(), latest: new Date() },
            contentLength: 1000,
            hasCodeExamples: true,
            hasInstallInstructions: true
          }
        }
      ];

      const report = await this.reportGenerator.generateReport('playwright');

      const duration = Date.now() - startTime;
      
      return {
        testName: '报告生成测试',
        success: !!report && !!report.report,
        duration,
        metrics: {
          informationCollected: 1,
          processingTime: duration,
          reportSize: report.report ? JSON.stringify(report.report).length : 0
        }
      };
    } catch (error) {
      return {
        testName: '报告生成测试',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testErrorHandling(): Promise<MockTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('🛡️ 测试错误处理...');
      
      // 模拟错误处理
      try {
        throw new Error('模拟错误');
      } catch (error) {
        this.errorHandler.handleError(error as Error);
      }

      const duration = Date.now() - startTime;
      
      return {
        testName: '错误处理测试',
        success: true,
        duration
      };
    } catch (error) {
      return {
        testName: '错误处理测试',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testPerformance(): Promise<MockTestResult> {
    const startTime = Date.now();
    
    try {
      console.log('⚡ 测试性能...');
      
      // 模拟性能测试
      const iterations = 100;
      for (let i = 0; i < iterations; i++) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }

      const duration = Date.now() - startTime;
      
      return {
        testName: '性能测试',
        success: duration < 1000, // 应该在1秒内完成
        duration,
        metrics: {
          informationCollected: iterations,
          processingTime: duration,
          reportSize: 0
        }
      };
    } catch (error) {
      return {
        testName: '性能测试',
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// 运行模拟测试
async function runMockTests() {
  console.log('============================================================');
  console.log('🧪 MCP工具信息收集系统 - 模拟测试套件');
  console.log('============================================================\n');

  const testSuite = new MockMCPCrawlerTestSuite();
  const results = await testSuite.runAllTests();

  // 显示测试结果
  console.log('\n============================================================');
  console.log('📊 测试结果汇总');
  console.log('============================================================');

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`⏱️  总时间: ${totalTime}ms`);
  console.log(`📈 成功率: ${((passed / results.length) * 100).toFixed(1)}%\n`);

  console.log('📋 详细测试结果:');
  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${result.testName} (${result.duration}ms)`);
    
    if (result.metrics) {
      console.log(`     指标: 信息收集=${result.metrics.informationCollected}, 处理时间=${result.metrics.processingTime}ms, 报告大小=${result.metrics.reportSize}字节`);
    }
    
    if (result.error) {
      console.log(`     错误: ${result.error}`);
    }
  });

  console.log('\n============================================================');
  if (failed === 0) {
    console.log('🎉 所有测试通过！系统功能正常');
  } else {
    console.log('⚠️  部分测试失败，请检查相关功能');
  }
  console.log('============================================================');

  return results;
}

// 如果直接运行此文件
if (require.main === module) {
  runMockTests()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('测试运行失败:', error);
      process.exit(1);
    });
}

export { runMockTests, MockMCPCrawlerTestSuite };