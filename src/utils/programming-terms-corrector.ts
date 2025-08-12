import { debug, trace } from "./logger";

/**
 * 编程术语纠错引擎
 * 用于修正语音识别中常见的编程术语错误
 */

// 常见编程术语的拼音/发音映射
const PHONETIC_TERM_MAPPINGS: Record<string, string> = {
  // 编程语言
  派森: "Python",
  派桑: "Python",
  拍森: "Python",
  杰瓦: "Java",
  佳瓦: "Java",
  加瓦: "Java",
  贾瓦: "Java",
  杰斯: "JS",
  杰艾斯: "JS",
  西加加: "C++",
  西普拉斯: "C++",
  西夏普: "C#",
  西井: "C#",
  够: "Go",
  狗: "Go",
  锈: "Rust",
  拉斯特: "Rust",
  斯威夫特: "Swift",
  思维夫特: "Swift",
  科特林: "Kotlin",
  扣特林: "Kotlin",
  泰普斯克瑞普特: "TypeScript",
  泰斯: "TS",
  提艾斯: "TS",

  // 前端框架
  瑞艾克特: "React",
  瑞克特: "React",
  锐克特: "React",
  维尤: "Vue",
  威尤: "Vue",
  维优: "Vue",
  安古拉: "Angular",
  安格拉: "Angular",
  思维特: "Svelte",
  斯威特: "Svelte",
  耐克斯特: "Next",
  奈克斯特: "Next.js",
  纳克斯特: "Nuxt",
  努克斯特: "Nuxt.js",

  // 后端框架
  诺得: "Node",
  诺德: "Node.js",
  诺的杰斯: "Node.js",
  爱克斯普瑞斯: "Express",
  艾克斯普雷斯: "Express",
  扣啊: "Koa",
  科阿: "Koa",
  内斯特: "Nest",
  奈斯特: "NestJS",
  弹簧: "Spring",
  斯普林: "Spring",
  姜狗: "Django",
  将狗: "Django",
  弗拉斯克: "Flask",
  福拉斯克: "Flask",

  // 数据库
  赛酷: "SQL",
  艾斯酷艾欧: "SQL",
  买艾斯酷艾欧: "MySQL",
  买赛酷: "MySQL",
  后格瑞: "PostgreSQL",
  波斯特格瑞: "PostgreSQL",
  蒙狗: "MongoDB",
  芒果: "MongoDB",
  瑞迪斯: "Redis",
  雷迪斯: "Redis",

  // 工具和概念
  艾派爱: "API",
  诶批艾: "API",
  杰森: "JSON",
  贾森: "JSON",
  赫特梯皮: "HTTP",
  爱吃梯梯批: "HTTP",
  赫特梯皮艾斯: "HTTPS",
  艾杰克斯: "AJAX",
  阿贾克斯: "Ajax",
  瑞斯特: "REST",
  雷斯特: "REST",
  瑞斯特夫: "RESTful",
  格拉夫酷艾欧: "GraphQL",
  格拉夫: "GraphQL",

  // Git相关
  给特: "Git",
  吉特: "Git",
  给特哈勃: "GitHub",
  吉特哈勃: "GitHub",
  给特拉勃: "GitLab",
  吉特拉勃: "GitLab",

  // 云服务
  诶我爱斯: "AWS",
  阿里云: "Aliyun",
  阿祖尔: "Azure",
  阿朱儿: "Azure",
  谷歌云: "GCP",
  及西批: "GCP",

  // 其他常见术语
  诶爱: "AI",
  艾姆艾欧: "ML",
  买欧: "ML",
  迪艾欧: "DL",
  低欧: "DL",
  艾迪伊: "IDE",
  艾斯迪凯: "SDK",
  西迪凯: "CDK",
  西艾爱: "CI",
  西迪: "CD",
  道克: "Docker",
  多克: "Docker",
  库伯内提斯: "Kubernetes",
  K8S: "Kubernetes",
  凯八斯: "K8s",
};

// 常见英文术语的中文错误映射
const CHINESE_TERM_MAPPINGS: Record<string, string> = {
  微信小程序: "WeChat Mini Program",
  小程序: "Mini Program",
  组件: "Component",
  模块: "Module",
  依赖: "Dependency",
  包: "Package",
  库: "Library",
  框架: "Framework",
  接口: "Interface",
  类: "Class",
  对象: "Object",
  函数: "Function",
  方法: "Method",
  变量: "Variable",
  常量: "Constant",
  数组: "Array",
  字符串: "String",
  数字: "Number",
  布尔: "Boolean",
  空: "null",
  未定义: "undefined",
};

// 需要保持大小写的术语
const CASE_SENSITIVE_TERMS = [
  "JavaScript",
  "TypeScript",
  "GitHub",
  "GitLab",
  "MySQL",
  "PostgreSQL",
  "MongoDB",
  "Redis",
  "GraphQL",
  "RESTful",
  "OAuth",
  "JWT",
  "DOM",
  "HTML",
  "CSS",
  "SASS",
  "LESS",
  "npm",
  "yarn",
  "pnpm",
  "webpack",
  "Vite",
  "ESLint",
  "Prettier",
  "Jest",
  "Mocha",
  "Cypress",
  "iOS",
  "macOS",
  "watchOS",
  "tvOS",
  "iPadOS",
  "iPhone",
  "iPad",
  "MacBook",
  "iMac",
  "API",
  "SDK",
  "CDN",
  "DNS",
  "HTTP",
  "HTTPS",
  "TCP",
  "UDP",
  "IP",
  "URL",
  "URI",
  "JSON",
  "XML",
  "YAML",
  "SQL",
  "NoSQL",
  "ORM",
  "ODM",
  "MVC",
  "MVP",
  "MVVM",
  "SPA",
  "SSR",
  "SSG",
  "PWA",
  "CLI",
  "GUI",
  "IDE",
  "VS Code",
  "IntelliJ",
  "WebStorm",
  "PyCharm",
];

