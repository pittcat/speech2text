import { useEffect, useState } from "react";
import {
  ActionPanel,
  Action,
  List,
  Detail,
  Icon,
  showToast,
  Toast,
  getPreferenceValues,
  open,
} from "@raycast/api";
import { readFileSync, existsSync } from "fs";
import { logger } from "./utils/logger";

interface LogEntry {
  timestamp: string;
  level: string;
  sessionId: string;
  component: string;
  message: string;
  data?: any;
  raw: string;
}

export default function ViewLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<string | null>(null);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      const logFiles = logger.getLogFiles();
      const currentLogFile = logger.getLogFilePath();

      // 读取最新的日志文件
      const logFile = selectedLog || currentLogFile;

      if (existsSync(logFile)) {
        const content = readFileSync(logFile, "utf-8");
        const lines = content.split("\n").filter((line) => line.trim());

        // 解析日志行
        const parsedLogs: LogEntry[] = lines
          .map((line) => {
            const match = line.match(/\[(.*?)\] \[(.*?)\] \[(.*?)\] \[(.*?)\] (.*)/);
            if (match) {
              const [, timestamp, level, sessionId, component, messageAndData] = match;
              const dataIndex = messageAndData.indexOf(" | {");
              const message =
                dataIndex > -1 ? messageAndData.substring(0, dataIndex) : messageAndData;
              const dataStr = dataIndex > -1 ? messageAndData.substring(dataIndex + 3) : null;

              let data = null;
              if (dataStr) {
                try {
                  data = JSON.parse(dataStr);
                } catch {
                  // 忽略解析错误
                }
              }

              return {
                timestamp,
                level,
                sessionId,
                component,
                message,
                data,
                raw: line,
              };
            }

            return {
              timestamp: new Date().toISOString(),
              level: "INFO",
              sessionId: "",
              component: "Unknown",
              message: line,
              raw: line,
            };
          })
          .reverse(); // 最新的日志在最前面

        setLogs(parsedLogs);
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load logs",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case "ERROR":
        return { source: Icon.XMarkCircle, tintColor: "#FF0000" };
      case "WARN":
        return { source: Icon.ExclamationMark, tintColor: "#FFA500" };
      case "INFO":
        return { source: Icon.Info, tintColor: "#0000FF" };
      case "DEBUG":
        return { source: Icon.Bug, tintColor: "#808080" };
      case "TRACE":
        return { source: Icon.Footprints, tintColor: "#A0A0A0" };
      default:
        return Icon.Document;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString();
    } catch {
      return timestamp;
    }
  };

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search logs..."
      navigationTitle="Speech to Text Logs"
    >
      {logs.map((log, index) => (
        <List.Item
          key={index}
          title={log.message}
          subtitle={log.component}
          accessories={[
            { text: formatTimestamp(log.timestamp) },
            { icon: getLevelIcon(log.level) },
          ]}
          actions={
            <ActionPanel>
              <Action.Push title="View Details" icon={Icon.Eye} target={<LogDetail log={log} />} />
              <Action
                title="Copy Log Entry"
                icon={Icon.Clipboard}
                onAction={() => {
                  const logText = log.data
                    ? `${log.raw}\nData: ${JSON.stringify(log.data, null, 2)}`
                    : log.raw;
                  Clipboard.copy(logText);
                  showToast({
                    style: Toast.Style.Success,
                    title: "Log entry copied",
                  });
                }}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
              <Action
                title="Open Log File"
                icon={Icon.Finder}
                onAction={() => open(logger.getLogFilePath())}
                shortcut={{ modifiers: ["cmd"], key: "o" }}
              />
              <Action
                title="Refresh Logs"
                icon={Icon.ArrowClockwise}
                onAction={loadLogs}
                shortcut={{ modifiers: ["cmd"], key: "r" }}
              />
            </ActionPanel>
          }
        />
      ))}

      {logs.length === 0 && !isLoading && (
        <List.EmptyView
          title="No logs found"
          description="Start using the plugin to generate logs"
          icon={Icon.Document}
        />
      )}
    </List>
  );
}

function LogDetail({ log }: { log: LogEntry }) {
  const markdown = `
# Log Entry Details

## Basic Information
- **Timestamp**: ${log.timestamp}
- **Level**: ${log.level}
- **Component**: ${log.component}
- **Session ID**: ${log.sessionId}

## Message
${log.message}

${log.data ? `## Data\n\`\`\`json\n${JSON.stringify(log.data, null, 2)}\n\`\`\`` : ""}

## Raw Log
\`\`\`
${log.raw}
\`\`\`
`;

  return (
    <Detail
      markdown={markdown}
      navigationTitle="Log Details"
      actions={
        <ActionPanel>
          <Action
            title="Copy Log Entry"
            icon={Icon.Clipboard}
            onAction={() => {
              Clipboard.copy(log.raw);
              showToast({
                style: Toast.Style.Success,
                title: "Log entry copied",
              });
            }}
          />
        </ActionPanel>
      }
    />
  );
}

// 导入 Clipboard
import { Clipboard } from "@raycast/api";
