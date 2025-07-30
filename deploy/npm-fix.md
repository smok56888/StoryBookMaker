# NPM依赖冲突修复指南

## 问题分析
从错误信息看，主要是`date-fns`版本冲突：
- 项目中安装的是 `date-fns@4.1.0`
- `react-day-picker@8.10.1` 需要 `date-fns@^3.0.0`

## 解决方案

### 方案1: 强制解决依赖冲突 (推荐)

```bash
# 清理缓存和node_modules
rm -rf node_modules package-lock.json

# 使用--force强制安装
npm install --force

# 或者使用--legacy-peer-deps
npm install --legacy-peer-deps
```

### 方案2: 修复依赖版本

降级date-fns到兼容版本：

```bash
# 卸载当前版本
npm uninstall date-fns

# 安装兼容版本
npm install date-fns@^3.6.0

# 重新安装所有依赖
npm install
```

### 方案3: 升级react-day-picker

```bash
# 升级到支持date-fns v4的版本
npm install react-day-picker@latest

# 重新安装
npm install
```

### 方案4: 使用resolutions强制版本

在package.json中添加resolutions字段：

```json
{
  "overrides": {
    "date-fns": "^3.6.0"
  }
}
```

## 快速修复命令

在ECS上执行以下命令：

```bash
# 进入项目目录
cd /code/StoryBookMaker

# 清理环境
rm -rf node_modules package-lock.json

# 方法1: 强制安装
npm install --legacy-peer-deps

# 如果方法1失败，尝试方法2
npm install --force

# 构建项目
npm run build --legacy-peer-deps
```

## 生产环境优化

### 1. 创建.npmrc文件
```bash
echo "legacy-peer-deps=true" > .npmrc
echo "registry=https://registry.npmmirror.com" >> .npmrc
```

### 2. 设置环境变量
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
export NPM_CONFIG_LEGACY_PEER_DEPS=true
```

### 3. 修改构建命令
```bash
# 使用更宽松的依赖解析
npm run build --legacy-peer-deps
```

## 如果仍然失败

### 降级到稳定版本组合

创建一个修复版本的package.json：

```json
{
  "dependencies": {
    "date-fns": "^3.6.0",
    "react-day-picker": "8.10.1"
  }
}
```

### 或者移除有问题的依赖

如果项目中没有使用日期选择器，可以临时移除：

```bash
npm uninstall react-day-picker date-fns
npm install
npm run build
```

## 内存不足问题

如果遇到内存不足：

```bash
# 增加Node.js内存限制
export NODE_OPTIONS="--max-old-space-size=4096"

# 或者在构建时指定
node --max-old-space-size=4096 node_modules/.bin/next build
```

## 推荐的完整修复流程

```bash
# 1. 清理环境
cd /code/StoryBookMaker
rm -rf node_modules package-lock.json

# 2. 创建.npmrc配置
echo "legacy-peer-deps=true" > .npmrc
echo "registry=https://registry.npmmirror.com" >> .npmrc

# 3. 设置环境变量
export NODE_OPTIONS="--max-old-space-size=4096"

# 4. 安装依赖
npm install --legacy-peer-deps

# 5. 构建项目
npm run build

# 6. 启动服务
pm2 start npm --name "storybook-maker" -- start
```

选择最适合你当前情况的方案执行。