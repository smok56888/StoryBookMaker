import { NextRequest, NextResponse } from 'next/server'
import { generateImagePrompt } from '@/lib/arkApi'
import { loadCharacterAnalysis, loadStory, savePrompts } from '@/lib/storage'

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

    // 获取角色分析和故事内容
    const characters = loadCharacterAnalysis(storyId)
    const story = loadStory(storyId)

    if (!characters || !story) {
      return NextResponse.json(
        { error: '未找到相关故事数据' },
        { status: 404 }
      )
    }

    // 生成插图提示词
    const promptResult = await generateImagePrompt({
      storyId,
      characters,
      paragraphs: story.paragraphs,
      title: story.title
    })

    if (!promptResult.success || !promptResult.data) {
      return NextResponse.json(
        { error: promptResult.error || '提示词生成失败' },
        { status: 500 }
      )
    }

    // 保存提示词
    savePrompts(storyId, promptResult.data)

    return NextResponse.json({
      cover: promptResult.data.cover,
      pages: promptResult.data.pages,
      ending: promptResult.data.ending
    })

  } catch (error: any) {
    console.error('提示词生成接口错误:', error)
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    )
  }
}