// 创建一个简单的扩展图标
const fs = require('fs');
const { createCanvas } = require('canvas');

// 如果没有安装 canvas，可以使用这个简单的 SVG 方案
const svgIcon = `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <!-- 背景 -->
  <rect width="512" height="512" rx="100" fill="#5B5FC7"/>
  
  <!-- 麦克风图标 -->
  <g transform="translate(256, 256)">
    <!-- 麦克风主体 -->
    <path d="M 0 -120 
             C -30 -120, -55 -95, -55 -65
             L -55 -20
             C -55 10, -30 35, 0 35
             C 30 35, 55 10, 55 -20
             L 55 -65
             C 55 -95, 30 -120, 0 -120 Z" 
          fill="white" 
          stroke="none"/>
    
    <!-- 麦克风支架 -->
    <path d="M -80 -20
             A 80 80 0 0 0 80 -20"
          fill="none" 
          stroke="white" 
          stroke-width="20"
          stroke-linecap="round"/>
    
    <!-- 底座 -->
    <line x1="0" y1="60" x2="0" y2="100" 
          stroke="white" 
          stroke-width="20"
          stroke-linecap="round"/>
    <line x1="-40" y1="100" x2="40" y2="100" 
          stroke="white" 
          stroke-width="20"
          stroke-linecap="round"/>
    
    <!-- 声波效果 -->
    <path d="M -100 -50
             Q -120 -40, -120 -20
             Q -120 0, -100 10"
          fill="none" 
          stroke="white" 
          stroke-width="15"
          stroke-linecap="round"
          opacity="0.6"/>
    <path d="M 100 -50
             Q 120 -40, 120 -20
             Q 120 0, 100 10"
          fill="none" 
          stroke="white" 
          stroke-width="15"
          stroke-linecap="round"
          opacity="0.6"/>
  </g>
</svg>`;

// 写入 SVG 文件
fs.writeFileSync('extension-icon.svg', svgIcon);

console.log('Created extension-icon.svg');

// 如果你想创建 PNG，可以使用在线工具或其他转换工具将 SVG 转换为 PNG