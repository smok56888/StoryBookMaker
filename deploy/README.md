# StoryBookMaker 部署指南

## 🚀 一键部署（推荐）

```bash
# 克隆项目
git clone https://github.com/smok56888/StoryBookMaker.git
cd StoryBookMaker

# 完整部署（包含所有依赖安装）
sudo ./deploy/deploy.sh --full

# 配置API密钥
nano .env.local  # 填入你的豆包API密钥

# 重启应用
./deploy/restart.sh
```

## 📋 其他部署选项

```bash
# 快速部署（仅构建和启动，需要预先安装依赖）
./deploy/deploy.sh --quick

# 检查系统环境
./deploy/deploy.sh --check

# 修复特定问题
./deploy/deploy.sh --fix-chrome   # 修复Chrome和PDF问题
./deploy/deploy.sh --fix-fonts    # 修复中文字体问题
./deploy/deploy.sh --fix-nginx    # 修复Nginx配置问题
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

- `deploy.sh` - 统一部署脚本（包含所有修复功能）
- `nginx.conf` - Nginx 反向代理配置
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
./deploy/deploy.sh --quick
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
./deploy/deploy.sh --full
```

## 📋 环境要求

- Node.js 18+
- npm
- 足够的磁盘空间用于依赖安装

## 💡 部署特性

- ✅ 自动安装所有系统依赖（Node.js、Chrome、中文字体）
- ✅ 自动配置国内npm镜像源
- ✅ 智能依赖冲突处理
- ✅ 后台进程管理
- ✅ 详细的错误处理和重试机制
- ✅ 自动生成应用管理脚本
- ✅ 完整的日志记录
- ✅ 集成所有常见问题的修复方案

统一部署脚本已经集成了所有常见问题的解决方案，大多数情况下一键即可完成部署！