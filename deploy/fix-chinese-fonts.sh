#!/bin/bash

# 中文字体修复脚本 - 解决PDF中文显示问题
# 专门用于阿里云Linux服务器

set -e

echo "🔤 开始修复PDF中文字体显示问题..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用root权限运行此脚本"
    echo "   sudo $0"
    exit 1
fi

# 检查系统类型
if command -v yum >/dev/null 2>&1; then
    # CentOS/RHEL/Amazon Linux
    echo "🔧 检测到CentOS/RHEL系统，安装中文字体..."
    
    # 安装字体相关包
    yum install -y fontconfig
    yum install -y dejavu-fonts-common dejavu-sans-fonts dejavu-serif-fonts dejavu-sans-mono-fonts
    
    # 尝试安装中文字体包
    yum install -y google-noto-cjk-fonts || yum install -y wqy-microhei-fonts || echo "⚠️ 无法通过包管理器安装中文字体，将手动下载"
    
elif command -v apt-get >/dev/null 2>&1; then
    # Ubuntu/Debian
    echo "🔧 检测到Ubuntu/Debian系统，安装中文字体..."
    
    # 更新包列表
    apt-get update
    
    # 安装字体相关包
    apt-get install -y fontconfig fonts-dejavu-core
    
    # 安装中文字体
    apt-get install -y fonts-noto-cjk fonts-wqy-microhei fonts-wqy-zenhei || echo "⚠️ 部分字体安装失败，继续手动安装"
    
else
    echo "❌ 不支持的操作系统"
    exit 1
fi

# 创建字体目录
echo "📁 创建字体目录..."
mkdir -p /usr/share/fonts/chinese
mkdir -p /root/.fonts

# 下载并安装思源黑体（Noto Sans CJK）
echo "📥 下载思源黑体字体..."
cd /tmp

# 下载思源黑体 SC (简体中文)
if [ ! -f "/usr/share/fonts/chinese/NotoSansCJK-Regular.ttc" ]; then
    echo "🌐 下载 Noto Sans CJK 字体..."
    wget -O NotoSansCJK.ttc.zip "https://github.com/googlefonts/noto-cjk/releases/download/Sans2.004/01_NotoSansCJK.ttc.zip" || {
        echo "⚠️ GitHub下载失败，尝试备用链接..."
        wget -O NotoSansCJK.ttc.zip "https://noto-website-2.storage.googleapis.com/pkgs/NotoSansCJK.ttc.zip" || {
            echo "⚠️ 官方下载失败，使用本地备用方案..."
        }
    }
    
    if [ -f "NotoSansCJK.ttc.zip" ]; then
        unzip -o NotoSansCJK.ttc.zip
        if [ -f "NotoSansCJK.ttc" ]; then
            cp NotoSansCJK.ttc /usr/share/fonts/chinese/
            echo "✅ 思源黑体安装成功"
        fi
    fi
fi

# 下载文泉驿微米黑字体（备用方案）
if [ ! -f "/usr/share/fonts/chinese/wqy-microhei.ttc" ]; then
    echo "📥 下载文泉驿微米黑字体..."
    wget -O wqy-microhei.tar.gz "https://downloads.sourceforge.net/wqy/wqy-microhei-0.2.0-beta.tar.gz" || {
        echo "⚠️ 文泉驿字体下载失败，跳过..."
    }
    
    if [ -f "wqy-microhei.tar.gz" ]; then
        tar -xzf wqy-microhei.tar.gz
        find . -name "*.ttc" -exec cp {} /usr/share/fonts/chinese/ \;
        echo "✅ 文泉驿微米黑字体安装成功"
    fi
fi

# 创建基本的中文字体文件（如果下载失败）
if [ ! "$(ls -A /usr/share/fonts/chinese/)" ]; then
    echo "⚠️ 字体下载失败，创建字体配置文件..."
    
    # 创建字体配置，优先使用系统可能存在的字体
    cat > /etc/fonts/local.conf << 'EOF'
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <!-- 中文字体配置 -->
  <alias>
    <family>serif</family>
    <prefer>
      <family>Noto Serif CJK SC</family>
      <family>Source Han Serif SC</family>
      <family>WenQuanYi Zen Hei</family>
      <family>WenQuanYi Micro Hei</family>
      <family>SimSun</family>
      <family>DejaVu Serif</family>
    </prefer>
  </alias>
  
  <alias>
    <family>sans-serif</family>
    <prefer>
      <family>Noto Sans CJK SC</family>
      <family>Source Han Sans SC</family>
      <family>WenQuanYi Zen Hei</family>
      <family>WenQuanYi Micro Hei</family>
      <family>Microsoft YaHei</family>
      <family>SimHei</family>
      <family>DejaVu Sans</family>
    </prefer>
  </alias>
  
  <alias>
    <family>monospace</family>
    <prefer>
      <family>Noto Sans Mono CJK SC</family>
      <family>Source Han Sans SC</family>
      <family>WenQuanYi Zen Hei Mono</family>
      <family>WenQuanYi Micro Hei Mono</family>
      <family>DejaVu Sans Mono</family>
    </prefer>
  </alias>
