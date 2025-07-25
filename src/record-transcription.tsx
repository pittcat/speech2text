import { useState, useEffect } from "react";
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

export default function RecordTranscription() {
  const { push } = useNavigation();
  const preferences = getPreferences();
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPreferences, setCurrentPreferences] =
    useState<TranscriptionPreferences>(preferences);
  const [transcriptionResult, setTranscriptionResult] = useState<TranscriptionResult | null>(null);
  const [highlightedText, setHighlightedText] = useState<string>("");

  // 记录组件初始化
  useEffect(() => {
    info("RecordTranscription", "Component initialized", {
      preferences: currentPreferences,
      aiProvider: currentPreferences.aiProvider,
      logFile: logger.getLogFilePath(),
    });
    
    // 添加调试日志
    console.log("🐛 DEBUG: Current AI Provider:", currentPreferences.aiProvider);
    console.log("🐛 DEBUG: All preferences:", currentPreferences);
  }, []);

  const {
    state: recorderState,
    startRecording,
    stopRecording,
    formatDuration,
  } = useAudioRecorder();

  // 获取高亮文本（如果启用）
  useEffect(() => {
    if (currentPreferences.enableContext) {
      trace("RecordTranscription", "Attempting to read clipboard for context");
      Clipboard.readText()
        .then((text) => {
          if (text) {
            debug("RecordTranscription", "Clipboard text retrieved", {
              textLength: text.length,
              preview: text.substring(0, 50) + "...",
            });
            setHighlightedText(text);
          }
        })
        .catch((err) => {
          warn("RecordTranscription", "Failed to read clipboard", err);
        });
    }
  }, [currentPreferences.enableContext]);

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
          provider: currentPreferences.aiProvider,
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

        // 如果启用了Context功能，更新Context显示为最新的转写结果
        if (currentPreferences.enableContext) {
          setHighlightedText(result.text);
        }

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

  return (
    <Form
      navigationTitle={
        recorderState.isRecording ? "Recording... Press Enter to stop" : "Speech to Text"
      }
      actions={
        <ActionPanel>
          <Action
                    title={recorderState.isRecording ? "Stop Recording (Press Cmd+Enter)" : "Start Recording"}
                    icon={recorderState.isRecording ? Icon.Stop : Icon.Microphone}
                    onAction={handleRecordAndTranscribe}
                    shortcut={
                      recorderState.isRecording 
                        ? { modifiers: ["cmd"], key: "enter" }  // 录音时需要 Cmd+Enter 停止
                        : { modifiers: ["cmd"], key: "r" }      // 未录音时 Cmd+R 开始
                    }
          />
          {transcriptionResult && (
            <>
              <Action
                title="Copy Text"
                icon={Icon.Clipboard}
                onAction={() => Clipboard.copy(transcriptionResult.text)}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action
                title="View History"
                icon={Icon.Clock}
                onAction={() => push(<TranscriptionHistory />)}
                shortcut={{ modifiers: ["cmd"], key: "h" }}
              />
            </>
          )}
          {currentPreferences.enableContext && (
            <Action
              title="Refresh Context"
              icon={Icon.ArrowClockwise}
              onAction={refreshContext}
              shortcut={{ modifiers: ["cmd"], key: "u" }}
            />
          )}
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
          onChange={() => {}} // Read-only
        />
      )}

      <Form.Separator />

      {/* AI 提供商选择 */}
      <Form.Dropdown
        id="aiProvider"
        title="AI Provider"
        value={currentPreferences.aiProvider}
        onChange={(value) => {
          console.log("🐛 DEBUG: AI Provider changed to:", value);
          handlePreferenceChange("aiProvider", value);
        }}
        autoFocus={false}
        isDisabled={recorderState.isRecording}
      >
        <Form.Dropdown.Item value="doubao" title="Doubao (豆包)" />
        <Form.Dropdown.Item value="groq" title="Groq (Whisper)" />
      </Form.Dropdown>

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

      {/* Groq 模型选择（仅在选择 Groq 时显示） */}
      {(() => {
        const shouldShow = currentPreferences.aiProvider === "groq";
        console.log("🐛 DEBUG: Should show Groq model?", shouldShow, "AI Provider:", currentPreferences.aiProvider);
        return shouldShow;
      })() && (
        <Form.Dropdown
          id="model"
          title="Model"
          value={currentPreferences.model || "whisper-large-v3"}
          onChange={(value) => handlePreferenceChange("model", value)}
          isDisabled={recorderState.isRecording}
        >
          <Form.Dropdown.Item value="whisper-large-v3" title="Whisper Large v3" />
          <Form.Dropdown.Item value="whisper-large-v3-turbo" title="Whisper Large v3 Turbo" />
          <Form.Dropdown.Item
            value="distil-whisper-large-v3-en"
            title="Distil Whisper (English only)"
          />
        </Form.Dropdown>
      )}

      {/* 豆包配置（仅在选择豆包时显示） */}
      {(() => {
        const shouldShow = currentPreferences.aiProvider === "doubao";
        console.log("🐛 DEBUG: Should show Doubao config?", shouldShow, "AI Provider:", currentPreferences.aiProvider);
        return shouldShow;
      })() && (
        <>
          <Form.TextField
            id="doubaoAppKey"
            title="Doubao App Key"
            placeholder="Enter your Doubao App Key"
            value={currentPreferences.doubaoAppKey || ""}
            onChange={(value) => handlePreferenceChange("doubaoAppKey", value)}
            isDisabled={recorderState.isRecording}
          />
          <Form.PasswordField
            id="doubaoAccessToken" 
            title="Doubao Access Token"
            placeholder="Enter your Doubao Access Token"
            value={currentPreferences.doubaoAccessToken || ""}
            onChange={(value) => handlePreferenceChange("doubaoAccessToken", value)}
            isDisabled={recorderState.isRecording}
          />
          <Form.PasswordField
            id="doubaoSecretKey"
            title="Doubao Secret Key" 
            placeholder="Enter your Doubao Secret Key"
            value={currentPreferences.doubaoSecretKey || ""}
            onChange={(value) => handlePreferenceChange("doubaoSecretKey", value)}
            isDisabled={recorderState.isRecording}
          />
        </>
      )}

      {/* Groq API Key（仅在选择 Groq 时显示） */}
      {currentPreferences.aiProvider === "groq" && (
        <Form.PasswordField
          id="apiKey"
          title="Groq API Key"
          placeholder="Enter your Groq API Key"
          value={currentPreferences.apiKey || ""}
          onChange={(value) => handlePreferenceChange("apiKey", value)}
          isDisabled={recorderState.isRecording}
        />
      )}

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
      {currentPreferences.enableContext && highlightedText && (
        <>
          <Form.Separator />
          <Form.TextArea
            id="context"
            title="Context"
            value={highlightedText}
            onChange={() => {}} // Read-only
            info="This highlighted text will be used as context. It will automatically update when you copy text to the clipboard. You can also manually refresh it by pressing Cmd+U."
          />
        </>
      )}
    </Form>
  );
}
