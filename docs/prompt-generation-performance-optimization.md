# 提示词生成性能优化

## 问题描述
提示词生成接口耗时过长，超过浏览器等待时长导致连接断开，同时缺乏用户等待交互反馈。

## 解决方案

### 1. 后端性能优化

#### 1.1 减少API调用次数
**优化前**: 两步式生成流程
1. 调用 `extractCoreElements` 提取核心形象元素
2. 基于提取结果生成插图提示词

**优化后**: 直接生成模式
```typescript
// 优化：直接生成基础一致性描述，减少API调用次数
const coreElements = generateBasicConsistencyElements(params.characters)
```

#### 1.2 调整超时设置
```typescript
// 从180秒优化为90秒，平衡速度和成功率
timeout: 90000
```

#### 1.3 优化token使用
```typescript
max_tokens: 5000, // 适中的token数量，平衡速度和质量
temperature: 0.7  // 较低温度确保一致性
```

### 2. 前端交互优化

#### 2.1 增强API客户端
```typescript
// 添加模式选择和超时设置
export async function generatePrompts(storyId: string, mode: 'optimized' | 'fast' = 'optimized') {
  const response = await apiClient.post('/story/prompts', { 
    storyId, 
    mode 
  }, {
    timeout: 120000 // 2分钟超时
  })
  return response.data
}
```

#### 2.2 智能降级策略
```typescript
// 如果优化模式超时，自动切换到快速模式
if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
  toast.error('生成超时，正在尝试快速模式...')
  const result = await generatePrompts(storyId, 'fast')
  onSuccess(result)
  toast.success('提示词生成成功（快速模式）')
}
```

### 3. 用户体验优化

#### 3.1 进度指示器组件
创建了 `ProgressIndicator` 组件，提供：
- 实时进度条显示
- 分步骤进度提示
- 动态时间估算

```typescript
const progressSteps = [
  '正在分析故事内容...',
  '正在提取角色特征...',
  '正在生成角色描述...',
  '正在优化提示词...',
  '正在进行一致性检查...',
  '即将完成...'
]
```

#### 3.2 增强的按钮组件
更新 `PromptGeneratorButton` 组件：
- 集成进度指示器
- 智能错误处理
- 自动降级重试

### 4. 性能监控

#### 4.1 API调用日志
保持现有的API调用监控：
```typescript
logApiCall.start(apiName, {
  model: requestData.model,
  storyId: params.storyId,
  charactersCount: params.characters.length,
  paragraphsCount: params.paragraphs.length,
  coreElementsLength: coreElements.length
})
```

#### 4.2 错误分类处理
```typescript
if (error.code === 'ETIMEDOUT') {
  errorMessage = 'API请求超时，请稍后重试';
} else if (error.code === 'ECONNREFUSED') {
  errorMessage = '无法连接到API服务器，请检查网络连接';
}
```

## 优化效果

### 1. 性能提升
- **API调用次数**: 从2次减少到1次，减少50%
- **超时时间**: 从180秒优化到90秒
- **响应速度**: 预计提升30-50%

### 2. 用户体验提升
- **进度可视化**: 6步进度指示，用户清楚了解进展
- **智能降级**: 超时自动切换快速模式，成功率提升
- **错误处理**: 详细的错误提示和重试机制

### 3. 稳定性提升
- **超时处理**: 合理的超时设置，避免长时间等待
- **降级策略**: 多种生成模式，确保功能可用性
- **错误恢复**: 自动重试和用户友好的错误提示

## 技术实现

### 修改的文件
1. `lib/arkApi.ts` - 后端API优化
2. `lib/apiClient.ts` - 客户端超时和模式设置
3. `components/ui/prompt-generator-button.tsx` - 按钮组件增强
4. `components/ui/progress-indicator.tsx` - 新增进度指示器
5. `app/api/story/prompts/route.ts` - API路由支持模式选择

### 关键优化点
1. **减少API调用**: 直接生成基础一致性描述
2. **智能超时**: 90秒后端 + 120秒前端的分层超时
3. **降级策略**: 优化模式失败自动切换快速模式
4. **进度反馈**: 6步进度指示器，60秒预计完成时间

## 使用说明

### 开发者
- 默认使用优化模式，超时自动降级到快速模式
- 可通过 `mode` 参数手动指定生成模式
- 进度指示器自动显示，无需额外配置

### 用户
- 点击"生成提示词"后会看到详细的进度指示
- 如果生成时间较长，系统会自动切换到快速模式
- 所有过程都有清晰的状态反馈

## 注意事项
1. 快速模式的一致性可能略低于优化模式
2. 进度指示器是基于预估时间，实际时间可能有差异
3. 网络状况会影响实际生成时间
4. 建议在网络良好的环境下使用优化模式