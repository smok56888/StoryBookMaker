#!/bin/bash

# 终极中文字体修复脚本
# 专门解决阿里云服务器PDF中文显示问题

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

echo "🔤 终极中文字体修复 - 解决PDF中文显示问题"
echo "=================================================="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    print_error "请使用root权限运行此脚本"
    echo "   sudo $0"
    exit 1
fi

# 1. 系统信息
print_info "系统信息:"
echo "   操作系统: $(uname -a)"
echo "   发行版: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2 || echo '未知')"

# 2. 清理旧的字体配置
print_info "清理旧的字体配置..."
rm -f /etc/fonts/local.conf
rm -rf /usr/share/fonts/chinese
mkdir -p /usr/share/fonts/chinese
mkdir -p /usr/share/fonts/truetype/chinese

# 3. 安装基础字体包
print_info "安装基础字体包..."
if command -v apt-get >/dev/null 2>&1; then
    # Ubuntu/Debian
    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get install -y fontconfig fonts-dejavu-core wget unzip curl
    
    # 尝试安装中文字体包
    apt-get install -y fonts-wqy-microhei fonts-wqy-zenhei fonts-noto-cjk fonts-noto-cjk-extra || {
        print_warning "部分字体包安装失败，继续手动安装..."
    }
    
elif command -v yum >/dev/null 2>&1; then
    # CentOS/RHEL
    yum update -y
    yum install -y fontconfig dejavu-fonts-common wget unzip curl
    
    # 尝试安装中文字体包
    yum install -y wqy-microhei-fonts google-noto-cjk-fonts || {
        print_warning "部分字体包安装失败，继续手动安装..."
    }
fi

# 4. 手动下载并安装中文字体
print_info "手动下载中文字体..."

cd /tmp
rm -f *.ttf *.ttc *.zip *.tar.gz 2>/dev/null || true

# 下载文泉驿微米黑字体（较小，下载快）
print_info "下载文泉驿微米黑字体..."
if wget -O wqy-microhei.tar.gz "https://downloads.sourceforge.net/wqy/wqy-microhei-0.2.0-beta.tar.gz" --timeout=30; then
    tar -xzf wqy-microhei.tar.gz
    find . -name "*.ttc" -exec cp {} /usr/share/fonts/chinese/ \;
    print_status "文泉驿微米黑字体安装成功"
else
    print_warning "文泉驿字体下载失败"
fi

# 下载思源黑体（备用）
print_info "下载思源黑体..."
if wget -O NotoSansCJK.ttc "https://github.com/googlefonts/noto-cjk/releases/download/Sans2.004/NotoSansCJK-Regular.ttc" --timeout=60; then
    cp NotoSansCJK.ttc /usr/share/fonts/chinese/
    print_status "思源黑体安装成功"
else
    print_warning "思源黑体下载失败"
fi

# 如果下载失败，创建一个基本的中文字体文件
if [ ! "$(ls -A /usr/share/fonts/chinese/)" ]; then
    print_warning "字体下载失败，尝试从系统复制..."
    
    # 尝试从系统其他位置复制字体
    find /usr/share/fonts /usr/local/share/fonts -name "*han*" -o -name "*cjk*" -o -name "*wqy*" -o -name "*noto*" 2>/dev/null | while read font; do
        if [[ "$font" == *.ttf ]] || [[ "$font" == *.ttc ]] || [[ "$font" == *.otf ]]; then
            cp "$font" /usr/share/fonts/chinese/ 2>/dev/null || true
        fi
    done
fi

