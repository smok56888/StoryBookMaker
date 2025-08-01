"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"

interface ProgressIndicatorProps {
  isActive: boolean
  steps: string[]
  duration?: number // 总持续时间（毫秒）
}

export function ProgressIndicator({ isActive, steps, duration = 30000 }: ProgressIndicatorProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isActive) {
      setCurrentStep(0)
      setProgress(0)
      return
    }

    const stepDuration = duration / steps.length
    const progressInterval = 100 // 每100ms更新一次进度

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / progressInterval))
        
        // 计算当前步骤
        const newStep = Math.floor((newProgress / 100) * steps.length)
        if (newStep !== currentStep && newStep < steps.length) {
          setCurrentStep(newStep)
        }
        
        return Math.min(newProgress, 100)
      })
    }, progressInterval)

    return () => clearInterval(interval)
  }, [isActive, steps.length, duration, currentStep])

  if (!isActive) return null

  return (
    <div className="w-full max-w-md mx-auto space-y-3">
      <Progress value={progress} className="h-2" />
      <div className="text-center">
        <div className="text-sm font-medium text-gray-700">
          {steps[currentStep] || steps[steps.length - 1]}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          步骤 {Math.min(currentStep + 1, steps.length)} / {steps.length}
        </div>
      </div>
    </div>
  )
}