/**
 * 纠正编程术语
 * @param text 原始文本
 * @returns 纠正后的文本
 */
export function correctProgrammingTerms(text: string): string {
  let correctedText = text;

  debug("ProgrammingTermsCorrector", "Starting correction", {
    originalLength: text.length,
  });

  // 1. 修正拼音/发音错误
  for (const [phonetic, correct] of Object.entries(PHONETIC_TERM_MAPPINGS)) {
    const regex = new RegExp(phonetic, "gi");
    if (regex.test(correctedText)) {
      correctedText = correctedText.replace(regex, correct);
      trace("ProgrammingTermsCorrector", "Phonetic correction", {
        from: phonetic,
        to: correct,
      });
    }
  }

  // 2. 修正大小写
  for (const term of CASE_SENSITIVE_TERMS) {
    const regex = new RegExp(`\\b${term}\\b`, "gi");
    if (regex.test(correctedText)) {
      correctedText = correctedText.replace(regex, term);
      trace("ProgrammingTermsCorrector", "Case correction", { term });
    }
  }

  // 3. 修正常见的组合错误
  correctedText = correctCommonPatterns(correctedText);

  debug("ProgrammingTermsCorrector", "Correction completed", {
    originalLength: text.length,
    correctedLength: correctedText.length,
    hasChanges: text !== correctedText,
  });

  return correctedText;
}

/**
 * 修正常见的模式错误
 */
function correctCommonPatterns(text: string): string {
  let result = text;

  // 修正 "点杰斯" -> ".js"
  result = result.replace(/点杰[斯艾]斯?/g, ".js");
  result = result.replace(/点提艾斯/g, ".ts");
  result = result.replace(/点杰艾斯艾克斯/g, ".jsx");
  result = result.replace(/点提艾斯艾克斯/g, ".tsx");

  // 修正版本号
  result = result.replace(/维(?:尤|优)三/g, "Vue 3");
  result = result.replace(/维(?:尤|优)二/g, "Vue 2");
  result = result.replace(/瑞[艾克]{2,3}特十八/g, "React 18");
  result = result.replace(/诺[得德]十六/g, "Node 16");

  // 修正常见组合
  result = result.replace(/艾斯六/g, "ES6");
  result = result.replace(/艾斯五/g, "ES5");
  result = result.replace(/诶吃梯梯买欧五/g, "HTML5");
  result = result.replace(/西艾斯艾斯三/g, "CSS3");

  return result;
}

/**
 * 检测文本是否包含编程相关内容
 */
export function detectProgrammingContent(text: string): boolean {
  const programmingKeywords = [
    // 编程语言关键词
    "代码",
    "函数",
    "变量",
    "类",
    "接口",
    "方法",
    "参数",
    "返回",
    "调用",
    "实现",
    "继承",
    "重载",
    "重写",
    "构造",
    "析构",
    // 开发相关
    "开发",
    "编程",
    "程序",
    "软件",
    "应用",
    "项目",
    "框架",
    "库",
    "组件",
    "模块",
    "包",
    "依赖",
    "版本",
    "更新",
    "升级",
    // 技术概念
    "前端",
    "后端",
    "全栈",
    "数据库",
    "服务器",
    "客户端",
    "接口",
    "测试",
    "调试",
    "部署",
    "发布",
    "构建",
    "编译",
    "打包",
    // 英文术语（即使拼写错误也能检测）
    "api",
    "sdk",
    "http",
    "json",
    "sql",
    "git",
    "docker",
    // 拼音错误但能识别
    "派森",
    "杰瓦",
    "瑞艾克特",
    "维尤",
    "诺得",
  ];

  const lowerText = text.toLowerCase();
  const hasProgrammingContent = programmingKeywords.some((keyword) => lowerText.includes(keyword));

  debug("ProgrammingTermsCorrector", "Content detection", {
    hasProgrammingContent,
    textLength: text.length,
  });

  return hasProgrammingContent;
}

/**
 * 获取建议的编程术语
 * 用于提供自动完成或建议功能
 */
export function getSuggestedTerms(partialTerm: string): string[] {
  const suggestions: string[] = [];
  const lowerPartial = partialTerm.toLowerCase();

  // 从所有映射中查找匹配项
  const allTerms = new Set([
    ...Object.values(PHONETIC_TERM_MAPPINGS),
    ...Object.values(CHINESE_TERM_MAPPINGS),
    ...CASE_SENSITIVE_TERMS,
  ]);

  for (const term of allTerms) {
    if (term.toLowerCase().includes(lowerPartial)) {
      suggestions.push(term);
    }
  }

  return suggestions.slice(0, 10); // 最多返回10个建议
}

/**
 * 批量纠正文本中的编程术语
 * 支持自定义词典
 */
export function correctWithCustomDictionary(
  text: string,
  customMappings: Record<string, string> = {}
): string {
  let correctedText = text;

  // 先应用自定义映射
  for (const [wrong, correct] of Object.entries(customMappings)) {
    const regex = new RegExp(wrong, "gi");
    correctedText = correctedText.replace(regex, correct);
  }

  // 再应用标准纠错
  correctedText = correctProgrammingTerms(correctedText);

  return correctedText;
}
