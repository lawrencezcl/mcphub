import crypto from 'crypto';
import { CollectedInformation, InformationChannelType } from './fetchers/enhanced-multi-channel';

// 去重配置
export interface DeduplicationConfig {
  contentSimilarityThreshold: number; // 0-1, 内容相似度阈值
  titleSimilarityThreshold: number;   // 0-1, 标题相似度阈值
  urlSimilarityThreshold: number;     // 0-1, URL相似度阈值
  enableSemanticDeduplication: boolean; // 是否启用语义去重
}

// 整理后的信息结构
export interface ProcessedInformation {
  id: string;
  originalSources: CollectedInformation[];
  consolidatedContent: string;
  keyPoints: string[];
  categories: string[];
  reliability: number;
  confidence: number;
  metadata: {
    sourceCount: number;
    channelTypes: InformationChannelType[];
    averageScore: number;
    dateRange: {
      earliest: Date;
      latest: Date;
    };
    contentLength: number;
    hasCodeExamples: boolean;
    hasInstallInstructions: boolean;
  };
}

// 信息分类器
export class InformationClassifier {
  // 预定义的分类关键词
  private categoryKeywords = {
    'installation': ['install', 'setup', 'npm install', 'pip install', 'yarn add', 'configuration', 'config'],
    'usage': ['usage', 'example', 'how to', 'tutorial', 'guide', 'getting started'],
    'api': ['api', 'method', 'function', 'parameter', 'endpoint', 'interface'],
    'troubleshooting': ['error', 'issue', 'problem', 'fix', 'solution', 'debug', 'troubleshoot'],
    'features': ['feature', 'capability', 'support', 'functionality', 'what is', 'overview'],
    'performance': ['performance', 'speed', 'optimization', 'benchmark', 'memory', 'cpu'],
    'security': ['security', 'authentication', 'authorization', 'token', 'key', 'permission'],
    'compatibility': ['compatible', 'support', 'version', 'requirement', 'dependency', 'platform']
  };

  classifyContent(content: string): string[] {
    const categories: string[] = [];
    const lowerContent = content.toLowerCase();

    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      const matchCount = keywords.filter(keyword => 
        lowerContent.includes(keyword.toLowerCase())
      ).length;

      // 如果匹配到足够多的关键词，则归类
      if (matchCount >= Math.max(1, Math.floor(keywords.length * 0.2))) {
        categories.push(category);
      }
    }

    return categories.length > 0 ? categories : ['general'];
  }

  extractKeyPoints(content: string): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);
    const keyPoints: string[] = [];

    // 寻找包含重要信息的句子
    const importantPatterns = [
      /install|setup|configure/i,
      /example|usage|how to/i,
      /feature|capability|support/i,
      /error|issue|problem/i,
      /performance|speed|optimization/i
    ];

    for (const sentence of sentences) {
      for (const pattern of importantPatterns) {
        if (pattern.test(sentence) && sentence.length < 200) {
          keyPoints.push(sentence.trim());
          break;
        }
      }
    }

    return keyPoints.slice(0, 10); // 最多返回10个要点
  }
}

// 相似度计算器
export class SimilarityCalculator {
  // 计算两个字符串的Jaccard相似度
  calculateJaccardSimilarity(str1: string, str2: string): number {
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  // 计算编辑距离相似度
  calculateLevenshteinSimilarity(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - (matrix[str2.length][str1.length] / maxLength);
  }

  // 综合相似度计算
  calculateOverallSimilarity(info1: CollectedInformation, info2: CollectedInformation): number {
    const titleSim = this.calculateJaccardSimilarity(info1.title, info2.title);
    const contentSim = this.calculateJaccardSimilarity(
      info1.content.substring(0, 500), 
      info2.content.substring(0, 500)
    );
    const urlSim = info1.url === info2.url ? 1 : 0;

    // 加权平均
    return (titleSim * 0.3 + contentSim * 0.6 + urlSim * 0.1);
  }
}

// 主要的信息处理器
export class InformationProcessor {
  private classifier: InformationClassifier;
  private similarityCalculator: SimilarityCalculator;

