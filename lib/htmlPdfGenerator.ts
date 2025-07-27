import pdf from 'html-pdf';
import fs from 'fs';
import path from 'path';
import { getStoryDir } from './storage';
import ejs from 'ejs';

export interface StoryData {
  title: string;
  paragraphs: string[];
  images: {
    cover?: string;
    content: string[];
    ending?: string;
  };
}

// HTML模板
const pdfTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title><%= title %></title>
  <style>
    @page {
      size: A4;
      margin: 8px;
    }
    body {
      font-family: "Microsoft YaHei", "SimSun", sans-serif;
      margin: 0;
      padding: 0;
      color: #333;
    }
    .page {
      width: 210mm;
      height: 297mm;
      padding: 15mm;
      box-sizing: border-box;
      page-break-after: always;
      position: relative;
      overflow: hidden;
    }
    .cover {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      background-color: #f9f9f9;
      position: relative;
    }
    .cover-image {
      max-width: 80%;
      max-height: 70%;
      object-fit: contain;
      margin-bottom: 30px;
    }
    .cover-title {
      font-size: 32px;
      font-weight: bold;
      text-align: center;
      margin-top: 20px;
      color: #333;
      text-shadow: 1px 1px 3px rgba(0,0,0,0.1);
    }
    .content-page {
      display: grid;
      grid-template-rows: 1fr 1fr;
      height: 100%;
      background-color: #fff;
      background-image: linear-gradient(to bottom, #f9f9f9, #ffffff);
    }
    .image-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 10px;
    }
    .content-image {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .text-container {
      padding: 20px;
      font-size: 16px;
      line-height: 1.6;
    }
    .page-number {
      position: absolute;
      bottom: 10mm;
      right: 10mm;
      font-size: 12px;
      color: #888;
    }
    .ending-page {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      background-color: #f9f9f9;
    }
    .ending-image {
      max-width: 80%;
      max-height: 70%;
      object-fit: contain;
    }
    .ending-text {
      font-size: 24px;
      margin-top: 30px;
      color: #555;
    }
  </style>
</head>
<body>
  <!-- 封面 -->
  <div class="page cover">
    <% if (images.cover) { %>
      <img class="cover-image" src="data:image/jpeg;base64,<%= images.cover %>" alt="封面">
    <% } %>
    <h1 class="cover-title"><%= title %></h1>
  </div>

  <!-- 正文页 -->
  <% paragraphs.forEach((paragraph, index) => { %>
    <div class="page content-page">
      <div class="image-container">
        <% if (images.content[index]) { %>
          <img class="content-image" src="data:image/jpeg;base64,<%= images.content[index] %>" alt="插图 <%= index + 1 %>">
        <% } %>
      </div>
      <div class="text-container">
        <p><%= paragraph %></p>
      </div>
      <div class="page-number"><%= index + 1 %> / <%= paragraphs.length %></div>
    </div>
  <% }); %>

  <!-- 结尾页 -->
  <div class="page ending-page">
    <% if (images.ending) { %>
      <img class="ending-image" src="data:image/jpeg;base64,<%= images.ending %>" alt="结尾">
    <% } %>
    <div class="ending-text">故事结束</div>
  </div>
</body>
</html>
`;

export async function generatePDFWithHtml(storyId: string, storyData: StoryData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      console.log(`开始为故事 ${storyId} 生成PDF (html-pdf方式)`);
      
      // 确保故事目录存在
      const storyDir = getStoryDir(storyId);
      if (!fs.existsSync(storyDir)) {
        fs.mkdirSync(storyDir, { recursive: true });
      }
      
      // 渲染HTML模板
      const html = ejs.render(pdfTemplate, {
        title: storyData.title,
        paragraphs: storyData.paragraphs,
        images: storyData.images
      });
      
      // 临时保存HTML文件（方便调试）
      const htmlPath = path.join(storyDir, 'preview.html');
      fs.writeFileSync(htmlPath, html);
      console.log(`HTML预览文件已保存到: ${htmlPath}`);
      
      // PDF配置
      const options = {
        format: 'A4',
        orientation: 'portrait',
        border: {
          top: '8mm',
          right: '8mm',
          bottom: '8mm',
          left: '8mm'
        },
        timeout: 120000 // 120秒超时
      };
      
      // 生成PDF
      console.log('正在生成PDF...');
      pdf.create(html, options).toBuffer((err, buffer) => {
        if (err) {
          console.error('PDF生成失败:', err);
          reject(err);
          return;
        }
        
        // 保存PDF文件
        const pdfPath = path.join(storyDir, 'story.pdf');
        fs.writeFileSync(pdfPath, buffer);
        console.log(`PDF文件已保存到: ${pdfPath}`);
        
        resolve(buffer);
      });
    } catch (error) {
      console.error('PDF生成过程中发生错误:', error);
      reject(error);
    }
  });
}