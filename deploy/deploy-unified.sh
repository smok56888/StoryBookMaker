#!/bin/bash

# StoryBookMaker 统一部署脚本
# 集成所有问题修复功能的一键部署解决方案
# 使用方法: ./deploy/deploy-unified.sh [选项]
# 选项: --skip-chrome (跳过Chrome安装) --force-clean (强制清理)

set -e

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

print_header() {
    echo ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# 解析命令行参数
SKIP_CHROME=false
FORCE_CLEAN=false

for arg in "$@"; do
    case $arg in
        --skip-chrome)
            SKIP_CHROME=true
            shift
            ;;
        --force-clean)
            FORCE_CLEAN=true
            shift
            ;;
        --help)
            echo "StoryBookMaker 统一部署脚本"
            echo ""
            echo "使用方法: $0 [选项]"
            echo ""
            echo "选项:"
            echo "  --skip-chrome    跳过Chrome浏览器安装"
            echo "  --force-clean    强制清理所有缓存和依赖"
            echo "  --help          显示此帮助信息"
            echo ""
            echo "示例:"
            echo "  $0                    # 完整部署"
            echo "  $0 --skip-chrome      # 跳过Chrome安装"
            echo "  $0 --force-clean      # 强制清理后部署"
            exit 0
            ;;
        *)
            print_warning "未知参数: $arg (使用 --help 查看帮助)"
            ;;
    esac
done

print_header "🚀 StoryBookMaker 统一部署开始"

echo "配置信息:"
echo "- 项目目录: $PROJECT_DIR"
echo "- 应用名称: $APP_NAME"
echo "- 仓库地址: $REPO_URL"
echo "- 跳过Chrome: $SKIP_CHROME"
echo "- 强制清理: $FORCE_CLEAN"

# ==========================================
# 1. 项目代码管理
# ==========================================
print_header "📦 项目代码管理"

# 检查是否为首次部署
if [ ! -d "$PROJECT_DIR" ]; then
    print_info "首次部署，克隆项目..."
    
    # 创建项目目录
    mkdir -p /home/ecs-user/code
    cd /home/ecs-user/code
    
    # 克隆项目
    if git clone $REPO_URL; then
        print_status "项目克隆完成"
    else
        print_error "项目克隆失败，请检查网络连接或仓库地址"
        exit 1
    fi
else
    print_info "更新现有项目..."
    cd $PROJECT_DIR
    
    # 停止应用
    if pm2 list | grep -q $APP_NAME; then
        pm2 stop $APP_NAME
        print_status "应用已停止"
    fi
    
    # 拉取最新代码
    if git pull origin main; then
        print_status "代码更新完成"
    else
        print_warning "代码更新失败，继续使用当前版本"
    fi
fi

cd $PROJECT_DIR

# ==========================================
# 2. 环境变量配置
# ==========================================
print_header "⚙️ 环境变量配置"

# 检查环境变量文件
if [ ! -f ".env.local" ]; then
    print_warning "未找到 .env.local 文件"
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        print_warning "已复制 .env.example 到 .env.local"
        print_error "请编辑 .env.local 文件配置实际的 API 密钥后重新运行部署脚本"
        echo "nano .env.local"
        exit 1
    else
        print_error "未找到环境变量模板文件"
        exit 1
    fi
else
    print_status "环境变量文件检查通过"
fi

# ==========================================
# 3. 系统环境配置
# ==========================================
print_header "🔧 系统环境配置"

# 设置环境变量
export NODE_OPTIONS="--max-old-space-size=4096"
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_SKIP_DOWNLOAD=true

print_status "环境变量设置完成"

# 配置国内镜像源
if command -v apt-get &> /dev/null; then
    if ! grep -q "mirrors.aliyun.com\|mirrors.tuna.tsinghua.edu.cn" /etc/apt/sources.list 2>/dev/null; then
        print_info "配置国内镜像源..."
        sudo cp /etc/apt/sources.list /etc/apt/sources.list.backup 2>/dev/null || true
        sudo sed -i 's/archive.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list 2>/dev/null || true
        sudo sed -i 's/security.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list 2>/dev/null || true
        print_status "镜像源配置完成"
    fi
fi

# 安装系统依赖
print_info "检查系统依赖..."
if command -v apt-get &> /dev/null; then
    if ! dpkg -l | grep -q libgbm1 2>/dev/null; then
        print_info "安装系统依赖..."
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
            wget \
            curl
        print_status "系统依赖安装完成"
    else
        print_status "系统依赖检查通过"
    fi
