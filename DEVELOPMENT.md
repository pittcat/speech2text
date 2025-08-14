# 开发指南

## 快速开始

1. **安装依赖**
   ```bash
   npm install
   ```

2. **开发模式**
   ```bash
   # 正常开发模式（无日志文件）
   npm run dev
   
   # Debug 模式（生成详细调试日志到 /tmp/speech-to-text-debug.log）
   npm run dev:debug
   ```

3. **代码检查和格式化**
   ```bash
   npm run lint      # 运行 ESLint 检查
   npm run fix-lint  # 自动修复 ESLint 问题
   ```

4. **构建插件**
   ```bash
   npm run build
   ```

5. **发布到 Raycast Store**
   ```bash
   npm run publish
   ```

## 测试豆包连接

使用提供的测试脚本验证豆包 API 连接：

```bash
node test-doubao-client.js
```

## 项目结构

### 核心组件
- `src/record-transcription.tsx` - 主录音界面，支持录音、转写、润色功能
- `src/transcription-history.tsx` - 历史记录界面，支持搜索、管理、导出
- `src/view-logs.tsx` - 调试日志查看界面

### AI 服务模块
- `src/utils/ai/doubao-client.ts` - 豆包 WebSocket 客户端实现
- `src/utils/ai/deepseek-client.ts` - DeepSeek HTTP 客户端实现
- `src/utils/ai/transcription.ts` - AI 转写核心逻辑和流程控制

### 智能处理模块
- `src/utils/programming-terms-corrector.ts` - 编程术语智能纠错引擎
- `src/utils/programming-dictionary.ts` - 编程词典和映射表
- `src/utils/prompt-manager.ts` - 提示词模板管理系统

### 工具和服务
- `src/hooks/useAudioRecorder.ts` - 音频录制 React Hook
- `src/utils/config.ts` - 配置管理和 API 凭证处理
- `src/utils/logger.ts` - 结构化日志系统
- `src/utils/history.ts` - 历史记录存储和管理
- `src/utils/formatting.ts` - 文本格式化工具
- `src/utils/audio.ts` - 音频文件处理工具

## 关键技术点

### 1. 豆包二进制 WebSocket 协议

豆包使用复杂的二进制 WebSocket 协议进行语音识别：

**协议格式：**
```
[4字节头部][4字节序列号][4字节负载大小][压缩负载数据]
```

**头部结构：**
- 字节0: 协议版本(4bit) + 头部大小(4bit)
- 字节1: 消息类型(4bit) + 标志位(4bit)  
- 字节2: 序列化方式(4bit) + 压缩方式(4bit)
- 字节3: 保留字段

**连接认证：**
- 需要 appKey、accessToken、secretKey 三个参数
- 使用复杂的二进制帧结构进行身份验证
- 支持集群路由和负载均衡

### 2. DeepSeek 文本处理架构

DeepSeek 使用标准的 REST API 进行文本处理：

**API 特点：**
- 标准 HTTP POST 请求
- JSON 格式的请求和响应
- 支持多种模型（deepseek-chat, deepseek-coder）
- 支持流式和非流式响应

**文本处理任务：**
- 润色、改写、纠错、翻译
- 扩写、缩写、学术润色
- Vibe Coding 编程术语纠错

### 3. 音频处理流程

**录音规格：**
- 使用 Sox 录制 16kHz, 16-bit, 单声道 WAV 音频
- 实时显示录音时长和状态
- 支持一键开始/停止录音

**数据传输：**
- 分段发送音频数据（200ms每段）
- 使用 gzip 压缩每个数据包
- 支持实时流式处理

### 4. 智能术语纠错引擎

**编程术语纠错：**
- 拼音/发音错误映射（如"派森" → "Python"）
- 大小写规范化处理
- 常见模式错误修正（如"点杰斯" → ".js"）
- 支持自定义词典扩展

**检测算法：**
- 自动检测编程相关内容
- 基于关键词和模式匹配
- 智能建议和自动完成

### 5. WebSocket 流式通信

**通信流程：**
- 建立连接 → 发送配置 → 发送音频 → 接收结果
- 支持实时增量更新识别结果
- 最后一个音频包使用负序列号标记

**错误处理：**
- 连接断开自动重连
- 超时和重试机制
- 详细的错误日志记录

## 调试技巧

### 1. 结构化日志系统

项目使用自定义的结构化日志系统：

