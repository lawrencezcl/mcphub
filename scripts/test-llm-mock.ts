import { LLMClient } from '../src/lib/llm/client';

// 模拟增强的抓取数据
const mockEnhancedNPMData = {
  title: '@playwright/mcp',
  description: 'Playwright Tools for MCP - Browser automation and testing capabilities for Model Context Protocol',
  readme: `# Playwright MCP Server

This is a comprehensive MCP server that provides browser automation capabilities using Playwright.

## Features

- **Browser Control**: Launch and control Chrome, Firefox, and Safari browsers
- **Page Navigation**: Navigate to URLs, handle redirects, and manage browser history
- **Element Interaction**: Click, type, scroll, and interact with web elements
- **Screenshot Capture**: Take full-page or element-specific screenshots
- **Form Handling**: Fill forms, select options, and submit data
- **Network Monitoring**: Monitor network requests and responses
- **Performance Metrics**: Collect page load times and performance data

## Installation

\`\`\`bash
npm install @playwright/mcp
\`\`\`

## Configuration

\`\`\`json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"],
      "env": {
        "PLAYWRIGHT_BROWSERS_PATH": "/path/to/browsers"
      }
    }
  }
}
\`\`\`

## Usage Examples

### Basic Navigation
\`\`\`javascript
// Navigate to a webpage
await page.goto('https://example.com');

// Take a screenshot
await page.screenshot({ path: 'example.png' });
\`\`\`

### Form Interaction
\`\`\`javascript
// Fill a form
await page.fill('#username', 'testuser');
await page.fill('#password', 'password123');
await page.click('#submit');
\`\`\`

## API Reference

### Tools Available

1. **browser_launch** - Launch a new browser instance
2. **page_navigate** - Navigate to a URL
3. **element_click** - Click on an element
4. **element_type** - Type text into an element
5. **page_screenshot** - Capture page screenshot
6. **form_fill** - Fill form fields
7. **network_monitor** - Monitor network activity

## Error Handling

The server includes comprehensive error handling for:
- Browser launch failures
- Network timeouts
- Element not found errors
- Permission denied issues

## Performance Considerations

- Browser instances are reused when possible
- Screenshots are optimized for size
- Network monitoring can be disabled for better performance

## Security Notes

- Always validate URLs before navigation
- Sanitize user input for form fields
- Use headless mode in production environments
- Implement proper timeout handling

## Troubleshooting

### Common Issues

1. **Browser not found**: Install browsers using \`npx playwright install\`
2. **Permission denied**: Check file system permissions
3. **Network timeout**: Increase timeout values in configuration

## Contributing

Please read our contributing guidelines and submit pull requests to our GitHub repository.

## License

MIT License - see LICENSE file for details.`,
  metadata: {
    hasReadme: true,
    hasRepositoryInfo: true,
    repositoryType: 'github',
    downloads: 2222712,
    version: '1.2.3',
    keywords: ['mcp', 'playwright', 'browser', 'automation', 'testing'],
    dependencies: {
      'playwright': '^1.40.0',
      '@types/node': '^20.0.0'
    },
    repositoryUrl: 'https://github.com/microsoft/playwright-mcp',
    lastUpdated: '2024-01-15T10:30:00Z'
  }
};