  constructor() {
    this.classifier = new InformationClassifier();
    this.similarityCalculator = new SimilarityCalculator();
  }

  // 去重处理
  async deduplicateInformation(
    information: CollectedInformation[], 
    config: DeduplicationConfig
  ): Promise<CollectedInformation[]> {
    const deduplicated: CollectedInformation[] = [];
    const processed = new Set<string>();

    // 按可靠性排序，优先保留高可靠性的信息
    const sorted = [...information].sort((a, b) => b.reliability - a.reliability);

    for (const info of sorted) {
      let isDuplicate = false;

      for (const existing of deduplicated) {
        const similarity = this.similarityCalculator.calculateOverallSimilarity(info, existing);
        
        if (similarity > config.contentSimilarityThreshold) {
          isDuplicate = true;
          break;
        }
      }

      if (!isDuplicate) {
        deduplicated.push(info);
      }
    }

    return deduplicated;
  }

  // 信息整理和合并
  async processInformation(
    information: CollectedInformation[],
    config: DeduplicationConfig
  ): Promise<ProcessedInformation[]> {
    // 首先去重
    const deduplicated = await this.deduplicateInformation(information, config);
    
    // 按相似性分组
    const groups = this.groupSimilarInformation(deduplicated, config);
    
    // 处理每个组
    const processed: ProcessedInformation[] = [];
    
    for (const group of groups) {
      const processedGroup = await this.processInformationGroup(group);
      processed.push(processedGroup);
    }

    return processed.sort((a, b) => b.reliability - a.reliability);
  }

  // 将相似的信息分组
  private groupSimilarInformation(
    information: CollectedInformation[],
    config: DeduplicationConfig
  ): CollectedInformation[][] {
    const groups: CollectedInformation[][] = [];
    const assigned = new Set<number>();

    for (let i = 0; i < information.length; i++) {
      if (assigned.has(i)) continue;

      const group: CollectedInformation[] = [information[i]];
      assigned.add(i);

      for (let j = i + 1; j < information.length; j++) {
        if (assigned.has(j)) continue;

        const similarity = this.similarityCalculator.calculateOverallSimilarity(
          information[i], 
          information[j]
        );

        // 如果相似度适中，可以分为一组进行合并
        if (similarity > 0.3 && similarity <= config.contentSimilarityThreshold) {
          group.push(information[j]);
          assigned.add(j);
        }
      }

      groups.push(group);
    }

    return groups;
  }

  // 处理信息组
  private async processInformationGroup(group: CollectedInformation[]): Promise<ProcessedInformation> {
    const id = crypto.randomUUID();
    
    // 合并内容
    const consolidatedContent = this.consolidateContent(group);
    
    // 提取关键点
    const keyPoints = this.classifier.extractKeyPoints(consolidatedContent);
    
    // 分类
    const categories = this.classifier.classifyContent(consolidatedContent);
    
    // 计算可靠性和置信度
    const reliability = this.calculateGroupReliability(group);
    const confidence = this.calculateGroupConfidence(group);
    
    // 生成元数据
    const metadata = this.generateMetadata(group, consolidatedContent);

    return {
      id,
      originalSources: group,
      consolidatedContent,
      keyPoints,
      categories,
      reliability,
      confidence,
      metadata
    };
  }

  // 合并内容
  private consolidateContent(group: CollectedInformation[]): string {
    // 按可靠性排序
    const sorted = [...group].sort((a, b) => b.reliability - a.reliability);
    
    let consolidated = '';
    const seenContent = new Set<string>();

    for (const info of sorted) {
      // 提取独特的内容片段
      const sentences = info.content.split(/[.!?]+/).filter(s => s.trim().length > 20);
      
      for (const sentence of sentences) {
        const normalized = sentence.trim().toLowerCase();
        
        if (!seenContent.has(normalized) && sentence.length < 300) {
          consolidated += sentence.trim() + '. ';
          seenContent.add(normalized);
        }
      }
    }

    return consolidated.trim();
  }