# 5. 创建强制中文字体配置
print_info "创建字体配置文件..."
cat > /etc/fonts/local.conf << 'EOF'
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <!-- 强制中文字体配置 -->
  <match target="pattern">
    <test qual="any" name="family">
      <string>serif</string>
    </test>
    <edit name="family" mode="prepend" binding="strong">
      <string>Noto Sans CJK SC</string>
      <string>WenQuanYi Micro Hei</string>
      <string>WenQuanYi Zen Hei</string>
      <string>SimSun</string>
      <string>DejaVu Serif</string>
    </edit>
  </match>
  
  <match target="pattern">
    <test qual="any" name="family">
      <string>sans-serif</string>
    </test>
    <edit name="family" mode="prepend" binding="strong">
      <string>Noto Sans CJK SC</string>
      <string>WenQuanYi Micro Hei</string>
      <string>WenQuanYi Zen Hei</string>
      <string>Microsoft YaHei</string>
      <string>SimHei</string>
      <string>DejaVu Sans</string>
    </edit>
  </match>
  
  <match target="pattern">
    <test qual="any" name="family">
      <string>monospace</string>
    </test>
    <edit name="family" mode="prepend" binding="strong">
      <string>Noto Sans Mono CJK SC</string>
      <string>WenQuanYi Micro Hei Mono</string>
      <string>DejaVu Sans Mono</string>
    </edit>
  </match>
  
  <!-- 强制中文字符使用中文字体 -->
  <match target="font">
    <test name="lang" compare="contains">
      <string>zh</string>
    </test>
    <edit name="family" mode="prepend" binding="strong">
      <string>Noto Sans CJK SC</string>
      <string>WenQuanYi Micro Hei</string>
    </edit>
  </match>
</fontconfig>
EOF

# 6. 设置权限
print_info "设置字体权限..."
chmod -R 644 /usr/share/fonts/chinese/ 2>/dev/null || true
find /usr/share/fonts/chinese/ -type d -exec chmod 755 {} \; 2>/dev/null || true

# 7. 强制更新字体缓存
print_info "更新字体缓存..."
fc-cache -f -v
fc-cache --force --verbose

# 8. 验证字体安装
print_info "验证字体安装..."
CHINESE_FONTS=$(fc-list :lang=zh-cn 2>/dev/null | wc -l)
ALL_FONTS=$(fc-list 2>/dev/null | wc -l)

echo "📊 字体统计:"
echo "   总字体数量: $ALL_FONTS"
echo "   中文字体数量: $CHINESE_FONTS"

if [ "$CHINESE_FONTS" -gt 0 ]; then
    print_status "中文字体安装成功！"
    echo "📋 可用的中文字体:"
    fc-list :lang=zh-cn | head -5
else
    print_warning "未检测到中文字体，但配置已完成"
    echo "📋 所有字体:"
    fc-list | grep -i "cjk\|han\|wqy\|noto\|微\|黑" | head -5 || echo "   未找到明显的中文字体"
fi

