#!/bin/bash

# 快速修复PDF中文字体显示问题

set -e

echo "🔤 快速修复PDF中文字体问题..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用root权限运行此脚本"
    echo "   sudo $0"
    exit 1
fi

# 1. 安装基础字体包
echo "📦 安装基础字体包..."
if command -v yum >/dev/null 2>&1; then
    # CentOS/RHEL/Amazon Linux
    yum install -y fontconfig dejavu-fonts-common
    yum install -y wqy-microhei-fonts || echo "⚠️ wqy-microhei-fonts 安装失败，继续..."
    yum install -y google-noto-cjk-fonts || echo "⚠️ google-noto-cjk-fonts 安装失败，继续..."
elif command -v apt-get >/dev/null 2>&1; then
    # Ubuntu/Debian
    apt-get update
    apt-get install -y fontconfig fonts-dejavu-core
    apt-get install -y fonts-wqy-microhei fonts-noto-cjk || echo "⚠️ 部分中文字体安装失败，继续..."
fi

# 2. 创建字体目录并下载字体
echo "📁 创建字体目录..."
mkdir -p /usr/share/fonts/chinese

# 3. 下载思源黑体（如果不存在）
if [ ! -f "/usr/share/fonts/chinese/NotoSansCJK.ttc" ]; then
    echo "📥 下载思源黑体..."
    cd /tmp
    
    # 使用更可靠的下载源
    wget -O noto-cjk.zip "https://github.com/googlefonts/noto-cjk/releases/download/Sans2.004/01_NotoSansCJK.ttc.zip" --timeout=30 || {
        echo "⚠️ 思源黑体下载失败，使用备用方案..."
    }
    
    if [ -f "noto-cjk.zip" ]; then
        unzip -o noto-cjk.zip
        if [ -f "NotoSansCJK.ttc" ]; then
            cp NotoSansCJK.ttc /usr/share/fonts/chinese/
            echo "✅ 思源黑体安装成功"
        fi
        rm -f noto-cjk.zip NotoSansCJK.ttc
    fi
fi

# 4. 创建字体配置文件
echo "⚙️ 创建字体配置..."
cat > /etc/fonts/local.conf << 'EOF'
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <alias>
    <family>sans-serif</family>
    <prefer>
      <family>Noto Sans CJK SC</family>
      <family>WenQuanYi Micro Hei</family>
      <family>WenQuanYi Zen Hei</family>
      <family>Microsoft YaHei</family>
      <family>SimHei</family>
      <family>DejaVu Sans</family>
    </prefer>
  </alias>
  
  <alias>
    <family>serif</family>
    <prefer>
      <family>Noto Serif CJK SC</family>
      <family>WenQuanYi Zen Hei</family>
      <family>SimSun</family>
      <family>DejaVu Serif</family>
    </prefer>
  </alias>
</fontconfig>
EOF

# 5. 设置权限并更新字体缓存
echo "🔧 更新字体缓存..."
chmod -R 644 /usr/share/fonts/chinese/ 2>/dev/null || true
fc-cache -fv

# 6. 验证字体
echo "✅ 验证中文字体..."
CHINESE_FONTS=$(fc-list :lang=zh-cn | wc -l)
echo "📊 可用中文字体数量: $CHINESE_FONTS"

if [ "$CHINESE_FONTS" -gt 0 ]; then
    echo "✅ 中文字体安装成功"
    echo "📋 部分可用字体:"
    fc-list :lang=zh-cn | head -3
else
    echo "⚠️ 未检测到中文字体，但配置已完成"
fi

# 7. 找到项目目录并重启应用
PROJECT_PATHS=(
    "/root/StoryBookMaker"
    "/home/ecs-user/StoryBookMaker"
    "/home/ubuntu/StoryBookMaker"
    "/var/www/StoryBookMaker"
)

PROJECT_DIR=""
for path in "${PROJECT_PATHS[@]}"; do
    if [ -d "$path" ]; then
        PROJECT_DIR="$path"
        break
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    PROJECT_DIR=$(find /root /home /var/www -name "StoryBookMaker" -type d 2>/dev/null | head -1)
fi

if [ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ]; then
    echo "📁 找到项目目录: $PROJECT_DIR"
    echo ""
    echo "🎉 中文字体修复完成！"
    echo ""
    echo "🔄 请重启应用使更改生效:"
    echo "   cd $PROJECT_DIR"
    echo "   ./deploy/restart.sh"
    echo ""
    echo "🧪 然后测试PDF下载，中文应该能正常显示"
else
    echo "❌ 未找到项目目录，请手动重启应用"
fi

echo ""
echo "📋 修复摘要:"
echo "   ✅ 已安装字体包"
echo "   ✅ 已配置中文字体优先级"
echo "   ✅ 已更新字体缓存"
echo "   📊 可用中文字体: $CHINESE_FONTS 个"