#!/bin/bash

# StoryBookMaker 停止脚本
# 快速停止应用的简化脚本

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

print_info "🛑 停止 StoryBookMaker..."

# 检查PID文件
if [ -f "app.pid" ]; then
    PID=$(cat app.pid)
    
    if kill -0 "$PID" 2>/dev/null; then
        print_info "终止进程 $PID..."
        
        # 优雅停止
        kill "$PID" 2>/dev/null
        
        # 等待进程结束
        for i in {1..10}; do
            if ! kill -0 "$PID" 2>/dev/null; then
                break
            fi
            print_info "等待进程结束... ($i/10)"
            sleep 1
        done
        
        # 如果还在运行，强制终止
        if kill -0 "$PID" 2>/dev/null; then
            print_warning "强制终止进程..."
            kill -9 "$PID" 2>/dev/null
        fi
        
        print_status "应用已停止 (PID: $PID)"
    else
        print_warning "PID文件存在但进程不存在"
    fi
    
    # 清理PID文件
    rm -f app.pid
else
    print_warning "未找到PID文件"
fi

# 清理可能残留的进程
print_info "清理残留进程..."
KILLED_PROCESSES=0

# 查找并终止Next.js相关进程
for pid in $(pgrep -f "next start" 2>/dev/null); do
    kill -9 "$pid" 2>/dev/null && KILLED_PROCESSES=$((KILLED_PROCESSES + 1))
done

# 查找并终止端口3000相关进程
for pid in $(pgrep -f "node.*3000" 2>/dev/null); do
    kill -9 "$pid" 2>/dev/null && KILLED_PROCESSES=$((KILLED_PROCESSES + 1))
done

if [ $KILLED_PROCESSES -gt 0 ]; then
    print_status "清理了 $KILLED_PROCESSES 个残留进程"
fi

# 检查端口是否已释放
sleep 2
if netstat -tlnp 2>/dev/null | grep -q ":3000 "; then
    print_warning "端口3000仍被占用，可能需要手动清理"
    echo "占用进程："
    netstat -tlnp 2>/dev/null | grep ":3000 "
else
    print_status "端口3000已释放"
fi

print_status "🎉 应用停止完成！"

echo ""
echo "📋 相关命令:"
echo "重新启动: ./deploy/start.sh"
echo "查看日志: tail -f app.log"
echo "完整管理: ./deploy/manage-app.sh help"