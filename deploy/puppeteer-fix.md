# Puppeteer安装问题修复指南

## 问题分析
从错误信息看，主要问题是：
1. Puppeteer无法下载Chrome浏览器
2. 网络连接问题导致下载失败
3. 可能缺少系统依赖

## 解决方案

### 方案1: 跳过Puppeteer Chrome下载 (推荐)

```bash
# 设置环境变量跳过Chrome下载
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_SKIP_DOWNLOAD=true

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 方案2: 手动安装Chrome

```bash
# 更新系统包
sudo apt update

# 安装Chrome依赖
sudo apt install -y wget gnupg
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt update
sudo apt install -y google-chrome-stable

# 设置Chrome路径
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable
```

### 方案3: 使用国内镜像

```bash
# 设置Puppeteer国内镜像
export PUPPETEER_DOWNLOAD_HOST=https://npmmirror.com/mirrors
export PUPPETEER_DOWNLOAD_BASE_URL=https://npmmirror.com/mirrors/chromium-browser-snapshots

# 重新安装
npm install --legacy-peer-deps
```

### 方案4: 临时移除Puppeteer依赖

如果PDF生成功能暂时不需要，可以临时移除：

```bash
# 移除puppeteer相关依赖
npm uninstall puppeteer
npm uninstall @types/puppeteer

# 重新安装其他依赖
npm install --legacy-peer-deps
```

## 系统依赖安装

安装Puppeteer需要的系统依赖：

```bash
# Ubuntu/Debian系统
sudo apt update
sudo apt install -y \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libc6 \
    libcairo2 \
    libcups2 \
    libdbus-1-3 \
    libexpat1 \
    libfontconfig1 \
    libgbm1 \
    libgcc1 \
    libglib2.0-0 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libstdc++6 \
    libx11-6 \
    libx11-xcb1 \
    libxcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libxrender1 \
    libxss1 \
    libxtst6 \
    lsb-release \
    wget \
    xdg-utils
```

## 推荐的完整修复流程

```bash
# 1. 进入项目目录
cd /home/ecs-user/code/StoryBookMaker

# 2. 设置环境变量
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_SKIP_DOWNLOAD=true
export NODE_OPTIONS="--max-old-space-size=4096"

# 3. 清理环境
rm -rf node_modules package-lock.json

# 4. 创建.npmrc配置
echo "legacy-peer-deps=true" > .npmrc
echo "registry=https://registry.npmmirror.com" >> .npmrc
echo "puppeteer_skip_chromium_download=true" >> .npmrc

# 5. 重新安装依赖
npm install --legacy-peer-deps

# 6. 构建项目
npm run build --legacy-peer-deps

# 7. 启动服务
pm2 start npm --name "storybook-maker" -- start
```

## 如果仍然需要PDF功能

### 安装Chrome浏览器
```bash
# 下载Chrome
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
sudo sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google-chrome.list'
sudo apt update
sudo apt install -y google-chrome-stable

# 验证安装
google-chrome-stable --version
```

### 配置Puppeteer使用系统Chrome
在项目的环境变量中添加：
```bash
echo "PUPPETEER_EXECUTABLE_PATH=/usr/bin/google-chrome-stable" >> .env.local
```

## 内存不足问题

如果遇到内存不足：
```bash
# 创建swap文件
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 验证swap
free -h
```

## 网络问题

如果下载仍然失败：
```bash
# 使用代理（如果有）
export http_proxy=http://proxy:port
export https_proxy=http://proxy:port

# 或者完全跳过下载
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

选择最适合你当前情况的方案。推荐先尝试方案1，跳过Chrome下载，这样可以快速完成部署。