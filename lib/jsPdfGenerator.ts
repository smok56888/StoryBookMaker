import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
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

export async function generatePDFWithJsPDF(storyId: string, storyData: StoryData): Promise<Buffer> {
  try {
    console.log(`开始为故事 ${storyId} 生成PDF (jsPDF方式)`);
    
    // 确保故事目录存在
    const storyDir = getStoryDir(storyId);
    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir, { recursive: true });
    }
    
    // 创建PDF文档
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // 添加中文字体支持
    try {
      const fontPath = path.join(process.cwd(), 'public/fonts/SourceHanSansCN-Regular.ttf');
      if (fs.existsSync(fontPath)) {
        const fontBytes = fs.readFileSync(fontPath);
        const fontBase64 = fontBytes.toString('base64');
        
        // 添加字体到PDF
        doc.addFileToVFS('SourceHanSansCN-Regular.ttf', fontBase64);
        doc.addFont('SourceHanSansCN-Regular.ttf', 'SourceHanSansCN', 'normal');
        doc.setFont('SourceHanSansCN');
        
        console.log('成功加载中文字体');
      } else {
        console.warn('中文字体文件不存在，使用默认字体');
        doc.setFont('helvetica');
      }
    } catch (fontError) {
      console.error('加载中文字体失败，使用默认字体:', fontError);
      doc.setFont('helvetica');
    }
    
    // A4页面尺寸
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20; // 页边距
    
    // 封面页
    if (storyData.images.cover) {
      console.log('处理封面页');
      
      try {
        // 添加封面图片
        const imgData = `data:image/jpeg;base64,${storyData.images.cover}`;
        
        // 计算图片尺寸
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (pageHeight - 2 * margin) * 0.7; // 图片占页面高度的70%
        
        // 添加图片
        doc.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
        
        // 添加标题
        doc.setFontSize(24);
        doc.text(storyData.title, pageWidth / 2, margin + imgHeight + 20, { align: 'center' });
      } catch (error) {
        console.error('封面图片处理失败:', error);
        
        // 如果图片处理失败，只显示标题
        doc.setFontSize(30);
        doc.text(storyData.title, pageWidth / 2, pageHeight / 2, { align: 'center' });
      }
      
      // 添加新页
      doc.addPage();
    } else {
      // 如果没有封面图片，创建一个简单的封面
      console.log('创建默认封面页');
      doc.setFontSize(30);
      doc.text(storyData.title, pageWidth / 2, pageHeight / 2, { align: 'center' });
      doc.addPage();
    }
    
    // 正文页
    console.log(`处理 ${storyData.paragraphs.length} 页正文`);
    for (let i = 0; i < storyData.paragraphs.length; i++) {
      const paragraph = storyData.paragraphs[i];
      const imageBase64 = storyData.images.content[i];
      
      // 添加图片
      if (imageBase64) {
        try {
          const imgData = `data:image/jpeg;base64,${imageBase64}`;
          
          // 计算图片尺寸
          const imgWidth = pageWidth - 2 * margin;
          const imgHeight = (pageHeight - 2 * margin) * 0.5; // 图片占页面高度的50%
          
          // 添加图片
          doc.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
          
          // 添加文本
          doc.setFontSize(12);
          
          // 分段处理文本，避免文本溢出
          const textY = margin + imgHeight + 10;
          const textWidth = pageWidth - 2 * margin;
          const textLines = doc.splitTextToSize(paragraph, textWidth);
          
          // 检查是否需要新页
          if (textY + textLines.length * 7 > pageHeight - margin) {
            // 如果文本太长，添加新页
            doc.addPage();
            doc.text(textLines, margin, margin);
          } else {
            doc.text(textLines, margin, textY);
          }
          
          // 添加页码
          doc.setFontSize(10);
          doc.text(`${i + 1} / ${storyData.paragraphs.length}`, pageWidth - margin, pageHeight - margin);
        } catch (error) {
          console.error(`第${i + 1}页图片处理失败:`, error);
          
          // 如果图片处理失败，只显示文本
          doc.setFontSize(12);
          const textLines = doc.splitTextToSize(paragraph, pageWidth - 2 * margin);
          doc.text(textLines, margin, margin);
          
          // 添加页码
          doc.setFontSize(10);
          doc.text(`${i + 1} / ${storyData.paragraphs.length}`, pageWidth - margin, pageHeight - margin);
        }
      } else {
        // 如果没有图片，只显示文本
        doc.setFontSize(12);
        const textLines = doc.splitTextToSize(paragraph, pageWidth - 2 * margin);
        doc.text(textLines, margin, margin);
        
        // 添加页码
        doc.setFontSize(10);
        doc.text(`${i + 1} / ${storyData.paragraphs.length}`, pageWidth - margin, pageHeight - margin);
      }
      
      // 如果不是最后一页，添加新页
      if (i < storyData.paragraphs.length - 1) {
        doc.addPage();
      }
    }
    
    // 结尾页
    if (storyData.images.ending) {
      console.log('处理结尾页');
      
      // 添加新页
      doc.addPage();
      
      try {
        // 添加结尾图片
        const imgData = `data:image/jpeg;base64,${storyData.images.ending}`;
        
        // 计算图片尺寸
        const imgWidth = pageWidth - 2 * margin;
        const imgHeight = (pageHeight - 2 * margin) * 0.7; // 图片占页面高度的70%
        
        // 添加图片
        doc.addImage(imgData, 'JPEG', margin, margin, imgWidth, imgHeight);
        
        // 添加"故事结束"文本
        doc.setFontSize(18);
        doc.text('故事结束', pageWidth / 2, margin + imgHeight + 20, { align: 'center' });
      } catch (error) {
        console.error('结尾图片处理失败:', error);
        
        // 如果图片处理失败，只显示"故事结束"
        doc.setFontSize(24);
        doc.text('故事结束', pageWidth / 2, pageHeight / 2, { align: 'center' });
      }
    }
    
    // 保存PDF
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    
    // 保存PDF文件到本地
    const pdfPath = path.join(storyDir, 'story.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    console.log(`PDF生成成功，保存到: ${pdfPath}`);
    return pdfBuffer;
  } catch (error) {
    console.error('PDF生成过程中发生错误:', error);
    throw error;
  }
}