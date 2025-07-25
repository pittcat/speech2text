# Raycast 插件加载流程详解

## 开发模式 (`npm run dev`)

```
你的插件目录                    Raycast 进程
    |                              |
    |  1. npm run dev              |
    |  ↓                           |
    |  ray develop 命令             |
    |  ↓                           |
    |  编译 TypeScript → JS        |
    |  ↓                           |
    |  启动开发服务器               |
    |  (监听文件变化)               |
    |  ↓                           |
    |  通过 IPC 通知 --------→     接收开发插件信息
    |                              ↓
    |                              动态注册插件命令
    |                              ↓
    |                              在搜索中显示:
    |                              - Record Transcription
    |                              - Transcription History
    |                              |
    |  ←------- 用户选择命令 -------
    |  ↓
    |  执行编译后的 JS 代码
    |  ↓
    |  返回 React 组件
    |  --------→                   渲染 UI
```

## 生产模式（已发布的插件）

```
Raycast Store                  你的电脑
    |                              |
    |  用户点击安装                 |
    |  --------→                   下载插件包
    |                              ↓
    |                              解压到:
    |                              ~/Library/Application Support/
    |                              com.raycast.macos/extensions/
    |                              {extension-id}/
    |                              ↓
    |                              Raycast 启动时扫描
    |                              ↓
    |                              加载所有已安装插件
```

## 手动加载（Import Extension）

```
你的插件目录                    Raycast
    |                              |
    |  构建插件 (npm run build)    |
    |  ↓                           |
    |  生成 dist/ 目录             |
    |                              |
    |                              用户: Import Extension
    |  ←------- 选择插件目录 -------
    |                              ↓
    |                              复制到扩展目录
    |                              ↓
    |                              重新加载插件列表
```

## 关键文件和目录

### 1. 插件源码（开发时）
```
/Users/pittcat/Dev/Python/voice2text/speech-to-text/
├── src/                    # TypeScript 源码
├── package.json           # 插件元数据
└── dist/                  # 编译后的 JS（自动生成）
```

### 2. Raycast 扩展目录（安装后）
```
~/Library/Application Support/com.raycast.macos/extensions/
├── {extension-id}/        # 每个插件一个 UUID 目录
│   ├── package.json
│   ├── dist/             # 编译后的代码
│   └── assets/           # 图标等资源
```

### 3. 开发服务器通信
```
/tmp/raycast-dev-extensions/
└── speech-to-text.sock    # Unix socket 文件（IPC 通信）
```

## 实际查看加载过程

### 查看 Raycast 是否识别到你的插件：

1. **开发模式下**
   - 运行 `npm run dev` 后
   - 打开 Raycast
   - 输入插件命令名称的一部分，如 "record"
   - 应该能看到 "Record Transcription"

2. **查看 Raycast 日志**
   ```bash
   # 查看 Raycast 日志
   log show --predicate 'process == "Raycast"' --last 5m
   ```

3. **调试开发服务器**
   ```bash
   # 查看 ray 命令的输出
   npm run dev -- --verbose
   ```

## 为什么这样设计？

1. **开发效率**：无需每次都安装，改代码后立即生效
2. **隔离性**：开发插件不影响已安装的插件
3. **安全性**：用户明确知道在运行什么代码
4. **灵活性**：支持多种加载方式

## 常见问题

### Q: 为什么 `npm run dev` 后还是看不到插件？
A: 
- 确保 Raycast 正在运行
- 检查是否有编译错误
- 尝试重启 Raycast

### Q: 开发模式和生产模式有什么区别？
A:
- 开发模式：实时重载，有调试信息
- 生产模式：优化过的代码，更快的加载速度