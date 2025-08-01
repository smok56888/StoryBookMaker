#!/bin/bash

# 一键修复部署问题脚本
# 解决依赖缺失和构建错误

echo "🚀 一键修复部署问题..."

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

# 检查当前目录
if [ ! -f "package.json" ]; then
    print_error "请在项目根目录运行此脚本"
    exit 1
fi

print_info "当前目录: $(pwd)"

# 1. 停止现有应用
APP_NAME="storybook-maker"
if command -v pm2 &> /dev/null && pm2 list | grep -q $APP_NAME; then
    print_info "停止现有应用..."
    pm2 stop $APP_NAME 2>/dev/null || true
    print_status "应用已停止"
fi

# 2. 清理npm配置
print_info "清理npm配置..."
npm config delete registry 2>/dev/null || true
npm config delete disturl 2>/dev/null || true
npm config delete sass_binary_site 2>/dev/null || true
npm config delete electron_mirror 2>/dev/null || true
npm config delete puppeteer_download_host 2>/dev/null || true
npm config delete chromedriver_cdnurl 2>/dev/null || true

# 3. 设置正确的npm配置
print_info "设置npm镜像源..."
npm config set registry https://registry.npmmirror.com
npm config set legacy-peer-deps true
npm config set fund false
npm config set audit false

# 4. 设置环境变量
print_info "设置环境变量..."
export NODE_OPTIONS="--max-old-space-size=4096"
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_SKIP_DOWNLOAD=true
export SASS_BINARY_SITE=https://npmmirror.com/mirrors/node-sass/
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
export PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors

# 5. 创建.npmrc文件
print_info "创建.npmrc配置文件..."
cat > .npmrc << EOF
registry=https://registry.npmmirror.com
legacy-peer-deps=true
fund=false
audit=false
EOF

# 6. 使用正确的依赖配置
print_info "使用正确的依赖配置..."
if [ -f "package.analyzed.json" ]; then
    if [ ! -f "package.json.backup" ]; then
        cp package.json package.json.backup
        print_status "已备份原始package.json"
    fi
    cp package.analyzed.json package.json
    print_status "使用分析后的依赖配置"
else
    print_warning "未找到package.analyzed.json，使用原始配置"
fi

# 7. 清理旧的安装
print_info "清理旧的安装文件..."
rm -rf node_modules package-lock.json .next 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

# 8. 安装依赖（多次尝试）
print_info "安装依赖..."
INSTALL_SUCCESS=false
MAX_ATTEMPTS=3

for attempt in $(seq 1 $MAX_ATTEMPTS); do
    print_info "尝试安装依赖 (第 $attempt 次)..."
    
    if npm install --legacy-peer-deps --no-audit --no-fund --verbose; then
        INSTALL_SUCCESS=true
        print_status "依赖安装成功"
        break
    else
        print_warning "第 $attempt 次安装失败"
        if [ $attempt -lt $MAX_ATTEMPTS ]; then
            print_info "清理缓存后重试..."
            npm cache clean --force 2>/dev/null || true
            rm -rf node_modules package-lock.json 2>/dev/null || true
            sleep 2
        fi
    fi
done

if [ "$INSTALL_SUCCESS" = false ]; then
    print_error "依赖安装失败，尝试恢复原始配置..."
    if [ -f "package.json.backup" ]; then
        cp package.json.backup package.json
        if npm install --legacy-peer-deps --no-audit --no-fund; then
            print_status "使用原始配置安装成功"
        else
            print_error "所有安装尝试都失败了"
            exit 1
        fi
    else
        exit 1
    fi
fi

# 9. 构建项目
print_info "构建项目..."
BUILD_SUCCESS=false
MAX_BUILD_ATTEMPTS=2

for attempt in $(seq 1 $MAX_BUILD_ATTEMPTS); do
    print_info "尝试构建项目 (第 $attempt 次)..."
    
    if npm run build; then
        BUILD_SUCCESS=true
        print_status "项目构建成功"
        break
    else
        print_warning "第 $attempt 次构建失败"
        if [ $attempt -lt $MAX_BUILD_ATTEMPTS ]; then
            print_info "清理构建缓存后重试..."
            rm -rf .next 2>/dev/null || true
            sleep 2
        fi
    fi
done

if [ "$BUILD_SUCCESS" = false ]; then
    print_error "项目构建失败"
    
    # 尝试恢复原始配置
    if [ -f "package.json.backup" ]; then
        print_warning "尝试恢复原始配置重新构建..."
        cp package.json.backup package.json
        rm -rf node_modules package-lock.json .next 2>/dev/null || true
        
        if npm install --legacy-peer-deps --no-audit --no-fund && npm run build; then
            print_status "使用原始配置构建成功"
        else
            print_error "构建失败，请检查代码错误"
            exit 1
        fi
    else
        exit 1
    fi
fi

# 10. 启动应用
print_info "启动应用..."

# 检查pm2是否安装
if ! command -v pm2 &> /dev/null; then
    print_warning "pm2未安装，正在安装..."
    npm install -g pm2
fi

# 启动应用
if pm2 list | grep -q $APP_NAME; then
    pm2 restart $APP_NAME
    print_status "应用已重启"
else
    pm2 start npm --name $APP_NAME -- start
    pm2 save
    print_status "应用已启动"
fi

# 11. 检查应用状态
sleep 5
if pm2 list | grep -q "online.*$APP_NAME"; then
    print_status "应用运行正常"
    
    echo ""
    echo "🌐 访问信息:"
    echo "本地访问: http://localhost:3000"
    
    # 尝试获取外网IP
    EXTERNAL_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || echo "无法获取")
    if [ "$EXTERNAL_IP" != "无法获取" ]; then
        echo "外网访问: http://$EXTERNAL_IP:3000"
    fi
    
else
    print_error "应用启动失败，查看日志:"
    pm2 logs $APP_NAME --lines 10
    exit 1
fi

echo ""
print_status "一键修复完成! 🎉"

echo ""
echo "📋 常用命令:"
echo "查看日志: pm2 logs $APP_NAME"
echo "重启应用: pm2 restart $APP_NAME"
echo "停止应用: pm2 stop $APP_NAME"
echo "查看状态: pm2 status"

echo ""
echo "🔧 如果还有问题:"
echo "1. 查看详细日志: pm2 logs $APP_NAME --lines 50"
echo "2. 检查端口占用: netstat -tlnp | grep :3000"
echo "3. 手动重新构建: npm run build"
echo "4. 恢复原始配置: cp package.json.backup package.json"