#!/bin/bash

# StoryBookMaker 中国大陆优化部署脚本
# 专为阿里云ECS北京机房优化
# 使用方法: ./china-optimized-deploy.sh

set -e

echo "🇨🇳 开始中国大陆优化部署 StoryBookMaker..."

# 配置变量
PROJECT_DIR="/home/ecs-user/code/StoryBookMaker"
APP_NAME="storybook-maker"
# 优先使用Gitee镜像
REPO_URL="https://gitee.com/smok56888/StoryBookMaker.git"
# GitHub备用地址
GITHUB_REPO_URL="https://github.com/smok56888/StoryBookMaker.git"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 检查网络连接
check_network() {
    print_info "检查网络连接..."
    
    # 检查是否能访问Gitee
    if curl -s --connect-timeout 5 https://gitee.com > /dev/null; then
        print_status "Gitee连接正常"
        USE_GITEE=true
    else
        print_warning "无法连接Gitee，尝试GitHub..."
        if curl -s --connect-timeout 5 https://github.com > /dev/null; then
            print_status "GitHub连接正常"
            USE_GITEE=false
            REPO_URL=$GITHUB_REPO_URL
        else
            print_error "网络连接异常，请检查网络设置"
            exit 1
        fi
    fi
}

# 配置中国大陆网络环境
setup_china_environment() {
    print_info "配置中国大陆网络环境..."
    
    # 配置npm镜像（只配置有效的选项）
    npm config set registry https://registry.npmmirror.com
    npm config set cache ~/.npm
    npm config set tmp /tmp
    
    # 设置环境变量而不是npm config
    export SASS_BINARY_SITE=https://npmmirror.com/mirrors/node-sass/
    export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
    export PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors
    export CHROMEDRIVER_CDNURL=https://npmmirror.com/mirrors/chromedriver
    export OPERADRIVER_CDNURL=https://npmmirror.com/mirrors/operadriver
    export PHANTOMJS_CDNURL=https://npmmirror.com/mirrors/phantomjs
    
    # 如果安装了pnpm，也配置镜像
    if command -v pnpm &> /dev/null; then
        pnpm config set registry https://registry.npmmirror.com
    fi
    
    # 如果安装了yarn，也配置镜像
    if command -v yarn &> /dev/null; then
        yarn config set registry https://registry.npmmirror.com
    fi
    
    print_status "网络环境配置完成"
}

# 安装Chrome浏览器（阿里云ECS优化版本）
install_chrome() {
    if command -v google-chrome-stable &> /dev/null; then
        print_status "Chrome浏览器已安装"
        return
    fi
    
    print_info "安装Chrome浏览器（使用国内镜像）..."
    
    # 检查系统类型
    if [ -f /etc/debian_version ]; then
        # Debian/Ubuntu系统
        # 使用清华大学镜像源
        echo "deb [arch=amd64] https://mirrors.tuna.tsinghua.edu.cn/google-chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
        
        # 尝试添加GPG密钥
        wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | apt-key add - 2>/dev/null || {
            print_warning "GPG密钥添加失败，使用备用安装方案..."
            # 备用方案：直接下载deb包
            cd /tmp
            wget -q https://mirrors.tuna.tsinghua.edu.cn/google-chrome/deb/pool/main/g/google-chrome-stable/google-chrome-stable_current_amd64.deb
            if [ -f "google-chrome-stable_current_amd64.deb" ]; then
                dpkg -i google-chrome-stable_current_amd64.deb || apt-get install -f -y
                print_status "Chrome浏览器安装完成（备用方案）"
                return
            fi
        }
        
        apt-get update -qq
        apt-get install -y google-chrome-stable
        
    elif [ -f /etc/redhat-release ]; then
        # CentOS/RHEL系统
        cat > /etc/yum.repos.d/google-chrome.repo << EOF
[google-chrome]
name=google-chrome
baseurl=https://mirrors.tuna.tsinghua.edu.cn/google-chrome/rpm/stable/x86_64
enabled=1
gpgcheck=1
gpgkey=https://dl.google.com/linux/linux_signing_key.pub
EOF
        yum install -y google-chrome-stable
    else
        print_error "不支持的操作系统"
        exit 1
    fi
    
    print_status "Chrome浏览器安装完成"
}

