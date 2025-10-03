import { createLLMClient } from '../src/lib/llm/client';

async function main() {
  console.log('🧪 开始单案例测试 LLM 调用...');

  // 构造一个最小可用的原始数据，用于验证LLM流水线
  const rawData = {
    title: 'MCP Example Tool',
    description: 'An example tool implementing the Model Context Protocol (MCP).',
    readme: `# MCP Example\n\nThis is a minimal example demonstrating MCP-compatible tool interface.\n\n## Features\n- Model Context Protocol integration\n- Anthropic Claude support\n- Node runtime\n\n## Usage\nInstall and run.`,
    metadata: {
      repo: 'example/mcp-tool',
      stars: 42,
      keywords: ['mcp', 'model context protocol', 'anthropic', 'claude', 'tool']
    }
  };

  try {
    const client = createLLMClient();
    const start = Date.now();
    const output = await client.processToolData(rawData);
    const duration = Date.now() - start;

    console.log('✅ LLM 调用成功');
    console.log(`⏱️ 用时: ${duration}ms`);
    console.log('\n—— 输出摘要 ——');
    console.log(output.summary);
    console.log('\n—— 标签 ——');
    console.log(output.tags.join(', '));
    console.log('\n—— 分类 ——');
    console.log(output.category);
    console.log('\n—— 运行时支持 ——');
    console.log(JSON.stringify(output.runtimeSupport, null, 2));
    if (output.risks && output.risks.length) {
      console.log('\n—— 风险提示 ——');
      console.log(output.risks.join('\n'));
    }

  } catch (error) {
    console.error('❌ LLM 测试失败:', error);
    process.exitCode = 1;
  }
}

main();