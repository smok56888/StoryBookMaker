#!/bin/bash

# Puppeteer问题快速修复脚本
# 使用方法: ./deploy/fix-puppeteer.sh

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

echo "🔧 修复Puppeteer安装问题..."

# 检查当前目录
if [ ! -f "package.json" ]; then
    print_error "请在项目根目录运行此脚本"
    exit 1
fi

# 1. 设置环境变量
echo "📝 设置环境变量..."
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_SKIP_DOWNLOAD=true
export NODE_OPTIONS="--max-old-space-size=4096"
print_status "环境变量设置完成"

# 2. 清理环境
echo "🧹 清理安装环境..."
rm -rf node_modules package-lock.json 2>/dev/null || true
print_status "环境清理完成"

# 3. 更新.npmrc配置
echo "⚙️ 更新npm配置..."
cat > .npmrc << EOF
legacy-peer-deps=true
registry=https://registry.npmmirror.com
puppeteer_skip_chromium_download=true
EOF
print_status "npm配置更新完成"

# 4. 安装系统依赖（如果需要）
if command -v apt-get &> /dev/null; then
    echo "📦 检查系统依赖..."
    if ! dpkg -l | grep -q libgbm1; then
        print_warning "检测到缺少系统依赖，正在安装..."
        sudo apt update
        sudo apt install -y \
            ca-certificates \
            fonts-liberation \
            libappindicator3-1 \
            libasound2 \
            libatk-bridge2.0-0 \
            libatk1.0-0 \
            libgbm1 \
            libgtk-3-0 \
            libnspr4 \
            libnss3 \
            libx11-xcb1 \
            libxcomposite1 \
            libxcursor1 \
            libxdamage1 \
            libxfixes3 \
            libxi6 \
            libxrandr2 \
            libxrender1 \
            libxss1 \
            libxtst6 \
            wget
        print_status "系统依赖安装完成"
    else
        print_status "系统依赖检查通过"
    fi
fi

# 5. 重新安装依赖
echo "📦 重新安装项目依赖..."
if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v yarn &> /dev/null; then
    yarn install
else
    npm install --legacy-peer-deps
fi
print_status "依赖安装完成"

# 6. 检查Puppeteer状态
echo "🔍 检查Puppeteer安装状态..."
if [ -d "node_modules/puppeteer" ]; then
    print_status "Puppeteer已安装（跳过Chrome下载）"
else
    print_warning "Puppeteer未找到，但这可能是正常的"
fi

# 7. 尝试构建项目
echo "🔨 尝试构建项目..."
if npm run build --legacy-peer-deps; then
    print_status "项目构建成功！"
    
    echo ""
    echo "🎉 修复完成！现在可以启动应用："
    echo "pm2 start npm --name 'storybook-maker' -- start"
    
else
    print_error "项目构建失败，请检查其他依赖问题"
    echo ""
    echo "📋 可以尝试的其他方案："
    echo "1. 完全移除Puppeteer: npm uninstall puppeteer"
    echo "2. 手动安装Chrome: sudo apt install google-chrome-stable"
    echo "3. 查看详细错误日志进行排查"
    exit 1
fi

echo ""
echo "📝 注意事项："
echo "- PDF生成功能可能需要手动安装Chrome浏览器"
echo "- 如果需要PDF功能，运行: sudo apt install google-chrome-stable"
echo "- 环境变量已设置为跳过Chrome下载，这是正常的"