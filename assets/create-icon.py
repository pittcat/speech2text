#!/usr/bin/env python3
"""
创建一个简单的 512x512 扩展图标
"""

# 创建一个简单的紫色图标，中间有个白色的麦克风符号
# 使用原始字节创建 PNG 文件

import struct
import zlib

def create_png_icon():
    # 图像尺寸
    width = 512
    height = 512
    
    # 创建图像数据 (RGBA)
    pixels = []
    
    # 背景色 #5B5FC7
    bg_r, bg_g, bg_b = 91, 95, 199
    
    for y in range(height):
        for x in range(width):
            # 计算到中心的距离
            cx, cy = width // 2, height // 2
            dx, dy = x - cx, y - cy
            
            # 创建一个简单的麦克风形状
            # 麦克风主体（椭圆形）
            mic_body = False
            if abs(dx) < 60 and -150 < dy < 50:
                # 椭圆形判断
                if (dx/60)**2 + ((dy+50)/100)**2 < 1:
                    mic_body = True
            
            # 麦克风支架
            mic_stand = False
            if abs(dx) < 10 and 50 < dy < 150:
                mic_stand = True
            
            # 麦克风底座
            mic_base = False
            if abs(dx) < 50 and 140 < dy < 160:
                mic_base = True
            
            # 麦克风环形支架
            mic_ring = False
            if 70 < abs(dx) < 90 and -20 < dy < 60:
                if dx**2 + dy**2 > 70**2 and dx**2 + dy**2 < 90**2:
                    mic_ring = True
            
            # 设置像素颜色
            if mic_body or mic_stand or mic_base or mic_ring:
                # 白色
                pixels.extend([255, 255, 255, 255])
            else:
                # 背景色
                pixels.extend([bg_r, bg_g, bg_b, 255])
    
    # 创建 PNG 文件
    def make_png(pixels, width, height):
        def png_chunk(name, data):
            chunk = name + data
            crc = zlib.crc32(chunk) & 0xffffffff
            return struct.pack('>I', len(data)) + chunk + struct.pack('>I', crc)
        
        # PNG 文件头
        png_data = b'\x89PNG\r\n\x1a\n'
        
        # IHDR 块
        ihdr_data = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)
        png_data += png_chunk(b'IHDR', ihdr_data)
        
        # IDAT 块 (图像数据)
        raw_data = b''
        for y in range(height):
            raw_data += b'\x00'  # 过滤器类型
            raw_data += bytes(pixels[y * width * 4:(y + 1) * width * 4])
        
        compressed_data = zlib.compress(raw_data, 9)
        png_data += png_chunk(b'IDAT', compressed_data)
        
        # IEND 块
        png_data += png_chunk(b'IEND', b'')
        
        return png_data
    
    # 生成 PNG
    png_data = make_png(pixels, width, height)
    
    # 写入文件
    with open('extension-icon.png', 'wb') as f:
        f.write(png_data)
    
    print("Created extension-icon.png (512x512)")

if __name__ == '__main__':
    create_png_icon()