"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { generateImage } from "@/lib/apiClient"
import { Wand2, RefreshCw, Edit3, Check, ImageIcon } from "lucide-react"
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
  const [prompt, setPrompt] = useState(initialPrompt)
  const [isEditing, setIsEditing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [image, setImage] = useState<string | null>(
    existingImage ? `data:image/jpeg;base64,${existingImage}` : null
  )

  // 监听 initialPrompt 变化，自动更新提示词
  useEffect(() => {
    if (initialPrompt !== undefined && initialPrompt !== prompt) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ImageGenerator] 更新提示词 (${type}${index !== undefined ? `-${index}` : ''}):`, initialPrompt)
      }
      setPrompt(initialPrompt)
    }
  }, [initialPrompt, prompt, type, index])

  // 监听 existingImage 变化，自动更新图片
  useEffect(() => {
    if (existingImage) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ImageGenerator] 加载已存在图片 (${type}${index !== undefined ? `-${index}` : ''})`)
      }
      setImage(`data:image/jpeg;base64,${existingImage}`)
    } else {
      setImage(null)
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
        
        const result = await generateImage({
          storyId,
          type,
          index,
          prompt,
          title
        })

        if (result.image) {
          setImage(`data:image/jpeg;base64,${result.image}`)
          onImageGenerated(result.image)
          toast.success('图片生成成功')
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
              <div className="relative">
                <img
                  src={image}
                  alt="Generated image"
                  className="w-full h-auto rounded-lg border shadow-sm"
                />
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
              {image && (
                <div className="flex space-x-2">
                  {isEditing ? (
                    <Button size="sm" onClick={() => setIsEditing(false)}>
                      <Check className="mr-1 h-3 w-3" />
                      完成
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                      <Edit3 className="mr-1 h-3 w-3" />
                      编辑
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={handleGenerateImage}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="mr-1 h-3 w-3" />
                        重新生成
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>

            {isEditing || !image ? (
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="请输入图片生成提示词..."
                className="flex-1 min-h-[150px]"
              />
            ) : (
              <div className="border rounded-md p-3 bg-gray-50 flex-1 overflow-auto text-sm text-gray-700">
                {prompt}
              </div>
            )}

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