"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Wand2, RefreshCw } from "lucide-react"
import { generatePrompts } from "@/lib/apiClient"
import { toast } from "sonner"
import { ProgressIndicator } from "./progress-indicator"

interface PromptGeneratorButtonProps {
  storyId: string
  onSuccess: (prompts: { cover: string; pages: string[]; ending: string }) => void
  className?: string
}

export function PromptGeneratorButton({ storyId, onSuccess, className }: PromptGeneratorButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const progressSteps = [
    '正在分析故事内容...',
    '正在提取角色特征...',
    '正在生成角色描述...',
    '正在优化提示词...',
    '正在进行一致性检查...',
    '即将完成...'
  ]

  const handleGeneratePrompts = async () => {
    if (!storyId) {
      toast.error('故事ID不能为空')
      return
    }

    setIsGenerating(true)
    
    try {
      const result = await generatePrompts(storyId, 'optimized')
      onSuccess(result)
      toast.success('提示词生成成功')
    } catch (error: any) {
      console.error('提示词生成失败:', error)
      
      // 如果是超时错误，尝试快速模式
      if (error.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
        toast.error('生成超时，正在尝试快速模式...')
        
        try {
          const result = await generatePrompts(storyId, 'fast')
          onSuccess(result)
          toast.success('提示词生成成功（快速模式）')
        } catch (fastError: any) {
          toast.error('提示词生成失败，请稍后重试')
        }
      } else {
        toast.error(error.response?.data?.error || '提示词生成失败')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <Button
        onClick={handleGeneratePrompts}
        disabled={isGenerating}
        className={className}
      >
        {isGenerating ? (
          <>
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            生成提示词
          </>
        )}
      </Button>
      
      <ProgressIndicator 
        isActive={isGenerating}
        steps={progressSteps}
        duration={60000} // 预计60秒完成
      />
    </div>
  )
}