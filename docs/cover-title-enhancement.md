# 封面标题显示优化

## 问题描述
在创作封面图时，没有将标题放进去，封面图缺少故事标题文字显示。

## 解决方案

### 1. 优化封面提示词生成
修改了 `lib/arkApi.ts` 中的多个函数，确保封面图生成时明确包含标题文字要求：

#### 1.1 修改 `optimizeImagePrompt` 函数
- 添加了 `title` 参数
- 针对封面类型，明确要求显示故事标题文字
- 提供了具体的标题显示要求

```typescript
const typeSpecificPrompts = {
  cover: `封面设计，必须在画面中清晰显示故事标题文字${title ? `"${title}"` : ''}，标题文字要醒目易读，可以使用装饰性字体，整体构图要吸引眼球，展现故事主题`,
  // ...
}
```

#### 1.2 增强封面标题显示要求
在 `generateImage` 函数中，为封面类型添加了详细的标题显示规范：

```typescript
【标题文字要求】
- 标题内容："${params.title}"
- 文字位置：画面上方或下方显著位置，不遮挡主要角色
- 字体风格：儿童友好的装饰性字体，圆润可爱
- 文字颜色：与背景形成良好对比，确保清晰可读
- 文字大小：占画面宽度的60-80%，足够醒目
- 装饰效果：可添加阴影、描边或简单装饰，增强视觉效果
```

### 2. 修改系统提示词
更新了生成插图提示词的系统提示，明确要求封面包含标题：

#### 2.1 输出格式要求
```
封面：[封面插图描述，必须包含故事标题文字，展现主要角色，严格遵循一致性要求]
```

#### 2.2 封面特殊要求
```
【封面特殊要求】
封面必须在画面中清晰显示故事标题"${params.title}"，标题文字要醒目易读，位置合适，不遮挡主要角色
```

### 3. 完善兜底方案
修改了所有兜底方案，确保即使AI解析失败时，封面描述也包含标题要求：

```typescript
// 主要兜底方案
cover = enhanceWithConsistency(`温馨的绘本封面，画面中清晰显示故事标题"${params.title}"，展现主要角色，体现故事主题`, characterFeatures)

// 快速解析兜底方案
'温馨的绘本封面，画面中清晰显示故事标题，展现主要角色和故事主题'
```

## 优化效果

### 1. 标题显示保证
- 所有封面图都会明确要求显示故事标题
- 提供了详细的标题显示规范（位置、大小、颜色、字体等）
- 确保标题不会遮挡主要角色

### 2. 视觉效果提升
- 标题文字醒目易读
- 支持装饰性字体和视觉效果
- 与整体封面设计协调统一

### 3. 一致性保证
- 所有生成路径都包含标题要求
- 兜底方案也确保标题显示
- 与角色一致性要求并行不冲突

## 技术实现

### 修改的文件
- `lib/arkApi.ts` - 主要的API调用和提示词生成逻辑

### 修改的函数
1. `optimizeImagePrompt()` - 添加标题参数和封面特殊要求
2. `generateConsistentImagePrompt()` - 系统提示词增加封面标题要求
3. `parseConsistentImagePromptResponse()` - 兜底方案包含标题
4. `parseFastResponse()` - 快速解析兜底方案包含标题

### 关键改进点
1. **参数传递**: 将故事标题传递到图片生成的各个环节
2. **提示词优化**: 明确的标题显示要求和规范
3. **兜底保障**: 确保所有情况下都有标题要求
4. **视觉规范**: 详细的标题显示标准

## 使用说明
修改后，所有新生成的故事封面都会自动包含标题文字。用户无需额外操作，系统会自动在封面图生成时加入标题显示要求。

## 注意事项
1. 标题文字的最终显示效果取决于AI绘图模型的理解和执行能力
2. 如果标题过长，可能需要考虑换行或字体大小调整
3. 标题颜色会根据背景自动调整以确保可读性