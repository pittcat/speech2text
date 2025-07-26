/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Doubao App Key - Your Doubao App Key (required for Doubao) */
  "doubaoAppKey"?: string,
  /** Doubao Access Token - Your Doubao Access Token (required for Doubao) */
  "doubaoAccessToken"?: string,
  /** Doubao Secret Key - Your Doubao Secret Key (required for Doubao) */
  "doubaoSecretKey"?: string,
  /** Default Language - Selecting a specific language can improve transcription accuracy */
  "language": "auto" | "en" | "es" | "fr" | "de" | "it" | "pt" | "zh" | "ja" | "ko" | "ru",
  /** Default Prompt - Default prompt text to guide the AI transcription */
  "promptText": string,
  /** Custom Terms - Comma-separated list of specialized terms, names, or jargon to help with transcription accuracy */
  "userTerms"?: string,
  /** Use Highlighted Text - Automatically use any text you have highlighted in other apps as context for transcription */
  "enableContext": boolean,
  /** Enable Debug Logging - Enable detailed logging for development and debugging. Recommended for developers, disable for end users. */
  "enableLogging": boolean,
  /** Log Level - Set the minimum log level to capture. Lower levels include all higher levels. */
  "logLevel": "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR",
  /** Log to File - Save debug logs to speech-to-text-debug.log file for troubleshooting */
  "logToFile": boolean,
  /** Log to Console - Display debug logs in console (for development use) */
  "logToConsole": boolean,
  /** DeepSeek API Key - Your DeepSeek API key for text polishing features */
  "deepseekApiKey"?: string,
  /** DeepSeek Model - DeepSeek model to use for text processing */
  "deepseekModel": "deepseek-chat" | "deepseek-coder",
  /** DeepSeek Base URL - DeepSeek API base URL (use default unless you have a custom endpoint) */
  "deepseekBaseUrl": string,
  /** Default Polish Prompt - Custom prompt template for text polishing */
  "polishPrompt": string,
  /** Enable Text Polishing - Enable the DeepSeek-powered text polishing functionality */
  "enablePolishing": boolean,
  /** Default Polishing Task - Default task type for text polishing */
  "polishingTask": "润色" | "改写" | "纠错" | "翻译" | "扩写" | "缩写" | "学术润色",
  /** 保存音频文件 - 是否在转录完成后保留原始音频文件。关闭此选项可节省存储空间 */
  "saveAudioFiles": boolean,
  /** 音频保存位置 - 自定义音频文件保存位置。留空则使用默认位置 */
  "audioSaveLocation"?: string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `record-transcription` command */
  export type RecordTranscription = ExtensionPreferences & {}
  /** Preferences accessible in the `transcription-history` command */
  export type TranscriptionHistory = ExtensionPreferences & {}
  /** Preferences accessible in the `view-logs` command */
  export type ViewLogs = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `record-transcription` command */
  export type RecordTranscription = {}
  /** Arguments passed to the `transcription-history` command */
  export type TranscriptionHistory = {}
  /** Arguments passed to the `view-logs` command */
  export type ViewLogs = {}
}

