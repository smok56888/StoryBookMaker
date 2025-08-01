#!/bin/bash

# 检查字体文件实际存在情况的脚本

echo "🔍 检查服务器上的字体文件实际情况"
echo "======================================"
echo ""

# 1. 检查字体目录
echo "📁 检查字体目录:"
FONT_DIRS=(
    "/usr/share/fonts"
    "/usr/share/fonts/chinese"
    "/usr/share/fonts/truetype"
    "/usr/share/fonts/truetype/wqy"
    "/usr/share/fonts/truetype/noto"
    "/usr/local/share/fonts"
    "/root/.fonts"
)

for dir in "${FONT_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        FONT_COUNT=$(find "$dir" -name "*.ttf" -o -name "*.ttc" -o -name "*.otf" 2>/dev/null | wc -l)
        echo "   ✅ $dir (存在, $FONT_COUNT 个字体文件)"
        
        # 显示前几个字体文件
        if [ $FONT_COUNT -gt 0 ]; then
            echo "      字体文件:"
            find "$dir" -name "*.ttf" -o -name "*.ttc" -o -name "*.otf" 2>/dev/null | head -5 | while read font; do
                SIZE=$(ls -lh "$font" | awk '{print $5}')
                echo "         $(basename "$font") ($SIZE)"
            done
        fi
    else
        echo "   ❌ $dir (不存在)"
    fi
    echo ""
done

# 2. 搜索所有中文相关字体
echo "🔤 搜索中文相关字体文件:"
echo "   搜索包含 'cjk', 'han', 'wqy', 'noto', '微', '黑' 的字体文件..."

CHINESE_FONTS=$(find /usr -name "*.ttf" -o -name "*.ttc" -o -name "*.otf" 2>/dev/null | xargs grep -l "cjk\|han\|wqy\|noto\|微\|黑" 2>/dev/null || find /usr -name "*cjk*" -o -name "*han*" -o -name "*wqy*" -o -name "*noto*" 2>/dev/null | grep -E "\.(ttf|ttc|otf)$")

if [ -n "$CHINESE_FONTS" ]; then
    echo "   ✅ 找到中文字体文件:"
    echo "$CHINESE_FONTS" | while read font; do
        if [ -f "$font" ]; then
            SIZE=$(ls -lh "$font" | awk '{print $5}')
            echo "      $font ($SIZE)"
        fi
    done
else
    echo "   ❌ 未找到中文字体文件"
fi
echo ""

# 3. 检查fontconfig状态
echo "⚙️ 检查fontconfig状态:"
if command -v fc-cache >/dev/null 2>&1; then
    echo "   ✅ fontconfig 已安装"
    
    # 检查字体缓存
    echo "   🔄 字体缓存信息:"
    fc-cache --version
    
    # 列出所有字体
    TOTAL_FONTS=$(fc-list 2>/dev/null | wc -l)
    echo "   📊 fc-list 显示总字体数: $TOTAL_FONTS"
    
    # 检查中文字体
    CHINESE_FC=$(fc-list :lang=zh-cn 2>/dev/null | wc -l)
    echo "   📊 fc-list 显示中文字体数: $CHINESE_FC"
    
    if [ $CHINESE_FC -gt 0 ]; then
        echo "   ✅ fontconfig 识别的中文字体:"
        fc-list :lang=zh-cn | head -5 | sed 's/^/      /'
    else
        echo "   ❌ fontconfig 未识别到中文字体"
        echo "   🔍 尝试搜索可能的中文字体:"
        fc-list | grep -i "cjk\|han\|wqy\|noto\|微\|黑" | head -5 | sed 's/^/      /' || echo "      未找到"
    fi
else
    echo "   ❌ fontconfig 未安装"
fi
echo ""

# 4. 检查字体配置文件
echo "📄 检查字体配置文件:"
CONFIG_FILES=(
    "/etc/fonts/local.conf"
    "/etc/fonts/fonts.conf"
    "/etc/fonts/conf.d"
)

for config in "${CONFIG_FILES[@]}"; do
    if [ -f "$config" ] || [ -d "$config" ]; then
        echo "   ✅ $config (存在)"
        if [ -f "$config" ]; then
            echo "      文件大小: $(ls -lh "$config" | awk '{print $5}')"
        fi
    else
        echo "   ❌ $config (不存在)"
    fi
done
echo ""

# 5. 手动下载测试字体
echo "📥 尝试手动下载测试字体:"
cd /tmp
rm -f test-font.* 2>/dev/null

