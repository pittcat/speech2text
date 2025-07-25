import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { environment, getPreferenceValues } from "@raycast/api";
import { TranscriptionPreferences } from "../types";

// 配置文件路径
const CONFIG_FILE = join(environment.supportPath, "credentials.json");

// 凭证接口
export interface Credentials {
  doubao?: {
    appKey: string;
    accessToken: string;
    secretKey: string;
  };
}

// 加载保存的凭证
export function loadCredentials(): Credentials {
  try {
    console.log("🔧 Config: Loading credentials from:", CONFIG_FILE);
    console.log("🔧 Config: File exists?", existsSync(CONFIG_FILE));
    
    if (!existsSync(CONFIG_FILE)) {
      console.log("🔧 Config: File does not exist, returning empty credentials");
      return {};
    }
    
    const data = readFileSync(CONFIG_FILE, "utf-8");
    console.log("🔧 Config: File content length:", data.length);
    console.log("🔧 Config: File content preview:", data.substring(0, 100));
    
    const parsed = JSON.parse(data) as Credentials;
    console.log("🔧 Config: Parsed credentials:", {
      hasDoubao: !!parsed.doubao,
      hasAppKey: !!parsed.doubao?.appKey,
      hasAccessToken: !!parsed.doubao?.accessToken,
      hasSecretKey: !!parsed.doubao?.secretKey,
    });
    
    return parsed;
  } catch (error) {
    console.error("🔧 Config: Failed to load credentials:", error);
    return {};
  }
}

// 保存凭证
export function saveCredentials(credentials: Credentials): boolean {
  try {
    writeFileSync(CONFIG_FILE, JSON.stringify(credentials, null, 2));
    return true;
  } catch (error) {
    console.error("Failed to save credentials:", error);
    return false;
  }
}

// 保存豆包凭证
export function saveDoubaoCredentials(appKey: string, accessToken: string, secretKey: string): boolean {
  try {
    console.log("🔧 Config: Starting to save Doubao credentials", {
      appKey: appKey ? `${appKey.substring(0, 4)}****` : "empty",
      accessToken: accessToken ? `${accessToken.substring(0, 4)}****` : "empty",
      secretKey: secretKey ? `${secretKey.substring(0, 4)}****` : "empty",
    });

    const credentials = loadCredentials();
    console.log("🔧 Config: Loaded existing credentials", {
      hasDoubao: !!credentials.doubao,
    });

    credentials.doubao = { appKey, accessToken, secretKey };
    console.log("🔧 Config: Updated credentials object");

    const result = saveCredentials(credentials);
    console.log("🔧 Config: Save result", { success: result });

    return result;
  } catch (error) {
    console.error("🔧 Config: Error saving Doubao credentials", error);
    return false;
  }
}

// 检查豆包凭证是否已配置（使用与getPreferences相同的合并逻辑）
export function isDoubaoConfigured(): boolean {
  try {
    console.log("🔧 Config: Checking if Doubao is configured");
    
    // 导入logger来写入日志文件
    const { info } = require("../utils/logger");
    
    const prefs = getPreferenceValues<TranscriptionPreferences>();
    const doubaoCredentials = getDoubaoCredentials();
    
    console.log("🔧 Config: Raw Raycast preferences", {
      hasAppKey: !!prefs.doubaoAppKey,
      hasAccessToken: !!prefs.doubaoAccessToken,
      hasSecretKey: !!prefs.doubaoSecretKey,
    });
    
    console.log("🔧 Config: Local credentials", {
      hasCredentials: !!doubaoCredentials,
      hasAppKey: !!doubaoCredentials?.appKey,
      hasAccessToken: !!doubaoCredentials?.accessToken,
      hasSecretKey: !!doubaoCredentials?.secretKey,
    });
    
    // 使用与getPreferences相同的合并逻辑
    const finalAppKey = prefs.doubaoAppKey || doubaoCredentials?.appKey;
    const finalAccessToken = prefs.doubaoAccessToken || doubaoCredentials?.accessToken;
    const finalSecretKey = prefs.doubaoSecretKey || doubaoCredentials?.secretKey;
    
    const isConfigured = !!(finalAppKey && finalAccessToken && finalSecretKey);
    
    console.log("🔧 Config: Final merged check", {
      hasAppKey: !!finalAppKey,
      hasAccessToken: !!finalAccessToken,
      hasSecretKey: !!finalSecretKey,
      isConfigured,
    });
    
    info("Config", "Configuration check result", { isConfigured });
    
    return isConfigured;
  } catch (error) {
    console.error("🔧 Config: Error checking configuration", error);
    // 如果无法获取preferences，回退到只检查本地配置
    const credentials = loadCredentials();
    const fallbackResult = !!(credentials.doubao?.appKey && credentials.doubao?.accessToken && credentials.doubao?.secretKey);
    console.log("🔧 Config: Fallback result", { configured: fallbackResult });
    return fallbackResult;
  }
}

// 获取豆包凭证
export function getDoubaoCredentials(): { appKey: string; accessToken: string; secretKey: string } | null {
  const credentials = loadCredentials();
  return credentials.doubao || null;
}

// 清除豆包凭证
export function clearCredentials(provider: "doubao"): boolean {
  const credentials = loadCredentials();
  delete credentials[provider];
  return saveCredentials(credentials);
}

// 同步配置状态 - 禁用自动清理逻辑（因为我们使用本地存储）
export function syncConfigurationState(): boolean {
  try {
    console.log("🔧 Config: Configuration sync disabled - using local storage only");
    
    // 不执行任何同步逻辑，因为我们使用本地文件存储
    // Raycast preferences 和本地配置是独立的
    
    return true;
  } catch (error) {
    console.error("🔧 Config: Failed to sync configuration state:", error);
    return false;
  }
} 