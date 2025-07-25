# Raycast Speech to Text Plugin

一个功能强大的 Raycast 语音转文字插件，支持豆包（火山引擎）和 Groq (Whisper) 两种 AI 服务。

## 功能特点

- 🎙️ **实时语音录制** - 使用 Sox 高质量录音
- 🤖 **双 AI 引擎支持**
  - **豆包大模型** - 优秀的中文识别能力，支持实时流式识别
  - **Groq Whisper** - 快速准确的多语言识别
- 🌐 **多语言支持** - 自动检测或手动选择语言
- 📝 **智能转写** - 支持自定义提示词和专业术语
- 📋 **历史记录** - 保存和管理所有转写记录
- 🔄 **重新转写** - 使用不同设置重新处理音频
- 📊 **统计分析** - 查看使用统计和趋势

## 安装

1. 克隆仓库到本地
2. 进入插件目录：`cd speech-to-text`
3. 安装依赖：`npm install`
4. 构建插件：`npm run build`
5. 导入到 Raycast：`npm run publish`

## 配置

### 豆包 API 配置
1. 访问[火山引擎控制台](https://console.volcengine.com)
2. 创建语音识别应用，获取：
   - App Key
   - Access Token
3. 在 Raycast 偏好设置中配置

### Groq API 配置
1. 访问 [Groq Console](https://console.groq.com)
2. 获取 API Key
3. 在 Raycast 偏好设置中配置

## 使用方法

### 录音和转写
1. 打开 Raycast，搜索 "Record Transcription"
2. 按 `⌘+R` 或点击 "Start Recording" 开始录音
3. 按 `Enter` 停止录音
4. 自动进行语音识别并复制到剪贴板

### 查看历史记录
1. 打开 Raycast，搜索 "Transcription History"
2. 浏览所有转写记录
3. 支持搜索、重新转写、导出等操作

### 快捷键

**录音界面：**
- `⌘+R` - 开始/停止录音
- `⌘+C` - 复制转写结果
- `⌘+H` - 查看历史记录

**历史记录界面：**
- `⌘+C` - 复制文本
- `⌘+O` - 查看详情
- `⌘+R` - 重新转写
- `⌘+Delete` - 删除记录
- `⌘+S` - 查看统计
- `⌘+Shift+E` - 导出历史

## 高级功能

### 自定义提示词
在 "Custom Prompt" 中输入指导 AI 的提示词，例如：
- "保持准确的标点符号和段落结构"
- "格式化数字、货币和单位"
- "识别多个说话人"

### 专业术语
在 "Custom Terms" 中输入专业术语，用逗号分隔：
```
React.js, TypeScript, GraphQL, Kubernetes
```

### 上下文识别
启用 "Use highlighted text as context" 后，插件会自动使用你在其他应用中高亮的文本作为上下文，提高识别准确度。

## 技术架构

- **前端框架**: React + TypeScript
- **音频录制**: Sox 命令行工具
- **WebSocket**: 自定义二进制协议实现
- **存储**: 本地文件系统
- **API 集成**: 
  - 豆包: WebSocket 流式 API
  - Groq: REST API

## 故障排除

### 录音无声音
- 检查系统麦克风权限
- 确保 Sox 已正确安装：`brew install sox`

### 豆包连接失败
- 检查 API 凭证是否正确
- 确保网络连接正常
- 查看日志了解详细错误信息

### Groq 转写失败
- 验证 API Key 有效性
- 检查是否超出配额限制

## 开发

### 目录结构
```
speech-to-text/
├── src/
│   ├── record-transcription.tsx    # 主录音界面
│   ├── transcription-history.tsx   # 历史记录界面
│   ├── hooks/
│   │   └── useAudioRecorder.ts    # 录音 Hook
│   ├── utils/
│   │   ├── ai/
│   │   │   ├── transcription.ts   # AI 转写核心
│   │   │   └── doubao-client.ts   # 豆包客户端
│   │   ├── audio.ts               # 音频处理
│   │   ├── history.ts             # 历史记录管理
│   │   └── formatting.ts          # 格式化工具
│   ├── types.ts                   # 类型定义
│   └── constants.ts               # 常量定义
├── package.json
└── tsconfig.json
```

### 本地开发
```bash
# 开发模式
npm run dev

# 代码检查
npm run lint

# 构建
npm run build
```

## License

MIT