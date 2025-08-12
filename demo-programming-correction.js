#!/usr/bin/env node
/**
 * 编程术语纠错演示脚本
 * Programming Terms Correction Demo
 */

console.log('🚀 编程术语纠错功能演示\n');

// 模拟常见的语音识别错误场景
const speechRecognitionErrors = [
  {
    scenario: "项目技术栈介绍",
    input: "我们的项目使用java script作为前端语言，配合react框架开发用户界面。后端使用python和django框架，数据库选择了my sql。整个项目部署在aws云平台上，使用docker进行容器化部署。",
    expected: "我们的项目使用JavaScript作为前端语言，配合React框架开发用户界面。后端使用Python和Django框架，数据库选择了MySQL。整个项目部署在AWS云平台上，使用Docker进行容器化部署。"
  },
  {
    scenario: "代码评审会议",
    input: "这个api接口需要优化，目前返回的json格式不够规范。建议使用type script重构，并添加eslint配置。另外需要集成git hub actions实现自动化测试。",
    expected: "这个API接口需要优化，目前返回的JSON格式不够规范。建议使用TypeScript重构，并添加ESLint配置。另外需要集成GitHub Actions实现自动化测试。"
  },
  {
    scenario: "技术分享",
    input: "今天分享一下如何使用vs code进行高效开发。首先安装必要的插件，然后配置prettier进行代码格式化。对于web开发，推荐使用webpack或者vite作为构建工具。",
    expected: "今天分享一下如何使用VS Code进行高效开发。首先安装必要的插件，然后配置Prettier进行代码格式化。对于Web开发，推荐使用Webpack或者Vite作为构建工具。"
  }
];

// 简化的纠错函数（演示用）
function correctProgrammingTerms(text) {
  const corrections = {
    'java script': 'JavaScript',
    'type script': 'TypeScript', 
    'my sql': 'MySQL',
    'postgre sql': 'PostgreSQL',
    'mongo db': 'MongoDB',
    'vs code': 'VS Code',
    'git hub': 'GitHub',
    'git lab': 'GitLab',
    'react': 'React',
    'django': 'Django',
    'python': 'Python',
    'aws': 'AWS',
    'docker': 'Docker',
    'api': 'API',
    'json': 'JSON',
    'eslint': 'ESLint',
    'prettier': 'Prettier',
    'webpack': 'Webpack',
    'vite': 'Vite',
    'web': 'Web'
  };

  let correctedText = text;
  for (const [wrong, correct] of Object.entries(corrections)) {
    const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
    correctedText = correctedText.replace(regex, correct);
  }
  
  return correctedText;
}

// 演示纠错效果
speechRecognitionErrors.forEach((example, index) => {
  console.log(`📝 场景 ${index + 1}: ${example.scenario}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  console.log('🎤 语音识别原文:');
  console.log(example.input);
  
  console.log('\n✅ 编程术语纠错后:');
  const corrected = correctProgrammingTerms(example.input);
  console.log(corrected);
  
  console.log('\n🎯 理想效果:');
  console.log(example.expected);
  
  // 计算纠错准确率
  const corrections = example.input !== corrected;
  console.log(`\n📊 纠错状态: ${corrections ? '✅ 已应用纠错' : '❌ 无需纠错'}`);
  
  console.log('\n'.repeat(2));
});

console.log('💡 使用建议:');
console.log('1. 在 "Custom Terms" 中添加项目特定技术术语');
console.log('2. 选择 "编程术语纠错" 润色任务');  
console.log('3. 说话时尽量清晰地发音技术术语');
console.log('4. 定期更新自定义术语列表');

console.log('\n🎉 演示完成！这就是编程术语纠错功能的强大之处。');