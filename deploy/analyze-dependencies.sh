#!/bin/bash

# 智能依赖分析脚本
# 自动检测项目中实际使用的依赖

echo "🔍 分析项目依赖使用情况..."

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 检查是否在项目根目录
if [ ! -f "package.json" ]; then
    echo "请在项目根目录运行此脚本"
    exit 1
fi

# 创建临时文件存储分析结果
TEMP_FILE=$(mktemp)
USED_DEPS_FILE=$(mktemp)

print_info "扫描源代码中的import语句..."

# 扫描所有TypeScript/JavaScript文件中的import语句
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | \
    grep -v node_modules | \
    grep -v .next | \
    xargs grep -h "^import.*from" | \
    sed "s/.*from ['\"]//g" | \
    sed "s/['\"].*//g" | \
    grep -v "^\./" | \
    grep -v "^@/" | \
    sort | uniq > $TEMP_FILE

print_info "分析依赖使用情况..."

# 读取当前package.json中的依赖
CURRENT_DEPS=$(node -e "
const pkg = require('./package.json');
const deps = {...pkg.dependencies, ...pkg.devDependencies};
console.log(JSON.stringify(deps, null, 2));
")

echo "📋 实际使用的依赖包:"
echo "===================="

# 分析每个import的包名
while IFS= read -r import_line; do
    if [[ $import_line == @* ]]; then
        # 处理scoped包 (如 @radix-ui/react-button)
        package_name=$(echo "$import_line" | cut -d'/' -f1-2)
    else
        # 处理普通包 (如 react, next)
        package_name=$(echo "$import_line" | cut -d'/' -f1)
    fi
    
    # 检查这个包是否在当前依赖中
    if echo "$CURRENT_DEPS" | grep -q "\"$package_name\""; then
        echo "✓ $package_name"
        echo "$package_name" >> $USED_DEPS_FILE
    else
        echo "⚠ $package_name (未在package.json中找到)"
    fi
done < $TEMP_FILE

echo ""
echo "📊 统计信息:"
echo "============"

TOTAL_CURRENT=$(echo "$CURRENT_DEPS" | grep -c '".*":')
TOTAL_USED=$(sort $USED_DEPS_FILE | uniq | wc -l)

echo "当前依赖总数: $TOTAL_CURRENT"
echo "实际使用依赖: $TOTAL_USED"
echo "可能冗余依赖: $((TOTAL_CURRENT - TOTAL_USED))"

echo ""
echo "🔧 生成优化的package.json..."

# 生成优化的依赖列表
node -e "
const fs = require('fs');
const pkg = require('./package.json');
const usedDeps = fs.readFileSync('$USED_DEPS_FILE', 'utf8').split('\n').filter(Boolean);

const optimizedDeps = {};
const optimizedDevDeps = {};

// 添加实际使用的依赖
usedDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
        optimizedDeps[dep] = pkg.dependencies[dep];
    }
    if (pkg.devDependencies && pkg.devDependencies[dep]) {
        optimizedDevDeps[dep] = pkg.devDependencies[dep];
    }
});

// 始终保留的核心依赖
const coreDeps = ['react', 'react-dom', 'next', 'typescript'];
coreDeps.forEach(dep => {
    if (pkg.dependencies && pkg.dependencies[dep]) {
        optimizedDeps[dep] = pkg.dependencies[dep];
    }
    if (pkg.devDependencies && pkg.devDependencies[dep]) {
        optimizedDevDeps[dep] = pkg.devDependencies[dep];
    }
});

const optimizedPkg = {
    ...pkg,
    dependencies: optimizedDeps,
    devDependencies: optimizedDevDeps
};

fs.writeFileSync('package.analyzed.json', JSON.stringify(optimizedPkg, null, 2));
console.log('✓ 已生成 package.analyzed.json');
" 2>/dev/null

if [ -f "package.analyzed.json" ]; then
    print_status "依赖分析完成！"
    echo ""
    echo "📁 生成的文件:"
    echo "- package.analyzed.json (分析后的优化配置)"
    echo ""
    echo "🚀 使用方法:"
    echo "1. 检查 package.analyzed.json 内容"
    echo "2. 备份当前配置: cp package.json package.json.backup"
    echo "3. 使用优化配置: cp package.analyzed.json package.json"
    echo "4. 重新安装: rm -rf node_modules && npm install"
else
    echo "❌ 生成优化配置失败"
fi

# 清理临时文件
rm -f $TEMP_FILE $USED_DEPS_FILE

echo ""
echo "💡 提示:"
echo "- 某些依赖可能通过动态import使用，请仔细检查"
echo "- 构建工具和开发依赖可能不会出现在import中"
echo "- 建议在测试环境中验证优化后的配置"