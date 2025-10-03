import { NPMFetcher } from '../src/lib/crawl/fetchers/npm';

async function testNPMFetch() {
  console.log('🧪 测试 NPM 抓取功能...');
  
  const fetcher = new NPMFetcher();
  
  try {
    console.log('\n🔍 搜索 "mcp" 相关包...');
    const results = await fetcher.searchPackages('mcp', { size: 5 });
    
    console.log(`📦 找到 ${results.length} 个包:`);
    
    for (const result of results) {
      const pkg = result.package;
      console.log(`\n📋 包信息:`);
      console.log(`   - 名称: ${pkg.name}`);
      console.log(`   - 版本: ${pkg.version}`);
      console.log(`   - 描述: ${pkg.description}`);
      console.log(`   - 关键词: ${pkg.keywords?.join(', ') || '无'}`);
      console.log(`   - 评分: ${result.score.final.toFixed(2)}`);
      console.log(`   - MCP 相关: ${fetcher.isMCPRelated(pkg) ? '是' : '否'}`);
      
      // 获取详细信息
      try {
        const details = await fetcher.getPackageDetails(pkg.name);
        console.log(`   - 作者: ${fetcher.extractAuthor(details) || '未知'}`);
        console.log(`   - 仓库: ${fetcher.extractRepositoryUrl(details) || '无'}`);
        console.log(`   - 安装命令: ${fetcher.generateInstallCommand(pkg.name)}`);
        
        // 获取下载统计
        const downloads = await fetcher.getDownloadStats(pkg.name);
        console.log(`   - 月下载量: ${downloads}`);
        
      } catch (error) {
        console.log(`   - 详细信息获取失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
    
    console.log('\n✅ NPM 抓取测试完成');
    
  } catch (error) {
    console.error('❌ NPM 抓取测试失败:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  testNPMFetch()
    .then(() => {
      console.log('✅ 测试完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 测试失败:', error);
      process.exit(1);
    });
}

export { testNPMFetch };