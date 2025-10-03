/**
 * 错误处理和重试机制模块
 * 
 * 提供统一的错误处理、重试策略和错误恢复机制
 */

// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  PARSING_ERROR = 'PARSING_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 错误严重程度
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// 重试策略
export enum RetryStrategy {
  EXPONENTIAL_BACKOFF = 'EXPONENTIAL_BACKOFF',
  LINEAR_BACKOFF = 'LINEAR_BACKOFF',
  FIXED_DELAY = 'FIXED_DELAY',
  IMMEDIATE = 'IMMEDIATE'
}

// 错误信息接口
export interface ErrorInfo {
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;
  suggestedAction?: string;
}

// 重试配置
export interface RetryConfig {
  maxRetries: number;
  strategy: RetryStrategy;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: ErrorType[];
  onRetry?: (attempt: number, error: ErrorInfo) => void;
}

// 错误处理配置
export interface ErrorHandlerConfig {
  enableLogging: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics: boolean;
  enableRecovery: boolean;
  customHandlers?: Map<ErrorType, (error: ErrorInfo) => Promise<any>>;
}

// 错误统计
export interface ErrorMetrics {
  totalErrors: number;
  errorsByType: Map<ErrorType, number>;
  errorsBySeverity: Map<ErrorSeverity, number>;
  retryAttempts: number;
  successfulRetries: number;
  failedRetries: number;
  averageRetryDelay: number;
}

// 自定义错误类
export class MCPCrawlerError extends Error {
  public readonly type: ErrorType;
  public readonly severity: ErrorSeverity;
  public readonly context: Record<string, any>;
  public readonly timestamp: Date;
  public readonly retryable: boolean;

  constructor(
    type: ErrorType,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Record<string, any> = {},
    retryable: boolean = true
  ) {
    super(message);
    this.name = 'MCPCrawlerError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date();
    this.retryable = retryable;
  }

  toErrorInfo(): ErrorInfo {
    return {
      type: this.type,
      severity: this.severity,
      message: this.message,
      originalError: this,
      context: this.context,
      timestamp: this.timestamp,
      retryable: this.retryable,
      suggestedAction: this.getSuggestedAction()
    };
  }

  private getSuggestedAction(): string {
    switch (this.type) {
      case ErrorType.NETWORK_ERROR:
        return '检查网络连接，稍后重试';
      case ErrorType.API_RATE_LIMIT:
        return '等待API限制重置，或使用更长的延迟';
      case ErrorType.API_QUOTA_EXCEEDED:
        return '检查API配额，升级计划或等待配额重置';
      case ErrorType.AUTHENTICATION_ERROR:
        return '检查API密钥是否正确和有效';
      case ErrorType.TIMEOUT_ERROR:
        return '增加超时时间或检查网络状况';
      case ErrorType.PARSING_ERROR:
        return '检查数据格式，更新解析逻辑';
      case ErrorType.VALIDATION_ERROR:
        return '检查输入参数是否符合要求';
      default:
        return '查看详细错误信息，联系技术支持';
    }
  }
}

// 错误分类器
export class ErrorClassifier {
  static classifyError(error: any): ErrorInfo {
    const timestamp = new Date();
    
    // 如果已经是MCPCrawlerError
    if (error instanceof MCPCrawlerError) {
      return error.toErrorInfo();
    }

    // 网络错误
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || 
        error.code === 'ETIMEDOUT' || error.message?.includes('network')) {
      return {
        type: ErrorType.NETWORK_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: `网络错误: ${error.message}`,
        originalError: error,
        timestamp,
        retryable: true,
        suggestedAction: '检查网络连接，稍后重试'
      };
    }

    // API限制错误
    if (error.status === 429 || error.message?.includes('rate limit')) {
      return {
        type: ErrorType.API_RATE_LIMIT,
        severity: ErrorSeverity.HIGH,
        message: `API限制: ${error.message}`,
        originalError: error,
        timestamp,
        retryable: true,
        suggestedAction: '等待API限制重置，或使用更长的延迟'
      };
    }

    // API配额错误
    if (error.status === 402 || error.message?.includes('quota') || 
        error.message?.includes('billing')) {
      return {
        type: ErrorType.API_QUOTA_EXCEEDED,
        severity: ErrorSeverity.CRITICAL,
        message: `API配额不足: ${error.message}`,
        originalError: error,
        timestamp,
        retryable: false,
        suggestedAction: '检查API配额，升级计划或等待配额重置'
      };
    }

    // 认证错误
    if (error.status === 401 || error.status === 403 || 
        error.message?.includes('unauthorized') || error.message?.includes('forbidden')) {
      return {
        type: ErrorType.AUTHENTICATION_ERROR,
        severity: ErrorSeverity.HIGH,
        message: `认证错误: ${error.message}`,
        originalError: error,
        timestamp,
        retryable: false,
        suggestedAction: '检查API密钥是否正确和有效'
      };
    }

