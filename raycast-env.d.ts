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
  "polishingTask": "润色" | "改写" | "纠错" | "翻译" | "扩写" | "缩写" | "学术润色"
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

