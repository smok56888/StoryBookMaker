#!/bin/bash

# 修复特定的nginx配置问题
# 基于用户提供的实际配置文件

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

echo "🔧 修复StoryBookMaker Nginx配置问题"
echo "=================================="

# 配置文件路径
NGINX_CONFIG="/etc/nginx/conf.d/storybook.conf"
PROJECT_PATH="/home/ecs-user/code/StoryBookMaker"

# 1. 检查配置文件是否存在
if [ ! -f "$NGINX_CONFIG" ]; then
    print_error "nginx配置文件不存在: $NGINX_CONFIG"
    exit 1
fi

print_status "找到nginx配置文件: $NGINX_CONFIG"

# 2. 检查项目目录和静态文件
print_info "检查项目目录..."
if [ -d "$PROJECT_PATH" ]; then
    print_status "项目目录存在: $PROJECT_PATH"
    
    if [ -d "$PROJECT_PATH/.next/static" ]; then
        print_status "静态文件目录存在"
        echo "静态文件数量: $(find $PROJECT_PATH/.next/static -type f | wc -l)"
    else
        print_error "静态文件目录不存在，需要构建项目"
        echo "请运行: cd $PROJECT_PATH && npm run build"
        exit 1
    fi
else
    print_error "项目目录不存在: $PROJECT_PATH"
    exit 1
fi

# 3. 检查当前配置问题
print_info "分析当前配置问题..."

# 检查alias路径是否有末尾斜杠
CURRENT_ALIAS=$(grep "alias.*\.next/static" "$NGINX_CONFIG" | sed 's/.*alias \(.*\);/\1/')
echo "当前alias配置: $CURRENT_ALIAS"

if [[ "$CURRENT_ALIAS" != */ ]]; then
    print_error "问题1: alias路径末尾缺少斜杠"
    echo "当前: $CURRENT_ALIAS"
    echo "应为: $CURRENT_ALIAS/"
fi

# 检查文件权限
print_info "检查文件权限..."
STATIC_PERMS=$(ls -ld "$PROJECT_PATH/.next/static" | awk '{print $1}')
echo "静态文件目录权限: $STATIC_PERMS"

# 4. 开始修复
if [ "$1" = "--fix" ]; then
    print_info "🚀 开始修复..."
    
    # 检查是否为root或有sudo权限
    if [ "$EUID" -ne 0 ]; then
        print_error "修复需要root权限，请使用: sudo $0 --fix"
        exit 1
    fi
    
    # 备份原配置
    BACKUP_FILE="$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
    cp "$NGINX_CONFIG" "$BACKUP_FILE"
    print_status "已备份原配置到: $BACKUP_FILE"
    
    # 修复alias路径（添加末尾斜杠）
    print_info "修复alias路径..."
    sed -i 's|alias /home/ecs-user/code/StoryBookMaker/.next/static;|alias /home/ecs-user/code/StoryBookMaker/.next/static/;|g' "$NGINX_CONFIG"
    print_status "已修复alias路径"
    
    # 确保文件权限正确
    print_info "设置文件权限..."
    chmod -R 755 "$PROJECT_PATH/.next/"
    chown -R www-data:www-data "$PROJECT_PATH/.next/" 2>/dev/null || chown -R nginx:nginx "$PROJECT_PATH/.next/" 2>/dev/null || true
    print_status "权限设置完成"
    
    # 测试nginx配置
    print_info "测试nginx配置..."
    if nginx -t; then
        print_status "nginx配置语法正确"
        
        # 重启nginx
        print_info "重启nginx..."
        systemctl reload nginx
        if [ $? -eq 0 ]; then
            print_status "nginx重启成功"
        else
            print_error "nginx重启失败"
            exit 1
        fi
    else
        print_error "nginx配置语法错误，恢复备份"
        cp "$BACKUP_FILE" "$NGINX_CONFIG"
        exit 1
    fi
    
    # 测试访问
    print_info "测试访问..."
    sleep 2
    
    echo ""
    echo "测试结果:"
    echo "========="
    
    # 测试localhost
    HTTP_CODE_LOCAL=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/_next/static/")
    echo "localhost: HTTP $HTTP_CODE_LOCAL"
    
    # 测试内网IP
    HTTP_CODE_INTERNAL=$(curl -s -o /dev/null -w "%{http_code}" "http://172.27.225.238/_next/static/")
    echo "内网IP: HTTP $HTTP_CODE_INTERNAL"
    
    # 测试外网IP
    HTTP_CODE_EXTERNAL=$(curl -s -o /dev/null -w "%{http_code}" "http://60.205.4.42/_next/static/")
    echo "外网IP: HTTP $HTTP_CODE_EXTERNAL"
    
    # 测试具体的静态文件
    SAMPLE_FILE=$(find "$PROJECT_PATH/.next/static/chunks" -name "*.js" | head -1 | sed "s|$PROJECT_PATH/.next/static||")
    if [ -n "$SAMPLE_FILE" ]; then
        HTTP_CODE_FILE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/_next/static$SAMPLE_FILE")
        echo "示例文件: HTTP $HTTP_CODE_FILE"
    fi
    
    echo ""
    print_status "🎉 修复完成!"
    echo ""
    echo "📋 修复内容:"
    echo "1. ✅ 修复了alias路径末尾斜杠问题"
    echo "2. ✅ 设置了正确的文件权限"
    echo "3. ✅ 重启了nginx服务"
    echo ""
    echo "🌐 测试访问:"
    echo "外网: http://60.205.4.42"
    echo "内网: http://172.27.225.238"
    echo ""
    echo "🔍 如果仍有问题，请检查:"
    echo "1. 浏览器开发者工具中的网络请求"
    echo "2. nginx错误日志: tail -f /var/log/nginx/storybook-maker.error.log"
    echo "3. nginx访问日志: tail -f /var/log/nginx/storybook-maker.access.log"
    
else
    echo ""
    print_info "🔍 发现的问题:"
    echo "1. alias路径末尾缺少斜杠 - 这是导致404的主要原因"
    echo "2. 可能的文件权限问题"
    echo ""
    print_info "💡 修复命令:"
    echo "sudo $0 --fix"
    echo ""
    print_info "🔧 手动修复步骤:"
    echo "1. 编辑配置文件: sudo nano $NGINX_CONFIG"
    echo "2. 将 'alias /home/ecs-user/code/StoryBookMaker/.next/static;'"
    echo "   改为 'alias /home/ecs-user/code/StoryBookMaker/.next/static/;'"
    echo "3. 测试配置: sudo nginx -t"
    echo "4. 重启nginx: sudo systemctl reload nginx"
fi

# 5. 显示当前配置状态
echo ""
print_info "📊 当前配置状态:"
echo "配置文件: $NGINX_CONFIG"
echo "项目路径: $PROJECT_PATH"
echo "静态文件: $PROJECT_PATH/.next/static/"
echo "服务器IP: 60.205.4.42 (外网), 172.27.225.238 (内网)"

# 6. 提供调试命令
echo ""
print_info "🔍 调试命令:"
echo "# 查看nginx配置"
echo "cat $NGINX_CONFIG | grep -A 5 '_next/static'"
echo ""
echo "# 测试静态文件访问"
echo "curl -I http://localhost/_next/static/"
echo "curl -I http://60.205.4.42/_next/static/"
echo ""
echo "# 查看nginx日志"
echo "tail -f /var/log/nginx/storybook-maker.error.log"
echo "tail -f /var/log/nginx/storybook-maker.access.log"
echo ""
echo "# 检查静态文件"
echo "ls -la $PROJECT_PATH/.next/static/chunks/ | head -5"