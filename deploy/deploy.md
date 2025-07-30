# StoryBookMaker 项目部署指南

## 项目概述
- 项目类型: Next.js 应用
- 仓库地址: https://github.com/smok56888/StoryBookMaker.git
- 部署环境: 阿里云 ECS + Nginx

## 部署步骤

### 1. 服务器环境准备

#### 1.1 安装 Node.js (推荐使用 Node.js 18+)
```bash
# 使用 NodeSource 仓库安装最新 LTS 版本
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

#### 1.2 安装 PM2 (进程管理器)
```bash
sudo npm install -g pm2
```

#### 1.3 安装 pnpm (项目使用的包管理器)
```bash
sudo npm install -g pnpm
```

### 2. 项目部署

#### 2.1 克隆项目
```bash
mkdir -p /home/ecs-user/code
cd /home/ecs-user/code
git clone https://github.com/smok56888/StoryBookMaker.git
cd StoryBookMaker
```

#### 2.2 安装依赖
```bash
pnpm install
```

#### 2.3 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量
nano .env.local
```

需要配置的环境变量:
```env
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_API_KEY=your_actual_api_key_here
ARK_TEXT_TO_IMAGE_MODEL=doubao-seedream-3-0-t2i-250415
ARK_IMAGE_ANALYSIS_MODEL=doubao-seed-1-6-250615
```

#### 2.4 构建项目
```bash
pnpm build
```

#### 2.5 使用 PM2 启动应用
```bash
pm2 start npm --name "storybook-maker" -- start
pm2 save
pm2 startup
```

### 3. Nginx 配置

#### 3.1 创建 Nginx 配置文件
```bash
sudo nano /etc/nginx/sites-available/storybook-maker
```

#### 3.2 Nginx 配置内容
```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为你的域名或IP

    # 静态文件缓存
    location /_next/static/ {
        alias /home/ecs-user/code/StoryBookMaker/.next/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 代理到 Next.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 增加超时时间，适应AI生成内容的长时间请求
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 文件上传大小限制
    client_max_body_size 10M;
}
```

#### 3.3 启用站点配置
```bash
sudo ln -s /etc/nginx/sites-available/storybook-maker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 防火墙配置

```bash
# 开放 HTTP 端口
sudo ufw allow 80
sudo ufw allow 443  # 如果后续需要 HTTPS

# 如果使用阿里云安全组，需要在控制台开放相应端口
```

### 5. SSL 证书配置 (可选但推荐)

#### 5.1 安装 Certbot
```bash
sudo apt install certbot python3-certbot-nginx
```

#### 5.2 获取 SSL 证书
```bash
sudo certbot --nginx -d your-domain.com
```

### 6. 部署脚本自动化

创建自动部署脚本:
```bash
nano deploy.sh
chmod +x deploy.sh
```

## 维护命令

### 查看应用状态
```bash
pm2 status
pm2 logs storybook-maker
```

### 重启应用
```bash
pm2 restart storybook-maker
```

### 更新代码
```bash
cd /home/ecs-user/code/StoryBookMaker
git pull origin main
pnpm install
pnpm build
pm2 restart storybook-maker
```

### 查看 Nginx 日志
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## 注意事项

1. **API 密钥安全**: 确保 `.env.local` 文件权限设置正确，不要提交到 Git
2. **内存监控**: 由于项目使用了 Puppeteer 等重型库，注意监控服务器内存使用
3. **定期备份**: 建议定期备份 `data` 目录中的用户数据
4. **日志轮转**: 配置日志轮转避免日志文件过大

## 故障排除

### 常见问题
1. **端口占用**: 检查 3000 端口是否被占用
2. **权限问题**: 确保应用有读写 `data` 目录的权限
3. **内存不足**: Puppeteer 需要较多内存，建议至少 2GB RAM
4. **API 调用失败**: 检查网络连接和 API 密钥配置