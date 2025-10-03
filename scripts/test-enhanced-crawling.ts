import { NPMFetcher } from '../src/lib/crawl/fetchers/npm';
import { GitHubFetcher } from '../src/lib/crawl/fetchers/github';
// import { createLLMClient } from '../src/lib/llm/client';

async function testEnhancedCrawling() {
  console.log('🧪 测试增强的抓取逻辑...');
  
  const npmFetcher = new NPMFetcher();
  const githubFetcher = new GitHubFetcher();
  // const llmClient = createLLMClient(); // 暂时跳过LLM测试
  
  try {
    console.log('\n🔍 测试增强的NPM抓取...');
    
    // 直接测试NPM抓取方法
    const npmSearchResults = await npmFetcher.searchPackages('mcp', { size: 3 });
    const npmResults = [];
    
    for (const searchResult of npmSearchResults.slice(0, 2)) {
      try {
        const enhancedDetails = await npmFetcher.getEnhancedPackageDetails(searchResult.package.name);
        const pkg = searchResult.package;
        
        const result = {
          rawTitle: pkg.name,
          rawDescription: pkg.description,
          rawReadme: [
            enhancedDetails.readme,
            enhancedDetails.repositoryContent
          ].filter(content => content && content.trim()).join('\n\n===\n\n'),
          rawMetadata: {
            type: 'npm',
            hasReadme: !!enhancedDetails.readme,
            hasRepositoryInfo: !!enhancedDetails.repositoryContent,
            repositoryType: enhancedDetails.package.repository?.url?.includes('github.com') ? 'github' : 'other',
            downloads: enhancedDetails.downloads,
          }
        };
        
        npmResults.push(result);
      } catch (error) {
        console.error(`处理包 ${searchResult.package.name} 失败:`, error);
      }
    }
    
    console.log(`📦 NPM抓取结果: ${npmResults.length} 个包`);
    
    for (const result of npmResults) {
      console.log(`\n📋 包信息:`);
      console.log(`   - 名称: ${result.rawTitle}`);
      console.log(`   - 描述: ${result.rawDescription}`);
      console.log(`   - README长度: ${result.rawReadme.length} 字符`);
      console.log(`   - 元数据:`);
      console.log(`     * 有README: ${result.rawMetadata.hasReadme}`);
      console.log(`     * 有仓库信息: ${result.rawMetadata.hasRepositoryInfo}`);
      console.log(`     * 仓库类型: ${result.rawMetadata.repositoryType}`);
      console.log(`     * 下载量: ${result.rawMetadata.downloads}`);
      
      // 暂时跳过LLM处理
      console.log('⏭️  跳过LLM处理测试 (需要配置API密钥)');
    }
    
    console.log('\n🔍 测试增强的GitHub抓取...');
    
    // 直接测试GitHub抓取方法
    const githubRepos = await githubFetcher.searchRepositories('topic:mcp', {
      sort: 'stars',
      per_page: 3,
    });
    
    const githubResults = [];
    
    for (const repo of githubRepos.slice(0, 2)) {
      try {
        const enhancedInfo = await githubFetcher.getEnhancedRepositoryInfo(
          repo.owner.login, 
          repo.name
        );

        // 检查是否与 MCP 相关
        if (!githubFetcher.isMCPRelated(repo, enhancedInfo.readme, enhancedInfo.packageJson)) {
          continue;
        }

        const result = {
          rawTitle: repo.name,
          rawDescription: repo.description,
          rawReadme: [
            enhancedInfo.readme,
            enhancedInfo.documentation.docs.join('\n\n---\n\n'),
            enhancedInfo.documentation.examples.join('\n\n---\n\n'),
            enhancedInfo.additionalFiles.join('\n\n---\n\n')
          ].filter(content => content && content.trim()).join('\n\n===\n\n'),
          rawMetadata: {
            type: 'github',
            stars: repo.stargazers_count,
            hasReadme: !!enhancedInfo.readme,
            hasDocumentation: enhancedInfo.documentation.docs.length > 0,
            hasExamples: enhancedInfo.documentation.examples.length > 0,
            hasConfigFiles: enhancedInfo.additionalFiles.length > 0,
            documentationCount: enhancedInfo.documentation.docs.length,
            exampleCount: enhancedInfo.documentation.examples.length,
            configFileCount: enhancedInfo.additionalFiles.length,
          }
        };
        
        githubResults.push(result);
      } catch (error) {
        console.error(`处理仓库 ${repo.full_name} 失败:`, error);
      }
    }
    
    console.log(`📦 GitHub抓取结果: ${githubResults.length} 个仓库`);
    
    for (const result of githubResults) {
      console.log(`\n📋 仓库信息:`);
      console.log(`   - 名称: ${result.rawTitle}`);
      console.log(`   - 描述: ${result.rawDescription}`);
      console.log(`   - README长度: ${result.rawReadme.length} 字符`);
      console.log(`   - 元数据:`);
      console.log(`     * 星标数: ${result.rawMetadata.stars}`);
      console.log(`     * 有README: ${result.rawMetadata.hasReadme}`);
      console.log(`     * 有文档: ${result.rawMetadata.hasDocumentation}`);
      console.log(`     * 有示例: ${result.rawMetadata.hasExamples}`);
      console.log(`     * 有配置文件: ${result.rawMetadata.hasConfigFiles}`);
      console.log(`     * 文档数量: ${result.rawMetadata.documentationCount}`);
      console.log(`     * 示例数量: ${result.rawMetadata.exampleCount}`);
      console.log(`     * 配置文件数量: ${result.rawMetadata.configFileCount}`);
      
      // 暂时跳过LLM处理
      console.log('⏭️  跳过LLM处理测试 (需要配置API密钥)');
    }
    
    console.log('\n✅ 增强抓取逻辑测试完成');
    
    // 输出测试总结
    console.log('\n📊 测试总结:');
    console.log(`   - NPM结果数量: ${npmResults.length}`);
    console.log(`   - GitHub结果数量: ${githubResults.length}`);
    console.log(`   - 总计处理: ${npmResults.length + githubResults.length} 个工具`);
    
  } catch (error) {
    console.error('❌ 增强抓取逻辑测试失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testEnhancedCrawling()
    .then(() => {
      console.log('✅ 测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 测试失败:', error);
      process.exit(1);
    });
}

export { testEnhancedCrawling };