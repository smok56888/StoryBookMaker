#!/bin/bash

# 中文字体问题诊断脚本
# 用于排查PDF中文显示问题

echo "🔍 中文字体问题诊断报告"
echo "=========================="
echo ""

# 1. 系统信息
echo "📋 系统信息:"
echo "   操作系统: $(uname -a)"
echo "   发行版: $(cat /etc/os-release 2>/dev/null | grep PRETTY_NAME | cut -d'"' -f2 || echo '未知')"
echo ""

# 2. 字体配置检查
echo "🔤 字体配置检查:"
if [ -f "/etc/fonts/local.conf" ]; then
    echo "   ✅ 字体配置文件存在: /etc/fonts/local.conf"
    echo "   配置内容预览:"
    head -10 /etc/fonts/local.conf | sed 's/^/      /'
else
    echo "   ❌ 字体配置文件不存在"
fi
echo ""

# 3. 字体文件检查
echo "📁 字体文件检查:"
FONT_DIRS=(
    "/usr/share/fonts/chinese"
    "/usr/share/fonts/truetype/chinese"
    "/usr/share/fonts/truetype/wqy"
    "/usr/share/fonts/truetype/noto"
)

for dir in "${FONT_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        FONT_COUNT=$(find "$dir" -name "*.ttf" -o -name "*.ttc" -o -name "*.otf" | wc -l)
        echo "   ✅ $dir ($FONT_COUNT 个字体文件)"
        find "$dir" -name "*.ttf" -o -name "*.ttc" -o -name "*.otf" | head -3 | sed 's/^/      /'
    else
        echo "   ❌ $dir (目录不存在)"
    fi
done
echo ""

# 4. 字体缓存检查
echo "🔄 字体缓存检查:"
if command -v fc-cache >/dev/null 2>&1; then
    echo "   ✅ fontconfig 已安装"
    
    # 检查字体列表
    TOTAL_FONTS=$(fc-list 2>/dev/null | wc -l)
    CHINESE_FONTS=$(fc-list :lang=zh-cn 2>/dev/null | wc -l)
    
    echo "   📊 字体统计:"
    echo "      总字体数量: $TOTAL_FONTS"
    echo "      中文字体数量: $CHINESE_FONTS"
    
    if [ "$CHINESE_FONTS" -gt 0 ]; then
        echo "   ✅ 检测到中文字体:"
        fc-list :lang=zh-cn | head -5 | sed 's/^/      /'
    else
        echo "   ❌ 未检测到中文字体"
        echo "   🔍 搜索可能的中文字体:"
        fc-list | grep -i "cjk\|han\|wqy\|noto\|微\|黑" | head -5 | sed 's/^/      /' || echo "      未找到"
    fi
else
    echo "   ❌ fontconfig 未安装"
fi
echo ""

# 5. Chrome浏览器检查
echo "🌐 Chrome浏览器检查:"
CHROME_PATHS=(
    "/usr/bin/google-chrome"
    "/usr/bin/google-chrome-stable"
    "/usr/bin/chromium-browser"
    "/usr/bin/chromium"
)

CHROME_FOUND=false
for path in "${CHROME_PATHS[@]}"; do
    if [ -f "$path" ] && [ -x "$path" ]; then
        echo "   ✅ Chrome浏览器: $path"
        VERSION=$($path --version 2>/dev/null || echo "无法获取版本")
        echo "      版本: $VERSION"
        CHROME_FOUND=true
        break
    fi
done

if [ "$CHROME_FOUND" = false ]; then
    echo "   ❌ 未找到Chrome浏览器"
fi
echo ""

# 6. 项目检查
echo "📁 项目检查:"
PROJECT_PATHS=(
    "/root/StoryBookMaker"
    "/home/ecs-user/StoryBookMaker"
    "/home/ubuntu/StoryBookMaker"
    "/var/www/StoryBookMaker"
)

