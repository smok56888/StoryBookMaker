"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Download, Loader2, CheckCircle } from "lucide-react"
import { downloadPdf } from "@/lib/apiClient"
import { PDFDownloadProgress } from "./pdf-download-progress"

interface DownloadButtonProps {
  storyId: string
  storyTitle: string
  variant?: "default" | "ghost" | "outline"
  size?: "default" | "sm" | "lg"
  className?: string
  showText?: boolean
  showProgress?: boolean
}

export function DownloadButton({ 
  storyId, 
  storyTitle, 
  variant = "ghost", 
  size = "sm",
  className = "",
  showText = true,
  showProgress = false
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadComplete, setDownloadComplete] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (isDownloading) return

    try {
      setIsDownloading(true)
      
      // 如果启用进度显示，显示进度模态框
      if (showProgress) {
        setShowProgressModal(true)
      }
      
      await downloadPdf(storyId, storyTitle)
      
      // 显示下载完成状态
      setDownloadComplete(true)
      setTimeout(() => setDownloadComplete(false), 2000)
      
    } catch (error) {
      console.error('PDF下载失败:', error)
      setShowProgressModal(false)
    } finally {
      setIsDownloading(false)
    }
  }

  const getButtonContent = () => {
    const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4"
    
    if (downloadComplete) {
      return (
        <>
          <CheckCircle className={`${iconSize} mr-2 text-green-600`} />
          {showText && <span className="text-green-600">已下载</span>}
        </>
      )
    }
    
    if (isDownloading) {
      return (
        <>
          <Loader2 className={`${iconSize} mr-2 animate-spin text-blue-600`} />
          {showText && <span className="text-blue-600">生成中...</span>}
        </>
      )
    }
    
    return (
      <>
        <Download className={`${iconSize} mr-2`} />
        {showText && "导出PDF"}
      </>
    )
  }

  const getButtonClassName = () => {
    let baseClass = `text-sm transition-all duration-200 ${className}`
    
    if (downloadComplete) {
      baseClass += " bg-green-50 text-green-600 hover:bg-green-100"
    } else if (isDownloading) {
      baseClass += " bg-blue-50 text-blue-600 cursor-not-allowed"
    } else {
      baseClass += " hover:bg-gray-100"
    }
    
    return baseClass
  }

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={getButtonClassName()}
        disabled={isDownloading}
        onClick={handleDownload}
        title={isDownloading ? "PDF生成中，请稍候..." : `下载《${storyTitle}》PDF`}
      >
        {getButtonContent()}
      </Button>
      
      {showProgress && (
        <PDFDownloadProgress
          isVisible={showProgressModal}
          storyTitle={storyTitle}
          onComplete={() => setShowProgressModal(false)}
        />
      )}
    </>
  )
}