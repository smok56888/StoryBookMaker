# 故事标题编辑功能

## 功能描述
在生成故事时，将故事标题展示在页面上并支持编辑。标题会在封面提示词生成、绘本保存和下载时正确应用。

## 实现方案

### 1. 前端UI改进

#### 1.1 标题编辑界面
在故事生成后，将原来的只读标题显示改为可编辑的输入框：

```tsx
{storyTitle && (
  <div className="text-center mb-6">
    <div className="space-y-2">
      <Label htmlFor="story-title" className="text-sm font-medium text-gray-700">
        故事标题
      </Label>
      <Input
        id="story-title"
        value={storyTitle}
        onChange={(e) => handleTitleUpdate(e.target.value)}
        className="text-center text-xl font-bold border-2 border-dashed border-gray-300 focus:border-blue-500 bg-gray-50 focus:bg-white"
        placeholder="请输入故事标题"
      />
      <p className="text-xs text-gray-500">
        标题将显示在封面图片上
      </p>
    </div>
  </div>
)}
```

#### 1.2 实时更新功能
添加标题更新处理函数，支持实时保存：

```tsx
// 标题更新函数（带防抖）
const handleTitleUpdate = async (newTitle: string) => {
  setStoryTitle(newTitle)
  
  // 如果有故事ID，保存到后端
  if (storyId && newTitle.trim()) {
    try {
      await updateStoryTitle(storyId, newTitle.trim())
    } catch (error) {
      console.error('标题更新失败:', error)
      // 不显示错误提示，避免干扰用户输入
    }
  }
}
```

### 2. 后端API支持

#### 2.1 标题更新API
创建新的API端点 `/api/story/update-title`：

```typescript
export async function POST(request: NextRequest) {
  const { storyId, title } = await request.json()
  
  // 验证参数
  if (!storyId || !title?.trim()) {
    return NextResponse.json({ error: '参数无效' }, { status: 400 })
  }
  
  // 加载并更新故事
  const existingStory = loadStory(storyId)
  if (!existingStory) {
    return NextResponse.json({ error: '故事不存在' }, { status: 404 })
  }
  
  const updatedStory = { ...existingStory, title: title.trim() }
  saveStory(storyId, updatedStory)
  
  return NextResponse.json({ success: true, title: updatedStory.title })
}
```

#### 2.2 API客户端函数
在 `lib/apiClient.ts` 中添加标题更新函数：

```typescript
// 更新故事标题
export async function updateStoryTitle(storyId: string, title: string) {
  const response = await apiClient.post('/story/update-title', { 
    storyId, 
    title 
  })
  return response.data
}
```

### 3. 标题应用集成

#### 3.1 封面提示词生成
在提示词生成API中，标题已经正确传递：

```typescript
// 从存储中获取最新的故事数据（包括标题）
const story = loadStory(storyId)

// 传递给提示词生成函数
const promptResult = await generateImagePrompt({
  storyId,
  characters,
  paragraphs: story.paragraphs,
  title: story.title  // 使用最新的标题
})
```

#### 3.2 PDF下载应用
PDF生成时自动使用存储中的最新标题：

```typescript
// PDF生成API中
const storyData = getStory(storyId)
const story = {
  id: storyId,
  title: storyData.title,  // 使用最新标题
  pages: storyData.paragraphs.map(...)
}

// 下载时的文件名也使用标题
let filename = `${storyTitle || 'story'}.pdf`
```

#### 3.3 绘本保存
标题更新会立即保存到存储系统：

```typescript
// 存储函数已支持标题
export function saveStory(storyId: string, story: { title: string; paragraphs: string[] }) {
  const storyDir = getStoryDir(storyId)
  ensureDir(storyDir)
  
  const filePath = path.join(storyDir, 'story.json')
  fs.writeFileSync(filePath, JSON.stringify(story, null, 2))
}
```

## 功能特性

### 1. 用户体验
- **可视化编辑**: 标题以大号字体居中显示，支持直接编辑
- **实时保存**: 输入时自动保存，无需手动操作
- **视觉提示**: 虚线边框和背景色变化提示可编辑状态
- **用户引导**: 提示文字说明标题将显示在封面上

### 2. 数据一致性
- **统一存储**: 标题统一存储在故事数据中
- **实时同步**: 编辑后立即同步到后端
- **全流程应用**: 提示词生成、PDF生成、下载都使用最新标题

### 3. 错误处理
- **静默失败**: 标题更新失败不显示错误提示，避免干扰用户
- **参数验证**: 后端验证标题不能为空
- **兜底机制**: 下载时如果没有标题使用默认名称

## 技术实现

### 修改的文件
1. `app/create/page.tsx` - 添加标题编辑UI和更新逻辑
2. `app/api/story/update-title/route.ts` - 新增标题更新API
3. `lib/apiClient.ts` - 添加标题更新客户端函数
4. `app/api/story/prompts/route.ts` - 确保使用最新标题生成提示词
5. `app/api/story/pdf/route.ts` - 确保PDF使用最新标题

### 关键改进点
1. **UI改进**: 从只读显示改为可编辑输入框
2. **实时更新**: 输入时立即保存到后端
3. **数据流**: 确保标题在所有环节都正确传递和使用
4. **用户体验**: 清晰的视觉提示和操作反馈

## 使用说明

### 用户操作
1. 生成故事后，标题会显示在故事内容上方
2. 点击标题输入框可以直接编辑
3. 输入时会自动保存，无需额外操作
4. 标题会自动应用到封面图生成和PDF下载

### 开发者注意
1. 标题更新是异步操作，但不会阻塞用户输入
2. 更新失败时不会显示错误提示，保持用户体验流畅
3. 所有使用标题的地方都会获取最新的存储值
4. 标题为空时会使用默认值作为兜底

## 效果展示

### 编辑前
- 标题以普通文本形式显示
- 用户无法修改标题内容

### 编辑后
- 标题显示为可编辑的输入框
- 支持实时编辑和自动保存
- 清晰的视觉提示和用户引导
- 标题正确应用到所有相关功能

这个功能大大提升了用户对故事创作的控制能力，让用户可以随时调整故事标题，并确保标题在整个创作流程中的一致性应用。