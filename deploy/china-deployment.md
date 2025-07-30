# 中国大陆服务器部署指南

## 问题说明
阿里云ECS在某些地区可能无法直接访问GitHub，需要使用替代方案。

## 解决方案

### 方案1: 使用Gitee镜像 (推荐)

#### 1.1 创建Gitee仓库镜像
1. 访问 [Gitee](https://gitee.com)
2. 登录后点击右上角 "+" -> "从GitHub/GitLab导入仓库"
3. 输入GitHub仓库地址: `https://github.com/smok56888/StoryBookMaker.git`
4. 设置Gitee仓库名称，建议保持 `StoryBookMaker`
5. 点击导入

#### 1.2 在ECS上使用Gitee仓库
```bash
# 使用Gitee镜像克隆
cd /var/www
git clone https://gitee.com/你的用户名/StoryBookMaker.git
cd StoryBookMaker

# 后续步骤与原部署流程相同
cp .env.example .env.local
nano .env.local  # 配置API密钥
./deploy/deploy.sh
```

### 方案2: 使用代理服务器

#### 2.1 配置HTTP代理 (如果你有代理服务器)
```bash
# 临时设置代理
export http_proxy=http://proxy-server:port
export https_proxy=http://proxy-server:port

# 或者为git单独设置代理
git config --global http.proxy http://proxy-server:port
git config --global https.proxy http://proxy-server:port

# 克隆仓库
git clone https://github.com/smok56888/StoryBookMaker.git
```

### 方案3: 使用GitHub镜像站点

#### 3.1 使用GitHub镜像
```bash
# 使用镜像站点 (可能不稳定)
git clone https://github.com.cnpmjs.org/smok56888/StoryBookMaker.git
# 或者
git clone https://hub.fastgit.xyz/smok56888/StoryBookMaker.git
```

### 方案4: 手动上传代码包

#### 4.1 在本地打包代码
```bash
# 在本地机器上
git clone https://github.com/smok56888/StoryBookMaker.git
cd StoryBookMaker
tar -czf storybook-maker.tar.gz --exclude='.git' --exclude='node_modules' .
```

#### 4.2 上传到服务器
```bash
# 使用scp上传
scp storybook-maker.tar.gz root@your-server-ip:/var/www/

# 在服务器上解压
ssh root@your-server-ip
cd /var/www
tar -xzf storybook-maker.tar.gz
mv StoryBookMaker storybook-maker  # 如果需要重命名
cd storybook-maker
```

### 方案5: 使用阿里云Code (推荐企业用户)

#### 5.1 创建阿里云Code仓库
1. 访问 [阿里云Code](https://code.aliyun.com)
2. 创建新项目，选择"导入项目"
3. 输入GitHub仓库地址进行导入

#### 5.2 在ECS上使用
```bash
git clone https://code.aliyun.com/你的用户名/StoryBookMaker.git
```

## 推荐的完整部署流程 (使用Gitee)

### 步骤1: 设置Gitee镜像
```bash
# 在你的本地机器上，添加Gitee远程仓库
git remote add gitee https://gitee.com/你的用户名/StoryBookMaker.git
git push gitee main
```

### 步骤2: 在ECS上部署
```bash
# 连接到ECS
ssh root@your-server-ip

# 安装必要软件
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
apt-get install -y nodejs
npm install -g pm2 pnpm

# 从Gitee克隆项目
cd /var/www
git clone https://gitee.com/你的用户名/StoryBookMaker.git
chown -R $USER:$USER StoryBookMaker
cd StoryBookMaker

# 配置环境变量
cp .env.example .env.local
nano .env.local

# 部署
./deploy/deploy.sh

# 配置Nginx
cp deploy/nginx.conf /etc/nginx/sites-available/storybook-maker
nano /etc/nginx/sites-available/storybook-maker  # 修改域名
ln -s /etc/nginx/sites-available/storybook-maker /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

### 步骤3: 后续更新流程
```bash
# 本地推送到两个仓库
git push origin main      # 推送到GitHub
git push gitee main       # 推送到Gitee

# 服务器更新
cd /var/www/StoryBookMaker
git pull origin main
./deploy/deploy.sh
```

## 网络优化建议

### 配置国内npm镜像
```bash
# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
pnpm config set registry https://registry.npmmirror.com

# 或者使用cnpm
npm install -g cnpm --registry=https://registry.npmmirror.com
```

### 配置Node.js镜像
```bash
# 使用国内Node.js镜像
export NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node/
export NVM_NODEJS_ORG_MIRROR=https://npmmirror.com/mirrors/node/
```

## 故障排除

### 如果仍然无法访问
1. 检查ECS安全组是否允许出站流量
2. 联系阿里云技术支持确认网络策略
3. 考虑使用阿里云的专有网络配置

### DNS解析问题
```bash
# 更换DNS服务器
echo "nameserver 8.8.8.8" >> /etc/resolv.conf
echo "nameserver 114.114.114.114" >> /etc/resolv.conf
```

选择最适合你情况的方案，推荐使用Gitee镜像，这是最稳定可靠的解决方案。