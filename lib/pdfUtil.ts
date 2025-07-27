import fs from 'fs/promises'
import path from 'path'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export async function createPdf(storyDir: string): Promise<Buffer> {
  // 读取数据
  const storyRaw = await fs.readFile(path.join(storyDir, 'story.json'), 'utf-8')
  const storyObj = JSON.parse(storyRaw)
  const promptsRaw = await fs.readFile(path.join(storyDir, 'prompts.json'), 'utf-8').catch(() => '{}')
  const prompts = JSON.parse(promptsRaw)
  // 读取图片
  const coverImg = await fs.readFile(path.join(storyDir, 'cover.png')).catch(() => null)
  const endingImg = await fs.readFile(path.join(storyDir, 'ending.png')).catch(() => null)
  const contentImgs: Buffer[] = []
  for (let i = 0; i < storyObj.paragraphs.length; i++) {
    const img = await fs.readFile(path.join(storyDir, `page_${i}.png`)).catch(() => null)
    contentImgs.push(img)
  }
  // 创建PDF
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  // 封面页
  if (coverImg && Buffer.isBuffer(coverImg)) {
    const img = await pdfDoc.embedPng(coverImg)
    const page = pdfDoc.addPage([595, 842]) // A4
    page.drawImage(img, { x: 0, y: 0, width: 595, height: 842 })
    // 标题
    page.drawText(storyObj.title || '', {
      x: 40, y: 780, size: 32, font, color: rgb(0.2,0.1,0.5)
    })
  }
  // 正文页
  for (let i = 0; i < storyObj.paragraphs.length; i++) {
    const page = pdfDoc.addPage([595, 842])
    // 图片
    if (contentImgs[i] && Buffer.isBuffer(contentImgs[i])) {
      const img = await pdfDoc.embedPng(contentImgs[i])
      page.drawImage(img, { x: 30, y: 470, width: 535, height: 320 })
    }
    // 渐变底色（简化为浅色填充）
    page.drawRectangle({ x: 30, y: 60, width: 535, height: 370, color: rgb(0.98,0.96,1) })
    // 文字
    page.drawText(storyObj.paragraphs[i] || '', {
      x: 40, y: 370, size: 18, font, color: rgb(0.1,0.1,0.1), maxWidth: 515, lineHeight: 27
    })
  }
  // 结尾页
  if (endingImg && Buffer.isBuffer(endingImg)) {
    const img = await pdfDoc.embedPng(endingImg)
    const page = pdfDoc.addPage([595, 842])
    page.drawImage(img, { x: 0, y: 0, width: 595, height: 842 })
  }
  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
} 