# 语音转文本插件详细设计文档

## 项目概述

这是一个为 Raycast 平台开发的语音转文本插件，支持多种 AI 服务提供商（目前主要支持豆包 Doubao），具备音频录制、实时转录、历史管理、文本润色等功能。插件采用现代化的 TypeScript + React 技术栈，遵循 Raycast 扩展开发规范。

### 核心特性
- 🎙️ 高质量音频录制（16kHz，16位，单声道）
- 🔄 实时语音转文本（支持豆包 WebSocket 流式 API）
- 🌐 多语言支持（自动检测 + 11种语言）
- ✨ AI 文本润色（基于 DeepSeek API）
- 📝 转录历史管理
- 🔧 丰富的配置选项
- 🐛 内置调试日志系统

## 整体架构

### 1. 架构分层

```
┌─────────────────────────┐
│    Raycast UI Layer     │ ← React 组件层
├─────────────────────────┤
│   Business Logic Layer  │ ← 业务逻辑层
├─────────────────────────┤
│    Service Layer        │ ← AI 服务集成层
├─────────────────────────┤
│    Utility Layer        │ ← 工具函数层
├─────────────────────────┤
│   System Integration    │ ← 系统集成层
└─────────────────────────┘
```

### 2. 核心模块组织

#### 用户界面层 (`src/`)
- `record-transcription.tsx` - 主录制界面
- `transcription-history.tsx` - 历史记录管理
- `view-logs.tsx` - 调试日志查看器

#### 业务逻辑层 (`src/hooks/`)
- `useAudioRecorder.ts` - 音频录制业务逻辑

#### 服务集成层 (`src/utils/ai/`)
- `transcription.ts` - 转录服务协调器
- `doubao-client.ts` - 豆包 WebSocket 客户端
- `deepseek-client.ts` - DeepSeek API 客户端

#### 工具层 (`src/utils/`)
- `config.ts` - 配置管理
- `history.ts` - 历史记录管理
- `logger.ts` - 结构化日志系统
- `formatting.ts` - 文本格式化工具
- `prompt-manager.ts` - 提示词管理

#### 系统集成层 (`src/utils/audio/`)
- `audio.ts` - 音频处理工具

## 详细模块设计

### 音频录制系统

#### 录制参数配置
```typescript
export const AUDIO_CONFIG = {
  SAMPLE_RATE: 16000,    // 采样率
  CHANNELS: 1,           // 单声道
  BIT_DEPTH: 16,         // 16位深度
  FORMAT: "wav",         // WAV 格式
  CHUNK_SIZE: 1024,      // 数据块大小
  SEGMENT_DURATION: 200, // 分段时长（毫秒）
} as const;
```

#### Sox 命令行集成
使用 Sox 工具进行高质量音频录制：
```typescript
export const SOX_COMMAND = [
  "/opt/homebrew/bin/sox",
  "-q",                    // 静默模式
  "-t", "coreaudio",       // CoreAudio 输入
  "default",               // 默认音频设备
  "-b", "16",              // 16位深度
  "-c", "1",               // 单声道
  "-r", "16000",           // 16kHz 采样率
  "-e", "signed-integer",  // 有符号整数编码
  "-t", "wav",             // WAV 输出格式
] as const;
```

### AI 服务集成

#### 1. 豆包 (Doubao) WebSocket 客户端

**连接配置**
- WebSocket URL: `wss://openspeech.bytedance.com/api/v3/sauc/bigmodel_async`
- 协议: 二进制流式协议
- 认证: App ID + Access Token + Secret Key

**消息帧结构**
```typescript
interface DoubaoFrame {
  sequence: number;      // 帧序列号
  type: 'audio' | 'end'; // 帧类型
  data: Buffer;          // 音频数据
  timestamp: number;     // 时间戳
}
```

**连接生命周期**
1. 建立 WebSocket 连接
2. 发送认证帧
3. 流式发送音频数据帧
4. 发送结束帧
5. 接收转录结果
6. 关闭连接

#### 2. DeepSeek 文本润色客户端

**API 配置**
- 基础 URL: `https://api.deepseek.com/v1`
- 支持模型: `deepseek-chat`, `deepseek-coder`
- 认证: Bearer Token

**润色任务类型**
```typescript
export type TextProcessingTask = 
  | "润色"      // 基础润色
  | "改写"      // 重新表达
  | "纠错"      // 语法纠错
  | "翻译"      // 语言翻译
  | "扩写"      // 内容扩展
  | "缩写"      // 内容精简
  | "学术润色"; // 学术风格
```

### 配置管理系统

