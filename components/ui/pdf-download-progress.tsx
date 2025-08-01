"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Image, Download, CheckCircle } from "lucide-react"

interface PDFDownloadProgressProps {
  isVisible: boolean
  storyTitle: string
  onComplete?: () => void
}

const progressSteps = [
  { id: 1, label: "准备生成PDF...", icon: FileText, duration: 2000 },
  { id: 2, label: "启动浏览器引擎...", icon: FileText, duration: 3000 },
  { id: 3, label: "渲染页面内容...", icon: FileText, duration: 4000 },
  { id: 4, label: "加载图片资源...", icon: Image, duration: 6000 },
  { id: 5, label: "生成PDF文件...", icon: FileText, duration: 8000 },
  { id: 6, label: "准备下载...", icon: Download, duration: 9000 },
  { id: 7, label: "下载完成！", icon: CheckCircle, duration: 10000 }
]

export function PDFDownloadProgress({ isVisible, storyTitle, onComplete }: PDFDownloadProgressProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isVisible) {
      setCurrentStep(0)
      setProgress(0)
      return
    }

    const totalDuration = 10000 // 10秒总时长
    const interval = 100 // 每100ms更新一次

    const timer = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (totalDuration / interval))
        
        // 根据进度更新当前步骤
        const stepIndex = Math.floor((newProgress / 100) * progressSteps.length)
        if (stepIndex !== currentStep && stepIndex < progressSteps.length) {
          setCurrentStep(stepIndex)
        }
        
        if (newProgress >= 100) {
          clearInterval(timer)
          setTimeout(() => {
            onComplete?.()
          }, 1000)
          return 100
        }
        
        return newProgress
      })
    }, interval)

    return () => clearInterval(timer)
  }, [isVisible, currentStep, onComplete])

  if (!isVisible) return null

  const currentStepData = progressSteps[currentStep] || progressSteps[0]
  const IconComponent = currentStepData.icon

  return (
    <Card className="fixed top-4 right-4 w-80 z-50 shadow-lg border-2 border-blue-200 bg-white">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <IconComponent className={`h-4 w-4 ${
              currentStep === progressSteps.length - 1 ? 'text-green-600' : 'text-blue-600'
            }`} />
            <span className="font-medium text-sm">《{storyTitle}》</span>
          </div>
          
          <Progress 
            value={progress} 
            className="h-2"
          />
          
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>{currentStepData.label}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          
          {currentStep === progressSteps.length - 1 && (
            <div className="text-center text-sm text-green-600 font-medium">
              PDF下载成功！
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}