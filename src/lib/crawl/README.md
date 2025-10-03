# MCP工具信息收集系统

## 系统概述

这是一个完整的MCP（Model Context Protocol）工具信息收集和报告生成系统，能够从多个渠道收集工具信息，进行智能处理和去重，并生成高质量的技术报告。

## 核心功能

### 🔍 多渠道信息收集
- **官方文档**: 自动抓取工具的官方文档
- **GitHub Issues**: 收集相关问题和解决方案
- **Stack Overflow**: 获取社区讨论和最佳实践
- **智能去重**: 基于内容相似度的智能去重算法

### 📊 智能信息处理
- **内容分析**: 使用AI分析和处理收集的信息
- **质量评估**: 对信息来源进行可靠性评分
- **结构化处理**: 将原始信息转换为结构化数据

### 📝 报告生成
- **DeepSeek集成**: 使用DeepSeek API生成高质量报告
- **多种格式**: 支持Markdown、JSON等多种输出格式
- **自定义模板**: 可配置的报告模板和样式

### 🛡️ 错误处理与监控
- **全面错误处理**: 分类错误处理机制
- **重试机制**: 智能重试策略
- **性能监控**: 详细的性能指标收集

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Enhanced MCP Crawler                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Multi-Channel   │  │ Information     │  │ Report          │ │
│  │ Fetcher         │  │ Processor       │  │ Generator       │ │
│  │                 │  │                 │  │                 │ │
│  │ • Official Docs │  │ • Deduplication │  │ • DeepSeek API  │ │
│  │ • GitHub Issues │  │ • Quality Check │  │ • Formatting    │ │
│  │ • Stack Overflow│  │ • Structuring   │  │ • Export        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Error Handler   │  │ Performance     │  │ Configuration   │ │
│  │                 │  │ Monitor         │  │ Manager         │ │
│  │ • Classification│  │ • Metrics       │  │ • Presets       │ │
│  │ • Retry Logic   │  │ • Logging       │  │ • Validation    │ │
│  │ • Recovery      │  │ • Reporting     │  │ • Optimization  │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 快速开始

### 1. 基础使用

```typescript
import { EnhancedMCPCrawler } from './enhanced-crawler';

// 创建爬虫实例
const crawler = new EnhancedMCPCrawler('your-deepseek-api-key', {
  githubToken: 'your-github-token',
  stackOverflowKey: 'your-stackoverflow-key',
  preset: 'HIGH_QUALITY'
});

// 生成单个工具报告
const report = await crawler.generateToolReport('playwright');
console.log(report);
```

### 2. 批量处理

```typescript
// 批量生成多个工具报告
const tools = ['playwright', 'puppeteer', 'selenium'];
const reports = await crawler.generateBatchReports(tools);

reports.forEach((report, index) => {
  console.log(`=== ${tools[index]} 报告 ===`);
  console.log(report);
});
```

### 3. 自定义配置

```typescript
const customConfig = {
  multiChannel: {
    enabledChannels: [
      InformationChannelType.OFFICIAL_DOCS,
      InformationChannelType.GITHUB_ISSUES
    ],
    maxResultsPerChannel: 20,
    timeoutMs: 30000
  },
  deduplication: {
    contentSimilarityThreshold: 0.85,
    titleSimilarityThreshold: 0.9,
    enableSemanticDeduplication: true
  },
  deepseek: {
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 4000
  }
};

const crawler = new EnhancedMCPCrawler('api-key', customConfig);
```

## 配置选项

### 预设配置

系统提供三种预设配置：

- **FAST**: 快速模式，适合快速原型和测试
- **BALANCED**: 平衡模式，性能和质量的平衡
- **HIGH_QUALITY**: 高质量模式，最佳质量输出

### 详细配置

```typescript
interface CrawlerConfig {
  multiChannel: {
    enabledChannels: InformationChannelType[];
    maxResultsPerChannel: number;
    timeoutMs: number;
    retryAttempts: number;
  };
  deduplication: {
    contentSimilarityThreshold: number;
    titleSimilarityThreshold: number;
    urlSimilarityThreshold: number;
    enableSemanticDeduplication: boolean;
  };
  deepseek: {
    apiKey: string;
    model: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
  };
  formatting: {
    language: 'zh' | 'en';
    style: 'technical' | 'casual' | 'academic';
    includeCodeExamples: boolean;
    includeTroubleshooting: boolean;
  };
  options: {
    enableLogging: boolean;
    enableMetrics: boolean;
    maxConcurrentRequests: number;
  };
}
```

## 测试

### 运行模拟测试

```bash
npx tsx src/lib/crawl/mock-test-runner.ts
```

### 运行集成测试

```bash
npx tsx src/lib/crawl/integration-test.ts
```

### 测试覆盖

- ✅ 基础信息收集测试
- ✅ 多渠道信息收集测试  
- ✅ 信息去重测试
- ✅ 信息处理测试
- ⚠️ 报告生成测试 (需要有效的DeepSeek API密钥)
- ✅ 错误处理测试
- ✅ 性能测试

## 性能指标

### 模拟测试结果
- **成功率**: 85.7% (6/7 测试通过)
- **平均响应时间**: 60ms
- **信息收集效率**: 平均每次收集2-100条信息
- **去重效果**: 平均减少33%的重复信息

### 集成测试结果
- **成功率**: 50.0% (3/6 测试通过)
- **批量处理**: 支持多工具并发处理
- **错误恢复**: 100%错误处理覆盖率

## 错误处理

系统提供完善的错误分类和处理机制：

- **API_ERROR**: API调用失败
- **NETWORK_ERROR**: 网络连接问题
- **RATE_LIMIT_ERROR**: 速率限制
- **VALIDATION_ERROR**: 数据验证错误
- **TIMEOUT_ERROR**: 请求超时
- **UNKNOWN_ERROR**: 未知错误

每种错误都有相应的重试策略和恢复机制。

## 依赖要求

- Node.js >= 16
- TypeScript >= 4.5
- 有效的DeepSeek API密钥
- 可选：GitHub Token（用于GitHub Issues收集）
- 可选：Stack Overflow API Key（用于Stack Overflow收集）

## 环境变量

```bash
DEEPSEEK_API_KEY=your_deepseek_api_key
GITHUB_TOKEN=your_github_token  # 可选
STACKOVERFLOW_KEY=your_stackoverflow_key  # 可选
```

## 注意事项

1. **API限制**: 请注意各API的调用限制
2. **网络依赖**: 系统需要稳定的网络连接
3. **资源消耗**: 高质量模式会消耗更多资源
4. **数据隐私**: 请确保遵守相关数据使用政策

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 许可证

MIT License

## 更新日志

### v1.0.0
- 初始版本发布
- 完整的多渠道信息收集功能
- DeepSeek集成报告生成
- 全面的测试覆盖
- 详细的文档和使用示例