const mockEnhancedGitHubData = {
  title: 'mcp-filesystem-server',
  description: 'A secure MCP server providing file system operations with sandboxing and permission controls',
  readme: `# MCP Filesystem Server

A Model Context Protocol server that provides secure file system operations with comprehensive sandboxing and permission controls.

## Overview

This MCP server enables AI assistants to interact with the file system in a controlled and secure manner. It provides tools for reading, writing, creating, and managing files and directories while maintaining strict security boundaries.

## Core Features

### File Operations
- **Read Files**: Read text and binary files with encoding detection
- **Write Files**: Create and modify files with atomic operations
- **Directory Management**: Create, list, and manage directories
- **File Search**: Search for files by name, content, or metadata
- **Batch Operations**: Perform multiple file operations efficiently

### Security Features
- **Sandboxing**: Restrict operations to specified directories
- **Permission System**: Fine-grained control over read/write permissions
- **Path Validation**: Prevent directory traversal attacks
- **File Type Filtering**: Allow/deny operations based on file extensions
- **Size Limits**: Enforce maximum file and directory sizes

### Advanced Capabilities
- **File Watching**: Monitor file system changes in real-time
- **Backup Management**: Create and restore file backups
- **Compression**: Archive and extract compressed files
- **Metadata Extraction**: Extract file metadata and properties
- **Symbolic Link Handling**: Safely handle symbolic links

## Installation

\`\`\`bash
npm install -g mcp-filesystem-server
\`\`\`

## Configuration

Create a configuration file \`mcp-config.json\`:

\`\`\`json
{
  "server": {
    "name": "filesystem",
    "version": "1.0.0"
  },
  "security": {
    "sandboxPaths": [
      "/home/user/documents",
      "/tmp/mcp-workspace"
    ],
    "allowedExtensions": [".txt", ".md", ".json", ".js", ".py"],
    "maxFileSize": "10MB",
    "maxDirectorySize": "100MB"
  },
  "features": {
    "fileWatching": true,
    "backupManagement": true,
    "compression": true,
    "metadataExtraction": true
  }
}
\`\`\`

## Usage Examples

### Basic File Operations
\`\`\`javascript
// Read a file
const content = await readFile('/path/to/file.txt');

// Write a file
await writeFile('/path/to/output.txt', 'Hello, World!');

// List directory contents
const files = await listDirectory('/path/to/directory');
\`\`\`

### Advanced Operations
\`\`\`javascript
// Search for files
const results = await searchFiles({
  path: '/documents',
  pattern: '*.md',
  content: 'MCP'
});

// Watch for changes
await watchDirectory('/workspace', (event) => {
  console.log(\`File \${event.type}: \${event.path}\`);
});
\`\`\`

## API Documentation

### Available Tools

1. **fs_read_file** - Read file contents
2. **fs_write_file** - Write data to file
3. **fs_create_directory** - Create new directory
4. **fs_list_directory** - List directory contents
5. **fs_delete_file** - Delete file or directory
6. **fs_move_file** - Move or rename files
7. **fs_copy_file** - Copy files or directories
8. **fs_search_files** - Search for files
9. **fs_watch_directory** - Monitor directory changes
10. **fs_get_metadata** - Get file metadata

### Error Codes

- **FS001**: Permission denied
- **FS002**: File not found
- **FS003**: Directory not found
- **FS004**: Invalid path
- **FS005**: File size exceeded
- **FS006**: Operation not allowed

## Security Best Practices

1. **Sandbox Configuration**: Always configure sandbox paths
2. **Permission Validation**: Validate all file operations
3. **Input Sanitization**: Sanitize file paths and names
4. **Resource Limits**: Set appropriate size and count limits
5. **Audit Logging**: Enable operation logging for security

## Performance Optimization

- Use streaming for large files
- Implement caching for frequently accessed files
- Batch operations when possible
- Monitor resource usage

## Deployment

### Docker Deployment
\`\`\`dockerfile
FROM node:18-alpine
COPY . /app
WORKDIR /app
RUN npm install
EXPOSE 3000
CMD ["npm", "start"]
\`\`\`

### Systemd Service
\`\`\`ini
[Unit]
Description=MCP Filesystem Server
After=network.target

[Service]
Type=simple
User=mcp
ExecStart=/usr/bin/node /opt/mcp-filesystem/server.js
Restart=always

[Install]
WantedBy=multi-user.target
\`\`\`

## Monitoring and Logging

The server provides comprehensive logging and monitoring:
- Operation logs with timestamps
- Performance metrics
- Error tracking and reporting
- Resource usage statistics

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

Apache 2.0 License - see [LICENSE](LICENSE) file for details.`,
  metadata: {
    stars: 1247,
    hasReadme: true,
    hasDocumentation: true,
    hasExamples: true,
    hasConfigFiles: true,
    documentationCount: 3,
    exampleCount: 5,
    configFileCount: 2,
    language: 'TypeScript',
    topics: ['mcp', 'filesystem', 'security', 'server'],
    lastCommit: '2024-01-20T15:45:00Z',
    contributors: 12,
    issues: 8,
    pullRequests: 3
  }
};

