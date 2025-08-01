'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { toast } from 'sonner'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Navigation } from '@/components/ui/navigation'
import { Trash2, BookOpen, Calendar, Loader2 } from 'lucide-react'
import { getStoryHistory, deleteStory } from '@/lib/apiClient'
import { DownloadButton } from '@/components/ui/download-button'

// 历史绘本类型定义
interface StoryItem {
  storyId: string
  title: string
  coverImage: string | null
  createdAt: string
  status: 'draft' | 'completed'
}

interface StoryGroup {
  date: string
  items: StoryItem[]
}

interface HistoryResponse {
  stories: StoryGroup[]
  total: number
  totalPages: number
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true)
  const [historyData, setHistoryData] = useState<HistoryResponse | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [storyToDelete, setStoryToDelete] = useState<{ id: string, title: string } | null>(null)

  
  // 加载历史绘本数据
  const loadHistory = async (page = 1) => {
    try {
      setLoading(true)
      const data = await getStoryHistory(page)
      setHistoryData(data)
      setCurrentPage(page)
    } catch (error) {
      console.error('加载历史绘本失败:', error)
    } finally {
      setLoading(false)
    }
  }
  
  // 初始加载
  useEffect(() => {
    loadHistory()
  }, [])
  
  // 处理删除绘本
  const handleDeleteStory = async () => {
    if (!storyToDelete) return
    
    try {
      await deleteStory(storyToDelete.id)
      toast.success('绘本已成功删除')
      // 重新加载数据
      loadHistory(currentPage)
    } catch (error) {
      console.error('删除绘本失败:', error)
    } finally {
      setDeleteDialogOpen(false)
      setStoryToDelete(null)
    }
  }
  
  // 打开删除确认对话框
  const openDeleteDialog = (storyId: string, title: string) => {
    setStoryToDelete({ id: storyId, title })
    setDeleteDialogOpen(true)
  }
  

  
  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'yyyy年MM月dd日 EEEE', { locale: zhCN })
    } catch {
      return dateString
    }
  }
  
  // 格式化时间
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, 'HH:mm', { locale: zhCN })
    } catch {
      return ''
    }
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">我的绘本作品</h1>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-lg">加载中...</span>
          </div>
        ) : historyData?.stories.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <BookOpen className="h-16 w-16 mx-auto opacity-50" />
            </div>
            <h3 className="text-xl font-medium text-gray-600 mb-4">暂无绘本作品</h3>
            <p className="text-gray-500 mb-6">开始创作您的第一本绘本吧！</p>
            <Link href="/create">
              <Button>开始创作</Button>
            </Link>
          </div>
        ) : (
          <>
            {historyData?.stories.map((group) => (
              <div key={group.date} className="mb-10">
                <div className="flex items-center mb-4">
                  <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                  <h2 className="text-xl font-semibold">{formatDate(group.date)}</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {group.items.map((story) => (
                    <Card key={story.storyId} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative overflow-hidden bg-white">
                        {story.coverImage ? (
                          <div className="w-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-1">
                            <Image
                              src={`data:image/jpeg;base64,${story.coverImage}`}
                              alt={story.title}
                              width={400}
                              height={300}
                              className="w-full h-auto object-contain rounded-sm shadow-sm"
                              style={{ 
                                maxHeight: '300px',
                                minHeight: '180px'
                              }}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-48 bg-gradient-to-br from-gray-50 to-gray-100">
                            <BookOpen className="h-12 w-12 text-gray-300" />
                          </div>
                        )}
                        <Button
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-80 hover:opacity-100"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            openDeleteDialog(story.storyId, story.title)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <CardContent className="p-4">
                        <Link href={`/preview/${story.storyId}`}>
                          <h3 className="font-semibold text-lg mb-1 hover:text-purple-600 transition-colors">
                            {story.title}
                          </h3>
                        </Link>
                        <p className="text-sm text-gray-500">
                          创建于 {formatTime(story.createdAt)}
                        </p>
                      </CardContent>
                      
                      <CardFooter className="px-4 py-3 bg-gray-50 flex justify-between">
                        <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                          {story.status === 'completed' ? '已完成' : '草稿'}
                        </span>
                        <div className="flex space-x-2">
                          <Link href={`/create?edit=${story.storyId}`}>
                            <Button variant="outline" size="sm" className="text-sm">
                              编辑
                            </Button>
                          </Link>
                          <Link href={`/preview/${story.storyId}`}>
                            <Button variant="ghost" size="sm" className="text-sm">
                              查看
                            </Button>
                          </Link>
                          <DownloadButton
                            storyId={story.storyId}
                            storyTitle={story.title}
                            variant="ghost"
                            size="sm"
                            showProgress={true}
                          />
                        </div>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
            
            {/* 分页控制 */}
            {(historyData?.totalPages || 0) > 1 && (
              <div className="flex justify-center mt-8">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    disabled={currentPage <= 1}
                    onClick={() => loadHistory(currentPage - 1)}
                  >
                    上一页
                  </Button>
                  <span className="px-4 py-2 bg-white rounded border">
                    {currentPage} / {historyData?.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={currentPage >= (historyData?.totalPages || 1)}
                    onClick={() => loadHistory(currentPage + 1)}
                  >
                    下一页
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除《{storyToDelete?.title}》吗？此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStory}
              className="bg-red-600 hover:bg-red-700"
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}