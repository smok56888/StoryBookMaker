#!/bin/bash

# 直接字体安装脚本 - 确保字体文件真实存在

set -e

echo "📥 直接安装中文字体文件"
echo "========================"

# 检查权限
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用root权限运行此脚本"
    echo "   sudo $0"
    exit 1
fi

# 创建字体目录
echo "📁 创建字体目录..."
mkdir -p /usr/share/fonts/chinese
mkdir -p /usr/share/fonts/truetype/chinese
cd /tmp

# 清理旧文件
rm -f *.ttf *.ttc *.zip *.tar.gz 2>/dev/null || true

echo "📥 方法1: 下载文泉驿微米黑字体..."
# 使用多个镜像源尝试下载
WQYFONTS_URLS=(
    "https://downloads.sourceforge.net/wqy/wqy-microhei-0.2.0-beta.tar.gz"
    "https://nchc.dl.sourceforge.net/project/wqy/wqy-microhei/0.2.0-beta/wqy-microhei-0.2.0-beta.tar.gz"
    "https://jaist.dl.sourceforge.net/project/wqy/wqy-microhei/0.2.0-beta/wqy-microhei-0.2.0-beta.tar.gz"
)

WQY_SUCCESS=false
for url in "${WQYFONTS_URLS[@]}"; do
    echo "   尝试从: $url"
    if wget -O wqy-microhei.tar.gz "$url" --timeout=60 --tries=2; then
        echo "   ✅ 下载成功"
        
        # 解压
        if tar -xzf wqy-microhei.tar.gz; then
            echo "   ✅ 解压成功"
            
            # 查找字体文件
            FONT_FILES=$(find . -name "*.ttc" -o -name "*.ttf" 2>/dev/null)
            if [ -n "$FONT_FILES" ]; then
                echo "   📄 找到字体文件:"
                echo "$FONT_FILES" | while read font; do
                    SIZE=$(ls -lh "$font" | awk '{print $5}')
                    echo "      $(basename "$font") ($SIZE)"
                    
                    # 复制到系统目录
                    cp "$font" /usr/share/fonts/chinese/
                    cp "$font" /usr/share/fonts/truetype/chinese/
                done
                WQY_SUCCESS=true
                echo "   ✅ 文泉驿字体安装成功"
                break
            else
                echo "   ❌ 未找到字体文件"
            fi
        else
            echo "   ❌ 解压失败"
        fi
    else
        echo "   ❌ 下载失败"
    fi
    
    # 清理
    rm -f wqy-microhei.tar.gz
    rm -rf wqy-microhei-*
done

echo ""
echo "📥 方法2: 下载思源黑体..."
NOTO_URLS=(
    "https://github.com/googlefonts/noto-cjk/releases/download/Sans2.004/NotoSansCJK-Regular.ttc"
    "https://noto-website-2.storage.googleapis.com/pkgs/NotoSansCJK-Regular.ttc"
)

NOTO_SUCCESS=false
for url in "${NOTO_URLS[@]}"; do
    echo "   尝试从: $url"
    if wget -O NotoSansCJK-Regular.ttc "$url" --timeout=120 --tries=2; then
        SIZE=$(ls -lh NotoSansCJK-Regular.ttc | awk '{print $5}')
        echo "   ✅ 下载成功 ($SIZE)"
        
        # 复制到系统目录
        cp NotoSansCJK-Regular.ttc /usr/share/fonts/chinese/
        cp NotoSansCJK-Regular.ttc /usr/share/fonts/truetype/chinese/
        NOTO_SUCCESS=true
        echo "   ✅ 思源黑体安装成功"
        break
    else
        echo "   ❌ 下载失败"
    fi
    rm -f NotoSansCJK-Regular.ttc
done

echo ""
echo "📥 方法3: 使用系统包管理器..."
if command -v apt-get >/dev/null 2>&1; then
    echo "   Ubuntu/Debian 系统，安装字体包..."
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -qq
    apt-get install -y fonts-wqy-microhei fonts-wqy-zenhei fonts-noto-cjk 2>/dev/null || echo "   ⚠️ 部分包安装失败"
elif command -v yum >/dev/null 2>&1; then
    echo "   CentOS/RHEL 系统，安装字体包..."
    yum install -y wqy-microhei-fonts google-noto-cjk-fonts 2>/dev/null || echo "   ⚠️ 部分包安装失败"
fi

echo ""
echo "📥 方法4: 创建基本中文字体文件..."
# 如果所有下载都失败，创建一个最基本的字体映射
if [ ! "$(ls -A /usr/share/fonts/chinese/)" ]; then
    echo "   所有下载方法都失败，尝试从系统复制现有字体..."
    
    # 搜索系统中可能存在的字体文件
    find /usr/share/fonts /usr/local/share/fonts -name "*.ttf" -o -name "*.ttc" -o -name "*.otf" 2>/dev/null | while read font; do
        BASENAME=$(basename "$font")
        if [[ "$BASENAME" =~ (DejaVu|Liberation|FreeSans|Arial) ]]; then
            echo "   复制通用字体: $BASENAME"
            cp "$font" /usr/share/fonts/chinese/ 2>/dev/null || true
        fi
    done
