/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** AI Provider - Choose your AI provider for transcription */
  "aiProvider": "doubao" | "groq",
  /** Doubao App Key - Your Doubao App Key (required for Doubao) */
  "doubaoAppKey"?: string,
  /** Doubao Access Token - Your Doubao Access Token (required for Doubao) */
  "doubaoAccessToken"?: string,
  /** Doubao Secret Key - Your Doubao Secret Key (required for Doubao) */
  "doubaoSecretKey"?: string,
  /** Groq API Key - Your Groq API key for speech-to-text transcription (required for Groq) */
  "apiKey"?: string,
  /** Transcription Model - The Groq model to use for transcription */
  "model": "whisper-large-v3" | "whisper-large-v3-turbo" | "distil-whisper-large-v3-en",
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

