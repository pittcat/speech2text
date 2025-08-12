/**
 * 编程术语词典 - 用于纠正语音识别中常见的编程术语错误
 * Programming Terms Dictionary - for correcting common programming term errors in speech recognition
 */

// 常见编程语言和技术的正确拼写
export const PROGRAMMING_LANGUAGES = [
  // 主流编程语言
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "PHP",
  "Ruby",
  "Scala",
  "Clojure",
  "Haskell",
  "Erlang",
  "Elixir",
  "Dart",
  "R",
  "MATLAB",

  // Web技术
  "HTML",
  "CSS",
  "SASS",
  "SCSS",
  "Less",
  "JSON",
  "XML",
  "YAML",
  "GraphQL",
  "REST",
  "WebSocket",

  // 标记语言
  "Markdown",
  "LaTeX",
  "Jupyter",
];

// 流行框架和库
export const FRAMEWORKS_AND_LIBRARIES = [
  // 前端框架
  "React",
  "Vue.js",
  "Angular",
  "Svelte",
  "Next.js",
  "Nuxt.js",
  "Gatsby",
  "Remix",

  // 后端框架
  "Express.js",
  "Koa.js",
  "Fastify",
  "NestJS",
  "Django",
  "Flask",
  "FastAPI",
  "Spring Boot",
  "Rails",
  "Laravel",
  "Symfony",
  "ASP.NET",
  "Gin",
  "Echo",
  "Actix",

  // 移动开发
  "React Native",
  "Flutter",
  "Xamarin",
  "Ionic",
  "Cordova",

  // UI库
  "Bootstrap",
  "Tailwind CSS",
  "Material UI",
  "Ant Design",
  "Chakra UI",
  "Semantic UI",

  // 状态管理
  "Redux",
  "MobX",
  "Vuex",
  "Pinia",
  "Zustand",
  "Recoil",

  // 测试框架
  "Jest",
  "Mocha",
  "Chai",
  "Jasmine",
  "Cypress",
  "Selenium",
  "Playwright",
  "Puppeteer",

  // 构建工具
  "Webpack",
  "Vite",
  "Rollup",
  "Parcel",
  "ESBuild",
  "Turbopack",
];

// 云服务和平台
export const CLOUD_PLATFORMS = [
  // 主要云平台
  "AWS",
  "Azure",
  "Google Cloud",
  "GCP",
  "Alibaba Cloud",
  "Tencent Cloud",
  "DigitalOcean",

  // 容器和编排
  "Docker",
  "Kubernetes",
  "K8s",
  "OpenShift",
  "Rancher",

  // CI/CD
  "Jenkins",
  "GitHub Actions",
  "GitLab CI",
  "CircleCI",
  "Travis CI",
  "Azure DevOps",

  // 监控和日志
  "Prometheus",
  "Grafana",
  "Elasticsearch",
  "Kibana",
  "Logstash",
  "Fluentd",
];

// 数据库和存储
export const DATABASES = [
  // 关系型数据库
  "MySQL",
  "PostgreSQL",
  "SQLite",
  "Oracle",
  "SQL Server",
  "MariaDB",

  // NoSQL数据库
  "MongoDB",
  "Redis",
  "Cassandra",
  "DynamoDB",
  "CouchDB",
  "Neo4j",

  // 时序数据库
  "InfluxDB",
  "TimescaleDB",

  // 搜索引擎
  "Elasticsearch",
  "Solr",
  "Algolia",
];

// 开发工具和概念
export const DEV_TOOLS_AND_CONCEPTS = [
  // 版本控制
  "Git",
  "GitHub",
  "GitLab",
  "Bitbucket",
  "SVN",

  // IDE和编辑器
  "VS Code",
  "Visual Studio",
  "IntelliJ IDEA",
  "WebStorm",
  "PyCharm",
  "Sublime Text",
  "Vim",
  "Emacs",

  // 包管理器
  "npm",
  "yarn",
  "pnpm",
  "pip",
  "composer",
  "Maven",
  "Gradle",
  "NuGet",

  // API相关
  "REST API",
  "GraphQL",
  "gRPC",
  "OpenAPI",
  "Swagger",
  "Postman",

  // 架构模式
  "MVC",
  "MVP",
  "MVVM",
  "Redux",
  "Flux",
  "Clean Architecture",
  "Hexagonal Architecture",

  // 设计模式
  "Singleton",
  "Factory",
  "Observer",
  "Strategy",
  "Command",
  "Adapter",
  "Decorator",

  // 软件工程概念
  "TDD",
  "BDD",
  "DDD",
  "SOLID",
  "DRY",
  "KISS",
  "YAGNI",
  "Agile",
  "Scrum",
  "Kanban",
];

// 新兴技术和概念
export const EMERGING_TECH = [
  // AI/ML
  "ChatGPT",
  "OpenAI",
  "TensorFlow",
  "PyTorch",
  "Keras",
  "scikit-learn",
  "Pandas",
  "NumPy",

  // 区块链
  "Blockchain",
  "Ethereum",
  "Solidity",
  "Web3",
  "DeFi",
  "NFT",

  // 边缘计算
  "Edge Computing",
  "IoT",
  "WebAssembly",
  "WASM",

  // 微服务
  "Microservices",
  "Service Mesh",
  "Istio",
  "Envoy",
];

