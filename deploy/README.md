# StoryBookMaker 部署指南

## 🚀 一键部署（推荐）

```bash
# 克隆项目
git clone https://github.com/smok56888/StoryBookMaker.git
cd StoryBookMaker

# 配置环境变量
cp .env.demo .env.local
nano .env.local  # 填入你的豆包API密钥

# 一键部署
./deploy/simple-deploy-no-pm2.sh
```

## 📋 手动部署

如果需要手动控制部署过程：

1. **配置环境变量**
```bash
cp .env.demo .env.local
# 编辑 .env.local 文件，配置你的豆包API密钥
# 详细配置说明请参考：deploy/env-setup-guide.md
```

2. **安装依赖**
```bash
npm config set registry https://registry.npmmirror.com
npm config set legacy-peer-deps true
npm install --legacy-peer-deps
```

3. **构建项目**
```bash
npm run build
```

4. **启动应用**
```bash
npm start
```

## 🔧 应用管理

项目提供了完整的应用管理脚本：

### 快速管理脚本
```bash
./deploy/start.sh        # 启动应用
./deploy/stop.sh         # 停止应用
./deploy/restart.sh      # 重启应用
./deploy/status.sh       # 查看状态
```

### 完整管理脚本
```bash
./deploy/manage-app.sh start      # 启动应用
./deploy/manage-app.sh stop       # 停止应用
./deploy/manage-app.sh restart    # 重启应用
./deploy/manage-app.sh status     # 查看详细状态
./deploy/manage-app.sh logs       # 查看日志
./deploy/manage-app.sh logs -f    # 实时查看日志
./deploy/manage-app.sh health     # 健康检查
./deploy/manage-app.sh clean-logs # 清理日志
./deploy/manage-app.sh help       # 显示帮助
```

## 📁 配置文件说明

- `simple-deploy-no-pm2.sh` - 一键部署脚本
- `nginx.conf` - Nginx 反向代理配置
- `nginx-setup-guide.md` - Nginx配置详细指南
- `nginx-config-examples.conf` - 各种场景的配置示例
- `nginx-quick-setup.sh` - Nginx快速配置脚本
- `env-setup-guide.md` - 环境变量配置详细指南
- `.env.demo` - 环境变量配置模板

## 🌐 生产环境配置

### Nginx 反向代理

```bash
# 复制配置文件
sudo cp deploy/nginx.conf /etc/nginx/sites-available/storybook-maker

# 编辑配置文件，修改域名
sudo nano /etc/nginx/sites-available/storybook-maker

# 启用站点
sudo ln -s /etc/nginx/sites-available/storybook-maker /etc/nginx/sites-enabled/

# 测试配置并重启
sudo nginx -t
sudo systemctl restart nginx
```

## 🔄 更新部署

```bash
git pull origin main
./deploy/simple-deploy-no-pm2.sh
```

## 🔍 故障排除

### 查看应用状态
```bash
./manage-app.sh status
./manage-app.sh logs
```

### 常见问题解决

1. **查看应用日志**
```bash
tail -f app.log
```

2. **检查端口占用**
```bash
netstat -tlnp | grep :3000
```

3. **手动启动测试**
```bash
npm start
```

4. **清理重新部署**
```bash
rm -rf node_modules package-lock.json .next
./deploy/simple-deploy-no-pm2.sh
```

## 📋 环境要求

- Node.js 18+
- npm
- 足够的磁盘空间用于依赖安装

## 💡 部署特性

- ✅ 自动配置国内npm镜像源
- ✅ 智能依赖冲突处理
- ✅ 后台进程管理
- ✅ 详细的错误处理和重试机制
- ✅ 自动生成应用管理脚本
- ✅ 完整的日志记录

一键部署脚本已经集成了所有常见问题的解决方案，大多数情况下一键即可完成部署！