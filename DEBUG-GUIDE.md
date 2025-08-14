# 调试指南

## 概述

本指南详细说明如何调试 Raycast Speech to Text 插件的各种问题，包括日志系统使用、常见问题诊断和性能分析。

## 日志文件位置

### Debug 模式日志
```
/tmp/speech-to-text-debug.log
```

**重要说明：**
- 只有在 `npm run dev:debug` 模式下才会生成此日志文件
- 正常的 `npm run dev` 不会生成日志文件
- 每次启动 debug 模式都会清空旧日志

### 其他临时文件
```
/tmp/recording-[timestamp].wav  # 录音临时文件
```

## Debug 模式详解

### 启用 Debug 模式

**方法 1：使用命令行**
```bash
# 启动 Debug 模式（生成详细日志文件）
npm run dev:debug

# 正常开发模式（无日志文件）
npm run dev
```

**方法 2：通过 Raycast 设置**
1. 打开 Raycast 设置 (⌘+,)
2. 找到插件设置
3. 启用 "Enable Debug Logging"
4. 设置 "Log to File" 为 true
5. 选择合适的日志级别

### 日志特性

- **固定路径**：`/tmp/speech-to-text-debug.log`
- **按需生成**：仅在 debug 模式下创建
- **自动清理**：每次启动 debug 模式自动清空
- **详细记录**：包含完整的启动信息、配置状态、API 调用等

## 查看日志的方法

### 方法 1：插件内查看（推荐）
1. 打开 Raycast
2. 搜索 "View Plugin Logs"
3. 实时查看结构化日志
4. 支持按级别过滤和搜索
5. 快捷键：
   - `⌘+R` - 刷新日志
   - `⌘+C` - 复制选中日志
   - `⌘+Shift+C` - 清理日志

### 方法 2：命令行查看
```bash
# 实时监控日志（需要在 debug 模式下）
tail -f /tmp/speech-to-text-debug.log

# 查看完整日志
cat /tmp/speech-to-text-debug.log

# 查看最近的错误
grep -E "ERROR|WARN" /tmp/speech-to-text-debug.log | tail -20

# 按时间范围查看（最近5分钟）
grep "$(date -v-5M '+%Y-%m-%d')" /tmp/speech-to-text-debug.log

# 搜索特定组件的日志
grep "DoubaoClient" /tmp/speech-to-text-debug.log

# 查看某个会话的所有日志
grep "session-id-12345" /tmp/speech-to-text-debug.log
```

### 方法 3：日志分析工具
```bash
# 使用 jq 分析 JSON 结构化日志
grep "DEBUG" /tmp/speech-to-text-debug.log | grep -o '{.*}' | jq '.'

# 统计错误类型
grep "ERROR" /tmp/speech-to-text-debug.log | awk '{print $4}' | sort | uniq -c

# 查看性能数据
grep "duration" /tmp/speech-to-text-debug.log | grep -o '"duration":[0-9]*'
```

## 日志格式

### 结构化日志格式
```
[时间戳] [日志级别] [会话ID] [组件名] 消息内容 | {JSON数据}
```

### 示例日志条目
```
[2025-01-14T14:30:00.123Z] [INFO] [1737806400123-abc123] [RecordTranscription] Starting recording
[2025-01-14T14:30:01.456Z] [DEBUG] [1737806400123-abc123] [DoubaoClient] Sending config | {"model_name":"bigmodel","enable_itn":true}
[2025-01-14T14:30:02.789Z] [ERROR] [1737806400123-abc123] [DoubaoClient] WebSocket error | {"message":"Connection failed","code":"ECONNREFUSED"}
[2025-01-14T14:30:03.012Z] [INFO] [1737806400123-abc123] [ProgrammingTermsCorrector] Applied corrections | {"corrections":2,"originalLength":150}
```

## 日志级别说明

| 级别 | 用途 | 典型场景 |
|------|------|----------|
| **TRACE** | 最详细的跟踪信息 | 函数调用、数据流、循环执行 |
| **DEBUG** | 调试信息 | 配置加载、中间状态、变量值 |
| **INFO** | 重要操作信息 | 开始/结束录音、连接建立、任务完成 |
| **WARN** | 警告信息 | 可恢复的错误、配置问题、性能警告 |
| **ERROR** | 错误信息 | 操作失败、异常、不可恢复的问题 |

### 会话ID说明
- 格式：`[timestamp]-[random]`
- 用途：追踪同一次录音转写的完整流程
- 示例：`1737806400123-abc123`

## 常见问题调试

### 1. 录音问题

**症状：** 录音无声音、录音失败、音频质量差

**调试步骤：**
```bash
# 搜索录音相关日志
grep "AudioRecorder" /tmp/speech-to-text-debug.log

# 检查 Sox 相关错误
grep -i "sox" /tmp/speech-to-text-debug.log

# 查看录音文件路径和大小
grep "recording.*wav" /tmp/speech-to-text-debug.log

# 检查权限问题
grep -i "permission" /tmp/speech-to-text-debug.log
```

