import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/arkApi'
import { saveImage, deletePdf } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    console.log('图片生成API被调用')
    
    const body = await request.json()
    console.log('请求体:', JSON.stringify({
      storyId: body.storyId,
      type: body.type,
      index: body.index,
      title: body.title,
      promptLength: body.prompt?.length
    }, null, 2))
    
    const { storyId, type, index, prompt, title } = body

    if (!storyId || !type || !prompt) {
      console.error('参数不完整:', { storyId, type, promptExists: !!prompt })
      return NextResponse.json(
        { error: '参数不完整' },
        { status: 400 }
      )
    }

    // 验证类型
    if (!['cover', 'content', 'ending'].includes(type)) {
      console.error('无效的图片类型:', type)
      return NextResponse.json(
        { error: '无效的图片类型' },
        { status: 400 }
      )
    }

    // 如果是正文页，需要提供索引
    if (type === 'content' && (index === undefined || index < 0)) {
      console.error('正文页缺少有效索引:', index)
      return NextResponse.json(
        { error: '正文页需要提供有效的索引' },
        { status: 400 }
      )
    }

    console.log('开始生成图片...')
    
    // 生成图片
    const imageResult = await generateImage({
      prompt,
      type,
      storyId,
      title: title || '绘本故事'
    })

    if (!imageResult.success || !imageResult.data) {
      console.error('图片生成失败:', imageResult.error)
      return NextResponse.json(
        { error: imageResult.error || '图片生成失败' },
        { status: 500 }
      )
    }

    console.log('图片生成成功，图片大小:', imageResult.data.image.length)
    
    // 保存图片
    const savedPath = saveImage(storyId, type, imageResult.data.image, type === 'content' ? index : undefined)
    console.log('图片已保存到:', savedPath)
    
    // 删除可能存在的PDF文件（因为内容已更新，需要重新生成）
    deletePdf(storyId)
    console.log('已删除旧的PDF文件')

    return NextResponse.json({
      image: imageResult.data.image
    })

  } catch (error: any) {
    console.error('图片生成接口错误:', error)
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    )
  }
}