// 常见错误映射 - 语音识别常见错误到正确术语的映射
export const COMMON_CORRECTIONS = {
  // JavaScript/TypeScript相关
  javascript: "JavaScript",
  "java script": "JavaScript",
  "type script": "TypeScript",
  typescript: "TypeScript",
  "react js": "React.js",
  react: "React",
  "vue js": "Vue.js",
  "angular js": "AngularJS",
  "next js": "Next.js",
  "express js": "Express.js",

  // Python相关
  python: "Python",
  django: "Django",
  flask: "Flask",
  "fast api": "FastAPI",

  // Java相关
  java: "Java",
  "spring boot": "Spring Boot",
  spring: "Spring",

  // 数据库相关
  "my sql": "MySQL",
  "postgre sql": "PostgreSQL",
  "mongo db": "MongoDB",
  redis: "Redis",

  // 云平台相关
  aws: "AWS",
  "amazon web services": "AWS",
  "google cloud platform": "Google Cloud Platform",
  gcp: "GCP",
  azure: "Azure",
  "microsoft azure": "Microsoft Azure",

  // 工具相关
  "vs code": "VS Code",
  "visual studio code": "VS Code",
  "git hub": "GitHub",
  "git lab": "GitLab",
  docker: "Docker",
  kubernetes: "Kubernetes",
  k8s: "Kubernetes",

  // API相关
  "rest api": "REST API",
  graphql: "GraphQL",
  "graph ql": "GraphQL",
  grpc: "gRPC",
  "g rpc": "gRPC",

  // 常见拼写错误
  api: "API",
  url: "URL",
  http: "HTTP",
  https: "HTTPS",
  ssl: "SSL",
  tls: "TLS",
  tcp: "TCP",
  udp: "UDP",
  sql: "SQL",
  json: "JSON",
  xml: "XML",
  html: "HTML",
  css: "CSS",
  js: "JS",
  ts: "TS",
};

// 合并所有术语
export const ALL_PROGRAMMING_TERMS = [
  ...PROGRAMMING_LANGUAGES,
  ...FRAMEWORKS_AND_LIBRARIES,
  ...CLOUD_PLATFORMS,
  ...DATABASES,
  ...DEV_TOOLS_AND_CONCEPTS,
  ...EMERGING_TECH,
];

/**
 * 构建编程术语的提示词片段
 * @param userTerms 用户自定义的术语列表
 * @returns 编程术语提示词
 */
export function buildProgrammingTermsPrompt(userTerms?: string): string {
  const terms = [];

  // 添加用户自定义术语
  if (userTerms) {
    const customTerms = userTerms
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t);
    terms.push(...customTerms);
  }

  // 添加常用编程术语（选择最重要的）
  const importantTerms = [
    ...PROGRAMMING_LANGUAGES.slice(0, 10), // 前10个编程语言
    ...FRAMEWORKS_AND_LIBRARIES.slice(0, 15), // 前15个框架
    ...CLOUD_PLATFORMS.slice(0, 8), // 前8个云平台
    ...DATABASES.slice(0, 8), // 前8个数据库
  ];

  terms.push(...importantTerms);

  if (terms.length === 0) {
    return "";
  }

  return `\n\n特别注意以下技术术语的准确性：${terms.join(", ")}`;
}

/**
 * 应用常见纠错映射
 * @param text 原始文本
 * @returns 纠错后的文本
 */
export function applyCorrectionMapping(text: string): string {
  let correctedText = text;

  for (const [incorrect, correct] of Object.entries(COMMON_CORRECTIONS)) {
    // 创建正则表达式，匹配单词边界以避免误替换
    const regex = new RegExp(`\\b${incorrect}\\b`, "gi");
    correctedText = correctedText.replace(regex, correct);
  }

  return correctedText;
}

/**
 * 检查文本是否包含编程相关内容
 * @param text 要检查的文本
 * @returns 是否包含编程术语
 */
export function containsProgrammingTerms(text: string): boolean {
  const lowerText = text.toLowerCase();

  // 检查是否包含常见的编程关键词
  const programmingKeywords = [
    "api",
    "function",
    "method",
    "class",
    "object",
    "array",
    "string",
    "number",
    "boolean",
    "variable",
    "constant",
    "parameter",
    "argument",
    "return",
    "import",
    "export",
    "interface",
    "type",
    "enum",
    "namespace",
    "module",
    "component",
    "service",
    "database",
    "query",
    "schema",
    "table",
    "field",
    "index",
    "server",
    "client",
    "request",
    "response",
    "endpoint",
    "middleware",
    "framework",
    "library",
    "package",
    "dependency",
    "repository",
    "branch",
    "deployment",
    "container",
    "microservice",
    "authentication",
    "authorization",
  ];

  return (
    programmingKeywords.some((keyword) => lowerText.includes(keyword)) ||
    ALL_PROGRAMMING_TERMS.some((term) => lowerText.includes(term.toLowerCase()))
  );
}
