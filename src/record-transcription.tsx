import React, { useState, useEffect } from "react";
import {
  Form,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  Clipboard,
  useNavigation,
  LocalStorage,
} from "@raycast/api";
import { useCachedState } from "@raycast/utils";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { transcribeAudio, getPreferences } from "./utils/ai/transcription";
import { addToHistory } from "./utils/history";
import { deleteAudioFile } from "./utils/audio";
import {
  TranscriptionPreferences,
  TranscriptionResult,
  PolishingResult,
  TextProcessingTask,
  PromptOption,
} from "./types";
import { SUPPORTED_LANGUAGES } from "./constants";
import { logger, debug, info, warn, error } from "./utils/logger";
import TranscriptionHistory from "./transcription-history";
import {
  isDoubaoConfigured,
  saveDoubaoCredentials,
  clearCredentials,
  syncConfigurationState,
  isDeepSeekConfigured,
  saveDeepSeekCredentials,
  getDeepSeekConfig,
} from "./utils/config";
import {
  createDeepSeekClient,
} from "./utils/ai/deepseek-client";
import {
  getAllAvailablePrompts,
  findPromptById,
  addCustomPrompt,
  validateCustomPrompt,
  getPromptContent,
} from "./utils/prompt-manager";
import { detectProgrammingContent } from "./utils/programming-terms-corrector";

/**
 * 从润色模板推断对应的任务类型
 */
function getTaskFromPromptId(promptId: string): TextProcessingTask {
  const taskMappings: Record<string, TextProcessingTask> = {
    "general": "润色",
    "technical": "润色",
    "business": "润色", 
    "academic": "学术润色",
    "casual": "润色",
    "formal": "润色",
    "concise": "缩写",
    "detailed": "扩写",
    "code-comment": "润色",
    "tech-translation": "翻译",
    "vibe-coding": "vibe coding"
  };
  
  return taskMappings[promptId] || "润色";
}

