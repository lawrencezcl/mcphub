interface LLMProvider {
  name: string;
  generateContent(prompt: string, options?: GenerateOptions): Promise<string>;
}

interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

export class DeepSeekProvider implements LLMProvider {
  name = 'deepseek';
  private apiKey: string;
  private baseUrl = 'https://api.deepseek.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateContent(prompt: string, options: GenerateOptions = {}): Promise<string> {
    const {
      maxTokens = 1000,
      temperature = 0.3,
      model = 'deepseek-chat'
    } = options;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          max_tokens: maxTokens,
          temperature,
          // 强制 JSON 输出（兼容 OpenAI 格式的 response_format）
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        let errMsg = `DeepSeek API 错误: ${response.status} ${response.statusText}`;
        try {
          const errBody = await response.json();
          if (errBody?.error?.message) {
            errMsg += ` - ${errBody.error.message}`;
          }
        } catch (_) {
          // ignore json parse error
        }
        throw new Error(errMsg);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('DeepSeek generation error:', error);
      throw new Error(`内容生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}

export class LLMClient {
  private provider: LLMProvider;

  constructor(provider: LLMProvider) {
    this.provider = provider;
  }

  async processToolData(rawData: {
    title: string;
    description: string;
    readme: string;
    metadata: any;
  }): Promise<{
    summary: string;
    tags: string[];
    category: string;
    runtimeSupport: {
      node?: boolean;
      edge?: boolean;
      browser?: boolean;
    };
    risks?: string[];
    // 新增详细信息结构
    detail?: {
      overview?: {
        serviceName?: string;
        serviceDescription?: string;
        summary?: string;
      };
      usageGuide?: {
        deploymentProcess?: string[];
        deploymentMethod?: string;
        quickStart?: string;
        examples?: string[];
      };
      coreFeatures?: string[];
      applicationScenarios?: string[];
      faq?: Array<{
        question: string;
        answer: string;
      }>;
      serverConfig?: {
        configExample?: any;
        installationSteps?: string[];
        requirements?: string[];
      };
      additionalInfo?: {
        documentationLinks?: string[];
        apiReference?: string;
        limitations?: string[];
        performanceMetrics?: any;
        errorCodes?: Array<{
          code: string;
          description: string;
        }>;
      };
    };
  }> {
    const prompt = this.buildPrompt(rawData);
    
    try {
      const response = await this.provider.generateContent(prompt, {
        maxTokens: 2000, // 增加token限制以支持更详细的输出
        temperature: 0.2,
        model: process.env.DEEPSEEK_MODEL || undefined,
      });

      return this.parseResponse(response);
    } catch (error) {
      console.error('LLM processing error:', error);
      throw new Error(`LLM 处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  private buildPrompt(data: {
    title: string;
    description: string;
    readme: string;
    metadata: any;
  }): string {
    return `请分析以下 MCP (Model Context Protocol) 工具的信息，并以 JSON 格式返回结构化数据。请尽可能全面地收集和整理信息：

标题: ${data.title}
描述: ${data.description}
README: ${data.readme.substring(0, 4000)}...
元数据: ${JSON.stringify(data.metadata, null, 2)}

请返回以下格式的 JSON，包含尽可能详细的信息：
{
  "summary": "工具的简洁摘要（不超过300字）",
  "tags": ["相关标签数组，最多10个"],
  "category": "主要分类（从以下选择：AI & Machine Learning, Development Tools, Data Processing, Web Scraping, API Integration）",
  "runtimeSupport": {
    "node": true/false,
    "edge": true/false,
    "browser": true/false
  },
  "risks": ["潜在风险或注意事项，可选"],
  "detail": {
    "overview": {
      "serviceName": "服务名称",
      "serviceDescription": "详细的服务描述",
      "summary": "服务概述"
    },
    "usageGuide": {
      "deploymentProcess": ["部署步骤1", "部署步骤2", "..."],
      "deploymentMethod": "部署方式描述",
      "quickStart": "快速开始指南",
      "examples": ["使用示例1", "使用示例2", "..."]
    },
    "coreFeatures": ["核心功能1", "核心功能2", "..."],
    "applicationScenarios": ["应用场景1", "应用场景2", "..."],
    "faq": [
      {
        "question": "常见问题1",
        "answer": "问题答案1"
      },
      {
        "question": "常见问题2", 
        "answer": "问题答案2"
      }
    ],
    "serverConfig": {
      "configExample": "从文档中提取的配置示例（JSON格式）",
      "installationSteps": ["安装步骤1", "安装步骤2", "..."],
      "requirements": ["系统要求1", "系统要求2", "..."]
    },
    "additionalInfo": {
      "documentationLinks": ["文档链接1", "文档链接2", "..."],
      "apiReference": "API参考文档链接",
      "limitations": ["使用限制1", "使用限制2", "..."],
      "performanceMetrics": "性能指标信息",
      "errorCodes": [
        {
          "code": "错误代码",
          "description": "错误描述"
        }
      ]
    }
  }
}

分析要求：
1. 摘要要准确反映工具的核心功能和价值
2. 标签要具体且有用，避免过于宽泛
3. 根据代码和文档判断运行时支持
4. 详细分析README和文档，提取所有可用信息
5. 从文档中识别配置示例、安装步骤、使用方法
6. 提取常见问题和解答
7. 识别应用场景和核心功能
8. 收集文档链接、API参考等额外信息
9. 如果发现安全风险或使用限制，请详细说明
10. 只返回 JSON，不要其他文字
11. 如果某些信息在文档中不存在，对应字段可以省略或设为空数组/null`;
  }

  private parseResponse(response: string): {
    summary: string;
    tags: string[];
    category: string;
    runtimeSupport: {
      node?: boolean;
      edge?: boolean;
      browser?: boolean;
    };
    risks?: string[];
    detail?: {
      overview?: {
        serviceName?: string;
        serviceDescription?: string;
        summary?: string;
      };
      usageGuide?: {
        deploymentProcess?: string[];
        deploymentMethod?: string;
        quickStart?: string;
        examples?: string[];
      };
      coreFeatures?: string[];
      applicationScenarios?: string[];
      faq?: Array<{
        question: string;
        answer: string;
      }>;
      serverConfig?: {
        configExample?: any;
        installationSteps?: string[];
        requirements?: string[];
      };
      additionalInfo?: {
        documentationLinks?: string[];
        apiReference?: string;
        limitations?: string[];
        performanceMetrics?: any;
        errorCodes?: Array<{
          code: string;
          description: string;
        }>;
      };
    };
  } {
    try {
      // 清理响应，移除可能的 markdown 代码块标记
      const cleanResponse = response
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();

      const parsed = JSON.parse(cleanResponse);

      // 验证必需字段
      if (!parsed.summary || !parsed.tags || !parsed.category) {
        throw new Error('缺少必需字段');
      }

      // 确保 tags 是数组
      if (!Array.isArray(parsed.tags)) {
        parsed.tags = [];
      }

      // 确保 runtimeSupport 存在
      if (!parsed.runtimeSupport) {
        parsed.runtimeSupport = {};
      }

      // 验证并清理 detail 字段
      if (parsed.detail) {
        // 确保 faq 是正确的格式
        if (parsed.detail.faq && Array.isArray(parsed.detail.faq)) {
          parsed.detail.faq = parsed.detail.faq.filter((item: any) => 
            item && typeof item === 'object' && item.question && item.answer
          );
        }

        // 确保 errorCodes 是正确的格式
        if (parsed.detail.additionalInfo?.errorCodes && Array.isArray(parsed.detail.additionalInfo.errorCodes)) {
          parsed.detail.additionalInfo.errorCodes = parsed.detail.additionalInfo.errorCodes.filter((item: any) => 
            item && typeof item === 'object' && item.code && item.description
          );
        }

        // 确保数组字段是数组
        const arrayFields = [
          'usageGuide.deploymentProcess',
          'usageGuide.examples', 
          'coreFeatures',
          'applicationScenarios',
          'serverConfig.installationSteps',
          'serverConfig.requirements',
          'additionalInfo.documentationLinks',
          'additionalInfo.limitations'
        ];

        arrayFields.forEach(fieldPath => {
          const parts = fieldPath.split('.');
          let current = parsed.detail;
          
          for (let i = 0; i < parts.length - 1; i++) {
            if (!current[parts[i]]) current[parts[i]] = {};
            current = current[parts[i]];
          }
          
          const finalField = parts[parts.length - 1];
          if (current[finalField] && !Array.isArray(current[finalField])) {
            current[finalField] = [];
          }
        });
      }

      return parsed;
    } catch (error) {
      console.error('解析 LLM 响应失败:', error);
      console.error('原始响应:', response);
      
      // 返回默认结构
      return {
        summary: '解析失败，使用默认摘要',
        tags: [],
        category: 'Development Tools',
        runtimeSupport: {},
        risks: ['LLM 响应解析失败'],
        detail: {
          overview: {
            serviceName: '未知服务',
            serviceDescription: '解析失败，无法获取详细信息',
            summary: '解析失败'
          }
        }
      };
    }
  }
}

// 创建默认的 LLM 客户端
export function createLLMClient(): LLMClient {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.AI_PROVIDER_API_KEY;
  if (!apiKey) {
    throw new Error('未配置 LLM API 密钥');
  }
  
  const provider = new DeepSeekProvider(apiKey);
  return new LLMClient(provider);
}