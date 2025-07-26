import { showToast, Toast, getPreferenceValues } from "@raycast/api";
import { readFileSync } from "fs";
import { DoubaoClient } from "./doubao-client";
import { extractPCMFromWav, getWavInfo } from "../audio";
import { TranscriptionPreferences, TranscriptionResult } from "../../types";
import { DEFAULT_PREFERENCES } from "../../constants";
import { trace, debug, info, warn, error, startTimer } from "../logger";
import { getDoubaoCredentials, getDeepSeekCredentials } from "../config";

// 获取用户偏好设置
export function getPreferences(): TranscriptionPreferences {
  const prefs = getPreferenceValues<TranscriptionPreferences>();
  const doubaoCredentials = getDoubaoCredentials();
  const deepseekCredentials = getDeepSeekCredentials();

  console.log("🔧 Transcription: getPreferences called");
  console.log("🔧 Transcription: Raw Raycast prefs - Doubao", {
    hasAppKey: !!prefs.doubaoAppKey,
    hasAccessToken: !!prefs.doubaoAccessToken,
    hasSecretKey: !!prefs.doubaoSecretKey,
    appKeyValue: prefs.doubaoAppKey,
    accessTokenValue: prefs.doubaoAccessToken,
    secretKeyValue: prefs.doubaoSecretKey,
  });

  console.log("🔧 Transcription: Raw Raycast prefs - DeepSeek", {
    hasApiKey: !!prefs.deepseekApiKey,
    hasModel: !!prefs.deepseekModel,
    hasBaseUrl: !!prefs.deepseekBaseUrl,
    hasPolishPrompt: !!prefs.polishPrompt,
    apiKeyValue: prefs.deepseekApiKey ? `${prefs.deepseekApiKey.substring(0, 4)}****` : "UNDEFINED",
    modelValue: prefs.deepseekModel,
    baseUrlValue: prefs.deepseekBaseUrl,
    enablePolishing: prefs.enablePolishing,
    polishingTask: prefs.polishingTask,
  });

  console.log("🔧 Transcription: Local credentials", {
    hasDoubaoCredentials: !!doubaoCredentials,
    hasDeepSeekCredentials: !!deepseekCredentials,
    doubaoAppKey: doubaoCredentials?.appKey,
    doubaoAccessToken: doubaoCredentials?.accessToken,
    doubaoSecretKey: doubaoCredentials?.secretKey,
    deepseekApiKey: deepseekCredentials?.apiKey ? `${deepseekCredentials.apiKey.substring(0, 4)}****` : "NONE",
    deepseekModel: deepseekCredentials?.model,
    deepseekBaseUrl: deepseekCredentials?.baseUrl,
  });

  // 优先使用Raycast preferences中的配置，如果为空则使用本地保存的配置
  const mergedPrefs = {
    ...DEFAULT_PREFERENCES,
    ...prefs,
    // 豆包配置：优先使用Raycast preferences，fallback到本地配置
    doubaoAppKey: prefs.doubaoAppKey || doubaoCredentials?.appKey,
    doubaoAccessToken: prefs.doubaoAccessToken || doubaoCredentials?.accessToken,
    doubaoSecretKey: prefs.doubaoSecretKey || doubaoCredentials?.secretKey,
    // DeepSeek配置：优先使用Raycast preferences，fallback到本地配置
    deepseekApiKey: prefs.deepseekApiKey || deepseekCredentials?.apiKey,
    deepseekModel: prefs.deepseekModel || deepseekCredentials?.model || "deepseek-chat",
    deepseekBaseUrl: prefs.deepseekBaseUrl || deepseekCredentials?.baseUrl || "https://api.deepseek.com/v1",
  };

  console.log("🔧 Transcription: Final merged prefs", {
    doubaoAppKey: mergedPrefs.doubaoAppKey,
    doubaoAccessToken: mergedPrefs.doubaoAccessToken,
    doubaoSecretKey: mergedPrefs.doubaoSecretKey,
    deepseekApiKey: mergedPrefs.deepseekApiKey ? `${mergedPrefs.deepseekApiKey.substring(0, 4)}****` : "NONE",
    deepseekModel: mergedPrefs.deepseekModel,
    deepseekBaseUrl: mergedPrefs.deepseekBaseUrl,
    enablePolishing: mergedPrefs.enablePolishing,
    polishingTask: mergedPrefs.polishingTask,
  });

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
    provider: "doubao",
    language: preferences.language,
  });

  // 获取音频信息
  const audioInfo = getWavInfo(audioFilePath);
  if (audioInfo) {
    debug("Transcription", "Audio info", audioInfo);
  }

  const startTime = Date.now();

  try {
    // 使用豆包进行转写
    const result = await transcribeWithDoubao(audioFilePath, preferences);

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

    // 获取音频信息用于动态超时计算
    const audioInfo = getWavInfo(audioFilePath);
    const audioDuration = audioInfo?.duration || 30; // 默认30秒，如果无法获取音频信息

    // 根据音频长度动态计算超时时间
    // 基础超时：60秒，额外时间：音频长度 * 2 + 网络缓冲30秒
    const baseTimeout = 60000; // 60秒基础超时
    const audioLengthMs = audioDuration * 1000; // 音频长度转为毫秒
    const dynamicTimeout = baseTimeout + (audioLengthMs * 2) + 30000; // 音频长度*2 + 30秒缓冲
    const timeoutSeconds = Math.round(dynamicTimeout / 1000);

    debug("Transcription", "Timeout calculation", { 
      audioDuration, 
      timeoutMs: dynamicTimeout, 
      timeoutSeconds 
    });

    // 创建一个 Promise 来等待最终结果（模仿 Python 的并发模式）
    const finalResultPromise = new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Transcription timeout after ${timeoutSeconds} seconds (audio: ${audioDuration}s)`));
      }, dynamicTimeout);

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
