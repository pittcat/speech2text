# 调试指南

## 日志文件位置

日志文件保存在插件目录下：
```
/Users/pittcat/Dev/Python/voice2text/speech-to-text/speech-to-text-debug.log
```

## 日志特性

- **固定文件名**：`speech-to-text-debug.log`
- **覆盖模式**：每次启动插件都会删除旧日志，开始新的记录
- **详细级别**：记录 TRACE 级别的所有信息

## 查看日志的方法

### 方法 1：使用 Raycast 界面
1. 打开 Raycast
2. 搜索 "View Plugin Logs"
3. 查看实时日志

### 方法 2：直接查看文件
```bash
# 实时查看日志
tail -f /Users/pittcat/Dev/Python/voice2text/speech-to-text/speech-to-text-debug.log

# 查看完整日志
cat /Users/pittcat/Dev/Python/voice2text/speech-to-text/speech-to-text-debug.log

# 搜索特定内容
grep "ERROR" /Users/pittcat/Dev/Python/voice2text/speech-to-text/speech-to-text-debug.log
```

## 日志格式

```
[时间戳] [日志级别] [会话ID] [组件名] 消息内容 | {JSON数据}
```

示例：
```
[2025-07-25T14:30:00.123Z] [INFO] [1737806400123-abc123] [RecordTranscription] Starting recording
[2025-07-25T14:30:01.456Z] [DEBUG] [1737806400123-abc123] [DoubaoClient] Sending config | {"model_name":"bigmodel","enable_itn":true}
[2025-07-25T14:30:02.789Z] [ERROR] [1737806400123-abc123] [DoubaoClient] WebSocket error | {"message":"Connection failed","code":"ECONNREFUSED"}
```

## 日志级别说明

- **TRACE**: 最详细的跟踪信息（函数调用、数据流）
- **DEBUG**: 调试信息（配置、中间状态）
- **INFO**: 重要操作信息（开始/结束录音、连接状态）
- **WARN**: 警告信息（可恢复的错误）
- **ERROR**: 错误信息（操作失败、异常）

## 常见问题调试

### 1. 录音问题
搜索关键词：`AudioRecorder`
```bash
grep "AudioRecorder" speech-to-text-debug.log
```

### 2. 豆包连接问题
搜索关键词：`DoubaoClient`
```bash
grep "DoubaoClient" speech-to-text-debug.log | grep -E "ERROR|WARN"
```

### 3. 转写失败
搜索关键词：`Transcription`
```bash
grep "Transcription" speech-to-text-debug.log | grep "failed"
```

### 4. WebSocket 通信
搜索关键词：`WebSocket`
```bash
grep -E "WebSocket|message|response" speech-to-text-debug.log
```

## 性能分析

查看操作耗时：
```bash
grep "duration" speech-to-text-debug.log
```

## 清理日志

日志会在每次插件启动时自动清理，无需手动删除。