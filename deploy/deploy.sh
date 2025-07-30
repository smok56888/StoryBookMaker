#!/bin/bash

# StoryBookMaker 自动部署脚本
# 使用方法: ./deploy.sh

set -e

echo "🚀 开始部署 StoryBookMaker..."

# 配置变量
PROJECT_DIR="/home/ecs-user/code/StoryBookMaker"
APP_NAME="storybook-maker"
REPO_URL="https://github.com/smok56888/StoryBookMaker.git"
# 如果GitHub无法访问，可以使用Gitee镜像
# REPO_URL="https://gitee.com/你的用户名/StoryBookMaker.git"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 检查是否为首次部署
if [ ! -d "$PROJECT_DIR" ]; then
    echo "📦 首次部署，克隆项目..."
    
    # 创建项目目录
    mkdir -p /home/ecs-user/code
    cd /home/ecs-user/code
    
    # 克隆项目
    git clone $REPO_URL
    
    print_status "项目克隆完成"
else
    echo "🔄 更新现有项目..."
    cd $PROJECT_DIR
    
    # 停止应用
    if pm2 list | grep -q $APP_NAME; then
        pm2 stop $APP_NAME
        print_status "应用已停止"
    fi
    
    # 拉取最新代码
    git pull origin main
    print_status "代码更新完成"
fi

cd $PROJECT_DIR

# 检查环境变量文件
if [ ! -f ".env.local" ]; then
    print_warning "未找到 .env.local 文件"
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_warning "已复制 .env.example 到 .env.local，请编辑配置实际的 API 密钥"
        echo "请编辑 .env.local 文件配置正确的 API 密钥后重新运行部署脚本"
        exit 1
    fi
fi

# 安装依赖
echo "📦 安装依赖..."

# 创建.npmrc配置文件解决依赖冲突
if [ ! -f ".npmrc" ]; then
    echo "legacy-peer-deps=true" > .npmrc
    echo "registry=https://registry.npmmirror.com" >> .npmrc
    print_status "已创建.npmrc配置文件"
fi

# 设置Node.js内存限制和Puppeteer配置
export NODE_OPTIONS="--max-old-space-size=4096"
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_SKIP_DOWNLOAD=true

# 添加Puppeteer配置到.npmrc
if ! grep -q "puppeteer_skip_chromium_download" .npmrc 2>/dev/null; then
    echo "puppeteer_skip_chromium_download=true" >> .npmrc
fi

if command -v pnpm &> /dev/null; then
    pnpm install
elif command -v yarn &> /dev/null; then
    yarn install
else
    # 清理可能的冲突文件
    rm -rf node_modules package-lock.json 2>/dev/null || true
    npm install --legacy-peer-deps
fi
print_status "依赖安装完成"

# 构建项目
echo "🔨 构建项目..."

# 设置构建环境变量
export NODE_OPTIONS="--max-old-space-size=4096"

if command -v pnpm &> /dev/null; then
    pnpm build
elif command -v yarn &> /dev/null; then
    yarn build
else
    npm run build --legacy-peer-deps
fi
print_status "项目构建完成"

# 启动或重启应用
if pm2 list | grep -q $APP_NAME; then
    pm2 restart $APP_NAME
    print_status "应用已重启"
else
    pm2 start npm --name $APP_NAME -- start
    pm2 save
    print_status "应用已启动"
fi

# 检查应用状态
sleep 3
if pm2 list | grep -q "online.*$APP_NAME"; then
    print_status "应用运行正常"
    
    # 显示应用信息
    echo ""
    echo "📊 应用状态:"
    pm2 show $APP_NAME
    
    echo ""
    echo "🌐 访问信息:"
    echo "本地访问: http://localhost:3000"
    echo "外网访问: http://$(curl -s ifconfig.me):3000 (如果防火墙已开放)"
    
else
    print_error "应用启动失败，请检查日志:"
    pm2 logs $APP_NAME --lines 20
    exit 1
fi

echo ""
print_status "部署完成! 🎉"

# 显示有用的命令
echo ""
echo "📋 常用命令:"
echo "查看日志: pm2 logs $APP_NAME"
echo "重启应用: pm2 restart $APP_NAME"
echo "停止应用: pm2 stop $APP_NAME"
echo "查看状态: pm2 status"