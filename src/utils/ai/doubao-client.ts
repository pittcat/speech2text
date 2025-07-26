import WebSocket from "ws";
import { gzip, gunzip } from "zlib";
import { promisify } from "util";
import { randomUUID } from "crypto";
import { EventEmitter } from "events";
import { trace, debug, info, warn, error as logError } from "../logger";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// 协议常量
enum ProtocolVersion {
  V1 = 0x01,
}

enum MessageType {
  CLIENT_FULL_REQUEST = 0x01,
  CLIENT_AUDIO_ONLY = 0x02,
  SERVER_FULL_RESPONSE = 0x09,
  SERVER_ERROR = 0x0f,
}

enum MessageTypeSpecificFlags {
  NO_SEQUENCE = 0x00,
  POS_SEQUENCE = 0x01,
  NEG_SEQUENCE = 0x02,
  NEG_WITH_SEQUENCE = 0x03,
}

enum SerializationType {
  NO_SERIALIZATION = 0x00,
  JSON = 0x01,
}

enum CompressionType {
  NO_COMPRESSION = 0x00,
  GZIP = 0x01,
}

export interface DoubaoCredentials {
  appId: string;
  accessToken: string;
}

export interface DoubaoConfig {
  language?: string;
  enableITN?: boolean;
  enablePunctuation?: boolean;
}

