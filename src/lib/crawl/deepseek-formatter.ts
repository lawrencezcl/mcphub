import { ProcessedInformation } from './information-processor';

// DeepSeek API配置
export interface DeepSeekConfig {
  apiKey: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeout?: number;
}

// 格式化选项
export interface FormattingOptions {
  language: 'zh' | 'en';
  style: 'professional' | 'casual' | 'technical';
  includeCodeExamples: boolean;
  includeTroubleshooting: boolean;
  maxLength?: number;
  sections: {
    overview: boolean;
    installation: boolean;
    usage: boolean;
    features: boolean;
    troubleshooting: boolean;
    references: boolean;
  };
}

// 格式化后的报告结构
export interface FormattedReport {
  title: string;
  summary: string;
  sections: {
    overview?: string;
    installation?: string;
    usage?: string;
    features?: string;
    troubleshooting?: string;
    references?: string;
  };
  metadata: {
    toolName: string;
    version?: string;
    lastUpdated: Date;
    sources: number;
    reliability: number;
    completeness: number;
  };
  rawContent: string;
  formattingLog: string[];
}

// DeepSeek API客户端
export class DeepSeekFormatter {
  private config: DeepSeekConfig;
  private defaultOptions: FormattingOptions = {
    language: 'zh',
    style: 'professional',
    includeCodeExamples: true,
    includeTroubleshooting: true,
    maxLength: 5000,
    sections: {
      overview: true,
      installation: true,
      usage: true,
      features: true,
      troubleshooting: true,
      references: true
    }
  };

  constructor(config: DeepSeekConfig) {
    this.config = {
      baseUrl: 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      maxTokens: 4000,
      temperature: 0.3,
      timeout: 30000,
      ...config
    };
  }

  // 主要的格式化方法
  async formatToolReport(
    toolName: string,
    processedInfo: ProcessedInformation[],
    options: Partial<FormattingOptions> = {}
  ): Promise<FormattedReport> {
    const opts = { ...this.defaultOptions, ...options };
    const formattingLog: string[] = [];

    try {
      formattingLog.push(`开始格式化工具 "${toolName}" 的信息报告`);
      
      // 准备输入数据
      const inputData = this.prepareInputData(toolName, processedInfo);
      formattingLog.push(`准备输入数据完成，共 ${processedInfo.length} 个信息源`);

      // 生成各个部分
      const sections: any = {};
      
      if (opts.sections.overview) {
        sections.overview = await this.generateOverview(toolName, inputData, opts);
        formattingLog.push('生成概述部分完成');
      }

      if (opts.sections.installation) {
        sections.installation = await this.generateInstallation(toolName, inputData, opts);
        formattingLog.push('生成安装部分完成');
      }

      if (opts.sections.usage) {
        sections.usage = await this.generateUsage(toolName, inputData, opts);
        formattingLog.push('生成使用方法部分完成');
      }

      if (opts.sections.features) {
        sections.features = await this.generateFeatures(toolName, inputData, opts);
        formattingLog.push('生成功能特性部分完成');
      }

      if (opts.sections.troubleshooting && opts.includeTroubleshooting) {
        sections.troubleshooting = await this.generateTroubleshooting(toolName, inputData, opts);
        formattingLog.push('生成故障排除部分完成');
      }

      if (opts.sections.references) {
        sections.references = this.generateReferences(processedInfo);
        formattingLog.push('生成参考资料部分完成');
      }

      // 生成标题和摘要
      const title = await this.generateTitle(toolName, inputData, opts);
      const summary = await this.generateSummary(toolName, inputData, opts);
      
      formattingLog.push('生成标题和摘要完成');

      // 计算元数据
      const metadata = this.calculateMetadata(toolName, processedInfo);
      
      // 生成原始内容
      const rawContent = this.generateRawContent(sections);

      formattingLog.push('报告格式化完成');

      return {
        title,
        summary,
        sections,
        metadata,
        rawContent,
        formattingLog
      };

    } catch (error: any) {
      formattingLog.push(`格式化过程中出现错误: ${error}`);
      throw new Error(`DeepSeek格式化失败: ${error}`);
    }
  }

  // 准备输入数据
  private prepareInputData(toolName: string, processedInfo: ProcessedInformation[]): string {
    let inputData = `工具名称: ${toolName}\n\n`;
    
    processedInfo.forEach((info, index) => {
      inputData += `=== 信息源 ${index + 1} ===\n`;
      inputData += `可靠性: ${info.reliability.toFixed(2)}\n`;
      inputData += `置信度: ${info.confidence.toFixed(2)}\n`;
      inputData += `分类: ${info.categories.join(', ')}\n`;
      inputData += `关键点: ${info.keyPoints.join('; ')}\n`;
      inputData += `内容: ${info.consolidatedContent}\n`;
      inputData += `来源数量: ${info.metadata.sourceCount}\n`;
      inputData += `渠道类型: ${info.metadata.channelTypes.join(', ')}\n\n`;
    });

    return inputData;
  }

