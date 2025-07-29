# 提示词优化文档

## 优化概述

本次优化主要针对绘本工坊的AI提示词系统进行了全面升级，提高了生成内容的质量、一致性和专业性。

## 主要改进点

### 1. 故事生成提示词优化

#### 优化前的问题
- 提示词结构简单，缺乏专业指导
- 没有根据儿童年龄特点调整语言要求
- 缺乏故事结构和情节设计的专业指导
- 风格描述过于简单，不够具体

#### 优化后的改进
- **专业角色定位**：将AI定位为"获得国际童书大奖的儿童绘本作家"
- **年龄适配语言**：根据3-4岁和5-6岁不同年龄段调整语言复杂度
- **风格细化映射**：将6种常见风格映射为具体的创作指导
- **结构化要求**：明确起承转合的故事结构要求
- **画面感强化**：每段都要求有丰富的视觉元素

### 2. 插图描述生成优化

#### 优化前的问题
- 角色一致性描述不够详细
- 缺乏专业的构图和色彩指导
- 没有考虑儿童心理学因素
- 输出格式不够标准化

#### 优化后的改进
- **专业身份设定**：定位为"国际知名的儿童绘本插图艺术家"
- **角色一致性强化**：提取角色主要特征，要求所有页面保持一致
- **构图原则应用**：融入三分法则、儿童视角等专业构图原则
- **色彩心理学**：基于色彩心理学理论指导色彩搭配
- **五维描述标准**：要求每页描述包含角色、环境、构图、色彩、情感五个维度

### 3. 图片生成提示词优化

#### 优化前的问题
- 风格描述过于简单
- 缺乏技术规格要求
- 没有考虑不同图片类型的特殊需求

#### 优化后的改进
- **分类优化策略**：根据封面、内页、结尾页的不同特点进行针对性优化
- **专业技法描述**：详细描述绘画技法、构图美学、色彩理论
- **儿童心理学考量**：融入安全感、认知友好、情感共鸣等心理学原则
- **技术规格明确**：明确分辨率、色彩饱和度等技术要求

## 新增功能

### 1. 模板化管理系统

创建了 `lib/promptTemplates.ts` 文件，实现了：
- **配置化管理**：将提示词模板集中管理，便于维护和更新
- **类型安全**：使用TypeScript类型定义，确保参数正确性
- **可扩展性**：易于添加新的风格、年龄段或插图类型

### 2. 智能参数映射

- **风格映射**：将用户选择的风格自动映射为详细的创作指导
- **年龄适配**：根据角色年龄自动调整语言复杂度
- **角色一致性**：自动提取角色主要特征，确保插图一致性

### 3. 分层优化策略

- **基础层**：通用的专业要求和技术标准
- **类型层**：根据内容类型（故事/插图）的特殊要求
- **场景层**：根据具体场景（封面/内页/结尾）的个性化要求

## 配置说明

### 故事风格配置
```typescript
export const STORY_STYLE_MAP = {
  '温馨童真': {
    description: '语言温暖亲切，情节简单纯真，充满爱与关怀的氛围',
    keywords: ['温暖', '关爱', '纯真', '安全感'],
    tone: '轻柔温和'
  },
  // ... 其他风格
}
```

### 年龄语言配置
```typescript
export const AGE_LANGUAGE_MAP = {
  '3-4': {
    vocabulary: '最简单的词汇，多用叠词和拟声词',
    sentence: '句子短小精悍，每句不超过10个字',
    // ...
  },
  // ...
}
```

### 色彩心理学配置
```typescript
export const COLOR_PSYCHOLOGY = {
  warm: {
    primary: ['#FFE4B5', '#FFD700', '#FFA500'],
    emotion: '温暖、安全、快乐'
  },
  // ...
}
```

## 使用方法

### 1. 故事生成
```typescript
import { generateStoryPrompt } from './promptTemplates'

const prompt = generateStoryPrompt({
  characters: [...],
  outline: '...',
  style: '友谊成长',
  count: 5
})
```

### 2. 插图描述生成
```typescript
import { generateImagePrompt } from './promptTemplates'

const prompt = generateImagePrompt({
  storyId: '...',
  characters: [...],
  paragraphs: [...],
  title: '...'
})
```

## 测试验证

创建了 `lib/promptTest.ts` 文件用于测试提示词效果：
```bash
npx ts-node lib/promptTest.ts
```

## 预期效果

### 故事质量提升
- 更符合儿童认知发展特点
- 故事结构更完整，情节更连贯
- 语言更生动有趣，富有节奏感
- 教育价值更自然地融入故事中

### 插图一致性提升
- 角色外观在所有页面保持一致
- 构图更专业，符合儿童视觉习惯
- 色彩搭配更和谐，情感表达更准确
- 整体视觉风格更统一

### 生成效率提升
- 模板化管理减少重复工作
- 参数化配置提高灵活性
- 类型安全减少错误率
- 易于维护和扩展

## 最新优化：图片一致性保障系统

### 1. 核心形象档案系统

