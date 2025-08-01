# 阿里云Nginx静态资源404修复指南

## 🚨 问题分析

根据你的截图，问题是：
- 请求URL: `http://60.205.4.42/_next/static/chunks/main-app-5a178572fa3e0d1f.js`
- 返回: 404 Not Found
- 这说明nginx无法找到静态文件

## 🔍 问题排查步骤

### 1. 登录阿里云服务器
```bash
ssh root@60.205.4.42
# 或者使用你的用户名
ssh your-username@60.205.4.42
```

### 2. 检查项目目录和构建文件
```bash
# 找到你的项目目录
find / -name "StoryBookMaker" -type d 2>/dev/null

# 或者检查常见位置
ls -la /root/StoryBookMaker/.next/static/
ls -la /home/*/StoryBookMaker/.next/static/
ls -la /var/www/StoryBookMaker/.next/static/
```

### 3. 检查nginx配置
```bash
# 查看nginx配置
sudo cat /etc/nginx/sites-available/storybook-maker

# 或者查看所有nginx配置
sudo nginx -T | grep -A 10 -B 10 "_next/static"
```

### 4. 检查nginx错误日志
```bash
sudo tail -f /var/log/nginx/error.log
```

## 🔧 修复方案

### 方案1: 快速修复（推荐）

#### 步骤1: 找到正确的项目路径
```bash
# 在服务器上运行
pwd
ls -la
find . -name ".next" -type d
```

#### 步骤2: 检查构建文件是否存在
```bash
# 假设项目在 /root/StoryBookMaker
ls -la /root/StoryBookMaker/.next/static/chunks/
```

如果没有构建文件，需要先构建：
```bash
cd /root/StoryBookMaker  # 替换为你的实际路径
npm run build
```

#### 步骤3: 修复nginx配置
```bash
# 编辑nginx配置
sudo nano /etc/nginx/sites-available/storybook-maker

# 找到这一行：
# alias /home/ecs-user/code/StoryBookMaker/.next/static/;

# 修改为你的实际路径，例如：
# alias /root/StoryBookMaker/.next/static/;
```

#### 步骤4: 测试并重启nginx
```bash
# 测试配置
sudo nginx -t

# 重启nginx
sudo systemctl reload nginx
```

### 方案2: 使用自动修复脚本

#### 步骤1: 上传修复脚本到服务器
```bash
# 在本地运行，上传脚本到服务器
scp deploy/fix-nginx-static.sh root@60.205.4.42:/root/
```

#### 步骤2: 在服务器上运行修复脚本
```bash
# 在服务器上运行
chmod +x /root/fix-nginx-static.sh
sudo /root/fix-nginx-static.sh --fix
```

### 方案3: 手动逐步修复

#### 步骤1: 确定项目路径
```bash
# 在服务器上运行
PROJECT_PATH=$(find /root /home -name "StoryBookMaker" -type d 2>/dev/null | head -1)
echo "项目路径: $PROJECT_PATH"
```

#### 步骤2: 检查并构建项目
```bash
cd $PROJECT_PATH
if [ ! -d ".next/static" ]; then
    echo "需要构建项目"
    npm run build
fi
```

#### 步骤3: 修复nginx配置
```bash
# 备份原配置
sudo cp /etc/nginx/sites-available/storybook-maker /etc/nginx/sites-available/storybook-maker.backup

# 修改配置
sudo sed -i "s|alias.*\.next/static/.*;|alias $PROJECT_PATH/.next/static/;|g" /etc/nginx/sites-available/storybook-maker

# 验证修改
sudo grep "alias.*\.next/static" /etc/nginx/sites-available/storybook-maker
```

#### 步骤4: 重启nginx
```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 🎯 常见路径配置

根据不同的部署方式，项目可能在以下位置：

### 1. Root用户部署
```nginx
location /_next/static/ {
    alias /root/StoryBookMaker/.next/static/;
}
```

### 2. ECS用户部署
```nginx
location /_next/static/ {
    alias /home/ecs-user/StoryBookMaker/.next/static/;
}
```

### 3. 自定义用户部署
```nginx
location /_next/static/ {
    alias /home/your-username/StoryBookMaker/.next/static/;
}
```

### 4. /var/www部署
```nginx
location /_next/static/ {
    alias /var/www/StoryBookMaker/.next/static/;
}
```

## 🔍 验证修复

### 1. 测试静态文件访问
```bash
# 在服务器上测试
curl -I http://localhost/_next/static/chunks/

# 或者测试具体文件
curl -I http://localhost/_next/static/chunks/main-app-5a178572fa3e0d1f.js
```

### 2. 检查文件权限
```bash
# 确保nginx用户有读取权限
sudo chmod -R 755 /path/to/your/project/.next/
```

### 3. 查看nginx日志
```bash
# 实时查看访问日志
sudo tail -f /var/log/nginx/storybook-maker.access.log

# 查看错误日志
sudo tail -f /var/log/nginx/error.log
```

## 🚀 一键修复命令

如果你确定项目在 `/root/StoryBookMaker`，可以直接运行：

```bash
# 在阿里云服务器上运行
PROJECT_PATH="/root/StoryBookMaker"

# 确保项目已构建
cd $PROJECT_PATH && npm run build

# 修复nginx配置
sudo sed -i "s|alias.*\.next/static/.*;|alias $PROJECT_PATH/.next/static/;|g" /etc/nginx/sites-available/storybook-maker

# 设置权限
sudo chmod -R 755 $PROJECT_PATH/.next/

# 重启nginx
sudo nginx -t && sudo systemctl reload nginx

# 测试
curl -I http://localhost/_next/static/
```

## 💡 预防措施

1. **使用绝对路径**：始终在nginx配置中使用绝对路径
2. **检查权限**：确保nginx用户有读取静态文件的权限
3. **定期备份**：修改配置前备份原文件
4. **测试配置**：每次修改后都要测试nginx配置语法

## 🆘 如果仍然有问题

请提供以下信息：
1. 项目在服务器上的实际路径
2. nginx配置文件内容
3. nginx错误日志
4. 静态文件目录的权限信息

```bash
# 收集调试信息
echo "=== 项目路径 ==="
find /root /home -name "StoryBookMaker" -type d 2>/dev/null

echo "=== Nginx配置 ==="
sudo cat /etc/nginx/sites-available/storybook-maker | grep -A 5 -B 5 "_next/static"

echo "=== 错误日志 ==="
sudo tail -20 /var/log/nginx/error.log

echo "=== 文件权限 ==="
ls -la /path/to/your/project/.next/static/
```