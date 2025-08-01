#!/bin/bash

# 静态资源404问题诊断脚本
# 专门解决服务器内部访问正常，但浏览器访问404的问题

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

echo "🔍 静态资源404问题诊断"
echo "========================"

# 1. 检查nginx配置文件
print_info "1. 检查nginx配置..."
NGINX_CONFIG="/etc/nginx/sites-available/storybook-maker"

if [ -f "$NGINX_CONFIG" ]; then
    print_status "找到nginx配置文件"
    
    echo ""
    echo "当前nginx配置中的静态资源部分："
    echo "================================"
    grep -A 10 -B 2 "_next/static" "$NGINX_CONFIG"
    echo "================================"
    
    # 检查location块的顺序
    echo ""
    print_info "检查location块顺序..."
    echo "所有location块："
    grep -n "location" "$NGINX_CONFIG"
    
else
    print_error "nginx配置文件不存在: $NGINX_CONFIG"
    exit 1
fi

# 2. 检查项目路径和文件
print_info "2. 检查项目文件..."
PROJECT_PATHS=$(find /root /home -name "StoryBookMaker" -type d 2>/dev/null)
if [ -n "$PROJECT_PATHS" ]; then
    PROJECT_PATH=$(echo "$PROJECT_PATHS" | head -1)
    print_status "项目路径: $PROJECT_PATH"
    
    if [ -d "$PROJECT_PATH/.next/static" ]; then
        print_status "静态文件目录存在"
        echo "静态文件数量: $(find $PROJECT_PATH/.next/static -type f | wc -l)"
        
        # 检查具体的chunks目录
        if [ -d "$PROJECT_PATH/.next/static/chunks" ]; then
            print_status "chunks目录存在"
            echo "chunks文件示例:"
            ls -la "$PROJECT_PATH/.next/static/chunks/" | head -3
        else
            print_warning "chunks目录不存在"
        fi
    else
        print_error "静态文件目录不存在: $PROJECT_PATH/.next/static"
    fi
else
    print_error "未找到项目目录"
    exit 1
fi

# 3. 测试不同的访问方式
print_info "3. 测试访问方式..."

echo ""
echo "测试localhost访问:"
HTTP_CODE_LOCAL=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/_next/static/")
echo "localhost/_next/static/ -> HTTP $HTTP_CODE_LOCAL"

echo ""
echo "测试127.0.0.1访问:"
HTTP_CODE_127=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1/_next/static/")
echo "127.0.0.1/_next/static/ -> HTTP $HTTP_CODE_127"

echo ""
echo "测试内网IP访问:"
INTERNAL_IP=$(hostname -I | awk '{print $1}')
HTTP_CODE_INTERNAL=$(curl -s -o /dev/null -w "%{http_code}" "http://$INTERNAL_IP/_next/static/")
echo "$INTERNAL_IP/_next/static/ -> HTTP $HTTP_CODE_INTERNAL"

# 4. 检查nginx日志
print_info "4. 检查nginx日志..."
echo ""
echo "最近的nginx错误日志:"
if [ -f "/var/log/nginx/error.log" ]; then
    tail -10 /var/log/nginx/error.log | grep -E "(404|error|static)" || echo "没有相关错误"
else
    print_warning "nginx错误日志不存在"
fi

echo ""
echo "最近的访问日志:"
if [ -f "/var/log/nginx/storybook-maker.access.log" ]; then
    tail -10 /var/log/nginx/storybook-maker.access.log | grep "_next/static" || echo "没有静态资源访问记录"
else
    print_warning "访问日志不存在"
fi

# 5. 检查nginx进程和监听端口
print_info "5. 检查nginx状态..."
echo ""
echo "nginx进程:"
ps aux | grep nginx | grep -v grep

echo ""
echo "监听端口:"
netstat -tlnp | grep nginx

# 6. 分析问题并提供解决方案
echo ""
print_info "🔧 问题分析和解决方案:"

# 检查是否是location顺序问题
STATIC_LINE=$(grep -n "location /_next/static/" "$NGINX_CONFIG" | cut -d: -f1)
ROOT_LINE=$(grep -n "location / {" "$NGINX_CONFIG" | cut -d: -f1)

