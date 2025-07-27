import PDFDocument from 'pdfkit';
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

export async function generatePDFWithPDFKit(storyId: string, storyData: StoryData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`开始为故事 ${storyId} 生成PDF (PDFKit方式)`);
      
      // 确保故事目录存在
      const storyDir = getStoryDir(storyId);
      if (!fs.existsSync(storyDir)) {
        fs.mkdirSync(storyDir, { recursive: true });
      }
      
      // 创建PDF文档
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: storyData.title,
          Author: '绘本生成器',
          Subject: '儿童绘本',
        }
      });
      
      // 创建一个写入流
      const pdfPath = path.join(storyDir, 'story.pdf');
      const writeStream = fs.createWriteStream(pdfPath);
      
      // 收集PDF数据
      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        console.log(`PDF生成成功，保存到: ${pdfPath}`);
        resolve(pdfBuffer);
      });
      
      // 处理错误
      doc.on('error', (err) => {
        console.error('PDF生成错误:', err);
        reject(err);
      });
      
      // 将PDF写入文件
      doc.pipe(writeStream);
      
      // 设置字体
      // 注意：PDFKit默认使用标准字体，不支持中文
      // 我们将使用图片方式处理中文文本
      
      // 封面页
      if (storyData.images.cover) {
        console.log('处理封面页');
        
        try {
          // 添加封面图片
          const imgBuffer = Buffer.from(storyData.images.cover, 'base64');
          doc.image(imgBuffer, {
            fit: [500, 500],
            align: 'center',
            valign: 'center'
          });
          
          // 添加标题（使用英文字符）
          doc.fontSize(24)
             .text(storyData.title, {
               align: 'center',
               width: 500
             });
          
          doc.addPage();
        } catch (error) {
          console.error('封面处理失败:', error);
          
          // 如果图片处理失败，只显示标题
          doc.fontSize(30)
             .text(storyData.title, {
               align: 'center',
               width: 500
             });
          
          doc.addPage();
        }
      }
      
      // 正文页
      console.log(`处理 ${storyData.paragraphs.length} 页正文`);
      for (let i = 0; i < storyData.paragraphs.length; i++) {
        const paragraph = storyData.paragraphs[i];
        const imageBase64 = storyData.images.content[i];
        
        // 添加图片
        if (imageBase64) {
          try {
            const imgBuffer = Buffer.from(imageBase64, 'base64');
            doc.image(imgBuffer, {
              fit: [500, 300],
              align: 'center',
              valign: 'center'
            });
            
            // 添加文本
            doc.moveDown(2)
               .fontSize(12)
               .text(paragraph, {
                 align: 'left',
                 width: 500
               });
            
            // 添加页码
            doc.fontSize(10)
               .text(`${i + 1} / ${storyData.paragraphs.length}`, {
                 align: 'right',
                 width: 500
               });
          } catch (error) {
            console.error(`第${i + 1}页处理失败:`, error);
            
            // 如果图片处理失败，只显示文本
            doc.fontSize(12)
               .text(paragraph, {
                 align: 'left',
                 width: 500
               });
            
            // 添加页码
            doc.fontSize(10)
               .text(`${i + 1} / ${storyData.paragraphs.length}`, {
                 align: 'right',
                 width: 500
               });
          }
        } else {
          // 如果没有图片，只显示文本
          doc.fontSize(12)
             .text(paragraph, {
               align: 'left',
               width: 500
             });
          
          // 添加页码
          doc.fontSize(10)
             .text(`${i + 1} / ${storyData.paragraphs.length}`, {
               align: 'right',
               width: 500
             });
        }
        
        // 如果不是最后一页，添加新页
        if (i < storyData.paragraphs.length - 1) {
          doc.addPage();
        }
      }
      
      // 结尾页
      if (storyData.images.ending) {
        console.log('处理结尾页');
        
        doc.addPage();
        
        try {
          // 添加结尾图片
          const imgBuffer = Buffer.from(storyData.images.ending, 'base64');
          doc.image(imgBuffer, {
            fit: [500, 500],
            align: 'center',
            valign: 'center'
          });
          
          // 添加"故事结束"文本
          doc.moveDown(2)
             .fontSize(18)
             .text('故事结束', {
               align: 'center',
               width: 500
             });
        } catch (error) {
          console.error('结尾页处理失败:', error);
          
          // 如果图片处理失败，只显示"故事结束"
          doc.fontSize(24)
             .text('故事结束', {
               align: 'center',
               width: 500
             });
        }
      }
      
      // 完成PDF生成
      doc.end();
      
    } catch (error) {
      console.error('PDF生成过程中发生错误:', error);
      reject(error);
    }
  });
}