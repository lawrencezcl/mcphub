/**
 * MCP工具信息收集器测试运行器
 * 
 * 用于测试和验证完整的信息收集和处理流程
 */

import { EnhancedMCPCrawler, DEFAULT_CONFIGS } from './enhanced-crawler';
import { InformationChannelType } from './fetchers/enhanced-multi-channel';

// 测试配置
interface TestConfig {
  deepseekApiKey: string;
  githubToken?: string;
  stackOverflowKey?: string;
  testTools: string[];
  outputDir: string;
}

// 测试结果
interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

// 测试套件
export class MCPCrawlerTestSuite {
  private config: TestConfig;
  private results: TestResult[] = [];

  constructor(config: TestConfig) {
    this.config = config;
  }

  // 运行所有测试
  async runAllTests(): Promise<{
    success: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    results: TestResult[];
    summary: string;
  }> {
    console.log('🧪 开始运行MCP工具信息收集器测试套件...\n');

    this.results = [];

    // 运行各项测试
    await this.testBasicFunctionality();
    await this.testMultiChannelCollection();
    await this.testDeduplication();
    await this.testDeepSeekIntegration();
    await this.testErrorHandling();
    await this.testPerformance();
    await this.testBatchProcessing();

    // 生成测试报告
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.length - passedTests;
    const success = failedTests === 0;

    const summary = this.generateTestSummary();

    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果汇总:');
    console.log(`✅ 通过: ${passedTests}/${this.results.length}`);
    console.log(`❌ 失败: ${failedTests}/${this.results.length}`);
    console.log(`🎯 成功率: ${((passedTests / this.results.length) * 100).toFixed(1)}%`);
    console.log('='.repeat(60));

    return {
      success,
      totalTests: this.results.length,
      passedTests,
      failedTests,
      results: this.results,
      summary
    };
  }