#### 配置接口设计
```typescript
export interface TranscriptionPreferences {
  // AI 服务配置
  aiProvider: "doubao";
  doubaoAppKey?: string;
  doubaoAccessToken?: string;
  doubaoSecretKey?: string;
  
  // DeepSeek 配置
  deepseekApiKey?: string;
  deepseekModel?: string;
  deepseekBaseUrl?: string;
  
  // 功能配置
  language?: string;
  enableContext?: boolean;
  enablePolishing?: boolean;
  
  // 润色配置
  polishPrompt?: string;
  polishingTask?: string;
  
  // 转录配置
  promptText?: string;
  userTerms?: string;
  saveAudioFiles?: boolean;
}
```

#### 预设提示词系统
支持 8 种预设润色风格：
- **通用润色**: 基础文本优化
- **技术文档**: 专业技术表达
- **商务正式**: 商业场合用语
- **学术论文**: 学术写作风格
- **轻松易懂**: 日常交流表达
- **正式礼貌**: 正式场合用语
- **精简版本**: 去除冗余表达
- **详细展开**: 丰富内容细节

### 数据存储系统

#### 历史记录结构
```typescript
export interface TranscriptionResult {
  text: string;              // 转录文本
  timestamp: number;         // 时间戳
  audioFilePath?: string;    // 音频文件路径
  metadata?: {
    provider?: string;       // AI 服务提供商
    model?: string;          // 使用的模型
    language?: string;       // 检测到的语言
    duration?: number;       // 录制时长
  };
}
```

#### 润色记录结构
```typescript
export interface PolishingResult {
  originalText: string;      // 原始文本
  polishedText: string;      // 润色后文本
  task: string;             // 润色任务类型
  model: string;            // 使用的模型
  timestamp: number;        // 处理时间
  metadata?: {
    temperature?: number;    // 模型温度参数
    maxTokens?: number;      // 最大令牌数
    usage?: {               // 使用统计
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}
```

### 日志系统设计

#### 日志级别
- `DEBUG`: 详细调试信息
- `INFO`: 一般信息记录
- `WARN`: 警告信息
- `ERROR`: 错误信息

#### 日志格式
```typescript
interface LogEntry {
  timestamp: string;        // ISO 时间戳
  level: LogLevel;         // 日志级别
  message: string;         // 日志消息
  context?: any;           // 上下文数据
  error?: Error;           // 错误对象
}
```

#### 自动日志清理
- 启动时自动清理旧日志
- 防止日志文件过大
- 保留最近的调试信息

## 用户交互流程

### 1. 语音转录流程

```
用户点击录制 → 初始化音频录制 → 实时显示录制状态 → 
停止录制 → 调用 AI 转录服务 → 显示转录结果 → 
保存到历史记录 → 可选择进行文本润色
```

### 2. 文本润色流程

```
选择转录文本 → 选择润色任务类型 → 可选自定义提示词 → 
调用 DeepSeek API → 显示润色结果 → 对比原文和润色文本 → 
保存润色记录
```

### 3. 历史管理流程

```
查看历史列表 → 搜索/筛选记录 → 查看详细内容 → 
复制文本 → 重新润色 → 导出记录 → 删除记录
```

## 错误处理策略

### 1. 音频录制错误
- Sox 命令不存在或失败
- 音频设备权限问题
- 磁盘空间不足

### 2. AI 服务错误
- 网络连接问题
- API 认证失败
- 服务配额超限
- 服务不可用

### 3. 用户界面错误
- 配置参数无效
- 文件读写权限问题
- 内存不足

### 错误恢复机制
- 自动重试机制
- 降级服务选择
- 用户友好的错误提示
- 详细的错误日志记录

## 性能优化

### 1. 音频处理优化
- 流式音频处理，避免大文件加载
- 音频文件自动清理，节省存储空间
- 合理的音频参数配置，平衡质量和性能

### 2. AI 服务优化
- WebSocket 连接复用
- 请求超时控制
- 结果缓存机制

### 3. UI 响应优化
- 异步操作避免界面阻塞
- 加载状态指示
- 进度条显示

## 安全考虑

### 1. 敏感信息保护
- API 密钥加密存储
- 本地音频文件安全清理
- 网络传输加密

### 2. 权限控制
- 音频录制权限申请
- 文件系统访问权限
- 网络访问权限

### 3. 数据隐私
- 音频数据本地处理
- 可选的音频文件保存
- 用户数据不上传云端

## 扩展性设计

### 1. AI 服务扩展
- 插件化的 AI 服务架构
- 统一的服务接口定义
- 简化新服务集成流程

### 2. 语言支持扩展
- 可配置的语言列表
- 本地化资源管理
- 多语言界面支持

### 3. 功能模块扩展
- 组件化的功能设计
- 松耦合的模块架构
- 可插拔的功能组件

## 开发和测试

### 开发环境
- Node.js + TypeScript
- React + Raycast API
- ESLint + Prettier 代码规范

### 测试策略
- 手动测试为主
- 单独的 API 测试脚本
- 内置的调试日志系统

