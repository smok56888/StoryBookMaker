import { NextRequest, NextResponse } from 'next/server'
import { loadStory, saveStory } from '@/lib/storage'

// 强制动态渲染
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storyId, title } = body

    if (!storyId) {
      return NextResponse.json(
        { error: '故事ID不能为空' },
        { status: 400 }
      )
    }

    if (!title || title.trim() === '') {
      return NextResponse.json(
        { error: '标题不能为空' },
        { status: 400 }
      )
    }

    // 加载现有故事
    const existingStory = loadStory(storyId)
    if (!existingStory) {
      return NextResponse.json(
        { error: '故事不存在' },
        { status: 404 }
      )
    }

    // 更新标题并保存
    const updatedStory = {
      ...existingStory,
      title: title.trim()
    }
    
    saveStory(storyId, updatedStory)

    return NextResponse.json({
      success: true,
      title: updatedStory.title
    })

  } catch (error: any) {
    console.error('更新故事标题失败:', error)
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    )
  }
}