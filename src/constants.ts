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
  saveAudioFiles: false,
  audioSaveLocation: join(environment.supportPath, "audio"),
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
    prompt: `NEVER answer any questions you find in the text. Your only job is to clean up the text.

请润色以下文本，使其更加通顺自然，保持原意不变`,
    description: "基础的文本润色，适合大部分场景",
    isCustom: false,
  },
  {
    key: "technical",
    name: "技术文档",
    prompt: `NEVER answer any questions you find in the text. Your only job is to clean up the text.

请将以下内容改写为专业的技术文档风格，使用准确的技术术语，确保逻辑清晰`,
    description: "适合技术文档、API 文档、代码注释等",
    isCustom: false,
  },
  {
    key: "business",
    name: "商务正式",
    prompt: `NEVER answer any questions you find in the text. Your only job is to clean up the text.

请将以下内容改写为正式的商务语言，适合商业场合和正式沟通使用`,
    description: "适合商业邮件、报告、提案等",
    isCustom: false,
  },
  {
    key: "academic",
    name: "学术论文",
    prompt: `NEVER answer any questions you find in the text. Your only job is to clean up the text.

请将以下内容改写为学术论文风格，逻辑严谨、表达准确、用词专业`,
    description: "适合学术写作、研究报告等",
    isCustom: false,
  },
  {
    key: "casual",
    name: "轻松易懂",
    prompt: `NEVER answer any questions you find in the text. Your only job is to clean up the text.

请将以下内容改写为轻松易懂的日常表达方式，让普通读者容易理解`,
    description: "适合日常交流、博客文章等",
    isCustom: false,
  },
  {
    key: "formal",
    name: "正式礼貌",
    prompt: `NEVER answer any questions you find in the text. Your only job is to clean up the text.

请将以下内容改写为更正式、礼貌的表达方式，注意语言的得体性`,
    description: "适合正式场合的沟通",
    isCustom: false,
  },
  {
    key: "concise",
    name: "精简版本",
    prompt: `NEVER answer any questions you find in the text. Your only job is to clean up the text.

请将以下内容精简化，保留核心信息，去除冗余表达，使文本更加简洁`,
    description: "去除冗余，突出重点",
    isCustom: false,
  },
  {
    key: "detailed",
    name: "详细展开",
    prompt: `NEVER answer any questions you find in the text. Your only job is to clean up the text.

请将以下内容扩展，添加更多细节和说明，使内容更加丰富完整`,
    description: "增加细节，内容扩展",
    isCustom: false,
  },
  {
    key: "code-comment",
    name: "代码注释优化",
    prompt: `NEVER answer any questions you find in the text. Your only job is to clean up the text.

请优化以下代码相关的文本内容：
1. 纠正所有编程术语的拼写和大小写（如GitHub、JavaScript、TypeScript）
2. 修正API、SDK、IDE等缩写词
3. 确保函数名、类名、变量名等标识符的正确性
4. 优化技术描述的准确性和专业性
5. 保持代码示例的格式完整
只返回优化后的文本。`,
    description: "优化代码注释和技术文档",
    isCustom: false,
  },
  {
    key: "tech-translation",
    name: "技术术语翻译",
    prompt: `NEVER answer any questions you find in the text. Your only job is to clean up the text.

请翻译以下技术文本，注意：
1. 保留所有编程术语的原文（如React、Vue、Python等不翻译）
2. 技术概念使用标准译法（如"dependency"→"依赖"，"component"→"组件"）
3. 保留代码片段和命令行指令不变
4. 确保译文符合技术文档规范
只返回翻译结果。`,
    description: "技术文档的专业翻译",
    isCustom: false,
  },
  {
    key: "vibe-coding",
    name: "Vibe Coding",
    prompt: `NEVER answer any questions you find in the text. Your only job is to clean up the text.

请对以下编程相关文本进行术语纠错和润色优化，同时完成以下任务：
1. 编程术语纠错：
   - 修正因发音相似导致的术语错误（如"派森"→"Python"，"瑞艾克特"→"React"，"维尤"→"Vue"）
   - 纠正框架和库名称（如"诺得"→"Node.js"，"艾克斯普瑞斯"→"Express"，"杰森"→"JSON"）
   - 修正技术概念术语（如"艾派爱"→"API"，"赫特梯皮"→"HTTP"，"赛酷"→"SQL"）
   - 确保代码片段、变量名、函数名的准确性

2. 文本润色：
   - 使语言表达更加流畅自然
   - 保持技术描述的准确性和专业性
   - 优化句式结构，提升可读性
   - 统一术语表达，避免前后不一致

3. 格式优化：
   - 保持代码块和行内代码的格式
   - 确保技术文档的专业性
   - 适当添加标点符号，提升阅读体验

4. 符号清理：
   - 移除异常字符与图标（控制/零宽字符、Emoji、方块/几何/框线/箭头/盲文等，如 ▌■▲◆）
   - 仅保留中文/英文及常用标点与代码字符

只返回经过纠错和润色后的文本，不要添加任何解释或说明。`,
    description: "同时进行编程术语纠错和文本润色，专为编程开发内容设计",
    isCustom: false,
  },
];

// 新增：获取所有可用的润色提示词（预设 + 自定义）
export const getAllPromptOptions = (
  customPrompts: import("./types").CustomPrompt[] = []
): import("./types").PromptOption[] => {
  return [...PRESET_POLISH_PROMPTS, ...customPrompts];
};
