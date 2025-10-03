/**
 * MCP工具信息收集器使用示例
 * 
 * 本文件展示了如何使用增强版MCP工具信息收集器来：
 * 1. 生成单个工具的详细报告
 * 2. 批量生成多个工具的报告
 * 3. 自定义配置和参数
 * 4. 处理错误和监控进度
 */

import { 
  EnhancedMCPCrawler, 
  generateQuickReport, 
  generateBatchReports,
  DEFAULT_CONFIGS 
} from './enhanced-crawler';

// 示例1: 生成单个工具的详细报告
async function example1_SingleToolReport() {
  console.log('=== 示例1: 生成单个工具报告 ===');
  
  const crawler = new EnhancedMCPCrawler(process.env.DEEPSEEK_API_KEY!, {
    githubToken: process.env.GITHUB_TOKEN,
    preset: 'HIGH_QUALITY'
  });

  try {
    const result = await crawler.generateToolReport('@modelcontextprotocol/server-filesystem', {
      exportFormat: 'markdown',
      saveToFile: './reports',
      onProgress: (stage, progress, message) => {
        console.log(`[${stage}] ${progress}% - ${message}`);
      }
    });

    if (result.success) {
      console.log('✅ 报告生成成功!');
      console.log(`📄 文件路径: ${result.filePath}`);
      console.log(`⏱️  处理时长: ${result.metadata.duration}ms`);
      console.log(`📊 信息源数量: ${result.metadata.stages.collection.itemsFound}`);
    } else {
      console.error('❌ 报告生成失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 执行出错:', error);
  } finally {
    crawler.cleanup();
  }
}

// 示例2: 批量生成多个工具报告
async function example2_BatchReports() {
  console.log('=== 示例2: 批量生成工具报告 ===');
  
  const toolNames = [
    '@modelcontextprotocol/server-filesystem',
    '@modelcontextprotocol/server-git',
    '@modelcontextprotocol/server-sqlite'
  ];

  try {
    const result = await generateBatchReports(toolNames, process.env.DEEPSEEK_API_KEY!, {
      githubToken: process.env.GITHUB_TOKEN,
      preset: 'TECHNICAL',
      exportFormat: 'markdown',
      saveToDirectory: './batch-reports',
      onProgress: (stage, progress, message) => {
        console.log(`[批量处理] [${stage}] ${progress}% - ${message}`);
      }
    });

    if (result.success) {
      console.log('✅ 批量报告生成完成!');
      console.log(`📊 成功: ${result.results.filter((r: any) => r.success).length}/${result.results.length}`);
      
      if (result.summary) {
        console.log('📈 性能汇总:');
        console.log(`- 总处理时长: ${result.summary.totalDuration}ms`);
        console.log(`- 平均处理时长: ${result.summary.averageDuration}ms`);
        console.log(`- 总API调用: ${result.summary.totalApiCalls}`);
        console.log(`- 缓存命中率: ${result.summary.cacheHitRate}%`);
      }
    } else {
      console.error('❌ 批量处理失败:', result.error);
    }
  } catch (error) {
    console.error('❌ 执行出错:', error);
  }
}

// 示例3: 自定义配置
async function example3_CustomConfig() {
  console.log('=== 示例3: 自定义配置 ===');
  
  const crawler = new EnhancedMCPCrawler(process.env.DEEPSEEK_API_KEY!, {
    githubToken: process.env.GITHUB_TOKEN,
    customConfig: {
      deduplication: {
        contentSimilarityThreshold: 0.9, // 更严格的去重
        titleSimilarityThreshold: 0.8,
        urlSimilarityThreshold: 0.95,
        enableSemanticDeduplication: true
      },
      formatting: {
        language: 'zh',
        style: 'professional',
        includeCodeExamples: true,
        includeTroubleshooting: true,
        maxLength: 10000, // 更长的报告
        sections: {
          overview: true,
          installation: true,
          usage: true,
          features: true,
          troubleshooting: true,
          references: true
        }
      },
      options: {
        maxRetries: 5, // 更多重试次数
        retryDelay: 2000,
        enableCache: true,
        cacheExpiry: 24,
        enableLogging: true,
        logLevel: 'debug'
      }
    }
  });

  try {
    // 验证配置
    const validation = await crawler.validateConfiguration();
    if (!validation.valid) {
      console.warn('⚠️  配置验证失败:', validation.issues);
    }
    if (validation.recommendations.length > 0) {
      console.info('💡 配置建议:', validation.recommendations);
    }

    const result = await crawler.generateToolReport('playwright', {
      exportFormat: 'html',
      saveToFile: './custom-reports'
    });

    if (result.success) {
      console.log('✅ 自定义配置报告生成成功!');
    }
  } catch (error) {
    console.error('❌ 执行出错:', error);
  } finally {
    crawler.cleanup();
  }
}

// 示例4: 快速报告生成
async function example4_QuickReport() {
  console.log('=== 示例4: 快速报告生成 ===');
  
  try {
    const result = await generateQuickReport('midscene', process.env.DEEPSEEK_API_KEY!, {
      preset: 'FAST',
      exportFormat: 'json',
      saveToFile: './quick-reports'
    });

    if (result.success) {
      console.log('✅ 快速报告生成成功!');
      console.log('📄 报告内容预览:');
      console.log(JSON.stringify(result.report?.overview, null, 2));
    }
  } catch (error) {
    console.error('❌ 执行出错:', error);
  }
}

// 示例5: 错误处理和监控
async function example5_ErrorHandling() {
  console.log('=== 示例5: 错误处理和监控 ===');
  
  const crawler = new EnhancedMCPCrawler(process.env.DEEPSEEK_API_KEY!, {
    preset: 'HIGH_QUALITY'
  });

  try {
    // 尝试处理一个不存在的工具
    const result = await crawler.generateToolReport('non-existent-tool-12345', {
      onProgress: (stage, progress, message) => {
        console.log(`[${stage}] ${progress}% - ${message}`);
      }
    });

    if (!result.success) {
      console.log('❌ 预期的失败:', result.error);
      console.log('📊 元数据:', result.metadata);
    }

    // 处理网络错误情况
    crawler.updateConfig({
      options: {
        maxRetries: 1,
        retryDelay: 500,
        enableCache: true,
        cacheExpiry: 12,
        enableLogging: false,
        logLevel: 'error'
      }
    });

    console.log('🔄 已更新配置，重试次数减少');
  } catch (error) {
    console.error('❌ 执行出错:', error);
  } finally {
    crawler.cleanup();
  }
}

// 示例6: 性能优化配置
async function example6_PerformanceOptimization() {
  console.log('=== 示例6: 性能优化配置 ===');
  
  const crawler = new EnhancedMCPCrawler(process.env.DEEPSEEK_API_KEY!, {
    preset: 'FAST', // 使用快速预设
    customConfig: {
      options: {
        enableCache: true,
        cacheExpiry: 48, // 48小时缓存
        maxRetries: 1, // 减少重试
        retryDelay: 1000,
        enableLogging: false,
        logLevel: 'error'
      },
      deduplication: {
        contentSimilarityThreshold: 0.6,
        titleSimilarityThreshold: 0.5,
        urlSimilarityThreshold: 0.8,
        enableSemanticDeduplication: false // 关闭语义去重以提高速度
      }
    }
  });

  const startTime = Date.now();
  
  try {
    const result = await crawler.generateToolReport('express', {
      exportFormat: 'markdown'
    });

    const duration = Date.now() - startTime;
    console.log(`⚡ 性能优化处理完成，耗时: ${duration}ms`);
    
    if (result.success) {
      console.log('✅ 报告生成成功!');
      console.log(`📊 缓存命中: ${result.metadata.performance.cacheHits}`);
      console.log(`🔄 重试次数: ${result.metadata.performance.retries}`);
    }
  } catch (error) {
    console.error('❌ 执行出错:', error);
  } finally {
    crawler.cleanup();
  }
}

// 主函数 - 运行所有示例
async function runAllExamples() {
  console.log('🚀 开始运行MCP工具信息收集器示例...\n');

  // 检查必要的环境变量
  if (!process.env.DEEPSEEK_API_KEY) {
    console.error('❌ 请设置 DEEPSEEK_API_KEY 环境变量');
    return;
  }

  try {
    await example1_SingleToolReport();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await example2_BatchReports();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await example3_CustomConfig();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await example4_QuickReport();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await example5_ErrorHandling();
    console.log('\n' + '='.repeat(50) + '\n');
    
    await example6_PerformanceOptimization();
    
    console.log('\n✅ 所有示例运行完成!');
  } catch (error) {
    console.error('❌ 示例运行失败:', error);
  }
}

// 导出示例函数
export {
  example1_SingleToolReport,
  example2_BatchReports,
  example3_CustomConfig,
  example4_QuickReport,
  example5_ErrorHandling,
  example6_PerformanceOptimization,
  runAllExamples
};

// 如果直接运行此文件，则执行所有示例
if (require.main === module) {
  runAllExamples().catch(console.error);
}