**常见错误模式：**
- `Sox command failed`: Sox 未安装或权限问题
- `Permission denied`: 麦克风权限未授予
- `No input device`: 音频设备不可用

### 2. 豆包连接问题

**症状：** WebSocket 连接失败、认证错误、连接断开

**调试步骤：**
```bash
# 查看豆包客户端所有日志
grep "DoubaoClient" /tmp/speech-to-text-debug.log

# 重点查看错误和警告
grep "DoubaoClient" /tmp/speech-to-text-debug.log | grep -E "ERROR|WARN"

# 检查 WebSocket 连接状态
grep -E "WebSocket.*connecting|connected|disconnected" /tmp/speech-to-text-debug.log

# 查看认证过程
grep -E "auth|token|credential" /tmp/speech-to-text-debug.log
```

**常见错误模式：**
- `Authentication failed`: API 凭证错误
- `Connection refused`: 网络连接问题
- `WebSocket close event`: 连接异常断开

### 3. DeepSeek 文本润色问题

**症状：** 润色失败、API 调用错误、响应超时

**调试步骤：**
```bash
# 查看 DeepSeek 客户端日志
grep "DeepSeekClient" /tmp/speech-to-text-debug.log

# 检查 HTTP 请求和响应
grep -E "HTTP|request|response" /tmp/speech-to-text-debug.log | grep -i deepseek

# 查看 API 错误
grep -E "API.*error|quota|rate.limit" /tmp/speech-to-text-debug.log
```

### 4. Vibe Coding 术语纠错

**症状：** 编程术语纠错不生效、纠错结果不准确

**调试步骤：**
```bash
# 查看术语纠错日志
grep "ProgrammingTermsCorrector" /tmp/speech-to-text-debug.log

# 检查内容检测结果
grep "detectProgrammingContent" /tmp/speech-to-text-debug.log

# 查看纠错统计
grep "corrections.*applied" /tmp/speech-to-text-debug.log
```

### 5. 配置和状态问题

**症状：** 配置无法保存、状态不同步、偏好设置丢失

**调试步骤：**
```bash
# 查看配置管理日志
grep "Config" /tmp/speech-to-text-debug.log

# 检查偏好设置加载
grep "preferences" /tmp/speech-to-text-debug.log

# 查看状态同步
grep -E "sync|state|update" /tmp/speech-to-text-debug.log
```

## 性能分析

### 操作耗时统计
```bash
# 查看所有操作耗时
grep "duration" /tmp/speech-to-text-debug.log

# 分析录音处理时间
grep "recording.*duration" /tmp/speech-to-text-debug.log

# 查看 API 调用耗时
grep -E "api.*duration|request.*time" /tmp/speech-to-text-debug.log

# 统计平均响应时间
grep "duration" /tmp/speech-to-text-debug.log | grep -o '"duration":[0-9]*' | awk -F: '{sum+=$2; count++} END {print "Average:", sum/count "ms"}'
```

### 内存和资源使用
```bash
# 查看内存使用情况
grep -i "memory" /tmp/speech-to-text-debug.log

# 检查文件资源清理
grep -E "cleanup|delete|remove" /tmp/speech-to-text-debug.log

# 查看 WebSocket 连接数
grep -c "WebSocket.*connected" /tmp/speech-to-text-debug.log
```

## 故障排除流程

### 步骤 1：收集信息
1. 启用 Debug 模式：`npm run dev:debug`
2. 重现问题
3. 收集完整的日志文件

### 步骤 2：初步分析
```bash
# 快速查看最近的错误
tail -50 /tmp/speech-to-text-debug.log | grep -E "ERROR|WARN"

# 检查是否有崩溃信息
grep -E "crash|exception|fatal" /tmp/speech-to-text-debug.log

# 查看完整的会话流程
grep "session-id-[specific-id]" /tmp/speech-to-text-debug.log
```

### 步骤 3：深入诊断
根据问题类型使用上述专门的调试命令进行深入分析。

### 步骤 4：验证修复
1. 实施修复方案
2. 清理日志：删除 `/tmp/speech-to-text-debug.log`
3. 重新测试并观察日志

## 日志管理

### 自动清理机制
- Debug 模式启动时自动清空旧日志
- 正常模式不生成日志文件
- 临时音频文件自动删除（除非配置保留）

### 手动清理
```bash
# 清理日志文件
rm /tmp/speech-to-text-debug.log

# 清理临时音频文件
rm /tmp/recording-*.wav

# 查看临时文件占用空间
du -sh /tmp/speech-to-text-debug.log /tmp/recording-*.wav 2>/dev/null
```

## 日志安全性

**注意事项：**
- 日志文件可能包含 API 调用细节，但已自动脱敏处理
- 不会记录完整的 API 密钥或敏感信息
- 音频内容不会被记录到日志中
- 建议定期清理 debug 日志以保护隐私