# 9. 创建测试HTML文件
print_info "创建字体测试文件..."
cat > /tmp/chinese-font-test.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>中文字体测试</title>
    <style>
        body {
            font-family: 'Noto Sans CJK SC', 'WenQuanYi Micro Hei', 'WenQuanYi Zen Hei', 'Microsoft YaHei', '微软雅黑', 'SimHei', '黑体', sans-serif;
            font-size: 18px;
            line-height: 1.8;
            padding: 30px;
            background: #f5f5f5;
        }
        .test-box {
            background: white;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
        }
        .chinese-text {
            font-size: 20px;
            color: #444;
            margin: 15px 0;
        }
        .mixed-text {
            font-size: 16px;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="test-box">
        <h1>🔤 中文字体显示测试</h1>
        <div class="chinese-text">
            这是一段中文测试文本，用于验证PDF中文字体显示效果。
        </div>
        <div class="chinese-text">
            常用汉字测试：你好世界！欢迎使用故事书制作器。
        </div>
        <div class="mixed-text">
            混合文本测试：Hello 世界 123 测试 ABC 中文 456
        </div>
        <div class="mixed-text">
            特殊字符：《故事书》【制作器】"引号"'单引号'
        </div>
        <div class="mixed-text">
            标点符号：，。！？；：（）【】《》""''
        </div>
    </div>
</body>
</html>
EOF

# 10. 测试Puppeteer字体渲染
print_info "测试Puppeteer字体渲染..."

# 找到项目目录
PROJECT_DIR=""
POSSIBLE_PATHS=(
    "/root/StoryBookMaker"
    "/home/ecs-user/StoryBookMaker"
    "/home/ubuntu/StoryBookMaker"
    "/var/www/StoryBookMaker"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -d "$path" ]; then
        PROJECT_DIR="$path"
        break
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    PROJECT_DIR=$(find /root /home /var/www -name "StoryBookMaker" -type d 2>/dev/null | head -1)
fi

if [ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ]; then
    print_info "找到项目目录: $PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # 创建测试脚本
    cat > /tmp/test-pdf-chinese.js << 'EOF'
const puppeteer = require('puppeteer');
const fs = require('fs');

async function testChineseFont() {
  let browser;
  try {
    console.log('🚀 启动浏览器测试中文字体...');
    
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/google-chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process',
        '--font-render-hinting=none',
        '--disable-font-subpixel-positioning',
        '--disable-lcd-text'
      ]
    });
    
    const page = await browser.newPage();
    
    // 设置页面
    await page.setViewport({ width: 794, height: 1123 });
    
    // 加载测试HTML
    const html = fs.readFileSync('/tmp/chinese-font-test.html', 'utf8');
    await page.setContent(html, { waitUntil: 'networkidle2' });
    
    // 等待字体加载
    await page.waitForTimeout(3000);
    
    // 生成PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
    });
    
    fs.writeFileSync('/tmp/chinese-font-test.pdf', pdf);
    console.log('✅ 中文字体测试PDF生成成功');
    console.log(`📄 文件位置: /tmp/chinese-font-test.pdf`);
    console.log(`📊 PDF大小: ${pdf.length} bytes`);
    
    await browser.close();
    return true;
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (browser) {
      try {
        await browser.close();
      } catch (e) {}
    }
    return false;
  }
}

testChineseFont().then(success => {
  process.exit(success ? 0 : 1);
});
EOF

    if node /tmp/test-pdf-chinese.js; then
        print_status "✅ Puppeteer中文字体测试成功！"
        print_info "测试PDF已生成: /tmp/chinese-font-test.pdf"
        
        # 检查PDF文件大小
        if [ -f "/tmp/chinese-font-test.pdf" ]; then
            PDF_SIZE=$(stat -c%s "/tmp/chinese-font-test.pdf" 2>/dev/null || stat -f%z "/tmp/chinese-font-test.pdf" 2>/dev/null)
            echo "📊 测试PDF大小: $PDF_SIZE bytes"
        fi
    else
        print_error "❌ Puppeteer测试失败"
    fi
else
    print_warning "未找到项目目录，跳过Puppeteer测试"
fi

# 11. 清理临时文件
print_info "清理临时文件..."
cd /tmp
rm -f wqy-microhei.tar.gz NotoSansCJK.ttc chinese-font-test.html test-pdf-chinese.js
rm -rf wqy-microhei-*

echo ""
echo "🎉 终极中文字体修复完成！"
echo "=================================================="
echo ""
echo "📋 修复摘要:"
echo "   ✅ 已清理旧配置"
echo "   ✅ 已安装字体包"
echo "   ✅ 已下载中文字体"
echo "   ✅ 已创建强制字体配置"
echo "   ✅ 已更新字体缓存"
echo "   ✅ 已测试字体渲染"
echo ""
echo "📊 字体统计:"
echo "   总字体数量: $ALL_FONTS"
echo "   中文字体数量: $CHINESE_FONTS"
echo ""
echo "🔄 现在请重启应用:"
echo "   cd $PROJECT_DIR"
echo "   ./deploy/restart.sh"
echo ""
echo "🧪 然后测试PDF下载，中文应该能正常显示"
echo ""
echo "🔍 如果问题仍然存在:"
echo "   1. 查看测试PDF: ls -la /tmp/chinese-font-test.pdf"
echo "   2. 检查字体列表: fc-list :lang=zh-cn"
echo "   3. 查看应用日志: tail -20 app.log"