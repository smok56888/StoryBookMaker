# 依赖优化清理指南

## 优化概述

通过代码扫描分析，我们识别出了项目中的冗余依赖并创建了最小依赖集合。

## 依赖分析结果

### 🗑️ 已移除的冗余依赖

#### Radix UI组件（大量未使用）
```json
// 已移除以下未使用的组件：
"@radix-ui/react-accordion": "1.2.2",
"@radix-ui/react-aspect-ratio": "1.1.1", 
"@radix-ui/react-avatar": "1.1.2",
"@radix-ui/react-checkbox": "1.1.3",
"@radix-ui/react-collapsible": "1.1.2",
"@radix-ui/react-context-menu": "2.2.4",
"@radix-ui/react-dropdown-menu": "2.1.4",
"@radix-ui/react-hover-card": "1.1.4",
"@radix-ui/react-menubar": "1.1.4",
"@radix-ui/react-navigation-menu": "1.2.3",
"@radix-ui/react-popover": "1.1.4",
"@radix-ui/react-radio-group": "1.2.2",
"@radix-ui/react-scroll-area": "1.2.2",
"@radix-ui/react-select": "2.1.4",
"@radix-ui/react-separator": "1.1.1",
"@radix-ui/react-slider": "1.2.2",
"@radix-ui/react-switch": "1.1.2",
"@radix-ui/react-tabs": "1.1.2",
"@radix-ui/react-toast": "1.2.4",
"@radix-ui/react-toggle": "1.1.1",
"@radix-ui/react-toggle-group": "1.1.1",
"@radix-ui/react-tooltip": "1.1.6"
```

#### 重复的PDF生成库
```json
// 已移除以下重复的PDF库：
"@react-pdf/font": "^4.0.2",
"@react-pdf/renderer": "^4.3.0",
"@types/html-pdf": "^3.0.3",
"@types/pdfkit": "^0.17.2",
"html-pdf": "^3.0.1",
"jspdf": "^3.0.1",
"jspdf-autotable": "^5.0.2",
"pdfkit": "^0.17.1"
```

#### 其他未使用的依赖
```json
// 已移除：
"@hookform/resolvers": "^3.9.1",
"@types/ejs": "^3.1.5",
"cmdk": "1.0.4",
"ejs": "^3.1.10",
"embla-carousel-react": "8.5.1",
"input-otp": "1.4.1",
"react-day-picker": "8.10.1",
"react-hook-form": "^7.54.1",
"react-resizable-panels": "^2.1.7",
"recharts": "2.15.0",
"vaul": "^0.9.6"
```

### ✅ 保留的核心依赖

#### 必需的核心依赖
```json
{
  "next": "15.2.4",           // Next.js框架
  "react": "^19",             // React核心
  "react-dom": "^19",         // React DOM
  "typescript": "^5",         // TypeScript支持
  "tailwindcss": "^3.4.17",  // 样式框架
  "axios": "^1.10.0",         // HTTP客户端
  "zod": "^3.24.1"           // 数据验证
}
```

#### UI和样式相关
```json
{
  "@radix-ui/react-alert-dialog": "1.1.4",  // 确认对话框
  "@radix-ui/react-dialog": "1.1.4",        // 模态框
  "@radix-ui/react-label": "2.1.1",         // 标签组件
  "@radix-ui/react-progress": "1.1.1",      // 进度条
  "@radix-ui/react-slot": "1.1.1",          // 插槽组件
  "class-variance-authority": "^0.7.1",      // 样式变体
  "clsx": "^2.1.1",                         // 条件样式
  "tailwind-merge": "^2.5.5",               // Tailwind合并
  "tailwindcss-animate": "^1.0.7",          // 动画
  "lucide-react": "^0.454.0",               // 图标库
  "next-themes": "^0.4.4"                   // 主题切换
}
```

#### 功能相关
```json
{
  "date-fns": "4.1.0",        // 日期处理
  "pdf-lib": "^1.17.1",       // PDF生成（轻量级）
  "puppeteer": "^24.14.0",     // PDF生成（主要）
  "sonner": "^1.7.1"          // Toast通知
}
```

## 优化效果

### 包大小减少
- **原始依赖数量**: 60+ 个包
- **优化后依赖数量**: 25 个包
- **预估包大小减少**: ~40-50%

### 安装时间优化
- **减少网络请求**: 减少35+个包的下载
- **减少编译时间**: 移除未使用的TypeScript类型定义
- **减少node_modules大小**: 显著减少磁盘占用

## 使用优化后的依赖

### 方法1: 直接替换package.json
```bash
# 备份原始文件
cp package.json package.json.backup

# 使用优化版本
cp package.optimized.json package.json

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install
```

### 方法2: 使用优化部署脚本
```bash
# 使用中国大陆优化部署脚本
./deploy/china-optimized-deploy.sh
```

## 阿里云ECS北京机房优化

### 网络优化配置
```bash
# .npmrc 配置（已自动生成）
registry=https://registry.npmmirror.com
disturl=https://npmmirror.com/mirrors/node/
puppeteer_download_host=https://npmmirror.com/mirrors
chromedriver_cdnurl=https://npmmirror.com/mirrors/chromedriver
```

### Chrome浏览器安装优化
- 使用清华大学镜像源
- 自动处理GPG密钥问题
- 提供备用安装方案

### Puppeteer配置优化
```bash
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
export PUPPETEER_EXECUTABLE_PATH="/usr/bin/google-chrome-stable"
```

## 验证优化效果

### 检查依赖安装
```bash
# 检查安装的包数量
npm list --depth=0 | wc -l

# 检查node_modules大小
du -sh node_modules/
```

### 检查构建时间
```bash
# 记录构建时间
time npm run build
```

### 检查运行时性能
```bash
# 检查内存使用
pm2 monit

# 检查启动时间
pm2 logs storybook-maker --lines 50
```

## 回滚方案

如果优化后出现问题，可以快速回滚：

```bash
# 恢复原始依赖
cp package.json.backup package.json

# 重新安装
rm -rf node_modules package-lock.json
npm install

# 重新构建
npm run build
```

## 注意事项

1. **功能验证**: 优化后请全面测试所有功能
2. **类型检查**: 确保TypeScript编译无错误
3. **运行时测试**: 验证PDF生成、图片处理等核心功能
4. **性能监控**: 观察应用启动时间和内存使用

## 后续维护

- 定期检查是否有新的未使用依赖
- 监控包的安全更新
- 根据功能需求适当添加必要依赖
- 保持依赖版本的一致性和兼容性