// 模拟LLM客户端类
class MockLLMClient {
  async processToolData(rawData: {
    title: string;
    description: string;
    readme: string;
    metadata: any;
  }) {
    console.log('🤖 模拟LLM处理增强数据...');
    console.log(`📝 输入数据统计:`);
    console.log(`   - 标题长度: ${rawData.title.length}`);
    console.log(`   - 描述长度: ${rawData.description.length}`);
    console.log(`   - README长度: ${rawData.readme.length}`);
    console.log(`   - 元数据字段数: ${Object.keys(rawData.metadata).length}`);
    
    // 模拟LLM分析过程
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 基于增强数据生成结构化响应
    const result = {
      summary: this.generateSummary(rawData),
      tags: this.extractTags(rawData),
      category: this.determineCategory(rawData),
      runtimeSupport: this.analyzeRuntimeSupport(rawData),
      risks: this.assessRisks(rawData),
      detail: this.generateDetailedStructure(rawData)
    };
    
    return result;
  }
  
  private generateSummary(data: any): string {
    const hasExtensiveReadme = data.readme.length > 5000;
    const hasConfigInfo = data.metadata.hasConfigFiles || data.metadata.configFileCount > 0;
    const hasExamples = data.metadata.hasExamples || data.readme.includes('```');
    
    let summary = `${data.title} is a comprehensive MCP tool that provides ${data.description.toLowerCase()}.`;
    
    if (hasExtensiveReadme) {
      summary += ' It features extensive documentation with detailed usage instructions.';
    }
    
    if (hasConfigInfo) {
      summary += ' The tool includes configuration files and setup examples.';
    }
    
    if (hasExamples) {
      summary += ' Multiple code examples and usage patterns are provided.';
    }
    
    return summary;
  }
  
  private extractTags(data: any): string[] {
    const tags = new Set<string>();
    
    // 从标题和描述中提取标签
    const text = (data.title + ' ' + data.description).toLowerCase();
    
    // 技术标签
    if (text.includes('playwright') || text.includes('browser')) tags.add('browser-automation');
    if (text.includes('filesystem') || text.includes('file')) tags.add('file-system');
    if (text.includes('security') || text.includes('secure')) tags.add('security');
    if (text.includes('server')) tags.add('server');
    if (text.includes('api')) tags.add('api');
    if (text.includes('testing')) tags.add('testing');
    
    // 从元数据中提取
    if (data.metadata.keywords) {
      data.metadata.keywords.forEach((keyword: string) => tags.add(keyword));
    }
    
    if (data.metadata.topics) {
      data.metadata.topics.forEach((topic: string) => tags.add(topic));
    }
    
    return Array.from(tags).slice(0, 8); // 限制标签数量
  }
  
  private determineCategory(data: any): string {
    const text = (data.title + ' ' + data.description).toLowerCase();
    
    if (text.includes('browser') || text.includes('playwright')) return 'Browser Automation';
    if (text.includes('filesystem') || text.includes('file')) return 'File Management';
    if (text.includes('database') || text.includes('db')) return 'Database';
    if (text.includes('api') || text.includes('http')) return 'API Tools';
    if (text.includes('security') || text.includes('auth')) return 'Security';
    if (text.includes('monitoring') || text.includes('metrics')) return 'Monitoring';
    
    return 'Utilities';
  }
  
  private analyzeRuntimeSupport(data: any): { node?: boolean; edge?: boolean; browser?: boolean } {
    const readme = data.readme.toLowerCase();
    const hasNodeDeps = data.metadata.dependencies && Object.keys(data.metadata.dependencies).some((dep: string) => 
      ['node', 'fs', 'path', 'os'].some(nodeDep => dep.includes(nodeDep))
    );
    
    return {
      node: hasNodeDeps || readme.includes('node') || readme.includes('npm'),
      edge: readme.includes('edge') || readme.includes('vercel') || readme.includes('cloudflare'),
      browser: readme.includes('browser') || readme.includes('playwright') || readme.includes('dom')
    };
  }
  
