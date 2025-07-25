import { TranscriptionHistoryItem } from "../types";

// 生成转写标题（取前50个字符）
export function generateTranscriptionTitle(text: string): string {
  const cleanText = text.trim().replace(/\n/g, " ");
  if (cleanText.length <= 50) {
    return cleanText;
  }
  return cleanText.substring(0, 47) + "...";
}

// 格式化时间戳
export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();

  // 同一天
  if (isSameDay(date, now)) {
    return formatTime(date);
  }

  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `Yesterday ${formatTime(date)}`;
  }

  // 本周
  if (isThisWeek(date, now)) {
    return `${getDayName(date)} ${formatTime(date)}`;
  }

  // 本年
  if (date.getFullYear() === now.getFullYear()) {
    return formatDateWithoutYear(date);
  }

  // 其他
  return formatFullDate(date);
}

// 格式化相对时间
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "just now";
  } else if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  } else if (hours < 24) {
    return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  } else if (days < 7) {
    return `${days} day${days === 1 ? "" : "s"} ago`;
  } else {
    return formatTimestamp(timestamp);
  }
}

// 按日期分组转写历史
export function groupTranscriptionsByDate(
  items: TranscriptionHistoryItem[]
): Record<string, TranscriptionHistoryItem[]> {
  const groups: Record<string, TranscriptionHistoryItem[]> = {};
  const now = new Date();

  items.forEach((item) => {
    const date = new Date(item.timestamp);
    let groupKey: string;

    if (isSameDay(date, now)) {
      groupKey = "Today";
    } else {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      if (isSameDay(date, yesterday)) {
        groupKey = "Yesterday";
      } else if (isThisWeek(date, now)) {
        groupKey = "This Week";
      } else if (isThisMonth(date, now)) {
        groupKey = "This Month";
      } else {
        groupKey = formatMonthYear(date);
      }
    }

    if (!groups[groupKey]) {
      groups[groupKey] = [];
    }
    groups[groupKey].push(item);
  });

  return groups;
}

// 辅助函数
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isThisWeek(date: Date, now: Date): boolean {
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return date >= weekStart && date <= weekEnd;
}

function isThisMonth(date: Date, now: Date): boolean {
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateWithoutYear(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatFullDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMonthYear(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });
}

function getDayName(date: Date): string {
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

// 格式化转写元数据
export function formatTranscriptionMetadata(item: TranscriptionHistoryItem): string {
  const parts: string[] = [];

  if (item.metadata?.provider) {
    parts.push(item.metadata.provider.charAt(0).toUpperCase() + item.metadata.provider.slice(1));
  }

  if (item.metadata?.model) {
    parts.push(item.metadata.model);
  }

  if (item.metadata?.duration) {
    const duration = Math.round(item.metadata.duration);
    parts.push(`${duration}s`);
  }

  return parts.join(" • ");
}
