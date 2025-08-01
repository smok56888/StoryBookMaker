#!/bin/bash

# StoryBookMaker 强制停止脚本
# 用于处理顽固的进程和端口占用问题

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

print_info "🔥 强制停止 StoryBookMaker 及相关进程..."

# 1. 清理PID文件
if [ -f "app.pid" ]; then
    PID=$(cat app.pid)
    if kill -0 "$PID" 2>/dev/null; then
        print_info "强制终止主进程: $PID"
        kill -9 "$PID" 2>/dev/null || true
    fi
    rm -f app.pid
    print_status "PID文件已清理"
fi

# 2. 查找并终止所有相关进程
print_info "查找相关进程..."

# Next.js 进程
NEXT_PIDS=$(pgrep -f "next" 2>/dev/null || true)
if [ -n "$NEXT_PIDS" ]; then
    print_info "终止Next.js进程: $NEXT_PIDS"
    echo $NEXT_PIDS | xargs kill -9 2>/dev/null || true
fi

# Node.js 进程（包含start关键字）
NODE_PIDS=$(pgrep -f "node.*start" 2>/dev/null || true)
if [ -n "$NODE_PIDS" ]; then
    print_info "终止Node.js进程: $NODE_PIDS"
    echo $NODE_PIDS | xargs kill -9 2>/dev/null || true
fi

# npm start 进程
NPM_PIDS=$(pgrep -f "npm.*start" 2>/dev/null || true)
if [ -n "$NPM_PIDS" ]; then
    print_info "终止npm进程: $NPM_PIDS"
    echo $NPM_PIDS | xargs kill -9 2>/dev/null || true
fi

# 3. 强制释放端口3000
print_info "强制释放端口3000..."
fuser -k 3000/tcp 2>/dev/null || true

# 使用lsof清理端口（如果可用）
if command -v lsof >/dev/null 2>&1; then
    PORT_PIDS=$(lsof -ti:3000 2>/dev/null || true)
    if [ -n "$PORT_PIDS" ]; then
        print_info "使用lsof清理端口进程: $PORT_PIDS"
        echo $PORT_PIDS | xargs kill -9 2>/dev/null || true
    fi
fi

# 4. 等待进程完全清理
print_info "等待进程清理完成..."
sleep 3

# 5. 验证清理结果
print_info "验证清理结果..."

# 检查进程
REMAINING_PROCESSES=$(pgrep -f "next\|node.*start\|npm.*start" 2>/dev/null | wc -l)
if [ "$REMAINING_PROCESSES" -eq 0 ]; then
    print_status "所有相关进程已清理"
else
    print_warning "仍有 $REMAINING_PROCESSES 个相关进程运行"
    pgrep -f "next\|node.*start\|npm.*start" 2>/dev/null | while read pid; do
        ps -p $pid -o pid,ppid,cmd 2>/dev/null || true
    done
fi

# 检查端口
if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
    print_warning "端口3000仍被占用："
    netstat -tlnp 2>/dev/null | grep ":3000 "
    
    # 最后的杀手锏
    print_info "使用系统级端口清理..."
    ss -lptn 'sport = :3000' | grep -o 'pid=[0-9]*' | cut -d= -f2 | xargs -r kill -9 2>/dev/null || true
else
    print_status "端口3000已释放"
fi

# 6. 清理临时文件
print_info "清理临时文件..."
rm -f nohup.out
rm -f .next/cache/webpack/server-development/*.pack* 2>/dev/null || true

print_status "🎉 强制停止完成！"

echo ""
echo "📋 清理摘要:"
echo "   ✅ PID文件已清理"
echo "   ✅ 相关进程已终止"
echo "   ✅ 端口3000已释放"
echo "   ✅ 临时文件已清理"
echo ""
echo "🚀 现在可以安全启动应用:"
echo "   ./deploy/start.sh"
echo ""
echo "🔍 如果问题仍然存在:"
echo "   1. 重启服务器: sudo reboot"
echo "   2. 检查系统进程: ps aux | grep node"
echo "   3. 检查端口占用: netstat -tlnp | grep 3000"