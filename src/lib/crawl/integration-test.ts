/**
 * 增强型MCP工具信息收集系统集成测试
 * 
 * 测试完整的信息收集、处理、格式化和报告生成流程
 */

import { EnhancedMCPCrawler, DEFAULT_CONFIGS } from './enhanced-crawler';
import { InformationChannelType } from './fetchers/enhanced-multi-channel';
import { ErrorHandler, createErrorHandler } from './error-handler';

// 测试配置
export interface IntegrationTestConfig {
  testTools: string[];
  enabledChannels: InformationChannelType[];
  maxTestDuration: number;
  enableErrorSimulation: boolean;
  githubToken?: string;
  stackOverflowKey?: string;
  deepseekApiKey: string;
  preset?: keyof typeof DEFAULT_CONFIGS;
}

// 测试结果
export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  errorMessage?: string;
  details?: Record<string, any>;
  metrics?: {
    informationCollected: number;
    processingTime: number;
    reportSize: number;
  };
}

// 测试套件结果
export interface TestSuiteResult {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  results: TestResult[];
  summary: {
    successRate: number;
    averageDuration: number;
    criticalFailures: TestResult[];
  };
}

// 集成测试套件
export class MCPCrawlerIntegrationTest {
  private crawler: EnhancedMCPCrawler;
  private errorHandler: ErrorHandler;
  private config: IntegrationTestConfig;

  constructor(config: IntegrationTestConfig) {
    this.config = config;
    this.crawler = new EnhancedMCPCrawler(config.deepseekApiKey, {
      githubToken: config.githubToken,
      stackOverflowKey: config.stackOverflowKey,
      preset: config.preset || 'HIGH_QUALITY'
    });
    this.errorHandler = createErrorHandler();
  }

  // 运行完整的集成测试套件
  async runIntegrationTests(): Promise<TestSuiteResult> {
    console.log('🚀 开始运行MCP工具信息收集系统集成测试...');
    
    const startTime = Date.now();
    const results: TestResult[] = [];

    // 测试用例列表
    const testCases = [
      { name: '基础信息收集测试', method: this.testBasicInformationCollection.bind(this) },
      { name: '报告生成测试', method: this.testReportGeneration.bind(this) },
      { name: '批量工具处理测试', method: this.testBatchProcessing.bind(this) },
      { name: '错误处理测试', method: this.testErrorHandling.bind(this) },
      { name: '配置验证测试', method: this.testConfigurationValidation.bind(this) },
      { name: '性能测试', method: this.testPerformance.bind(this) }
    ];

    // 执行所有测试
    for (const testCase of testCases) {
      try {
        console.log(`\n📋 执行测试: ${testCase.name}`);
        const result = await this.runSingleTest(testCase.name, testCase.method);
        results.push(result);
        
        if (result.success) {
          console.log(`✅ ${testCase.name} - 通过 (${result.duration}ms)`);
        } else {
          console.log(`❌ ${testCase.name} - 失败: ${result.errorMessage}`);
        }
      } catch (error: any) {
        console.error(`💥 测试执行异常: ${testCase.name}`, error);
        results.push({
          testName: testCase.name,
          success: false,
          duration: 0,
          errorMessage: `测试执行异常: ${error.message}`
        });
      }
    }

    const totalDuration = Date.now() - startTime;
    return this.generateTestSuiteResult(results, totalDuration);
  }

