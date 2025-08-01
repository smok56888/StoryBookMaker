#!/bin/bash

# PDF下载问题快速修复脚本
# 专门解决阿里云部署中Chrome/Puppeteer问题

set -e

echo "🚀 开始修复PDF下载问题..."

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用root权限运行此脚本"
    echo "   sudo $0"
    exit 1
fi

# 1. 安装Chrome浏览器
echo "📦 安装Google Chrome..."

# 检查系统类型
if command -v yum >/dev/null 2>&1; then
    # CentOS/RHEL/Amazon Linux
    echo "🔧 检测到CentOS/RHEL系统"
    
    # 安装必要依赖
    yum install -y wget
    
    # 下载并安装Chrome
    cd /tmp
    wget -q https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
    yum localinstall -y google-chrome-stable_current_x86_64.rpm || rpm -i google-chrome-stable_current_x86_64.rpm --nodeps
    
elif command -v apt-get >/dev/null 2>&1; then
    # Ubuntu/Debian
    echo "🔧 检测到Ubuntu/Debian系统"
    
    # 更新包列表
    apt-get update
    
    # 安装必要依赖
    apt-get install -y wget gnupg
    
    # 添加Google Chrome仓库
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add -
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
    
    # 安装Chrome
    apt-get update
    apt-get install -y google-chrome-stable
    
else
    echo "❌ 不支持的操作系统"
    exit 1
fi

# 2. 验证Chrome安装
echo "✅ 验证Chrome安装..."
if command -v google-chrome >/dev/null 2>&1; then
    CHROME_VERSION=$(google-chrome --version)
    echo "📋 Chrome版本: $CHROME_VERSION"
else
    echo "❌ Chrome安装失败"
    exit 1
fi

# 3. 创建符号链接
echo "🔗 创建Chrome符号链接..."
ln -sf /usr/bin/google-chrome /usr/bin/chromium-browser 2>/dev/null || true
ln -sf /usr/bin/google-chrome /usr/bin/chromium 2>/dev/null || true

# 4. 设置权限
chmod +x /usr/bin/google-chrome

# 5. 找到项目目录
echo "📁 查找项目目录..."
PROJECT_DIR=""

# 常见的项目路径
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
    # 如果没找到，尝试搜索
    PROJECT_DIR=$(find /root /home /var/www -name "StoryBookMaker" -type d 2>/dev/null | head -1)
    if [ -n "$PROJECT_DIR" ]; then
        echo "✅ 搜索到项目目录: $PROJECT_DIR"
    else
        echo "❌ 未找到项目目录"
        exit 1
    fi
fi

# 6. 重新安装Puppeteer（如果需要）
echo "🔄 重新安装Puppeteer..."
cd "$PROJECT_DIR"

# 检查是否有package.json
if [ -f "package.json" ]; then
    # 强制重新安装puppeteer
    npm install puppeteer --force
    echo "✅ Puppeteer重新安装完成"
else
    echo "❌ 未找到package.json文件"
    exit 1
fi

# 7. 测试Puppeteer
echo "🧪 测试Puppeteer..."
cat > /tmp/test-pdf.js << 'EOF'
const puppeteer = require('puppeteer');

async function testPDF() {
  let browser;
  try {
    console.log('🚀 启动浏览器...');
    
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/google-chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
      ]
    });
    
    console.log('✅ 浏览器启动成功');
    
    const page = await browser.newPage();
    await page.setContent('<h1>PDF测试</h1><p>这是一个测试页面</p>');
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true
    });
    
    console.log(`✅ PDF生成成功，大小: ${pdf.length} bytes`);
    
    await browser.close();
    console.log('✅ 测试完成');
    
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

testPDF().then(success => {
  process.exit(success ? 0 : 1);
});
EOF

if node /tmp/test-pdf.js; then
    echo "✅ Puppeteer测试通过"
else
    echo "❌ Puppeteer测试失败"
    echo "🔍 尝试安装额外依赖..."
    
    if command -v yum >/dev/null 2>&1; then
        yum install -y \
            libX11 libXcomposite libXcursor libXdamage libXext \
            libXi libXrandr libXss libXtst cups-libs libXScrnSaver \
            libxss libnss3 libgconf-2-4 libXrender libXfixes \
            libdrm libxkbcommon libxkbcommon-x11 libatspi \
            libgtk-3-0 libgdk-pixbuf2.0-0 xdg-utils libasound2
    elif command -v apt-get >/dev/null 2>&1; then
        apt-get install -y \
            libasound2 libatk-bridge2.0-0 libdrm2 libxkbcommon0 \
            libxss1 libgconf-2-4 libxrandr2 libasound2 \
            libpangocairo-1.0-0 libatk1.0-0 libcairo-gobject2 \
            libgtk-3-0 libgdk-pixbuf2.0-0 libxcomposite1 \
            libxcursor1 libxdamage1 libxext6 libxfixes3 \
            libxi6 libxrender1 libxtst6 libcups2 libxss1 \
            libxrandr2 libasound2 libpangocairo-1.0-0 \
            libatk1.0-0 libcairo-gobject2 libgtk-3-0 \
            libgdk-pixbuf2.0-0 ca-certificates fonts-liberation \
            libappindicator3-1 libnss3 lsb-release xdg-utils
    fi
    
    # 再次测试
    if node /tmp/test-pdf.js; then
        echo "✅ 安装依赖后测试通过"
    else
        echo "❌ 仍然失败，可能需要手动检查"
    fi
fi

# 8. 清理临时文件
rm -f /tmp/google-chrome-stable_current_x86_64.rpm
rm -f /tmp/test-pdf.js

echo ""
echo "🎉 PDF下载问题修复完成！"
echo ""
echo "📋 修复摘要:"
echo "   ✅ 已安装Google Chrome浏览器"
echo "   ✅ 已重新安装Puppeteer"
echo "   ✅ 已测试PDF生成功能"
echo ""
echo "🔄 现在请重启你的应用:"
echo "   cd $PROJECT_DIR"
echo "   ./deploy/restart.sh"
echo ""
echo "🧪 如果问题仍然存在，请检查应用日志:"
echo "   tail -f $PROJECT_DIR/app.log"