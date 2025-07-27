'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, ZoomIn, ZoomOut } from 'lucide-react'

interface PreviewViewerProps {
  title: string
  paragraphs: string[]
  images: {
    cover?: string
    content: string[]
    ending?: string
  }
}

export function PreviewViewer({ title, paragraphs, images }: PreviewViewerProps) {
  const [currentPage, setCurrentPage] = useState(0)
  const [zoom, setZoom] = useState(100)

  // 调试信息（仅开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('[PreviewViewer] 接收到的图片数据:', {
      cover: images.cover ? '有封面图' : '无封面图',
      content: images.content.map((img, index) => `第${index + 1}页: ${img ? '有图片' : '无图片'}`),
      ending: images.ending ? '有结尾图' : '无结尾图'
    })
  }

  // 构建页面数据
  const pages = [
    // 封面
    ...(images.cover ? [{ 
      type: 'cover' as const, 
      image: images.cover, 
      text: '' 
    }] : []),
    
    // 正文页
    ...paragraphs.map((text, index) => ({
      type: 'content' as const,
      image: images.content[index] || '',
      text
    })),
    
    // 结尾页
    ...(images.ending ? [{ 
      type: 'ending' as const, 
      image: images.ending, 
      text: '' 
    }] : [])
  ]

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1)
    }
  }

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1)
    }
  }

  const currentPageData = pages.length > 0 ? pages[currentPage] : null;

  // 如果没有页面数据，显示空状态
  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gray-50 rounded-lg p-8">
        <div className="text-gray-400 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-700 mb-2">暂无绘本内容</h3>
        <p className="text-gray-500 text-center">请先完成故事创作和插图生成</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面控制 */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className="text-sm">
          第 {currentPage + 1} 页 / 共 {pages.length} 页
        </Badge>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(50, zoom - 25))}
            disabled={zoom <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">{zoom}%</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(200, zoom + 25))}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 绘本内容 */}
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex items-center space-x-4 w-full max-w-6xl">
          {/* 上一页按钮 */}
          <Button
            variant="outline"
            size="lg"
            onClick={prevPage}
            disabled={currentPage === 0}
          >
            <ArrowLeft className="h-6 w-6" />
          </Button>

          {/* 绘本页面 */}
          <Card className="flex-1 max-w-4xl mx-auto">
            <CardContent className="p-6">
              {currentPageData && (
                <div className="relative" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}>
                    {currentPageData.type === 'cover' || currentPageData.type === 'ending' ? (
                    // 封面和结尾页 - 单独显示图片
                    <div className="text-center">
                      <img
                        src={`data:image/jpeg;base64,${currentPageData.image}`}
                        alt={currentPageData.type === 'cover' ? '封面' : '结尾页'}
                        className="mx-auto rounded-lg shadow-lg max-h-[500px] object-contain"
                      />
                      {currentPageData.text && (
                        <p className="mt-4 text-lg font-medium text-gray-700">
                          {currentPageData.text}
                        </p>
                      )}
                    </div>
                  ) : (
                    // 正文页 - 图文并排
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div className="order-2 md:order-1">
                        <p className="text-lg leading-relaxed text-gray-700">
                          {currentPageData.text}
                        </p>
                      </div>
                      <div className="order-1 md:order-2">
                        {currentPageData.image && (
                          <img
                            src={`data:image/jpeg;base64,${currentPageData.image}`}
                            alt={`第 ${currentPage} 页`}
                            className="w-full rounded-lg shadow-lg max-h-[400px] object-contain"
                          />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 下一页按钮 */}
          <Button
            variant="outline"
            size="lg"
            onClick={nextPage}
            disabled={currentPage === pages.length - 1}
          >
            <ArrowRight className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* 页面导航缩略图 */}
      <div>
        <h3 className="text-lg font-semibold mb-4">页面导航</h3>
        <div className="flex space-x-2 overflow-x-auto pb-4">
          {pages.map((page, index) => (
            <button
              key={index}
              onClick={() => setCurrentPage(index)}
              className={`flex-shrink-0 relative transition-all ${
                currentPage === index ? 'ring-2 ring-purple-500 scale-105' : 'hover:scale-105'
              }`}
            >
              {page.image ? (
                <img
                  src={`data:image/jpeg;base64,${page.image}`}
                  alt={`页面 ${index + 1}`}
                  className="w-16 h-20 object-cover rounded border hover:opacity-80 transition-opacity"
                />
              ) : (
                <div className="w-16 h-20 bg-gray-100 flex items-center justify-center rounded border">
                  <span className="text-gray-400 text-xs">无图片</span>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs text-center py-1 rounded-b">
                {index + 1}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}