import { NextRequest, NextResponse } from 'next/server'
import { saveStoryStatus } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storyId } = body

    if (!storyId) {
      return NextResponse.json(
        { error: '故事ID不能为空' },
        { status: 400 }
      )
    }

    // 更新故事状态为已完成
    saveStoryStatus(storyId, 'completed')

    return NextResponse.json({
      success: true
    })

  } catch (error: any) {
    console.error('完成创作接口错误:', error)
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    )
  }
}