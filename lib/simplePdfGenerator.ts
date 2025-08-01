import fs from 'fs';
import path from 'path';
import { getStoryDir } from './storage';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface StoryData {
  title: string;
  paragraphs: string[];
  images: {
    cover?: string;
    content: string[];
    ending?: string;
  };
}

export async function generateSimplePDF(storyId: string, storyData: StoryData): Promise<Buffer> {
  try {
    console.log(`🚀 [SimplePDF] 开始为故事 ${storyId} 生成简单PDF`);
    console.log('📊 [SimplePDF] 输入数据统计:', {
      title: storyData.title,
      paragraphsCount: storyData.paragraphs.length,
      hasCoverImage: !!storyData.images.cover,
      hasEndingImage: !!storyData.images.ending,
      contentImagesCount: storyData.images.content.filter(img => img).length
    });
    
    console.log('📄 [SimplePDF] 创建PDF文档...');
    const pdfDoc = await PDFDocument.create();
    
    // 尝试嵌入中文字体，如果失败则使用默认字体
    console.log('🔤 [SimplePDF] 嵌入字体...');
    let font;
    
    try {
      // 尝试加载系统中文字体
      const chineseFontPaths = [
        '/usr/share/fonts/chinese/NotoSansCJK.ttc',
        '/usr/share/fonts/chinese/wqy-microhei.ttc',
        '/usr/share/fonts/truetype/wqy/wqy-microhei.ttc',
        '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
        '/System/Library/Fonts/PingFang.ttc', // macOS
        'C:\\Windows\\Fonts\\msyh.ttc' // Windows
      ];
      
      let fontLoaded = false;
      for (const fontPath of chineseFontPaths) {
        if (fs.existsSync(fontPath)) {
          try {
            console.log(`🔤 [SimplePDF] 尝试加载中文字体: ${fontPath}`);
            const fontBytes = fs.readFileSync(fontPath);
            font = await pdfDoc.embedFont(fontBytes);
            console.log(`✅ [SimplePDF] 中文字体加载成功: ${fontPath}`);
            fontLoaded = true;
            break;
          } catch (error) {
            console.log(`⚠️ [SimplePDF] 字体加载失败: ${fontPath}, 错误: ${error.message}`);
            continue;
          }
        }
      }
      
      if (!fontLoaded) {
        throw new Error('未找到可用的中文字体');
      }
    } catch (error) {
      console.log('⚠️ [SimplePDF] 中文字体加载失败，使用默认字体:', error.message);
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }
    
    // A4页面尺寸
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    console.log(`📐 [SimplePDF] 页面尺寸: ${pageWidth}x${pageHeight}`);
    
    // 封面页
    const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // 处理封面图片
    if (storyData.images.cover) {
      try {
        const coverImageBytes = Buffer.from(storyData.images.cover, 'base64');
        const coverImage = await pdfDoc.embedJpg(coverImageBytes);
        
        // 计算图片缩放比例以适应A4页面
        let imageWidth = pageWidth - 40;
        let imageHeight = (imageWidth * coverImage.height) / coverImage.width;
        
        // 如果高度超出页面，按高度缩放
        if (imageHeight > pageHeight - 100) {
          imageHeight = pageHeight - 100;
          imageWidth = (imageHeight * coverImage.width) / coverImage.height;
        }
        
        const x = (pageWidth - imageWidth) / 2;
        const y = (pageHeight - imageHeight) / 2 + 20;
        
        coverPage.drawImage(coverImage, {
          x,
          y,
          width: imageWidth,
          height: imageHeight,
        });
        
        // 在封面底部添加标题
        const titleWidth = font.widthOfTextAtSize(storyData.title, 24);
        coverPage.drawText(storyData.title, {
          x: (pageWidth - titleWidth) / 2,
          y: 50,
          size: 24,
          font,
          color: rgb(0, 0, 0),
        });
      } catch (error) {
        console.error('封面图片处理失败:', error);
        // 如果图片处理失败，显示标题
        const titleWidth = font.widthOfTextAtSize(storyData.title, 36);
        coverPage.drawText(storyData.title, {
          x: (pageWidth - titleWidth) / 2,
          y: pageHeight / 2,
          size: 36,
          font,
          color: rgb(0, 0, 0),
        });
      }
    } else {
      // 如果没有封面图片，创建一个简单的封面
      const titleWidth = font.widthOfTextAtSize(storyData.title, 36);
      coverPage.drawText(storyData.title, {
        x: (pageWidth - titleWidth) / 2,
        y: pageHeight / 2,
        size: 36,
        font,
        color: rgb(0, 0, 0),
      });
    }
    
    // 正文页
    for (let i = 0; i < storyData.paragraphs.length; i++) {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      const paragraph = storyData.paragraphs[i];
      const imageBase64 = storyData.images.content[i];
      
      // 添加页面背景
      page.drawRectangle({
        x: 0,
        y: 0,
        width: pageWidth,
        height: pageHeight,
        color: rgb(0.98, 0.98, 0.98),
      });
      
      // 图片区域（上方）- 缩减上方空间
      const imageAreaHeight = 450; // 增加图片区域高度
      
      if (imageBase64) {
        try {
          const imageBytes = Buffer.from(imageBase64, 'base64');
          const image = await pdfDoc.embedJpg(imageBytes);
          
          // 图片尺寸计算（缩减上方空间到1/2）
          const imageWidth = pageWidth - 60;
          const imageHeight = Math.min(imageAreaHeight - 15, (imageWidth * image.height) / image.width);
          
          page.drawImage(image, {
            x: 30,
            y: pageHeight - 15 - imageHeight, // 缩减上方空间
            width: imageWidth,
            height: imageHeight,
          });
        } catch (error) {
          console.error(`第${i + 1}页图片处理失败:`, error);
        }
      }
      
      // 文字区域（下方）- 调大文字区域，添加白色60%透明背景
      const textY = pageHeight - imageAreaHeight - 15;
      const textWidth = pageWidth - 90; // 左右各15px边距，再加上背景区域的15px内边距
      
      // 文本处理
      const fontSize = 16;
      const lineHeight = fontSize * 1.5;
      const maxCharsPerLine = Math.floor(textWidth / (fontSize * 0.7));
      
      const lines: string[] = [];
      let currentLine = '';
      
      // 文本分行处理
      for (const char of paragraph) {
        if (currentLine.length >= maxCharsPerLine) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine += char;
        }
      }
      
      // 添加最后一行
      if (currentLine) {
        lines.push(currentLine);
      }
      
      // 绘制文字背景（白色60%透明度，15px边距）
      const textAreaHeight = Math.min(lines.length * lineHeight + 30, textY - 45); // 确保不超出页面
      page.drawRectangle({
        x: 15,
        y: textY - textAreaHeight,
        width: pageWidth - 30,
        height: textAreaHeight,
        color: rgb(1, 1, 1), // 白色
        opacity: 0.6,
      });
      
      // 绘制文字
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const y = textY - 15 - (lineIndex * lineHeight); // 15px内边距
        if (y > 45) { // 确保不超出页面底部
          page.drawText(lines[lineIndex], {
            x: 30, // 15px外边距 + 15px内边距
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
          });
        }
      }
      
      // 添加页码（右下角）
      const pageNumberText = `${i + 1}`;
      const pageNumberWidth = font.widthOfTextAtSize(pageNumberText, 12);
      
      // 绘制页码背景圆圈
      page.drawCircle({
        x: pageWidth - 45, // 距离右边缘45px
        y: 30, // 距离底部30px
        size: 15,
        color: rgb(1, 1, 1), // 白色
        opacity: 0.8,
      });
      
      page.drawText(pageNumberText, {
        x: pageWidth - 45 - pageNumberWidth / 2,
        y: 25,
        size: 12,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    
    // 结尾页
    if (storyData.images.ending) {
      const endingPage = pdfDoc.addPage([pageWidth, pageHeight]);
      
      try {
        const endingImageBytes = Buffer.from(storyData.images.ending, 'base64');
        const endingImage = await pdfDoc.embedJpg(endingImageBytes);
        
        // 计算图片缩放比例以适应A4页面
        let imageWidth = pageWidth - 40;
        let imageHeight = (imageWidth * endingImage.height) / endingImage.width;
        
        // 如果高度超出页面，按高度缩放
        if (imageHeight > pageHeight - 40) {
          imageHeight = pageHeight - 40;
          imageWidth = (imageHeight * endingImage.width) / endingImage.height;
        }
        
        const x = (pageWidth - imageWidth) / 2;
        const y = (pageHeight - imageHeight) / 2;
        
        endingPage.drawImage(endingImage, {
          x,
          y,
          width: imageWidth,
          height: imageHeight,
        });
        
        // 在底部添加"故事结束"文字
        const endText = "故事结束";
        const endTextWidth = font.widthOfTextAtSize(endText, 18);
        endingPage.drawText(endText, {
          x: (pageWidth - endTextWidth) / 2,
          y: 30,
          size: 18,
          font,
          color: rgb(0, 0, 0),
        });
      } catch (error) {
        console.error('结尾图片处理失败:', error);
        // 如果图片处理失败，显示"故事结束"
        const endText = "故事结束";
        const endTextWidth = font.widthOfTextAtSize(endText, 24);
        endingPage.drawText(endText, {
          x: (pageWidth - endTextWidth) / 2,
          y: pageHeight / 2,
          size: 24,
          font,
          color: rgb(0, 0, 0),
        });
      }
    }
    
    console.log('保存PDF文件');
    const pdfBytes = await pdfDoc.save();
    
    // 确保故事目录存在
    const storyDir = getStoryDir(storyId);
    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir, { recursive: true });
    }
    
    // 保存PDF文件到本地
    const pdfPath = path.join(storyDir, 'story.pdf');
    fs.writeFileSync(pdfPath, pdfBytes);
    
    console.log(`PDF生成成功，保存到: ${pdfPath}`);
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('PDF生成过程中发生错误:', error);
    throw error;
  }
}