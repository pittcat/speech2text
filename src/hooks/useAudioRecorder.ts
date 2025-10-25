import { useState, useCallback, useRef } from "react";
import { showToast, Toast } from "@raycast/api";
import { exec, ChildProcess } from "child_process";
import { join } from "path";
import { existsSync, mkdirSync } from "fs";
import { STORAGE_PATH, SOX_COMMAND } from "../constants";
import { AudioRecorderState } from "../types";
import { debug, error } from "../utils/logger";
import { ensureBackgroundPaths, writeStatus as writeBgStatus } from "../utils/background-task";
import { getPreferences } from "../utils/ai/transcription";

export function useAudioRecorder() {
  const [state, setState] = useState<AudioRecorderState>({
    isRecording: false,
    isPaused: false,
    duration: 0,
  });

  const recordingProcess = useRef<ChildProcess | null>(null);
  const startTime = useRef<number>(0);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  // 确保音频目录存在
  const ensureAudioDirectory = (customPath?: string) => {
    const audioDir = customPath || STORAGE_PATH.AUDIO_DIR;
    if (!existsSync(audioDir)) {
      mkdirSync(audioDir, { recursive: true });
    }
    return audioDir;
  };

  // 生成音频文件路径
  const generateAudioFilePath = () => {
    const preferences = getPreferences();
    const audioDir = ensureAudioDirectory(preferences.audioSaveLocation);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return join(audioDir, `recording-${timestamp}.wav`);
  };

  // 开始录音
  const startRecording = useCallback(async () => {
    try {
      debug("AudioRecorder", "🐛 DEBUG: startRecording() called");
      const audioFilePath = generateAudioFilePath();
      debug("AudioRecorder", "🐛 DEBUG: Generated audio file path", { audioFilePath });

      setState({
        isRecording: true,
        isPaused: false,
        duration: 0,
        audioFilePath,
      });
      debug("AudioRecorder", "🐛 DEBUG: State updated to isRecording=true");

      // 添加延迟确认状态更新完成
      setTimeout(() => {
        debug("AudioRecorder", "🐛 DEBUG: State should be updated now, checking...");
      }, 10);

      startTime.current = Date.now();

      // 开始计时
      durationInterval.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
        setState((prev) => ({ ...prev, duration: elapsed }));
      }, 100);

      // 构建Sox命令 - 对包含空格的路径进行引号包裹
      const command = [...SOX_COMMAND, `"${audioFilePath}"`].join(" ");
      debug("AudioRecorder", "Sox command", { command });

      recordingProcess.current = exec(command, (err, stdout, stderr) => {
        if (err && !err.killed) {
          error("AudioRecorder", "Recording process error", err);
          showToast({
            style: Toast.Style.Failure,
            title: "Recording failed",
            message: err.message,
          });
        } else if (err && err.killed) {
          debug("AudioRecorder", "Recording process killed normally");
        }

        if (stdout) {
          debug("AudioRecorder", "Sox stdout", { stdout });
        }
        if (stderr) {
          debug("AudioRecorder", "Sox stderr", { stderr });
        }
      });

      // 检查进程是否真的启动了
      if (recordingProcess.current && recordingProcess.current.pid) {
        debug("AudioRecorder", "Sox process started", { pid: recordingProcess.current.pid });
        try {
          ensureBackgroundPaths();
          writeBgStatus({
            status: "recording",
            pid: recordingProcess.current.pid,
            audioFilePath,
            timestamps: { startedAt: new Date().toISOString() },
          });
        } catch {}
      } else {
        error("AudioRecorder", "Failed to start Sox process");
        throw new Error("Failed to start Sox process");
      }

      await showToast({
        style: Toast.Style.Success,
        title: "Recording started",
        message: "Press Cmd+R to stop recording",
      });

      debug("AudioRecorder", "🐛 DEBUG: startRecording() completed successfully", {
        audioFilePath,
      });
      return audioFilePath;
    } catch (error) {
      console.error("Failed to start recording:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to start recording",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      setState({
        isRecording: false,
        isPaused: false,
        duration: 0,
      });
      throw error;
    }
  }, []);

  // 停止录音
  const stopRecording = useCallback(async () => {
    debug("AudioRecorder", "🐛 DEBUG: stopRecording() called", {
      isRecording: state.isRecording,
      processExists: !!recordingProcess.current,
    });

    if (!state.isRecording || !recordingProcess.current) {
      debug(
        "AudioRecorder",
        "🐛 DEBUG: stopRecording() early return - not recording or no process"
      );
      return null;
    }

    try {
      // 停止计时
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      // 终止录音进程
      recordingProcess.current.kill("SIGTERM");
      recordingProcess.current = null;

      setState((prev) => ({
        ...prev,
        isRecording: false,
        isPaused: false,
      }));

      try {
        ensureBackgroundPaths();
        writeBgStatus({
          status: "stopped",
          audioFilePath: state.audioFilePath,
          timestamps: { startedAt: undefined, stoppedAt: new Date().toISOString() },
        });
      } catch {}

      await showToast({
        style: Toast.Style.Success,
        title: "Recording stopped",
        message: `Duration: ${state.duration}s`,
      });

      return state.audioFilePath;
    } catch (error) {
      console.error("Failed to stop recording:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to stop recording",
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return null;
    }
  }, [state.isRecording, state.duration, state.audioFilePath]);

  // 暂停录音 (Sox不支持暂停，这里只是UI状态)
  const pauseRecording = useCallback(() => {
    if (!state.isRecording || state.isPaused) {
      return;
    }

    setState((prev) => ({ ...prev, isPaused: true }));

    if (durationInterval.current) {
      clearInterval(durationInterval.current);
      durationInterval.current = null;
    }
  }, [state.isRecording, state.isPaused]);

  // 恢复录音
  const resumeRecording = useCallback(() => {
    if (!state.isRecording || !state.isPaused) {
      return;
    }

    setState((prev) => ({ ...prev, isPaused: false }));

    // 恢复计时
    startTime.current = Date.now() - state.duration * 1000;
    durationInterval.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime.current) / 1000);
      setState((prev) => ({ ...prev, duration: elapsed }));
    }, 100);
  }, [state.isRecording, state.isPaused, state.duration]);

  // 格式化时长
  const formatDuration = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, []);

  return {
    state,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    formatDuration,
  };
}
