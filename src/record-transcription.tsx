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
} from "@raycast/api";
import { useAudioRecorder } from "./hooks/useAudioRecorder";
import { transcribeAudio, getPreferences } from "./utils/ai/transcription";
import { addToHistory } from "./utils/history";
import { deleteAudioFile } from "./utils/audio";
import { TranscriptionPreferences, TranscriptionResult } from "./types";
import { SUPPORTED_LANGUAGES } from "./constants";
import { logger, trace, debug, info, warn, error } from "./utils/logger";
import TranscriptionHistory from "./transcription-history";
import {
  isDoubaoConfigured,
  saveDoubaoCredentials,
  clearCredentials,
  syncConfigurationState,
} from "./utils/config";

export default function RecordTranscription() {
  const { push } = useNavigation();
  const preferences = getPreferences();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPreferences, setCurrentPreferences] =
    useState<TranscriptionPreferences>(preferences);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [highlightedText, setHighlightedText] = useState<string>("");

  // 配置编辑状态 - 使用更安全的初始化
  const [showDoubaoConfig, setShowDoubaoConfig] = useState(true); // 默认显示配置表单
  
  // 临时配置存储（编辑时使用）
  const [tempDoubaoConfig, setTempDoubaoConfig] = useState({
    appKey: "",
    accessToken: "",
    secretKey: "",
  });

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
      const isConfigured = isDoubaoConfigured();
      const shouldShowConfig = !isConfigured;
      
      debug("RecordTranscription", "🔧 Configuration status check", {
        isDoubaoConfigured: isConfigured,
        currentShowDoubaoConfig: showDoubaoConfig,
        willSetShowDoubaoConfigTo: shouldShowConfig,
      });
      
      setShowDoubaoConfig(shouldShowConfig);
      
      info("RecordTranscription", "Component initialized", {
        preferences: currentPreferences,
        isDoubaoConfigured: isConfigured,
        showDoubaoConfig: shouldShowConfig,
        logFile: logger.getLogFilePath(),
      });
      
      // 添加调试日志
      console.log("🐛 DEBUG: All preferences:", currentPreferences);
      console.log("🐛 DEBUG: Is Doubao configured:", isConfigured);
      console.log("🐛 DEBUG: Show config form:", shouldShowConfig);
    } catch (error) {
      error("RecordTranscription", "Component initialization failed", error);
      console.error("🐛 DEBUG: Component initialization error:", error);
      // 确保组件仍能正常工作
      setShowDoubaoConfig(true);
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
      timestamp: Date.now()
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
      recorderState: recorderState
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
        "will choose branch": recorderState.isRecording ? "STOP" : "START"
      });

      if (recorderState.isRecording) {
        debug("RecordTranscription", "🐛 DEBUG: Recorder is recording, will STOP recording");
        info("RecordTranscription", "Stopping recording...");
        
        // 添加一个小延迟来确保这是用户的有意操作
        await new Promise(resolve => setTimeout(resolve, 100));
        // 停止录音并开始转写
        debug("RecordTranscription", "🐛 DEBUG: About to call stopRecording()");
        const audioFilePath = await stopRecording();
        debug("RecordTranscription", "🐛 DEBUG: stopRecording() returned", { audioFilePath });

        if (!audioFilePath) {
          throw new Error("No audio file recorded");
        }

        info("RecordTranscription", "Audio file saved", { audioFilePath });

        // 验证音频格式
        const audioInfo = await import("./utils/audio").then(m => m.getWavInfo(audioFilePath));
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
              actual: audioInfo.bitDepth
            });
          }
          if (audioInfo.sampleRate !== 16000) {
            warn("RecordTranscription", "Audio sample rate mismatch", {
              expected: 16000,
              actual: audioInfo.sampleRate
            });
          }
        } else {
          warn("RecordTranscription", "Failed to read audio format info");
        }

        setIsTranscribing(true);

        // 执行转写
        const prompt = buildPromptWithContext();
        debug("RecordTranscription", "Starting transcription", {
          provider: "doubao",
          language: currentPreferences.language,
          promptLength: prompt.length,
        });

        const result = await transcribeAudio(audioFilePath, {
          ...currentPreferences,
          promptText: prompt,
        });

        info("RecordTranscription", "Transcription completed", {
          textLength: result.text.length,
          provider: result.metadata?.provider,
        });

        setTranscriptionResult(result);

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
        // 开始录音
        debug("RecordTranscription", "🐛 DEBUG: Recorder is NOT recording, will START recording");
        info("RecordTranscription", "Starting recording...");
        debug("RecordTranscription", "🐛 DEBUG: About to call startRecording()");
        await startRecording();
        debug("RecordTranscription", "🐛 DEBUG: startRecording() completed, new state should be recording=true");
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

  // 保存豆包配置
  const saveDoubaoConfig = async () => {
    debug("RecordTranscription", "🔧 Starting to save Doubao config", {
      appKey: tempDoubaoConfig.appKey ? `${tempDoubaoConfig.appKey.substring(0, 4)}****` : "empty",
      accessToken: tempDoubaoConfig.accessToken ? `${tempDoubaoConfig.accessToken.substring(0, 4)}****` : "empty", 
      secretKey: tempDoubaoConfig.secretKey ? `${tempDoubaoConfig.secretKey.substring(0, 4)}****` : "empty",
    });

    if (!tempDoubaoConfig.appKey || !tempDoubaoConfig.accessToken || !tempDoubaoConfig.secretKey) {
      error("RecordTranscription", "Configuration incomplete - missing fields", {
        hasAppKey: !!tempDoubaoConfig.appKey,
        hasAccessToken: !!tempDoubaoConfig.accessToken,
        hasSecretKey: !!tempDoubaoConfig.secretKey,
      });
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

  return (
    <Form
      navigationTitle={
        recorderState.isRecording ? "Recording... Press Enter to stop" : "Speech to Text - Press Enter to start"
      }
      actions={
        <ActionPanel>
          {/* 主要录音功能 */}
          <Action
            title={recorderState.isRecording ? "Stop Recording" : "Start Recording"}
            icon={recorderState.isRecording ? Icon.Stop : Icon.Microphone}
            onAction={handleRecordAndTranscribe}
            shortcut={{ modifiers: [], key: "enter" }}
          />
          
          {/* 配置管理操作 */}
          {showDoubaoConfig === true && (
            <Action
              title="💾 Save Doubao Config"
              icon={Icon.CheckCircle}
              onAction={saveDoubaoConfig}
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
              
              {currentPreferences?.enableContext && (
                <Action
                  title="Set as Context"
                  icon={Icon.Plus}
                  onAction={() => setHighlightedText(transcriptionResult.text)}
                  shortcut={{ modifiers: ["cmd"], key: "t" }}
                />
              )}
            </>
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
      {/* 录音状态 */}
      {recorderState.isRecording && (
        <Form.Description
          title="Recording"
          text={`🔴 ${formatDuration(recorderState.duration)} - Press Cmd+Enter to stop recording`}
        />
      )}

      {/* 转写结果 */}
      {transcriptionResult && (
        <Form.TextArea
          id="result"
          title="Transcription Result"
          value={transcriptionResult.text}
          onChange={(newText) => {
            setTranscriptionResult({
              ...transcriptionResult,
              text: newText
            });
          }}
          info="您可以编辑转录结果来修正识别错误。编辑后的内容会被复制到剪贴板。"
        />
      )}

      <Form.Separator />

      {/* AI 提供商 */}
      <Form.Description
        title="AI Provider"
        text="Doubao (豆包) - 字节跳动语音识别服务"
      />

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
                onChange={(value) => setTempDoubaoConfig(prev => ({ ...prev, appKey: value }))}
                isDisabled={recorderState.isRecording}
              />
              <Form.TextField
                id="doubaoAccessToken" 
                title="Doubao Access Token"
                placeholder="Enter your Doubao Access Token"
                value={tempDoubaoConfig.accessToken}
                onChange={(value) => setTempDoubaoConfig(prev => ({ ...prev, accessToken: value }))}
                isDisabled={recorderState.isRecording}
              />
              <Form.TextField
                id="doubaoSecretKey"
                title="Doubao Secret Key" 
                placeholder="Enter your Doubao Secret Key"
                value={tempDoubaoConfig.secretKey}
                onChange={(value) => setTempDoubaoConfig(prev => ({ ...prev, secretKey: value }))}
                isDisabled={recorderState.isRecording}
              />
              <Form.Description 
                title=""
                text={`💡 配置保存后将不再显示这些字段，避免密码泄露`}
              />
              <Form.Description 
                title="🔥 保存配置"
                text={`方式1: 快捷键 Cmd+Shift+S\n方式2: 点击右上角 "Actions" 按钮（⌘K）`}
              />
              <Form.Description 
                title=""
                text={`💾 在Actions面板中，"💾 Save Doubao Config" 按钮位于最顶部，非常显眼！`}
              />
            </>
          ) : (
            <Form.Description 
              title="Doubao Configuration"
              text={`✅ 已配置 - 凭证已安全保存`}
            />
          )}
        </>



      <Form.Separator />

      {/* 高级选项 */}
      <Form.TextField
        id="promptText"
        title="Custom Prompt"
        placeholder="Enter instructions for the AI transcription"
        value={currentPreferences.promptText || ""}
        onChange={(value) => handlePreferenceChange("promptText", value)}
        isDisabled={recorderState.isRecording}
      />

      <Form.TextField
        id="userTerms"
        title="Custom Terms"
        placeholder="e.g., React.js, TypeScript, GraphQL"
        value={currentPreferences.userTerms || ""}
        onChange={(value) => handlePreferenceChange("userTerms", value)}
        info="Comma-separated list of specialized terms"
        isDisabled={recorderState.isRecording}
      />

      <Form.Checkbox
        id="enableContext"
        label="Use highlighted text as context"
        value={currentPreferences.enableContext || false}
        onChange={(value) => handlePreferenceChange("enableContext", value)}
        isDisabled={recorderState.isRecording}
      />

      <Form.Checkbox
        id="saveAudioFiles"
        label="Save audio files"
        value={currentPreferences.saveAudioFiles || true}
        onChange={(value) => handlePreferenceChange("saveAudioFiles", value)}
        isDisabled={recorderState.isRecording}
      />

      {/* 上下文预览 */}
      {currentPreferences.enableContext && (
        <>
          <Form.Separator />
          <Form.TextArea
            id="context"
            title="Context"
            placeholder={highlightedText ? "" : "使用 Cmd+T 将转录结果设为上下文，或手动输入上下文内容，帮助AI更准确理解后续录音内容"}
            value={highlightedText}
            onChange={(newText) => setHighlightedText(newText)}
            info="上下文可以帮助AI更准确理解专业术语和连续对话。您可以直接编辑此字段，或点击Actions菜单中的'Set as Context'（Cmd+T）将转录结果设为上下文。"
          />
        </>
      )}
    </Form>
  );
}
