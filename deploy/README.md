# StoryBookMaker 部署指南

## 🚀 一键部署（推荐）

使用统一部署脚本，自动解决所有常见问题：

```bash
# 克隆项目
mkdir -p /home/ecs-user/code
cd /home/ecs-user/code
git clone https://github.com/smok56888/StoryBookMaker.git
cd StoryBookMaker

# 配置环境变量
cp .env.example .env.local
nano .env.local  # 填入你的API密钥

# 一键部署
./deploy/deploy-unified.sh
```

## 📋 部署选项

```bash
# 完整部署（包含Chrome浏览器）
./deploy/deploy-unified.sh

# 跳过Chrome安装（如果不需要PDF功能）
./deploy/deploy-unified.sh --skip-chrome

# 强制清理所有缓存后部署
./deploy/deploy-unified.sh --force-clean

# 查看帮助
./deploy/deploy-unified.sh --help
```

## 🔧 统一脚本功能

`deploy-unified.sh` 集成了以下所有功能：

### ✅ 自动问题修复
- **依赖冲突修复** - 自动处理npm依赖版本冲突
- **Puppeteer问题修复** - 跳过Chrome下载，配置国内镜像
- **Next.js构建问题修复** - 自动降级版本，修复Suspense问题
- **网络问题处理** - 配置国内镜像源，加速下载

### ✅ 环境自动配置
- **系统依赖安装** - 自动安装必要的系统库
- **Node.js环境优化** - 内存限制，环境变量配置
- **包管理器适配** - 自动检测pnpm/yarn/npm

### ✅ 浏览器智能安装
- **Chrome自动安装** - 使用国内镜像源
- **Chromium后备方案** - Chrome安装失败时的替代
- **PDF功能配置** - 自动配置浏览器路径或禁用PDF

### ✅ 应用管理
- **PM2进程管理** - 自动启动/重启应用
- **状态检查** - 验证应用是否正常运行
- **日志输出** - 详细的部署过程信息

## 📁 文件结构

```
deploy/
├── deploy-unified.sh        # 🎯 统一部署脚本（推荐）
├── deploy.sh               # 原始部署脚本
├── nginx.conf              # Nginx配置文件
├── README.md               # 本文档
├── quick-start.md          # 快速开始指南
├── deploy.md               # 详细部署文档
└── 问题修复指南/
    ├── npm-fix.md
    ├── puppeteer-fix.md
    ├── chrome-alternatives.md
    ├── pdf-alternatives.md
    ├── china-deployment.md
    ├── ecs-setup-fix.md
    └── gitee-import-guide.md
```

## 🌐 Nginx配置

部署完成后，配置Nginx反向代理：

```bash
# 复制Nginx配置
sudo cp deploy/nginx.conf /etc/nginx/sites-available/storybook-maker

# 编辑域名配置
sudo nano /etc/nginx/sites-available/storybook-maker

# 启用站点
sudo ln -s /etc/nginx/sites-available/storybook-maker /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 🔍 故障排除

### 查看应用状态
```bash
pm2 status
pm2 logs storybook-maker
```

### 重新部署
```bash
cd /home/ecs-user/code/StoryBookMaker
git pull origin main
./deploy/deploy-unified.sh
```

### 强制清理重部署
```bash
./deploy/deploy-unified.sh --force-clean
```

## 📞 常见问题

1. **依赖安装失败** - 脚本会自动重试并使用国内镜像
2. **构建失败** - 自动降级Next.js版本并修复配置
3. **Chrome安装失败** - 自动尝试Chromium或禁用PDF功能
4. **网络连接问题** - 使用国内镜像源和DNS优化

## 🎯 推荐工作流

1. **首次部署**: `./deploy/deploy-unified.sh`
2. **日常更新**: `git pull && ./deploy/deploy-unified.sh`
3. **问题修复**: `./deploy/deploy-unified.sh --force-clean`
4. **生产环境**: 配置Nginx + SSL证书

统一部署脚本已经集成了所有常见问题的解决方案，大多数情况下一键即可完成部署！