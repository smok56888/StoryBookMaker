# Nginx配置修改指南

## 🚀 快速配置步骤

### 1. 修改基础配置
编辑 `deploy/nginx.conf` 文件，修改以下关键参数：

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 👈 修改为你的域名或IP地址
    
    # 👈 修改项目路径
    location /_next/static/ {
        alias /path/to/your/project/StoryBookMaker/.next/static/;
    }
}
```

### 2. 复制配置到nginx目录
```bash
# 复制配置文件
sudo cp deploy/nginx.conf /etc/nginx/sites-available/storybook-maker

# 创建软链接启用站点
sudo ln -s /etc/nginx/sites-available/storybook-maker /etc/nginx/sites-enabled/

# 删除默认配置（可选）
sudo rm /etc/nginx/sites-enabled/default
```

### 3. 测试并重启nginx
```bash
# 测试配置文件语法
sudo nginx -t

# 重启nginx
sudo systemctl restart nginx

# 检查nginx状态
sudo systemctl status nginx
```

## 🔧 常见配置修改

### 1. 修改域名/IP地址
```nginx
server {
    listen 80;
    # 修改为你的实际域名或IP
    server_name example.com www.example.com;
    # 或者使用IP地址
    # server_name 123.456.789.123;
}
```

### 2. 修改项目路径
```nginx
# 找到这一行并修改为你的实际项目路径
location /_next/static/ {
    alias /home/your-username/StoryBookMaker/.next/static/;
    # 例如：alias /root/StoryBookMaker/.next/static/;
}
```

### 3. 修改应用端口
```nginx
# 如果你的应用运行在其他端口，修改这里
location /api/ {
    proxy_pass http://localhost:3000;  # 👈 修改端口号
}

location / {
    proxy_pass http://localhost:3000;  # 👈 修改端口号
}
```

### 4. 调整超时时间
```nginx
# API路由超时设置（用于AI生成，可能需要更长时间）
location /api/ {
    # 根据你的服务器性能调整
    proxy_connect_timeout 180s;  # 连接超时
    proxy_send_timeout 180s;     # 发送超时
    proxy_read_timeout 180s;     # 读取超时
}
```

### 5. 调整文件上传大小
```nginx
# 根据需要调整上传文件大小限制
client_max_body_size 20M;  # 允许上传20MB文件
```

## 🌐 阿里云特定配置

### 1. 阿里云ECS配置
```nginx
server {
    listen 80;
    # 使用阿里云公网IP
    server_name 123.456.789.123;
    
    # 阿里云ECS常见路径
    location /_next/static/ {
        alias /root/StoryBookMaker/.next/static/;
        # 或者 /home/ecs-user/StoryBookMaker/.next/static/;
    }
}
```

### 2. 阿里云CDN集成
```nginx
# 如果使用阿里云CDN，添加CDN相关头
location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
    expires 30d;
    add_header Cache-Control "public, no-transform";
    add_header X-CDN-Cache "MISS";  # CDN缓存标识
}
```

### 3. 阿里云SLB负载均衡
```nginx
# 如果使用SLB，需要获取真实IP
location / {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    # 阿里云SLB特殊头
    proxy_set_header X-Forwarded-Proto $http_x_forwarded_proto;
}
```

## 🔒 SSL/HTTPS配置

### 1. 使用Let's Encrypt免费证书
```bash
# 安装certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加：0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. 手动SSL配置
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL证书路径
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # SSL安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # 其他配置与HTTP相同...
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

## 🚨 安全配置

### 1. 基础安全头
```nginx
# 安全头配置
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self'" always;
```

### 2. 限制访问
```nginx
# 限制特定路径访问
location /admin {
    allow 192.168.1.0/24;  # 只允许内网访问
    deny all;
}

# 限制请求频率
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
location /api/ {
    limit_req zone=api burst=20 nodelay;
}
```

## 📊 性能优化

### 1. 缓存配置
```nginx
# 静态资源缓存
location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Vary "Accept-Encoding";
}

# API响应不缓存
location /api/ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

### 2. Gzip压缩优化
```nginx
# 优化的Gzip配置
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
```

## 🔍 故障排除

### 1. 检查配置语法
```bash
sudo nginx -t
```

### 2. 查看nginx日志
```bash
# 查看错误日志
sudo tail -f /var/log/nginx/error.log

# 查看访问日志
sudo tail -f /var/log/nginx/storybook-maker.access.log
```

### 3. 检查端口占用
```bash
# 检查nginx是否在监听80端口
sudo netstat -tlnp | grep :80

# 检查应用是否在运行
sudo netstat -tlnp | grep :3000
```

### 4. 重启服务
```bash
# 重启nginx
sudo systemctl restart nginx

# 重新加载配置（不中断服务）
sudo systemctl reload nginx
```

## 📋 配置模板

### 基础配置模板
```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;
    
    # 日志
    access_log /var/log/nginx/storybook-maker.access.log;
    error_log /var/log/nginx/storybook-maker.error.log;
    
    # 静态文件
    location /_next/static/ {
        alias YOUR_PROJECT_PATH/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API代理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 120s;
        proxy_read_timeout 120s;
    }
    
    # 主应用代理
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 文件上传限制
    client_max_body_size 10M;
    
    # Gzip压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

## 💡 最佳实践

1. **备份配置**：修改前备份原配置文件
2. **测试配置**：每次修改后都要测试语法
3. **监控日志**：定期检查nginx日志
4. **性能调优**：根据实际访问量调整缓存和超时设置
5. **安全更新**：定期更新nginx版本

## 🔄 快速部署命令

```bash
# 一键配置nginx
sudo cp deploy/nginx.conf /etc/nginx/sites-available/storybook-maker
sudo ln -s /etc/nginx/sites-available/storybook-maker /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```