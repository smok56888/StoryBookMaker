import { PDFDocument } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { getStoryDir } from './storage';

export interface StoryData {
  title: string;
  paragraphs: string[];
  images: {
    cover?: string;
    content: string[];
    ending?: string;
  };
}

export async function generateImageOnlyPDF(storyId: string, storyData: StoryData): Promise<Buffer> {
  try {
    console.log(`开始为故事 ${storyId} 生成PDF (仅图片方式)`);
    
    const pdfDoc = await PDFDocument.create();
    
    // A4页面尺寸
    const pageWidth = 595.28;
    const pageHeight = 841.89;
    
    // 封面页
    if (storyData.images.cover) {
      console.log('处理封面页');
      const coverPage = pdfDoc.addPage([pageWidth, pageHeight]);
      
      try {
        const coverImageBytes = Buffer.from(storyData.images.cover, 'base64');
        const coverImage = await pdfDoc.embedJpg(coverImageBytes);
        
        // 计算图片缩放比例以适应A4页面
        let imageWidth = pageWidth - 40; // 留出边距
        let imageHeight = (imageWidth * coverImage.height) / coverImage.width;
        
        // 如果高度超出页面，按高度缩放
        if (imageHeight > pageHeight - 40) {
          imageHeight = pageHeight - 40;
          imageWidth = (imageHeight * coverImage.width) / coverImage.height;
        }
        
        const x = (pageWidth - imageWidth) / 2;
        const y = (pageHeight - imageHeight) / 2;
        
        coverPage.drawImage(coverImage, {
          x,
          y,
          width: imageWidth,
          height: imageHeight,
        });
      } catch (error) {
        console.error('封面图片处理失败:', error);
      }
    }
    
    // 正文页 - 只显示图片
    console.log(`处理 ${storyData.paragraphs.length} 页正文`);
    for (let i = 0; i < storyData.paragraphs.length; i++) {
      const imageBase64 = storyData.images.content[i];
      
      if (imageBase64) {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        
        try {
          const imageBytes = Buffer.from(imageBase64, 'base64');
          const image = await pdfDoc.embedJpg(imageBytes);
          
          // 计算图片缩放比例以适应A4页面
          let imageWidth = pageWidth - 40; // 留出边距
          let imageHeight = (imageWidth * image.height) / image.width;
          
          // 如果高度超出页面，按高度缩放
          if (imageHeight > pageHeight - 40) {
            imageHeight = pageHeight - 40;
            imageWidth = (imageHeight * image.width) / image.height;
          }
          
          const x = (pageWidth - imageWidth) / 2;
          const y = (pageHeight - imageHeight) / 2;
          
          page.drawImage(image, {
            x,
            y,
            width: imageWidth,
            height: imageHeight,
          });
        } catch (error) {
          console.error(`第${i + 1}页图片处理失败:`, error);
        }
      }
    }
    
    // 结尾页
    if (storyData.images.ending) {
      console.log('处理结尾页');
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
      } catch (error) {
        console.error('结尾图片处理失败:', error);
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