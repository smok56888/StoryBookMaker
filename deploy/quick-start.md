# StoryBookMaker 快速部署指南

## 🚀 一键部署（推荐）

### 前提条件
- 阿里云ECS服务器 (推荐2GB+ RAM)
- 已安装 Nginx
- 服务器可以访问外网

### 部署步骤

#### 1. 连接ECS服务器
```bash
ssh root@your-server-ip
```

#### 2. 安装Node.js环境
```bash
# 安装Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs

# 安装PM2进程管理器
npm install -g pm2

# 验证安装
node --version
```

#### 3. 一键部署项目
```bash
# 克隆项目
mkdir -p /home/ecs-user/code
cd /home/ecs-user/code
git clone https://github.com/smok56888/StoryBookMaker.git
cd StoryBookMaker

# 配置API密钥
cp .env.example .env.local
nano .env.local  # 填入你的豆包API密钥

# 🎯 一键部署（自动解决所有问题）
./deploy/deploy-unified.sh
```

#### 4. 配置Nginx
```bash
# 复制配置文件
sudo cp deploy/nginx.conf /etc/nginx/sites-available/storybook-maker

# 修改域名配置
sudo nano /etc/nginx/sites-available/storybook-maker
# 将 "your-domain.com" 替换为你的域名或IP

# 启用站点
sudo ln -s /etc/nginx/sites-available/storybook-maker /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 🎯 部署选项

```bash
# 完整部署（包含Chrome浏览器用于PDF功能）
./deploy/deploy-unified.sh

# 跳过Chrome安装（如果不需要PDF功能）
./deploy/deploy-unified.sh --skip-chrome

# 强制清理所有缓存后重新部署
./deploy/deploy-unified.sh --force-clean
```

## ✅ 自动解决的问题

统一部署脚本会自动处理：
- ✅ npm依赖版本冲突
- ✅ Puppeteer Chrome下载失败
- ✅ Next.js构建错误
- ✅ 网络连接问题（使用国内镜像）
- ✅ 系统依赖缺失
- ✅ 浏览器安装和配置
- ✅ PM2进程管理

## 🌐 访问应用

部署完成后访问：
- `http://your-server-ip:3000` (直接访问)
- `http://your-domain.com` (通过Nginx)

## 📋 常用命令

```bash
# 查看应用状态
pm2 status

# 查看日志
pm2 logs storybook-maker

# 重启应用
pm2 restart storybook-maker

# 更新代码并重新部署
cd /home/ecs-user/code/StoryBookMaker
git pull origin main
./deploy/deploy-unified.sh
```

## 🔧 故障排除

如果遇到问题：

1. **查看详细日志**: `pm2 logs storybook-maker`
2. **强制重新部署**: `./deploy/deploy-unified.sh --force-clean`
3. **检查环境变量**: `cat .env.local`
4. **查看部署帮助**: `./deploy/deploy-unified.sh --help`

## 📞 常见问题

- **依赖安装失败** → 自动使用国内镜像重试
- **构建失败** → 自动降级Next.js版本
- **Chrome安装失败** → 自动尝试Chromium或禁用PDF
- **内存不足** → 脚本会自动优化内存配置

## 🎉 完成！

一键部署脚本已经集成了所有常见问题的解决方案，大多数情况下无需手动干预即可完成部署！