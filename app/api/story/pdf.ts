import { NextRequest } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { createPdf } from '@/lib/pdfUtil'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storyId = searchParams.get('storyId')
    if (!storyId) return new Response('Missing storyId', { status: 400 })
    const storyDir = path.join(process.cwd(), 'data', storyId)
    const pdfPath = path.join(storyDir, 'story.pdf')
    let pdfBuffer: Buffer
    try {
      pdfBuffer = await fs.readFile(pdfPath)
    } catch {
      // 不存在则生成
      pdfBuffer = await createPdf(storyDir)
      await fs.writeFile(pdfPath, pdfBuffer)
    }
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=storybook_${storyId}.pdf`,
      },
    })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'PDF下载失败' }), { status: 500 })
  }
} 