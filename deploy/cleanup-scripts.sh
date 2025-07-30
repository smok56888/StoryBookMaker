#!/bin/bash

# 清理多余的部署脚本
# 保留核心文档和统一部署脚本

echo "🧹 清理多余的部署脚本..."

# 要删除的脚本文件
SCRIPTS_TO_REMOVE=(
    "deploy/fix-puppeteer.sh"
    "deploy/quick-build-fix.sh"
    "deploy/install-chrome-china.sh"
    "deploy/setup-gitee.sh"
)

# 删除多余脚本
for script in "${SCRIPTS_TO_REMOVE[@]}"; do
    if [ -f "$script" ]; then
        rm "$script"
        echo "✓ 已删除: $script"
    fi
done

# 保留的文件列表
echo ""
echo "📁 保留的部署文件:"
echo "核心脚本:"
echo "  - deploy/deploy-unified.sh    # 统一部署脚本（推荐使用）"
echo "  - deploy/deploy.sh           # 原始部署脚本"
echo "  - deploy/nginx.conf          # Nginx配置文件"
echo ""
echo "文档指南:"
echo "  - deploy/quick-start.md      # 快速开始指南"
echo "  - deploy/deploy.md           # 详细部署文档"
echo "  - deploy/china-deployment.md # 中国大陆部署指南"
echo "  - deploy/path-config.md      # 路径配置说明"
echo ""
echo "问题修复指南:"
echo "  - deploy/npm-fix.md          # npm问题修复"
echo "  - deploy/puppeteer-fix.md    # Puppeteer问题修复"
echo "  - deploy/chrome-alternatives.md # Chrome替代方案"
echo "  - deploy/pdf-alternatives.md # PDF生成替代方案"
echo "  - deploy/ecs-setup-fix.md    # ECS环境修复"
echo "  - deploy/gitee-import-guide.md # Gitee导入指南"

echo ""
echo "🎯 推荐使用:"
echo "  ./deploy/deploy-unified.sh   # 一键解决所有部署问题"

echo ""
echo "✅ 脚本清理完成！"