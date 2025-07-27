import { NextRequest } from 'next/server'
import { generateImage } from '@/lib/arkApi'
import fs from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { storyId, type, index, prompt, title } = body
    const imgRes = await generateImage({ prompt, type, storyId, title })
    // 缓存图片
    const storyDir = path.join(process.cwd(), 'data', storyId)
    await fs.mkdir(storyDir, { recursive: true })
    let fileName = ''
    if (type === 'cover') fileName = 'cover.png'
    else if (type === 'ending') fileName = 'ending.png'
    else fileName = `page_${index}.png`
    const base64 = imgRes.image?.replace(/^data:image\/\w+;base64,/, '')
    await fs.writeFile(path.join(storyDir, fileName), base64, 'base64')
    return new Response(JSON.stringify({ image: imgRes.image }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || '插图生成失败' }), { status: 500 })
  }
} 