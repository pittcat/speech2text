#!/usr/bin/env node
/**
 * 简单测试脚本 - 验证编程术语功能
 * Simple test script for programming terms functionality
 */

// 由于这是Node.js环境，需要模拟一些Raycast API
const mockRaycastAPI = {
  environment: {
    supportPath: '/tmp/speech2text-test'
  }
};

// 临时设置全局变量以避免导入错误
global.environment = mockRaycastAPI.environment;

// 现在导入我们的模块
const {
  buildProgrammingTermsPrompt,
  applyCorrectionMapping,
  containsProgrammingTerms,
  COMMON_CORRECTIONS
} = require('./src/utils/programming-terms');

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

console.log('\n📝 测试3: 提示词构建');
const userTerms = "React.js, TypeScript, GraphQL, Docker";
const prompt = buildProgrammingTermsPrompt(userTerms);
console.log('生成的提示词片段:');
console.log(prompt);

console.log('\n📝 测试4: 常见纠错映射表');
console.log('部分纠错映射示例:');
Object.entries(COMMON_CORRECTIONS).slice(0, 10).forEach(([wrong, correct]) => {
  console.log(`  "${wrong}" -> "${correct}"`);
});

console.log('\n✅ 所有测试完成！');