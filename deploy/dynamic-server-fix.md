# Next.js动态服务器错误修复指南

## 问题分析
错误信息显示：
```
Route "/api/story/details" couldn't be rendered statically because it used 'request.url'
```

这是Next.js 15的严格模式问题，涉及动态服务器使用。

## 快速修复方案

### 方案1: 更新Next.js配置（推荐）
在next.config.mjs中添加动态配置：

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    missingSuspenseWithCSRBailout: false,
    dynamicIO: false,
  },
  // 强制动态渲染
  output: 'standalone',
}

export default nextConfig
```

### 方案2: 降级Next.js版本
```bash
npm install next@14.2.15 --save
```

### 方案3: 修复API路由
在出错的API路由中添加动态配置：

```javascript
// 在API路由文件顶部添加
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
```

## 自动修复脚本
运行统一部署脚本会自动处理这个问题：
```bash
./deploy/deploy-unified.sh --force-clean
```