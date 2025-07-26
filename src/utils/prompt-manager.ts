import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { environment } from "@raycast/api";
import { CustomPrompt, PolishingConfig, PromptOption } from "../types";
import { PRESET_POLISH_PROMPTS, getAllPromptOptions } from "../constants";
import { trace, debug, info, warn, error } from "./logger";

// 自定义提示词配置文件路径
const PROMPTS_CONFIG_FILE = join(environment.supportPath, "custom-prompts.json");

/**
 * 加载自定义润色提示词配置
 */
export function loadCustomPrompts(): CustomPrompt[] {
  try {
    debug("PromptManager", "Loading custom prompts from:", PROMPTS_CONFIG_FILE);

    if (!existsSync(PROMPTS_CONFIG_FILE)) {
      debug("PromptManager", "Custom prompts file does not exist, returning empty array");
      return [];
    }

    const data = readFileSync(PROMPTS_CONFIG_FILE, "utf-8");
    const parsed = JSON.parse(data) as CustomPrompt[];

    debug("PromptManager", "Loaded custom prompts", {
      count: parsed.length,
      prompts: parsed.map((p) => ({ id: p.id, name: p.name })),
    });

    return parsed;
  } catch (err) {
    error("PromptManager", "Failed to load custom prompts", { error: err });
    return [];
  }
}

/**
 * 保存自定义润色提示词配置
 */
export function saveCustomPrompts(prompts: CustomPrompt[]): boolean {
  try {
    debug("PromptManager", "Saving custom prompts", {
      count: prompts.length,
      prompts: prompts.map((p) => ({ id: p.id, name: p.name })),
    });

    writeFileSync(PROMPTS_CONFIG_FILE, JSON.stringify(prompts, null, 2));

    info("PromptManager", "Successfully saved custom prompts", { count: prompts.length });
    return true;
  } catch (err) {
    error("PromptManager", "Failed to save custom prompts", { error: err });
    return false;
  }
}

/**
 * 添加新的自定义提示词
 */
export function addCustomPrompt(name: string, prompt: string): CustomPrompt | null {
  try {
    const customPrompts = loadCustomPrompts();

    // 检查名称是否已存在
    if (customPrompts.some((p) => p.name === name)) {
      warn("PromptManager", "Custom prompt name already exists", { name });
      return null;
    }

    const newPrompt: CustomPrompt = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      prompt,
      createdAt: Date.now(),
      isCustom: true,
    };

    const updatedPrompts = [...customPrompts, newPrompt];

    if (saveCustomPrompts(updatedPrompts)) {
      info("PromptManager", "Successfully added custom prompt", {
        id: newPrompt.id,
        name: newPrompt.name,
      });
      return newPrompt;
    }

    return null;
  } catch (err) {
    error("PromptManager", "Failed to add custom prompt", { error: err });
    return null;
  }
}

/**
 * 删除自定义提示词
 */
export function deleteCustomPrompt(id: string): boolean {
  try {
    const customPrompts = loadCustomPrompts();
    const updatedPrompts = customPrompts.filter((p) => p.id !== id);

    if (updatedPrompts.length === customPrompts.length) {
      warn("PromptManager", "Custom prompt not found for deletion", { id });
      return false;
    }

    if (saveCustomPrompts(updatedPrompts)) {
      info("PromptManager", "Successfully deleted custom prompt", { id });
      return true;
    }

    return false;
  } catch (err) {
    error("PromptManager", "Failed to delete custom prompt", { error: err });
    return false;
  }
}

/**
 * 更新自定义提示词
 */
export function updateCustomPrompt(
  id: string,
  updates: Partial<Pick<CustomPrompt, "name" | "prompt">>
): boolean {
  try {
    const customPrompts = loadCustomPrompts();
    const promptIndex = customPrompts.findIndex((p) => p.id === id);

    if (promptIndex === -1) {
      warn("PromptManager", "Custom prompt not found for update", { id });
      return false;
    }

    // 检查新名称是否与其他提示词冲突
    if (
      updates.name &&
      customPrompts.some((p, index) => p.name === updates.name && index !== promptIndex)
    ) {
      warn("PromptManager", "Custom prompt name already exists", { name: updates.name });
      return false;
    }

    customPrompts[promptIndex] = {
      ...customPrompts[promptIndex],
      ...updates,
    };

    if (saveCustomPrompts(customPrompts)) {
      info("PromptManager", "Successfully updated custom prompt", { id, updates });
      return true;
    }

    return false;
  } catch (err) {
    error("PromptManager", "Failed to update custom prompt", { error: err });
    return false;
  }
}

/**
 * 获取所有可用的润色提示词选项
 */
export function getAllAvailablePrompts(): PromptOption[] {
  const customPrompts = loadCustomPrompts();
  return getAllPromptOptions(customPrompts);
}

/**
 * 根据 ID 查找提示词
 */
export function findPromptById(id: string): PromptOption | null {
  const allPrompts = getAllAvailablePrompts();
  return allPrompts.find((p) => (p.isCustom ? p.id === id : p.key === id)) || null;
}

/**
 * 获取提示词的显示名称
 */
export function getPromptDisplayName(prompt: PromptOption): string {
  return prompt.name;
}

/**
 * 获取提示词的内容
 */
export function getPromptContent(prompt: PromptOption): string {
  return prompt.prompt;
}

/**
 * 验证自定义提示词的输入
 */
export function validateCustomPrompt(
  name: string,
  prompt: string
): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: "提示词名称不能为空" };
  }

  if (name.trim().length > 50) {
    return { valid: false, error: "提示词名称不能超过50个字符" };
  }

  if (!prompt.trim()) {
    return { valid: false, error: "提示词内容不能为空" };
  }

  if (prompt.trim().length > 1000) {
    return { valid: false, error: "提示词内容不能超过1000个字符" };
  }

  return { valid: true };
}
