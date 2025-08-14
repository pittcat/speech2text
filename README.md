# Raycast Speech to Text Plugin

一个功能强大的 Raycast 语音转文字插件，使用豆包（火山引擎）进行语音识别，集成 DeepSeek 提供文本润色功能，并新增 Vibe Coding 智能编程术语纠错功能。

## 功能特点

- 🎙️ **实时语音录制** - 使用 Sox 高质量录音，16kHz 采样率
- 🤖 **豆包语音识别** - 优秀的中文识别能力，支持实时流式识别
- ✨ **DeepSeek 文本润色** - 智能优化转写结果，支持多种润色任务
- 🔧 **Vibe Coding 术语纠错** - 智能识别和纠正编程术语的语音识别错误
- 🌐 **多语言支持** - 自动检测或手动选择语言（支持中、英、日、韩等11种语言）
- 📝 **智能转写** - 支持自定义提示词和专业术语
- 📋 **历史记录** - 保存和管理所有转写记录
- 🔄 **重新转写** - 使用不同设置重新处理音频
- 📊 **统计分析** - 查看使用统计和趋势
- 💾 **统一配置管理** - 一键保存所有API配置，避免重复输入
- 🎨 **稳定UI体验** - 固定布局设计，消除页面抖动
- 🎯 **智能提示词管理** - 内置多种场景提示词，支持自定义扩展

## 安装

### 系统要求

