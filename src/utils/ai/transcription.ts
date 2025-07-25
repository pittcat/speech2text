import { showToast, Toast, getPreferenceValues } from "@raycast/api";
import { readFileSync } from "fs";
import Groq from "groq-sdk";
import { DoubaoClient } from "./doubao-client";
import { extractPCMFromWav, getWavInfo } from "../audio";
import { TranscriptionPreferences, TranscriptionResult } from "../../types";
import { DEFAULT_PREFERENCES } from "../../constants";
import { trace, debug, info, warn, error, startTimer } from "../logger";

// 获取用户偏好设置
export function getPreferences(): TranscriptionPreferences {
  const prefs = getPreferenceValues<TranscriptionPreferences>();

  // 临时硬编码豆包凭证（用于测试）
  // TODO: 在设置界面配置后删除这些硬编码值
  const defaultsWithCredentials = {
    ...DEFAULT_PREFERENCES,
    doubaoAppKey: "2099456436",
    doubaoAccessToken: "Y4muRvrXyAZuqQODGCidZ1mZCxVqQ2sn",
    doubaoSecretKey: "AH7V1Ekewr4OJTWIkFXJZDFAoY4lZIe5",
  };

  // 合并顺序调整，确保硬编码的凭证不被空值覆盖
  const mergedPrefs = { ...defaultsWithCredentials, ...prefs };

  // 如果从偏好设置中没有获取到凭证，使用硬编码的值
  if (!mergedPrefs.doubaoAppKey) {
    mergedPrefs.doubaoAppKey = defaultsWithCredentials.doubaoAppKey;
  }
  if (!mergedPrefs.doubaoAccessToken) {
    mergedPrefs.doubaoAccessToken = defaultsWithCredentials.doubaoAccessToken;
  }
  if (!mergedPrefs.doubaoSecretKey) {
    mergedPrefs.doubaoSecretKey = defaultsWithCredentials.doubaoSecretKey;
  }

  return mergedPrefs;
}

// 主转写函数
export async function transcribeAudio(
  audioFilePath: string,
  overrides?: Partial<TranscriptionPreferences>
): Promise<TranscriptionResult> {
  const timer = startTimer("Transcription", "transcribeAudio");
  const preferences = getPreferences();

  // 如果有覆盖值，应用它们（但不覆盖凭证）
  if (overrides) {
    Object.assign(preferences, overrides);
  }

  info("Transcription", "Starting transcription", {
    audioFilePath,
    provider: preferences.aiProvider,
    language: preferences.language,
  });

  // 获取音频信息
  const audioInfo = getWavInfo(audioFilePath);
  if (audioInfo) {
    debug("Transcription", "Audio info", audioInfo);
  }

  const startTime = Date.now();

  try {
    let result: TranscriptionResult;

    if (preferences.aiProvider === "doubao") {
      result = await transcribeWithDoubao(audioFilePath, preferences);
    } else {
      result = await transcribeWithGroq(audioFilePath, preferences);
    }

    // 添加音频元数据
    if (audioInfo) {
      result.metadata = {
        ...result.metadata,
        duration: audioInfo.duration,
      };
    }

    // 计算处理时间
    const processingTime = (Date.now() - startTime) / 1000;
    info("Transcription", "Transcription completed", {
      processingTime: `${processingTime.toFixed(2)}s`,
      resultLength: result.text.length,
    });

    timer();
    return result;
  } catch (err) {
    error("Transcription", "Transcription failed", err);
    await showToast({
      style: Toast.Style.Failure,
      title: "Transcription failed",
      message: err instanceof Error ? err.message : "Unknown error",
    });
    timer();
    throw err;
  }
}

