#!/bin/bash

# StoryBookMaker Nginx快速配置脚本
# 用于快速配置nginx反向代理

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

# 检查是否为root用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "请使用root权限运行此脚本"
        echo "使用方法: sudo $0"
        exit 1
    fi
}

# 检查nginx是否安装
check_nginx() {
    if ! command -v nginx >/dev/null 2>&1; then
        print_warning "Nginx未安装，正在安装..."
        
        # 检测系统类型
        if [ -f /etc/debian_version ]; then
            apt update
            apt install -y nginx
        elif [ -f /etc/redhat-release ]; then
            yum install -y nginx
        else
            print_error "不支持的系统类型，请手动安装nginx"
            exit 1
        fi
        
        if command -v nginx >/dev/null 2>&1; then
            print_status "Nginx安装成功"
        else
            print_error "Nginx安装失败"
            exit 1
        fi
    else
        print_status "Nginx已安装"
    fi
}

# 获取用户输入
get_user_input() {
    echo ""
    print_info "请提供以下配置信息："
    
    # 域名或IP
    read -p "请输入域名或IP地址 (例: example.com 或 123.456.789.123): " SERVER_NAME
    if [ -z "$SERVER_NAME" ]; then
        print_warning "未输入域名/IP，使用默认值: localhost"
        SERVER_NAME="localhost"
    fi
    
    # 项目路径
    read -p "请输入项目完整路径 (例: /root/StoryBookMaker): " PROJECT_PATH
    if [ -z "$PROJECT_PATH" ]; then
        PROJECT_PATH=$(pwd | sed 's|/deploy||')
        print_warning "未输入项目路径，使用当前路径: $PROJECT_PATH"
    fi
    
    # 应用端口
    read -p "请输入应用端口 (默认: 3000): " APP_PORT
    if [ -z "$APP_PORT" ]; then
        APP_PORT="3000"
    fi
    
    # 是否启用SSL
    read -p "是否配置SSL/HTTPS? (y/n, 默认: n): " ENABLE_SSL
    if [ -z "$ENABLE_SSL" ]; then
        ENABLE_SSL="n"
    fi
    
    echo ""
    print_info "配置信息确认："
    echo "域名/IP: $SERVER_NAME"
    echo "项目路径: $PROJECT_PATH"
    echo "应用端口: $APP_PORT"
    echo "启用SSL: $ENABLE_SSL"
    echo ""
    
    read -p "确认配置? (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
        print_warning "配置已取消"
        exit 0
    fi
}

# 生成nginx配置
generate_config() {
    print_info "生成nginx配置文件..."
    
    CONFIG_FILE="/etc/nginx/sites-available/storybook-maker"
    
    cat > "$CONFIG_FILE" << EOF
# StoryBookMaker Nginx配置
# 自动生成于: $(date)

server {
    listen 80;
    server_name $SERVER_NAME;
    
    # 日志配置
    access_log /var/log/nginx/storybook-maker.access.log;
    error_log /var/log/nginx/storybook-maker.error.log;
    
    # 静态文件缓存优化
    location /_next/static/ {
        alias $PROJECT_PATH/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
    }
    
    # 图片和媒体文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }
    
    # CSS 和 JS 文件缓存
    location ~* \.(css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API 路由 - 增加超时时间用于AI生成
    location /api/ {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # AI生成需要更长的超时时间
        proxy_connect_timeout 180s;
        proxy_send_timeout 180s;
        proxy_read_timeout 180s;
        
        # 禁用缓存
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # 主应用代理
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # 标准超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # 文件上传大小限制
    client_max_body_size 20M;
    
    # 安全头设置
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;
}
EOF

    if [ "$ENABLE_SSL" = "y" ] || [ "$ENABLE_SSL" = "Y" ]; then
        cat >> "$CONFIG_FILE" << EOF

# HTTPS配置 (需要SSL证书)
server {
    listen 443 ssl http2;
    server_name $SERVER_NAME;
    
    # SSL证书路径 (需要手动配置)
    ssl_certificate /etc/letsencrypt/live/$SERVER_NAME/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$SERVER_NAME/privkey.pem;
    
    # SSL配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 其他配置与HTTP相同
    location / {
        proxy_pass http://localhost:$APP_PORT;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:$APP_PORT;
        proxy_connect_timeout 180s;
        proxy_read_timeout 180s;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    client_max_body_size 20M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name $SERVER_NAME;
    return 301 https://\$server_name\$request_uri;
}
EOF
    fi
    
    print_status "配置文件已生成: $CONFIG_FILE"
}

# 启用站点
enable_site() {
    print_info "启用nginx站点..."
    
    # 创建软链接
    if [ ! -L "/etc/nginx/sites-enabled/storybook-maker" ]; then
        ln -s /etc/nginx/sites-available/storybook-maker /etc/nginx/sites-enabled/
        print_status "站点已启用"
    else
        print_warning "站点已经启用"
    fi
    
    # 删除默认站点（可选）
    if [ -L "/etc/nginx/sites-enabled/default" ]; then
        read -p "是否删除默认nginx站点? (y/n): " REMOVE_DEFAULT
        if [ "$REMOVE_DEFAULT" = "y" ] || [ "$REMOVE_DEFAULT" = "Y" ]; then
            rm /etc/nginx/sites-enabled/default
            print_status "默认站点已删除"
        fi
    fi
}

# 测试并重启nginx
restart_nginx() {
    print_info "测试nginx配置..."
    
    if nginx -t; then
        print_status "配置文件语法正确"
        
        print_info "重启nginx服务..."
        systemctl restart nginx
        
        if systemctl is-active --quiet nginx; then
            print_status "Nginx重启成功"
        else
            print_error "Nginx重启失败"
            systemctl status nginx
            exit 1
        fi
    else
        print_error "配置文件语法错误"
        nginx -t
        exit 1
    fi
}

# 显示完成信息
show_completion() {
    echo ""
    print_status "🎉 Nginx配置完成！"
    echo ""
    echo "📋 配置信息:"
    echo "域名/IP: $SERVER_NAME"
    echo "项目路径: $PROJECT_PATH"
    echo "应用端口: $APP_PORT"
    echo "配置文件: /etc/nginx/sites-available/storybook-maker"
    echo ""
    echo "🌐 访问地址:"
    if [ "$ENABLE_SSL" = "y" ] || [ "$ENABLE_SSL" = "Y" ]; then
        echo "HTTP: http://$SERVER_NAME (重定向到HTTPS)"
        echo "HTTPS: https://$SERVER_NAME"
        echo ""
        print_warning "注意: SSL证书需要手动配置"
        echo "建议使用Let's Encrypt: sudo certbot --nginx -d $SERVER_NAME"
    else
        echo "HTTP: http://$SERVER_NAME"
    fi
    echo ""
    echo "📊 管理命令:"
    echo "查看状态: sudo systemctl status nginx"
    echo "重启服务: sudo systemctl restart nginx"
    echo "查看日志: sudo tail -f /var/log/nginx/storybook-maker.access.log"
    echo "测试配置: sudo nginx -t"
    echo ""
    echo "🔧 如需修改配置:"
    echo "编辑文件: sudo nano /etc/nginx/sites-available/storybook-maker"
    echo "重新加载: sudo systemctl reload nginx"
}

# 主函数
main() {
    echo "🚀 StoryBookMaker Nginx快速配置脚本"
    echo "=================================="
    
    check_root
    check_nginx
    get_user_input
    generate_config
    enable_site
    restart_nginx
    show_completion
}

# 运行主函数
main "$@"