"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Wand2, RefreshCw } from "lucide-react"
import { generatePrompts } from "@/lib/apiClient"
import { toast } from "sonner"

interface PromptGeneratorButtonProps {
  storyId: string
  onSuccess: (prompts: { cover: string; pages: string[]; ending: string }) => void
  className?: string
}

export function PromptGeneratorButton({ storyId, onSuccess, className }: PromptGeneratorButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGeneratePrompts = async () => {
    if (!storyId) {
      toast.error('故事ID不能为空')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generatePrompts(storyId)
      onSuccess(result)
      toast.success('提示词生成成功')
    } catch (error: any) {
      toast.error(error.response?.data?.error || '提示词生成失败')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
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
  )
}