  // 运行单个测试
  private async runSingleTest(
    testName: string, 
    testMethod: () => Promise<TestResult>
  ): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      // 设置测试超时
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`测试超时 (${this.config.maxTestDuration}ms)`));
        }, this.config.maxTestDuration);
      });

      const result = await Promise.race([
        testMethod(),
        timeoutPromise
      ]);

      return {
        ...result,
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        errorMessage: error.message
      };
    }
  }

  // 测试1: 基础信息收集
  private async testBasicInformationCollection(): Promise<TestResult> {
    const testTool = this.config.testTools[0] || 'playwright';
    
    try {
      const result = await this.crawler.generateToolReport(testTool, {
        exportFormat: 'json'
      });

      const success = result.success && result.report && 
                     result.metadata && result.metadata.totalSources >= 0;

      return {
        testName: '基础信息收集测试',
        success,
        duration: 0,
        details: {
          toolName: testTool,
          reportGenerated: result.success,
          totalSources: result.metadata?.totalSources || 0,
          hasReport: !!result.report
        },
        metrics: {
          informationCollected: result.metadata?.totalSources || 0,
          processingTime: result.metadata?.processingTimeMs || 0,
          reportSize: result.report ? JSON.stringify(result.report).length : 0
        }
      };
    } catch (error: any) {
      return {
        testName: '基础信息收集测试',
        success: false,
        duration: 0,
        errorMessage: error.message
      };
    }
  }

  // 测试2: 报告生成测试
  private async testReportGeneration(): Promise<TestResult> {
    const testTool = this.config.testTools[0] || 'playwright';
    
    try {
      const result = await this.crawler.generateToolReport(testTool, {
        exportFormat: 'markdown'
      });

      const success = result.success && 
                     (result.report || result.exportedContent);

      return {
        testName: '报告生成测试',
        success,
        duration: 0,
        details: {
          toolName: testTool,
          hasExportedContent: !!result.exportedContent,
          exportFormat: 'markdown'
        },
        metrics: {
          informationCollected: result.metadata?.totalSources || 0,
          processingTime: result.metadata?.processingTimeMs || 0,
          reportSize: result.exportedContent ? result.exportedContent.length : 0
        }
      };
    } catch (error: any) {
      return {
        testName: '报告生成测试',
        success: false,
        duration: 0,
        errorMessage: error.message
      };
    }
  }

  // 测试3: 批量工具处理
  private async testBatchProcessing(): Promise<TestResult> {
    const testTools = this.config.testTools.slice(0, 2); // 测试前2个工具
    
    try {
      const result = await this.crawler.generateMultipleReports(testTools, {
        exportFormat: 'json'
      });

      const success = result.success && 
                     result.results && 
                     result.results.length > 0;

      return {
        testName: '批量工具处理测试',
        success,
        duration: 0,
        details: {
          toolsRequested: testTools.length,
          reportsGenerated: result.results?.length || 0,
          allSuccessful: result.success
        },
        metrics: {
          informationCollected: result.results?.length || 0,
          processingTime: 0,
          reportSize: result.results ? JSON.stringify(result.results).length : 0
        }
      };
    } catch (error: any) {
      return {
        testName: '批量工具处理测试',
        success: false,
        duration: 0,
        errorMessage: error.message
      };
    }
  }

  // 测试4: 错误处理
  private async testErrorHandling(): Promise<TestResult> {
    try {
      // 测试无效工具名称
      const result = await this.crawler.generateToolReport('invalid-nonexistent-tool-12345', {
        exportFormat: 'json'
      });

      // 系统应该能够处理错误并返回结果（即使失败）
      const success = result !== null && typeof result === 'object';

      return {
        testName: '错误处理测试',
        success,
        duration: 0,
        details: {
          invalidToolHandled: true,
          resultReturned: success,
          errorHandled: !result.success || !!result.error
        }
      };
    } catch (error: any) {
      // 预期可能会有错误，检查错误是否被正确处理
      const isExpectedError = error.message.includes('未能') ||
                             error.message.includes('超时') ||
                             error.message.includes('无效') ||
                             error.message.includes('失败');

      return {
        testName: '错误处理测试',
        success: isExpectedError,
        duration: 0,
        errorMessage: isExpectedError ? '预期错误，处理正确' : error.message
      };
    }
  }

  // 测试5: 配置验证
  private async testConfigurationValidation(): Promise<TestResult> {
    try {
      const validationResult = await this.crawler.validateConfiguration();
      
      const success = validationResult && 
                     typeof validationResult.valid === 'boolean' &&
                     Array.isArray(validationResult.issues);

      return {
        testName: '配置验证测试',
        success,
        duration: 0,
        details: {
          configValid: validationResult.valid,
          issuesCount: validationResult.issues?.length || 0,
          recommendationsCount: validationResult.recommendations?.length || 0
        }
      };
    } catch (error: any) {
      return {
        testName: '配置验证测试',
        success: false,
        duration: 0,
        errorMessage: error.message
      };
    }
  }

  // 测试6: 性能测试
  private async testPerformance(): Promise<TestResult> {
    const testTool = this.config.testTools[0] || 'playwright';
    
    try {
      const startTime = Date.now();
      
      const result = await this.crawler.generateToolReport(testTool, {
        exportFormat: 'json'
      });

      const processingTime = Date.now() - startTime;
      const success = result.success && processingTime < 30000; // 应在30秒内完成

      return {
        testName: '性能测试',
        success,
        duration: 0,
        details: {
          processingTime,
          withinTimeLimit: processingTime < 30000,
          reportGenerated: result.success
        },
        metrics: {
          informationCollected: result.metadata?.totalSources || 0,
          processingTime,
          reportSize: result.report ? JSON.stringify(result.report).length : 0
        }
      };
    } catch (error: any) {
      return {
        testName: '性能测试',
        success: false,
        duration: 0,
        errorMessage: error.message
      };
    }
  }

  // 生成测试套件结果
  private generateTestSuiteResult(results: TestResult[], totalDuration: number): TestSuiteResult {
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.length - passedTests;
    const criticalFailures = results.filter(r => !r.success && 
      (r.testName.includes('基础') || r.testName.includes('报告生成')));

    return {
      totalTests: results.length,
      passedTests,
      failedTests,
      totalDuration,
      results,
      summary: {
        successRate: (passedTests / results.length * 100),
        averageDuration: totalDuration / results.length,
        criticalFailures
      }
    };
  }

  // 生成测试报告
  generateTestReport(result: TestSuiteResult): string {
    const report = {
      title: 'MCP工具信息收集系统集成测试报告',
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: result.totalTests,
        passedTests: result.passedTests,
        failedTests: result.failedTests,
        successRate: result.summary.successRate.toFixed(2) + '%',
        totalDuration: result.totalDuration + 'ms',
        averageDuration: result.summary.averageDuration.toFixed(2) + 'ms'
      },
      criticalFailures: result.summary.criticalFailures.map(f => ({
        testName: f.testName,
        errorMessage: f.errorMessage
      })),
      detailedResults: result.results.map(r => ({
        testName: r.testName,
        success: r.success,
        duration: r.duration + 'ms',
        errorMessage: r.errorMessage,
        details: r.details,
        metrics: r.metrics
      }))
    };

    return JSON.stringify(report, null, 2);
  }
}

