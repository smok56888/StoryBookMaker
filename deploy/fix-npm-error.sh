#!/bin/bash

# 快速修复npm配置错误脚本
# 使用方法: ./fix-npm-error.sh

echo "🔧 修复npm配置错误..."

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# 1. 清理所有可能有问题的npm配置
echo "清理npm配置..."
npm config delete registry 2>/dev/null || true
npm config delete disturl 2>/dev/null || true
npm config delete sass_binary_site 2>/dev/null || true
npm config delete electron_mirror 2>/dev/null || true
npm config delete puppeteer_download_host 2>/dev/null || true
npm config delete chromedriver_cdnurl 2>/dev/null || true
npm config delete operadriver_cdnurl 2>/dev/null || true
npm config delete phantomjs_cdnurl 2>/dev/null || true
npm config delete selenium_cdnurl 2>/dev/null || true
npm config delete node_inspector_cdnurl 2>/dev/null || true

print_status "已清理npm配置"

# 2. 设置正确的npm配置
echo "设置正确的npm配置..."
npm config set registry https://registry.npmmirror.com
npm config set legacy-peer-deps true
npm config set fund false
npm config set audit false

print_status "npm配置已修复"

# 3. 创建正确的.npmrc文件
echo "创建正确的.npmrc文件..."
cat > .npmrc << EOF
registry=https://registry.npmmirror.com
legacy-peer-deps=true
fund=false
audit=false
EOF

print_status ".npmrc文件已创建"

# 4. 设置环境变量（这些不能放在.npmrc中）
echo "设置环境变量..."
export SASS_BINARY_SITE=https://npmmirror.com/mirrors/node-sass/
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
export PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors
export CHROMEDRIVER_CDNURL=https://npmmirror.com/mirrors/chromedriver
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_SKIP_DOWNLOAD=true

print_status "环境变量已设置"

# 5. 清理缓存
echo "清理npm缓存..."
npm cache clean --force 2>/dev/null || true
rm -rf node_modules package-lock.json 2>/dev/null || true

print_status "缓存已清理"

echo ""
print_status "npm配置修复完成!"

echo ""
echo "现在你可以运行:"
echo "1. npm install --legacy-peer-deps"
echo "2. 或者使用简化部署脚本: ./deploy/simple-china-deploy.sh"

echo ""
echo "如果还有问题，请运行:"
echo "npm config list"
echo "检查配置是否正确"