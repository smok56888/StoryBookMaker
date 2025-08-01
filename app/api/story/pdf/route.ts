import { NextRequest, NextResponse } from 'next/server';
import { getStory } from '@/lib/storage';
import { PDFGenerator } from '@/lib/pdfGenerator';

// 强制动态渲染
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

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
      console.log('🚀 [PDF生成] 开始生成PDF流程');
      console.log('📊 [PDF生成] 故事数据统计:', {
        storyId,
        title: storyData.title,
        paragraphsCount: storyData.paragraphs.length,
        hasCoverImage: !!storyData.images.cover,
        hasEndingImage: !!storyData.images.ending,
        contentImagesCount: storyData.images.content.filter(img => img).length
      });
      
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
      let usedGenerator = '';
      
      try {
        console.log('🎯 [PDF生成] 尝试使用主要生成器: PDFGenerator (lib/pdfGenerator.ts)');
        const pdfGenerator = new PDFGenerator();
        console.log('📝 [PDF生成] PDFGenerator实例创建成功');
        
        const startTime = Date.now();
        pdfBuffer = await pdfGenerator.generatePDF(story);
        const duration = Date.now() - startTime;
        
        usedGenerator = 'PDFGenerator (lib/pdfGenerator.ts)';
        console.log(`✅ [PDF生成] PDFGenerator生成成功，耗时: ${duration}ms`);
        console.log(`📄 [PDF生成] 生成的PDF大小: ${pdfBuffer.length} bytes`);
      } catch (puppeteerError) {
        console.error('❌ [PDF生成] PDFGenerator生成失败:', puppeteerError);
        console.log('🔄 [PDF生成] 尝试使用备用生成器: simplePdfGenerator');
        
        try {
          const { generateSimplePDF } = await import('@/lib/simplePdfGenerator');
          const startTime = Date.now();
          pdfBuffer = await generateSimplePDF(storyId, storyData);
          const duration = Date.now() - startTime;
          
          usedGenerator = 'generateSimplePDF (lib/simplePdfGenerator.ts)';
          console.log(`✅ [PDF生成] simplePdfGenerator生成成功，耗时: ${duration}ms`);
          console.log(`📄 [PDF生成] 生成的PDF大小: ${pdfBuffer.length} bytes`);
        } catch (simpleError) {
          console.error('❌ [PDF生成] simplePdfGenerator也失败:', simpleError);
          throw new Error(`所有PDF生成方案都失败: 主要方案(${puppeteerError.message}), 备用方案(${simpleError.message})`);
        }
      }
      
      console.log(`🎉 [PDF生成] 最终使用的生成器: ${usedGenerator}`);
      
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