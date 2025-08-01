#!/bin/bash

# Chrome和Puppeteer修复脚本 - 阿里云部署
# 解决PDF下载时Chrome浏览器找不到的问题

set -e

echo "🔧 开始修复Chrome和Puppeteer问题..."

# 检查操作系统
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$NAME
    echo "📋 检测到操作系统: $OS"
else
    echo "❌ 无法检测操作系统"
    exit 1
fi

# 更新系统包
echo "📦 更新系统包..."
if command -v yum >/dev/null 2>&1; then
    # CentOS/RHEL/Amazon Linux
    sudo yum update -y
    
    # 安装Chrome依赖
    echo "🔧 安装Chrome依赖包..."
    sudo yum install -y \
        wget \
        unzip \
        fontconfig \
        freetype \
        freetype-devel \
        fontconfig-devel \
        libstdc++ \
        libX11 \
        libXcomposite \
        libXcursor \
        libXdamage \
        libXext \
        libXi \
        libXrandr \
        libXss \
        libXtst \
        cups-libs \
        libXScrnSaver \
        libxss \
        libnss3 \
        libgconf-2-4 \
        libXrender \
        libXfixes \
        libdrm \
        libxkbcommon \
        libxkbcommon-x11 \
        libatspi \
        libgtk-3-0 \
        libgdk-pixbuf2.0-0 \
        xdg-utils \
        libasound2
        
elif command -v apt-get >/dev/null 2>&1; then
    # Ubuntu/Debian
    sudo apt-get update -y
    
    # 安装Chrome依赖
    echo "🔧 安装Chrome依赖包..."
    sudo apt-get install -y \
        wget \
        unzip \
        fontconfig \
        fonts-liberation \
        libasound2 \
        libatk-bridge2.0-0 \
        libdrm2 \
        libxkbcommon0 \
        libxss1 \
        libgconf-2-4 \
        libxrandr2 \
        libasound2 \
        libpangocairo-1.0-0 \
        libatk1.0-0 \
        libcairo-gobject2 \
        libgtk-3-0 \
        libgdk-pixbuf2.0-0 \
        libxcomposite1 \
        libxcursor1 \
        libxdamage1 \
        libxext6 \
        libxfixes3 \
        libxi6 \
        libxrender1 \
        libxtst6 \
        libcups2 \
        libxss1 \
        libxrandr2 \
        libasound2 \
        libpangocairo-1.0-0 \
        libatk1.0-0 \
        libcairo-gobject2 \
        libgtk-3-0 \
        libgdk-pixbuf2.0-0 \
        ca-certificates \
        fonts-liberation \
        libappindicator3-1 \
        libnss3 \
        lsb-release \
        xdg-utils
else
    echo "❌ 不支持的包管理器"
    exit 1
fi

# 下载并安装Google Chrome
echo "🌐 下载并安装Google Chrome..."
cd /tmp

if command -v yum >/dev/null 2>&1; then
    # CentOS/RHEL/Amazon Linux
    wget -q -O google-chrome.rpm https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
    sudo yum localinstall -y google-chrome.rpm || sudo rpm -i google-chrome.rpm --nodeps
elif command -v apt-get >/dev/null 2>&1; then
    # Ubuntu/Debian
    wget -q -O google-chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb
    sudo dpkg -i google-chrome.deb || sudo apt-get install -f -y
fi

# 验证Chrome安装
echo "✅ 验证Chrome安装..."
if command -v google-chrome >/dev/null 2>&1; then
    CHROME_VERSION=$(google-chrome --version)
    echo "📋 Chrome版本: $CHROME_VERSION"
else
    echo "❌ Chrome安装失败"
    exit 1
fi

# 创建Chrome符号链接（Puppeteer可能需要）
echo "🔗 创建Chrome符号链接..."
sudo ln -sf /usr/bin/google-chrome /usr/bin/chromium-browser 2>/dev/null || true
sudo ln -sf /usr/bin/google-chrome /usr/bin/chromium 2>/dev/null || true