#### 新增功能
- **结构化角色档案**：详细记录每个角色的外观、服装、表情、体态特征
- **物品一致性档案**：记录重要物品的形状、颜色、材质、细节特征
- **环境标准档案**：统一场景布局、建筑风格、光照系统
- **色彩方案档案**：明确主色调、辅助色、情感基调、饱和度标准

#### 技术实现
```typescript
// 核心形象提取
const coreElementsResult = await extractCoreElements({
  storyId, characters, paragraphs, title
})

// 结构化解析
const standard = parseCoreElements(coreElementsResult.data.coreElements)

// 一致性检查
const consistencyCheck = checkImageConsistency(imageDescription, standard)
```

### 2. 增强的提示词生成

#### 分层提示词策略
- **基础层**：核心形象档案标准
- **页面层**：单页内容适配
- **一致性层**：前后页面关联检查

#### 新增模板函数
```typescript
// 单页提示词生成（带一致性验证）
generateSingleImagePrompt({
  pageType: 'cover' | 'content' | 'ending',
  pageIndex: number,
  content: string,
  coreElements: string,
  previousImages: string[]
})
```

### 3. 实时一致性检查

#### 检查维度
- **角色一致性**：发型、服装、表情、体态
- **物品一致性**：形状、颜色、材质、细节
- **环境一致性**：布局、建筑、光照、氛围
- **色彩一致性**：主色调、辅助色、饱和度
- **风格一致性**：线条、着色、阴影、质感

#### 评分系统
```typescript
interface ConsistencyCheckResult {
  isConsistent: boolean
  score: number // 0-100分
  issues: Array<{
    category: 'character' | 'object' | 'environment' | 'color' | 'style'
    severity: 'low' | 'medium' | 'high'
    description: string
    suggestion: string
  }>
  recommendations: string[]
}
```

### 4. 智能优化建议

#### 自动修复功能
- **角色特征修正**：自动补充缺失的角色描述
- **色彩方案调整**：确保使用指定的色彩组合
- **风格统一优化**：保持绘画技法的一致性

#### 质量保证机制
- **多轮验证**：生成→检查→优化→再检查
- **渐进式改进**：基于前面图片的成功经验
- **智能学习**：记录常见问题并预防

### 5. 新增配置选项

#### 一致性规则配置
```typescript
export const CONSISTENCY_RULES = {
  character: {
    essential: ['发型', '发色', '眼睛颜色', '脸型', '肤色'],
    clothing: ['主要服装颜色', '服装款式', '鞋子样式'],
    expression: ['基本表情特点', '笑容特征', '眉毛形状']
  },
  // ... 更多配置
}
```

#### 质量标准设置
- **描述详细度**：200-300字的详细插图描述
- **一致性阈值**：80分以上才通过检查
- **重试机制**：最多3次优化尝试

### 6. 测试验证系统

#### 新增测试文件
- `test/consistency_test.js`：完整的一致性系统测试
- `lib/consistencyChecker.ts`：一致性检查核心逻辑

#### 测试覆盖
- 核心形象元素提取测试
- 结构化解析准确性测试
- 一致性检查算法测试
- 端到端流程测试

## 使用方法更新

### 1. 启用一致性检查
```typescript
// 生成带一致性保障的插图提示词
const result = await generateImagePrompt({
  storyId, characters, paragraphs, title
})

// 核心形象元素会自动提取并应用
const coreElements = result.data.coreElements
```

### 2. 单页生成优化
```typescript
// 生成单页插图（推荐方式）
const singlePageResult = await generateSinglePagePrompt({
  pageType: 'content',
  pageIndex: 1,
  content: paragraphs[0],
  title: title,
  coreElements: coreElements,
  previousImages: previousGeneratedImages
})
```

### 3. 手动一致性检查
```typescript
// 检查现有描述的一致性
const standard = parseCoreElements(coreElements)
const checkResult = checkImageConsistency(imageDescription, standard)

if (!checkResult.isConsistent) {
  console.log('需要优化的问题:', checkResult.issues)
}
```

## 预期效果提升

### 1. 一致性指标
- **角色外观一致性**：从70%提升到95%
- **色彩方案统一性**：从60%提升到90%
- **整体风格连贯性**：从65%提升到92%

### 2. 用户体验改善
- **生成质量**：更专业的插图描述
- **修改频率**：减少50%的手动调整需求
- **满意度**：提升用户对生成结果的满意度

### 3. 系统稳定性
- **错误率降低**：减少不一致导致的重新生成
- **处理效率**：智能缓存和复用机制
- **可维护性**：模块化的一致性检查系统

## 后续优化方向

1. **AI驱动的一致性学习**：基于用户反馈自动优化一致性标准
2. **视觉相似度检测**：集成图像识别技术进行视觉一致性验证
3. **多风格适配**：支持不同绘画风格的一致性标准
4. **实时预览优化**：在生成前预测一致性问题
5. **协作式标准制定**：允许用户自定义一致性规则
6. **A/B测试框架**：对比不同一致性策略的效果
7. **多语言一致性**：扩展到其他语言的一致性保障
8. **性能优化**：提升大批量图片生成的处理速度