PROJECT_DIR=""
for path in "${PROJECT_PATHS[@]}"; do
    if [ -d "$path" ]; then
        PROJECT_DIR="$path"
        echo "   ✅ 项目目录: $path"
        
        # 检查关键文件
        if [ -f "$path/lib/pdfGenerator.ts" ]; then
            echo "      ✅ PDF生成器存在"
        else
            echo "      ❌ PDF生成器不存在"
        fi
        
        if [ -f "$path/package.json" ]; then
            echo "      ✅ package.json存在"
            PUPPETEER_VERSION=$(grep -o '"puppeteer"[^"]*"[^"]*"' "$path/package.json" | cut -d'"' -f4 2>/dev/null || echo "未找到")
            echo "      Puppeteer版本: $PUPPETEER_VERSION"
        else
            echo "      ❌ package.json不存在"
        fi
        break
    fi
done

if [ -z "$PROJECT_DIR" ]; then
    echo "   ❌ 未找到项目目录"
fi
echo ""

# 7. 测试字体渲染
if [ -n "$PROJECT_DIR" ] && [ -d "$PROJECT_DIR" ]; then
    echo "🧪 测试字体渲染:"
    cd "$PROJECT_DIR"
    
    # 创建简单的测试脚本
    cat > /tmp/quick-font-test.js << 'EOF'
const puppeteer = require('puppeteer');

async function quickTest() {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: '/usr/bin/google-chrome',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setContent('<div style="font-family: \'WenQuanYi Micro Hei\', sans-serif;">测试中文字体</div>');
    
    const pdf = await page.pdf({ format: 'A4' });
    console.log('✅ 基础PDF生成测试通过');
    console.log(`📊 PDF大小: ${pdf.length} bytes`);
    
    await browser.close();
    return true;
  } catch (error) {
    console.log('❌ 基础PDF生成测试失败:', error.message);
    if (browser) {
      try { await browser.close(); } catch (e) {}
    }
    return false;
  }
}

quickTest().then(success => process.exit(success ? 0 : 1));
EOF

    if node /tmp/quick-font-test.js 2>/dev/null; then
        echo "   ✅ Puppeteer基础测试通过"
    else
        echo "   ❌ Puppeteer基础测试失败"
    fi
    
    rm -f /tmp/quick-font-test.js
fi
echo ""

# 8. 建议的修复步骤
echo "🔧 建议的修复步骤:"
echo ""

if [ "$CHINESE_FONTS" -eq 0 ]; then
    echo "1. 安装中文字体:"
    echo "   sudo ./deploy/ultimate-chinese-font-fix.sh"
    echo ""
fi

if [ "$CHROME_FOUND" = false ]; then
    echo "2. 安装Chrome浏览器:"
    echo "   sudo ./deploy/quick-fix-pdf.sh"
    echo ""
fi

if [ -n "$PROJECT_DIR" ]; then
    echo "3. 重启应用:"
    echo "   cd $PROJECT_DIR"
    echo "   ./deploy/restart.sh"
    echo ""
fi

echo "4. 测试PDF下载:"
echo "   访问应用并尝试下载PDF"
echo ""

echo "5. 如果问题仍然存在:"
echo "   - 查看应用日志: tail -20 app.log"
echo "   - 重新运行诊断: ./deploy/diagnose-chinese-font.sh"
echo "   - 尝试完整重新部署"
echo ""

echo "=========================="
echo "🎯 诊断完成"

# 提供快速修复选项
if [ "$CHINESE_FONTS" -eq 0 ] || [ "$CHROME_FOUND" = false ]; then
    echo ""
    read -p "是否要立即运行终极字体修复? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        if [ -f "./deploy/ultimate-chinese-font-fix.sh" ]; then
            echo "🚀 开始终极字体修复..."
            chmod +x ./deploy/ultimate-chinese-font-fix.sh
            sudo ./deploy/ultimate-chinese-font-fix.sh
        else
            echo "❌ 修复脚本不存在"
        fi
    fi
fi