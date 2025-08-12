export interface TranscriptionPreferences {
  aiProvider: "doubao";
  doubaoAppKey?: string;
  doubaoAccessToken?: string;
  doubaoSecretKey?: string;

  // 新增 DeepSeek 配置
  deepseekApiKey?: string;
  deepseekModel?: string;
  deepseekBaseUrl?: string;

  // 润色相关配置
  polishPrompt?: string; // DeepSeek 润色专用 prompt
  enablePolishing?: boolean; // 是否启用润色功能
  polishingTask?: string; // 默认润色任务类型
  selectedPromptId?: string; // 记住用户选择的润色模板

  language?: string;
  // 暂时保留以兼容现有代码，后续会逐步迁移到新系统
  promptText?: string; // 豆包转录提示词 - 待迁移
  userTerms?: string; // 自定义术语 - 待迁移
  enableContext?: boolean;
  saveAudioFiles?: boolean;
  audioSaveLocation?: string; // 音频文件保存位置

  // 日志控制配置
  enableLogging?: boolean;
  logLevel?: "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";
  logToFile?: boolean;
  logToConsole?: boolean;
}

export interface TranscriptionResult {
  text: string;
  timestamp: number;
  audioFilePath?: string;
  metadata?: {
    provider?: string;
    model?: string;
    language?: string;
    duration?: number;
  };
}

// 新增：文本润色结果接口
export interface PolishingResult {
  originalText: string;
  polishedText: string;
  task: string;
  model: string;
  timestamp: number;
  metadata?: {
    temperature?: number;
    maxTokens?: number;
    usage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

// 新增：DeepSeek 配置接口
export interface DeepSeekConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
  temperature?: number;
  maxTokens?: number;
}

// 新增：文本处理任务类型
export type TextProcessingTask = "润色" | "改写" | "纠错" | "翻译" | "扩写" | "缩写" | "学术润色" | "vibe coding";

// 新增：文本处理选项
export interface TextProcessingOptions {
  task: TextProcessingTask;
  customPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AudioRecorderState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioFilePath?: string;
  error?: string;
}

export interface DoubaoConfig {
  appId: string;
  accessToken: string;
  secretKey: string;
  language?: string;
  enableITN?: boolean;
  enablePunctuation?: boolean;
}

// 新增：预设润色提示词类型
export type PresetPromptKey =
  | "general"
  | "technical"
  | "business"
  | "academic"
  | "casual"
  | "formal"
  | "concise"
  | "detailed";

// 新增：自定义润色提示词
export interface CustomPrompt {
  id: string;
  name: string;
  prompt: string;
  createdAt: number;
  isCustom: true;
}

// 新增：预设润色提示词
export interface PresetPrompt {
  key: PresetPromptKey;
  name: string;
  prompt: string;
  description: string;
  isCustom: false;
}

// 新增：润色提示词选项（预设或自定义）
export type PromptOption = PresetPrompt | CustomPrompt;

// 新增：润色配置管理
export interface PolishingConfig {
  selectedPromptId: string; // 当前选择的 prompt ID
  customPrompts: CustomPrompt[]; // 用户自定义的 prompt 列表
}
