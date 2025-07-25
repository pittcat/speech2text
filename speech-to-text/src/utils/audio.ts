import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import { DEFAULT_TEMP_DIR, RECORDING_FILE_FORMAT, RECORDING_SAMPLE_RATE, SOX_CONFIG } from "../constants";
import { AudioValidationResult, ErrorTypes } from "../types";

const MIN_VALID_FILE_SIZE = 1024; // 1KB

export async function ensureTempDirectory(directory: string = DEFAULT_TEMP_DIR): Promise<string> {
  await fs.ensureDir(directory);
  return directory;
}

export function generateAudioFilename(directory: string = DEFAULT_TEMP_DIR): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  return path.join(directory, `recording-${timestamp}.${RECORDING_FILE_FORMAT}`);
}

export async function checkSoxInstalled(): Promise<string | null> {
  try {
    // Try multiple ways to find Sox
    const soxPath = execSync(
      `which sox || ([ -f /usr/bin/sox ] && echo /usr/bin/sox) || ([ -f /usr/local/bin/sox ] && echo /usr/local/bin/sox) || ([ -f /opt/homebrew/bin/sox ] && echo /opt/homebrew/bin/sox)`,
      { encoding: "utf8" },
    ).trim();

    if (soxPath) {
      console.log("Sox found at:", soxPath);
      return soxPath;
    }
    return null;
  } catch (error) {
    console.error("Sox not found:", error);
    return null;
  }
}

export async function listAudioFiles(directory: string = DEFAULT_TEMP_DIR): Promise<string[]> {
  await ensureTempDirectory(directory);
  const files = await fs.readdir(directory);
  const audioFiles = files
    .filter((file) => file.endsWith(`.${RECORDING_FILE_FORMAT}`))
    .map((file) => path.join(directory, file));
  return audioFiles;
}

export async function validateAudioFile(filePath: string): Promise<AudioValidationResult> {
  try {
    if (!(await fs.pathExists(filePath))) {
      return { isValid: false, error: ErrorTypes.AUDIO_FILE_MISSING };
    }

    const stats = await fs.stat(filePath);
    if (stats.size === 0) {
      return { isValid: false, error: ErrorTypes.AUDIO_FILE_EMPTY };
    }

    if (stats.size < MIN_VALID_FILE_SIZE) {
      return { isValid: false, error: ErrorTypes.AUDIO_FILE_TOO_SMALL };
    }

    const soxPath = await checkSoxInstalled();
    if (soxPath) {
      try {
        execSync(`${soxPath} --i "${filePath}"`, { stdio: "pipe" });
      } catch (error) {
        return {
          isValid: false,
          error: ErrorTypes.AUDIO_FILE_INVALID_FORMAT,
        };
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: ErrorTypes.AUDIO_FILE_VALIDATION_ERROR,
    };
  }
}

async function estimateDurationFromFileSize(filePath: string): Promise<number> {
  const { size } = await fs.stat(filePath);
  const sampleRate = RECORDING_SAMPLE_RATE; // Use the constant from our config
  const bytesPerSample = 2; // 16-bit audio = 2 bytes per sample
  return Math.round(size / (sampleRate * bytesPerSample));
}

export async function getAudioDuration(filePath: string): Promise<number> {
  try {
    const soxPath = await checkSoxInstalled();
    if (!soxPath) {
      console.log("Sox not found, falling back to file size estimation");
      return estimateDurationFromFileSize(filePath);
    }

    const stdout = await execSync(`${soxPath} --i -D "${filePath}"`);
    const duration = parseFloat(stdout.toString().trim());

    if (isNaN(duration) || duration <= 0) {
      throw new Error("Invalid duration returned by Sox");
    }

    return Math.round(duration);
  } catch (error) {
    console.error(`Error getting duration for ${filePath}:`, error);

    try {
      return await estimateDurationFromFileSize(filePath);
    } catch (fallbackError) {
      throw new Error(`Failed to get audio duration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

export function buildSoxCommand(outputPath: string): string[] {
  return [
    "-t", "coreaudio", "-d",  // 指定输入类型为 coreaudio，设备为默认
    "-t", "wav",              // 指定输出类型为 wav
    "-c", String(SOX_CONFIG.CHANNELS),     // 单声道
    "-r", String(RECORDING_SAMPLE_RATE),   // 采样率 16kHz
    "-b", String(SOX_CONFIG.BIT_DEPTH),    // 位深度 16位
    "-e", SOX_CONFIG.ENCODING,             // 编码方式 signed-integer
    "-V" + String(SOX_CONFIG.VERBOSE_LEVEL),
    outputPath,
    "trim", "0"              // 确保从开始录制，避免静音
  ];
}

export interface AudioInfo {
  sampleRate: number;
  channels: number;
  bitDepth: number;
  pcmData: Buffer;
}

export async function extractPCMFromWav(filePath: string): Promise<AudioInfo> {
  const fs = await import("fs-extra");
  
  try {
    // 读取WAV文件
    const buffer = await fs.readFile(filePath);
    
    // 解析WAV头部信息
    if (buffer.length < 44) {
      throw new Error("Invalid WAV file: too short");
    }
    
    // 检查RIFF标识
    const riffHeader = buffer.toString('ascii', 0, 4);
    if (riffHeader !== 'RIFF') {
      throw new Error("Invalid WAV file: missing RIFF header");
    }
    
    // 检查WAV标识
    const waveHeader = buffer.toString('ascii', 8, 12);
    if (waveHeader !== 'WAVE') {
      throw new Error("Invalid WAV file: missing WAVE header");
    }
    
    // 读取格式信息
    const channels = buffer.readUInt16LE(22);
    const sampleRate = buffer.readUInt32LE(24);
    const bitDepth = buffer.readUInt16LE(34);
    
    // 找到数据块
    let dataOffset = 36;
    while (dataOffset < buffer.length - 8) {
      const chunkId = buffer.toString('ascii', dataOffset, dataOffset + 4);
      const chunkSize = buffer.readUInt32LE(dataOffset + 4);
      
      if (chunkId === 'data') {
        // 找到数据块，提取PCM数据
        const pcmData = buffer.slice(dataOffset + 8, dataOffset + 8 + chunkSize);
        
        console.log(`Extracted PCM data: ${pcmData.length} bytes, ${sampleRate}Hz, ${channels}ch, ${bitDepth}bit`);
        
        return {
          sampleRate,
          channels,
          bitDepth,
          pcmData
        };
      }
      
      dataOffset += 8 + chunkSize;
    }
    
    throw new Error("Invalid WAV file: no data chunk found");
    
  } catch (error) {
    console.error("Error extracting PCM from WAV:", error);
    throw error;
  }
}
