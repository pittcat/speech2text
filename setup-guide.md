# Speech to Text 插件设置指南

## 步骤 1：打开插件
1. 打开 Raycast（⌘+空格）
2. 输入 "Record Transcription"
3. 按 Enter 打开插件

## 步骤 2：打开设置
按 `⌘+,`（Command + 逗号）打开设置

## 步骤 3：填写配置

你会看到以下设置界面：

```
┌─────────────────────────────────────────────┐
│ Speech to Text Preferences                  │
├─────────────────────────────────────────────┤
│                                             │
│ AI Provider         [Doubao (豆包)    ▼]    │
│                                             │
│ Doubao App Key      [2099456436          ]  │
│                                             │
│ Doubao Access Token [••••••••••••••••••••]  │
│                     Y4muRvrXyAZuqQODGCidZ1mZCxVqQ2sn
│                                             │
│ Language            [Auto Detect      ▼]    │
│                                             │
│ ☑ Save audio files                          │
│                                             │
└─────────────────────────────────────────────┘
```

## 凭证信息（从 voice2text.py 获取）

- **App Key (app_id)**: `2099456436`
- **Access Token**: `Y4muRvrXyAZuqQODGCidZ1mZCxVqQ2sn`
- **Secret Key**: `AH7V1Ekewr4OJTWIkFXJZDFAoY4lZIe5` （当前版本未使用）

## 步骤 4：保存设置
填写完成后，设置会自动保存。

## 步骤 5：开始使用
1. 按 `⌘+R` 开始录音
2. 再次按 Enter 停止录音
3. 等待语音识别结果

## 故障排除

### 看不到设置选项？
- 确保 `npm run dev` 正在运行
- 重启 Raycast：`⌘+Q` 然后重新打开

### 设置没有保存？
- 检查是否有权限问题
- 查看 Raycast 日志：
  ```bash
  tail -f ~/Library/Logs/com.raycast.macos/Raycast.log
  ```

### API 认证失败？
- 确认凭证信息正确
- 检查网络连接
- 查看插件日志（在开发模式控制台）