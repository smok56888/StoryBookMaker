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
    print_error "端口3000仍被占用，请先运行停止脚本"
    echo "占用进程："
    netstat -tlnp 2>/dev/null | grep ":3000 "
    echo ""
    echo "解决方案："
    echo "1. 运行停止脚本: ./deploy/stop.sh"
    echo "2. 手动清理端口: fuser -k 3000/tcp"
    echo "3. 重新启动: ./deploy/restart.sh"
    exit 1
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

# 更智能的启动检查
MAX_WAIT=30
WAIT_COUNT=0
STARTUP_SUCCESS=false

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    WAIT_COUNT=$((WAIT_COUNT + 1))
    
    # 检查进程是否还在运行
    if ! kill -0 $APP_PID 2>/dev/null; then
        print_error "应用进程意外退出"
        if [ -f "app.log" ]; then
            echo "错误日志："
            tail -20 app.log
        fi
        rm -f app.pid
        exit 1
    fi
    
    # 检查端口是否开始监听
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_status "端口3000开始监听"
        
        # 额外等待2秒确保服务完全就绪
        sleep 2
        
        # 尝试HTTP请求测试
        if curl -s --connect-timeout 5 http://localhost:3000 >/dev/null 2>&1; then
            STARTUP_SUCCESS=true
            break
        else
            print_info "端口已监听但服务未就绪，继续等待..."
        fi
    fi
    
    if [ $((WAIT_COUNT % 5)) -eq 0 ]; then
        print_info "等待应用启动... ($WAIT_COUNT/$MAX_WAIT 秒)"
    fi
    
    sleep 1
done

# 检查最终启动状态
if [ "$STARTUP_SUCCESS" = true ]; then
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
    
elif kill -0 $APP_PID 2>/dev/null; then
    if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
        print_warning "应用已启动但HTTP服务可能未就绪"
        print_info "请稍后访问或查看日志"
    else
        print_warning "应用进程存在但端口未监听"
        print_info "查看最近的日志："
        tail -10 app.log
        exit 1
    fi
else
    print_error "应用启动失败"
    if [ -f "app.log" ]; then
        echo "错误日志："
        tail -20 app.log
    fi
    rm -f app.pid
    exit 1
fi