import { environment } from "@raycast/api";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

export type BgStatus = {
  status?: "idle" | "recording" | "stopped" | "transcribing" | "completed" | "error";
  pid?: number;
  audioFilePath?: string;
  text?: string;
  error?: string;
  timestamps?: { startedAt?: string; stoppedAt?: string; transcribeStartAt?: string; completedAt?: string };
};

const BG_DIR = join(environment.supportPath, "bg-task");
const STATUS_FILE = join(BG_DIR, "status.json");

export function ensureBackgroundPaths() {
  if (!existsSync(BG_DIR)) mkdirSync(BG_DIR, { recursive: true });
}

export function getStatus(): BgStatus {
  try {
    if (!existsSync(STATUS_FILE)) return { status: "idle" };
    const raw = readFileSync(STATUS_FILE, "utf-8");
    return JSON.parse(raw) as BgStatus;
  } catch {
    return { status: "idle" };
  }
}

export function writeStatus(s: Partial<BgStatus>) {
  ensureBackgroundPaths();
  let current: BgStatus = {};
  try {
    if (existsSync(STATUS_FILE)) {
      current = JSON.parse(readFileSync(STATUS_FILE, "utf-8"));
    }
  } catch {}
  const next: BgStatus = { ...current, ...s };
  writeFileSync(STATUS_FILE, JSON.stringify(next, null, 2), "utf-8");
}

export function getStatusFilePath() {
  return STATUS_FILE;
}

