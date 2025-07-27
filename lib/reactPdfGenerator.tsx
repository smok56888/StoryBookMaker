import React from 'react';
import { Document, Page, Text, View, Image, StyleSheet, pdf, Font } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';
import { getStoryDir } from './storage';

// 注册中文字体
Font.register({
  family: 'SourceHanSansCN',
  src: path.join(process.cwd(), 'public/fonts/SourceHanSansCN-Regular.ttf'),
});

export interface StoryData {
  title: string;
  paragraphs: string[];
  images: {
    cover?: string;
    content: string[];
    ending?: string;
  };
}

// 定义样式
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 20,
    fontFamily: 'SourceHanSansCN',
  },
  coverPage: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  coverImage: {
    width: '80%',
    maxHeight: '70%',
    marginBottom: 20,
  },
  coverTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333333',
  },
  contentPage: {
    flexDirection: 'column',
    height: '100%',
  },
  contentImage: {
    width: '100%',
    maxHeight: '50%',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 1.6,
    color: '#333333',
    textAlign: 'left',
    flex: 1,
  },
  pageNumber: {
    fontSize: 10,
    color: '#888888',
    textAlign: 'right',
    marginTop: 10,
  },
  endingPage: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  endingImage: {
    width: '80%',
    maxHeight: '70%',
    marginBottom: 20,
  },
  endingText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#555555',
  },
});

// PDF文档组件
const StoryDocument: React.FC<{ storyData: StoryData }> = ({ storyData }) => (
  <Document>
    {/* 封面页 */}
    <Page size="A4" style={styles.page}>
      <View style={styles.coverPage}>
        {storyData.images.cover && (
          <Image
            style={styles.coverImage}
            src={`data:image/jpeg;base64,${storyData.images.cover}`}
          />
        )}
        <Text style={styles.coverTitle}>{storyData.title}</Text>
      </View>
    </Page>

    {/* 正文页 */}
    {storyData.paragraphs.map((paragraph, index) => (
      <Page key={index} size="A4" style={styles.page}>
        <View style={styles.contentPage}>
          {storyData.images.content[index] && (
            <Image
              style={styles.contentImage}
              src={`data:image/jpeg;base64,${storyData.images.content[index]}`}
            />
          )}
          <Text style={styles.paragraph}>{paragraph}</Text>
          <Text style={styles.pageNumber}>
            {index + 1} / {storyData.paragraphs.length}
          </Text>
        </View>
      </Page>
    ))}

    {/* 结尾页 */}
    {storyData.images.ending && (
      <Page size="A4" style={styles.page}>
        <View style={styles.endingPage}>
          <Image
            style={styles.endingImage}
            src={`data:image/jpeg;base64,${storyData.images.ending}`}
          />
          <Text style={styles.endingText}>故事结束</Text>
        </View>
      </Page>
    )}
  </Document>
);

export async function generatePDFWithReactPDF(storyId: string, storyData: StoryData): Promise<Buffer> {
  try {
    console.log(`开始为故事 ${storyId} 生成PDF (React-PDF方式)`);
    
    // 确保故事目录存在
    const storyDir = getStoryDir(storyId);
    if (!fs.existsSync(storyDir)) {
      fs.mkdirSync(storyDir, { recursive: true });
    }
    
    // 生成PDF
    const pdfDoc = pdf(<StoryDocument storyData={storyData} />);
    
    // 保存PDF文件到本地
    const pdfPath = path.join(storyDir, 'story.pdf');
    
    // 使用流的方式保存文件
    const stream = fs.createWriteStream(pdfPath);
    const pdfStream = await pdfDoc.toBuffer();
    
    // 将ReadableStream转换为Buffer
    const reader = (pdfStream as any).getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    
    const pdfBuffer = Buffer.concat(chunks);
    fs.writeFileSync(pdfPath, pdfBuffer);
    
    console.log(`PDF生成成功，保存到: ${pdfPath}`);
    return pdfBuffer;
  } catch (error) {
    console.error('PDF生成过程中发生错误:', error);
    throw error;
  }
}