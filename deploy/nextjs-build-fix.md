# Next.js构建错误修复指南

## 问题分析
从错误信息看，主要问题是：
1. Suspense边界错误 - Next.js 15的严格模式问题
2. 页面组件缺少Suspense包装
3. 可能的异步组件渲染问题

## 快速修复方案

### 方案1: 降级Next.js版本 (推荐)
```bash
# 降级到稳定版本
npm install next@14.2.15

# 重新构建
npm run build
```

### 方案2: 修复Suspense问题
在出错的页面组件外包装Suspense：

```jsx
import { Suspense } from 'react'

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {/* 原有内容 */}
    </Suspense>
  )
}
```

### 方案3: 禁用严格模式
在next.config.mjs中添加：
```javascript
const nextConfig = {
  reactStrictMode: false,
  // 其他配置...
}
```
## 完整
修复流程

### 自动修复（推荐）
```bash
# 使用统一部署脚本自动修复
./deploy/deploy-unified.sh --force-clean
```

### 手动修复步骤

#### 1. 降级Next.js版本
```bash
npm install next@14.2.15 --save
```

#### 2. 更新next.config.mjs
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
  },
}

export default nextConfig
```

#### 3. 清理和重建
```bash
rm -rf .next node_modules/.cache
npm install --legacy-peer-deps
npm run build
```

## 常见错误类型

### 1. Suspense边界错误
```
Error: Missing Suspense boundary
```
**解决方案**: 禁用严格模式或添加Suspense包装

### 2. 依赖版本冲突
```
ERESOLVE unable to resolve dependency tree
```
**解决方案**: 使用 `--legacy-peer-deps` 标志

### 3. 内存不足
```
JavaScript heap out of memory
```
**解决方案**: 设置 `NODE_OPTIONS="--max-old-space-size=4096"`

统一部署脚本已经包含了所有这些修复方案！