import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { environment, getPreferenceValues } from "@raycast/api";
import { TranscriptionPreferences, DeepSeekConfig } from "../types";

// 配置文件路径
const CONFIG_FILE = join(environment.supportPath, "credentials.json");

// 凭证接口
export interface Credentials {
  doubao?: {
    appKey: string;
    accessToken: string;
    secretKey: string;
  };
  // 新增 DeepSeek 凭证
  deepseek?: {
    apiKey: string;
    model: string;
    baseUrl: string;
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
      // 新增 DeepSeek 日志
      hasDeepSeek: !!parsed.deepseek,
      hasDeepSeekApiKey: !!parsed.deepseek?.apiKey,
      hasDeepSeekModel: !!parsed.deepseek?.model,
      hasDeepSeekBaseUrl: !!parsed.deepseek?.baseUrl,
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
export function saveDoubaoCredentials(
  appKey: string,
  accessToken: string,
  secretKey: string
): boolean {
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

// 新增：保存 DeepSeek 凭证
export function saveDeepSeekCredentials(apiKey: string, model: string, baseUrl: string): boolean {
  try {
    console.log("🔧 Config: Starting to save DeepSeek credentials", {
      apiKey: apiKey ? `${apiKey.substring(0, 4)}****` : "empty",
      model,
      baseUrl,
    });

    const credentials = loadCredentials();
    console.log("🔧 Config: Loaded existing credentials", {
      hasDeepSeek: !!credentials.deepseek,
    });

    credentials.deepseek = { apiKey, model, baseUrl };
    console.log("🔧 Config: Updated DeepSeek credentials object");

    const result = saveCredentials(credentials);
    console.log("🔧 Config: DeepSeek save result", { success: result });

    return result;
  } catch (error) {
    console.error("🔧 Config: Error saving DeepSeek credentials", error);
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
    const fallbackResult = !!(
      credentials.doubao?.appKey &&
      credentials.doubao?.accessToken &&
      credentials.doubao?.secretKey
    );
    console.log("🔧 Config: Fallback result", { configured: fallbackResult });
    return fallbackResult;
  }
}

// 新增：检查 DeepSeek 凭证是否已配置
export function isDeepSeekConfigured(): boolean {
  try {
    console.log("🔧 Config: Checking if DeepSeek is configured");

    // 导入logger来写入日志文件
    const { info, debug } = require("../utils/logger");

    const prefs = getPreferenceValues<TranscriptionPreferences>();
    const deepseekCredentials = getDeepSeekCredentials();

    // 详细记录所有 DeepSeek 相关的偏好设置
    debug("Config", "🐛 DEBUG: All DeepSeek preferences", {
      deepseekApiKey: prefs.deepseekApiKey
        ? `${prefs.deepseekApiKey.substring(0, 4)}****`
        : "NOT_SET",
      deepseekModel: prefs.deepseekModel || "NOT_SET",
      deepseekBaseUrl: prefs.deepseekBaseUrl || "NOT_SET",
      enablePolishing: prefs.enablePolishing || false,
      polishPrompt: prefs.polishPrompt || "NOT_SET",
      polishingTask: prefs.polishingTask || "NOT_SET",
    });

    console.log("🔧 Config: Raw Raycast preferences", {
      hasApiKey: !!prefs.deepseekApiKey,
      hasModel: !!prefs.deepseekModel,
      hasBaseUrl: !!prefs.deepseekBaseUrl,
    });

    console.log("🔧 Config: Local DeepSeek credentials", {
      hasCredentials: !!deepseekCredentials,
      hasApiKey: !!deepseekCredentials?.apiKey,
      hasModel: !!deepseekCredentials?.model,
      hasBaseUrl: !!deepseekCredentials?.baseUrl,
    });

    // 使用与getPreferences相同的合并逻辑
    const finalApiKey = prefs.deepseekApiKey || deepseekCredentials?.apiKey;
    const finalModel = prefs.deepseekModel || deepseekCredentials?.model || "deepseek-chat";
    const finalBaseUrl =
      prefs.deepseekBaseUrl || deepseekCredentials?.baseUrl || "https://api.deepseek.com/v1";

    const isConfigured = !!(finalApiKey && finalModel && finalBaseUrl);

    console.log("🔧 Config: Final DeepSeek merged check", {
      hasApiKey: !!finalApiKey,
      apiKeyPreview: finalApiKey ? `${finalApiKey.substring(0, 4)}****` : "NONE",
      hasModel: !!finalModel,
      model: finalModel,
      hasBaseUrl: !!finalBaseUrl,
      baseUrl: finalBaseUrl,
      isConfigured,
    });

    debug("Config", "🐛 DEBUG: DeepSeek configuration details", {
      finalApiKey: finalApiKey ? `${finalApiKey.substring(0, 4)}****` : "NONE",
      finalModel,
      finalBaseUrl,
      isConfigured,
    });

    info("Config", "DeepSeek configuration check result", { isConfigured });

    return isConfigured;
  } catch (error) {
    console.error("🔧 Config: Error checking DeepSeek configuration", error);
    // 如果无法获取preferences，回退到只检查本地配置
    const credentials = loadCredentials();
    const fallbackResult = !!(
      credentials.deepseek?.apiKey &&
      credentials.deepseek?.model &&
      credentials.deepseek?.baseUrl
    );
    console.log("🔧 Config: DeepSeek fallback result", { configured: fallbackResult });
    return fallbackResult;
  }
}

// 获取豆包凭证
export function getDoubaoCredentials(): {
  appKey: string;
  accessToken: string;
  secretKey: string;
} | null {
  const credentials = loadCredentials();
  return credentials.doubao || null;
}

// 新增：获取 DeepSeek 凭证
export function getDeepSeekCredentials(): {
  apiKey: string;
  model: string;
  baseUrl: string;
} | null {
  const credentials = loadCredentials();
  return credentials.deepseek || null;
}

// 新增：获取完整的 DeepSeek 配置（合并 Raycast preferences 和本地配置）
export function getDeepSeekConfig(): DeepSeekConfig | null {
  try {
    const { debug, error: logError } = require("../utils/logger");

    const prefs = getPreferenceValues<TranscriptionPreferences>();
    const localCredentials = getDeepSeekCredentials();

    debug("Config", "🐛 DEBUG: Getting DeepSeek config", {
      prefsApiKey: prefs.deepseekApiKey ? `${prefs.deepseekApiKey.substring(0, 4)}****` : "NOT_SET",
      prefsModel: prefs.deepseekModel || "NOT_SET",
      prefsBaseUrl: prefs.deepseekBaseUrl || "NOT_SET",
      localCredentials: localCredentials
        ? {
            apiKey: localCredentials.apiKey
              ? `${localCredentials.apiKey.substring(0, 4)}****`
              : "NOT_SET",
            model: localCredentials.model || "NOT_SET",
            baseUrl: localCredentials.baseUrl || "NOT_SET",
          }
        : "NO_LOCAL_CREDENTIALS",
    });

    const apiKey = prefs.deepseekApiKey || localCredentials?.apiKey;
    const model = prefs.deepseekModel || localCredentials?.model || "deepseek-chat";
    const baseUrl =
      prefs.deepseekBaseUrl || localCredentials?.baseUrl || "https://api.deepseek.com/v1";

    debug("Config", "🐛 DEBUG: Merged DeepSeek config", {
      finalApiKey: apiKey ? `${apiKey.substring(0, 4)}****` : "NONE",
      finalModel: model,
      finalBaseUrl: baseUrl,
      willReturnNull: !apiKey,
    });

    if (!apiKey) {
      logError("Config", "DeepSeek API Key not found in preferences or local credentials", {
        prefsHasApiKey: !!prefs.deepseekApiKey,
        localHasApiKey: !!localCredentials?.apiKey,
      });
      return null;
    }

    const config = {
      apiKey,
      model,
      baseUrl,
      temperature: 0.7,
      maxTokens: 2000,
    };

    debug("Config", "🐛 DEBUG: Returning DeepSeek config", {
      apiKey: config.apiKey ? `${config.apiKey.substring(0, 4)}****` : "NONE",
      model: config.model,
      baseUrl: config.baseUrl,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
    });

    return config;
  } catch (error) {
    console.error("🔧 Config: Error getting DeepSeek config", error);
    return null;
  }
}

// 清除豆包凭证
export function clearCredentials(provider: "doubao" | "deepseek"): boolean {
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