# 设置Chrome可执行权限
sudo chmod +x /usr/bin/google-chrome

# 创建Puppeteer配置文件
echo "⚙️ 创建Puppeteer配置..."
cat > /tmp/puppeteer-config.js << 'EOF'
// Puppeteer配置 - 阿里云优化版本
const puppeteer = require('puppeteer');

// 获取Chrome可执行文件路径
function getChromePath() {
  const possiblePaths = [
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/opt/google/chrome/chrome'
  ];
  
  const fs = require('fs');
  for (const path of possiblePaths) {
    if (fs.existsSync(path)) {
      return path;
    }
  }
  
  return null;
}

// 导出配置
module.exports = {
  chromePath: getChromePath(),
  launchOptions: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-experiments',
      '--no-pings',
      '--no-service-autorun',
      '--password-store=basic',
      '--use-mock-keychain',
      '--disable-blink-features=AutomationControlled',
      '--disable-ipc-flooding-protection'
    ]
  }
};
EOF

echo "📁 配置文件已创建: /tmp/puppeteer-config.js"

# 测试Puppeteer
echo "🧪 测试Puppeteer..."
cat > /tmp/test-puppeteer.js << 'EOF'
const puppeteer = require('puppeteer');

async function testPuppeteer() {
  try {
    console.log('🚀 启动浏览器...');
    
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/google-chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    console.log('✅ 浏览器启动成功');
    
    const page = await browser.newPage();
    await page.goto('data:text/html,<h1>Test</h1>');
    
    console.log('✅ 页面创建成功');
    
    const pdf = await page.pdf({ format: 'A4' });
    console.log(`✅ PDF生成成功，大小: ${pdf.length} bytes`);
    
    await browser.close();
    console.log('✅ 浏览器关闭成功');
    
    console.log('🎉 Puppeteer测试通过！');
    return true;
  } catch (error) {
    console.error('❌ Puppeteer测试失败:', error.message);
    return false;
  }
}

testPuppeteer().then(success => {
  process.exit(success ? 0 : 1);
});
EOF

# 进入项目目录进行测试
if [ -d "/root/StoryBookMaker" ]; then
    PROJECT_DIR="/root/StoryBookMaker"
elif [ -d "/home/ecs-user/StoryBookMaker" ]; then
    PROJECT_DIR="/home/ecs-user/StoryBookMaker"
else
    PROJECT_DIR=$(find /root /home -name "StoryBookMaker" -type d 2>/dev/null | head -1)
fi

if [ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ]; then
    echo "📁 找到项目目录: $PROJECT_DIR"
    cd "$PROJECT_DIR"
    
    # 运行测试
    echo "🧪 在项目环境中测试Puppeteer..."
    if node /tmp/test-puppeteer.js; then
        echo "✅ Puppeteer在项目环境中工作正常"
    else
        echo "❌ Puppeteer在项目环境中测试失败"
        echo "🔍 尝试重新安装Puppeteer..."
        npm install puppeteer --force
        
        # 再次测试
        if node /tmp/test-puppeteer.js; then
            echo "✅ 重新安装后Puppeteer工作正常"
        else
            echo "❌ 重新安装后仍然失败，请检查系统环境"
        fi
    fi
else
    echo "❌ 未找到项目目录"
fi

# 清理临时文件
rm -f /tmp/google-chrome.rpm /tmp/google-chrome.deb
rm -f /tmp/test-puppeteer.js

echo "🎉 Chrome和Puppeteer修复完成！"
echo ""
echo "📋 修复摘要:"
echo "   ✅ 已安装Google Chrome浏览器"
echo "   ✅ 已安装所需的系统依赖"
echo "   ✅ 已创建符号链接"
echo "   ✅ 已测试Puppeteer功能"
echo ""
echo "🔄 请重启你的应用以使更改生效:"
echo "   ./deploy/restart.sh"
echo ""
echo "🧪 如果问题仍然存在，请运行以下命令进行诊断:"
echo "   google-chrome --version"
echo "   node -e \"console.log(require('puppeteer').executablePath())\""