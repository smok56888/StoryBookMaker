import { NextRequest, NextResponse } from 'next/server';
import { getStory } from '@/lib/storage';
import { PDFGenerator } from '@/lib/pdfGenerator';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storyId = searchParams.get('storyId');

    if (!storyId) {
      return NextResponse.json(
        { error: '故事ID不能为空' },
        { status: 400 }
      );
    }

    // 每次下载都重新生成PDF，确保获取最新内容
    console.log('🔄 每次下载都重新生成PDF，确保内容最新');

    // 获取完整的故事数据
    const storyData = getStory(storyId);
    if (!storyData) {
      return NextResponse.json(
        { error: '未找到相关故事数据' },
        { status: 404 }
      );
    }

    // 生成PDF
    try {
      console.log('🚀 开始生成PDF，启动浏览器...');
      
      // 将故事数据转换为适合PDF生成的格式
      const story = {
        id: storyId,
        title: storyData.title,
        pages: storyData.paragraphs.map((paragraph: string, index: number) => ({
          id: index + 1,
          content: paragraph,
          imageUrl: storyData.images.content[index] ? 
            `data:image/jpeg;base64,${storyData.images.content[index]}` : ''
        })),
        totalPages: storyData.paragraphs.length,
        coverImage: storyData.images.cover ? 
          `data:image/jpeg;base64,${storyData.images.cover}` : undefined,
        endingPage: storyData.images.ending ? {
          imageUrl: `data:image/jpeg;base64,${storyData.images.ending}`
        } : undefined
      };
      
      let pdfBuffer;
      
      try {
        // 优先使用简单PDF生成方式，更稳定
        const { generateSimplePDF } = await import('@/lib/simplePdfGenerator');
        pdfBuffer = await generateSimplePDF(storyId, storyData);
        console.log('✅ 简单PDF生成成功');
      } catch (simpleError) {
        console.error('❌ 简单PDF生成失败，尝试使用Puppeteer方案:', simpleError);
        
        // 如果简单方式失败，尝试使用Puppeteer生成PDF
        const pdfGenerator = new PDFGenerator();
        pdfBuffer = await pdfGenerator.generatePDF(story);
        console.log('✅ Puppeteer PDF生成成功');
      }
      
      // 不再保存PDF文件到本地，每次都重新生成并直接返回
      console.log('✅ PDF生成完成，准备下载');
      
      // 生成文件名：yyyyMMddHHmm-[故事名].pdf
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      const dateTimeStr = `${year}${month}${day}${hour}${minute}`;
      
      const storyTitle = storyData.title || '未命名故事';
      
      // 清理文件名中的特殊字符，保留中文字符
      const cleanTitle = storyTitle
        .replace(/[<>:"/\\|?*\[\]]/g, '') // 移除文件系统不支持的字符
        .replace(/\s+/g, '') // 移除空格
        .replace(/【|】|《|》/g, '') // 移除中文书名号
        .trim();
      
      // 文件名格式：yyyyMMddHHmm-[故事名].pdf
      const filename = `${dateTimeStr}-${cleanTitle}.pdf`;
      
      console.log(`📄 生成PDF文件名: ${filename}`);
      
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`
        }
      });
    } catch (pdfError: any) {
      console.error('PDF生成失败:', pdfError.message);
      
      // 如果PDF生成失败，返回错误信息
      return NextResponse.json(
        { error: `PDF生成失败: ${pdfError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('PDF生成接口错误:', error);
    return NextResponse.json(
      { error: error.message || '服务器内部错误' },
      { status: 500 }
    );
  }
}