# 开发指南

## 快速开始

1. **安装依赖**
   ```bash
   npm install
   ```

2. **开发模式**
   ```bash
   npm run dev
   ```

3. **构建插件**
   ```bash
   npm run build
   ```

4. **发布到 Raycast**
   ```bash
   npm run publish
   ```

## 测试豆包连接

使用提供的测试脚本验证豆包 API 连接：

```bash
node test-doubao-client.js
```

## 项目结构

- `src/record-transcription.tsx` - 主录音界面
- `src/transcription-history.tsx` - 历史记录界面
- `src/utils/ai/doubao-client.ts` - 豆包 WebSocket 客户端实现
- `src/utils/ai/transcription.ts` - AI 转写核心逻辑
- `src/hooks/useAudioRecorder.ts` - 音频录制 React Hook

## 关键技术点

### 1. 豆包二进制协议

协议格式：
```
[4字节头部][4字节序列号][4字节负载大小][压缩负载数据]
```

头部结构：
- 字节0: 协议版本(4bit) + 头部大小(4bit)
- 字节1: 消息类型(4bit) + 标志位(4bit)  
- 字节2: 序列化方式(4bit) + 压缩方式(4bit)
- 字节3: 保留字段

### 2. 音频处理

- 使用 Sox 录制 16kHz, 16-bit, 单声道 WAV 音频
- 分段发送音频数据（200ms每段）
- 使用 gzip 压缩每个数据包

### 3. WebSocket 流式通信

- 建立连接 → 发送配置 → 发送音频 → 接收结果
- 支持实时增量更新识别结果
- 最后一个音频包使用负序列号标记

## 调试技巧

1. **查看日志**
   - 使用 `console.log` 输出调试信息
   - Raycast 开发模式会显示控制台输出

2. **测试音频录制**
   - 录制的音频文件保存在 `~/Library/Application Support/com.raycast.macos/extensions/speech-to-text/audio/`
   - 可以使用音频播放器验证录音质量

3. **API 调试**
   - 豆包 API 返回的 `X-Tt-Logid` 可用于联系技术支持
   - Groq API 有详细的错误信息

## 常见问题

### Q: 豆包连接失败
A: 检查 API 凭证是否正确，网络是否正常

### Q: 录音没有声音
A: 确保系统麦克风权限已授予 Raycast

### Q: 转写结果不准确
A: 尝试调整语言设置或添加专业术语

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request