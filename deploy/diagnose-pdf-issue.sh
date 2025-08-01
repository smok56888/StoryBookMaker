#!/bin/bash

# PDF问题诊断脚本
# 用于收集系统信息和诊断PDF下载问题

echo "🔍 PDF下载问题诊断报告"
echo "=========================="
echo ""

# 1. 系统信息
echo "📋 系统信息:"
echo "   操作系统: $(uname -a)"
echo "   发行版: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2 || echo '未知')"
echo "   内存: $(free -h | grep Mem | awk '{print $2}')"
echo "   磁盘: $(df -h / | tail -1 | awk '{print $4}' | sed 's/G/ GB/')"
echo ""

# 2. Node.js和npm信息
echo "📦 Node.js环境:"
if command -v node >/dev/null 2>&1; then
    echo "   Node.js版本: $(node --version)"
else
    echo "   ❌ Node.js未安装"
fi

if command -v npm >/dev/null 2>&1; then
    echo "   npm版本: $(npm --version)"
else
    echo "   ❌ npm未安装"
fi
echo ""

# 3. Chrome浏览器检查
echo "🌐 Chrome浏览器检查:"
CHROME_PATHS=(
    "/usr/bin/google-chrome"
    "/usr/bin/google-chrome-stable"
    "/usr/bin/chromium-browser"
    "/usr/bin/chromium"
    "/opt/google/chrome/chrome"
)

CHROME_FOUND=false
for path in "${CHROME_PATHS[@]}"; do
    if [ -f "$path" ]; then
        echo "   ✅ 找到Chrome: $path"
        if [ -x "$path" ]; then
            VERSION=$($path --version 2>/dev/null || echo "无法获取版本")
            echo "      版本: $VERSION"
            echo "      权限: 可执行"
        else
            echo "      ❌ 权限: 不可执行"
        fi
        CHROME_FOUND=true
    fi
done

if [ "$CHROME_FOUND" = false ]; then
    echo "   ❌ 未找到Chrome浏览器"
fi
echo ""

# 4. 项目目录检查
echo "📁 项目目录检查:"
PROJECT_PATHS=(
    "/root/StoryBookMaker"
    "/home/ecs-user/StoryBookMaker"
    "/home/ubuntu/StoryBookMaker"
    "/var/www/StoryBookMaker"
)

PROJECT_FOUND=false
for path in "${PROJECT_PATHS[@]}"; do
    if [ -d "$path" ]; then
        echo "   ✅ 找到项目: $path"
        PROJECT_DIR="$path"
        PROJECT_FOUND=true
        
        # 检查关键文件
        if [ -f "$path/package.json" ]; then
            echo "      ✅ package.json存在"
        else
            echo "      ❌ package.json不存在"
        fi
        
        if [ -d "$path/node_modules" ]; then
            echo "      ✅ node_modules存在"
        else
            echo "      ❌ node_modules不存在"
        fi
        
        if [ -d "$path/.next" ]; then
            echo "      ✅ .next构建目录存在"
        else
            echo "      ❌ .next构建目录不存在"
        fi
        
        break
    fi
done

if [ "$PROJECT_FOUND" = false ]; then
    echo "   ❌ 未找到项目目录"
    # 尝试搜索
    SEARCH_RESULT=$(find /root /home /var/www -name "StoryBookMaker" -type d 2>/dev/null | head -1)
    if [ -n "$SEARCH_RESULT" ]; then
        echo "   🔍 搜索到项目: $SEARCH_RESULT"
        PROJECT_DIR="$SEARCH_RESULT"
        PROJECT_FOUND=true
    fi
fi
echo ""

# 5. Puppeteer检查
if [ "$PROJECT_FOUND" = true ]; then
    echo "🤖 Puppeteer检查:"
    cd "$PROJECT_DIR"
    
    if [ -f "package.json" ]; then
        PUPPETEER_VERSION=$(node -e "try { console.log(require('./package.json').dependencies.puppeteer || 'not found'); } catch(e) { console.log('error'); }" 2>/dev/null)
        echo "   package.json中的版本: $PUPPETEER_VERSION"
        
        if [ -d "node_modules/puppeteer" ]; then
            echo "   ✅ Puppeteer模块已安装"
            INSTALLED_VERSION=$(node -e "try { console.log(require('./node_modules/puppeteer/package.json').version); } catch(e) { console.log('error'); }" 2>/dev/null)
            echo "   实际安装版本: $INSTALLED_VERSION"
        else
            echo "   ❌ Puppeteer模块未安装"
        fi
    fi
    echo ""
