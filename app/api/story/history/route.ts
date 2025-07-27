import { NextRequest, NextResponse } from 'next/server'
import { getAllStories } from '@/lib/storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    
    // 获取历史绘本列表
    const result = getAllStories(page)
    
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('获取历史绘本列表错误:', error)
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    )
  }
}