### 部署发布
- Raycast Store 发布流程
- 版本管理和更新策略
- 用户反馈收集机制

## 架构图表

### 1. 整体系统架构图

```mermaid
graph TB
    subgraph "Raycast Platform"
        UI[Raycast UI]
    end
    
    subgraph "Extension Core"
        subgraph "UI Components"
            REC[Record Transcription<br/>record-transcription.tsx]
            HIST[Transcription History<br/>transcription-history.tsx]
            LOGS[View Logs<br/>view-logs.tsx]
        end
        
        subgraph "Business Logic"
            HOOK[Audio Recorder Hook<br/>useAudioRecorder.ts]
            TRANS[Transcription Service<br/>transcription.ts]
        end
        
        subgraph "AI Services"
            DOUBAO[Doubao Client<br/>doubao-client.ts]
            DEEPSEEK[DeepSeek Client<br/>deepseek-client.ts]
        end
        
        subgraph "Utilities"
            CONFIG[Config Manager<br/>config.ts]
            HISTORY[History Manager<br/>history.ts]
            LOGGER[Logger<br/>logger.ts]
            PROMPT[Prompt Manager<br/>prompt-manager.ts]
            AUDIO[Audio Utils<br/>audio.ts]
        end
    end
    
    subgraph "External Services"
        DOUBAO_API[Doubao WebSocket API<br/>wss://openspeech.bytedance.com]
        DEEPSEEK_API[DeepSeek REST API<br/>https://api.deepseek.com]
    end
    
    subgraph "System Resources"
        SOX[Sox Audio Tool<br/>/opt/homebrew/bin/sox]
        FS[File System<br/>Audio Files & Logs]
        PREFS[Raycast Preferences<br/>Configuration Storage]
    end
    
    UI --> REC
    UI --> HIST
    UI --> LOGS
    
    REC --> HOOK
    REC --> TRANS
    HIST --> HISTORY
    LOGS --> LOGGER
    
    HOOK --> AUDIO
    HOOK --> SOX
    
    TRANS --> DOUBAO
    TRANS --> DEEPSEEK
    
    DOUBAO --> DOUBAO_API
    DEEPSEEK --> DEEPSEEK_API
    
    CONFIG --> PREFS
    HISTORY --> FS
    LOGGER --> FS
    AUDIO --> FS
```

### 2. 语音转录数据流图

```mermaid
sequenceDiagram
    participant User
    participant UI as Record UI
    participant Hook as Audio Hook
    participant Sox as Sox Tool
    participant Trans as Transcription Service
    participant Doubao as Doubao Client
    participant API as Doubao API
    participant Config as Config Manager
    participant History as History Manager
    
    User->>UI: 点击开始录制
    UI->>Hook: startRecording()
    Hook->>Config: getAudioConfig()
    Config-->>Hook: 音频配置参数
    Hook->>Sox: 启动 sox 录制命令
    Sox-->>Hook: 开始音频流
    
    loop 录制过程
        Sox->>Hook: 音频数据块
        Hook->>UI: 更新录制状态
        UI-->>User: 显示录制时间
    end
    
    User->>UI: 点击停止录制
    UI->>Hook: stopRecording()
    Hook->>Sox: 终止录制进程
    Hook->>Trans: transcribe(audioFile)
    
    Trans->>Config: getDoubaoConfig()
    Config-->>Trans: API 配置
    Trans->>Doubao: connect()
    Doubao->>API: WebSocket 连接
    API-->>Doubao: 连接确认
    
    Doubao->>API: 发送认证帧
    API-->>Doubao: 认证成功
    
    loop 音频数据传输
        Doubao->>API: 发送音频数据帧
        API-->>Doubao: 接收确认
    end
    
    Doubao->>API: 发送结束帧
    API-->>Doubao: 转录结果
    Doubao-->>Trans: 返回转录文本
    Trans-->>UI: 显示转录结果
    
    UI->>History: saveTranscription()
    History->>FS: 写入历史文件
    
    UI-->>User: 显示最终结果
```

### 3. 文本润色流程图

```mermaid
flowchart TD
    A[用户选择转录文本] --> B{是否启用润色功能?}
    B -->|否| END[结束]
    B -->|是| C[选择润色任务类型]
    
    C --> D{使用预设提示词?}
    D -->|是| E[从预设模板选择]
    D -->|否| F[输入自定义提示词]
    
    E --> G[构建润色请求]
    F --> G
    
    G --> H[调用 DeepSeek API]
    H --> I{API 调用成功?}
    
    I -->|否| J[显示错误信息]
    J --> K[记录错误日志]
    K --> END
    
    I -->|是| L[解析润色结果]
    L --> M[显示对比界面]
    M --> N[保存润色记录]
    N --> O[用户选择采用结果]
    O --> END
    
    style A fill:#e1f5fe
    style G fill:#fff3e0
    style H fill:#f3e5f5
    style M fill:#e8f5e8
    style J fill:#ffebee
```

