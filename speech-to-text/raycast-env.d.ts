/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** 豆包 App ID - 您的豆包应用 ID，用于语音转文字服务 */
  "doubaoAppId": string,
  /** 豆包 Access Token - 您的豆包访问令牌 */
  "doubaoAccessToken": string,
  /** Default Language - Selecting a specific language can improve transcription accuracy */
  "language": "auto" | "en" | "es" | "fr" | "de" | "it" | "pt" | "zh" | "ja" | "ko" | "ru",
  /** Default Prompt - Default prompt text to guide the AI transcription */
  "promptText": string,
  /** Custom Terms - Comma-separated list of specialized terms, names, or jargon to help with transcription accuracy */
  "userTerms"?: string,
  /** Use Highlighted Text - Automatically use any text you have highlighted in other apps as context for transcription */
  "enableContext": boolean
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `record-transcription` command */
  export type RecordTranscription = ExtensionPreferences & {}
  /** Preferences accessible in the `transcription-history` command */
  export type TranscriptionHistory = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `record-transcription` command */
  export type RecordTranscription = {}
  /** Arguments passed to the `transcription-history` command */
  export type TranscriptionHistory = {}
}