    // 超时错误
    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      return {
        type: ErrorType.TIMEOUT_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: `请求超时: ${error.message}`,
        originalError: error,
        timestamp,
        retryable: true,
        suggestedAction: '增加超时时间或检查网络状况'
      };
    }

    // 解析错误
    if (error instanceof SyntaxError || error.message?.includes('parse') || 
        error.message?.includes('JSON')) {
      return {
        type: ErrorType.PARSING_ERROR,
        severity: ErrorSeverity.MEDIUM,
        message: `数据解析错误: ${error.message}`,
        originalError: error,
        timestamp,
        retryable: false,
        suggestedAction: '检查数据格式，更新解析逻辑'
      };
    }

    // 验证错误
    if (error.message?.includes('validation') || error.message?.includes('invalid')) {
      return {
        type: ErrorType.VALIDATION_ERROR,
        severity: ErrorSeverity.LOW,
        message: `验证错误: ${error.message}`,
        originalError: error,
        timestamp,
        retryable: false,
        suggestedAction: '检查输入参数是否符合要求'
      };
    }

    // 默认未知错误
    return {
      type: ErrorType.UNKNOWN_ERROR,
      severity: ErrorSeverity.MEDIUM,
      message: error.message || '未知错误',
      originalError: error,
      timestamp,
      retryable: true,
      suggestedAction: '查看详细错误信息，联系技术支持'
    };
  }
}

// 重试管理器
export class RetryManager {
  private config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = config;
  }

  // 计算延迟时间
  calculateDelay(attempt: number): number {
    const { strategy, baseDelay, maxDelay, backoffMultiplier } = this.config;

    let delay: number;

    switch (strategy) {
      case RetryStrategy.EXPONENTIAL_BACKOFF:
        delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
        break;
      case RetryStrategy.LINEAR_BACKOFF:
        delay = baseDelay * attempt;
        break;
      case RetryStrategy.FIXED_DELAY:
        delay = baseDelay;
        break;
      case RetryStrategy.IMMEDIATE:
        delay = 0;
        break;
      default:
        delay = baseDelay;
    }

    // 添加随机抖动，避免雷群效应
    const jitter = Math.random() * 0.1 * delay;
    delay += jitter;

    return Math.min(delay, maxDelay);
  }

  // 检查是否应该重试
  shouldRetry(attempt: number, error: ErrorInfo): boolean {
    if (attempt >= this.config.maxRetries) {
      return false;
    }

    if (!error.retryable) {
      return false;
    }

    return this.config.retryableErrors.includes(error.type);
  }

  // 执行重试
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: ErrorInfo | null = null;
    
    for (let attempt = 1; attempt <= this.config.maxRetries + 1; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        const errorInfo = ErrorClassifier.classifyError(error);
        lastError = errorInfo;

        if (!this.shouldRetry(attempt, errorInfo)) {
          throw new MCPCrawlerError(
            errorInfo.type,
            `${context} 失败: ${errorInfo.message}`,
            errorInfo.severity,
            { ...errorInfo.context, attempt, maxRetries: this.config.maxRetries },
            false
          );
        }

        const delay = this.calculateDelay(attempt);
        
        if (this.config.onRetry) {
          this.config.onRetry(attempt, errorInfo);
        }

        console.warn(`${context} 失败 (尝试 ${attempt}/${this.config.maxRetries}): ${errorInfo.message}`);
        console.warn(`${delay}ms 后重试...`);

        if (delay > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // 如果所有重试都失败了
    throw new MCPCrawlerError(
      lastError?.type || ErrorType.UNKNOWN_ERROR,
      `${context} 在 ${this.config.maxRetries} 次重试后仍然失败`,
      ErrorSeverity.HIGH,
      { lastError },
      false
    );
  }
}

// 错误处理器
export class ErrorHandler {
  private config: ErrorHandlerConfig;
  private metrics: ErrorMetrics;
  private retryManager: RetryManager;

  constructor(config: ErrorHandlerConfig, retryConfig: RetryConfig) {
    this.config = config;
    this.retryManager = new RetryManager(retryConfig);
    this.metrics = {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsBySeverity: new Map(),
      retryAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageRetryDelay: 0
    };
  }