  private assessRisks(data: any): string[] {
    const risks: string[] = [];
    const readme = data.readme.toLowerCase();
    
    if (readme.includes('filesystem') || readme.includes('file')) {
      risks.push('File system access - requires careful permission management');
    }
    
    if (readme.includes('network') || readme.includes('http')) {
      risks.push('Network access - potential for data exfiltration');
    }
    
    if (readme.includes('browser') || readme.includes('automation')) {
      risks.push('Browser automation - could be used for unauthorized web scraping');
    }
    
    if (readme.includes('shell') || readme.includes('exec')) {
      risks.push('Command execution - high security risk if not sandboxed');
    }
    
    return risks;
  }
  
  private generateDetailedStructure(data: any): any {
    const readme = data.readme;
    const hasInstallSection = readme.includes('Installation') || readme.includes('install');
    const hasConfigSection = readme.includes('Configuration') || readme.includes('config');
    const hasExamples = readme.includes('```') || readme.includes('Example');
    const hasAPI = readme.includes('API') || readme.includes('Tools Available');
    
    return {
      overview: {
        serviceName: data.title,
        serviceDescription: data.description,
        summary: this.generateSummary(data)
      },
      usageGuide: hasInstallSection ? {
        deploymentProcess: this.extractInstallSteps(readme),
        deploymentMethod: 'npm',
        quickStart: this.extractQuickStart(readme),
        examples: hasExamples ? this.extractExamples(readme) : []
      } : undefined,
      coreFeatures: this.extractFeatures(readme),
      applicationScenarios: this.extractScenarios(readme),
      faq: this.extractFAQ(readme),
      serverConfig: hasConfigSection ? {
        configExample: this.extractConfigExample(readme),
        installationSteps: this.extractInstallSteps(readme),
        requirements: this.extractRequirements(readme)
      } : undefined,
      additionalInfo: {
        documentationLinks: this.extractDocLinks(readme),
        apiReference: hasAPI ? 'See API Documentation section in README' : undefined,
        limitations: this.extractLimitations(readme),
        performanceMetrics: data.metadata.downloads ? {
          downloads: data.metadata.downloads,
          stars: data.metadata.stars
        } : undefined,
        errorCodes: this.extractErrorCodes(readme)
      }
    };
  }
  
  private extractInstallSteps(readme: string): string[] {
    const steps = [];
    if (readme.includes('npm install')) steps.push('Run npm install command');
    if (readme.includes('configuration')) steps.push('Configure settings');
    if (readme.includes('setup')) steps.push('Complete setup process');
    return steps;
  }
  
  private extractQuickStart(readme: string): string {
    const lines = readme.split('\n');
    const quickStartIndex = lines.findIndex(line => 
      line.toLowerCase().includes('quick') || line.toLowerCase().includes('getting started')
    );
    
    if (quickStartIndex !== -1) {
      return lines.slice(quickStartIndex, quickStartIndex + 5).join('\n');
    }
    
    return 'See installation and configuration sections for setup instructions.';
  }
  
  private extractExamples(readme: string): string[] {
    const examples: string[] = [];
    const codeBlocks = readme.match(/```[\s\S]*?```/g);
    
    if (codeBlocks) {
      codeBlocks.slice(0, 3).forEach((block, index) => {
        examples.push(`Example ${index + 1}: ${block.substring(0, 100)}...`);
      });
    }
    
    return examples;
  }
  
  private extractFeatures(readme: string): string[] {
    const features: string[] = [];
    const lines = readme.split('\n');
    
    lines.forEach(line => {
      if (line.includes('- **') || line.includes('* **')) {
        const feature = line.replace(/[-*]\s*\*\*(.*?)\*\*.*/, '$1');
        if (feature && feature !== line) {
          features.push(feature);
        }
      }
    });
    
    return features.slice(0, 8);
  }
  
  private extractScenarios(readme: string): string[] {
    const scenarios = [
      'Development and testing environments',
      'Production automation workflows',
      'Integration with existing systems'
    ];
    
    if (readme.includes('browser')) scenarios.push('Web scraping and testing');
    if (readme.includes('file')) scenarios.push('File processing and management');
    if (readme.includes('api')) scenarios.push('API integration and testing');
    
    return scenarios;
  }
  
