# 绘本图片一致性保障系统使用指南

## 概述

本指南详细介绍如何使用新的图片一致性保障系统，确保绘本中所有插图的人物和物品形象保持高度一致。

## 系统架构

### 核心组件
1. **核心形象提取器** (`extractCoreElements`) - 分析故事内容，建立视觉标准
2. **一致性检查器** (`consistencyChecker`) - 验证图片描述的一致性
3. **智能提示词生成器** (`generateSingleImagePrompt`) - 生成符合标准的提示词
4. **质量保证系统** - 多轮验证和优化机制

### 工作流程
```
故事内容 → 核心形象提取 → 结构化标准 → 提示词生成 → 一致性检查 → 优化建议 → 最终输出
```

## 快速开始

### 1. 基础使用

```typescript
import { generateImagePrompt } from '@/lib/arkApi'

// 生成完整的插图提示词（自动包含一致性保障）
const result = await generateImagePrompt({
  storyId: 'your-story-id',
  characters: [
    {
      name: '小明',
      analysis: '5岁男孩，圆脸，黑色短发，大眼睛，穿红色T恤和蓝色短裤'
    }
  ],
  paragraphs: ['故事段落1', '故事段落2', ...],
  title: '故事标题'
})

// 获取核心形象标准
const coreElements = result.data.coreElements
```

### 2. 单页生成（推荐）

```typescript
import { generateSinglePagePrompt } from '@/lib/arkApi'

// 为特定页面生成高质量提示词
const pageResult = await generateSinglePagePrompt({
  pageType: 'content', // 'cover' | 'content' | 'ending'
  pageIndex: 1,
  content: '小明在公园里玩耍...',
  title: '故事标题',
  coreElements: coreElements, // 从上一步获取
  previousImages: [] // 可选：前面已生成的图片描述
})
```

### 3. 一致性检查

```typescript
import { parseCoreElements, checkImageConsistency } from '@/lib/consistencyChecker'

// 解析核心标准
const standard = parseCoreElements(coreElements)

// 检查图片描述的一致性
const checkResult = checkImageConsistency(
  imageDescription,
  standard,
  'content'
)

console.log('一致性评分:', checkResult.score)
console.log('是否通过:', checkResult.isConsistent)
```

## 详细功能说明

### 核心形象档案系统

#### 人物档案结构
```typescript
{
  name: '角色名',
  appearance: {
    hair: '黑色短发，略微卷曲，有自然光泽',
    eyes: '大而明亮的黑色眼睛，眼形圆润',
    face: '圆润的娃娃脸，肉嘟嘟的脸颊',
    skin: '健康的小麦色肌肤',
    height: '标准5岁儿童身高比例'
  },
  clothing: {
    top: '鲜红色圆领T恤，胸前有小熊图案',
    bottom: '深蓝色休闲短裤，长度到膝盖',
    shoes: '白色运动鞋，有蓝色条纹装饰',
    accessories: '无特殊配饰'
  }
}
```

#### 物品档案结构
```typescript
{
  name: '物品名',
  shape: '圆形/方形/不规则形状的具体描述',
  size: '相对于角色的大小比例',
  color: '主色调和辅助色的具体描述',
  material: '材质质感（木质/金属/布料等）',
  details: '装饰元素、纹理、特殊标识'
}
```

### 一致性检查规则

#### 检查维度权重
- **角色外观** (40%): 发型、眼睛、脸型、肤色
- **服装配饰** (25%): 上衣、下装、鞋子、配饰
- **物品特征** (20%): 形状、颜色、材质、细节
- **色彩方案** (10%): 主色调、辅助色、饱和度
- **绘画风格** (5%): 线条、着色、阴影、质感

#### 评分标准
- **90-100分**: 完全一致，可直接使用
- **80-89分**: 基本一致，建议微调
- **70-79分**: 部分一致，需要优化
- **60-69分**: 一致性较差，建议重新生成
- **60分以下**: 严重不一致，必须重新生成

### 提示词优化策略

#### 分层描述法
```typescript
// 第一层：核心形象标准
"严格按照以下标准描述角色：小明 - 5岁男孩，圆脸，黑色短发..."

// 第二层：场景适配
"在公园场景中，小明正在..."

// 第三层：情感表达
"小明的表情应该体现出好奇和兴奋..."

// 第四层：技术规格
"采用水彩风格，柔和光线，儿童友好的构图..."
```

#### 关键词强化
```typescript
// 使用重复强调确保一致性
const enhancedPrompt = `
${basePrompt}

【重要提醒】
- 小明必须是：圆脸、黑色短发、红色T恤、蓝色短裤
- 绝对不能改变：角色的基本外观特征
- 必须保持：与前面图片的视觉连贯性
`
```

## 最佳实践

### 1. 角色设计原则

#### 特征明确化
```typescript
// ❌ 模糊描述
"可爱的小女孩"

// ✅ 具体描述  
"4岁女孩，圆脸，齐刘海黑色长发扎双马尾，大眼睛，穿粉色连衣裙配白色小皮鞋"
```

