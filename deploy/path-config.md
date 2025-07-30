# 路径配置说明

## 项目部署路径

所有部署脚本已更新为使用以下路径配置：

### 主要路径
- **项目根目录**: `/home/ecs-user/code/StoryBookMaker`
- **代码目录**: `/home/ecs-user/code`
- **静态文件路径**: `/home/ecs-user/code/StoryBookMaker/.next/static/`

### 用户权限
- **运行用户**: `ecs-user`
- **用户主目录**: `/home/ecs-user`
- **无需sudo权限**: 项目文件操作

### 部署命令更新

#### 克隆项目
```bash
mkdir -p /home/ecs-user/code
cd /home/ecs-user/code
git clone https://github.com/smok56888/StoryBookMaker.git
cd StoryBookMaker
```

#### 日常维护
```bash
# 进入项目目录
cd /home/ecs-user/code/StoryBookMaker

# 更新代码
git pull origin main

# 重新部署
./deploy/deploy.sh
```

### Nginx配置
静态文件路径已更新为：
```nginx
location /_next/static/ {
    alias /home/ecs-user/code/StoryBookMaker/.next/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 权限说明
- 使用 `ecs-user` 用户运行，避免权限问题
- 项目文件位于用户主目录下，便于管理
- Nginx配置需要sudo权限，但项目文件不需要

### 环境变量文件
```bash
# 环境变量文件位置
/home/ecs-user/code/StoryBookMaker/.env.local
```

### PM2进程管理
```bash
# PM2配置会自动使用正确的项目路径
pm2 start npm --name "storybook-maker" -- start
```

所有相关的部署文档和脚本都已更新为使用新的路径配置。