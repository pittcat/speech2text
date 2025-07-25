import { useState, useEffect, useRef } from "react";
import { ChildProcess, spawn } from "child_process";
import {
  generateAudioFilename,
  ensureTempDirectory,
  checkSoxInstalled,
  buildSoxCommand,
  validateAudioFile,
} from "../utils/audio";
import { showToast, Toast } from "@raycast/api";
import { showFailureToast } from "@raycast/utils";
import { ErrorTypes } from "../types";

interface AudioRecorderHook {
  isRecording: boolean;
  recordingDuration: number;
  recordingPath: string | null;
  error: string | null;
  startRecording: () => Promise<string | null>;
  stopRecording: () => Promise<string | null>;
}

export function useAudioRecorder(): AudioRecorderHook {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordingPath, setRecordingPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recordingProcess = useRef<ChildProcess | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);
  const isIntentionalStop = useRef<boolean>(false);

  useEffect(() => {
    const checkSox = async () => {
      const soxPath = await checkSoxInstalled();
      if (!soxPath) {
        setError(ErrorTypes.SOX_NOT_INSTALLED);
      }
    };

    checkSox();

    return () => {
      if (isRecording) void stopRecording();
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    };
  }, []);

  const startRecording = async (): Promise<string | null> => {
    setError(null);

    if (isRecording) {
      await showFailureToast(ErrorTypes.ALREADY_RECORDING, {
        title: "Already Recording",
      });
      return null;
    }

    const soxPath = await checkSoxInstalled();
    if (!soxPath) {
      setError(ErrorTypes.SOX_NOT_INSTALLED);
      return null;
    }

    try {
      const tempDir = await ensureTempDirectory();
      const outputPath = generateAudioFilename(tempDir);
      console.log("Recording to file:", outputPath);
      setRecordingPath(outputPath);

      console.log("Starting recording with Sox");
      recordingProcess.current = spawn(soxPath, buildSoxCommand(outputPath));

      // 添加进程状态监控
      if (recordingProcess.current) {
        console.log(`Process created successfully. Initial state: killed=${recordingProcess.current.killed}, exitCode=${recordingProcess.current.exitCode}`);
        
        // 定期检查进程状态
        const processCheckInterval = setInterval(() => {
          if (recordingProcess.current) {
            console.log(`Process status check: PID=${recordingProcess.current.pid}, killed=${recordingProcess.current.killed}, exitCode=${recordingProcess.current.exitCode}, recording=${isRecording}, duration=${recordingDuration}s`);
          } else {
            console.log("Process reference lost during recording");
            clearInterval(processCheckInterval);
          }
        }, 3000); // 每3秒检查一次
        
        // 保存间隔ID以便在停止录音时清理
        (recordingProcess.current as any).statusCheckInterval = processCheckInterval;
      }

      recordingProcess.current.stdout?.on("data", (data) => {
        console.log(`Sox stdout: ${data}`);
      });

      recordingProcess.current.stderr?.on("data", (data) => {
        console.error(`Sox stderr: ${data}`);
      });

      recordingProcess.current?.on("error", (error) => {
        console.error(`Sox process error: ${error.message}`);
        console.log(`Recording state when error occurred: isRecording=${isRecording}, intentionalStop=${isIntentionalStop.current}`);
        setError(`${ErrorTypes.RECORDING_PROCESS_ERROR}: ${error.message}`);

        if (durationInterval.current) {
          clearInterval(durationInterval.current);
          durationInterval.current = null;
        }

        setIsRecording(false);
      });

      recordingProcess.current?.on("close", (code) => {
        console.log(`Sox process exited with code ${code}`);
        console.log(`Recording state when close occurred: isRecording=${isRecording}, intentionalStop=${isIntentionalStop.current}, duration=${recordingDuration}s`);

        if (code !== 0 && isRecording && !isIntentionalStop.current) {
          console.error(`Recording process exited unexpectedly with code ${code} after ${recordingDuration} seconds`);
          setError(`Recording process exited unexpectedly with code ${code}`);

          if (durationInterval.current) {
            clearInterval(durationInterval.current);
            durationInterval.current = null;
          }

          setIsRecording(false);
        } else if (code === 0 && !isIntentionalStop.current) {
          console.log(`Sox process completed normally but was not intentionally stopped. This might indicate an issue.`);
        }
        isIntentionalStop.current = false;
      });

      recordingProcess.current?.on("exit", (code, signal) => {
        console.log(`Sox process exited with code ${code} and signal ${signal}`);
        console.log(`Recording state when exit occurred: isRecording=${isRecording}, intentionalStop=${isIntentionalStop.current}, duration=${recordingDuration}s`);
      });

      setRecordingDuration(0);
      durationInterval.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      setIsRecording(true);

      await showToast({
        style: Toast.Style.Success,
        title: "Recording started",
      });

      return outputPath;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error starting recording:", error);

      await showFailureToast(error, {
        title: "Failed to start recording",
      });

      setError(`${ErrorTypes.RECORDING_START_ERROR}: ${errorMessage}`);
      return null;
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!isRecording || !recordingProcess.current) {
      console.log(`Stop recording called but conditions not met: isRecording=${isRecording}, process=${!!recordingProcess.current}`);
      return null;
    }

    const currentRecordingPath = recordingPath;
    console.log("Stopping recording, current path:", currentRecordingPath);
    console.log(`Recording duration when stopping: ${recordingDuration} seconds`);

    try {
      isIntentionalStop.current = true;
      
      // 清理进程状态监控间隔
      if ((recordingProcess.current as any).statusCheckInterval) {
        clearInterval((recordingProcess.current as any).statusCheckInterval);
        console.log("Cleared process status check interval");
      }
      
      recordingProcess.current.kill();
      console.log("Sent kill signal to Sox process");
      recordingProcess.current = null;

      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }

      setIsRecording(false);
      console.log("Recording state set to false");

      await new Promise((resolve) => setTimeout(resolve, 500));

      if (currentRecordingPath) {
        const validationResult = await validateAudioFile(currentRecordingPath);

        if (!validationResult.isValid) {
          await showFailureToast(validationResult.error ?? ErrorTypes.INVALID_RECORDING, {
            title: "Invalid Recording",
          });
          setError(validationResult.error ?? ErrorTypes.INVALID_RECORDING);
          return null;
        }

        await showToast({
          style: Toast.Style.Success,
          title: "Recording stopped",
          message: `Duration: ${recordingDuration} seconds`,
        });

        console.log("Returning recording path:", currentRecordingPath);
        return currentRecordingPath;
      } else {
        await showFailureToast(ErrorTypes.NO_RECORDING_FILE, {
          title: "Recording Failed",
        });
        setError(ErrorTypes.NO_RECORDING_FILE);
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error stopping recording:", error);

      await showFailureToast(error, {
        title: "Failed to stop recording",
      });

      setError(`${ErrorTypes.RECORDING_STOP_ERROR}: ${errorMessage}`);
      setIsRecording(false);
      return null;
    }
  };

  return {
    isRecording,
    recordingDuration,
    recordingPath,
    error,
    startRecording,
    stopRecording,
  };
}