#### 服装标准化
```typescript
// ❌ 变化的服装
"小明穿着不同颜色的衣服"

// ✅ 固定的服装
"小明始终穿红色T恤和蓝色短裤，这是他的标志性装扮"
```

### 2. 物品设计原则

#### 特征固定化
```typescript
// ❌ 模糊的物品
"一个球"

// ✅ 具体的物品
"红色足球，黑白相间的经典图案，直径约20厘米，表面有轻微磨损痕迹"
```

#### 比例一致化
```typescript
// 确保物品在不同场景中的相对大小保持一致
"足球的大小约为小明头部的1.2倍"
```

### 3. 环境设计原则

#### 场景标准化
```typescript
// 建立场景模板
const parkScene = {
  layout: "开阔的草地，远处有大树和长椅",
  ground: "绿色草坪，有小花点缀",
  lighting: "温暖的自然光，从左上方照射",
  atmosphere: "清新明亮，适合儿童活动"
}
```

## 常见问题解决

### 1. 角色不一致问题

#### 问题：角色在不同页面看起来像不同的人
```typescript
// 解决方案：强化角色特征描述
const characterPrompt = `
小明的固定特征（每页必须包含）：
- 脸型：圆润的娃娃脸，肉嘟嘟的脸颊
- 发型：黑色短发，略微蓬松，自然分缝
- 眼睛：大而明亮的黑色眼睛，眼形圆润
- 服装：鲜红色圆领T恤 + 深蓝色休闲短裤
- 身材：标准5岁男童体型，活泼好动
`
```

### 2. 色彩不统一问题

#### 问题：整体色调在不同页面差异很大
```typescript
// 解决方案：建立色彩标准
const colorStandard = {
  primary: ['#FF4444', '#4444FF', '#44FF44'], // 红、蓝、绿
  secondary: ['#FFFF44', '#FF44FF'], // 黄、粉
  forbidden: ['#000000', '#666666'], // 避免使用的暗色
  mood: '明亮温暖，充满活力'
}
```

### 3. 物品变形问题

#### 问题：同一物品在不同页面形状差异很大
```typescript
// 解决方案：详细的物品规格
const itemSpec = `
红色足球规格：
- 形状：标准球形，略有弹性变形
- 颜色：鲜红色主体，黑白相间的五边形图案
- 大小：直径约20厘米（相当于小明头部的1.2倍）
- 材质：皮革质感，表面有细微纹理
- 状态：轻微使用痕迹，但整体完好
`
```

## 性能优化建议

### 1. 缓存策略
```typescript
// 缓存核心形象标准，避免重复提取
const cacheKey = `core_elements_${storyId}`
let coreElements = cache.get(cacheKey)
if (!coreElements) {
  coreElements = await extractCoreElements(params)
  cache.set(cacheKey, coreElements, 3600) // 缓存1小时
}
```

### 2. 批量处理
```typescript
// 批量生成多页提示词
const batchPrompts = await Promise.all(
  paragraphs.map((content, index) => 
    generateSinglePagePrompt({
      pageType: 'content',
      pageIndex: index + 1,
      content,
      title,
      coreElements
    })
  )
)
```

### 3. 渐进式优化
```typescript
// 基于前面页面的成功经验优化后续页面
const previousSuccessfulImages = []
for (let i = 0; i < paragraphs.length; i++) {
  const result = await generateSinglePagePrompt({
    // ... 其他参数
    previousImages: previousSuccessfulImages
  })
  
  if (result.success) {
    previousSuccessfulImages.push(result.data.prompt)
  }
}
```

## 测试和验证

### 1. 运行测试
```bash
# 运行一致性系统测试
node test/consistency_test.js

# 运行完整的提示词测试
node test_prompt_optimization.js
```

### 2. 手动验证
```typescript
// 检查生成结果的质量
const qualityCheck = {
  characterConsistency: checkResult.score >= 80,
  colorHarmony: hasRequiredColors(description),
  styleUnity: checkDrawingStyle(description),
  emotionalTone: checkEmotionalConsistency(description)
}
```

## 更新日志

### v2.0.0 (当前版本)
- ✅ 新增核心形象档案系统
- ✅ 实现实时一致性检查
- ✅ 支持单页提示词生成
- ✅ 添加智能优化建议
- ✅ 完善测试验证体系

### 计划中的功能
- 🔄 视觉相似度检测
- 🔄 AI驱动的学习优化
- 🔄 多风格适配支持
- 🔄 实时预览功能

## 技术支持

如果在使用过程中遇到问题，请：
1. 查看控制台日志获取详细错误信息
2. 运行测试文件验证系统状态
3. 检查核心形象标准是否正确提取
4. 确认一致性检查评分是否达标

更多技术细节请参考：
- `lib/promptTemplates.ts` - 提示词模板
- `lib/consistencyChecker.ts` - 一致性检查逻辑
- `lib/arkApi.ts` - API调用实现