fi

# 6. 系统依赖检查
echo "🔧 系统依赖检查:"
REQUIRED_LIBS=(
    "libX11.so"
    "libXcomposite.so"
    "libXdamage.so"
    "libXext.so"
    "libXfixes.so"
    "libXrandr.so"
    "libXss.so"
    "libXtst.so"
    "libnss3.so"
    "libgtk-3.so"
    "libasound.so"
)

for lib in "${REQUIRED_LIBS[@]}"; do
    if ldconfig -p | grep -q "$lib"; then
        echo "   ✅ $lib"
    else
        echo "   ❌ $lib (缺失)"
    fi
done
echo ""

# 7. 进程检查
echo "🔄 进程检查:"
if pgrep -f "node.*next" >/dev/null; then
    echo "   ✅ Next.js应用正在运行"
    echo "   进程信息:"
    ps aux | grep -E "node.*next" | grep -v grep | while read line; do
        echo "      $line"
    done
else
    echo "   ❌ Next.js应用未运行"
fi
echo ""

# 8. 端口检查
echo "🌐 端口检查:"
if netstat -tlnp 2>/dev/null | grep -q ":3000"; then
    echo "   ✅ 端口3000正在监听"
    netstat -tlnp 2>/dev/null | grep ":3000"
else
    echo "   ❌ 端口3000未监听"
fi
echo ""

# 9. 日志检查
echo "📝 最近的错误日志:"
if [ "$PROJECT_FOUND" = true ] && [ -f "$PROJECT_DIR/app.log" ]; then
    echo "   应用日志 (最后20行):"
    tail -20 "$PROJECT_DIR/app.log" | sed 's/^/      /'
elif [ -f "/var/log/messages" ]; then
    echo "   系统日志中的Chrome/Puppeteer错误:"
    grep -i "chrome\|puppeteer" /var/log/messages 2>/dev/null | tail -10 | sed 's/^/      /' || echo "      无相关错误"
else
    echo "   ❌ 未找到日志文件"
fi
echo ""

# 10. 建议的修复步骤
echo "🔧 建议的修复步骤:"
echo ""

if [ "$CHROME_FOUND" = false ]; then
    echo "1. 安装Chrome浏览器:"
    echo "   sudo ./deploy/quick-fix-pdf.sh"
    echo ""
fi

if [ "$PROJECT_FOUND" = true ]; then
    if [ ! -d "$PROJECT_DIR/node_modules/puppeteer" ]; then
        echo "2. 重新安装Puppeteer:"
        echo "   cd $PROJECT_DIR"
        echo "   npm install puppeteer --force"
        echo ""
    fi
    
    if [ ! -d "$PROJECT_DIR/.next" ]; then
        echo "3. 重新构建项目:"
        echo "   cd $PROJECT_DIR"
        echo "   npm run build"
        echo ""
    fi
    
    echo "4. 重启应用:"
    echo "   cd $PROJECT_DIR"
    echo "   ./deploy/restart.sh"
    echo ""
else
    echo "2. 找到并进入项目目录，然后重新部署"
    echo ""
fi

echo "5. 测试PDF功能:"
echo "   访问应用并尝试下载PDF"
echo ""

echo "6. 如果问题仍然存在，请运行完整修复:"
echo "   sudo ./deploy/fix-chrome-puppeteer.sh"
echo ""

echo "=========================="
echo "🎯 诊断完成"

# 如果找到项目目录，提供快速修复选项
if [ "$PROJECT_FOUND" = true ]; then
    echo ""
    read -p "是否要立即运行快速修复? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 开始快速修复..."
        if [ -f "./deploy/quick-fix-pdf.sh" ]; then
            chmod +x ./deploy/quick-fix-pdf.sh
            sudo ./deploy/quick-fix-pdf.sh
        else
            echo "❌ 修复脚本不存在，请手动执行修复步骤"
        fi
    fi
fi