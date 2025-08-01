import { NextRequest, NextResponse } from 'next/server'
import { generateImagePrompt, generateImagePromptFast } from '@/lib/arkApi'
import { loadCharacterAnalysis, loadStory, savePrompts } from '@/lib/storage'

// 强制动态渲染
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { storyId, mode = 'optimized' } = body // 添加mode参数，默认使用优化模式

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

    // 根据模式选择生成方式
    let promptResult
    if (mode === 'fast') {
      // 快速模式：单次调用，响应更快，但一致性较弱
      promptResult = await generateImagePromptFast({
        storyId,
        characters,
        paragraphs: story.paragraphs,
        title: story.title
      })
    } else {
      // 默认模式：一致性增强，确保人物形象统一
      promptResult = await generateImagePrompt({
        storyId,
        characters,
        paragraphs: story.paragraphs,
        title: story.title
      })
    }

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
      ending: promptResult.data.ending,
      mode: mode, // 返回使用的模式
      coreElements: promptResult.data.coreElements // 如果有的话
    })

  } catch (error: any) {
    console.error('提示词生成接口错误:', error)
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    )
  }
}