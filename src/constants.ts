import { environment } from "@raycast/api";
import { join } from "path";
import { PresetPrompt } from "./types";

// 音频配置
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,
  CHANNELS: 1,
  BIT_DEPTH: 16,
  FORMAT: "wav",
  CHUNK_SIZE: 1024,
  SEGMENT_DURATION: 200, // ms
} as const;

// 存储路径
export const STORAGE_PATH = {
  AUDIO_DIR: join(environment.supportPath, "audio"),
  HISTORY_FILE: join(environment.supportPath, "history.json"),
} as const;

// Sox命令配置
export const SOX_COMMAND = [
  "/opt/homebrew/bin/sox",
  "-q",
  "-t",
  "coreaudio",
  "default",
  "-b",
  "16",
  "-c",
  "1",
  "-r",
  "16000",
  "-e",
  "signed-integer",
  "-t",
  "wav",
] as const;

// API URLs
export const API_URLS = {
  DOUBAO: "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async",
} as const;

// 默认配置
export const DEFAULT_PREFERENCES = {
  aiProvider: "doubao" as const,
  language: "auto",
  enableContext: true,
  saveAudioFiles: true,
  promptText:
    "Maintain proper sentence structure, punctuation, and paragraphs. Format numbers, currency, and units appropriately.",
  // DeepSeek 相关默认配置
  deepseekModel: "deepseek-chat",
  deepseekBaseUrl: "https://api.deepseek.com/v1",
  polishPrompt: "请润色以下文本，使其更加通顺自然，保持原意不变",
  enablePolishing: true,
  polishingTask: "润色",
} as const;

// 支持的语言
export const SUPPORTED_LANGUAGES = [
  { title: "Auto Detect", value: "auto" },
  { title: "Chinese", value: "zh" },
  { title: "English", value: "en" },
  { title: "Japanese", value: "ja" },
  { title: "Korean", value: "ko" },
  { title: "Spanish", value: "es" },
  { title: "French", value: "fr" },
  { title: "German", value: "de" },
  { title: "Italian", value: "it" },
  { title: "Portuguese", value: "pt" },
  { title: "Russian", value: "ru" },
] as const;

// 新增：预设润色提示词模板
export const PRESET_POLISH_PROMPTS: PresetPrompt[] = [
  {
    key: "general",
    name: "通用润色",
    prompt: "请润色以下文本，使其更加通顺自然，保持原意不变",
    description: "基础的文本润色，适合大部分场景",
    isCustom: false,
  },
  {
    key: "technical",
    name: "技术文档",
    prompt: "请将以下内容改写为专业的技术文档风格，使用准确的技术术语，确保逻辑清晰",
    description: "适合技术文档、API 文档、代码注释等",
    isCustom: false,
  },
  {
    key: "business",
    name: "商务正式",
    prompt: "请将以下内容改写为正式的商务语言，适合商业场合和正式沟通使用",
    description: "适合商业邮件、报告、提案等",
    isCustom: false,
  },
  {
    key: "academic",
    name: "学术论文",
    prompt: "请将以下内容改写为学术论文风格，逻辑严谨、表达准确、用词专业",
    description: "适合学术写作、研究报告等",
    isCustom: false,
  },
  {
    key: "casual",
    name: "轻松易懂",
    prompt: "请将以下内容改写为轻松易懂的日常表达方式，让普通读者容易理解",
    description: "适合日常交流、博客文章等",
    isCustom: false,
  },
  {
    key: "formal",
    name: "正式礼貌",
    prompt: "请将以下内容改写为更正式、礼貌的表达方式，注意语言的得体性",
    description: "适合正式场合的沟通",
    isCustom: false,
  },
  {
    key: "concise",
    name: "精简版本",
    prompt: "请将以下内容精简化，保留核心信息，去除冗余表达，使文本更加简洁",
    description: "去除冗余，突出重点",
    isCustom: false,
  },
  {
    key: "detailed",
    name: "详细展开",
    prompt: "请将以下内容扩展，添加更多细节和说明，使内容更加丰富完整",
    description: "增加细节，内容扩展",
    isCustom: false,
  },
];

// 新增：获取所有可用的润色提示词（预设 + 自定义）
export const getAllPromptOptions = (
  customPrompts: import("./types").CustomPrompt[] = []
): import("./types").PromptOption[] => {
  return [...PRESET_POLISH_PROMPTS, ...customPrompts];
};
