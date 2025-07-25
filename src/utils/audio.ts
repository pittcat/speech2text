import { readFileSync, unlinkSync, statSync } from "fs";
import { showToast, Toast } from "@raycast/api";

export interface AudioInfo {
  duration: number;
  size: number;
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

// 读取WAV文件头信息
export function getWavInfo(filePath: string): AudioInfo | null {
  try {
    const buffer = readFileSync(filePath);
    const stats = statSync(filePath);

    // WAV文件头解析
    // 跳过 RIFF 头部 (12 bytes)
    // 查找 fmt 块
    let offset = 12;
    while (offset < buffer.length - 8) {
      const chunkId = buffer.toString("ascii", offset, offset + 4);
      const chunkSize = buffer.readUInt32LE(offset + 4);

      if (chunkId === "fmt ") {
        // 解析 fmt 块
        // const audioFormat = buffer.readUInt16LE(offset + 8);
        const channels = buffer.readUInt16LE(offset + 10);
        const sampleRate = buffer.readUInt32LE(offset + 12);
        const byteRate = buffer.readUInt32LE(offset + 16);
        // const blockAlign = buffer.readUInt16LE(offset + 20);
        const bitDepth = buffer.readUInt16LE(offset + 22);

        // 查找 data 块来计算时长
        let dataOffset = offset + 8 + chunkSize;
        let dataSize = 0;

        while (dataOffset < buffer.length - 8) {
          const dataChunkId = buffer.toString("ascii", dataOffset, dataOffset + 4);
          const dataChunkSize = buffer.readUInt32LE(dataOffset + 4);

          if (dataChunkId === "data") {
            dataSize = dataChunkSize;
            break;
          }

          dataOffset += 8 + dataChunkSize;
        }

        const duration = dataSize / byteRate;

        return {
          duration,
          size: stats.size,
          sampleRate,
          channels,
          bitDepth,
        };
      }

      offset += 8 + chunkSize;
    }

    return null;
  } catch (error) {
    console.error("Failed to read WAV info:", error);
    return null;
  }
}

// 读取音频文件为Buffer
export function readAudioFile(filePath: string): Buffer | null {
  try {
    return readFileSync(filePath);
  } catch (error) {
    console.error("Failed to read audio file:", error);
    showToast({
      style: Toast.Style.Failure,
      title: "Failed to read audio file",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return null;
  }
}

// 删除音频文件
export async function deleteAudioFile(filePath: string): Promise<boolean> {
  try {
    unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error("Failed to delete audio file:", error);
    await showToast({
      style: Toast.Style.Failure,
      title: "Failed to delete audio file",
      message: error instanceof Error ? error.message : "Unknown error",
    });
    return false;
  }
}

// 从WAV文件中提取PCM数据
export function extractPCMFromWav(wavBuffer: Buffer): Buffer | null {
  try {
    // 查找 data 块
    let offset = 12; // 跳过 RIFF 头部

    while (offset < wavBuffer.length - 8) {
      const chunkId = wavBuffer.toString("ascii", offset, offset + 4);
      const chunkSize = wavBuffer.readUInt32LE(offset + 4);

      if (chunkId === "data") {
        // 返回 PCM 数据
        return wavBuffer.slice(offset + 8, offset + 8 + chunkSize);
      }

      offset += 8 + chunkSize;
    }

    console.error("No data chunk found in WAV file");
    return null;
  } catch (error) {
    console.error("Failed to extract PCM data:", error);
    return null;
  }
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// 格式化音频时长
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }

  return `${minutes}:${secs.toString().padStart(2, "0")}`;
}
