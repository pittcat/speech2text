import { MenuBarExtra, Icon, showToast, Toast, launchCommand, LaunchType } from "@raycast/api";
import { useEffect, useState, useRef } from "react";
import { getStatus as getBgStatus, writeStatus as writeBgStatus } from "./utils/background-task";

type BgStatus = ReturnType<typeof getBgStatus>;

export default function MenuBarStatus() {
  const [status, setStatus] = useState<BgStatus>({ status: "idle" } as BgStatus);
  // 仅用于展示状态，不做任何自动跳转

  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const s = getBgStatus();
        setStatus(s);
      } catch {}
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const symbol =
    status.status === "recording"
      ? "⏺"
      : status.status === "transcribing"
        ? "🔄"
        : status.status === "completed"
          ? "✅"
          : status.status === "error"
            ? "⚠️"
            : "•";

  return (
    <MenuBarExtra title={symbol} tooltip="Speech to Text 状态">
      <MenuBarExtra.Item
        title="打开录音界面"
        icon={Icon.Microphone}
        onAction={() => launchCommand({ name: "record-transcription", type: LaunchType.UserInitiated })}
      />
      {status.status === "recording" && typeof status.pid === "number" && (
        <MenuBarExtra.Item
          title="停止录音"
          icon={Icon.Stop}
          onAction={async () => {
            try {
              process.kill(status.pid as number, "SIGTERM");
              writeBgStatus({ status: "stopped", audioFilePath: status.audioFilePath });
              await showToast({ style: Toast.Style.Success, title: "已停止录音" });
            } catch (e) {
              await showToast({ style: Toast.Style.Failure, title: "停止失败", message: e instanceof Error ? e.message : "Unknown error" });
            }
          }}
        />
      )}
      {status.status === "error" && (
        <MenuBarExtra.Item
          title={"错误: " + (status.error || "未知错误")}
          icon={Icon.ExclamationMark}
        />
      )}
      <MenuBarExtra.Separator />
      <MenuBarExtra.Item
        title="查看历史"
        icon={Icon.Clock}
        onAction={() => launchCommand({ name: "transcription-history", type: LaunchType.UserInitiated })}
      />
    </MenuBarExtra>
  );
}
