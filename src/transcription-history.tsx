import { useState, useEffect } from "react";
import {
  List,
  ActionPanel,
  Action,
  Icon,
  showToast,
  Toast,
  Clipboard,
  confirmAlert,
  Alert,
  Detail,
  useNavigation,
  LocalStorage,
  launchCommand,
  LaunchType,
} from "@raycast/api";
import {
  loadHistory,
  deleteHistoryItem,
  clearHistory,
  searchHistory,
  updateHistoryItem,
  exportHistory,
  getHistoryStats,
} from "./utils/history";
import { retranscribeAudio } from "./utils/ai/transcription";
import { debug } from "./utils/logger";
import { hashText } from "./utils/hash";
import {
  formatTimestamp,
  formatRelativeTime,
  groupTranscriptionsByDate,
  formatTranscriptionMetadata,
} from "./utils/formatting";
import { formatDuration } from "./utils/audio";
import { TranscriptionHistoryItem } from "./types";
import { existsSync } from "fs";

export default function TranscriptionHistory() {
  const { push } = useNavigation();
  const [items, setItems] = useState<TranscriptionHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchText, setSearchText] = useState("");

  // 加载历史记录
  useEffect(() => {
    loadHistoryItems();
  }, []);

  const loadHistoryItems = async () => {
    setIsLoading(true);
    try {
      const history = loadHistory();
      setItems(history);
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Failed to load history",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 搜索历史记录
  const filteredItems = searchText ? searchHistory(searchText) : items;

  // 按日期分组
  const groupedItems = groupTranscriptionsByDate(filteredItems);

  // 删除单个项目
  const handleDelete = async (item: TranscriptionHistoryItem) => {
    const confirmed = await confirmAlert({
      title: "Delete Transcription",
      message: "Are you sure you want to delete this transcription?",
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      const success = await deleteHistoryItem(item.id);
      if (success) {
        await showToast({
          style: Toast.Style.Success,
          title: "Transcription deleted",
        });
        loadHistoryItems();
      }
    }
  };

  // 清空历史记录
  const handleClearHistory = async () => {
    const confirmed = await confirmAlert({
      title: "Clear All History",
      message: "Are you sure you want to delete all transcriptions? This action cannot be undone.",
      primaryAction: {
        title: "Clear All",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (confirmed) {
      const success = await clearHistory();
      if (success) {
        await showToast({
          style: Toast.Style.Success,
          title: "History cleared",
        });
        loadHistoryItems();
      }
    }
  };

  // 重新转写
  const handleRetranscribe = async (item: TranscriptionHistoryItem) => {
    if (!item.audioFilePath || !existsSync(item.audioFilePath)) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Audio file not found",
        message: "Cannot retranscribe without audio file",
      });
      return;
    }

    try {
      await showToast({
        style: Toast.Style.Animated,
        title: "Retranscribing...",
      });

      const result = await retranscribeAudio(item.audioFilePath);

      // 更新历史记录
      const success = updateHistoryItem(item.id, {
        text: result.text,
        timestamp: result.timestamp,
        metadata: result.metadata,
      });

      if (success) {
        await showToast({
          style: Toast.Style.Success,
          title: "Retranscription completed",
        });
        await Clipboard.copy(result.text);
        loadHistoryItems();
      }
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Retranscription failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // 导出历史记录
  const handleExport = async () => {
    try {
      const exportData = exportHistory(filteredItems);
      await Clipboard.copy(exportData);
      await showToast({
        style: Toast.Style.Success,
        title: "History exported",
        message: "JSON data copied to clipboard",
      });
    } catch (error) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Export failed",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  // 显示统计信息
  const handleShowStats = () => {
    const stats = getHistoryStats();
    push(<HistoryStats stats={stats} />);
  };

  return (
    <List
      isLoading={isLoading}
      searchText={searchText}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search transcriptions..."
    >
      {Object.entries(groupedItems).map(([group, groupItems]) => (
        <List.Section key={group} title={group}>
          {groupItems.map((item) => (
            <List.Item
              key={item.id}
              title={item.title}
              subtitle={formatTranscriptionMetadata(item)}
              accessories={
                [
                  {
                    text: formatRelativeTime(item.timestamp),
                    tooltip: formatTimestamp(item.timestamp),
                  },
                  item.audioFilePath && existsSync(item.audioFilePath)
                    ? { icon: Icon.Microphone, tooltip: "Audio file available" }
                    : null,
                ].filter(Boolean) as Array<
                  { text: string; tooltip: string } | { icon: Icon; tooltip: string }
                >
              }
              actions={
                <ActionPanel>
                  {/* 默认：进入录音界面并自动润色（Enter） */}
                  <Action
                    title="Open in Editor and Polish"
                    icon={Icon.Wand}
                    onAction={async () => {
                      debug("History", "Open in Editor and Polish", { id: item.id, textLen: item.text.length, hash: hashText(item.text) });
                      await LocalStorage.setItem("incomingText", item.text);
                      await LocalStorage.setItem("incomingAutoPolish", "true");
                      await LocalStorage.setItem("incomingNonce", String(Date.now()));
                      await launchCommand({ name: "record-transcription", type: LaunchType.UserInitiated });
                    }}
                  />

                  {/* 仅进入录音界面，不自动润色 */}
                  <Action
                    title="Open in Editor"
                    icon={Icon.Microphone}
                    shortcut={{ modifiers: ["cmd"], key: "o" }}
                    onAction={async () => {
                      debug("History", "Open in Editor", { id: item.id, textLen: item.text.length, hash: hashText(item.text) });
                      await LocalStorage.setItem("incomingText", item.text);
                      await LocalStorage.setItem("incomingAutoPolish", "false");
                      await LocalStorage.setItem("incomingNonce", String(Date.now()));
                      await launchCommand({ name: "record-transcription", type: LaunchType.UserInitiated });
                    }}
                  />

                  <ActionPanel.Section>
                    <Action
                      title="Copy Text"
                      icon={Icon.Clipboard}
                      onAction={() => Clipboard.copy(item.text)}
                      shortcut={{ modifiers: ["cmd"], key: "c" }}
                    />
                    <Action.Push
                      title="View Details"
                      icon={Icon.Eye}
                      target={<TranscriptionDetail item={item} />}
                    />
                  </ActionPanel.Section>

                  <ActionPanel.Section>
                    {item.audioFilePath && existsSync(item.audioFilePath) && (
                      <Action
                        title="Retranscribe"
                        icon={Icon.ArrowClockwise}
                        onAction={() => handleRetranscribe(item)}
                        shortcut={{ modifiers: ["cmd"], key: "r" }}
                      />
                    )}
                    <Action
                      title="Delete"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      onAction={() => handleDelete(item)}
                      shortcut={{ modifiers: ["cmd"], key: "delete" }}
                    />
                  </ActionPanel.Section>

                  <ActionPanel.Section>
                    <Action
                      title="Export All"
                      icon={Icon.Download}
                      onAction={handleExport}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "e" }}
                    />
                    <Action
                      title="Show Statistics"
                      icon={Icon.BarChart}
                      onAction={handleShowStats}
                      shortcut={{ modifiers: ["cmd"], key: "s" }}
                    />
                    <Action
                      title="Clear All History"
                      icon={Icon.Trash}
                      style={Action.Style.Destructive}
                      onAction={handleClearHistory}
                      shortcut={{ modifiers: ["cmd", "shift"], key: "delete" }}
                    />
                  </ActionPanel.Section>
                </ActionPanel>
              }
            />
          ))}
        </List.Section>
      ))}

      {filteredItems.length === 0 && !isLoading && (
        <List.EmptyView
          title={searchText ? "No results found" : "No transcriptions yet"}
          description={
            searchText
              ? "Try a different search term"
              : "Record your first transcription to get started"
          }
          icon={Icon.Microphone}
        />
      )}
    </List>
  );
}

// 转写详情组件
function TranscriptionDetail({ item }: { item: TranscriptionHistoryItem }) {
  const markdown = `
# ${item.title}

${item.text}

---

## Metadata

- **Date**: ${formatTimestamp(item.timestamp)}
- **Provider**: ${item.metadata?.provider || "Unknown"}
- **Model**: ${item.metadata?.model || "Unknown"}
${item.metadata?.duration ? `- **Duration**: ${formatDuration(item.metadata.duration)}` : ""}
${item.metadata?.language ? `- **Language**: ${item.metadata.language}` : ""}
${item.audioFilePath && existsSync(item.audioFilePath) ? `- **Audio File**: Available` : ""}
  `;

  return (
    <Detail
      markdown={markdown}
      actions={
        <ActionPanel>
          <Action
            title="Copy Text"
            icon={Icon.Clipboard}
            onAction={() => Clipboard.copy(item.text)}
            shortcut={{ modifiers: ["cmd"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}

// 统计信息组件
function HistoryStats({ stats }: { stats: ReturnType<typeof getHistoryStats> }) {
  const markdown = `
# Transcription Statistics

## Overview
- **Total Transcriptions**: ${stats.total}
- **Total Duration**: ${formatDuration(stats.totalDuration)}
- **Today**: ${stats.today}
- **This Week**: ${stats.thisWeek}
- **This Month**: ${stats.thisMonth}

## By Provider
${Object.entries(stats.byProvider)
  .map(([provider, count]) => `- **${provider}**: ${count}`)
  .join("\n")}

## By Model
${Object.entries(stats.byModel)
  .map(([model, count]) => `- **${model}**: ${count}`)
  .join("\n")}
  `;

  return <Detail markdown={markdown} navigationTitle="Statistics" />;
}
