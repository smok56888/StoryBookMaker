#!/bin/bash

# StoryBookMaker Nginx静态资源404修复脚本

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

echo "🔍 StoryBookMaker Nginx静态资源404修复脚本"
echo "============================================"

# 1. 检查当前目录和项目结构
print_info "检查项目结构..."
CURRENT_DIR=$(pwd)
PROJECT_DIR=$(cd "$(dirname "$0")/.." && pwd)

echo "当前目录: $CURRENT_DIR"
echo "项目目录: $PROJECT_DIR"

# 2. 检查.next目录是否存在
print_info "检查构建文件..."
if [ -d "$PROJECT_DIR/.next" ]; then
    print_status ".next目录存在: $PROJECT_DIR/.next"
    
    if [ -d "$PROJECT_DIR/.next/static" ]; then
        print_status "静态文件目录存在: $PROJECT_DIR/.next/static"
        
        # 显示静态文件内容
        echo ""
        echo "静态文件目录内容:"
        ls -la "$PROJECT_DIR/.next/static/" | head -10
        
        # 检查chunks目录
        if [ -d "$PROJECT_DIR/.next/static/chunks" ]; then
            print_status "chunks目录存在"
            echo "chunks目录内容:"
            ls -la "$PROJECT_DIR/.next/static/chunks/" | head -5
        else
            print_warning "chunks目录不存在"
        fi
    else
        print_error "静态文件目录不存在: $PROJECT_DIR/.next/static"
        print_warning "需要重新构建项目"
    fi
else
    print_error ".next目录不存在: $PROJECT_DIR/.next"
    print_warning "需要构建项目: npm run build"
fi

# 3. 检查nginx配置文件
print_info "检查nginx配置..."
NGINX_CONFIG="/etc/nginx/sites-available/storybook-maker"

if [ -f "$NGINX_CONFIG" ]; then
    print_status "nginx配置文件存在: $NGINX_CONFIG"
    
    # 提取当前配置的路径
    CURRENT_ALIAS=$(grep "alias.*\.next/static" "$NGINX_CONFIG" | sed 's/.*alias \(.*\);/\1/')
    echo "当前配置的静态文件路径: $CURRENT_ALIAS"
    
    # 检查路径是否存在
    if [ -d "$CURRENT_ALIAS" ]; then
        print_status "配置的路径存在"
    else
        print_error "配置的路径不存在: $CURRENT_ALIAS"
        print_warning "需要修复路径配置"
    fi
else
    print_error "nginx配置文件不存在: $NGINX_CONFIG"
fi

# 4. 检查nginx进程和权限
print_info "检查nginx进程和权限..."
NGINX_USER=$(ps aux | grep nginx | grep -v grep | head -1 | awk '{print $1}')
echo "nginx运行用户: $NGINX_USER"

if [ -n "$NGINX_USER" ] && [ -d "$PROJECT_DIR/.next/static" ]; then
    # 检查nginx用户是否有读取权限
    sudo -u "$NGINX_USER" test -r "$PROJECT_DIR/.next/static" 2>/dev/null
    if [ $? -eq 0 ]; then
        print_status "nginx用户有读取权限"
    else
        print_warning "nginx用户可能没有读取权限"
    fi
fi

# 5. 提供修复方案
echo ""
print_info "🔧 修复方案:"

# 方案1: 重新构建项目
echo ""
echo "方案1: 重新构建项目（如果.next目录不存在或不完整）"
echo "cd $PROJECT_DIR"
echo "npm run build"

# 方案2: 修复nginx配置路径
echo ""
echo "方案2: 修复nginx配置路径"
CORRECT_PATH="$PROJECT_DIR/.next/static/"
echo "将nginx配置中的路径修改为: $CORRECT_PATH"

# 方案3: 自动修复
echo ""
echo "方案3: 自动修复（推荐）"
echo "运行: sudo $0 --fix"

# 6. 如果有--fix参数，执行自动修复
if [ "$1" = "--fix" ]; then
    echo ""
    print_info "🚀 开始自动修复..."
    
    # 检查是否为root
    if [ "$EUID" -ne 0 ]; then
        print_error "自动修复需要root权限，请使用: sudo $0 --fix"
        exit 1
    fi
    
    # 确保项目已构建
    if [ ! -d "$PROJECT_DIR/.next/static" ]; then
        print_info "项目未构建，开始构建..."
        cd "$PROJECT_DIR"
        
        # 检查是否有package.json
        if [ -f "package.json" ]; then
            # 尝试构建
            if sudo -u $(stat -c '%U' .) npm run build; then
                print_status "项目构建成功"
            else
                print_error "项目构建失败，请手动构建"
                exit 1
            fi
        else
            print_error "未找到package.json，请确认项目目录正确"
            exit 1
        fi
    fi
    
    # 修复nginx配置
    if [ -f "$NGINX_CONFIG" ]; then
        print_info "修复nginx配置..."
        
        # 备份原配置
        cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
        print_status "已备份原配置"
        
        # 修改配置文件中的路径
        CORRECT_PATH="$PROJECT_DIR/.next/static/"
        sed -i "s|alias.*\.next/static/.*;|alias $CORRECT_PATH;|g" "$NGINX_CONFIG"
        
        print_status "nginx配置已修复"
        echo "新的静态文件路径: $CORRECT_PATH"
        
        # 测试nginx配置
        if nginx -t; then
            print_status "nginx配置语法正确"
            
            # 重启nginx
            systemctl reload nginx
            print_status "nginx已重新加载"
            
        else
            print_error "nginx配置语法错误"
            # 恢复备份
            cp "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)" "$NGINX_CONFIG"
            print_warning "已恢复原配置"
            exit 1
        fi
    else
        print_error "nginx配置文件不存在"
        exit 1
    fi
    
    # 设置正确的权限
    print_info "设置文件权限..."
    chmod -R 755 "$PROJECT_DIR/.next"
    print_status "权限设置完成"
    
    echo ""
    print_status "🎉 修复完成！"
    echo ""
    echo "请测试访问: http://$(hostname -I | awk '{print $1}')/_next/static/"
    echo "或者访问你的网站查看静态资源是否正常加载"
    
else
    echo ""
    print_info "💡 快速修复命令:"
    echo "sudo $0 --fix"
fi

# 7. 显示调试信息
echo ""
print_info "🔍 调试信息:"
echo "如果问题仍然存在，请检查以下内容："
echo "1. nginx错误日志: sudo tail -f /var/log/nginx/error.log"
echo "2. nginx访问日志: sudo tail -f /var/log/nginx/storybook-maker.access.log"
echo "3. 测试静态文件访问: curl -I http://localhost/_next/static/"
echo "4. 检查文件权限: ls -la $PROJECT_DIR/.next/"