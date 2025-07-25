import { environment } from "@raycast/api";
import { join } from "path";

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