- macOS 10.15+ 
- [Raycast](https://raycast.com/) 1.50.0+
- [Sox](https://sox.sourceforge.net/) 音频处理工具

### 安装Sox
```bash
# 使用 Homebrew 安装 Sox
brew install sox
```

### 插件安装

1. 克隆仓库到本地
2. 进入插件目录：`cd speech-to-text`
3. 安装依赖：`npm install`
4. 构建插件：`npm run build`
5. 导入到 Raycast：`npm run publish`

## 开发和调试

### 开发命令

```bash
# 正常开发模式（无调试日志）
npm run dev

# Debug模式（生成详细调试日志）
npm run dev:debug

# 构建生产版本
npm run build

# 代码检查和修复
npm run lint
npm run fix-lint
```

### 统一配置管理

插件现在支持统一的API配置管理：

- **一键保存**: 使用 `Cmd+Shift+S` 或 Actions 面板的"💾 保存API配置"
- **智能检测**: 自动保存所有填写完整的配置（Doubao + DeepSeek）
- **状态提示**: 清晰显示保存结果和数量
- **安全存储**: 配置保存后隐藏表单，避免密码泄露

## 配置

### 豆包 API 配置
1. 访问[火山引擎控制台](https://console.volcengine.com)
2. 创建语音识别应用，获取：
   - App Key（应用密钥）
   - Access Token（访问令牌）
   - Secret Key（密钥）
3. 在插件界面或 Raycast 偏好设置中配置

### DeepSeek API 配置（可选 - 用于文本润色）
1. 访问 [DeepSeek Console](https://platform.deepseek.com)
2. 获取 API Key
3. 在插件界面或 Raycast 偏好设置中配置
4. 启用 "Enable Text Polishing" 功能
5. 支持的模型：
   - deepseek-chat（推荐，通用对话模型）
   - deepseek-coder（代码专用模型）

## 使用方法

### 录音和转写
1. 打开 Raycast，搜索 "Record Transcription"
2. 按 `⌘+R` 或点击 "Start Recording" 开始录音
3. 按 `Enter` 停止录音
4. 自动进行语音识别
5. 可选择进行 DeepSeek 文本润色处理
6. 结果自动复制到剪贴板并保存到历史记录

### 文本润色功能
录制完成后，可以选择不同的润色任务：
- **润色** - 提升文本通顺度和可读性
- **改写** - 使用不同表达方式重写内容
- **纠错** - 修正语法和拼写错误
- **翻译** - 翻译到其他语言
- **扩写** - 添加更多细节和描述
- **缩写** - 提取关键要点
- **学术润色** - 学术写作风格优化
- **Vibe Coding** - 智能编程术语纠错

### Vibe Coding 功能
专门针对编程内容的智能纠错：
- 自动检测编程相关内容
- 纠正常见的编程术语语音识别错误
- 支持主流编程语言、框架、工具名称纠错
- 处理中英文混合的技术文档

### 查看历史记录
1. 打开 Raycast，搜索 "Transcription History"
2. 浏览所有转写记录
3. 支持搜索、重新转写、导出等操作

### 快捷键

**录音界面：**
- `⌘+R` - 开始/停止录音
- `⌘+C` - 复制转写结果
- `⌘+H` - 查看历史记录
- `⌘+Shift+S` - 保存API配置

**历史记录界面：**
- `⌘+C` - 复制文本
- `⌘+O` - 查看详情
- `⌘+R` - 重新转写
- `⌘+Delete` - 删除记录
- `⌘+S` - 查看统计
- `⌘+Shift+E` - 导出历史

**日志界面：**
- `⌘+R` - 刷新日志
- `⌘+C` - 复制选中日志
- `⌘+Shift+C` - 清理日志

## 高级功能

### 智能提示词管理
插件内置多种场景化提示词模板：
- **通用润色** - 提升整体文本质量
- **技术文档** - 专业技术内容优化
- **商务邮件** - 正式商务沟通
- **学术写作** - 学术论文风格
- **随意交流** - 日常对话风格
- **正式文档** - 官方文档写作
- **简洁表达** - 精简内容表述
- **详细说明** - 扩展内容描述
- **代码注释** - 代码相关说明
- **技术翻译** - 技术术语翻译
- **Vibe Coding** - 编程术语智能纠错

### 自定义提示词
支持添加和管理自定义提示词：
- 可以基于内置模板修改
- 支持保存和复用
- 动态加载到润色选项中

### 专业术语
在 "Custom Terms" 中输入专业术语，用逗号分隔：
```
React.js, TypeScript, GraphQL, Kubernetes, WebSocket, API
```

### 上下文识别
启用 "Use highlighted text as context" 后，插件会自动使用你在其他应用中高亮的文本作为上下文，提高识别准确度。

### 音频文件管理
- **自动清理** - 默认转录后自动删除音频文件节省空间
- **保留音频** - 可选择保留原始音频文件
- **自定义路径** - 支持自定义音频文件保存位置

## 技术架构

### 核心技术栈
- **前端框架**: React + TypeScript + Raycast API
- **音频录制**: Sox 命令行工具 (16kHz, 16-bit, mono WAV)
- **WebSocket**: 自定义二进制协议实现（豆包 API）
- **HTTP客户端**: REST API 调用（DeepSeek API）
- **存储**: 本地文件系统 + LocalStorage

### API 集成架构
- **豆包语音识别**: WebSocket 流式语音识别 API
  - 实时二进制音频流传输
  - 复杂帧结构处理和认证机制
  - 支持多语言识别和实时结果返回
- **DeepSeek 文本处理**: REST API 文本处理
  - HTTP POST 请求方式
  - 支持多种文本处理任务
  - 灵活的模型选择（chat/coder）

### 智能处理模块
- **编程术语纠错引擎**: `programming-terms-corrector.ts`
  - 拼音/发音错误映射表
  - 大小写规范化处理
  - 常见模式错误修正
  - 支持自定义词典扩展
- **提示词管理系统**: `prompt-manager.ts`
  - 内置场景化模板
  - 自定义提示词支持
  - 动态加载和验证机制

## 调试和故障排除

### 🔍 启用调试日志

**开发者调试:**
1. 在 Raycast 中打开插件设置 (⌘+,)
2. 找到 "Enable Debug Logging" 并勾选
3. 设置合适的日志级别：
   - `TRACE` - 最详细的调试信息（开发推荐）
   - `DEBUG` - 调试信息
   - `INFO` - 一般信息
   - `WARN` - 警告信息
   - `ERROR` - 仅错误信息
4. 配置日志输出：
   - `Log to File` - 保存到日志文件（推荐）
   - `Log to Console` - 在控制台显示

### Debug模式详解

**开启Debug模式:**
```bash
# 正常开发（无日志文件）
npm run dev

# Debug开发（生成详细调试日志）
npm run dev:debug
```

**日志文件位置:**
```bash
# Debug模式下的固定日志文件（仅在debug模式下生成）
/tmp/speech-to-text-debug.log
```

**特点:**
- ✅ **按需生成**: 只有debug模式才会创建日志文件
- ✅ **固定路径**: 日志文件路径固定，便于查找
- ✅ **自动清理**: 每次启动debug模式自动清空旧日志
- ✅ **详细记录**: 包含完整的启动信息、配置状态、API调用等

**查看日志的方法:**
1. **插件内查看**: 在 Raycast 中搜索 "View Plugin Logs"
2. **文件查看**: 直接打开 `/tmp/speech-to-text-debug.log`
3. **实时监控**: `tail -f /tmp/speech-to-text-debug.log`
4. **快速检查**: `head -20 /tmp/speech-to-text-debug.log`

### 📊 日志级别说明

| 级别 | 用途 | 建议场景 |
|------|------|----------|
| TRACE | 最详细的程序执行流程 | 开发和深度调试 |
| DEBUG | 调试信息和变量状态 | 功能开发和测试 |
| INFO | 一般操作信息 | 生产环境监控 |
| WARN | 警告信息，程序可继续 | 问题预警 |
| ERROR | 错误信息，功能可能失败 | 错误追踪 |

### 🚀 性能优化

**生产环境配置:**
- 关闭 "Enable Debug Logging" 以提高性能
- 或设置日志级别为 `ERROR` 仅记录错误

**开发环境配置:**
- 启用所有日志选项
- 使用 `TRACE` 或 `DEBUG` 级别

### 🐛 常见问题诊断

#### 录音无声音
**检查步骤:**
1. 启用 `DEBUG` 级别日志
2. 尝试录音，查看日志中的音频设备信息
3. 检查系统麦克风权限
4. 确保 Sox 已安装：`brew install sox`

**相关日志关键词:**
- `AudioRecorder` - 录音相关
- `Sox` - 音频处理
- `permission` - 权限问题

#### 豆包连接失败
**检查步骤:**
1. 启用 `DEBUG` 级别日志
2. 查看 `DoubaoClient` 相关日志
3. 检查 API 凭证配置
4. 验证网络连接

**相关日志关键词:**
- `DoubaoClient` - 豆包客户端
- `WebSocket` - 连接状态
- `Authentication` - 认证问题
- `Config` - 配置相关

#### DeepSeek 文本润色失败
**检查步骤:**
1. 启用 `DEBUG` 级别日志  
2. 查看 `DeepSeekClient` 相关日志
3. 验证 API Key 有效性
4. 检查配额限制和网络连接

**相关日志关键词:**
- `DeepSeekClient` - DeepSeek 客户端
- `Polish` - 文本润色相关
- `API` - API 调用
- `quota` - 配额问题
- `rate limit` - 请求限制

### 📝 调试最佳实践

**1. 分步调试:**
```bash
# 1. 启用日志
设置 -> Enable Debug Logging = true
设置 -> Log Level = DEBUG

# 2. 重现问题
执行出现问题的操作

# 3. 查看日志
在 Raycast 中运行 "View Plugin Logs"

# 4. 搜索关键信息
根据问题类型搜索相关组件日志
```

**2. 日志分析技巧:**
- 按时间戳追踪问题发生的准确时间
- 查找 `ERROR` 和 `WARN` 级别的消息
- 关注会话ID相同的日志条目
- 检查网络请求的响应状态

**3. 报告问题时:**
- 提供完整的错误日志片段
- 说明复现步骤
- 包含环境信息（macOS版本、Raycast版本等）

### 🔧 故障排除

#### 录音问题
- 检查系统麦克风权限
- 确保 Sox 已正确安装：`brew install sox`
- 查看音频录制相关日志

#### API 连接问题  
- 检查 API 凭证是否正确
- 确保网络连接正常
- 查看认证和连接相关日志

#### 性能问题
- 在生产环境关闭详细日志
- 检查日志文件大小，必要时清理
- 使用合适的日志级别

## 开发

### 目录结构
```
speech-to-text/
├── src/
│   ├── record-transcription.tsx         # 主录音界面
│   ├── transcription-history.tsx        # 历史记录界面
│   ├── view-logs.tsx                   # 日志查看界面
│   ├── components/                     # UI组件目录
│   ├── hooks/
│   │   └── useAudioRecorder.ts         # 录音 Hook
│   ├── utils/
│   │   ├── ai/
│   │   │   ├── transcription.ts        # 转写核心逻辑
│   │   │   ├── doubao-client.ts        # 豆包语音识别客户端
│   │   │   └── deepseek-client.ts      # DeepSeek 文本润色客户端
│   │   ├── audio/                      # 音频处理目录
│   │   ├── audio.ts                    # 音频工具函数
│   │   ├── history.ts                  # 历史记录管理
│   │   ├── formatting.ts               # 格式化工具
│   │   ├── config.ts                   # 配置管理
│   │   ├── logger.ts                   # 日志系统
│   │   ├── prompt-manager.ts           # 提示词管理
│   │   ├── programming-dictionary.ts    # 编程词典
│   │   └── programming-terms-corrector.ts # 编程术语纠错引擎
│   ├── types.ts                        # 类型定义
│   └── constants.ts                    # 常量定义
├── test-doubao-client.js               # 豆包API测试脚本
├── package.json                        # 项目配置和依赖
├── tsconfig.json                       # TypeScript配置
├── CLAUDE.md                          # Claude代码助手指南
├── DEVELOPMENT.md                     # 开发指南
├── DEBUG-GUIDE.md                     # 调试指南
└── README.md                          # 项目说明文档
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