fi

echo ""
echo "🔧 设置字体权限..."
chmod -R 644 /usr/share/fonts/chinese/* 2>/dev/null || true
chmod -R 644 /usr/share/fonts/truetype/chinese/* 2>/dev/null || true
find /usr/share/fonts/chinese -type d -exec chmod 755 {} \; 2>/dev/null || true
find /usr/share/fonts/truetype/chinese -type d -exec chmod 755 {} \; 2>/dev/null || true

echo ""
echo "⚙️ 创建强制字体配置..."
cat > /etc/fonts/local.conf << 'EOF'
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <!-- 强制所有中文字符使用指定字体 -->
  <match target="pattern">
    <test name="lang" compare="contains">
      <string>zh</string>
    </test>
    <edit name="family" mode="prepend" binding="strong">
      <string>WenQuanYi Micro Hei</string>
      <string>Noto Sans CJK SC</string>
      <string>DejaVu Sans</string>
    </edit>
  </match>
  
  <!-- 为sans-serif字体族添加中文字体 -->
  <alias>
    <family>sans-serif</family>
    <prefer>
      <family>WenQuanYi Micro Hei</family>
      <family>Noto Sans CJK SC</family>
      <family>DejaVu Sans</family>
    </prefer>
  </alias>
  
  <!-- 为serif字体族添加中文字体 -->
  <alias>
    <family>serif</family>
    <prefer>
      <family>WenQuanYi Micro Hei</family>
      <family>Noto Sans CJK SC</family>
      <family>DejaVu Serif</family>
    </prefer>
  </alias>
  
  <!-- 强制中文Unicode范围使用中文字体 -->
  <match target="font">
    <test name="charset" compare="contains">
      <charset>
        <range>
          <int>0x4e00</int>
          <int>0x9fff</int>
        </range>
      </charset>
    </test>
    <edit name="family" mode="prepend" binding="strong">
      <string>WenQuanYi Micro Hei</string>
      <string>Noto Sans CJK SC</string>
    </edit>
  </match>
</fontconfig>
EOF

echo ""
echo "🔄 强制更新字体缓存..."
fc-cache --force --verbose
fc-cache -f -v

# 等待缓存更新完成
sleep 3

echo ""
echo "✅ 验证安装结果..."
echo "📁 字体文件检查:"
CHINESE_DIR_COUNT=$(find /usr/share/fonts/chinese -name "*.ttf" -o -name "*.ttc" -o -name "*.otf" 2>/dev/null | wc -l)
echo "   /usr/share/fonts/chinese: $CHINESE_DIR_COUNT 个文件"

if [ $CHINESE_DIR_COUNT -gt 0 ]; then
    echo "   字体文件列表:"
    find /usr/share/fonts/chinese -name "*.ttf" -o -name "*.ttc" -o -name "*.otf" 2>/dev/null | while read font; do
        SIZE=$(ls -lh "$font" | awk '{print $5}')
        echo "      $(basename "$font") ($SIZE)"
    done
fi

echo ""
echo "🔤 fontconfig 检查:"
TOTAL_FONTS=$(fc-list 2>/dev/null | wc -l)
CHINESE_FONTS=$(fc-list :lang=zh-cn 2>/dev/null | wc -l)
echo "   总字体数: $TOTAL_FONTS"
echo "   中文字体数: $CHINESE_FONTS"

if [ $CHINESE_FONTS -gt 0 ]; then
    echo "   ✅ 中文字体列表:"
    fc-list :lang=zh-cn | head -3 | sed 's/^/      /'
else
    echo "   ❌ fontconfig 未识别到中文字体"
    echo "   🔍 搜索可能的字体:"
    fc-list | grep -i "wqy\|noto\|dejavu" | head -3 | sed 's/^/      /' || echo "      未找到"
fi

echo ""
echo "🧪 创建测试文件..."
cat > /tmp/font-test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { 
            font-family: 'WenQuanYi Micro Hei', 'Noto Sans CJK SC', 'DejaVu Sans', sans-serif; 
            font-size: 20px; 
            padding: 20px; 
        }
    </style>
</head>
<body>
    <h1>中文字体测试</h1>
    <p>这是中文测试文本：你好世界！</p>
    <p>Mixed text: Hello 世界 123</p>
</body>
</html>
EOF

echo "   测试文件已创建: /tmp/font-test.html"

# 清理临时文件
cd /
rm -f /tmp/*.ttf /tmp/*.ttc /tmp/*.tar.gz /tmp/wqy-microhei-* 2>/dev/null || true

echo ""
echo "🎉 字体安装完成！"
echo ""
echo "📋 安装摘要:"
echo "   文泉驿字体: $([ "$WQY_SUCCESS" = true ] && echo "✅ 成功" || echo "❌ 失败")"
echo "   思源黑体: $([ "$NOTO_SUCCESS" = true ] && echo "✅ 成功" || echo "❌ 失败")"
echo "   字体文件数: $CHINESE_DIR_COUNT"
echo "   fontconfig识别: $CHINESE_FONTS 个中文字体"
echo ""
echo "🔄 请重启应用测试:"
echo "   ./deploy/restart.sh"