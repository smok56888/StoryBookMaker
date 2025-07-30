#!/bin/bash

# Gitee镜像设置脚本
# 使用方法: ./deploy/setup-gitee.sh 你的gitee用户名

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

# 检查参数
if [ $# -eq 0 ]; then
    print_error "请提供你的Gitee用户名"
    echo "使用方法: ./deploy/setup-gitee.sh 你的gitee用户名"
    exit 1
fi

GITEE_USERNAME=$1
GITEE_REPO_URL="https://gitee.com/${GITEE_USERNAME}/StoryBookMaker.git"

echo "🔧 设置Gitee镜像仓库..."
echo "Gitee用户名: ${GITEE_USERNAME}"
echo "Gitee仓库地址: ${GITEE_REPO_URL}"
echo ""

# 检查是否已经添加了gitee远程仓库
if git remote | grep -q "gitee"; then
    print_warning "Gitee远程仓库已存在，正在更新地址..."
    git remote set-url gitee $GITEE_REPO_URL
else
    print_status "添加Gitee远程仓库..."
    git remote add gitee $GITEE_REPO_URL
fi

# 显示当前远程仓库
echo ""
echo "📋 当前远程仓库列表:"
git remote -v

echo ""
print_status "Gitee远程仓库设置完成!"

# 推送到Gitee
echo ""
read -p "是否现在推送代码到Gitee? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🚀 推送代码到Gitee..."
    git push gitee main
    print_status "代码推送完成!"
    
    echo ""
    echo "🎉 设置完成! 现在你可以:"
    echo "1. 在ECS上使用: git clone ${GITEE_REPO_URL}"
    echo "2. 本地推送到两个仓库:"
    echo "   - GitHub: git push origin main"
    echo "   - Gitee:  git push gitee main"
    echo "3. 或者同时推送: git push origin main && git push gitee main"
else
    echo ""
    echo "📝 手动推送命令:"
    echo "git push gitee main"
fi

echo ""
echo "🔧 更新ECS部署脚本中的仓库地址..."

# 更新部署脚本中的仓库地址
if [ -f "deploy/deploy.sh" ]; then
    # 备份原文件
    cp deploy/deploy.sh deploy/deploy.sh.backup
    
    # 替换仓库地址
    sed -i.bak "s|REPO_URL=\"https://github.com/smok56888/StoryBookMaker.git\"|REPO_URL=\"${GITEE_REPO_URL}\"|" deploy/deploy.sh
    
    print_status "部署脚本已更新为使用Gitee仓库"
    
    # 显示更改
    echo ""
    echo "📝 部署脚本更改:"
    echo "原地址: https://github.com/smok56888/StoryBookMaker.git"
    echo "新地址: ${GITEE_REPO_URL}"
else
    print_warning "未找到部署脚本文件"
fi

echo ""
print_status "全部设置完成! 🎉"