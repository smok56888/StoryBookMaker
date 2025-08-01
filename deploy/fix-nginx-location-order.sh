#!/bin/bash

# 修复nginx location顺序问题的脚本
# 这是导致浏览器访问404但服务器内部访问正常的主要原因

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
if [ "$EUID" -ne 0 ]; then
    print_error "请使用root权限运行此脚本"
    echo "使用方法: sudo $0"
    exit 1
fi

echo "🔧 修复Nginx Location顺序问题"
echo "============================="

NGINX_CONFIG="/etc/nginx/sites-available/storybook-maker"

# 1. 检查配置文件是否存在
if [ ! -f "$NGINX_CONFIG" ]; then
    print_error "nginx配置文件不存在: $NGINX_CONFIG"
    exit 1
fi

# 2. 备份原配置
BACKUP_FILE="$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
cp "$NGINX_CONFIG" "$BACKUP_FILE"
print_status "已备份原配置到: $BACKUP_FILE"

# 3. 获取项目路径
PROJECT_PATH=$(find /root /home -name "StoryBookMaker" -type d 2>/dev/null | head -1)
if [ -z "$PROJECT_PATH" ]; then
    print_error "未找到StoryBookMaker项目目录"
    exit 1
fi
print_status "项目路径: $PROJECT_PATH"

# 4. 获取IP地址
EXTERNAL_IP=$(curl -s --connect-timeout 5 ifconfig.me 2>/dev/null || echo "")
INTERNAL_IP=$(hostname -I | awk '{print $1}')

# 5. 生成新的nginx配置
print_info "生成新的nginx配置..."

cat > "$NGINX_CONFIG" << EOF
# StoryBookMaker Nginx配置 - 修复版本
# 生成时间: $(date)
# 修复问题: location顺序和静态资源404

server {
    listen 80;
    server_name $INTERNAL_IP${EXTERNAL_IP:+ $EXTERNAL_IP} localhost;
    
    # 日志配置
    access_log /var/log/nginx/storybook-maker.access.log;
    error_log /var/log/nginx/storybook-maker.error.log;
    
    # 重要: 静态资源location必须在根location之前
    # 这样可以确保静态资源请求不会被根location拦截
    
    # 1. Next.js静态文件 - 最高优先级
    location /_next/static/ {
        alias $PROJECT_PATH/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Content-Type-Options nosniff;
        
        # 添加调试头
        add_header X-Served-By "nginx-static" always;
        
        # 确保文件存在时返回，不存在时返回404
        try_files \$uri \$uri/ =404;
    }
    
    # 2. 图片和媒体文件缓存
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp|mp4|mp3|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
        add_header X-Served-By "nginx-media" always;
        
        # 先尝试静态文件，再代理到应用
        try_files \$uri @proxy;
    }
    
    # 3. CSS 和 JS 文件缓存
    location ~* \.(css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header X-Served-By "nginx-assets" always;
        
        # 先尝试静态文件，再代理到应用
        try_files \$uri @proxy;
    }
    
    # 4. API 路由 - 直接代理，不缓存
    location /api/ {
        proxy_pass http://localhost:3000;
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
        add_header X-Served-By "nginx-api" always;
    }
    
    # 5. 主应用代理 - 最后匹配
    location / {
        proxy_pass http://localhost:3000;
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
        
        add_header X-Served-By "nginx-app" always;
    }
    
    # 6. 代理回退 - 用于静态文件不存在时
    location @proxy {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        add_header X-Served-By "nginx-fallback" always;
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
        image/svg+xml
        application/x-font-ttf
        font/opentype;
}
EOF

print_status "新配置已生成"

# 6. 测试配置
print_info "测试nginx配置..."
if nginx -t; then
    print_status "nginx配置语法正确"
else
    print_error "nginx配置语法错误，恢复备份"
    cp "$BACKUP_FILE" "$NGINX_CONFIG"
    exit 1
fi

# 7. 重启nginx
print_info "重启nginx..."
systemctl reload nginx
if [ $? -eq 0 ]; then
    print_status "nginx重启成功"
else
    print_error "nginx重启失败"
    exit 1
fi

# 8. 测试访问
print_info "测试访问..."
sleep 2

echo ""
echo "测试结果:"
echo "========="

# 测试localhost
HTTP_CODE_LOCAL=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/_next/static/")
if [ "$HTTP_CODE_LOCAL" = "200" ] || [ "$HTTP_CODE_LOCAL" = "403" ]; then
    print_status "localhost访问: HTTP $HTTP_CODE_LOCAL ✓"
else
    print_warning "localhost访问: HTTP $HTTP_CODE_LOCAL"
fi

# 测试内网IP
HTTP_CODE_INTERNAL=$(curl -s -o /dev/null -w "%{http_code}" "http://$INTERNAL_IP/_next/static/")
if [ "$HTTP_CODE_INTERNAL" = "200" ] || [ "$HTTP_CODE_INTERNAL" = "403" ]; then
    print_status "内网IP访问: HTTP $HTTP_CODE_INTERNAL ✓"
else
    print_warning "内网IP访问: HTTP $HTTP_CODE_INTERNAL"
fi

# 测试外网IP（如果有）
if [ -n "$EXTERNAL_IP" ]; then
    HTTP_CODE_EXTERNAL=$(curl -s -o /dev/null -w "%{http_code}" "http://$EXTERNAL_IP/_next/static/")
    if [ "$HTTP_CODE_EXTERNAL" = "200" ] || [ "$HTTP_CODE_EXTERNAL" = "403" ]; then
        print_status "外网IP访问: HTTP $HTTP_CODE_EXTERNAL ✓"
    else
        print_warning "外网IP访问: HTTP $HTTP_CODE_EXTERNAL"
    fi
fi

# 9. 显示完成信息
echo ""
print_status "🎉 修复完成!"
echo ""
echo "📋 配置摘要:"
echo "项目路径: $PROJECT_PATH"
echo "静态文件: $PROJECT_PATH/.next/static/"
echo "服务器IP: $INTERNAL_IP${EXTERNAL_IP:+ (外网: $EXTERNAL_IP)}"
echo "配置文件: $NGINX_CONFIG"
echo "备份文件: $BACKUP_FILE"
echo ""
echo "🌐 测试访问:"
echo "内网: http://$INTERNAL_IP"
if [ -n "$EXTERNAL_IP" ]; then
    echo "外网: http://$EXTERNAL_IP"
fi
echo ""
echo "🔍 调试命令:"
echo "查看访问日志: tail -f /var/log/nginx/storybook-maker.access.log"
echo "查看错误日志: tail -f /var/log/nginx/error.log"
echo "测试静态资源: curl -I http://$INTERNAL_IP/_next/static/"
echo ""
echo "💡 关键修复点:"
echo "1. ✅ 静态资源location移到根location之前"
echo "2. ✅ 添加了try_files指令"
echo "3. ✅ 配置了正确的server_name"
echo "4. ✅ 添加了调试头信息"
echo "5. ✅ 优化了location匹配顺序"