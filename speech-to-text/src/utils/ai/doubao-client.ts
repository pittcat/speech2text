import { EventEmitter } from "events";
import WebSocket from "ws";

interface DoubaoConfig {
  appId: string;
  accessToken: string;
  language?: string;
  format?: string;
  sampleRate?: number;
  channels?: number;
  bitDepth?: number;
  enableITN?: boolean;
}

interface DoubaoResponse {
  code: number;
  message?: string;
  result?: {
    text: string;
    is_final: boolean;
    confidence?: number;
  };
  event: number;
  is_last_package: boolean;
  payload_msg?: any;
}

export class DoubaoClient extends EventEmitter {
  private ws: WebSocket | null = null;
  private seq = 0;
  private currentTranscription = "";
  private isConnected = false;
  
  // 常量配置
  private readonly SAMPLE_RATE = 16000;
  private readonly SEGMENT_DURATION = 200; // 200ms
  private readonly SEGMENT_SIZE = (this.SAMPLE_RATE * this.SEGMENT_DURATION) / 1000 * 2; // 16位音频每样本2字节

  constructor() {
    super();
  }

  async connect(config: DoubaoConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = `wss://openspeech.bytedance.com/api/v1/asr`;
      
      console.log("Connecting to Doubao WebSocket...");
      this.ws = new WebSocket(wsUrl);

      this.ws.on("open", () => {
        console.log("WebSocket connected to Doubao");
        this.isConnected = true;
        resolve();
      });

      this.ws.on("message", (data: Buffer) => {
        try {
          this.handleMessage(data);
        } catch (error) {
          console.error("Error handling WebSocket message:", error);
          this.emit("error", error);
        }
      });

      this.ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        this.isConnected = false;
        reject(error);
      });

      this.ws.on("close", (code, reason) => {
        console.log(`WebSocket closed: ${code} - ${reason}`);
        this.isConnected = false;
      });
    });
  }

  async sendConfig(config: DoubaoConfig): Promise<void> {
    if (!this.ws || !this.isConnected) {
      throw new Error("WebSocket not connected");
    }

    const configMessage = {
      header: {
        message_type: "client_start",
        message_id: this.generateMessageId(),
        timestamp: Date.now()
      },
      payload: {
        app: {
          appid: config.appId,
          token: config.accessToken,
          cluster: "volcengine_streaming_common"
        },
        user: {
          uid: "raycast_user_" + Date.now()
        },
        audio: {
          format: config.format || "pcm",
          sample_rate: config.sampleRate || 16000,
          channel: config.channels || 1,
          bits: config.bitDepth || 16,
          codec: "pcm"
        },
        request: {
          reqid: this.generateRequestId(),
          nbest: 1,
          continuous_recognition: true,
          max_alternatives: 1,
          show_utterances: true,
          result_type: "full",
          language: config.language || "zh",
          enable_itn: config.enableITN !== false,
          enable_punctuation: true,
          enable_words: false
        }
      }
    };

    const message = JSON.stringify(configMessage);
    console.log("Sending config to Doubao:", message);
    
    this.ws.send(message);
    this.seq++;
  }

  async sendAudioFile(audioData: Buffer): Promise<void> {
    if (!this.ws || !this.isConnected) {
      throw new Error("WebSocket not connected");
    }

    console.log(`Starting to send audio data, total size: ${audioData.length} bytes`);
    
    // 分段发送音频数据
    let offset = 0;
    const segmentSize = this.SEGMENT_SIZE;
    
    while (offset < audioData.length) {
      const chunk = audioData.slice(offset, Math.min(offset + segmentSize, audioData.length));
      const isLast = offset + segmentSize >= audioData.length;
      
      await this.sendAudioChunk(chunk, isLast);
      offset += segmentSize;
      
      // 添加小延迟以模拟实时音频流
      await new Promise(resolve => setTimeout(resolve, this.SEGMENT_DURATION));
    }
    
    console.log("Finished sending audio data");
  }

  private async sendAudioChunk(chunk: Buffer, isLast: boolean): Promise<void> {
    const audioMessage = {
      header: {
        message_type: "client_audio",
        message_id: this.generateMessageId(),
        timestamp: Date.now()
      },
      payload: {
        sequence: this.seq++,
        data: chunk.toString('base64'),
        is_end: isLast
      }
    };

    const message = JSON.stringify(audioMessage);
    this.ws!.send(message);
    
    if (isLast) {
      console.log("Sent final audio chunk");
    }
  }

  async waitForFinalResult(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for final transcription result"));
      }, 30000); // 30秒超时

      const onResult = (text: string, isFinal: boolean) => {
        if (isFinal) {
          clearTimeout(timeout);
          this.off("result", onResult);
          this.off("error", onError);
          resolve(text);
        }
      };

      const onError = (error: Error) => {
        clearTimeout(timeout);
        this.off("result", onResult);
        this.off("error", onError);
        reject(error);
      };

      this.on("result", onResult);
      this.on("error", onError);
    });
  }

  private handleMessage(data: Buffer): void {
    try {
      const message = data.toString('utf-8');
      console.log("Received message from Doubao:", message);
      
      const response: DoubaoResponse = JSON.parse(message);
      
      if (response.code !== 0) {
        console.error("Doubao API error:", response.message);
        this.emit("error", new Error(response.message || "Unknown Doubao API error"));
        return;
      }

      // 处理连接确认
      if (response.event === 150) {
        console.log("Doubao handshake successful");
        this.emit("connected");
        return;
      }

      // 处理转写结果
      if (response.result) {
        const { text, is_final } = response.result;
        
        if (text) {
          console.log(`Transcription result: "${text}" (final: ${is_final})`);
          
          if (is_final) {
            this.currentTranscription += text;
            this.emit("result", text, true);
          } else {
            this.emit("result", text, false);
          }
        }
      }

      // 处理结束信号
      if (response.is_last_package) {
        console.log("Received final package from Doubao");
        this.emit("result", this.currentTranscription, true);
      }

    } catch (error) {
      console.error("Error parsing Doubao response:", error);
      this.emit("error", error);
    }
  }

  async close(): Promise<void> {
    if (this.ws) {
      // 发送结束消息
      const endMessage = {
        header: {
          message_type: "client_finish",
          message_id: this.generateMessageId(),
          timestamp: Date.now()
        },
        payload: {}
      };

      this.ws.send(JSON.stringify(endMessage));
      
      // 关闭连接
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      this.currentTranscription = "";
      console.log("Doubao WebSocket connection closed");
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

