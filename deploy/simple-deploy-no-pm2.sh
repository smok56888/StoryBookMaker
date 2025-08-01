#!/bin/bash

# 简单部署脚本（不使用pm2）
# 专门解决权限问题

echo "🚀 开始简单部署（无pm2）..."

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

# 1. 停止现有进程
print_info "停止现有进程..."
pkill -f "next start" 2>/dev/null || true
pkill -f "node.*3000" 2>/dev/null || true
sleep 2

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

# 8. 安装依赖
print_info "安装依赖..."
if npm install --legacy-peer-deps --no-audit --no-fund; then
    print_status "依赖安装成功"
else
    print_error "依赖安装失败"
    
    # 尝试恢复原始配置
    if [ -f "package.json.backup" ]; then
        print_warning "尝试恢复原始配置..."
        cp package.json.backup package.json
        rm -rf node_modules package-lock.json 2>/dev/null || true
        
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
if npm run build; then
    print_status "项目构建成功"
else
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

# 检查端口是否被占用
if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
    print_warning "端口3000已被占用，尝试终止现有进程..."
    pkill -f "next start" 2>/dev/null || true
    pkill -f "node.*3000" 2>/dev/null || true
    sleep 2
fi

# 后台启动应用
print_info "后台启动Next.js应用..."
nohup npm start > app.log 2>&1 &
APP_PID=$!

# 保存PID
echo $APP_PID > app.pid
print_status "应用已启动（PID: $APP_PID）"

# 等待应用启动
print_info "等待应用启动..."
sleep 5

# 检查应用是否启动成功
if kill -0 $APP_PID 2>/dev/null; then
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "应用启动成功！"
        
        echo ""
        echo "🌐 访问信息:"
        echo "本地访问: http://localhost:3000"
        
        # 尝试获取外网IP
        EXTERNAL_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || echo "无法获取")
        if [ "$EXTERNAL_IP" != "无法获取" ]; then
            echo "外网访问: http://$EXTERNAL_IP:3000"
        fi
        
    else
        print_warning "应用进程存在但端口未监听，检查日志..."
        tail -10 app.log
    fi
else
    print_error "应用启动失败"
    if [ -f "app.log" ]; then
        echo "错误日志："
        tail -20 app.log
    fi
    exit 1
fi

echo ""
print_status "部署完成! 🎉"

echo ""
echo "📋 应用管理命令:"
echo "查看日志: tail -f app.log"
echo "停止应用: kill \$(cat app.pid)"
echo "重启应用: 重新运行此脚本"
echo "检查进程: ps aux | grep next"
echo "检查端口: netstat -tlnp | grep :3000"

echo ""
echo "🔧 如果遇到问题:"
echo "1. 查看完整日志: cat app.log"
echo "2. 手动启动测试: npm start"
echo "3. 检查构建结果: ls -la .next/"
echo "4. 恢复原始配置: cp package.json.backup package.json"

# 创建管理脚本
cat > manage-app.sh << 'EOF'
#!/bin/bash

case "$1" in
    start)
        if [ -f app.pid ] && kill -0 $(cat app.pid) 2>/dev/null; then
            echo "应用已在运行 (PID: $(cat app.pid))"
        else
            echo "启动应用..."
            nohup npm start > app.log 2>&1 &
            echo $! > app.pid
            echo "应用已启动 (PID: $!)"
        fi
        ;;
    stop)
        if [ -f app.pid ]; then
            PID=$(cat app.pid)
            if kill -0 $PID 2>/dev/null; then
                kill $PID
                echo "应用已停止 (PID: $PID)"
            else
                echo "应用未运行"
            fi
            rm -f app.pid
        else
            echo "未找到PID文件"
        fi
        ;;
    restart)
        $0 stop
        sleep 2
        $0 start
        ;;
    status)
        if [ -f app.pid ] && kill -0 $(cat app.pid) 2>/dev/null; then
            echo "应用正在运行 (PID: $(cat app.pid))"
            if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
                echo "端口3000正在监听"
            else
                echo "警告：端口3000未监听"
            fi
        else
            echo "应用未运行"
        fi
        ;;
    logs)
        if [ -f app.log ]; then
            tail -f app.log
        else
            echo "日志文件不存在"
        fi
        ;;
    *)
        echo "用法: $0 {start|stop|restart|status|logs}"
        exit 1
        ;;
esac
EOF

chmod +x manage-app.sh
print_status "已创建应用管理脚本: ./manage-app.sh"

echo ""
echo "💡 使用管理脚本:"
echo "./manage-app.sh start   - 启动应用"
echo "./manage-app.sh stop    - 停止应用"
echo "./manage-app.sh restart - 重启应用"
echo "./manage-app.sh status  - 查看状态"
echo "./manage-app.sh logs    - 查看日志"