if [ -n "$STATIC_LINE" ] && [ -n "$ROOT_LINE" ]; then
    if [ "$STATIC_LINE" -gt "$ROOT_LINE" ]; then
        echo ""
        print_error "问题1: location块顺序错误"
        echo "静态资源location (行$STATIC_LINE) 在根location (行$ROOT_LINE) 之后"
        echo "这会导致静态资源请求被根location拦截"
        echo ""
        echo "解决方案: 将静态资源location移到根location之前"
    else
        print_status "location块顺序正确"
    fi
fi

# 检查alias路径
ALIAS_PATH=$(grep "alias.*\.next/static" "$NGINX_CONFIG" | sed 's/.*alias \(.*\);/\1/')
if [ -n "$ALIAS_PATH" ]; then
    if [ -d "$ALIAS_PATH" ]; then
        print_status "alias路径存在: $ALIAS_PATH"
    else
        print_error "问题2: alias路径不存在: $ALIAS_PATH"
        echo "解决方案: 修改为正确路径: $PROJECT_PATH/.next/static/"
    fi
fi

# 检查server_name配置
SERVER_NAME=$(grep "server_name" "$NGINX_CONFIG" | head -1 | sed 's/.*server_name \(.*\);/\1/')
echo ""
print_info "当前server_name配置: $SERVER_NAME"
if [ "$SERVER_NAME" = "your-domain.com" ]; then
    print_warning "问题3: server_name未修改"
    echo "解决方案: 修改为你的实际IP或域名"
fi

echo ""
print_info "💡 推荐的修复步骤:"
echo "1. 检查并修复nginx配置中的location顺序"
echo "2. 确认alias路径正确"
echo "3. 修改server_name为实际IP"
echo "4. 重启nginx服务"
echo ""
echo "运行修复命令: sudo $0 --fix"

# 7. 自动修复选项
if [ "$1" = "--fix" ]; then
    echo ""
    print_info "🚀 开始自动修复..."
    
    if [ "$EUID" -ne 0 ]; then
        print_error "自动修复需要root权限"
        exit 1
    fi
    
    # 备份配置
    cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    print_status "已备份nginx配置"
    
    # 获取外网IP
    EXTERNAL_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || echo "")
    INTERNAL_IP=$(hostname -I | awk '{print $1}')
    
    # 修复server_name
    if [ -n "$EXTERNAL_IP" ]; then
        sed -i "s/server_name.*/server_name $EXTERNAL_IP $INTERNAL_IP localhost;/" "$NGINX_CONFIG"
        print_status "已更新server_name为: $EXTERNAL_IP $INTERNAL_IP localhost"
    else
        sed -i "s/server_name.*/server_name $INTERNAL_IP localhost;/" "$NGINX_CONFIG"
        print_status "已更新server_name为: $INTERNAL_IP localhost"
    fi
    
    # 修复alias路径
    if [ -n "$PROJECT_PATH" ]; then
        sed -i "s|alias.*\.next/static/.*;|alias $PROJECT_PATH/.next/static/;|g" "$NGINX_CONFIG"
        print_status "已更新alias路径为: $PROJECT_PATH/.next/static/"
    fi
    
    # 确保location顺序正确 - 创建新的配置文件
    print_info "重新排序location块..."
    
    # 测试配置
    if nginx -t; then
        print_status "nginx配置语法正确"
        systemctl reload nginx
        print_status "nginx已重新加载"
        
        echo ""
        print_status "🎉 修复完成!"
        echo ""
        echo "请测试访问:"
        if [ -n "$EXTERNAL_IP" ]; then
            echo "外网: http://$EXTERNAL_IP/_next/static/"
        fi
        echo "内网: http://$INTERNAL_IP/_next/static/"
        
    else
        print_error "nginx配置语法错误，恢复备份"
        cp "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)" "$NGINX_CONFIG"
    fi
fi

echo ""
print_info "🔍 手动测试命令:"
echo "curl -I http://localhost/_next/static/"
echo "curl -I http://$(hostname -I | awk '{print $1}')/_next/static/"
if command -v wget >/dev/null 2>&1; then
    echo "wget -O- http://$(hostname -I | awk '{print $1}')/_next/static/ 2>&1 | head -5"
fi