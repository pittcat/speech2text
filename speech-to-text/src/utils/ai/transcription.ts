import fs from "fs-extra";
import { getPreferenceValues } from "@raycast/api";
import { TranscriptionResult } from "../../types";
import { buildCompletePrompt } from "../../constants";
import path from "path";
import { DoubaoClient } from "./doubao-client";
import { extractPCMFromWav } from "../audio";

function isTranscriptionResult(data: unknown): data is TranscriptionResult {
  if (!data || typeof data !== "object") return false;

  const result = data as Partial<TranscriptionResult>;
  return (
    typeof result.text === "string" &&
    typeof result.timestamp === "string" &&
    typeof result.audioFile === "string" &&
    (result.language === undefined || typeof result.language === "string") &&
    (result.prompt === undefined || typeof result.prompt === "string") &&
    typeof result.model === "string"
  );
}

export async function transcribeAudio(
  filePath: string,
  options?: {
    overrideLanguage?: string;
    overridePrompt?: string;
    promptOptions?: {
      promptText?: string;
      userTerms?: string;
      highlightedText?: string;
    };
  },
): Promise<TranscriptionResult> {
  const preferences = getPreferenceValues<Preferences>();

  if (!preferences.doubaoAppId || !preferences.doubaoAccessToken) {
    throw new Error("豆包 API 凭证未设置。请在扩展偏好设置中配置豆包 App ID 和 Access Token。");
  }

  try {
    console.log("开始豆包语音转写，文件路径:", filePath);

    // 从音频文件提取PCM数据
    const audioInfo = await extractPCMFromWav(filePath);
    console.log("音频信息:", {
      sampleRate: audioInfo.sampleRate,
      channels: audioInfo.channels,
      bitDepth: audioInfo.bitDepth,
      dataSize: audioInfo.pcmData.length
    });

    // 创建豆包客户端
    const client = new DoubaoClient();

    // 连接到豆包服务
    await client.connect({
      appId: preferences.doubaoAppId,
      accessToken: preferences.doubaoAccessToken,
      language: options?.overrideLanguage ?? preferences.language,
      sampleRate: audioInfo.sampleRate,
      channels: audioInfo.channels,
      bitDepth: audioInfo.bitDepth,
      enableITN: true
    });

    // 监听连接成功事件
    const connectedPromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("连接豆包服务超时"));
      }, 10000);
      
      client.once("connected", () => {
        clearTimeout(timeout);
        console.log("豆包连接成功");
        resolve();
      });
    });

    // 发送配置
    await client.sendConfig({
      appId: preferences.doubaoAppId,
      accessToken: preferences.doubaoAccessToken,
      language: options?.overrideLanguage ?? preferences.language,
      sampleRate: audioInfo.sampleRate,
      channels: audioInfo.channels,
      bitDepth: audioInfo.bitDepth,
      enableITN: true
    });

    // 等待连接确认
    await connectedPromise;

    // 监听部分结果
    client.on("result", (text: string, isFinal: boolean) => {
      console.log(`转写结果: "${text}" (最终: ${isFinal})`);
    });

    // 发送音频数据
    await client.sendAudioFile(audioInfo.pcmData);

    // 等待最终结果
    const finalText = await client.waitForFinalResult();

    // 关闭连接
    await client.close();

    const result: TranscriptionResult = {
      text: finalText.trim(),
      timestamp: new Date().toISOString(),
      audioFile: filePath,
      language: options?.overrideLanguage ?? preferences.language,
      prompt: buildCompletePrompt(
        options?.promptOptions?.promptText ?? preferences.promptText,
        options?.promptOptions?.userTerms ?? preferences.userTerms,
        options?.promptOptions?.highlightedText,
      ),
      model: "doubao-asr"
    };

    await saveTranscription(filePath, result);
    console.log("转写完成:", result.text);
    return result;
  } catch (error) {
    console.error("豆包转写错误:", error);
    throw error;
  }
}

export async function saveTranscription(
  audioFilePath: string,
  transcriptionData: TranscriptionResult,
): Promise<string> {
  const parsedPath = path.parse(audioFilePath);
  const transcriptionFilePath = path.format({
    dir: parsedPath.dir,
    name: parsedPath.name,
    ext: ".json",
  });

  const dataToSave = {
    ...transcriptionData,
    audioFile: audioFilePath,
  };

  try {
    await fs.writeJSON(transcriptionFilePath, dataToSave, { spaces: 2 });
    return transcriptionFilePath;
  } catch (error) {
    console.error(`Error saving transcription for ${audioFilePath}:`, error);
    throw new Error(`Failed to save transcription: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function loadTranscription(audioFilePath: string): Promise<TranscriptionResult | null> {
  const parsedPath = path.parse(audioFilePath);
  const transcriptionFilePath = path.format({
    dir: parsedPath.dir,
    name: parsedPath.name,
    ext: ".json",
  });

  try {
    if (await fs.pathExists(transcriptionFilePath)) {
      const data = await fs.readJSON(transcriptionFilePath);
      if (!isTranscriptionResult(data)) {
        console.error(`Invalid transcription data format in ${transcriptionFilePath}`);
        return null;
      }
      return data;
    }
    return null;
  } catch (error) {
    console.error(`Error loading transcription for ${audioFilePath}:`, error);
    return null;
  }
}
