#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

// 构建凭证文件路径
const supportPath = path.join(os.homedir(), 'Library/Application Support/com.raycast.macos/extensions/speech-to-text');
const credentialsFile = path.join(supportPath, 'credentials.json');

console.log('🗑️  清除认证信息工具');
console.log('📁  凭证文件路径:', credentialsFile);

// 检查文件是否存在
if (fs.existsSync(credentialsFile)) {
  console.log('✅  找到凭证文件');
  
  // 读取当前内容
  const currentContent = fs.readFileSync(credentialsFile, 'utf-8');
  console.log('\n📄  当前凭证内容:');
  const parsed = JSON.parse(currentContent);
  
  if (parsed.doubao) {
    console.log('  - Doubao: 已配置');
  }
  if (parsed.deepseek) {
    console.log('  - DeepSeek: 已配置');
  }
  
  // 删除文件
  fs.unlinkSync(credentialsFile);
  console.log('\n🗑️  凭证文件已删除');
  console.log('✅  所有认证信息已清空');
} else {
  console.log('❌  未找到凭证文件，可能已经是空的');
}

console.log('\n💡  现在您可以重新启动扩展并测试保存功能了');