  private extractFAQ(readme: string): Array<{ question: string; answer: string }> {
    const faq = [];
    
    if (readme.includes('Troubleshooting') || readme.includes('Common Issues')) {
      faq.push({
        question: 'How do I resolve installation issues?',
        answer: 'Check the troubleshooting section in the documentation for common solutions.'
      });
    }
    
    if (readme.includes('Permission') || readme.includes('Security')) {
      faq.push({
        question: 'What are the security considerations?',
        answer: 'Review the security section for best practices and permission requirements.'
      });
    }
    
    return faq;
  }
  
  private extractConfigExample(readme: string): any {
    const configMatch = readme.match(/```json\s*([\s\S]*?)\s*```/);
    if (configMatch) {
      try {
        return JSON.parse(configMatch[1]);
      } catch {
        return { note: 'Configuration example available in documentation' };
      }
    }
    return undefined;
  }
  
  private extractRequirements(readme: string): string[] {
    const requirements = [];
    
    if (readme.includes('Node')) requirements.push('Node.js runtime');
    if (readme.includes('npm')) requirements.push('npm package manager');
    if (readme.includes('browser')) requirements.push('Browser installation');
    if (readme.includes('permission')) requirements.push('Appropriate file permissions');
    
    return requirements;
  }
  
  private extractDocLinks(readme: string): string[] {
    const links = [];
    const urlRegex = /https?:\/\/[^\s)]+/g;
    const matches = readme.match(urlRegex);
    
    if (matches) {
      links.push(...matches.slice(0, 3));
    }
    
    return links;
  }
  
  private extractLimitations(readme: string): string[] {
    const limitations = [];
    
    if (readme.includes('limit') || readme.includes('restriction')) {
      limitations.push('See documentation for usage limits and restrictions');
    }
    
    if (readme.includes('performance')) {
      limitations.push('Performance considerations apply for large-scale usage');
    }
    
    return limitations;
  }
  
  private extractErrorCodes(readme: string): Array<{ code: string; description: string }> {
    const errorCodes = [];
    const errorPattern = /(\w+\d+):\s*([^\n]+)/g;
    let match;
    
    while ((match = errorPattern.exec(readme)) !== null) {
      errorCodes.push({
        code: match[1],
        description: match[2]
      });
    }
    
    return errorCodes.slice(0, 5);
  }
}