// 默认测试配置
export const DEFAULT_INTEGRATION_TEST_CONFIG: IntegrationTestConfig = {
  testTools: ['playwright', 'puppeteer', 'selenium'],
  enabledChannels: [
    InformationChannelType.OFFICIAL_DOCS,
    InformationChannelType.STACKOVERFLOW,
    InformationChannelType.GITHUB_ISSUES
  ],
  maxTestDuration: 60000, // 1分钟
  enableErrorSimulation: true,
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || 'test-key',
  preset: 'FAST'
};

// 便捷函数：运行集成测试
export async function runMCPCrawlerIntegrationTests(
  config: Partial<IntegrationTestConfig> = {}
): Promise<TestSuiteResult> {
  const finalConfig = { ...DEFAULT_INTEGRATION_TEST_CONFIG, ...config };
  const testSuite = new MCPCrawlerIntegrationTest(finalConfig);
  
  console.log('🧪 启动MCP工具信息收集系统集成测试...');
  console.log(`📊 测试配置: ${JSON.stringify(finalConfig, null, 2)}`);
  
  const result = await testSuite.runIntegrationTests();
  
  console.log('\n📋 测试完成！生成详细报告...');
  const report = testSuite.generateTestReport(result);
  console.log(report);
  
  return result;
}

// 如果直接运行此文件，执行集成测试
if (require.main === module) {
  runMCPCrawlerIntegrationTests()
    .then((result) => {
      console.log(`\n🎯 集成测试完成！成功率: ${result.summary.successRate.toFixed(1)}%`);
      process.exit(result.failedTests > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('💥 集成测试执行失败:', error);
      process.exit(1);
    });
}