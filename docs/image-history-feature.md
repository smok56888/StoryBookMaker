# 图片历史版本功能

## 功能概述
为图片生成组件添加了历史版本管理功能，用户可以保存多个版本的图片并随意选择使用哪一个。

## 主要功能

### ✅ 自动保存历史版本
- 每次重新生成图片时，自动将当前图片保存到历史记录
- 历史记录包含图片、提示词、生成时间等信息
- 自动生成唯一ID标识每个历史版本

### ✅ 历史版本查看
- 点击"历史版本"按钮查看所有保存的图片
- 网格布局显示历史图片缩略图
- 显示生成时间戳
- 支持滚动查看更多历史版本

### ✅ 版本切换功能
- 点击任意历史图片即可切换为当前使用的图片
- 切换时会将当前图片自动保存到历史记录
- 支持在多个版本间自由切换

### ✅ 历史记录管理
- 单个删除：点击历史图片右上角的删除按钮
- 批量清空：点击"清空"按钮删除所有历史记录
- 智能管理：避免重复保存相同图片

## 技术实现

### 状态管理
```typescript
// 历史图片数据结构
const [imageHistory, setImageHistory] = useState<Array<{
  id: string           // 唯一标识
  image: string        // base64图片数据
  prompt: string       // 生成时使用的提示词
  timestamp: number    // 生成时间戳
  isSelected: boolean  // 是否被选中（预留）
}>>([])

// 当前图片状态
const [currentImage, setCurrentImage] = useState<string | null>(null)

// 历史面板显示状态
const [showHistory, setShowHistory] = useState(false)
```

### 核心功能函数

#### 1. 图片生成时自动保存历史
```typescript
if (result.image) {
  const newImageData = `data:image/jpeg;base64,${result.image}`
  
  // 如果当前有图片，先将其保存到历史记录
  if (currentImage) {
    const historyItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      image: currentImage,
      prompt: prompt,
      timestamp: Date.now(),
      isSelected: false
    }
    setImageHistory(prev => [historyItem, ...prev])
  }
  
  // 设置新图片为当前图片
  setCurrentImage(newImageData)
  onImageGenerated(result.image)
}
```

#### 2. 选择历史图片
```typescript
const selectHistoryImage = (historyItem) => {
  // 保存当前图片到历史记录
  if (currentImage && !imageHistory.some(item => item.image === currentImage)) {
    const currentHistoryItem = {
      id: `current-${Date.now()}`,
      image: currentImage,
      prompt: prompt,
      timestamp: Date.now(),
      isSelected: false
    }
    setImageHistory(prev => [currentHistoryItem, ...prev])
  }
  
  // 切换到选中的历史图片
  setCurrentImage(historyItem.image)
  setImageHistory(prev => prev.filter(item => item.id !== historyItem.id))
  
  // 通知父组件
  const base64Data = historyItem.image.replace('data:image/jpeg;base64,', '')
  onImageGenerated(base64Data)
}
```

#### 3. 历史记录管理
```typescript
// 删除单个历史图片
const deleteHistoryImage = (historyId: string) => {
  setImageHistory(prev => prev.filter(item => item.id !== historyId))
}

// 清空所有历史记录
const clearHistory = () => {
  setImageHistory([])
}
```

## 用户界面设计

### 历史版本按钮
- 位置：图片下方，与"重新生成"按钮并列
- 显示：`历史版本 (数量)`
- 状态：只有存在历史记录时才显示

### 历史图片网格
- 布局：2列网格，支持滚动
- 缩略图：固定高度，保持比例
- 交互：悬停显示选择图标
- 时间戳：显示在图片底部
- 删除按钮：悬停时显示在右上角

### 视觉反馈
- 悬停效果：半透明遮罩 + 选择图标
- 删除确认：红色删除按钮
- 成功提示：Toast消息提示操作结果

## 使用流程

### 1. 生成第一张图片
- 用户输入提示词并生成图片
- 图片显示在界面上
- 此时还没有历史记录

### 2. 重新生成图片
- 点击"重新生成"按钮
- 当前图片自动保存到历史记录
- 新图片成为当前图片
- 显示"历史版本 (1)"按钮

### 3. 查看和选择历史版本
- 点击"历史版本"按钮展开历史面板
- 查看所有历史图片的缩略图
- 点击任意历史图片切换为当前图片
- 被选中的历史图片从历史记录中移除

### 4. 管理历史记录
- 单个删除：点击图片右上角的 X 按钮
- 批量清空：点击"清空"按钮
- 关闭面板：再次点击"历史版本"按钮

## 优势特点

### 🎯 用户体验优化
- **无损切换**：可以在多个版本间自由切换
- **智能保存**：自动保存，无需手动操作
- **直观管理**：可视化的历史记录管理

### 🔧 技术优势
- **内存优化**：使用base64存储，避免文件系统操作
- **状态同步**：与父组件状态保持同步
- **防重复**：避免保存相同的图片

### 📱 界面友好
- **响应式设计**：适配不同屏幕尺寸
- **清晰标识**：明确的按钮和状态提示
- **流畅动画**：悬停和切换效果

这个功能大大提升了图片生成的用户体验，让用户可以轻松管理和选择最满意的图片版本。