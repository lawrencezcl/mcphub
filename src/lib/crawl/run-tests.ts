#!/usr/bin/env node

/**
 * MCP工具信息收集系统测试运行器
 * 
 * 运行完整的集成测试套件，验证系统功能
 */

import { runMCPCrawlerIntegrationTests, DEFAULT_INTEGRATION_TEST_CONFIG } from './integration-test';
import { EnhancedMCPCrawler } from './enhanced-crawler';

// 测试配置
const TEST_CONFIG = {
  ...DEFAULT_INTEGRATION_TEST_CONFIG,
  testTools: ['playwright', 'puppeteer', 'jest'],
  maxTestDuration: 30000, // 30秒超时
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || 'sk-test-key-for-demo',
  githubToken: process.env.GITHUB_TOKEN,
  stackOverflowKey: process.env.STACKOVERFLOW_KEY,
  preset: 'FAST' as const
};

async function main() {
  console.log('🚀 启动MCP工具信息收集系统测试...\n');
  
  try {
    // 运行集成测试
    console.log('📋 开始运行集成测试套件...');
    const testResult = await runMCPCrawlerIntegrationTests(TEST_CONFIG);
    
    // 输出测试结果摘要
    console.log('\n' + '='.repeat(60));
    console.log('📊 测试结果摘要');
    console.log('='.repeat(60));
    console.log(`总测试数: ${testResult.totalTests}`);
    console.log(`通过测试: ${testResult.passedTests} ✅`);
    console.log(`失败测试: ${testResult.failedTests} ❌`);
    console.log(`成功率: ${testResult.summary.successRate.toFixed(2)}%`);
    console.log(`总耗时: ${testResult.totalDuration}ms`);
    console.log(`平均耗时: ${testResult.summary.averageDuration.toFixed(2)}ms`);
    
    // 显示关键失败
    if (testResult.summary.criticalFailures.length > 0) {
      console.log('\n⚠️  关键失败:');
      testResult.summary.criticalFailures.forEach(failure => {
        console.log(`  - ${failure.testName}: ${failure.errorMessage}`);
      });
    }
    
    // 显示详细结果
    console.log('\n📋 详细测试结果:');
    testResult.results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      console.log(`  ${status} ${result.testName} (${result.duration}ms)`);
      if (!result.success && result.errorMessage) {
        console.log(`     错误: ${result.errorMessage}`);
      }
      if (result.metrics) {
        console.log(`     指标: 信息收集=${result.metrics.informationCollected}, 处理时间=${result.metrics.processingTime}ms, 报告大小=${result.metrics.reportSize}字节`);
      }
    });
    
    // 运行快速功能演示
    console.log('\n' + '='.repeat(60));
    console.log('🎯 快速功能演示');
    console.log('='.repeat(60));
    
    await runQuickDemo();
    
    // 最终状态
    const overallSuccess = testResult.summary.successRate >= 80; // 80%通过率为成功
    
    console.log('\n' + '='.repeat(60));
    if (overallSuccess) {
      console.log('🎉 测试完成！系统运行正常');
      console.log('✨ MCP工具信息收集系统已准备就绪');
    } else {
      console.log('⚠️  测试完成，但存在问题');
      console.log('🔧 请检查失败的测试并修复相关问题');
    }
    console.log('='.repeat(60));
    
    process.exit(overallSuccess ? 0 : 1);
    
  } catch (error: any) {
    console.error('\n💥 测试运行失败:', error.message);
    console.error('堆栈跟踪:', error.stack);
    process.exit(1);
  }
}

// 快速功能演示
async function runQuickDemo() {
  try {
    console.log('🔍 演示: 生成单个工具报告...');
    
    const crawler = new EnhancedMCPCrawler(TEST_CONFIG.deepseekApiKey, {
      githubToken: TEST_CONFIG.githubToken,
      stackOverflowKey: TEST_CONFIG.stackOverflowKey,
      preset: 'FAST'
    });
    
    // 生成一个简单的工具报告
    const result = await crawler.generateToolReport('playwright', {
      exportFormat: 'json'
    });
    
    if (result.success) {
      console.log('✅ 报告生成成功!');
      console.log(`   - 数据源数量: ${result.metadata?.totalSources || 0}`);
      console.log(`   - 处理时间: ${result.metadata?.processingTimeMs || 0}ms`);
      console.log(`   - 报告大小: ${result.report ? JSON.stringify(result.report).length : 0} 字节`);
      
      if (result.report) {
        console.log('   - 报告结构:');
        console.log(`     * 概述: ${result.report.sections?.overview?.length || 0} 字符`);
        console.log(`     * 安装: ${result.report.sections?.installation?.length || 0} 字符`);
        console.log(`     * 使用: ${result.report.sections?.usage?.length || 0} 字符`);
      }
    } else {
      console.log('❌ 报告生成失败');
      if (result.error) {
        console.log(`   错误: ${result.error}`);
      }
    }
    
    // 清理资源
    await crawler.cleanup();
    
  } catch (error: any) {
    console.log(`❌ 演示失败: ${error.message}`);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  console.error('💥 未捕获的异常:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 未处理的Promise拒绝:', reason);
  process.exit(1);
});

// 运行主函数
if (require.main === module) {
  main().catch(error => {
    console.error('💥 主函数执行失败:', error);
    process.exit(1);
  });
}

export { main as runTests };