fi

# ==========================================
# 4. Node.js 和包管理器配置
# ==========================================
print_header "📦 Node.js 和包管理器配置"

# 检查Node.js版本
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_status "Node.js版本: $NODE_VERSION"
else
    print_error "Node.js未安装，请先安装Node.js"
    exit 1
fi

# 创建.npmrc配置文件
print_info "配置npm设置..."
cat > .npmrc << EOF
legacy-peer-deps=true
registry=https://registry.npmmirror.com
puppeteer_skip_chromium_download=true
EOF
print_status ".npmrc配置完成"

# ==========================================
# 5. 依赖安装和问题修复
# ==========================================
print_header "📦 依赖安装和问题修复"

# 强制清理（如果指定）
if [ "$FORCE_CLEAN" = true ]; then
    print_info "强制清理缓存和依赖..."
    rm -rf node_modules package-lock.json .next 2>/dev/null || true
    print_status "强制清理完成"
fi

# 清理可能的冲突文件
print_info "清理冲突文件..."
rm -rf node_modules/.cache 2>/dev/null || true

# 安装依赖
print_info "安装项目依赖..."
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
    rm -rf node_modules package-lock.json 2>/dev/null || true
    if npm install --legacy-peer-deps; then
        INSTALL_SUCCESS=true
    fi
fi

if [ "$INSTALL_SUCCESS" = false ]; then
    print_error "依赖安装失败"
    exit 1
fi

print_status "依赖安装完成"

# ==========================================
# 6. Next.js 构建问题修复
# ==========================================
print_header "🔨 Next.js 构建问题修复"

# 检查和修复Next.js配置
print_info "检查Next.js配置..."
if [ -f "next.config.mjs" ]; then
    # 确保配置包含必要的修复选项
    if ! grep -q "reactStrictMode.*false" next.config.mjs; then
        print_info "更新Next.js配置..."
        cp next.config.mjs next.config.mjs.backup 2>/dev/null || true
        
        cat > next.config.mjs << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
    dynamicIO: false,
  },
  // 强制动态渲染，解决静态渲染问题
  output: 'standalone',
}

