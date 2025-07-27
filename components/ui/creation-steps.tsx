"use client"

import { FileText, Wand2, ImageIcon, Eye } from "lucide-react"

interface CreationStepsProps {
  currentStep: "setup" | "story" | "images" | "preview"
  onStepChange: (step: "setup" | "story" | "images" | "preview") => void
}

export function CreationSteps({ currentStep, onStepChange }: CreationStepsProps) {
  const steps = [
    { id: "setup", title: "创作设置", description: "上传图片和设置角色信息", icon: FileText },
    { id: "story", title: "故事生成", description: "生成和编辑故事内容", icon: Wand2 },
    { id: "images", title: "插图生成", description: "生成绘本插图", icon: ImageIcon },
    { id: "preview", title: "预览导出", description: "预览和导出绘本", icon: Eye },
  ]

  return (
    <div className="flex justify-center space-x-2 md:space-x-4">
      {steps.map((step, index) => (
        <button
          key={step.id}
          onClick={() => onStepChange(step.id as any)}
          className={`flex flex-col items-center p-3 md:p-4 rounded-lg transition-all text-center min-w-0 ${
            currentStep === step.id
              ? "bg-purple-100 text-purple-700 shadow-sm"
              : "bg-gray-50 text-gray-600 hover:bg-gray-100"
          }`}
        >
          <div
            className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
              currentStep === step.id ? "bg-purple-600 text-white" : "bg-gray-200"
            }`}
          >
            <step.icon className="h-4 w-4" />
          </div>
          <div className="text-xs md:text-sm font-medium truncate">{step.title}</div>
          <div className="text-xs text-gray-500 hidden md:block">{step.description}</div>
        </button>
      ))}
    </div>
  )
}