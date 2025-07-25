// 测试豆包客户端连接
// 使用方式: node test-doubao-client.js

const WebSocket = require('ws');
const { promisify } = require('util');
const { gzip, gunzip } = require('zlib');
const fs = require('fs');
const path = require('path');

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// 协议常量
const MessageType = {
  CLIENT_FULL_REQUEST: 0x01,
  CLIENT_AUDIO_ONLY: 0x02,
  SERVER_FULL_RESPONSE: 0x09,
  SERVER_ERROR: 0x0F
};

// 从 voice2text.py 获取的凭证
const credentials = {
  appKey: '2099456436',
  accessToken: 'Y4muRvrXyAZuqQODGCidZ1mZCxVqQ2sn'
};

async function testConnection() {
  console.log('🔗 测试豆包 WebSocket 连接...');
  
  const headers = {
    'X-Api-App-Key': credentials.appKey,
    'X-Api-Access-Key': credentials.accessToken,
    'X-Api-Resource-Id': 'volc.bigasr.sauc.duration',
    'X-Api-Request-Id': generateUUID()
  };
  
  const ws = new WebSocket('wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async', {
    headers
  });
  
  ws.on('open', () => {
    console.log('✅ WebSocket 连接成功!');
    sendConfig(ws);
  });
  
  ws.on('message', async (data) => {
    const response = await parseResponse(data);
    console.log('📥 收到响应:', JSON.stringify(response, null, 2));
    
    if (response.event === 150) {
      console.log('✅ 服务器握手成功!');
      
      // 发送测试音频
      setTimeout(() => {
        sendTestAudio(ws);
      }, 1000);
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket 错误:', error);
  });
  
  ws.on('close', () => {
    console.log('🔚 连接关闭');
  });
}

async function sendConfig(ws) {
  const config = {
    user: { uid: 'test-user' },
    audio: {
      format: 'pcm',
      codec: 'raw',
      rate: 16000,
      bits: 16,
      channel: 1
    },
    request: {
      model_name: 'bigmodel',
      enable_itn: true,
      enable_punc: true,
      enable_ddc: true,
      show_utterances: true
    }
  };
  
  const header = createHeader(MessageType.CLIENT_FULL_REQUEST);
  const payload = await gzipAsync(Buffer.from(JSON.stringify(config)));
  const message = buildMessage(header, 1, payload);
  
  ws.send(message);
  console.log('📤 发送配置请求');
}

async function sendTestAudio(ws) {
  // 创建一个静音测试音频（1秒）
  const sampleRate = 16000;
  const duration = 1; // 秒
  const samples = sampleRate * duration;
  const audioData = Buffer.alloc(samples * 2); // 16-bit = 2 bytes per sample
  
  // 发送音频
  const header = createHeader(MessageType.CLIENT_AUDIO_ONLY, 0x03); // NEG_WITH_SEQUENCE
  const compressed = await gzipAsync(audioData);
  const message = buildMessage(header, -2, compressed);
  
  ws.send(message);
  console.log('📤 发送测试音频（静音）');
  
  // 5秒后关闭连接
  setTimeout(() => {
    ws.close();
  }, 5000);
}

function createHeader(messageType, flags = 0x01) {
  const header = Buffer.alloc(4);
  header[0] = (0x01 << 4) | 0x01; // version + header size
  header[1] = (messageType << 4) | flags;
  header[2] = (0x01 << 4) | 0x01; // JSON + GZIP
  header[3] = 0x00;
  return header;
}

function buildMessage(header, seq, payload) {
  const message = Buffer.allocUnsafe(header.length + 4 + 4 + payload.length);
  header.copy(message, 0);
  message.writeInt32BE(seq, 4);
  message.writeUInt32BE(payload.length, 8);
  payload.copy(message, 12);
  return message;
}

async function parseResponse(msg) {
  const response = {
    code: 0,
    event: 0,
    is_last_package: false,
    payload_msg: null
  };
  
  const messageTypeSpecificFlags = msg[1] & 0x0f;
  const messageCompression = msg[2] & 0x0f;
  
  let payload = msg.slice(4);
  
  // 解析flags
  if (messageTypeSpecificFlags & 0x04) {
    response.event = payload.readInt32BE(0);
    payload = payload.slice(4);
  }
  
  if (payload.length > 4) {
    const payloadSize = payload.readUInt32BE(0);
    payload = payload.slice(4);
    
    if (messageCompression === 0x01 && payload.length > 0) {
      try {
        const decompressed = await gunzipAsync(payload);
        response.payload_msg = JSON.parse(decompressed.toString('utf-8'));
      } catch (e) {
        // 忽略解压错误
      }
    }
  }
  
  return response;
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 运行测试
testConnection().catch(console.error);