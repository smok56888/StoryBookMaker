#!/bin/bash

# StoryBookMaker 应用管理脚本
# 用于启动、停止、重启和监控应用

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

# 配置
APP_NAME="StoryBookMaker"
APP_PORT=3000
PID_FILE="app.pid"
LOG_FILE="app.log"
PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)

# 切换到项目目录
cd "$PROJECT_DIR"

# 检查应用是否运行
is_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            return 0
        else
            rm -f "$PID_FILE"
            return 1
        fi
    fi
    return 1
}

# 获取端口占用进程
get_port_process() {
    netstat -tlnp 2>/dev/null | grep ":$APP_PORT " | awk '{print $7}' | cut -d'/' -f1
}

# 启动应用
start_app() {
    print_info "启动 $APP_NAME..."
    
    if is_running; then
        print_warning "应用已在运行 (PID: $(cat $PID_FILE))"
        return 0
    fi
    
    # 检查端口是否被占用
    PORT_PID=$(get_port_process)
    if [ -n "$PORT_PID" ]; then
        print_warning "端口 $APP_PORT 被进程 $PORT_PID 占用，尝试终止..."
        kill -9 "$PORT_PID" 2>/dev/null || true
        sleep 2
    fi
    
    # 确保构建文件存在
    if [ ! -d ".next" ]; then
        print_warning "未找到构建文件，开始构建..."
        if ! npm run build; then
            print_error "构建失败"
            return 1
        fi
    fi
    
    # 启动应用
    print_info "后台启动应用..."
    nohup npm start > "$LOG_FILE" 2>&1 &
    APP_PID=$!
    
    # 保存PID
    echo "$APP_PID" > "$PID_FILE"
    
    # 等待应用启动
    print_info "等待应用启动..."
    sleep 5
    
    # 检查应用是否启动成功
    if is_running; then
        if netstat -tlnp 2>/dev/null | grep -q ":$APP_PORT "; then
            print_status "应用启动成功！(PID: $APP_PID)"
            
            # 显示访问信息
            echo ""
            echo "🌐 访问信息:"
            echo "本地访问: http://localhost:$APP_PORT"
            
            # 尝试获取外网IP
            EXTERNAL_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || echo "")
            if [ -n "$EXTERNAL_IP" ]; then
                echo "外网访问: http://$EXTERNAL_IP:$APP_PORT"
            fi
            
            return 0
        else
            print_warning "应用进程存在但端口未监听，检查日志..."
            tail -10 "$LOG_FILE"
            return 1
        fi
    else
        print_error "应用启动失败"
        if [ -f "$LOG_FILE" ]; then
            echo "错误日志："
            tail -20 "$LOG_FILE"
        fi
        return 1
    fi
}

# 停止应用
stop_app() {
    print_info "停止 $APP_NAME..."
    
    if is_running; then
        PID=$(cat "$PID_FILE")
        print_info "终止进程 $PID..."
        
        # 优雅停止
        kill "$PID" 2>/dev/null
        
        # 等待进程结束
        for i in {1..10}; do
            if ! kill -0 "$PID" 2>/dev/null; then
                break
            fi
            sleep 1
        done
        
        # 如果还在运行，强制终止
        if kill -0 "$PID" 2>/dev/null; then
            print_warning "强制终止进程..."
            kill -9 "$PID" 2>/dev/null
        fi
        
        rm -f "$PID_FILE"
        print_status "应用已停止"
    else
        print_warning "应用未运行"
    fi
    
    # 清理可能残留的进程
    pkill -f "next start" 2>/dev/null || true
    pkill -f "node.*$APP_PORT" 2>/dev/null || true
}

# 重启应用
restart_app() {
    print_info "重启 $APP_NAME..."
    stop_app
    sleep 2
    start_app
}

# 查看应用状态
status_app() {
    echo "📊 $APP_NAME 状态信息"
    echo "================================"
    
    if is_running; then
        PID=$(cat "$PID_FILE")
        print_status "应用正在运行 (PID: $PID)"
        
        # 检查端口
        if netstat -tlnp 2>/dev/null | grep -q ":$APP_PORT "; then
            print_status "端口 $APP_PORT 正在监听"
        else
            print_warning "端口 $APP_PORT 未监听"
        fi
        
        # 显示进程信息
        echo ""
        echo "进程信息:"
        ps aux | grep "$PID" | grep -v grep || echo "无法获取进程信息"
        
        # 显示内存使用
        echo ""
        echo "内存使用:"
        ps -o pid,ppid,pcpu,pmem,vsz,rss,comm -p "$PID" 2>/dev/null || echo "无法获取内存信息"
        
    else
        print_error "应用未运行"
    fi
    
    # 检查端口占用
    echo ""
    echo "端口 $APP_PORT 占用情况:"
    netstat -tlnp 2>/dev/null | grep ":$APP_PORT " || echo "端口未被占用"
    
    # 显示最近日志
    if [ -f "$LOG_FILE" ]; then
        echo ""
        echo "最近日志 (最后10行):"
        echo "--------------------------------"
        tail -10 "$LOG_FILE"
    fi
}

# 查看日志
logs_app() {
    if [ -f "$LOG_FILE" ]; then
        if [ "$2" = "-f" ] || [ "$2" = "--follow" ]; then
            print_info "实时查看日志 (Ctrl+C 退出)..."
            tail -f "$LOG_FILE"
        else
            print_info "显示完整日志..."
            cat "$LOG_FILE"
        fi
    else
        print_warning "日志文件不存在"
    fi
}

# 清理日志
clean_logs() {
    if [ -f "$LOG_FILE" ]; then
        > "$LOG_FILE"
        print_status "日志已清理"
    else
        print_warning "日志文件不存在"
    fi
}

# 健康检查
health_check() {
    print_info "执行健康检查..."
    
    if is_running; then
        # 检查HTTP响应
        if command -v curl >/dev/null 2>&1; then
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$APP_PORT" --connect-timeout 10)
            if [ "$HTTP_CODE" = "200" ]; then
                print_status "HTTP健康检查通过 (状态码: $HTTP_CODE)"
            else
                print_warning "HTTP健康检查失败 (状态码: $HTTP_CODE)"
            fi
        else
            print_warning "curl未安装，跳过HTTP检查"
        fi
        
        # 检查进程状态
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            print_status "进程健康检查通过"
        else
            print_error "进程健康检查失败"
        fi
    else
        print_error "应用未运行，健康检查失败"
    fi
}

# 显示帮助信息
show_help() {
    echo "StoryBookMaker 应用管理脚本"
    echo ""
    echo "用法: $0 <命令> [选项]"
    echo ""
    echo "命令:"
    echo "  start          启动应用"
    echo "  stop           停止应用"
    echo "  restart        重启应用"
    echo "  status         查看应用状态"
    echo "  logs           查看日志"
    echo "  logs -f        实时查看日志"
    echo "  clean-logs     清理日志文件"
    echo "  health         健康检查"
    echo "  help           显示帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 start       # 启动应用"
    echo "  $0 restart     # 重启应用"
    echo "  $0 logs -f     # 实时查看日志"
}

# 主逻辑
case "$1" in
    start)
        start_app
        ;;
    stop)
        stop_app
        ;;
    restart)
        restart_app
        ;;
    status)
        status_app
        ;;
    logs)
        logs_app "$@"
        ;;
    clean-logs)
        clean_logs
        ;;
    health)
        health_check
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "错误: 未知命令 '$1'"
        echo ""
        show_help
        exit 1
        ;;
esac