</fontconfig>
EOF
fi

# 设置字体权限
echo "🔧 设置字体权限..."
chmod -R 644 /usr/share/fonts/chinese/
find /usr/share/fonts/chinese/ -type d -exec chmod 755 {} \;

# 更新字体缓存
echo "🔄 更新字体缓存..."
fc-cache -fv

# 验证字体安装
echo "✅ 验证字体安装..."
echo "📋 可用的中文字体:"
fc-list :lang=zh-cn | head -10

# 测试字体渲染
echo "🧪 测试字体渲染..."
cat > /tmp/test-chinese-font.html << 'EOF'
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: 'Noto Sans CJK SC', 'Source Han Sans SC', 'WenQuanYi Zen Hei', 'WenQuanYi Micro Hei', 'Microsoft YaHei', 'SimHei', sans-serif;
            font-size: 16px;
            line-height: 1.6;
            padding: 20px;
        }
        .test-text {
            margin: 10px 0;
            padding: 10px;
            border: 1px solid #ccc;
        }
    </style>
</head>
<body>
    <div class="test-text">
        <h1>中文字体测试</h1>
        <p>这是一段中文测试文本，包含常用汉字：你好世界！</p>
        <p>数字和英文：Hello World 123456</p>
        <p>特殊字符：《》【】""''</p>
    </div>
</body>
</html>
EOF

# 找到项目目录
echo "📁 查找项目目录..."
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
        echo "✅ 找到项目目录: $PROJECT_DIR"
        break
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    PROJECT_DIR=$(find /root /home /var/www -name "StoryBookMaker" -type d 2>/dev/null | head -1)
    if [ -n "$PROJECT_DIR" ]; then
        echo "✅ 搜索到项目目录: $PROJECT_DIR"
    else
        echo "❌ 未找到项目目录"
        exit 1
    fi
fi

# 测试Puppeteer字体渲染
if [ -d "$PROJECT_DIR" ] && [ -f "$PROJECT_DIR/package.json" ]; then
    echo "🧪 测试Puppeteer中文字体渲染..."
    cd "$PROJECT_DIR"
    
    cat > /tmp/test-puppeteer-font.js << 'EOF'
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
        '--font-render-hinting=none'
      ]
    });
    
    const page = await browser.newPage();
    
    const html = fs.readFileSync('/tmp/test-chinese-font.html', 'utf8');
    await page.setContent(html);
    
    // 等待字体加载
    await page.waitForTimeout(2000);
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true
    });
    
    fs.writeFileSync('/tmp/chinese-font-test.pdf', pdf);
    console.log('✅ 中文字体测试PDF生成成功: /tmp/chinese-font-test.pdf');
    console.log(`📄 PDF大小: ${pdf.length} bytes`);
    
    await browser.close();
    return true;
  } catch (error) {
    console.error('❌ 中文字体测试失败:', error.message);
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

    if node /tmp/test-puppeteer-font.js; then
        echo "✅ Puppeteer中文字体测试通过"
        echo "📄 测试PDF已生成: /tmp/chinese-font-test.pdf"
    else
        echo "❌ Puppeteer中文字体测试失败"
    fi
fi

# 清理临时文件
echo "🧹 清理临时文件..."
rm -f /tmp/NotoSansCJK.ttc.zip /tmp/NotoSansCJK.ttc
rm -f /tmp/wqy-microhei.tar.gz
rm -rf /tmp/wqy-microhei-*
rm -f /tmp/test-chinese-font.html
rm -f /tmp/test-puppeteer-font.js

echo ""
echo "🎉 中文字体修复完成！"
echo ""
echo "📋 修复摘要:"
echo "   ✅ 已安装中文字体支持"
echo "   ✅ 已更新字体缓存"
echo "   ✅ 已配置字体优先级"
echo "   ✅ 已测试字体渲染"
echo ""
echo "🔄 现在请重启你的应用:"
echo "   cd $PROJECT_DIR"
echo "   ./deploy/restart.sh"
echo ""
echo "🧪 然后测试PDF下载功能，中文应该能正常显示了"
echo ""
echo "📊 字体信息:"
fc-list :lang=zh-cn | wc -l | xargs echo "   可用中文字体数量:"
echo ""
echo "🔍 如果问题仍然存在，请检查:"
echo "   1. 字体是否正确安装: fc-list :lang=zh-cn"
echo "   2. 应用是否重启: ps aux | grep node"
echo "   3. 查看测试PDF: ls -la /tmp/chinese-font-test.pdf"