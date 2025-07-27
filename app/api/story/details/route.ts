import { NextRequest, NextResponse } from 'next/server'
import { getStory } from '@/lib/storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const storyId = searchParams.get('storyId')

    if (!storyId) {
      return NextResponse.json(
        { error: '故事ID不能为空' },
        { status: 400 }
      )
    }

    // 获取故事详情
    const storyData = getStory(storyId)
    
    if (!storyData) {
      return NextResponse.json(
        { error: '未找到相关故事数据' },
        { status: 404 }
      )
    }

    return NextResponse.json(storyData)
  } catch (error: any) {
    console.error('获取故事详情接口错误:', error)
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    )
  }
}