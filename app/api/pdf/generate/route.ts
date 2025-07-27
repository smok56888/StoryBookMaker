import { NextRequest, NextResponse } from 'next/server';
import { generatePDFWithPuppeteer } from '@/lib/puppeteerPdfGenerator';
import path from 'path';
import fs from 'fs';
import os from 'os';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    if (!data || !data.title || !data.paragraphs) {
      return NextResponse.json(
        { error: '缺少必要的数据' },
        { status: 400 }
      );
    }
    
    // 生成临时ID
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // 创建临时目录
    const tempDir = path.join(os.tmpdir(), tempId);
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // 生成PDF
    const pdfBuffer = await generatePDFWithPuppeteer(tempId, {
      title: data.title,
      paragraphs: data.paragraphs,
      images: data.images || {
        content: []
      }
    });
    
    // 返回PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="story_${tempId}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('PDF生成接口错误:', error);
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}