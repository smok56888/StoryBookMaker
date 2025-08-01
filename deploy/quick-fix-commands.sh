#!/bin/bash

# 阿里云服务器Nginx静态资源快速修复命令集合
# 请在阿里云服务器上运行这些命令

echo "🔧 StoryBookMaker Nginx静态资源快速修复"
echo "======================================="

# 1. 查找项目路径
echo "1. 查找项目路径..."
PROJECT_PATHS=$(find /root /home -name "StoryBookMaker" -type d 2>/dev/null)
echo "找到的项目路径:"
echo "$PROJECT_PATHS"

if [ -z "$PROJECT_PATHS" ]; then
    echo "❌ 未找到StoryBookMaker项目目录"
    echo "请手动指定项目路径:"
    echo "export PROJECT_PATH=/your/actual/path/StoryBookMaker"
    exit 1
fi

# 使用第一个找到的路径
PROJECT_PATH=$(echo "$PROJECT_PATHS" | head -1)
echo "✅ 使用项目路径: $PROJECT_PATH"

# 2. 检查构建文件
echo ""
echo "2. 检查构建文件..."
if [ -d "$PROJECT_PATH/.next/static" ]; then
    echo "✅ 构建文件存在"
    echo "静态文件数量: $(find $PROJECT_PATH/.next/static -type f | wc -l)"
else
    echo "❌ 构建文件不存在，开始构建..."
    cd "$PROJECT_PATH"
    npm run build
    if [ $? -eq 0 ]; then
        echo "✅ 构建完成"
    else
        echo "❌ 构建失败"
        exit 1
    fi
fi

# 3. 检查nginx配置
echo ""
echo "3. 检查nginx配置..."
NGINX_CONFIG="/etc/nginx/sites-available/storybook-maker"
if [ -f "$NGINX_CONFIG" ]; then
    echo "✅ nginx配置文件存在"
    CURRENT_ALIAS=$(grep "alias.*\.next/static" "$NGINX_CONFIG" | sed 's/.*alias \(.*\);/\1/')
    echo "当前配置路径: $CURRENT_ALIAS"
    echo "正确路径应为: $PROJECT_PATH/.next/static/"
    
    if [ "$CURRENT_ALIAS" != "$PROJECT_PATH/.next/static/" ]; then
        echo "❌ 路径配置错误，需要修复"
        
        # 4. 修复nginx配置
        echo ""
        echo "4. 修复nginx配置..."
        
        # 备份原配置
        cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
        echo "✅ 已备份原配置"
        
        # 修改配置
        sed -i "s|alias.*\.next/static/.*;|alias $PROJECT_PATH/.next/static/;|g" "$NGINX_CONFIG"
        echo "✅ 配置已修复"
        
        # 验证修改
        NEW_ALIAS=$(grep "alias.*\.next/static" "$NGINX_CONFIG" | sed 's/.*alias \(.*\);/\1/')
        echo "新配置路径: $NEW_ALIAS"
    else
        echo "✅ 路径配置正确"
    fi
else
    echo "❌ nginx配置文件不存在: $NGINX_CONFIG"
    exit 1
fi

# 5. 设置文件权限
echo ""
echo "5. 设置文件权限..."
chmod -R 755 "$PROJECT_PATH/.next/"
echo "✅ 权限设置完成"

# 6. 测试nginx配置
echo ""
echo "6. 测试nginx配置..."
if nginx -t; then
    echo "✅ nginx配置语法正确"
else
    echo "❌ nginx配置语法错误"
    exit 1
fi

# 7. 重启nginx
echo ""
echo "7. 重启nginx..."
systemctl reload nginx
if [ $? -eq 0 ]; then
    echo "✅ nginx重启成功"
else
    echo "❌ nginx重启失败"
    exit 1
fi

# 8. 测试静态文件访问
echo ""
echo "8. 测试静态文件访问..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/_next/static/")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "403" ]; then
    echo "✅ 静态文件路径可访问 (HTTP $HTTP_CODE)"
else
    echo "❌ 静态文件路径不可访问 (HTTP $HTTP_CODE)"
fi

# 9. 显示完成信息
echo ""
echo "🎉 修复完成！"
echo "==============="
echo "项目路径: $PROJECT_PATH"
echo "静态文件路径: $PROJECT_PATH/.next/static/"
echo "nginx配置: $NGINX_CONFIG"
echo ""
echo "请测试访问你的网站，静态资源应该正常加载了。"
echo ""
echo "如果仍有问题，请检查："
echo "1. nginx错误日志: tail -f /var/log/nginx/error.log"
echo "2. 访问日志: tail -f /var/log/nginx/storybook-maker.access.log"
echo "3. 测试具体文件: curl -I http://localhost/_next/static/chunks/"