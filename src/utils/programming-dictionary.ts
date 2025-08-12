import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { environment } from "@raycast/api";
import { debug, info, warn, error } from "./logger";

// 自定义编程术语词典文件路径
const DICTIONARY_FILE = join(environment.supportPath, "programming-dictionary.json");

export interface TermMapping {
  id: string;
  incorrect: string;
  correct: string;
  category?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProgrammingDictionary {
  version: string;
  mappings: TermMapping[];
  categories: string[];
}

// 默认的词典结构
const DEFAULT_DICTIONARY: ProgrammingDictionary = {
  version: "1.0.0",
  mappings: [],
  categories: [
    "编程语言",
    "前端框架",
    "后端框架",
    "数据库",
    "云服务",
    "开发工具",
    "技术概念",
    "自定义",
  ],
};

/**
 * 加载编程术语词典
 */
export function loadDictionary(): ProgrammingDictionary {
  try {
    debug("ProgrammingDictionary", "Loading dictionary from:", DICTIONARY_FILE);

    if (!existsSync(DICTIONARY_FILE)) {
      debug("ProgrammingDictionary", "Dictionary file not found, creating default");
      saveDictionary(DEFAULT_DICTIONARY);
      return DEFAULT_DICTIONARY;
    }

    const data = readFileSync(DICTIONARY_FILE, "utf-8");
    const dictionary = JSON.parse(data) as ProgrammingDictionary;

    info("ProgrammingDictionary", "Dictionary loaded", {
      mappingCount: dictionary.mappings.length,
      categories: dictionary.categories.length,
    });

    return dictionary;
  } catch (err) {
    error("ProgrammingDictionary", "Failed to load dictionary", { error: err });
    return DEFAULT_DICTIONARY;
  }
}

/**
 * 保存编程术语词典
 */
export function saveDictionary(dictionary: ProgrammingDictionary): boolean {
  try {
    debug("ProgrammingDictionary", "Saving dictionary", {
      mappingCount: dictionary.mappings.length,
    });

    writeFileSync(DICTIONARY_FILE, JSON.stringify(dictionary, null, 2));

    info("ProgrammingDictionary", "Dictionary saved successfully");
    return true;
  } catch (err) {
    error("ProgrammingDictionary", "Failed to save dictionary", { error: err });
    return false;
  }
}

/**
 * 添加新的术语映射
 */
export function addTermMapping(
  incorrect: string,
  correct: string,
  category?: string,
  description?: string
): TermMapping | null {
  try {
    const dictionary = loadDictionary();

    // 检查是否已存在相同的映射
    const existing = dictionary.mappings.find(
      (m) => m.incorrect.toLowerCase() === incorrect.toLowerCase()
    );

    if (existing) {
      warn("ProgrammingDictionary", "Mapping already exists", { incorrect });
      return null;
    }

    const newMapping: TermMapping = {
      id: `term-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      incorrect,
      correct,
      category: category || "自定义",
      description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    dictionary.mappings.push(newMapping);

    if (saveDictionary(dictionary)) {
      info("ProgrammingDictionary", "Term mapping added", {
        id: newMapping.id,
        incorrect,
        correct,
      });
      return newMapping;
    }

    return null;
  } catch (err) {
    error("ProgrammingDictionary", "Failed to add term mapping", { error: err });
    return null;
  }
}

/**
 * 更新术语映射
 */
export function updateTermMapping(
  id: string,
  updates: Partial<Omit<TermMapping, "id" | "createdAt">>
): boolean {
  try {
    const dictionary = loadDictionary();
    const index = dictionary.mappings.findIndex((m) => m.id === id);

    if (index === -1) {
      warn("ProgrammingDictionary", "Mapping not found for update", { id });
      return false;
    }

    dictionary.mappings[index] = {
      ...dictionary.mappings[index],
      ...updates,
      updatedAt: Date.now(),
    };

    if (saveDictionary(dictionary)) {
      info("ProgrammingDictionary", "Term mapping updated", { id, updates });
      return true;
    }

    return false;
  } catch (err) {
    error("ProgrammingDictionary", "Failed to update term mapping", { error: err });
    return false;
  }
}

/**
 * 删除术语映射
 */
export function deleteTermMapping(id: string): boolean {
  try {
    const dictionary = loadDictionary();
    const initialLength = dictionary.mappings.length;
    dictionary.mappings = dictionary.mappings.filter((m) => m.id !== id);

    if (dictionary.mappings.length === initialLength) {
      warn("ProgrammingDictionary", "Mapping not found for deletion", { id });
      return false;
    }

    if (saveDictionary(dictionary)) {
      info("ProgrammingDictionary", "Term mapping deleted", { id });
      return true;
    }

    return false;
  } catch (err) {
    error("ProgrammingDictionary", "Failed to delete term mapping", { error: err });
    return false;
  }
}

/**
 * 获取所有术语映射
 */
export function getAllMappings(): TermMapping[] {
  const dictionary = loadDictionary();
  return dictionary.mappings;
}

/**
 * 根据分类获取术语映射
 */
export function getMappingsByCategory(category: string): TermMapping[] {
  const dictionary = loadDictionary();
  return dictionary.mappings.filter((m) => m.category === category);
}

/**
 * 搜索术语映射
 */
export function searchMappings(query: string): TermMapping[] {
  const dictionary = loadDictionary();
  const lowerQuery = query.toLowerCase();

  return dictionary.mappings.filter(
    (m) =>
      m.incorrect.toLowerCase().includes(lowerQuery) ||
      m.correct.toLowerCase().includes(lowerQuery) ||
      (m.description && m.description.toLowerCase().includes(lowerQuery))
  );
}

/**
 * 获取词典统计信息
 */
export function getDictionaryStats(): {
  totalMappings: number;
  mappingsByCategory: Record<string, number>;
  lastUpdated: number;
} {
  const dictionary = loadDictionary();
  const mappingsByCategory: Record<string, number> = {};

  dictionary.mappings.forEach((m) => {
    const category = m.category || "自定义";
    mappingsByCategory[category] = (mappingsByCategory[category] || 0) + 1;
  });

  const lastUpdated = Math.max(...dictionary.mappings.map((m) => m.updatedAt), 0);

  return {
    totalMappings: dictionary.mappings.length,
    mappingsByCategory,
    lastUpdated,
  };
}

/**
 * 导入术语映射（批量）
 */
export function importMappings(
  mappings: Array<{
    incorrect: string;
    correct: string;
    category?: string;
    description?: string;
  }>
): { success: number; failed: number; errors: string[] } {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const mapping of mappings) {
    const result = addTermMapping(
      mapping.incorrect,
      mapping.correct,
      mapping.category,
      mapping.description
    );

    if (result) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push(`Failed to import: ${mapping.incorrect} -> ${mapping.correct}`);
    }
  }

  info("ProgrammingDictionary", "Import completed", results);
  return results;
}

/**
 * 导出术语映射
 */
export function exportMappings(): string {
  const dictionary = loadDictionary();
  const exportData = dictionary.mappings.map((m) => ({
    incorrect: m.incorrect,
    correct: m.correct,
    category: m.category,
    description: m.description,
  }));

  return JSON.stringify(exportData, null, 2);
}

/**
 * 重置词典到默认状态
 */
export function resetDictionary(): boolean {
  try {
    info("ProgrammingDictionary", "Resetting dictionary to default");
    return saveDictionary(DEFAULT_DICTIONARY);
  } catch (err) {
    error("ProgrammingDictionary", "Failed to reset dictionary", { error: err });
    return false;
  }
}

/**
 * 获取用于纠错的映射对象
 */
export function getMappingsForCorrection(): Record<string, string> {
  const dictionary = loadDictionary();
  const mappings: Record<string, string> = {};

  dictionary.mappings.forEach((m) => {
    mappings[m.incorrect] = m.correct;
  });

  return mappings;
}
