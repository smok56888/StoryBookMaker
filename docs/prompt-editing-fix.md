# 提示词编辑问题修复

## 问题描述
在图片生成页面中，当后端返回提示词后，用户尝试编辑提示词时会遇到以下问题：
- 删除单个字符后页面会自动恢复原内容
- 无法正常编辑提示词内容
- 用户的编辑会被系统自动覆盖

## 问题原因分析
问题出现在 `components/ui/image-generator.tsx` 组件中的状态管理逻辑：

### 原始问题代码
```javascript
useEffect(() => {
  if (initialPrompt !== undefined && initialPrompt !== prompt) {
    setPrompt(initialPrompt)
  }
}, [initialPrompt, prompt, type, index]) // 问题：依赖数组包含了 prompt
```

### 问题分析
1. **循环更新问题**: `useEffect` 依赖数组包含 `prompt`，当用户编辑提示词时，`prompt` 状态改变
2. **条件判断缺陷**: 每次 `prompt` 改变都会触发 `useEffect`，如果 `initialPrompt !== prompt`，就会重新设置提示词
3. **缺少编辑状态判断**: 没有考虑用户正在编辑的状态，导致编辑被覆盖

## 修复方案

### 1. 添加用户编辑状态跟踪
```javascript
const [hasUserEdited, setHasUserEdited] = useState(false)
```

### 2. 创建自定义setPrompt函数
```javascript
const setPrompt = (value: string, isUserEdit = false) => {
  setPromptState(value)
  if (isUserEdit) {
    setHasUserEdited(true)
  }
}
```

### 3. 优化useEffect逻辑
```javascript
useEffect(() => {
  // 只有在以下情况才更新提示词：
  // 1. initialPrompt 有值且不为空
  // 2. 当前不在编辑状态
  // 3. 用户没有手动编辑过，或者当前prompt为空
  // 4. initialPrompt 与当前 prompt 不同
  if (initialPrompt !== undefined && 
      initialPrompt !== '' && 
      !isEditing && 
      (!hasUserEdited || !prompt) &&
      initialPrompt !== prompt) {
    
    setPrompt(initialPrompt)
  }
}, [initialPrompt, type, index, isEditing, hasUserEdited]) // 移除 prompt 依赖
```

### 4. 改进用户界面
- 添加明确的"编辑"按钮
- 添加"完成"和"取消"按钮
- 添加"恢复"按钮，让用户可以重新使用AI生成的提示词
- 改进视觉提示，让用户知道可以编辑

## 修复后的功能特性

### ✅ 解决的问题
1. **编辑不被覆盖**: 用户编辑时不会被自动恢复
2. **状态管理优化**: 避免了循环更新问题
3. **用户体验改进**: 提供清晰的编辑界面和操作按钮

### ✅ 新增功能
1. **编辑状态指示**: 明确显示当前是否在编辑模式
2. **恢复功能**: 用户可以随时恢复到AI生成的原始提示词
3. **取消编辑**: 用户可以取消编辑并恢复到编辑前的状态
4. **智能更新**: 只在合适的时机自动更新提示词

## 使用说明

### 编辑提示词
1. 点击"编辑"按钮进入编辑模式
2. 在文本框中修改提示词内容
3. 点击"完成"保存编辑，或点击"取消"放弃修改

### 恢复AI提示词
- 如果用户编辑过提示词，会显示"恢复"按钮
- 点击"恢复"可以重新使用AI生成的原始提示词

### 自动更新规则
- 首次加载时会自动填入AI生成的提示词
- 用户编辑过的提示词不会被自动覆盖
- 只有在用户主动恢复或取消编辑时才会更新

## 技术要点

### 状态管理
- 使用 `hasUserEdited` 跟踪用户编辑状态
- 区分系统更新和用户编辑的 `setPrompt` 调用
- 优化 `useEffect` 依赖数组，避免循环更新

### 用户体验
- 提供明确的编辑入口和退出方式
- 保护用户的编辑内容不被意外覆盖
- 提供恢复原始内容的选项

这个修复确保了提示词编辑功能的稳定性和用户友好性。