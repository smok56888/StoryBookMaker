import { NextRequest } from 'next/server'
import { analyzeImage, generateStory } from '@/lib/arkApi'
import fs from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { characters, outline, style, count } = body
    // 1. 角色图片分析
    const analyzedCharacters = await Promise.all(
      characters.map(async (char: any) => {
        if (char.image) {
          const analysis = await analyzeImage(char.image)
          return { ...char, analysis }
        }
        return char
      })
    )
    // 2. 故事生成
    const storyRes = await generateStory({ characters: analyzedCharacters, outline, style, count })
    const storyId = `${Date.now()}${Math.floor(Math.random()*10000)}`
    // 3. 缓存到本地
    const storyDir = path.join(process.cwd(), 'data', storyId)
    await fs.mkdir(storyDir, { recursive: true })
    await fs.writeFile(path.join(storyDir, 'characters.json'), JSON.stringify(analyzedCharacters, null, 2))
    await fs.writeFile(path.join(storyDir, 'story.json'), JSON.stringify(storyRes, null, 2))
    // 4. 返回
    return new Response(JSON.stringify({ storyId, title: storyRes.data?.title || '', paragraphs: storyRes.data?.paragraphs || [] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || '生成失败' }), { status: 500 })
  }
} 