# 优化依赖安装
optimize_dependencies() {
    print_info "优化项目依赖..."
    
    # 备份原始package.json
    if [ ! -f "package.json.backup" ]; then
        cp package.json package.json.backup
        print_status "已备份原始package.json"
    fi
    
    # 使用优化后的依赖配置
    if [ -f "package.optimized.json" ]; then
        print_info "使用优化后的依赖配置..."
        cp package.optimized.json package.json
        print_status "依赖配置已优化"
    fi
    
    # 创建优化的.npmrc文件（只包含有效的npm配置）
    cat > .npmrc << EOF
registry=https://registry.npmmirror.com
legacy-peer-deps=true
fund=false
audit=false
EOF
    
    print_status ".npmrc配置文件已优化"
}

# 主部署流程
main() {
    # 检查网络
    check_network
    
    # 配置环境
    setup_china_environment
    
    # 安装Chrome
    install_chrome
    
    # 检查是否为首次部署
    if [ ! -d "$PROJECT_DIR" ]; then
        echo "📦 首次部署，克隆项目..."
        
        # 创建项目目录
        mkdir -p /home/ecs-user/code
        cd /home/ecs-user/code
        
        # 克隆项目
        if ! git clone $REPO_URL; then
            print_error "项目克隆失败"
            exit 1
        fi
        
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
    
    # 优化依赖
    optimize_dependencies
    
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
    echo "📦 安装依赖（使用国内镜像）..."
    
    # 设置环境变量
    export NODE_OPTIONS="--max-old-space-size=4096"
    export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
    export PUPPETEER_SKIP_DOWNLOAD=true
    export PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome-stable"
    
    # 设置中国镜像环境变量
    export SASS_BINARY_SITE=https://npmmirror.com/mirrors/node-sass/
    export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
    export PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors
    export CHROMEDRIVER_CDNURL=https://npmmirror.com/mirrors/chromedriver
    
    # 清理可能的冲突
    rm -rf node_modules package-lock.json 2>/dev/null || true
    
    # 安装依赖（禁用错误退出以便处理安装失败）
    set +e
    INSTALL_SUCCESS=false
    
    if command -v pnpm &> /dev/null; then
        print_info "使用pnpm安装依赖..."
        if pnpm install; then
            INSTALL_SUCCESS=true
        fi
    elif command -v yarn &> /dev/null; then
        print_info "使用yarn安装依赖..."
        if yarn install; then
            INSTALL_SUCCESS=true
        fi
    else
        print_info "使用npm安装依赖..."
        if npm install --legacy-peer-deps --no-audit --no-fund; then
            INSTALL_SUCCESS=true
        fi
    fi
    
    # 重新启用错误退出
    set -e
    
    if [ "$INSTALL_SUCCESS" = false ]; then
        print_error "依赖安装失败，尝试清理缓存后重试..."
        npm cache clean --force 2>/dev/null || true
        rm -rf ~/.npm 2>/dev/null || true
        
        # 再次尝试安装
        if npm install --legacy-peer-deps --no-audit --no-fund --verbose; then
            print_status "依赖安装完成（重试成功）"
        else
            print_error "依赖安装失败，请检查网络连接和npm配置"
            exit 1
        fi
    else
        print_status "依赖安装完成"
    fi
    
    # 构建项目
    echo "🔨 构建项目..."
    
    # 清理构建缓存
    rm -rf .next 2>/dev/null || true
    
    # 构建
    BUILD_SUCCESS=false
    if command -v pnpm &> /dev/null; then
        if pnpm build; then
            BUILD_SUCCESS=true
        fi
    elif command -v yarn &> /dev/null; then
        if yarn build; then
            BUILD_SUCCESS=true
        fi
    else
        if npm run build; then
            BUILD_SUCCESS=true
        fi
    fi
    
    if [ "$BUILD_SUCCESS" = false ]; then
        print_error "构建失败"
        exit 1
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
        
        echo ""
        echo "🌐 访问信息:"
        echo "本地访问: http://localhost:3000"
        echo "外网访问: http://$(curl -s ifconfig.me):3000"
        
    else
        print_error "应用启动失败，请检查日志:"
        pm2 logs $APP_NAME --lines 20
        exit 1
    fi
    
    echo ""
    print_status "中国大陆优化部署完成! 🎉"
    
    # 显示优化信息
    echo ""
    echo "🚀 优化特性:"
    echo "✓ 使用国内npm镜像源"
    echo "✓ 优化了依赖包大小"
    echo "✓ 配置了Chrome浏览器"
    echo "✓ 针对阿里云ECS优化"
    
    echo ""
    echo "📋 常用命令:"
    echo "查看日志: pm2 logs $APP_NAME"
    echo "重启应用: pm2 restart $APP_NAME"
    echo "停止应用: pm2 stop $APP_NAME"
    echo "查看状态: pm2 status"
}

# 运行主流程
main "$@"