  // 处理错误
  async handleError(error: any, context: string = 'operation'): Promise<void> {
    const errorInfo = ErrorClassifier.classifyError(error);
    
    // 更新统计
    this.updateMetrics(errorInfo);

    // 记录日志
    if (this.config.enableLogging) {
      this.logError(errorInfo, context);
    }

    // 执行自定义处理器
    if (this.config.customHandlers?.has(errorInfo.type)) {
      const customHandler = this.config.customHandlers.get(errorInfo.type)!;
      try {
        await customHandler(errorInfo);
      } catch (handlerError: any) {
        console.error(`自定义错误处理器失败: ${handlerError.message}`);
      }
    }

    // 错误恢复
    if (this.config.enableRecovery) {
      await this.attemptRecovery(errorInfo);
    }
  }

  // 带重试的操作执行
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    return this.retryManager.executeWithRetry(operation, context);
  }

  // 更新错误统计
  private updateMetrics(errorInfo: ErrorInfo): void {
    this.metrics.totalErrors++;
    
    const typeCount = this.metrics.errorsByType.get(errorInfo.type) || 0;
    this.metrics.errorsByType.set(errorInfo.type, typeCount + 1);
    
    const severityCount = this.metrics.errorsBySeverity.get(errorInfo.severity) || 0;
    this.metrics.errorsBySeverity.set(errorInfo.severity, severityCount + 1);
  }

  // 记录错误日志
  private logError(errorInfo: ErrorInfo, context: string): void {
    const logLevel = this.getLogLevel(errorInfo.severity);
    const message = `[${context}] ${errorInfo.type}: ${errorInfo.message}`;
    
    switch (logLevel) {
      case 'error':
        console.error(message, errorInfo);
        break;
      case 'warn':
        console.warn(message, errorInfo);
        break;
      case 'info':
        console.info(message, errorInfo);
        break;
      case 'debug':
        console.debug(message, errorInfo);
        break;
    }
  }

  // 获取日志级别
  private getLogLevel(severity: ErrorSeverity): string {
    switch (severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        return 'error';
      case ErrorSeverity.MEDIUM:
        return 'warn';
      case ErrorSeverity.LOW:
        return 'info';
      default:
        return 'debug';
    }
  }

  // 尝试错误恢复
  private async attemptRecovery(errorInfo: ErrorInfo): Promise<void> {
    switch (errorInfo.type) {
      case ErrorType.API_RATE_LIMIT:
        // 等待更长时间
        console.info('检测到API限制，等待恢复...');
        await new Promise(resolve => setTimeout(resolve, 60000)); // 等待1分钟
        break;
      
      case ErrorType.NETWORK_ERROR:
        // 检查网络连接
        console.info('检测到网络错误，尝试重新连接...');
        await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒
        break;
      
      case ErrorType.TIMEOUT_ERROR:
        // 增加超时时间
        console.info('检测到超时错误，建议增加超时设置');
        break;
      
      default:
        // 默认恢复策略
        break;
    }
  }

  // 获取错误统计
  getMetrics(): ErrorMetrics {
    return { ...this.metrics };
  }

  // 重置统计
  resetMetrics(): void {
    this.metrics = {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsBySeverity: new Map(),
      retryAttempts: 0,
      successfulRetries: 0,
      failedRetries: 0,
      averageRetryDelay: 0
    };
  }

  // 生成错误报告
  generateErrorReport(): string {
    const report = {
      timestamp: new Date().toISOString(),
      totalErrors: this.metrics.totalErrors,
      errorsByType: Object.fromEntries(this.metrics.errorsByType),
      errorsBySeverity: Object.fromEntries(this.metrics.errorsBySeverity),
      retryStatistics: {
        totalAttempts: this.metrics.retryAttempts,
        successful: this.metrics.successfulRetries,
        failed: this.metrics.failedRetries,
        successRate: this.metrics.retryAttempts > 0 
          ? (this.metrics.successfulRetries / this.metrics.retryAttempts * 100).toFixed(2) + '%'
          : '0%',
        averageDelay: this.metrics.averageRetryDelay
      }
    };

    return JSON.stringify(report, null, 2);
  }
}

// 默认配置
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  strategy: RetryStrategy.EXPONENTIAL_BACKOFF,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorType.NETWORK_ERROR,
    ErrorType.API_RATE_LIMIT,
    ErrorType.TIMEOUT_ERROR,
    ErrorType.UNKNOWN_ERROR
  ]
};

export const DEFAULT_ERROR_HANDLER_CONFIG: ErrorHandlerConfig = {
  enableLogging: true,
  logLevel: 'warn',
  enableMetrics: true,
  enableRecovery: true
};

// 便捷函数：创建错误处理器
export function createErrorHandler(
  retryConfig: Partial<RetryConfig> = {},
  handlerConfig: Partial<ErrorHandlerConfig> = {}
): ErrorHandler {
  const finalRetryConfig = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  const finalHandlerConfig = { ...DEFAULT_ERROR_HANDLER_CONFIG, ...handlerConfig };
  
  return new ErrorHandler(finalHandlerConfig, finalRetryConfig);
}