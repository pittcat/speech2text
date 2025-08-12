import {
  DeepSeekConfig,
  PolishingResult,
  TextProcessingTask,
  TextProcessingOptions,
} from "../../types";
import { trace, debug, info, warn, error } from "../logger";
import {
  buildProgrammingTermsPrompt,
  applyCorrectionMapping,
  containsProgrammingTerms,
} from "../programming-terms";

/**
 * DeepSeek 文本处理客户端
 * 基于 OpenAI 兼容的 API 接口实现文本润色、改写等功能
 */
export class DeepSeekClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private defaultTemperature: number;
  private defaultMaxTokens: number;

  constructor(config: DeepSeekConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl;
    this.model = config.model;
    this.defaultTemperature = config.temperature || 0.7;
    this.defaultMaxTokens = config.maxTokens || 2000;

    trace("DeepSeekClient", "Client initialized", {
      baseUrl: this.baseUrl,
      model: this.model,
      temperature: this.defaultTemperature,
      maxTokens: this.defaultMaxTokens,
    });
  }

  /**
   * 处理文本
   * @param text 要处理的原始文本
   * @param options 处理选项
   * @param userTerms 用户自定义术语（来自偏好设置）
   * @returns Promise<PolishingResult>
   */
  async processText(
    text: string,
    options: TextProcessingOptions,
    userTerms?: string
  ): Promise<PolishingResult> {
    const startTime = Date.now();

    try {
      debug("DeepSeekClient", "Starting text processing", {
        task: options.task,
        textLength: text.length,
        hasCustomPrompt: !!options.customPrompt,
        hasUserTerms: !!userTerms,
      });

      // 检查文本是否包含编程术语
      const hasProgrammingContent = containsProgrammingTerms(text);
      debug("DeepSeekClient", "Programming content detection", {
        hasProgrammingContent,
        task: options.task,
      });

      // 预处理：应用常见纠错映射
      let processedText = text;
      if (hasProgrammingContent || options.task === "编程术语纠错") {
        processedText = applyCorrectionMapping(text);
        debug("DeepSeekClient", "Applied correction mapping", {
          originalLength: text.length,
          processedLength: processedText.length,
        });
      }

      // 构建系统提示词
      const systemPrompt = this.buildSystemPrompt(
        options.task,
        options.customPrompt,
        userTerms,
        hasProgrammingContent
      );

      // 构建用户消息
      const userMessage = `请对以下文本进行${options.task}：\n\n${processedText}`;

      // 构建请求体
      const requestBody = {
        model: this.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: options.temperature || this.defaultTemperature,
        max_tokens: options.maxTokens || this.defaultMaxTokens,
      };

      trace("DeepSeekClient", "Making API request", {
        url: `${this.baseUrl}/chat/completions`,
        model: this.model,
        messageCount: requestBody.messages.length,
        systemPromptLength: systemPrompt.length,
      });

      // 发送请求
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `DeepSeek API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result = await response.json();

      // 验证响应格式
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error("Invalid response format from DeepSeek API");
      }

      const polishedText = result.choices[0].message.content.trim();
      const processingTime = Date.now() - startTime;

      // 构建返回结果
      const polishingResult: PolishingResult = {
        originalText: text,
        polishedText,
        task: options.task,
        model: this.model,
        timestamp: Date.now(),
        metadata: {
          temperature: requestBody.temperature,
          maxTokens: requestBody.max_tokens,
          usage: result.usage
            ? {
                promptTokens: result.usage.prompt_tokens,
                completionTokens: result.usage.completion_tokens,
                totalTokens: result.usage.total_tokens,
              }
            : undefined,
          hasProgrammingContent,
          appliedCorrections: processedText !== text,
        },
      };

      info("DeepSeekClient", "Text processing completed", {
        task: options.task,
        originalLength: text.length,
        polishedLength: polishedText.length,
        processingTime,
        usage: result.usage,
        hasProgrammingContent,
      });

      return polishingResult;
    } catch (err) {
      const processingTime = Date.now() - startTime;

      error("DeepSeekClient", "Text processing failed", {
        task: options.task,
        textLength: text.length,
        processingTime,
        error: err instanceof Error ? err.message : String(err),
      });

      throw new Error(`文本处理失败: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * 构建系统提示词
   * @param task 任务类型
   * @param customPrompt 自定义提示词
   * @param userTerms 用户自定义术语
   * @param hasProgrammingContent 是否包含编程内容
   * @returns 系统提示词
   */
  private buildSystemPrompt(
    task: TextProcessingTask,
    customPrompt?: string,
    userTerms?: string,
    hasProgrammingContent?: boolean
  ): string {
    // 预定义的任务提示词（增强版本，包含编程术语支持）
    const taskPrompts: Record<TextProcessingTask, string> = {
      润色: "请润色文本，使其更流畅专业。只返回润色后的文本，不要添加解释或说明。",
      改写: "请重写文本，保持原意但使用不同表达。只返回改写后的文本，不要添加解释或说明。",
      纠错: "请纠正文本中的错误，包括语法、拼写和术语错误。只返回纠正后的文本，不要添加解释或说明。",
      翻译: "请翻译文本。只返回翻译结果，不要添加解释或说明。",
      扩写: "请扩展文本内容。只返回扩展后的文本，不要添加解释或说明。",
      缩写: "请精简文本内容。只返回精简后的文本，不要添加解释或说明。",
      学术润色: "请将文本调整为学术风格。只返回学术风格的文本，不要添加解释或说明。",
      编程术语纠错:
        "请纠正文本中的编程相关术语错误，包括编程语言名称、框架名称、API术语、技术概念等。确保所有技术术语的准确性和规范性。只返回纠正后的文本，不要添加解释或说明。",
    };

    // 获取基础提示词
    let basePrompt =
      taskPrompts[task] || `请对文本进行${task}处理。只返回处理后的文本，不要添加解释或说明。`;

    // 如果有自定义提示词，使用自定义提示词但确保也只返回结果
    if (customPrompt) {
      basePrompt = `${customPrompt}\n\n重要：只返回处理后的文本内容，不要添加任何解释、说明或额外信息。`;
    }

    // 如果检测到编程内容或是编程相关任务，添加编程术语提示
    if (hasProgrammingContent || task === "编程术语纠错" || task === "纠错") {
      const programmingTermsPrompt = buildProgrammingTermsPrompt(userTerms);
      if (programmingTermsPrompt) {
        basePrompt += programmingTermsPrompt;
      }

      // 为编程内容添加额外的指导
      basePrompt +=
        "\n\n注意：特别关注编程语言名称、框架名称、API术语、变量命名规范等技术术语的准确性。";
    }

    return basePrompt;
  }

  /**
   * 测试连接
   * @returns Promise<boolean> 连接是否成功
   */
  async testConnection(): Promise<boolean> {
    try {
      debug("DeepSeekClient", "Testing connection");

      const testResult = await this.processText("测试连接", {
        task: "润色",
        temperature: 0.1,
        maxTokens: 50,
      });

      info("DeepSeekClient", "Connection test successful", {
        responseLength: testResult.polishedText.length,
      });

      return true;
    } catch (err) {
      error("DeepSeekClient", "Connection test failed", {
        error: err instanceof Error ? err.message : String(err),
      });
      return false;
    }
  }
}

/**
 * 创建 DeepSeek 客户端实例
 * @param config DeepSeek 配置
 * @returns DeepSeekClient 实例
 */
export function createDeepSeekClient(config: DeepSeekConfig): DeepSeekClient {
  return new DeepSeekClient(config);
}

/**
 * 验证 DeepSeek 配置
 * @param config DeepSeek 配置
 * @returns 配置是否有效
 */
export function validateDeepSeekConfig(config: Partial<DeepSeekConfig>): config is DeepSeekConfig {
  return !!(
    config.apiKey &&
    config.model &&
    config.baseUrl &&
    config.apiKey.trim() !== "" &&
    config.model.trim() !== "" &&
    config.baseUrl.trim() !== ""
  );
}
