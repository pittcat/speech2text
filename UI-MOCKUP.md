## 编程术语纠错功能界面示意

### 1. 录音界面中的新润色选项

```
┌─ Speech to Text - Press Cmd+R to start ─────────────────┐
│                                                         │
│ 🎙️ Recording Status: Ready to record                    │
│                                                         │
│ ⚙️ Settings:                                            │
│   Language: [Auto-detect ▼]                            │
│   Custom Terms: React.js, TypeScript, MySQL, AWS       │
│   Use highlighted text: ☑️                             │
│                                                         │
│ 📝 Polishing Task:                                      │
│   ○ 润色 - Polish text                                 │
│   ○ 改写 - Rewrite                                     │
│   ● 编程术语纠错 - Programming terms correction         │
│   ○ 代码讨论润色 - Code review polishing               │
│   ○ API文档规范 - API documentation                    │
│                                                         │
│ 📋 Last Transcription:                                  │
│   "我们使用JavaScript和MySQL开发Web应用，部署到AWS..."   │
│                                                         │
│ 🎯 Actions:                                             │
│   [🎤 Start Recording] [📝 Polish Text] [📚 History]   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 2. 配置界面中的编程术语设置

```
┌─ Raycast Preferences - Speech to Text ─────────────────┐
│                                                         │
│ 📋 Custom Terms                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ React.js, TypeScript, GraphQL, Docker, Kubernetes, │ │
│ │ PostgreSQL, Redis, AWS, GitHub Actions             │ │
│ └─────────────────────────────────────────────────────┘ │
│ Enter specialized terms for better accuracy             │
│                                                         │
│ 🎯 Default Polishing Task                               │
│ [编程术语纠错 - Programming terms correction ▼]         │
│                                                         │
│ ✨ Enable Text Polishing: ☑️                           │
│                                                         │
│ 🔧 DeepSeek Configuration                               │
│ API Key: [sk-***************************]               │
│ Model: [deepseek-chat ▼]                               │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 3. 纠错过程演示

```
🎤 语音输入:
"我们使用java script和react开发前端，数据库用my sql"

⬇️  豆包语音识别

📝 初始转录:
"我们使用java script和react开发前端，数据库用my sql"

⬇️  编程术语检测 ✅ (检测到: java script, react, my sql)

⬇️  预处理纠错映射

📝 映射纠错后:
"我们使用JavaScript和React开发前端，数据库用MySQL"

⬇️  DeepSeek 润色处理 (集成用户术语 + 编程上下文)

✅ 最终结果:
"我们使用JavaScript和React开发前端，数据库用MySQL"

📋 复制到剪贴板
```

### 4. 支持的纠错示例

| 语音识别结果 | 自动纠错后 | 说明 |
|-------------|-----------|------|
| java script | JavaScript | 编程语言名称 |
| type script | TypeScript | 编程语言名称 |
| my sql | MySQL | 数据库名称 |
| postgre sql | PostgreSQL | 数据库名称 |
| mongo db | MongoDB | 数据库名称 |
| vs code | VS Code | 开发工具 |
| git hub | GitHub | 代码托管平台 |
| docker | Docker | 容器技术 |
| kubernetes | Kubernetes | 容器编排 |
| aws | AWS | 云平台 |

### 5. 润色任务选择界面

```
┌─ Select Polishing Task ─────────────────────────────────┐
│                                                         │
│ ○ 润色 - General text polishing                        │
│ ○ 改写 - Rewrite with different expressions            │
│ ○ 纠错 - Fix grammar and spelling errors               │
│ ● 编程术语纠错 - Programming terms correction           │
│   └─ 🔧 专门纠正编程相关术语错误                        │
│                                                         │
│ ○ 代码讨论润色 - Code review polishing                 │
│   └─ 💬 适用于技术讨论和代码评审                        │
│                                                         │
│ ○ API文档规范 - API documentation formatting           │
│   └─ 📋 整理为标准API文档格式                          │
│                                                         │
│ ○ 学术润色 - Academic style polishing                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```