  // 测试基本功能
  private async testBasicFunctionality(): Promise<void> {
    const testName = '基本功能测试';
    console.log(`🔍 运行测试: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      const crawler = new EnhancedMCPCrawler(this.config.deepseekApiKey, {
        githubToken: this.config.githubToken,
        preset: 'FAST'
      });

      // 验证配置
      const validation = await crawler.validateConfiguration();
      if (!validation.valid) {
        throw new Error(`配置验证失败: ${validation.issues.join(', ')}`);
      }

      // 生成简单报告
      const result = await crawler.generateToolReport(this.config.testTools[0], {
        exportFormat: 'json'
      });

      if (!result.success) {
        throw new Error(result.error || '报告生成失败');
      }

      crawler.cleanup();

      this.results.push({
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: {
          toolName: this.config.testTools[0],
          reportGenerated: !!result.report,
          metadataPresent: !!result.metadata
        }
      });

      console.log(`✅ ${testName} 通过`);
    } catch (error: any) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });

      console.log(`❌ ${testName} 失败: ${error.message}`);
    }
  }

  // 测试多渠道信息收集
  private async testMultiChannelCollection(): Promise<void> {
    const testName = '多渠道信息收集测试';
    console.log(`🔍 运行测试: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      const crawler = new EnhancedMCPCrawler(this.config.deepseekApiKey, {
        githubToken: this.config.githubToken,
        stackOverflowKey: this.config.stackOverflowKey,
        preset: 'TECHNICAL'
      });

      // 检查支持的渠道
      const supportedChannels = crawler.getSupportedChannels();
      const expectedChannels = [
        InformationChannelType.OFFICIAL_DOCS,
        InformationChannelType.STACKOVERFLOW,
        InformationChannelType.REDDIT,
        InformationChannelType.GITHUB_ISSUES
      ];

      for (const channel of expectedChannels) {
        if (!supportedChannels.includes(channel)) {
          throw new Error(`缺少支持的渠道: ${channel}`);
        }
      }

      // 生成报告并检查信息源
      const result = await crawler.generateToolReport(this.config.testTools[0]);
      
      if (!result.success) {
        throw new Error(result.error || '报告生成失败');
      }

      const itemsFound = result.metadata.stages.collection.itemsFound;
      if (itemsFound < 2) {
        throw new Error(`信息源数量不足: ${itemsFound}`);
      }

      crawler.cleanup();

      this.results.push({
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: {
          supportedChannels: supportedChannels.length,
          itemsFound,
          apiCalls: result.metadata.performance.totalApiCalls
        }
      });

      console.log(`✅ ${testName} 通过`);
    } catch (error: any) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });

      console.log(`❌ ${testName} 失败: ${error.message}`);
    }
  }

  // 测试信息去重
  private async testDeduplication(): Promise<void> {
    const testName = '信息去重测试';
    console.log(`🔍 运行测试: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      const crawler = new EnhancedMCPCrawler(this.config.deepseekApiKey, {
        githubToken: this.config.githubToken,
        customConfig: {
          deduplication: {
            contentSimilarityThreshold: 0.8,
            titleSimilarityThreshold: 0.7,
            urlSimilarityThreshold: 0.9,
            enableSemanticDeduplication: true
          }
        }
      });

      const result = await crawler.generateToolReport(this.config.testTools[0]);
      
      if (!result.success) {
        throw new Error(result.error || '报告生成失败');
      }

      // 检查去重效果
      const itemsProcessed = result.metadata.stages.processing.itemsProcessed;
      const itemsFound = result.metadata.stages.collection.itemsFound;
      
      if (itemsProcessed > itemsFound) {
        throw new Error('去重后项目数量不应该增加');
      }

      crawler.cleanup();

      this.results.push({
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: {
          itemsFound,
          itemsProcessed,
          deduplicationRate: ((itemsFound - itemsProcessed) / itemsFound * 100).toFixed(1) + '%'
        }
      });

      console.log(`✅ ${testName} 通过`);
    } catch (error: any) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });

      console.log(`❌ ${testName} 失败: ${error.message}`);
    }
  }

  // 测试DeepSeek集成
  private async testDeepSeekIntegration(): Promise<void> {
    const testName = 'DeepSeek集成测试';
    console.log(`🔍 运行测试: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      const crawler = new EnhancedMCPCrawler(this.config.deepseekApiKey, {
        preset: 'HIGH_QUALITY'
      });

      const result = await crawler.generateToolReport(this.config.testTools[0]);
      
      if (!result.success) {
        throw new Error(result.error || '报告生成失败');
      }

      // 检查格式化结果
      if (!result.metadata.stages.formatting.success) {
        throw new Error('DeepSeek格式化失败');
      }

      // 检查报告结构
      if (!result.report || !result.report.overview) {
        throw new Error('报告结构不完整');
      }

      const sections = ['overview', 'installation', 'usage'];
      for (const section of sections) {
        if (!result.report[section]) {
          throw new Error(`缺少报告部分: ${section}`);
        }
      }

      crawler.cleanup();

      this.results.push({
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: {
          formattingSuccess: result.metadata.stages.formatting.success,
          reportSections: Object.keys(result.report).length,
          overviewLength: result.report.overview.length
        }
      });

      console.log(`✅ ${testName} 通过`);
    } catch (error: any) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });

      console.log(`❌ ${testName} 失败: ${error.message}`);
    }
  }

  // 测试错误处理
  private async testErrorHandling(): Promise<void> {
    const testName = '错误处理测试';
    console.log(`🔍 运行测试: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      const crawler = new EnhancedMCPCrawler(this.config.deepseekApiKey, {
        preset: 'FAST'
      });

      // 测试不存在的工具
      const result = await crawler.generateToolReport('non-existent-tool-xyz-123');
      
      // 应该失败但不抛出异常
      if (result.success) {
        throw new Error('应该处理不存在的工具并返回失败结果');
      }

      if (!result.error) {
        throw new Error('应该提供错误信息');
      }

      if (!result.metadata) {
        throw new Error('应该提供元数据');
      }

      crawler.cleanup();

      this.results.push({
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: {
          errorHandled: true,
          errorMessage: result.error,
          metadataProvided: !!result.metadata
        }
      });

      console.log(`✅ ${testName} 通过`);
    } catch (error: any) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });

      console.log(`❌ ${testName} 失败: ${error.message}`);
    }
  }

  // 测试性能
  private async testPerformance(): Promise<void> {
    const testName = '性能测试';
    console.log(`🔍 运行测试: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      const crawler = new EnhancedMCPCrawler(this.config.deepseekApiKey, {
        githubToken: this.config.githubToken,
        preset: 'FAST'
      });

      const result = await crawler.generateToolReport(this.config.testTools[0]);
      
      if (!result.success) {
        throw new Error(result.error || '报告生成失败');
      }

      const duration = result.metadata.duration;
      const maxDuration = 60000; // 60秒

      if (duration > maxDuration) {
        throw new Error(`处理时间过长: ${duration}ms > ${maxDuration}ms`);
      }

      const apiCalls = result.metadata.performance.totalApiCalls;
      const maxApiCalls = 20;

      if (apiCalls > maxApiCalls) {
        throw new Error(`API调用过多: ${apiCalls} > ${maxApiCalls}`);
      }

      crawler.cleanup();

      this.results.push({
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: {
          processingDuration: duration,
          apiCalls,
          performanceGrade: duration < 30000 ? 'A' : duration < 45000 ? 'B' : 'C'
        }
      });

      console.log(`✅ ${testName} 通过`);
    } catch (error: any) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });

      console.log(`❌ ${testName} 失败: ${error.message}`);
    }
  }

  // 测试批量处理
  private async testBatchProcessing(): Promise<void> {
    const testName = '批量处理测试';
    console.log(`🔍 运行测试: ${testName}`);
    
    const startTime = Date.now();
    
    try {
      const crawler = new EnhancedMCPCrawler(this.config.deepseekApiKey, {
        githubToken: this.config.githubToken,
        preset: 'FAST'
      });

      const testTools = this.config.testTools.slice(0, 2); // 只测试前2个工具
      const results = await crawler.generateMultipleReports(testTools);
      
      if (!results.success) {
        throw new Error(results.error || '批量处理失败');
      }

      const successCount = results.results.filter((r: any) => r.success).length;
      if (successCount === 0) {
        throw new Error('批量处理中没有成功的项目');
      }

      if (!results.summary) {
        throw new Error('缺少批量处理汇总');
      }

      crawler.cleanup();

      this.results.push({
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: {
          totalTools: testTools.length,
          successCount,
          failureCount: testTools.length - successCount,
          averageDuration: results.summary.averageDuration
        }
      });

      console.log(`✅ ${testName} 通过`);
    } catch (error: any) {
      this.results.push({
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error.message
      });

      console.log(`❌ ${testName} 失败: ${error.message}`);
    }
  }

  // 生成测试汇总
  private generateTestSummary(): string {
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const avgDuration = totalDuration / this.results.length;
    
    const summary = {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length,
      passedTests: this.results.filter(r => r.success).length,
      failedTests: this.results.filter(r => !r.success).length,
      totalDuration,
      averageDuration: Math.round(avgDuration),
      testDetails: this.results.map(r => ({
        name: r.testName,
        success: r.success,
        duration: r.duration,
        error: r.error,
        details: r.details
      }))
    };

    return JSON.stringify(summary, null, 2);
  }

  // 保存测试报告
  async saveTestReport(filePath: string): Promise<void> {
    const fs = await import('fs/promises');
    const summary = this.generateTestSummary();
    await fs.writeFile(filePath, summary, 'utf-8');
    console.log(`📄 测试报告已保存到: ${filePath}`);
  }
}

// 运行测试的便捷函数
export async function runMCPCrawlerTests(config: TestConfig): Promise<any> {
  const testSuite = new MCPCrawlerTestSuite(config);
  return await testSuite.runAllTests();
}

// 示例测试配置
export const EXAMPLE_TEST_CONFIG: TestConfig = {
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  githubToken: process.env.GITHUB_TOKEN,
  stackOverflowKey: process.env.STACKOVERFLOW_KEY,
  testTools: [
    '@modelcontextprotocol/server-filesystem',
    'playwright',
    'express'
  ],
  outputDir: './test-reports'
};

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  if (!EXAMPLE_TEST_CONFIG.deepseekApiKey) {
    console.error('❌ 请设置 DEEPSEEK_API_KEY 环境变量');
    process.exit(1);
  }

  runMCPCrawlerTests(EXAMPLE_TEST_CONFIG)
    .then(async (result) => {
      const testSuite = new MCPCrawlerTestSuite(EXAMPLE_TEST_CONFIG);
      await testSuite.saveTestReport('./test-results.json');
      
      if (!result.success) {
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('❌ 测试运行失败:', error);
      process.exit(1);
    });
}