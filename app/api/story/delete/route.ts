import { NextRequest, NextResponse } from 'next/server'
import { deleteStory } from '@/lib/storage'

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { storyId } = body
    
    if (!storyId) {
      return NextResponse.json(
        { error: '故事ID不能为空' },
        { status: 400 }
      )
    }
    
    // 删除绘本
    const success = deleteStory(storyId)
    
    if (!success) {
      return NextResponse.json(
        { error: '删除绘本失败，可能是绘本不存在或已被删除' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('删除绘本错误:', error)
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    )
  }
}