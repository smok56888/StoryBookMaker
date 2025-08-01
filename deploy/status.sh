#!/bin/bash

# StoryBookMaker 状态检查脚本
# 快速查看应用状态的简化脚本

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

echo "📊 StoryBookMaker 状态检查"
echo "================================"

# 检查PID文件和进程
if [ -f "app.pid" ]; then
    PID=$(cat app.pid)
    if kill -0 "$PID" 2>/dev/null; then
        print_status "应用正在运行 (PID: $PID)"
        
        # 显示进程信息
        echo ""
        echo "进程信息:"
        ps aux | grep "$PID" | grep -v grep | head -1
        
    else
        print_error "PID文件存在但进程不存在 (PID: $PID)"
        echo "建议清理PID文件: rm -f app.pid"
    fi
else
    print_warning "未找到PID文件"
fi

echo ""

# 检查端口监听
print_info "检查端口3000监听状态..."
if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
    print_status "端口3000正在监听"
    echo "端口详情:"
    netstat -tlnp 2>/dev/null | grep ":3000 "
else
    print_warning "端口3000未监听"
fi

echo ""

# 检查相关进程
print_info "检查相关进程..."
NEXT_PROCESSES=$(pgrep -f "next start" 2>/dev/null | wc -l)
NODE_PROCESSES=$(pgrep -f "node.*3000" 2>/dev/null | wc -l)

if [ "$NEXT_PROCESSES" -gt 0 ]; then
    print_status "发现 $NEXT_PROCESSES 个Next.js进程"
else
    print_warning "未发现Next.js进程"
fi

if [ "$NODE_PROCESSES" -gt 0 ]; then
    print_status "发现 $NODE_PROCESSES 个Node.js进程(端口3000)"
else
    print_warning "未发现Node.js进程(端口3000)"
fi

echo ""

# HTTP健康检查
print_info "执行HTTP健康检查..."
if command -v curl >/dev/null 2>&1; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" --connect-timeout 5 --max-time 10)
    if [ "$HTTP_CODE" = "200" ]; then
        print_status "HTTP检查通过 (状态码: $HTTP_CODE)"
    elif [ "$HTTP_CODE" = "000" ]; then
        print_error "HTTP检查失败 (连接超时或拒绝)"
    else
        print_warning "HTTP检查异常 (状态码: $HTTP_CODE)"
    fi
else
    print_warning "curl未安装，跳过HTTP检查"
fi

echo ""

# 检查日志文件
if [ -f "app.log" ]; then
    LOG_SIZE=$(du -h app.log | cut -f1)
    LOG_LINES=$(wc -l < app.log)
    print_status "日志文件存在 (大小: $LOG_SIZE, 行数: $LOG_LINES)"
    
    echo ""
    echo "最近日志 (最后5行):"
    echo "--------------------------------"
    tail -5 app.log
else
    print_warning "日志文件不存在"
fi

echo ""

# 检查构建文件
if [ -d ".next" ]; then
    BUILD_SIZE=$(du -sh .next | cut -f1)
    print_status "构建文件存在 (大小: $BUILD_SIZE)"
else
    print_warning "构建文件不存在，需要运行: npm run build"
fi

echo ""

# 显示访问信息
echo "🌐 访问信息:"
echo "本地访问: http://localhost:3000"

# 尝试获取外网IP
EXTERNAL_IP=$(curl -s --connect-timeout 3 ifconfig.me 2>/dev/null || echo "")
if [ -n "$EXTERNAL_IP" ]; then
    echo "外网访问: http://$EXTERNAL_IP:3000"
else
    echo "外网IP: 无法获取"
fi

echo ""

# 显示管理命令
echo "📋 管理命令:"
echo "启动应用: ./deploy/start.sh"
echo "停止应用: ./deploy/stop.sh"
echo "重启应用: ./deploy/restart.sh"
echo "查看日志: tail -f app.log"
echo "完整管理: ./deploy/manage-app.sh help"