export default function RecordTranscription() {
  const { push } = useNavigation();
  const preferences = getPreferences();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // 新增：润色处理状态
  const [isPolishing, setIsPolishing] = useState(false);

  const [currentPreferences, setCurrentPreferences] =
    useState<TranscriptionPreferences>(preferences);

  // 使用 useCachedState 持久化转写结果，防止切换应用时丢失
  const [transcriptionResult, setTranscriptionResult] = useCachedState<TranscriptionResult | null>(
    "current-transcription-result",
    null
  );

  // 新增：润色结果状态（也使用持久化）
  const [polishingResult, setPolishingResult] = useCachedState<PolishingResult | null>(
    "current-polishing-result",
    null
  );

  const [highlightedText, setHighlightedText] = useState<string>("");

  // 新增：增量转写结果和进度状态（临时状态，不需要持久化）
  const [partialResults, setPartialResults] = useState<string[]>([]);
  const [transcriptionStatus, setTranscriptionStatus] = useState<string>("");

  // 新增：session ID 用于全链路跟踪
  const [currentSessionId, setCurrentSessionId] = useState<string>("");

  // 配置编辑状态 - 使用更安全的初始化
  const [showDoubaoConfig, setShowDoubaoConfig] = useState(true); // 默认显示配置表单
  // 新增：DeepSeek 配置状态
  const [showDeepSeekConfig, setShowDeepSeekConfig] = useState(false);

  // 临时配置存储（编辑时使用）
  const [tempDoubaoConfig, setTempDoubaoConfig] = useState({
    appKey: "",
    accessToken: "",
    secretKey: "",
  });

  // 新增：DeepSeek 临时配置
  const [tempDeepSeekConfig, setTempDeepSeekConfig] = useState({
    apiKey: "",
    model: "deepseek-chat",
    baseUrl: "https://api.deepseek.com/v1",
  });


  // 新增：润色提示词管理
  const [availablePrompts, setAvailablePrompts] = useState<PromptOption[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState<string>(
    currentPreferences.selectedPromptId || "general"
  );
  const [showCustomPromptModal, setShowCustomPromptModal] = useState(false);
  const [newPromptName, setNewPromptName] = useState("");
  const [newPromptContent, setNewPromptContent] = useState("");

  // 初始化可用的润色提示词并加载用户上次的选择
  useEffect(() => {
    const prompts = getAllAvailablePrompts();
    setAvailablePrompts(prompts);
    
    // 从本地存储加载用户上次的选择
    LocalStorage.getItem("selectedPromptId").then((savedPromptId) => {
      if (savedPromptId && typeof savedPromptId === "string") {
        // 验证保存的ID是否仍然有效
        const isValidId = prompts.some(p => (p.isCustom ? p.id : p.key) === savedPromptId);
        if (isValidId) {
          setSelectedPromptId(savedPromptId);
          debug("RecordTranscription", "Restored previous prompt selection", { 
            promptId: savedPromptId 
          });
        }
      }
    });
  }, [showCustomPromptModal]); // 当自定义提示词弹窗关闭时刷新

  // 记录组件初始化
  useEffect(() => {
    try {
      debug("RecordTranscription", "🚀 Component initializing...");

      // 同步配置状态
      debug("RecordTranscription", "🔧 Starting configuration sync");
      const syncResult = syncConfigurationState();
      debug("RecordTranscription", "🔧 Configuration sync result", { success: syncResult });

      // 重新检查配置状态
      debug("RecordTranscription", "🔧 Checking configuration status");
      const isDoubaoConfigured_ = isDoubaoConfigured();
      const isDeepSeekConfigured_ = isDeepSeekConfigured();
      const shouldShowDoubaoConfig = !isDoubaoConfigured_;
      const shouldShowDeepSeekConfig = !isDeepSeekConfigured_;

      debug("RecordTranscription", "🔧 Configuration status check", {
        isDoubaoConfigured: isDoubaoConfigured_,
        isDeepSeekConfigured: isDeepSeekConfigured_,
        currentShowDoubaoConfig: showDoubaoConfig,
        currentShowDeepSeekConfig: showDeepSeekConfig,
        willSetShowDoubaoConfigTo: shouldShowDoubaoConfig,
        willSetShowDeepSeekConfigTo: shouldShowDeepSeekConfig,
      });

      setShowDoubaoConfig(shouldShowDoubaoConfig);
      setShowDeepSeekConfig(shouldShowDeepSeekConfig);

      info("RecordTranscription", "Component initialized", {
        preferences: currentPreferences,
        isDoubaoConfigured: isDoubaoConfigured_,
        isDeepSeekConfigured: isDeepSeekConfigured_,
        showDoubaoConfig: shouldShowDoubaoConfig,
        showDeepSeekConfig: shouldShowDeepSeekConfig,
        logFile: logger.getLogFilePath(),
      });

      // 添加调试日志
      console.log("🐛 DEBUG: All preferences:", currentPreferences);
      console.log("🐛 DEBUG: Is Doubao configured:", isDoubaoConfigured_);
      console.log("🐛 DEBUG: Is DeepSeek configured:", isDeepSeekConfigured_);
      console.log("🐛 DEBUG: Show Doubao config form:", shouldShowDoubaoConfig);
      console.log("🐛 DEBUG: Show DeepSeek config form:", shouldShowDeepSeekConfig);
    } catch (error) {
      error("RecordTranscription", "Component initialization failed", error);
      console.error("🐛 DEBUG: Component initialization error:", error);
      // 确保组件仍能正常工作
      setShowDoubaoConfig(true);
      setShowDeepSeekConfig(true);
    }
  }, []);

  const {
    state: recorderState,
    startRecording,
    stopRecording,
    formatDuration,
  } = useAudioRecorder();

  // Context现在需要手动设置，不再自动读取剪切板

  // 监控录制状态变化
  useEffect(() => {
    debug("RecordTranscription", "🐛 DEBUG: recorderState.isRecording changed", {
      isRecording: recorderState.isRecording,
      duration: recorderState.duration,
      timestamp: Date.now(),
    });
  }, [recorderState.isRecording]);

  // 处理录音和转写
  const handleRecordAndTranscribe = async () => {
    debug("RecordTranscription", "handleRecordAndTranscribe called", {
      isRecording: recorderState.isRecording,
      isProcessing,
      isTranscribing,
    });

    debug("RecordTranscription", "🐛 DEBUG: handleRecordAndTranscribe called", {
      isRecording: recorderState.isRecording,
      isProcessing,
      isTranscribing,
      recorderState: recorderState,
    });

    // 防止重复触发
    if (isProcessing) {
      debug("RecordTranscription", "Already processing, ignoring duplicate trigger");
      debug("RecordTranscription", "🐛 DEBUG: Already processing, ignoring duplicate trigger");
      return;
    }

    setIsProcessing(true);
    const timer = logger.startTimer("RecordTranscription", "handleRecordAndTranscribe");

    try {
      debug("RecordTranscription", "🐛 DEBUG: Before state check", {
        "recorderState.isRecording": recorderState.isRecording,
        "will choose branch": recorderState.isRecording ? "STOP" : "START",
      });

      if (recorderState.isRecording) {
        debug("RecordTranscription", `🐛 DEBUG: [${currentSessionId}] Recorder is recording, will STOP recording`);
        info("RecordTranscription", `[${currentSessionId}] Stopping recording...`);

        // 添加一个小延迟来确保这是用户的有意操作
        await new Promise((resolve) => setTimeout(resolve, 100));
        // 停止录音并开始转写
        debug("RecordTranscription", `🐛 DEBUG: [${currentSessionId}] About to call stopRecording()`);
        const audioFilePath = await stopRecording();
        debug("RecordTranscription", `🐛 DEBUG: [${currentSessionId}] stopRecording() returned`, { audioFilePath });

        if (!audioFilePath) {
          throw new Error("No audio file recorded");
        }

        info("RecordTranscription", `[${currentSessionId}] Audio file saved`, { audioFilePath });

        // 验证音频格式
        const audioInfo = await import("./utils/audio").then((m) => m.getWavInfo(audioFilePath));
        if (audioInfo) {
          debug("RecordTranscription", "Audio format verification", {
            bitDepth: audioInfo.bitDepth,
            sampleRate: audioInfo.sampleRate,
            channels: audioInfo.channels,
            duration: audioInfo.duration,
            size: audioInfo.size,
          });

          // 检查音频格式是否符合豆包要求
          if (audioInfo.bitDepth !== 16) {
            warn("RecordTranscription", "Audio bit depth mismatch", {
              expected: 16,
              actual: audioInfo.bitDepth,
            });
          }
          if (audioInfo.sampleRate !== 16000) {
            warn("RecordTranscription", "Audio sample rate mismatch", {
              expected: 16000,
              actual: audioInfo.sampleRate,
            });
          }
        } else {
          warn("RecordTranscription", "Failed to read audio format info");
        }

        setIsTranscribing(true);
        setPartialResults([]); // 清空之前的增量结果
        setTranscriptionStatus("准备转写...");

        // 执行转写，传递回调函数
        const prompt = buildPromptWithContext();
        debug("RecordTranscription", "Starting transcription", {
          provider: "doubao",
          language: currentPreferences.language,
          promptLength: prompt.length,
        });

        const result = await transcribeAudio(
          audioFilePath,
          {
            ...currentPreferences,
            promptText: prompt,
          },
          // 增量结果回调
          (text: string) => {
            debug("RecordTranscription", "Received partial result", { text });
            setPartialResults((prev) => [...prev, text]);
          },
          // 进度状态回调
          (status: string) => {
            debug("RecordTranscription", "Status update", { status });
            setTranscriptionStatus(status);
          }
        );

        info("RecordTranscription", `[${currentSessionId}] Transcription completed`, {
          textLength: result.text.length,
          provider: result.metadata?.provider,
          sessionId: currentSessionId,
          partialResultsCount: partialResults.length,
        });

        setTranscriptionResult(result);
        debug("RecordTranscription", `[${currentSessionId}] Transcription result saved to state`);

        // 检测是否为编程内容，自动选择合适的润色模板
        if (result.text && detectProgrammingContent(result.text)) {
          debug(
            "RecordTranscription",
            "Detected programming content, auto-selecting vibe coding template"
          );
          // 自动选择Vibe Coding模板（同时包含纠错和润色）
          setSelectedPromptId("vibe-coding");
          // 保存自动选择的模板
          saveSelectedPromptId("vibe-coding");

          // 显示提示
          await showToast({
            style: Toast.Style.Success,
            title: "检测到编程内容",
            message: "已自动切换到Vibe Coding模式",
          });
        }

        // 添加到历史记录
        addToHistory(result);

        // 复制到剪贴板
        await Clipboard.copy(result.text);

        // 不再自动更新Context - 让用户主动选择

        await showToast({
          style: Toast.Style.Success,
          title: "Transcription completed",
          message: "Text copied to clipboard",
          primaryAction: {
            title: "View History",
            onAction: () => {
              push(<TranscriptionHistory />);
            },
          },
        });

        // 如果不保存音频文件，删除它
        if (!currentPreferences.saveAudioFiles && audioFilePath) {
          await deleteAudioFile(audioFilePath);
        }
      } else {
        // 开始录音 - 生成新的 session ID
        const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setCurrentSessionId(newSessionId);

        debug("RecordTranscription", `🐛 DEBUG: [${newSessionId}] Recorder is NOT recording, will START recording`);
        info("RecordTranscription", `[${newSessionId}] Starting recording...`);

        // 每次开始新的录音时清空上一次的结果
        setTranscriptionResult(null);
        setPolishingResult(null);
        setPartialResults([]);
        setTranscriptionStatus("");

        debug("RecordTranscription", `🐛 DEBUG: [${newSessionId}] About to call startRecording()`);
        await startRecording();
        debug(
          "RecordTranscription",
          `🐛 DEBUG: [${newSessionId}] startRecording() completed, new state should be recording=true`
        );
      }
    } catch (err) {
      error("RecordTranscription", "Record and transcribe error", err);
      await showToast({
        style: Toast.Style.Failure,
        title: "Operation failed",
        message: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setIsTranscribing(false);
      setIsProcessing(false);
      timer();
    }
  };

  // 构建包含上下文的提示词
  const buildPromptWithContext = () => {
    const parts: string[] = [];

    if (currentPreferences.promptText) {
      parts.push(currentPreferences.promptText);
    }

    if (currentPreferences.userTerms) {
      parts.push(`Terms: ${currentPreferences.userTerms}`);
    }

    if (currentPreferences.enableContext && highlightedText) {
      parts.push(`Context: ${highlightedText}`);
    }

    return parts.join(" ");
  };

  // 处理偏好设置更改
  const handlePreferenceChange = (key: keyof TranscriptionPreferences, value: string | boolean) => {
    setCurrentPreferences((prev) => ({ ...prev, [key]: value }));
  };

  // 手动刷新Context内容
  const refreshContext = async () => {
    if (!currentPreferences.enableContext) return;

    try {
      const text = await Clipboard.readText();
      if (text) {
        setHighlightedText(text);
        await showToast({
          style: Toast.Style.Success,
          title: "Context updated",
          message: "Context refreshed from clipboard",
        });
      } else {
        await showToast({
          style: Toast.Style.Failure,
          title: "No content found",
          message: "Clipboard is empty",
        });
      }
    } catch (err) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to update context",
        message: "Could not read clipboard",
      });
    }
  };

  // 保存模板选择到本地存储
  const saveSelectedPromptId = async (promptId: string) => {
    try {
      await LocalStorage.setItem("selectedPromptId", promptId);
      debug("RecordTranscription", "Saved prompt selection", { promptId });
    } catch (error) {
      debug("RecordTranscription", "Failed to save prompt selection", { error });
    }
  };

  // 处理润色模板选择
  const handleTemplateChange = (value: string) => {
    if (value === "__add_custom__") {
      setShowCustomPromptModal(true);
    } else {
      setSelectedPromptId(value);
      // 保存用户的选择
      saveSelectedPromptId(value);
    }
  };

  // 添加自定义提示词
  const handleAddCustomPrompt = async () => {
    const validation = validateCustomPrompt(newPromptName, newPromptContent);
    if (!validation.valid) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Invalid input",
        message: validation.error,
      });
      return;
    }

    const newPrompt = addCustomPrompt(newPromptName, newPromptContent);
    if (newPrompt) {
      await showToast({
        style: Toast.Style.Success,
        title: "Custom prompt added",
        message: `"${newPromptName}" has been added`,
      });
      setSelectedPromptId(newPrompt.id);
      setShowCustomPromptModal(false);
      setNewPromptName("");
      setNewPromptContent("");
    } else {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to add prompt",
        message: "Name already exists or save failed",
      });
    }
  };

  // 新增：处理文本润色
  const handlePolishText = async () => {
    if (!transcriptionResult?.text) {
      await showToast({
        style: Toast.Style.Failure,
        title: "No text to polish",
        message: "Please transcribe some audio first",
      });
      return;
    }

    if (isPolishing) {
      debug("RecordTranscription", "Already polishing, ignoring duplicate trigger");
      return;
    }

    setIsPolishing(true);
    const timer = logger.startTimer("RecordTranscription", "handlePolishText");

    // 显示开始润色的toast
    await showToast({
      style: Toast.Style.Animated,
      title: "Polishing with DeepSeek...",
    });

    try {
      // 从选中的模板推断任务类型
      const inferredTask = getTaskFromPromptId(selectedPromptId);
      
      debug("RecordTranscription", "Starting text polishing", {
        promptId: selectedPromptId,
        inferredTask,
        textLength: transcriptionResult.text.length,
      });

      const deepseekConfig = getDeepSeekConfig();
      if (!deepseekConfig) {
        throw new Error("DeepSeek not configured. Please configure DeepSeek API first.");
      }

      const client = createDeepSeekClient(deepseekConfig);

      // 获取选中的提示词内容
      const selectedPrompt = findPromptById(selectedPromptId);
      const customPrompt = selectedPrompt ? getPromptContent(selectedPrompt) : undefined;

      const result = await client.processText(transcriptionResult.text, {
        task: inferredTask,
        customPrompt,
        temperature: 0.7,
      });

      info("RecordTranscription", "Text polishing completed", {
        promptId: selectedPromptId,
        inferredTask,
        originalLength: result.originalText.length,
        polishedLength: result.polishedText.length,
        model: result.model,
      });

      setPolishingResult(result);

      // 复制润色后的文本到剪贴板
      await Clipboard.copy(result.polishedText);

      await showToast({
        style: Toast.Style.Success,
        title: "Polishing completed",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      error("RecordTranscription", "Text polishing failed", { error: errorMessage });
      await showToast({
        style: Toast.Style.Failure,
        title: "Polishing failed",
        message: errorMessage,
      });
    } finally {
      setIsPolishing(false);
      timer();
    }
  };

  // 统一的配置保存函数
  const saveAllConfigurations = async () => {
    debug("RecordTranscription", "🔧 Starting to save all configurations");

    let hasError = false;
    let savedCount = 0;

    // 保存 Doubao 配置（如果有填写）
    if (
      showDoubaoConfig &&
      tempDoubaoConfig.appKey &&
      tempDoubaoConfig.accessToken &&
      tempDoubaoConfig.secretKey
    ) {
      const doubaoSuccess = saveDoubaoCredentials(
        tempDoubaoConfig.appKey,
        tempDoubaoConfig.accessToken,
        tempDoubaoConfig.secretKey
      );
      if (doubaoSuccess) {
        setShowDoubaoConfig(false);
        setTempDoubaoConfig({ appKey: "", accessToken: "", secretKey: "" });
        savedCount++;
        info("RecordTranscription", "✅ Doubao config saved successfully");
      } else {
        hasError = true;
        error("RecordTranscription", "❌ Failed to save Doubao config");
      }
    }

    // 保存 DeepSeek 配置（如果有填写）
    if (
      showDeepSeekConfig &&
      tempDeepSeekConfig.apiKey &&
      tempDeepSeekConfig.model &&
      tempDeepSeekConfig.baseUrl
    ) {
      const deepseekSuccess = saveDeepSeekCredentials(
        tempDeepSeekConfig.apiKey,
        tempDeepSeekConfig.model,
        tempDeepSeekConfig.baseUrl
      );
      if (deepseekSuccess) {
        setShowDeepSeekConfig(false);
        setTempDeepSeekConfig({
          apiKey: "",
          model: "deepseek-chat",
          baseUrl: "https://api.deepseek.com/v1",
        });
        savedCount++;
        info("RecordTranscription", "✅ DeepSeek config saved successfully");
      } else {
        hasError = true;
        error("RecordTranscription", "❌ Failed to save DeepSeek config");
      }
    }

    // 显示结果
    if (savedCount === 0) {
      await showToast({
        style: Toast.Style.Failure,
        title: "没有可保存的配置",
        message: "请填写完整的API凭证信息",
      });
    } else if (hasError) {
      await showToast({
        style: Toast.Style.Failure,
        title: "部分配置保存失败",
        message: `已保存 ${savedCount} 个配置，请检查其他配置`,
      });
    } else {
      await showToast({
        style: Toast.Style.Success,
        title: "配置保存成功",
        message: `已保存 ${savedCount} 个API配置`,
      });
    }
  };

  // 保存豆包配置
  const saveDoubaoConfig = async () => {
    debug("RecordTranscription", "🔧 Starting to save Doubao config", {
      appKey: tempDoubaoConfig.appKey ? `${tempDoubaoConfig.appKey.substring(0, 4)}****` : "empty",
      accessToken: tempDoubaoConfig.accessToken
        ? `${tempDoubaoConfig.accessToken.substring(0, 4)}****`
        : "empty",
      secretKey: tempDoubaoConfig.secretKey
        ? `${tempDoubaoConfig.secretKey.substring(0, 4)}****`
        : "empty",
    });

    if (!tempDoubaoConfig.appKey || !tempDoubaoConfig.accessToken || !tempDoubaoConfig.secretKey) {
      const errorObj = {
        hasAppKey: !!tempDoubaoConfig.appKey,
        hasAccessToken: !!tempDoubaoConfig.accessToken,
        hasSecretKey: !!tempDoubaoConfig.secretKey,
      };
      error("RecordTranscription", "Configuration incomplete - missing fields", errorObj);
      await showToast({
        style: Toast.Style.Failure,
        title: "Configuration incomplete",
        message: "Please fill in all Doubao credentials",
      });
      return;
    }

    debug("RecordTranscription", "🔧 All fields validated, calling saveDoubaoCredentials");
    const success = saveDoubaoCredentials(
      tempDoubaoConfig.appKey,
      tempDoubaoConfig.accessToken,
      tempDoubaoConfig.secretKey
    );

    debug("RecordTranscription", "🔧 saveDoubaoCredentials result", { success });

    if (success) {
      info("RecordTranscription", "✅ Doubao config saved successfully");

      // 更新显示状态
      debug("RecordTranscription", "🔧 Setting showDoubaoConfig to false");
      setShowDoubaoConfig(false);

      await showToast({
        style: Toast.Style.Success,
        title: "Doubao configured",
        message: "Credentials saved successfully",
      });

      // 清空临时存储
      debug("RecordTranscription", "🔧 Clearing temp config");
      setTempDoubaoConfig({ appKey: "", accessToken: "", secretKey: "" });

      // 验证保存结果
      const isConfigured = isDoubaoConfigured();
      debug("RecordTranscription", "🔧 Post-save verification", {
        isDoubaoConfigured: isConfigured,
        showDoubaoConfig: false,
      });
    } else {
      error("RecordTranscription", "❌ Failed to save Doubao config");
      await showToast({
        style: Toast.Style.Failure,
        title: "Save failed",
        message: "Could not save Doubao credentials",
      });
    }
  };

  // 编辑配置
  const editDoubaoConfig = () => {
    setShowDoubaoConfig(true);
  };

  // 删除配置
  const deleteDoubaoConfig = async () => {
    const success = clearCredentials("doubao");
    if (success) {
      setShowDoubaoConfig(true);
      await showToast({
        style: Toast.Style.Success,
        title: "Configuration cleared",
        message: "Doubao credentials removed",
      });
    }
  };

  // 新增：编辑 DeepSeek 配置
  const editDeepSeekConfig = () => {
    setShowDeepSeekConfig(true);
  };

  // 新增：删除 DeepSeek 配置
  const deleteDeepSeekConfig = async () => {
    const success = clearCredentials("deepseek");
    if (success) {
      setShowDeepSeekConfig(true);
      await showToast({
        style: Toast.Style.Success,
        title: "Configuration cleared",
        message: "DeepSeek credentials removed",
      });
    }
  };

  return (
    <Form
      navigationTitle={
        recorderState.isRecording
          ? "Recording... Press Cmd+R to stop"
          : isPolishing
            ? "Polishing with DeepSeek..."
            : "Speech to Text - Press Cmd+R to start"
      }
      actions={
        <ActionPanel>
          {/* 主要录音功能 */}
          <Action
            title={recorderState.isRecording ? "Stop Recording" : "Start Recording"}
            icon={recorderState.isRecording ? Icon.Stop : Icon.Microphone}
            onAction={handleRecordAndTranscribe}
            shortcut={{ modifiers: ["cmd"], key: "r" }}
          />

          {/* 配置管理操作 */}
          {(showDoubaoConfig || showDeepSeekConfig) && (
            <Action
              title="💾 保存api配置"
              icon={Icon.CheckCircle}
              onAction={saveAllConfigurations}
              shortcut={{ modifiers: ["cmd", "shift"], key: "s" }}
            />
          )}

          {showDoubaoConfig !== true && (
            <Action
              title="Edit Doubao Config"
              icon={Icon.Gear}
              onAction={editDoubaoConfig}
              shortcut={{ modifiers: ["cmd"], key: "e" }}
            />
          )}

          {/* 转写结果相关功能 */}
          {transcriptionResult?.text && (
            <>
              <Action
                title="Copy Text"
                icon={Icon.Clipboard}
                onAction={() => Clipboard.copy(transcriptionResult.text)}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />

              {/* 新增：润色功能 */}
              <Action
                title={
                  isPolishing 
                    ? "Polishing…" 
                    : `Polish with ${availablePrompts.find(p => (p.isCustom ? p.id : p.key) === selectedPromptId)?.name || "DeepSeek"}`
                }
                icon={isPolishing ? Icon.CircleProgress : Icon.Wand}
                onAction={handlePolishText}
                shortcut={{ modifiers: ["cmd"], key: "p" }}
              />
            </>
          )}

          {/* DeepSeek 配置管理 */}
          {showDeepSeekConfig !== true && (
            <Action
              title="Edit Deepseek Config"
              icon={Icon.Gear}
              onAction={editDeepSeekConfig}
              shortcut={{ modifiers: ["cmd", "shift"], key: "e" }}
            />
          )}

          {/* 润色结果操作 */}
          {polishingResult?.polishedText && (
            <Action
              title="Copy Polished Text"
              icon={Icon.Stars}
              onAction={() => Clipboard.copy(polishingResult.polishedText)}
              shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
            />
          )}

          <Action
            title="View History"
            icon={Icon.Clock}
            onAction={() => push(<TranscriptionHistory />)}
            shortcut={{ modifiers: ["cmd"], key: "h" }}
          />
        </ActionPanel>
      }
      isLoading={isTranscribing}
    >
      {/* 状态指示区域 - 固定高度避免抖动 */}
      <Form.Description
        title={
          recorderState.isRecording
            ? "Recording"
            : isTranscribing
              ? "Transcribing"
              : isPolishing
                ? "Polishing"
                : "Status"
        }
        text={
          recorderState.isRecording
            ? `🔴 ${formatDuration(recorderState.duration)} - Press Cmd+R to stop recording`
            : isTranscribing
              ? `🎙️ ${transcriptionStatus || "转写中..."} ${partialResults.length > 0 ? `(已识别 ${partialResults.length} 段)` : ""}`
              : isPolishing
                ? "Processing with DeepSeek... Please wait"
                : "Ready to record - Press Cmd+R to start"
        }
      />

      {/* 增量结果预览 - 仅在转写中且有结果时显示 */}
      {isTranscribing && partialResults.length > 0 && (
        <Form.Description
          title="实时转写预览"
          text={partialResults[partialResults.length - 1] || "识别中..."}
        />
      )}

      {/* 转写结果 - 始终渲染但控制可见性 */}
      <Form.TextArea
        id="result"
        title="Transcription Result"
        value={transcriptionResult?.text || ""}
        onChange={(newText) => {
          if (transcriptionResult) {
            setTranscriptionResult({
              ...transcriptionResult,
              text: newText,
            });
          } else {
            // 允许在没有转写结果时也能输入/粘贴内容
            setTranscriptionResult({
              text: newText,
              audioFilePath: "",
              duration: 0,
              timestamp: Date.now(),
              metadata: {
                provider: "manual",
                language: currentPreferences.language || "auto",
              },
            });
          }

          // 检测编程内容（延迟检测以避免频繁触发）
          if (newText && newText.length > 20) {
            setTimeout(() => {
              if (detectProgrammingContent(newText) && selectedPromptId !== "vibe-coding") {
                debug("RecordTranscription", "Auto-detected programming content in user input");
                setSelectedPromptId("vibe-coding");
                saveSelectedPromptId("vibe-coding");
              }
            }, 1000);
          }
        }}
        placeholder={transcriptionResult ? "" : "转写结果将在这里显示..."}
        info={
          transcriptionResult
            ? "您可以编辑转录结果来修正识别错误。编辑后的内容会被复制到剪贴板。"
            : "开始录音后，转写结果将显示在这里"
        }
      />

      {/* 润色结果展示 - 始终渲染但控制内容 */}
      <Form.Separator />
      <Form.TextArea
        id="polished"
        title={polishingResult ? `Polished Result (${polishingResult.task})` : "Polished Result"}
        value={polishingResult?.polishedText || ""}
        onChange={(newText) => {
          if (polishingResult) {
            setPolishingResult({
              ...polishingResult,
              polishedText: newText,
            });
          } else {
            // 允许在没有润色结果时也能输入/粘贴内容
            setPolishingResult({
              originalText: "",
              polishedText: newText,
              task: getTaskFromPromptId(selectedPromptId),
              model: tempDeepSeekConfig.model || "deepseek-chat",
              timestamp: Date.now(),
              metadata: {
                provider: "manual",
              },
            });
          }
        }}
        placeholder={polishingResult ? "" : "润色结果将在这里显示..."}
        info={
          polishingResult
            ? `DeepSeek ${polishingResult.model} 润色结果。您可以继续编辑。`
            : "点击润色按钮后，结果将显示在这里"
        }
      />
      {polishingResult && (
        <Form.Description
          title="Processing Info"
          text={`Model: ${polishingResult.model} | Task: ${polishingResult.task} | 
                 Original: ${polishingResult.originalText.length} chars | 
                 Polished: ${polishingResult.polishedText.length} chars${
                   polishingResult.metadata?.usage
                     ? ` | Tokens: ${polishingResult.metadata.usage.totalTokens}`
                     : ""
                 }`}
        />
      )}

      <Form.Separator />

      {/* AI 提供商 */}
      <Form.Description title="AI Provider" text="Doubao (豆包) - 字节跳动语音识别服务" />

      {/* 语言选择 */}
      <Form.Dropdown
        id="language"
        title="Language"
        value={currentPreferences.language || "auto"}
        onChange={(value) => handlePreferenceChange("language", value)}
        isDisabled={recorderState.isRecording}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <Form.Dropdown.Item key={lang.value} value={lang.value} title={lang.title} />
        ))}
      </Form.Dropdown>

      {/* 豆包配置 */}
      <>
        {showDoubaoConfig ? (
          <>
            <Form.TextField
              id="doubaoAppKey"
              title="Doubao App Key"
              placeholder="Enter your Doubao App Key"
              value={tempDoubaoConfig.appKey}
              onChange={(value) => setTempDoubaoConfig((prev) => ({ ...prev, appKey: value }))}
              isDisabled={recorderState.isRecording}
            />
            <Form.TextField
              id="doubaoAccessToken"
              title="Doubao Access Token"
              placeholder="Enter your Doubao Access Token"
              value={tempDoubaoConfig.accessToken}
              onChange={(value) => setTempDoubaoConfig((prev) => ({ ...prev, accessToken: value }))}
              isDisabled={recorderState.isRecording}
            />
            <Form.TextField
              id="doubaoSecretKey"
              title="Doubao Secret Key"
              placeholder="Enter your Doubao Secret Key"
              value={tempDoubaoConfig.secretKey}
              onChange={(value) => setTempDoubaoConfig((prev) => ({ ...prev, secretKey: value }))}
              isDisabled={recorderState.isRecording}
            />
            <Form.Description title="" text={`💡 配置保存后将不再显示这些字段，避免密码泄露`} />
          </>
        ) : (
          <Form.Description title="Doubao Configuration" text={`✅ 已配置 - 凭证已安全保存`} />
        )}
      </>

      {/* 统一的保存配置提示 */}
      {(showDoubaoConfig || showDeepSeekConfig) && (
        <>
          <Form.Separator />
          <Form.Description
            title="🔥 保存API配置"
            text={`方式1: 快捷键 Cmd+Shift+S\n方式2: 点击右上角 "Actions" 按钮（⌘K）`}
          />
          <Form.Description
            title=""
            text={`💾 在Actions面板中，"💾 保存API配置" 按钮会同时保存所有填写的配置！`}
          />
        </>
      )}

      <Form.Separator />

      {/* DeepSeek 润色设置 */}
      <Form.Description title="DeepSeek Polish Settings" text="文本润色和优化设置" />

      {/* DeepSeek 配置 */}
      <>
        {showDeepSeekConfig ? (
          <>
            <Form.TextField
              id="deepseekApiKey"
              title="DeepSeek API Key"
              placeholder="Enter your DeepSeek API Key"
              value={tempDeepSeekConfig.apiKey}
              onChange={(value) => setTempDeepSeekConfig((prev) => ({ ...prev, apiKey: value }))}
              isDisabled={recorderState.isRecording}
            />
            <Form.TextField
              id="deepseekModel"
              title="DeepSeek Model"
              placeholder="deepseek-chat"
              value={tempDeepSeekConfig.model}
              onChange={(value) => setTempDeepSeekConfig((prev) => ({ ...prev, model: value }))}
              isDisabled={recorderState.isRecording}
            />
            <Form.TextField
              id="deepseekBaseUrl"
              title="DeepSeek Base URL"
              placeholder="https://api.deepseek.com/v1"
              value={tempDeepSeekConfig.baseUrl}
              onChange={(value) => setTempDeepSeekConfig((prev) => ({ ...prev, baseUrl: value }))}
              isDisabled={recorderState.isRecording}
            />
            <Form.Description title="" text={`💡 配置保存后将不再显示这些字段，避免密码泄露`} />
          </>
        ) : (
          <Form.Description title="DeepSeek Configuration" text={`✅ 已配置 - 凭证已安全保存`} />
        )}
      </>

      <Form.Separator />

      <Form.Dropdown
        id="polishTemplate"
        title="润色模板"
        value={selectedPromptId}
        onChange={handleTemplateChange}
        isDisabled={recorderState.isRecording || isPolishing}
      >
        {availablePrompts.map((prompt) => (
          <Form.Dropdown.Item
            key={prompt.isCustom ? prompt.id : prompt.key}
            value={prompt.isCustom ? prompt.id : prompt.key}
            title={prompt.name}
          />
        ))}
        <Form.Dropdown.Item value="__add_custom__" title="➕ Add Custom Prompt" />
      </Form.Dropdown>

    </Form>
  );
}