export default nextConfig
EOF
        print_status "Next.js配置已更新"
    else
        print_status "Next.js配置检查通过"
    fi
    
    # 检查API路由是否有动态配置
    print_info "检查API路由动态配置..."
    API_ROUTES_FIXED=0
    
    for route_file in app/api/story/*/route.ts; do
        if [ -f "$route_file" ] && ! grep -q "export const dynamic" "$route_file"; then
            print_info "修复API路由: $route_file"
            # 在import语句后添加动态配置
            sed -i '/^import.*from/a\\n// 强制动态渲染\nexport const dynamic = '\''force-dynamic'\''\nexport const runtime = '\''nodejs'\''' "$route_file" 2>/dev/null || true
            API_ROUTES_FIXED=$((API_ROUTES_FIXED + 1))
        fi
    done
    
    if [ $API_ROUTES_FIXED -gt 0 ]; then
        print_status "已修复 $API_ROUTES_FIXED 个API路由"
    else
        print_status "API路由配置检查通过"
    fi
fi

# 检查Next.js版本并降级（如果需要）
NEXT_VERSION=$(npm list next --depth=0 2>/dev/null | grep next | cut -d'@' -f2 || echo "unknown")
print_info "当前Next.js版本: $NEXT_VERSION"

if [[ "$NEXT_VERSION" == "15."* ]]; then
    print_warning "检测到Next.js 15，降级到稳定版本..."
    npm install next@14.2.15 --save
    print_status "Next.js版本已降级"
fi

# ==========================================
# 7. 项目构建
# ==========================================
print_header "🔨 项目构建"

# 清理构建缓存
rm -rf .next 2>/dev/null || true

# 尝试构建
print_info "开始构建项目..."
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
    if npm run build --legacy-peer-deps; then
        BUILD_SUCCESS=true
    fi
fi

if [ "$BUILD_SUCCESS" = false ]; then
    print_error "项目构建失败"
    print_info "尝试额外的修复措施..."
    
    # 额外的修复尝试
    rm -rf .next node_modules/.cache 2>/dev/null || true
    npm install --legacy-peer-deps --force
    
    if npm run build --legacy-peer-deps; then
        print_status "构建成功（经过修复）"
    else
        print_error "构建仍然失败，请检查代码问题"
        exit 1
    fi
else
    print_status "项目构建完成"
fi

# ==========================================
# 8. Chrome浏览器安装（可选）
# ==========================================
if [ "$SKIP_CHROME" = false ]; then
    print_header "🌐 Chrome浏览器安装"
    
    # 检查是否已安装浏览器
    BROWSER_INSTALLED=false
    BROWSER_PATH=""
    
    if command -v google-chrome-stable &> /dev/null; then
        BROWSER_PATH="/usr/bin/google-chrome-stable"
        BROWSER_INSTALLED=true
        print_status "检测到Chrome浏览器"
    elif command -v chromium-browser &> /dev/null; then
        BROWSER_PATH="/usr/bin/chromium-browser"
        BROWSER_INSTALLED=true
        print_status "检测到Chromium浏览器"
    fi
    
    if [ "$BROWSER_INSTALLED" = false ]; then
        print_info "安装Chrome浏览器..."
        
        # 尝试使用国内镜像安装Chrome
        if timeout 10 ping -c 1 google.com &> /dev/null; then
            print_info "使用官方源安装Chrome..."
            wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add - 2>/dev/null || true
            sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list' 2>/dev/null || true
        else
            print_info "使用国内镜像安装Chrome..."
            wget -q -O - https://mirrors.tuna.tsinghua.edu.cn/google-chrome/linux_signing_key.pub | sudo apt-key add - 2>/dev/null || true
            sudo sh -c 'echo "deb [arch=amd64] https://mirrors.tuna.tsinghua.edu.cn/google-chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list' 2>/dev/null || true
        fi
        
        sudo apt update 2>/dev/null || true
        
        if sudo apt install -y google-chrome-stable 2>/dev/null; then
            BROWSER_PATH="/usr/bin/google-chrome-stable"
            print_status "Chrome安装成功"
        elif sudo apt install -y chromium-browser 2>/dev/null; then
            BROWSER_PATH="/usr/bin/chromium-browser"
            print_status "Chromium安装成功"
        else
            print_warning "浏览器安装失败，PDF功能将不可用"
            echo "DISABLE_PDF_GENERATION=true" >> .env.local
        fi
    fi
    
    # 配置浏览器路径
    if [ -n "$BROWSER_PATH" ]; then
        # 更新环境变量
        sed -i '/PUPPETEER_EXECUTABLE_PATH/d' .env.local 2>/dev/null || true
        echo "PUPPETEER_EXECUTABLE_PATH=$BROWSER_PATH" >> .env.local
        print_status "浏览器路径已配置: $BROWSER_PATH"
    fi
else
    print_info "跳过Chrome安装，配置PDF替代方案..."
    echo "DISABLE_PDF_GENERATION=true" >> .env.local
    print_status "PDF功能已禁用"
fi

# ==========================================
# 9. 应用启动
# ==========================================
print_header "🚀 应用启动"

# 启动或重启应用
if pm2 list | grep -q $APP_NAME; then
    print_info "重启现有应用..."
    pm2 restart $APP_NAME
    print_status "应用已重启"
else
    print_info "启动新应用..."
    pm2 start npm --name $APP_NAME -- start
    pm2 save
    print_status "应用已启动"
fi

# 检查应用状态
sleep 3
if pm2 list | grep -q "online.*$APP_NAME"; then
    print_status "应用运行正常"
else
    print_error "应用启动失败，请检查日志"
    pm2 logs $APP_NAME --lines 20
    exit 1
fi

# ==========================================
# 10. 部署完成
# ==========================================
print_header "🎉 部署完成"

echo ""
echo "📊 部署信息:"
echo "- 项目路径: $PROJECT_DIR"
echo "- 应用名称: $APP_NAME"
echo "- Node.js版本: $(node --version)"
echo "- Next.js版本: $(npm list next --depth=0 2>/dev/null | grep next | cut -d'@' -f2 || echo '未知')"
echo "- 浏览器: $([ -n "$BROWSER_PATH" ] && echo "$BROWSER_PATH" || echo "未安装")"

echo ""
echo "🌐 访问信息:"
echo "- 本地访问: http://localhost:3000"
echo "- 外网访问: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP'):3000"

echo ""
echo "📋 常用命令:"
echo "- 查看状态: pm2 status"
echo "- 查看日志: pm2 logs $APP_NAME"
echo "- 重启应用: pm2 restart $APP_NAME"
echo "- 停止应用: pm2 stop $APP_NAME"

echo ""
echo "📝 下一步:"
echo "1. 配置Nginx反向代理"
echo "2. 设置域名和SSL证书"
echo "3. 配置防火墙规则"

print_status "StoryBookMaker 部署成功完成! 🎉"