export class DoubaoClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private seq: number = 1;
  private currentTranscription: string = "";
  private isConnected: boolean = false;

  // 音频配置
  private readonly SAMPLE_RATE = 16000;
  private readonly BITS_PER_SAMPLE = 16;
  private readonly CHANNELS = 1;
  private readonly SEGMENT_DURATION = 200; // ms

  constructor() {
    super();
  }

  async connect(credentials: DoubaoCredentials): Promise<void> {
    const requestId = randomUUID();
    const headers = {
      "X-Api-App-Key": credentials.appId,
      "X-Api-Access-Key": credentials.accessToken,
      "X-Api-Resource-Id": "volc.bigasr.sauc.duration",
      "X-Api-Request-Id": requestId,
    };

    info("DoubaoClient", "Connecting to Doubao WebSocket", {
      url: "wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async",
      requestId,
      appId: credentials.appId.substring(0, 4) + "****",
    });

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        logError("DoubaoClient", "Connection timeout after 10 seconds");
        if (this.ws) {
          this.ws.close();
        }
        reject(new Error("Connection timeout"));
      }, 10000);

      this.ws = new WebSocket("wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async", {
        headers,
        timeout: 10000,
      });

      this.ws.on("open", () => {
        clearTimeout(timeout);
        this.isConnected = true;
        info("DoubaoClient", "WebSocket connection established");
        resolve();
      });

      this.ws.on("error", (error) => {
        clearTimeout(timeout);
        this.isConnected = false;
        logError("DoubaoClient", "WebSocket error", error);
        reject(error);
      });

      this.ws.on("message", (data: Buffer) => {
        trace("DoubaoClient", "Received message", { size: data.length });
        this.handleMessage(data);
      });

      this.ws.on("close", (code, reason) => {
        clearTimeout(timeout);
        this.isConnected = false;
        warn("DoubaoClient", "WebSocket closed", { code, reason: reason?.toString() });
        this.emit("close");
      });
    });
  }

  async sendConfig(config?: DoubaoConfig): Promise<void> {
    const requestConfig = {
      user: { uid: "demo_uid" }, // 改为与 Python 一致
      audio: {
        format: "pcm",
        codec: "raw",
        rate: this.SAMPLE_RATE,
        bits: this.BITS_PER_SAMPLE,
        channel: this.CHANNELS,
      },
      request: {
        model_name: "bigmodel",
        enable_itn: config?.enableITN ?? true,
        enable_punc: config?.enablePunctuation ?? true,
        enable_ddc: true,
        show_utterances: true,
        enable_nonstream: false,
      },
    };

    debug("DoubaoClient", "Sending config", requestConfig);

    if (config?.language && config.language !== "auto") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (requestConfig.request as any).language = config.language;
    }

    const header = this.createHeader(MessageType.CLIENT_FULL_REQUEST);
    const payload = await gzipAsync(Buffer.from(JSON.stringify(requestConfig)));
    const message = this.buildMessage(header, this.seq++, payload);

    trace("DoubaoClient", "Sending config message", {
      seq: this.seq - 1,
      messageSize: message.length,
    });

    this.ws!.send(message);
  }

  // 简化的等待配置响应方法
  waitForConfigResponse(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Config response timeout after 5 seconds"));
      }, 5000);

      const onConfigResponse = (success: boolean) => {
        clearTimeout(timeout);
        this.off("configResponse", onConfigResponse);
        resolve(success);
      };

      this.once("configResponse", onConfigResponse);
    });
  }

  async sendAudio(audioData: Buffer, isLast: boolean = false): Promise<void> {
    if (!this.isConnected || !this.ws) {
      logError("DoubaoClient", "Cannot send audio - WebSocket not connected");
      throw new Error("WebSocket not connected");
    }

    trace("DoubaoClient", "Sending audio chunk", {
      size: audioData.length,
      isLast,
      seq: isLast ? -this.seq : this.seq,
    });

    const flags = isLast
      ? MessageTypeSpecificFlags.NEG_WITH_SEQUENCE
      : MessageTypeSpecificFlags.POS_SEQUENCE;
    const header = this.createHeader(
      MessageType.CLIENT_AUDIO_ONLY,
      flags,
      SerializationType.NO_SERIALIZATION
    );
    const compressed = await gzipAsync(audioData);
    const seq = isLast ? -this.seq : this.seq++;
    const message = this.buildMessage(header, seq, compressed);

    this.ws.send(message);
  }

  async sendAudioFile(audioBuffer: Buffer): Promise<void> {
    // 分段发送音频
    const segmentSize = Math.floor((this.SAMPLE_RATE * this.SEGMENT_DURATION * 2) / 1000);
    const segments = [];

    for (let i = 0; i < audioBuffer.length; i += segmentSize) {
      const end = Math.min(i + segmentSize, audioBuffer.length);
      segments.push(audioBuffer.slice(i, end));
    }

    info("DoubaoClient", "Sending audio file", {
      totalSize: audioBuffer.length,
      segmentSize,
      segmentCount: segments.length,
      duration: `${(audioBuffer.length / (this.SAMPLE_RATE * 2)).toFixed(2)}s`,
    });

    // 发送所有音频段
    for (let i = 0; i < segments.length; i++) {
      const isLast = i === segments.length - 1;
      await this.sendAudio(segments[i], isLast);

      if (!isLast) {
        // 模拟实时流，延迟200ms
        await new Promise((resolve) => setTimeout(resolve, this.SEGMENT_DURATION));
      }
    }
  }

  waitForFinalResult(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for final result"));
      }, 30000); // 30秒超时

      this.once("final", (text: string) => {
        clearTimeout(timeout);
        resolve(text);
      });

      this.once("error", (error: Error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async close(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  private createHeader(
    messageType: number,
    flags: number = MessageTypeSpecificFlags.POS_SEQUENCE,
    serialization: number = SerializationType.JSON,
    compression: number = CompressionType.GZIP
  ): Buffer {
    const header = Buffer.alloc(4);
    header[0] = (ProtocolVersion.V1 << 4) | 0x01; // version + header size
    header[1] = (messageType << 4) | flags; // type + flags
    header[2] = (serialization << 4) | compression; // JSON + GZIP
    header[3] = 0x00; // reserved
    return header;
  }

  private buildMessage(header: Buffer, seq: number, payload: Buffer): Buffer {
    const message = Buffer.allocUnsafe(header.length + 4 + 4 + payload.length);
    header.copy(message, 0);
    message.writeInt32BE(seq, 4);
    message.writeUInt32BE(payload.length, 8);
    payload.copy(message, 12);

    trace("DoubaoClient", "📦 SEND: Building message", {
      headerHex: header.toString("hex"),
      seq,
      payloadSize: payload.length,
      totalSize: message.length,
      first20Bytes: message.slice(0, 20).toString("hex"),
    });

    return message;
  }

  private async handleMessage(data: Buffer) {
    try {
      trace("DoubaoClient", "🔍 RAW: Received raw message", {
        size: data.length,
        first10Bytes: data.slice(0, 10).toString("hex"),
        header: {
          byte0: `0x${data[0].toString(16).padStart(2, "0")}`,
          byte1: `0x${data[1].toString(16).padStart(2, "0")}`,
          byte2: `0x${data[2].toString(16).padStart(2, "0")}`,
          byte3: `0x${data[3].toString(16).padStart(2, "0")}`,
        },
      });

      const response = await this.parseResponse(data);

      debug("DoubaoClient", "Parsed response", {
        code: response.code,
        event: response.event,
        isLastPackage: response.is_last_package,
        hasPayload: !!response.payload_msg,
        currentSeq: this.seq,
      });

      // 处理不同的事件类型
      if (response.event === 150) {
        info("DoubaoClient", "Server handshake successful (event 150)");
        // 注意：Python 版本在收到 event 150 后直接继续，不等待额外的配置确认
        // 这是关键差异！
        return;
      }

      if (response.event === 153) {
        logError("DoubaoClient", "Server connection failed");
        this.emit("error", new Error("Server connection failed"));
        return;
      }

      if (response.code !== 0) {
        logError("DoubaoClient", "Server error response", { code: response.code });
        this.emit("error", new Error(`Server error: ${response.code}`));
        return;
      }

      if (response.payload_msg?.result) {
        const result = response.payload_msg.result;

        // 处理字典格式的 result
        if (typeof result === "object" && !Array.isArray(result)) {
          if (result.text) {
            debug("DoubaoClient", "Transcription update (dict format)", {
              text: result.text,
              definite: result.definite,
              isLast: response.is_last_package,
            });
            this.emit("transcription", result.text);
            this.currentTranscription = result.text;
          }

          // 检查是否为最终结果
          if (response.is_last_package) {
            info("DoubaoClient", "Final transcription result", {
              text: this.currentTranscription,
              length: this.currentTranscription.length,
            });
            this.emit("final", this.currentTranscription);
          }
        }
        // 处理列表格式的 result（像 Python 版本一样）
        else if (Array.isArray(result)) {
          for (const item of result) {
            if (item.text) {
              debug("DoubaoClient", "Transcription update (list format)", {
                text: item.text,
                isLast: response.is_last_package,
              });
              this.emit("transcription", item.text);
              this.currentTranscription = item.text; // 保存最新的文本
            }
          }

          // 检查是否为最终结果
          if (response.is_last_package) {
            info("DoubaoClient", "Final transcription result (from list)", {
              text: this.currentTranscription,
              length: this.currentTranscription.length,
            });
            this.emit("final", this.currentTranscription);
          }
        }
      }
    } catch (err) {
      logError("DoubaoClient", "Error handling message", err);
      this.emit("error", err);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async parseResponse(msg: Buffer): Promise<any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response: any = {
      code: 0,
      event: 0,
      is_last_package: false,
      payload_sequence: 0,
      payload_size: 0,
      payload_msg: null,
    };

    const headerSize = msg[0] & 0x0f;
    const messageType = msg[1] >> 4;
    const messageTypeSpecificFlags = msg[1] & 0x0f;
    const serializationMethod = msg[2] >> 4;
    const messageCompression = msg[2] & 0x0f;

    trace("DoubaoClient", "📥 PARSE: Header info", {
      headerSize,
      messageType: `0x${messageType.toString(16)}`,
      flags: `0x${messageTypeSpecificFlags.toString(16)}`,
      serialization: serializationMethod,
      compression: messageCompression,
    });

    let payload = msg.slice(headerSize * 4);

    // 解析flags
    if (messageTypeSpecificFlags & 0x01) {
      response.payload_sequence = payload.readInt32BE(0);
      payload = payload.slice(4);
    }
    if (messageTypeSpecificFlags & 0x02) {
      response.is_last_package = true;
    }
    if (messageTypeSpecificFlags & 0x04) {
      response.event = payload.readInt32BE(0);
      payload = payload.slice(4);
    }

    // 解析message_type
    if (messageType === MessageType.SERVER_FULL_RESPONSE) {
      response.payload_size = payload.readUInt32BE(0);
      payload = payload.slice(4);
    } else if (messageType === MessageType.SERVER_ERROR) {
      response.code = payload.readInt32BE(0);
      response.payload_size = payload.readUInt32BE(4);
      payload = payload.slice(8);
    }

    if (!payload || payload.length === 0) {
      return response;
    }

    // 解压缩
    if (messageCompression === CompressionType.GZIP) {
      try {
        payload = await gunzipAsync(payload);
      } catch (e) {
        // 对于event=150的初始响应，payload解析失败是正常的
        if (response.event !== 150) {
          throw e;
        }
        return response;
      }
    }

    // 解析payload
    if (serializationMethod === SerializationType.JSON && payload.length > 0) {
      try {
        response.payload_msg = JSON.parse(payload.toString("utf-8"));
      } catch (e) {
        if (response.event !== 150) {
          throw e;
        }
      }
    }

    return response;
  }
}