// 使用豆包进行转写
async function transcribeWithDoubao(
  audioFilePath: string,
  preferences: TranscriptionPreferences
): Promise<TranscriptionResult> {
  const timer = startTimer("Transcription", "transcribeWithDoubao");

  if (!preferences.doubaoAppKey || !preferences.doubaoAccessToken) {
    const errMsg = "Doubao credentials not configured. Please set them in preferences.";
    error("Transcription", errMsg);
    throw new Error(errMsg);
  }

  const client = new DoubaoClient();

  try {
    // 显示连接提示
    await showToast({
      style: Toast.Style.Animated,
      title: "Connecting to Doubao...",
    });

    // 连接服务器
    await client.connect({
      appId: preferences.doubaoAppKey!,
      accessToken: preferences.doubaoAccessToken!,
    });

    // 发送配置
    debug("Transcription", "Sending config to Doubao");
    await client.sendConfig({
      language: preferences.language,
      enableITN: true,
      enablePunctuation: true,
    });

    // Python 版本在发送 config 后不等待额外的响应，直接继续
    // 这是关键差异！
    debug("Transcription", "Config sent, proceeding without waiting for response");

    // 更新提示
    await showToast({
      style: Toast.Style.Animated,
      title: "Transcribing with Doubao...",
    });

    // 读取音频文件
    trace("Transcription", "Reading audio file", { audioFilePath });
    const wavBuffer = readFileSync(audioFilePath);
    const pcmData = extractPCMFromWav(wavBuffer);

    if (!pcmData) {
      const errMsg = "Failed to extract audio data from WAV file";
      error("Transcription", errMsg);
      throw new Error(errMsg);
    }

    debug("Transcription", "PCM data extracted", {
      wavSize: wavBuffer.length,
      pcmSize: pcmData.length,
    });

    // 监听实时转写结果
    client.on("transcription", (text: string) => {
      trace("Transcription", "Partial result", { text, length: text.length });
    });

    // 监听错误事件
    client.on("error", (err: Error) => {
      error("Transcription", "DoubaoClient error event", err);
    });

    // 创建一个 Promise 来等待最终结果（模仿 Python 的并发模式）
    const finalResultPromise = new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Transcription timeout after 30 seconds"));
      }, 30000);

      client.once("final", (text: string) => {
        clearTimeout(timeout);
        resolve(text);
      });

      client.once("error", (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // 发送音频数据（同时会接收响应）
    debug("Transcription", "About to send audio data");
    await client.sendAudioFile(pcmData);
    debug("Transcription", "Audio data sent successfully");

    // 等待最终结果
    debug("Transcription", "Waiting for final result");
    const finalText = await finalResultPromise;
    debug("Transcription", "Final result received", { textLength: finalText.length });

    // 关闭连接
    await client.close();

    // 后处理文本
    const processedText = postProcessText(finalText, preferences);

    await showToast({
      style: Toast.Style.Success,
      title: "Transcription completed",
    });

    timer();

    return {
      text: processedText,
      timestamp: Date.now(),
      audioFilePath: preferences.saveAudioFiles ? audioFilePath : undefined,
      metadata: {
        provider: "doubao",
        model: "bigmodel",
        language: preferences.language,
      },
    };
  } catch (err) {
    error("Transcription", "Doubao transcription error", err);
    await client.close();
    timer();
    throw err;
  }
}

// 使用Groq进行转写
async function transcribeWithGroq(
  audioFilePath: string,
  preferences: TranscriptionPreferences
): Promise<TranscriptionResult> {
  const timer = startTimer("Transcription", "transcribeWithGroq");

  if (!preferences.apiKey) {
    const errMsg = "Groq API key not configured. Please set it in preferences.";
    error("Transcription", errMsg);
    throw new Error(errMsg);
  }

  debug("Transcription", "Using Groq API", {
    model: preferences.model || "whisper-large-v3",
    language: preferences.language,
  });

  const groq = new Groq({ apiKey: preferences.apiKey });

  await showToast({
    style: Toast.Style.Animated,
    title: "Transcribing with Groq...",
  });

  // 准备音频文件流
  const fileBuffer = readFileSync(audioFilePath);
  const file = new File([fileBuffer], "audio.wav", { type: "audio/wav" });

  // 构建提示词
  const prompt = buildPrompt(preferences);
  if (prompt) {
    trace("Transcription", "Using prompt", { promptLength: prompt.length });
  }

  // 调用Groq API
  debug("Transcription", "Calling Groq API");
  const transcription = await groq.audio.transcriptions.create({
    file: file,
    model: preferences.model || "whisper-large-v3",
    response_format: "verbose_json",
    language: preferences.language !== "auto" ? preferences.language : undefined,
    prompt: prompt,
  });

  info("Transcription", "Groq transcription completed", {
    text: transcription.text?.substring(0, 100) + "...",
    language: transcription.language,
  });

  await showToast({
    style: Toast.Style.Success,
    title: "Transcription completed",
  });

  return {
    text: transcription.text || "",
    timestamp: Date.now(),
    audioFilePath: preferences.saveAudioFiles ? audioFilePath : undefined,
    metadata: {
      provider: "groq",
      model: preferences.model || "whisper-large-v3",
      language: transcription.language,
    },
  };

  timer();
  return result;
}

// 构建提示词
function buildPrompt(preferences: TranscriptionPreferences): string {
  const parts: string[] = [];

  if (preferences.promptText) {
    parts.push(preferences.promptText);
  }

  if (preferences.userTerms) {
    parts.push(`Terms: ${preferences.userTerms}`);
  }

  return parts.join(" ");
}

// 后处理文本
function postProcessText(text: string, preferences: TranscriptionPreferences): string {
  const processed = text.trim();

  // 添加用户自定义术语的替换逻辑
  if (preferences.userTerms) {
    // const terms = preferences.userTerms.split(",").map((t) => t.trim());
    // TODO: 这里可以添加更复杂的术语替换逻辑
  }

  return processed;
}

// 重新转写音频
export async function retranscribeAudio(
  audioFilePath: string,
  newPreferences?: Partial<TranscriptionPreferences>
): Promise<TranscriptionResult> {
  return transcribeAudio(audioFilePath, newPreferences);
}
