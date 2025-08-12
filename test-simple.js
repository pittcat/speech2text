/**
 * 简单的编程术语功能验证
 * Simple verification of programming terms functionality
 */

// 简化版本的术语检测
function containsProgrammingTerms(text) {
  const lowerText = text.toLowerCase();
  const programmingKeywords = [
    'javascript', 'typescript', 'react', 'vue', 'angular', 'python', 'java',
    'api', 'function', 'method', 'class', 'object', 'array', 'string',
    'mysql', 'mongodb', 'redis', 'aws', 'docker', 'kubernetes',
    'framework', 'library', 'package', 'repository', 'deployment'
  ];
  
  return programmingKeywords.some(keyword => lowerText.includes(keyword));
}

// 简化版本的纠错映射
function applyCorrectionMapping(text) {
  const corrections = {
    'javascript': 'JavaScript',
    'java script': 'JavaScript',
    'type script': 'TypeScript',
    'my sql': 'MySQL',
    'mongo db': 'MongoDB',
    'vs code': 'VS Code',
    'git hub': 'GitHub',
    'aws': 'AWS',
    'api': 'API',
    'json': 'JSON',
    'html': 'HTML',
    'css': 'CSS'
  };
  
  let correctedText = text;
  for (const [wrong, correct] of Object.entries(corrections)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    correctedText = correctedText.replace(regex, correct);
  }
  
  return correctedText;
}

console.log('🧪 测试编程术语功能...\n');

// 测试1: 编程内容检测
console.log('📝 测试1: 编程内容检测');
const testTexts = [
  "今天学习了JavaScript和React开发",
  "我们需要部署到AWS云平台",
  "使用MySQL数据库存储用户信息",
  "今天天气很好，去公园散步",
];

testTexts.forEach(text => {
  const isProgramming = containsProgrammingTerms(text);
  console.log(`"${text}" -> ${isProgramming ? '✅' : '❌'} ${isProgramming ? '包含编程术语' : '普通文本'}`);
});

console.log('\n📝 测试2: 术语纠错映射');
const correctionTests = [
  "我使用java script开发前端",
  "需要连接my sql数据库", 
  "部署到aws云平台",
  "使用vs code编写代码",
];

correctionTests.forEach(text => {
  const corrected = applyCorrectionMapping(text);
  console.log(`"${text}" -> "${corrected}"`);
});

console.log('\n✅ 基本功能验证完成！');

// 模拟一个DeepSeek提示词构建的例子
console.log('\n📝 测试3: 模拟提示词增强');
const originalPrompt = "请纠正文本中的错误。只返回纠正后的文本，不要添加解释或说明。";
const userTerms = "React.js, TypeScript, GraphQL, Docker";
const programmingEnhancement = `\n\n特别注意以下技术术语的准确性：${userTerms}\n\n注意：特别关注编程语言名称、框架名称、API术语、变量命名规范等技术术语的准确性。`;
const enhancedPrompt = originalPrompt + programmingEnhancement;

console.log('原始提示词:');
console.log(originalPrompt);
console.log('\n增强后的提示词:');
console.log(enhancedPrompt);

console.log('\n🎯 演示纠错效果:');
const demoText = "我们使用java script和type script开发web应用，数据存储在my sql数据库中，部署到aws云平台";
console.log('原文:', demoText);
console.log('纠错后:', applyCorrectionMapping(demoText));