  // 调用DeepSeek API
  private async callDeepSeekAPI(prompt: string, systemPrompt?: string): Promise<string> {
    const messages = [];
    
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: prompt
    });

    const requestBody = {
      model: this.config.model,
      messages,
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature,
      stream: false
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DeepSeek API请求失败: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('DeepSeek API返回格式异常');
      }

      return data.choices[0].message.content.trim();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('DeepSeek API请求超时');
      }
      throw error;
    }
  }

  // 生成概述
  private async generateOverview(
    toolName: string, 
    inputData: string, 
    options: FormattingOptions
  ): Promise<string> {
    const systemPrompt = `你是一个专业的技术文档编写专家。请根据提供的信息，为MCP工具编写简洁、准确的概述部分。
要求：
1. 使用${options.language === 'zh' ? '中文' : '英文'}
2. 风格：${options.style === 'professional' ? '专业正式' : options.style === 'technical' ? '技术性' : '通俗易懂'}
3. 长度控制在200-400字
4. 突出工具的核心功能和价值
5. 避免重复和冗余信息`;

    const prompt = `请为以下MCP工具编写概述：

${inputData}

请生成一个简洁明了的概述，说明这个工具的主要功能、适用场景和核心价值。`;

    return await this.callDeepSeekAPI(prompt, systemPrompt);
  }

  // 生成安装说明
  private async generateInstallation(
    toolName: string, 
    inputData: string, 
    options: FormattingOptions
  ): Promise<string> {
    const systemPrompt = `你是一个专业的技术文档编写专家。请根据提供的信息，为MCP工具编写清晰的安装和配置说明。
要求：
1. 使用${options.language === 'zh' ? '中文' : '英文'}
2. 提供具体的安装步骤
3. 包含必要的配置说明
4. 如果有代码示例，请格式化为代码块
5. 考虑不同平台的兼容性`;

    const prompt = `请为以下MCP工具编写安装和配置说明：

${inputData}

请生成详细的安装步骤，包括依赖要求、安装命令、基本配置等。`;

    return await this.callDeepSeekAPI(prompt, systemPrompt);
  }

  // 生成使用方法
  private async generateUsage(
    toolName: string, 
    inputData: string, 
    options: FormattingOptions
  ): Promise<string> {
    const systemPrompt = `你是一个专业的技术文档编写专家。请根据提供的信息，为MCP工具编写实用的使用指南。
要求：
1. 使用${options.language === 'zh' ? '中文' : '英文'}
2. 提供具体的使用示例
3. ${options.includeCodeExamples ? '包含代码示例' : '重点说明使用方法'}
4. 从基础到进阶的使用场景
5. 突出最佳实践`;

    const prompt = `请为以下MCP工具编写使用指南：

${inputData}

请生成实用的使用方法说明，包括基本用法、常见场景和最佳实践。`;

    return await this.callDeepSeekAPI(prompt, systemPrompt);
  }

  // 生成功能特性
  private async generateFeatures(
    toolName: string, 
    inputData: string, 
    options: FormattingOptions
  ): Promise<string> {
    const systemPrompt = `你是一个专业的技术文档编写专家。请根据提供的信息，为MCP工具编写功能特性说明。
要求：
1. 使用${options.language === 'zh' ? '中文' : '英文'}
2. 列出主要功能和特性
3. 突出独特优势
4. 说明适用场景
5. 结构化展示`;

    const prompt = `请为以下MCP工具编写功能特性说明：

${inputData}

请生成结构化的功能特性列表，突出工具的核心能力和优势。`;

    return await this.callDeepSeekAPI(prompt, systemPrompt);
  }

  // 生成故障排除
  private async generateTroubleshooting(
    toolName: string, 
    inputData: string, 
    options: FormattingOptions
  ): Promise<string> {
    const systemPrompt = `你是一个专业的技术文档编写专家。请根据提供的信息，为MCP工具编写故障排除指南。
要求：
1. 使用${options.language === 'zh' ? '中文' : '英文'}
2. 列出常见问题和解决方案
3. 提供调试方法
4. 包含错误信息的解释
5. 结构清晰，易于查找`;

    const prompt = `请为以下MCP工具编写故障排除指南：

${inputData}

请生成常见问题的解决方案，包括错误诊断和修复方法。`;

    return await this.callDeepSeekAPI(prompt, systemPrompt);
  }

  // 生成标题
  private async generateTitle(
    toolName: string, 
    inputData: string, 
    options: FormattingOptions
  ): Promise<string> {
    const systemPrompt = `请为MCP工具生成一个简洁、准确的标题。
要求：
1. 使用${options.language === 'zh' ? '中文' : '英文'}
2. 突出工具的核心功能
3. 长度控制在10-20字
4. 专业且吸引人`;

    const prompt = `工具名称: ${toolName}

基于以下信息生成标题：
${inputData.substring(0, 500)}...

请生成一个合适的标题。`;

    return await this.callDeepSeekAPI(prompt, systemPrompt);
  }

  // 生成摘要
  private async generateSummary(
    toolName: string, 
    inputData: string, 
    options: FormattingOptions
  ): Promise<string> {
    const systemPrompt = `请为MCP工具生成一个简洁的摘要。
要求：
1. 使用${options.language === 'zh' ? '中文' : '英文'}
2. 长度控制在100-200字
3. 概括核心功能和价值
4. 适合作为快速了解的入口`;

    const prompt = `请为以下MCP工具生成摘要：

${inputData}

请生成一个简洁的摘要，让读者快速了解这个工具。`;

    return await this.callDeepSeekAPI(prompt, systemPrompt);
  }

  // 生成参考资料
  private generateReferences(processedInfo: ProcessedInformation[]): string {
    let references = '';
    
    processedInfo.forEach((info, index) => {
      references += `## 信息源 ${index + 1}\n`;
      references += `- 可靠性: ${(info.reliability * 100).toFixed(1)}%\n`;
      references += `- 置信度: ${(info.confidence * 100).toFixed(1)}%\n`;
      references += `- 来源数量: ${info.metadata.sourceCount}\n`;
      references += `- 渠道类型: ${info.metadata.channelTypes.join(', ')}\n`;
      
      if (info.originalSources.length > 0) {
        references += `- 原始链接:\n`;
        info.originalSources.forEach(source => {
          references += `  - [${source.title}](${source.url})\n`;
        });
      }
      
      references += '\n';
    });

    return references;
  }

  // 计算元数据
  private calculateMetadata(toolName: string, processedInfo: ProcessedInformation[]) {
    const totalSources = processedInfo.reduce((sum, info) => sum + info.metadata.sourceCount, 0);
    const avgReliability = processedInfo.length > 0 ? 
      processedInfo.reduce((sum, info) => sum + info.reliability, 0) / processedInfo.length : 0;
    
    // 计算完整性（基于是否包含关键信息类型）
    const hasInstallInfo = processedInfo.some(info => info.metadata.hasInstallInstructions);
    const hasCodeExamples = processedInfo.some(info => info.metadata.hasCodeExamples);
    const hasMultipleCategories = processedInfo.some(info => info.categories.length > 1);
    
    const completeness = (
      (hasInstallInfo ? 0.4 : 0) +
      (hasCodeExamples ? 0.3 : 0) +
      (hasMultipleCategories ? 0.3 : 0)
    );

    return {
      toolName,
      lastUpdated: new Date(),
      sources: totalSources,
      reliability: avgReliability,
      completeness
    };
  }

  // 生成原始内容
  private generateRawContent(sections: any): string {
    let content = '';
    
    Object.entries(sections).forEach(([key, value]) => {
      if (value && typeof value === 'string') {
        content += `## ${key.charAt(0).toUpperCase() + key.slice(1)}\n\n`;
        content += value + '\n\n';
      }
    });

    return content;
  }

  // 批量格式化多个工具
  async formatMultipleTools(
    tools: Array<{ name: string; processedInfo: ProcessedInformation[] }>,
    options: Partial<FormattingOptions> = {}
  ): Promise<FormattedReport[]> {
    const results: FormattedReport[] = [];
    
    for (const tool of tools) {
      try {
        const report = await this.formatToolReport(tool.name, tool.processedInfo, options);
        results.push(report);
        
        // 添加延迟以避免API限制
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`格式化工具 ${tool.name} 失败:`, error);
        // 继续处理其他工具
      }
    }

    return results;
  }

  // 验证API连接
  async validateConnection(): Promise<boolean> {
    try {
      const testPrompt = '请回复"连接成功"';
      const response = await this.callDeepSeekAPI(testPrompt);
      return response.includes('连接成功') || response.includes('成功');
    } catch (error) {
      console.error('DeepSeek API连接验证失败:', error);
      return false;
    }
  }
}