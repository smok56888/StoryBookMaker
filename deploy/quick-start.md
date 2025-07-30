# 快速部署指南

## 在阿里云ECS上快速部署 StoryBookMaker

### 前提条件
- 阿里云ECS服务器 (推荐2GB+ RAM)
- 已安装 Nginx
- 服务器可以访问外网

### 一键部署步骤

#### 1. 连接到你的ECS服务器
```bash
ssh root@your-server-ip
```

#### 2. 安装必要软件
```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs

# 安装 PM2 和 pnpm
npm install -g pm2 pnpm

# 验证安装
node --version
npm --version
```

#### 3. 克隆并部署项目
```bash
# 克隆项目
mkdir -p /home/ecs-user/code
cd /home/ecs-user/code
git clone https://github.com/smok56888/StoryBookMaker.git
cd StoryBookMaker

# 配置环境变量
cp .env.example .env.local
nano .env.local  # 编辑你的API密钥

# 运行部署脚本
./deploy/deploy.sh
```

#### 4. 配置 Nginx
```bash
# 复制 Nginx 配置
sudo cp /home/ecs-user/code/StoryBookMaker/deploy/nginx.conf /etc/nginx/sites-available/storybook-maker

# 编辑配置文件，替换域名
sudo nano /etc/nginx/sites-available/storybook-maker
# 将 "your-domain.com" 替换为你的域名或服务器IP

# 启用站点
sudo ln -s /etc/nginx/sites-available/storybook-maker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. 配置防火墙
```bash
# Ubuntu/Debian
ufw allow 80
ufw allow 443

# 或者在阿里云控制台的安全组中开放 80 和 443 端口
```

### 访问你的应用

部署完成后，你可以通过以下方式访问：
- `http://your-server-ip` (如果使用IP)
- `http://your-domain.com` (如果配置了域名)

### 环境变量配置

编辑 `.env.local` 文件，配置以下变量：
```env
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_API_KEY=你的实际API密钥
ARK_TEXT_TO_IMAGE_MODEL=doubao-seedream-3-0-t2i-250415
ARK_IMAGE_ANALYSIS_MODEL=doubao-seed-1-6-250615
```

### 常用维护命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs storybook-maker

# 重启应用
pm2 restart storybook-maker

# 更新代码
cd /home/ecs-user/code/StoryBookMaker
git pull origin main
./deploy/deploy.sh
```

### 故障排除

1. **应用无法启动**: 检查 `pm2 logs storybook-maker`
2. **Nginx 502 错误**: 确认应用在 3000 端口运行
3. **API 调用失败**: 检查 `.env.local` 中的 API 密钥配置
4. **内存不足**: 考虑升级服务器配置或优化应用

### 可选：配置 HTTPS

```bash
# 安装 Certbot
apt install certbot python3-certbot-nginx

# 获取 SSL 证书
certbot --nginx -d your-domain.com

# 自动续期
crontab -e
# 添加: 0 12 * * * /usr/bin/certbot renew --quiet
```

完成以上步骤后，其他人就可以通过你的域名或IP地址访问 StoryBookMaker 应用了！