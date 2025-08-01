"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { generateImage } from "@/lib/apiClient"
import { Wand2, RefreshCw, Edit3, Check, ImageIcon, Edit, X, History, Trash2, RotateCcw } from "lucide-react"
import { toast } from "sonner"

interface ImageGeneratorProps {
  storyId: string
  type: 'cover' | 'content' | 'ending'
  index?: number
  prompt: string
  title?: string
  existingImage?: string // 添加已存在的图片
  onImageGenerated: (image: string) => void
}

export function ImageGenerator({
  storyId,
  type,
  index,
  prompt: initialPrompt,
  title,
  existingImage,
  onImageGenerated
}: ImageGeneratorProps) {
  const [prompt, setPromptState] = useState(initialPrompt)
  const [isEditing, setIsEditing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [hasUserEdited, setHasUserEdited] = useState(false) // 跟踪用户是否手动编辑过
  const [currentImage, setCurrentImage] = useState<string | null>(
    existingImage ? `data:image/jpeg;base64,${existingImage}` : null
  )
  const [imageHistory, setImageHistory] = useState<Array<{
    id: string
    image: string
    prompt: string
    timestamp: number
    isSelected: boolean
  }>>([])
  const [showHistory, setShowHistory] = useState(false)
  
  // 自定义setPrompt函数，区分用户编辑和系统更新
  const setPrompt = (value: string, isUserEdit = false) => {
    setPromptState(value)
    if (isUserEdit) {
      setHasUserEdited(true)
    }
  }
  
  // 兼容性：保持原有的image状态
  const image = currentImage
  
  // 选择历史图片
  const selectHistoryImage = (historyItem: typeof imageHistory[0]) => {
    // 如果当前有图片且不在历史记录中，先保存到历史记录
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
    
    // 设置选中的历史图片为当前图片
    setCurrentImage(historyItem.image)
    
    // 从历史记录中移除选中的项目
    setImageHistory(prev => prev.filter(item => item.id !== historyItem.id))
    
    // 通知父组件图片已更改
    const base64Data = historyItem.image.replace('data:image/jpeg;base64,', '')
    onImageGenerated(base64Data)
    
    toast.success('已切换到历史版本')
  }
  
  // 删除历史图片
  const deleteHistoryImage = (historyId: string) => {
    setImageHistory(prev => prev.filter(item => item.id !== historyId))
    toast.success('历史图片已删除')
  }
  
  // 清空历史记录
  const clearHistory = () => {
    setImageHistory([])
    toast.success('历史记录已清空')
  }

  // 监听 initialPrompt 变化，自动更新提示词（但不在用户编辑时覆盖）
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
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ImageGenerator] 更新提示词 (${type}${index !== undefined ? `-${index}` : ''}):`, initialPrompt)
      }
      setPrompt(initialPrompt)
    }
  }, [initialPrompt, type, index, isEditing, hasUserEdited]) // 移除 prompt 依赖，避免循环更新

  // 监听 existingImage 变化，自动更新图片
  useEffect(() => {
    if (existingImage) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ImageGenerator] 加载已存在图片 (${type}${index !== undefined ? `-${index}` : ''})`)
      }
      setCurrentImage(`data:image/jpeg;base64,${existingImage}`)
    } else {
      setCurrentImage(null)
    }
  }, [existingImage, type, index])

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      toast.error('提示词不能为空')
      return
    }

    setIsGenerating(true)
    toast.info('正在生成图片，这可能需要一些时间，请耐心等待...')
    
    let retries = 0;
    const maxRetries = 2;
    
    while (retries <= maxRetries) {
      try {
        if (retries > 0) {
          toast.info(`正在重试生成图片 (${retries}/${maxRetries})...`)
        }
        
        // 增强的图片生成，包含一致性优化
        const result = await generateImage({
          storyId,
          type,
          index,
          prompt: prompt, // 使用经过一致性优化的提示词
          title
        })

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
          toast.success('图片生成成功')
          
          // 可选：记录成功的提示词用于后续页面参考
          if (process.env.NODE_ENV === 'development') {
            console.log(`[一致性系统] 成功生成${type}图片，提示词长度: ${prompt.length}`)
          }
          
          break; // 成功则跳出循环
        } else {
          throw new Error('未获取到图片数据')
        }
      } catch (error: any) {
        console.error('图片生成错误:', error)
        retries++;
        
        if (retries > maxRetries) {
          // 达到最大重试次数，显示错误
          const errorMessage = error.response?.data?.error || '图片生成失败'
          toast.error(errorMessage)
          break;
        }
        
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    setIsGenerating(false)
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 左侧：图片区域 */}
          <div className="flex flex-col items-center justify-center">
            {image ? (
              <div className="space-y-3">
                <div className="relative">
                  <img
                    src={image}
                    alt="Generated image"
                    className="w-full h-auto rounded-lg border shadow-sm"
                  />
                </div>
                
                {/* 历史图片管理按钮 */}
                <div className="flex justify-center gap-2">
                  {imageHistory.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-xs"
                    >
                      <History className="mr-1 h-3 w-3" />
                      历史版本 ({imageHistory.length})
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                    className="text-xs"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                        生成中...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-1 h-3 w-3" />
                        重新生成
                      </>
                    )}
                  </Button>
                </div>
                
                {/* 历史图片选择界面 */}
                {showHistory && imageHistory.length > 0 && (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-medium text-gray-700">历史版本</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearHistory}
                        className="text-xs text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="mr-1 h-3 w-3" />
                        清空
                      </Button>
                    </div>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {imageHistory.map((historyItem) => (
                        <div
                          key={historyItem.id}
                          className="relative group cursor-pointer border rounded-lg overflow-hidden hover:border-blue-500 hover:shadow-md transition-all bg-white"
                          onClick={() => selectHistoryImage(historyItem)}
                        >
                          <div className="w-full flex items-center justify-center p-3 bg-gradient-to-br from-gray-50 to-gray-100">
                            <img
                              src={historyItem.image}
                              alt="历史图片"
                              className="max-w-full h-auto object-contain rounded-sm shadow-sm"
                              style={{ maxHeight: '150px', maxWidth: '100%' }}
                            />
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <RotateCcw className="h-4 w-4 text-white drop-shadow-lg" />
                            </div>
                          </div>
                          <div className="absolute top-1 right-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteHistoryImage(historyItem.id)
                              }}
                              className="h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent text-white text-xs p-2">
                            <div className="text-center font-medium">
                              {new Date(historyItem.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-4">
                <ImageIcon className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-gray-500 text-center mb-4">还未生成图片</p>
                <Button
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      生成图片
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* 右侧：提示词区域 */}
          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">提示词</h3>
              <div className="flex space-x-2">
                {/* 移除了重新生成按钮，现在在图片下方 */}
              </div>
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">
                  图片生成提示词
                </label>
                <div className="flex gap-2">
                  {!isEditing && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(true)}
                        className="text-xs"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        编辑
                      </Button>
                      {hasUserEdited && initialPrompt && initialPrompt !== prompt && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setPrompt(initialPrompt, false)
                            setHasUserEdited(false)
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700"
                          title="恢复AI生成的提示词"
                        >
                          <RefreshCw className="mr-1 h-3 w-3" />
                          恢复
                        </Button>
                      )}
                    </>
                  )}
                  {isEditing && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditing(false)}
                        className="text-xs"
                      >
                        <Check className="mr-1 h-3 w-3" />
                        完成
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPrompt(initialPrompt, false) // 恢复原始提示词，不标记为用户编辑
                          setHasUserEdited(false) // 重置用户编辑状态
                          setIsEditing(false)
                        }}
                        className="text-xs"
                      >
                        <X className="mr-1 h-3 w-3" />
                        取消
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {isEditing ? (
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value, true)} // 标记为用户编辑
                  placeholder="请输入图片生成提示词..."
                  className="min-h-[120px] resize-none"
                  autoFocus
                />
              ) : (
                <div 
                  className="border rounded-md p-3 bg-gray-50 min-h-[120px] overflow-auto text-sm text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => setIsEditing(true)}
                  title="点击编辑提示词"
                >
                  {prompt || (
                    <span className="text-gray-400 italic">
                      点击编辑提示词或使用上方的"生成提示词"按钮自动生成...
                    </span>
                  )}
                </div>
              )}
            </div>

            {!image && (
              <Button
                className="mt-4 self-end"
                onClick={handleGenerateImage}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    生成图片
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}