import { createHash } from "crypto";

export function hashText(text: string): string {
  try {
    return createHash("sha256").update(text, "utf8").digest("hex").slice(0, 16);
  } catch {
    // 兜底：简单校验和
    let sum = 0;
    for (let i = 0; i < text.length; i++) sum = (sum + text.charCodeAt(i)) & 0xffffffff;
    return sum.toString(16);
  }
}

