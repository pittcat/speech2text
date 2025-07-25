export interface TranscriptionPreferences {
  aiProvider: "doubao" | "groq";
  doubaoAppKey?: string;
  doubaoAccessToken?: string;
  doubaoSecretKey?: string;
  apiKey?: string; // Groq API Key
  model?: string;
  language?: string;
  promptText?: string;
  userTerms?: string;
  enableContext?: boolean;
  saveAudioFiles?: boolean;
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

