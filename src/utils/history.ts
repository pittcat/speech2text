import { readFileSync, writeFileSync, existsSync } from "fs";
import { TranscriptionHistoryItem, TranscriptionResult } from "../types";
import { STORAGE_PATH } from "../constants";
import { generateTranscriptionTitle } from "./formatting";
import { deleteAudioFile } from "./audio";

// 加载历史记录
export function loadHistory(): TranscriptionHistoryItem[] {
  try {
    if (!existsSync(STORAGE_PATH.HISTORY_FILE)) {
      return [];
    }

    const data = readFileSync(STORAGE_PATH.HISTORY_FILE, "utf-8");
    return JSON.parse(data) as TranscriptionHistoryItem[];
  } catch (error) {
    console.error("Failed to load history:", error);
    return [];
  }
}

// 保存历史记录
function saveHistory(history: TranscriptionHistoryItem[]): boolean {
  try {
    writeFileSync(STORAGE_PATH.HISTORY_FILE, JSON.stringify(history, null, 2));
    return true;
  } catch (error) {
    console.error("Failed to save history:", error);
    return false;
  }
}

// 添加到历史记录
export function addToHistory(result: TranscriptionResult): TranscriptionHistoryItem {
  const history = loadHistory();

  const item: TranscriptionHistoryItem = {
    ...result,
    id: generateId(),
    title: generateTranscriptionTitle(result.text),
  };

  // 添加到开头
  history.unshift(item);

  // 限制历史记录数量（保留最近100条）
  if (history.length > 100) {
    // 删除超出的记录及其音频文件
    const removed = history.splice(100);
    removed.forEach(async (item) => {
      if (item.audioFilePath) {
        await deleteAudioFile(item.audioFilePath);
      }
    });
  }

  saveHistory(history);
  return item;
}

// 更新历史记录项
export function updateHistoryItem(id: string, updates: Partial<TranscriptionHistoryItem>): boolean {
  const history = loadHistory();
  const index = history.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  history[index] = {
    ...history[index],
    ...updates,
    // 如果文本更新了，重新生成标题
    title: updates.text ? generateTranscriptionTitle(updates.text) : history[index].title,
  };

  return saveHistory(history);
}

// 删除历史记录项
export async function deleteHistoryItem(id: string): Promise<boolean> {
  const history = loadHistory();
  const index = history.findIndex((item) => item.id === id);

  if (index === -1) {
    return false;
  }

  const item = history[index];

  // 删除关联的音频文件
  if (item.audioFilePath && existsSync(item.audioFilePath)) {
    await deleteAudioFile(item.audioFilePath);
  }

  // 从历史记录中移除
  history.splice(index, 1);

  return saveHistory(history);
}

// 清空历史记录
export async function clearHistory(): Promise<boolean> {
  const history = loadHistory();

  // 删除所有音频文件
  for (const item of history) {
    if (item.audioFilePath && existsSync(item.audioFilePath)) {
      await deleteAudioFile(item.audioFilePath);
    }
  }

  // 清空历史记录
  return saveHistory([]);
}

// 搜索历史记录
export function searchHistory(query: string): TranscriptionHistoryItem[] {
  const history = loadHistory();
  const searchTerm = query.toLowerCase();

  return history.filter(
    (item) =>
      item.text.toLowerCase().includes(searchTerm) || item.title.toLowerCase().includes(searchTerm)
  );
}

// 生成唯一ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// 导出历史记录
export function exportHistory(items?: TranscriptionHistoryItem[]): string {
  const history = items || loadHistory();

  const exportData = history.map((item) => ({
    date: new Date(item.timestamp).toISOString(),
    text: item.text,
    provider: item.metadata?.provider,
    model: item.metadata?.model,
    duration: item.metadata?.duration,
  }));

  return JSON.stringify(exportData, null, 2);
}

// 获取历史记录统计
export function getHistoryStats() {
  const history = loadHistory();

  const stats = {
    total: history.length,
    totalDuration: 0,
    byProvider: {} as Record<string, number>,
    byModel: {} as Record<string, number>,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  };

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(todayStart.getDate() - todayStart.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  history.forEach((item) => {
    // 统计总时长
    if (item.metadata?.duration) {
      stats.totalDuration += item.metadata.duration;
    }

    // 按提供商统计
    if (item.metadata?.provider) {
      stats.byProvider[item.metadata.provider] =
        (stats.byProvider[item.metadata.provider] || 0) + 1;
    }

    // 按模型统计
    if (item.metadata?.model) {
      stats.byModel[item.metadata.model] = (stats.byModel[item.metadata.model] || 0) + 1;
    }

    // 时间统计
    const itemDate = new Date(item.timestamp);
    if (itemDate >= todayStart) stats.today++;
    if (itemDate >= weekStart) stats.thisWeek++;
    if (itemDate >= monthStart) stats.thisMonth++;
  });

  return stats;
}