  // 计算组可靠性
  private calculateGroupReliability(group: CollectedInformation[]): number {
    if (group.length === 0) return 0;
    
    // 加权平均，考虑信息源的多样性
    const channelTypes = new Set(group.map(info => info.source));
    const diversityBonus = Math.min(0.2, channelTypes.size * 0.05);
    
    const avgReliability = group.reduce((sum, info) => sum + info.reliability, 0) / group.length;
    
    return Math.min(1, avgReliability + diversityBonus);
  }

  // 计算组置信度
  private calculateGroupConfidence(group: CollectedInformation[]): number {
    if (group.length === 0) return 0;
    
    // 基于信息源数量和一致性
    const sourceCount = group.length;
    const avgScore = group.reduce((sum, info) => sum + (info.score || 1), 0) / group.length;
    
    const sourceBonus = Math.min(0.3, sourceCount * 0.1);
    const scoreBonus = Math.min(0.2, avgScore / 50);
    
    return Math.min(1, 0.5 + sourceBonus + scoreBonus);
  }

  // 生成元数据
  private generateMetadata(group: CollectedInformation[], content: string) {
    const dates = group
      .map(info => info.publishDate)
      .filter(date => date !== undefined) as Date[];
    
    const channelTypes = [...new Set(group.map(info => info.source))];
    const avgScore = group.reduce((sum, info) => sum + (info.score || 1), 0) / group.length;

    return {
      sourceCount: group.length,
      channelTypes,
      averageScore: avgScore,
      dateRange: {
        earliest: dates.length > 0 ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date(),
        latest: dates.length > 0 ? new Date(Math.max(...dates.map(d => d.getTime()))) : new Date()
      },
      contentLength: content.length,
      hasCodeExamples: /```|<code>|`[\w\s]+`/i.test(content),
      hasInstallInstructions: /install|npm|pip|yarn|setup|configure/i.test(content)
    };
  }

  // 生成处理报告
  generateProcessingReport(
    original: CollectedInformation[],
    processed: ProcessedInformation[]
  ): {
    summary: {
      originalCount: number;
      processedCount: number;
      deduplicationRate: number;
      averageReliability: number;
      averageConfidence: number;
    };
    qualityMetrics: {
      highQualityCount: number;
      mediumQualityCount: number;
      lowQualityCount: number;
    };
    recommendations: string[];
  } {
    const deduplicationRate = original.length > 0 ? 
      1 - (processed.length / original.length) : 0;
    
    const avgReliability = processed.length > 0 ?
      processed.reduce((sum, p) => sum + p.reliability, 0) / processed.length : 0;
    
    const avgConfidence = processed.length > 0 ?
      processed.reduce((sum, p) => sum + p.confidence, 0) / processed.length : 0;

    const highQuality = processed.filter(p => p.reliability > 0.8 && p.confidence > 0.7);
    const mediumQuality = processed.filter(p => 
      (p.reliability > 0.6 && p.reliability <= 0.8) || 
      (p.confidence > 0.5 && p.confidence <= 0.7)
    );
    const lowQuality = processed.filter(p => p.reliability <= 0.6 && p.confidence <= 0.5);

    const recommendations: string[] = [];
    
    if (avgReliability < 0.6) {
      recommendations.push('整体信息可靠性较低，建议增加官方文档来源');
    }
    
    if (avgConfidence < 0.5) {
      recommendations.push('信息置信度不足，建议扩大搜索范围或增加验证');
    }
    
    if (deduplicationRate > 0.7) {
      recommendations.push('重复信息较多，建议优化搜索策略');
    }

    if (lowQuality.length > processed.length * 0.5) {
      recommendations.push('低质量信息占比过高，建议提高筛选标准');
    }

    return {
      summary: {
        originalCount: original.length,
        processedCount: processed.length,
        deduplicationRate,
        averageReliability: avgReliability,
        averageConfidence: avgConfidence
      },
      qualityMetrics: {
        highQualityCount: highQuality.length,
        mediumQualityCount: mediumQuality.length,
        lowQualityCount: lowQuality.length
      },
      recommendations
    };
  }
}