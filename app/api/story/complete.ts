import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { storyId } = body
    const storyDir = path.join(process.cwd(), 'data', storyId)
    // 标记状态
    await fs.writeFile(path.join(storyDir, 'status.txt'), 'completed')
    // 若已生成PDF则无需处理，否则后续下载时生成
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || '完成创作失败' }), { status: 500 })
  }
} 