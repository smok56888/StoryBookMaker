#!/bin/bash

# StoryBookMaker 启动脚本
# 快速启动应用的简化脚本

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

# 切换到项目根目录
PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$PROJECT_DIR"

print_info "🚀 启动 StoryBookMaker..."

# 检查是否已经运行
if [ -f "app.pid" ] && kill -0 $(cat app.pid) 2>/dev/null; then
    print_warning "应用已在运行 (PID: $(cat app.pid))"
    print_info "访问地址: http://localhost:3000"
    exit 0
fi

# 检查构建文件
if [ ! -d ".next" ]; then
    print_warning "未找到构建文件，开始构建..."
    if ! npm run build; then
        print_error "构建失败，请检查代码"
        exit 1
    fi
fi

# 检查端口占用
if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
    print_warning "端口3000已被占用，尝试清理..."
    pkill -f "next start" 2>/dev/null || true
    pkill -f "node.*3000" 2>/dev/null || true
    sleep 2
fi

# 启动应用
print_info "后台启动应用..."
nohup npm start > app.log 2>&1 &
APP_PID=$!

# 保存PID
echo $APP_PID > app.pid
print_status "应用已启动 (PID: $APP_PID)"

# 等待启动
print_info "等待应用启动..."
sleep 5

# 检查启动状态
if kill -0 $APP_PID 2>/dev/null; then
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "🎉 应用启动成功！"
        echo ""
        echo "🌐 访问信息:"
        echo "本地访问: http://localhost:3000"
        
        # 尝试获取外网IP
        EXTERNAL_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || echo "")
        if [ -n "$EXTERNAL_IP" ]; then
            echo "外网访问: http://$EXTERNAL_IP:3000"
        fi
        
        echo ""
        echo "📋 管理命令:"
        echo "查看状态: ./deploy/manage-app.sh status"
        echo "查看日志: ./deploy/manage-app.sh logs"
        echo "停止应用: ./deploy/stop.sh"
        echo "重启应用: ./deploy/restart.sh"
        
    else
        print_warning "应用进程存在但端口未监听，检查日志..."
        tail -10 app.log
        exit 1
    fi
else
    print_error "应用启动失败"
    if [ -f "app.log" ]; then
        echo "错误日志："
        tail -20 app.log
    fi
    exit 1
fi