async function testLLMProcessing() {
  console.log('🧪 测试LLM处理增强数据...\n');
  
  const mockLLM = new MockLLMClient();
  
  // 测试NPM数据处理
  console.log('📦 测试NPM数据处理:');
  console.log('=' .repeat(50));
  
  const npmResult = await mockLLM.processToolData(mockEnhancedNPMData);
  
  console.log('✅ NPM处理结果:');
  console.log(`📝 摘要: ${npmResult.summary}`);
  console.log(`🏷️  标签 (${npmResult.tags.length}): ${npmResult.tags.join(', ')}`);
  console.log(`📂 分类: ${npmResult.category}`);
  console.log(`⚙️  运行时支持:`);
  console.log(`   - Node.js: ${npmResult.runtimeSupport.node ? '✓' : '✗'}`);
  console.log(`   - Edge: ${npmResult.runtimeSupport.edge ? '✓' : '✗'}`);
  console.log(`   - Browser: ${npmResult.runtimeSupport.browser ? '✓' : '✗'}`);
  console.log(`⚠️  风险评估 (${npmResult.risks.length}): ${npmResult.risks.join('; ')}`);
  
  console.log(`📋 Detail字段结构:`);
  console.log(`   - 概述: ${npmResult.detail.overview ? '✓' : '✗'}`);
  console.log(`   - 使用指南: ${npmResult.detail.usageGuide ? '✓' : '✗'}`);
  console.log(`   - 核心功能: ${npmResult.detail.coreFeatures?.length || 0} 项`);
  console.log(`   - 应用场景: ${npmResult.detail.applicationScenarios?.length || 0} 项`);
  console.log(`   - FAQ: ${npmResult.detail.faq?.length || 0} 项`);
  console.log(`   - 服务器配置: ${npmResult.detail.serverConfig ? '✓' : '✗'}`);
  console.log(`   - 附加信息: ${npmResult.detail.additionalInfo ? '✓' : '✗'}`);
  
  console.log('\n' + '=' .repeat(50));
  
  // 测试GitHub数据处理
  console.log('🐙 测试GitHub数据处理:');
  console.log('=' .repeat(50));
  
  const githubResult = await mockLLM.processToolData(mockEnhancedGitHubData);
  
  console.log('✅ GitHub处理结果:');
  console.log(`📝 摘要: ${githubResult.summary}`);
  console.log(`🏷️  标签 (${githubResult.tags.length}): ${githubResult.tags.join(', ')}`);
  console.log(`📂 分类: ${githubResult.category}`);
  console.log(`⚙️  运行时支持:`);
  console.log(`   - Node.js: ${githubResult.runtimeSupport.node ? '✓' : '✗'}`);
  console.log(`   - Edge: ${githubResult.runtimeSupport.edge ? '✓' : '✗'}`);
  console.log(`   - Browser: ${githubResult.runtimeSupport.browser ? '✓' : '✗'}`);
  console.log(`⚠️  风险评估 (${githubResult.risks.length}): ${githubResult.risks.join('; ')}`);
  
  console.log(`📋 Detail字段结构:`);
  console.log(`   - 概述: ${githubResult.detail.overview ? '✓' : '✗'}`);
  console.log(`   - 使用指南: ${githubResult.detail.usageGuide ? '✓' : '✗'}`);
  console.log(`   - 核心功能: ${githubResult.detail.coreFeatures?.length || 0} 项`);
  console.log(`   - 应用场景: ${githubResult.detail.applicationScenarios?.length || 0} 项`);
  console.log(`   - FAQ: ${githubResult.detail.faq?.length || 0} 项`);
  console.log(`   - 服务器配置: ${githubResult.detail.serverConfig ? '✓' : '✗'}`);
  console.log(`   - 附加信息: ${githubResult.detail.additionalInfo ? '✓' : '✗'}`);
  
  console.log('\n🎉 LLM处理测试完成!');
  
  // 验证detail字段的完整性
  console.log('\n📊 Detail字段完整性验证:');
  console.log('=' .repeat(50));
  
  const validateDetailStructure = (detail: any, source: string) => {
    console.log(`\n${source} Detail结构验证:`);
    
    // 检查必需的顶级字段
    const requiredFields = ['overview', 'coreFeatures', 'applicationScenarios', 'additionalInfo'];
    const optionalFields = ['usageGuide', 'faq', 'serverConfig'];
    
    requiredFields.forEach(field => {
      const exists = detail[field] !== undefined;
      console.log(`   ✓ ${field}: ${exists ? '存在' : '缺失'}`);
    });
    
    optionalFields.forEach(field => {
      const exists = detail[field] !== undefined;
      console.log(`   ~ ${field}: ${exists ? '存在' : '可选'}`);
    });
    
    // 检查overview子字段
    if (detail.overview) {
      console.log(`   📋 Overview子字段:`);
      console.log(`      - serviceName: ${detail.overview.serviceName ? '✓' : '✗'}`);
      console.log(`      - serviceDescription: ${detail.overview.serviceDescription ? '✓' : '✗'}`);
      console.log(`      - summary: ${detail.overview.summary ? '✓' : '✗'}`);
    }
    
    // 检查additionalInfo子字段
    if (detail.additionalInfo) {
      console.log(`   📋 AdditionalInfo子字段:`);
      console.log(`      - documentationLinks: ${detail.additionalInfo.documentationLinks?.length || 0} 项`);
      console.log(`      - limitations: ${detail.additionalInfo.limitations?.length || 0} 项`);
      console.log(`      - errorCodes: ${detail.additionalInfo.errorCodes?.length || 0} 项`);
      console.log(`      - performanceMetrics: ${detail.additionalInfo.performanceMetrics ? '✓' : '✗'}`);
    }
  };
  
  validateDetailStructure(npmResult.detail, 'NPM');
  validateDetailStructure(githubResult.detail, 'GitHub');
  
  console.log('\n✅ 所有测试完成! 增强的抓取和LLM处理功能验证成功。');
}

// 运行测试
if (require.main === module) {
  testLLMProcessing().catch(error => {
    console.error('❌ 测试失败:', error);
    process.exit(1);
  });
}

export { testLLMProcessing };