```typescript
import { logger, debug, info, warn, error } from "./utils/logger";

// 基础日志
info("ComponentName", "操作描述", { data: "相关数据" });

// 调试信息
debug("ComponentName", "调试信息", { details });

// 错误日志
error("ComponentName", "错误描述", { error, context });
```

**日志级别：**
- `TRACE` - 最详细的程序执行流程
- `DEBUG` - 调试信息和变量状态  
- `INFO` - 一般操作信息
- `WARN` - 警告信息，程序可继续
- `ERROR` - 错误信息，功能可能失败

### 2. Debug 模式详解

**启用方式：**
```bash
# Debug 模式：生成 /tmp/speech-to-text-debug.log
npm run dev:debug

# 正常模式：无日志文件
npm run dev
```

**日志查看：**
- **插件内查看**: Raycast 中搜索 "View Plugin Logs"
- **文件查看**: 直接打开 `/tmp/speech-to-text-debug.log`
- **实时监控**: `tail -f /tmp/speech-to-text-debug.log`

### 3. 测试音频录制

**音频文件位置：**
- 临时文件：`/tmp/recording-[timestamp].wav`
- 保留文件（如果启用）：用户自定义位置或默认位置

**验证录音质量：**
- 使用 QuickTime Player 或其他音频播放器
- 检查采样率（应为 16kHz）和声道数（应为单声道）

### 4. API 调试

**豆包 API：**
- 查看 WebSocket 连接状态和消息流
- 使用 `test-doubao-client.js` 独立测试连接
- 检查认证参数和二进制协议格式
- 豆包 API 返回的 `X-Tt-Logid` 可用于联系技术支持

**DeepSeek API：**
- 检查 HTTP 请求和响应状态码
- 验证 API Key 有效性
- 查看请求配额和限制信息
- 监控模型响应时间和质量

### 5. 性能分析

**内存使用：**
- 监控音频数据的内存占用
- 检查 WebSocket 连接的资源释放
- 观察历史记录的存储大小

**网络性能：**
- WebSocket 连接延迟和稳定性
- HTTP API 调用响应时间
- 数据传输压缩效果

## 常见问题与解决方案

### Q: 豆包连接失败
**可能原因：**
- API 凭证错误（appKey、accessToken、secretKey）
- 网络连接问题
- WebSocket 协议实现错误

**解决方案：**
1. 验证 API 凭证是否正确且有效
2. 运行 `node test-doubao-client.js` 测试连接
3. 检查防火墙和代理设置
4. 查看详细的 WebSocket 连接日志

### Q: 录音没有声音
**可能原因：**
- 系统麦克风权限未授予
- Sox 未正确安装
- 音频设备被其他应用占用

**解决方案：**
1. 检查 Raycast 的麦克风权限设置
2. 确认 Sox 已安装：`brew install sox`
3. 重启 Raycast 或重新加载插件
4. 检查系统音频设备状态

### Q: DeepSeek 文本润色失败
**可能原因：**
- API Key 无效或已过期
- 请求配额超限
- 网络连接问题
- 模型参数配置错误

**解决方案：**
1. 验证 DeepSeek API Key 是否有效
2. 检查 API 配额使用情况
3. 尝试切换不同的模型（chat/coder）
4. 查看详细的 HTTP 响应错误信息

### Q: 转写结果不准确
**可能原因：**
- 录音质量差（噪音、距离太远）
- 语言设置不正确
- 缺少专业术语配置
- 提示词不够精确

**解决方案：**
1. 改善录音环境，减少背景噪音
2. 设置正确的语言而非自动检测
3. 在 "Custom Terms" 中添加专业术语
4. 调整提示词以更好地指导 AI 识别
5. 启用 Vibe Coding 功能纠正编程术语

### Q: 日志文件过大或找不到
**可能原因：**
- Debug 模式下日志累积过多
- 权限问题导致无法写入文件
- 日志文件路径配置错误

**解决方案：**
1. 定期清理 `/tmp/speech-to-text-debug.log`
2. 检查临时目录的写入权限
3. 在生产环境中关闭详细日志记录
4. 使用插件内的日志查看界面

### Q: 配置信息无法保存
**可能原因：**
- Raycast 偏好设置权限问题
- LocalStorage 存储限制
- 配置验证失败

**解决方案：**
1. 重启 Raycast 应用
2. 检查配置格式是否正确
3. 使用插件内的配置管理界面
4. 清理 LocalStorage 缓存重新配置

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request