### 4. 配置管理架构图

```mermaid
graph LR
    subgraph "User Interface"
        PREFS_UI[Raycast 偏好设置界面]
    end
    
    subgraph "Configuration System"
        CONFIG_MGR[Config Manager]
        VALIDATOR[配置验证器]
        DEFAULTS[默认配置]
    end
    
    subgraph "Storage Layer"
        RAYCAST_PREFS[Raycast Preferences API]
        ENV_VARS[环境变量]
    end
    
    subgraph "Configuration Categories"
        AI_CONFIG[AI 服务配置<br/>• Doubao 认证<br/>• DeepSeek API Key<br/>• 模型选择]
        AUDIO_CONFIG[音频配置<br/>• 采样率<br/>• 声道数<br/>• 格式设置]
        UI_CONFIG[界面配置<br/>• 语言选择<br/>• 主题设置<br/>• 快捷键]
        FEATURE_CONFIG[功能配置<br/>• 启用润色<br/>• 保存音频<br/>• 上下文感知]
    end
    
    PREFS_UI --> CONFIG_MGR
    CONFIG_MGR --> VALIDATOR
    VALIDATOR --> DEFAULTS
    
    CONFIG_MGR --> RAYCAST_PREFS
    CONFIG_MGR --> ENV_VARS
    
    CONFIG_MGR --> AI_CONFIG
    CONFIG_MGR --> AUDIO_CONFIG  
    CONFIG_MGR --> UI_CONFIG
    CONFIG_MGR --> FEATURE_CONFIG
```

### 5. 错误处理和日志系统图

```mermaid
graph TD
    subgraph "Error Sources"
        AUDIO_ERR[音频录制错误<br/>• Sox 命令失败<br/>• 设备权限<br/>• 磁盘空间]
        API_ERR[API 服务错误<br/>• 网络连接<br/>• 认证失败<br/>• 配额超限]
        CONFIG_ERR[配置错误<br/>• 参数无效<br/>• 文件权限<br/>• 环境问题]
    end
    
    subgraph "Error Handling"
        DETECTOR[错误检测器]
        CLASSIFIER[错误分类器]
        HANDLER[错误处理器]
    end
    
    subgraph "Recovery Strategies"
        RETRY[重试机制]
        FALLBACK[降级服务]
        USER_NOTIFY[用户通知]
    end
    
    subgraph "Logging System"
        LOGGER[结构化日志器]
        LOG_LEVELS[日志级别<br/>DEBUG|INFO|WARN|ERROR]
        LOG_FILE[日志文件<br/>speech-to-text-debug.log]
        LOG_VIEWER[日志查看器<br/>view-logs.tsx]
    end
    
    AUDIO_ERR --> DETECTOR
    API_ERR --> DETECTOR
    CONFIG_ERR --> DETECTOR
    
    DETECTOR --> CLASSIFIER
    CLASSIFIER --> HANDLER
    
    HANDLER --> RETRY
    HANDLER --> FALLBACK
    HANDLER --> USER_NOTIFY
    
    DETECTOR --> LOGGER
    CLASSIFIER --> LOGGER
    HANDLER --> LOGGER
    
    LOGGER --> LOG_LEVELS
    LOGGER --> LOG_FILE
    LOG_FILE --> LOG_VIEWER
```

### 6. 数据存储和历史管理图

```mermaid
erDiagram
    TRANSCRIPTION ||--o{ TRANSCRIPTION_RESULT : contains
    TRANSCRIPTION_RESULT ||--o| AUDIO_FILE : references
    TRANSCRIPTION_RESULT ||--o{ POLISHING_RESULT : "can have"
    
    TRANSCRIPTION {
        string id PK
        number timestamp
        string status
        object metadata
    }
    
    TRANSCRIPTION_RESULT {
        string id PK
        string text
        number timestamp
        string audioFilePath
        object metadata
    }
    
    AUDIO_FILE {
        string filePath PK
        number size
        number duration
        string format
        number sampleRate
    }
    
    POLISHING_RESULT {
        string id PK
        string originalText
        string polishedText
        string task
        string model
        number timestamp
        object metadata
    }
    
    CONFIG ||--o{ PRESET_PROMPT : includes
    CONFIG ||--o{ CUSTOM_PROMPT : includes
    
    CONFIG {
        string version PK
        object preferences
        array customPrompts
        number lastUpdated
    }
    
    PRESET_PROMPT {
        string key PK
        string name
        string prompt
        string description
        boolean isCustom
    }
    
    CUSTOM_PROMPT {
        string id PK
        string name
        string prompt
        number createdAt
        boolean isCustom
    }
```

这些图表全面展示了插件的架构设计、数据流、错误处理和存储结构，为开发和维护提供了清晰的技术指导。