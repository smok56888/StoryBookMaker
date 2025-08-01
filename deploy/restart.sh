#!/bin/bash

# StoryBookMaker 重启脚本
# 快速重启应用的简化脚本

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

print_info "🔄 重启 StoryBookMaker..."

# 执行停止脚本
print_info "第一步：停止应用..."
if ./deploy/stop.sh; then
    print_status "应用已停止"
else
    print_warning "停止过程中出现警告，继续重启..."
fi

# 等待一下确保完全停止
sleep 3

# 执行启动脚本
print_info "第二步：启动应用..."
if ./deploy/start.sh; then
    print_status "🎉 应用重启成功！"
else
    print_error "应用启动失败"
    echo ""
    echo "🔍 故障排除建议："
    echo "1. 查看错误日志: tail -20 app.log"
    echo "2. 检查端口占用: netstat -tlnp | grep :3000"
    echo "3. 手动启动测试: npm start"
    echo "4. 重新构建: npm run build"
    echo "5. 使用完整管理脚本: ./deploy/manage-app.sh status"
    exit 1
fi