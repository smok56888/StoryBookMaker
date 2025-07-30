# ECS环境修复指南

## 问题：pnpm命令未找到

从截图看到你的ECS上pnpm没有正确安装，需要重新安装。

## 解决方案

### 方案1: 安装pnpm (推荐)

```bash
# 方法1: 使用npm安装pnpm
npm install -g pnpm

# 方法2: 使用官方安装脚本
curl -fsSL https://get.pnpm.io/install.sh | sh -

# 方法3: 如果curl不可用，使用wget
wget -qO- https://get.pnpm.io/install.sh | sh -

# 重新加载shell配置
source ~/.bashrc
# 或者
source ~/.zshrc

# 验证安装
pnpm --version
```

### 方案2: 使用npm替代pnpm

如果pnpm安装仍有问题，可以直接使用npm：

```bash
# 使用npm安装依赖
npm install

# 构建项目
npm run build

# 启动项目
npm start
```

### 方案3: 使用yarn替代

```bash
# 安装yarn
npm install -g yarn

# 使用yarn安装依赖
yarn install

# 构建和启动
yarn build
yarn start
```

## 完整的ECS环境设置

### 1. 更新系统和安装基础工具
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git build-essential
```

### 2. 安装Node.js (如果还没安装)
```bash
# 使用NodeSource仓库安装最新LTS版本
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证安装
node --version
npm --version
```

### 3. 配置npm国内镜像
```bash
# 设置淘宝镜像
npm config set registry https://registry.npmmirror.com

# 验证配置
npm config get registry
```

### 4. 安装包管理器
```bash
# 安装pnpm
npm install -g pnpm

# 安装PM2进程管理器
npm install -g pm2

# 验证安装
pnpm --version
pm2 --version
```

### 5. 如果pnpm仍然失败，修改部署脚本使用npm

编辑 `deploy/deploy.sh`，将所有 `pnpm` 替换为 `npm`：

```bash
# 在项目目录中执行
sed -i 's/pnpm/npm/g' deploy/deploy.sh
```

## 当前情况的快速修复

基于你的截图，建议执行以下命令：

```bash
# 1. 安装pnpm
npm install -g pnpm

# 2. 如果上面失败，直接使用npm
npm install

# 3. 构建项目
npm run build

# 4. 使用PM2启动
pm2 start npm --name "storybook-maker" -- start
```

## 网络问题解决

如果遇到网络问题，配置国内镜像：

```bash
# npm镜像
npm config set registry https://registry.npmmirror.com

# pnpm镜像
pnpm config set registry https://registry.npmmirror.com

# 或者使用cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com
cnpm install
```

## 权限问题解决

如果遇到权限问题：

```bash
# 修改npm全局目录权限
sudo chown -R $(whoami) $(npm config get prefix)/{lib/node_modules,bin,share}

# 或者使用sudo安装
sudo npm install -g pnpm
```

## 验证环境

安装完成后验证环境：

```bash
echo "Node.js版本: $(node --version)"
echo "npm版本: $(npm --version)"
echo "pnpm版本: $(pnpm --version)"
echo "PM2版本: $(pm2 --version)"
```

选择最适合你当前情况的方案，如果pnpm安装困难，直接使用npm也完全可以。