# 尝试下载一个小的中文字体进行测试
echo "   下载文泉驿微米黑字体进行测试..."
if wget -O test-font.tar.gz "https://downloads.sourceforge.net/wqy/wqy-microhei-0.2.0-beta.tar.gz" --timeout=30 --tries=3; then
    echo "   ✅ 字体下载成功"
    
    # 解压并检查
    tar -xzf test-font.tar.gz 2>/dev/null
    EXTRACTED_FONTS=$(find . -name "*.ttc" -o -name "*.ttf" | head -3)
    if [ -n "$EXTRACTED_FONTS" ]; then
        echo "   ✅ 字体解压成功:"
        echo "$EXTRACTED_FONTS" | while read font; do
            SIZE=$(ls -lh "$font" | awk '{print $5}')
            echo "      $(basename "$font") ($SIZE)"
        done
        
        # 尝试安装到系统
        echo "   📁 尝试安装到系统字体目录..."
        sudo mkdir -p /usr/share/fonts/chinese
        echo "$EXTRACTED_FONTS" | while read font; do
            sudo cp "$font" /usr/share/fonts/chinese/ 2>/dev/null && echo "      ✅ 已复制: $(basename "$font")"
        done
        
        # 更新字体缓存
        echo "   🔄 更新字体缓存..."
        sudo fc-cache -fv >/dev/null 2>&1
        
        # 再次检查
        NEW_CHINESE_COUNT=$(fc-list :lang=zh-cn 2>/dev/null | wc -l)
        echo "   📊 更新后中文字体数: $NEW_CHINESE_COUNT"
        
    else
        echo "   ❌ 字体解压失败"
    fi
    
    # 清理
    rm -f test-font.tar.gz
    rm -rf wqy-microhei-*
else
    echo "   ❌ 字体下载失败"
    echo "   🔍 网络连接测试:"
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        echo "      ✅ 网络连接正常"
    else
        echo "      ❌ 网络连接异常"
    fi
fi
echo ""

# 6. 检查系统包管理器中的字体包
echo "📦 检查系统字体包:"
if command -v apt-get >/dev/null 2>&1; then
    echo "   系统: Ubuntu/Debian"
    echo "   可用的中文字体包:"
    apt-cache search fonts | grep -i "cjk\|chinese\|wqy\|noto" | head -5 | sed 's/^/      /'
    
    echo "   已安装的字体包:"
    dpkg -l | grep -i "fonts.*\(cjk\|chinese\|wqy\|noto\)" | sed 's/^/      /'
    
elif command -v yum >/dev/null 2>&1; then
    echo "   系统: CentOS/RHEL"
    echo "   可用的中文字体包:"
    yum search fonts 2>/dev/null | grep -i "cjk\|chinese\|wqy\|noto" | head -5 | sed 's/^/      /'
    
    echo "   已安装的字体包:"
    yum list installed 2>/dev/null | grep -i "fonts.*\(cjk\|chinese\|wqy\|noto\)" | sed 's/^/      /'
fi
echo ""

# 7. 总结和建议
echo "📋 检查总结:"
TOTAL_SYSTEM_FONTS=$(find /usr -name "*.ttf" -o -name "*.ttc" -o -name "*.otf" 2>/dev/null | wc -l)
CHINESE_SYSTEM_FONTS=$(find /usr -name "*cjk*" -o -name "*han*" -o -name "*wqy*" -o -name "*noto*" 2>/dev/null | grep -E "\.(ttf|ttc|otf)$" | wc -l)
FC_CHINESE_FONTS=$(fc-list :lang=zh-cn 2>/dev/null | wc -l)

echo "   系统字体文件总数: $TOTAL_SYSTEM_FONTS"
echo "   中文字体文件数: $CHINESE_SYSTEM_FONTS"
echo "   fontconfig识别的中文字体数: $FC_CHINESE_FONTS"
echo ""

if [ $CHINESE_SYSTEM_FONTS -eq 0 ]; then
    echo "🔧 建议的修复步骤:"
    echo "1. 系统中没有中文字体文件，需要手动安装"
    echo "2. 运行以下命令安装字体包:"
    if command -v apt-get >/dev/null 2>&1; then
        echo "   sudo apt-get update"
        echo "   sudo apt-get install fonts-wqy-microhei fonts-noto-cjk"
    elif command -v yum >/dev/null 2>&1; then
        echo "   sudo yum install wqy-microhei-fonts google-noto-cjk-fonts"
    fi
    echo "3. 手动下载字体文件到 /usr/share/fonts/chinese/"
    echo "4. 运行 sudo fc-cache -fv 更新字体缓存"
elif [ $FC_CHINESE_FONTS -eq 0 ]; then
    echo "🔧 字体文件存在但fontconfig未识别:"
    echo "1. 检查字体文件权限: sudo chmod 644 /usr/share/fonts/chinese/*"
    echo "2. 强制更新字体缓存: sudo fc-cache -f -v"
    echo "3. 检查字体配置文件: /etc/fonts/local.conf"
else
    echo "✅ 字体文件和配置看起来正常"
    echo "   问题可能在于PDF生成器的字体配置"
fi

echo ""
echo "======================================"
echo "🎯 检查完成"