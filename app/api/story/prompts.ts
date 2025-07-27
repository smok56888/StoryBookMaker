import { NextRequest } from 'next/server'
import { generateImagePrompt } from '@/lib/arkApi'
import fs from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { storyId } = body
    const storyDir = path.join(process.cwd(), 'data', storyId)
    // 读取故事内容和角色信息
    const storyRaw = await fs.readFile(path.join(storyDir, 'story.json'), 'utf-8')
    const charactersRaw = await fs.readFile(path.join(storyDir, 'characters.json'), 'utf-8')
    const storyObj = JSON.parse(storyRaw)
    const characters = JSON.parse(charactersRaw)
    // 调用大模型一次性生成所有页面提示词
    const promptRes = await generateImagePrompt({ storyId, story: JSON.stringify(storyObj), characters })
    // 缓存
    await fs.writeFile(path.join(storyDir, 'prompts.json'), JSON.stringify(promptRes, null, 2))
    // 返回
    return new Response(JSON.stringify(promptRes), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || '提示词生成失败' }), { status: 500 })
  }
} 