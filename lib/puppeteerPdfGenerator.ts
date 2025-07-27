import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { getStoryDir } from './storage';
import ejs from 'ejs';

interface StoryPage {
  id: number;
  content: string;
  imageUrl: string;
}

interface Story {
  id: string;
  title: string;
  pages: StoryPage[];
  totalPages: number;
  coverImage?: string;
  endingPage?: {
    imageUrl: string;
  };
}

export interface StoryData {
  title: string;
  paragraphs: string[];
  images: {
    cover?: string;
    content: string[];
    ending?: string;
  };
}

export class PDFGenerator {
  private getBrowserArgs(): string[] {
    const baseArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--mute-audio',
      '--no-default-browser-check',
      '--no-experiments',
      '--no-pings',
      '--no-service-autorun',
      '--password-store=basic',
      '--use-mock-keychain',
      '--disable-blink-features=AutomationControlled',
      '--disable-ipc-flooding-protection'
    ];

    // 检查是否在Mac Silicon上运行
    if (process.platform === 'darwin' && process.arch === 'arm64') {
      console.log('🍎 检测到Mac Silicon，使用优化设置...');
      baseArgs.push(
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-client-side-phishing-detection',
        '--disable-default-apps',
        '--disable-hang-monitor',
        '--disable-popup-blocking',
        '--disable-prompt-on-repost',
        '--disable-sync',
        '--no-first-run',
        '--safebrowsing-disable-auto-update',
        '--disable-logging',
        '--disable-permissions-api',
        '--ignore-certificate-errors',
        '--ignore-ssl-errors',
        '--ignore-certificate-errors-spki-list'
      );
    }

    return baseArgs;
  }

export async function generatePDFWithPuppeteer(storyId: string, storyData: StoryData): Promise<Buffer> {
  try {
    console.log(`开始为故事 ${storyId} 生成PDF (Puppeteer方式)`);
    
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
    
    // 启动浏览器
    console.log('初始化浏览器环境...');
    
    // 浏览器启动配置
    const launchOptions: any = {
      headless: "new",
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-gpu',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      timeout: 120000, // 120秒启动超时
      protocolTimeout: 120000,
      // 针对Mac Silicon优化
      ignoreDefaultArgs: ['--disable-extensions'],
      defaultViewport: null
    };
    
    // 在生产环境中，尝试使用系统安装的Chrome
    if (process.env.NODE_ENV === 'production') {
      // 尝试找到系统Chrome路径
      const possibleChromePaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/snap/bin/chromium'
      ];
      
      for (const chromePath of possibleChromePaths) {
        if (fs.existsSync(chromePath)) {
          launchOptions.executablePath = chromePath;
          console.log(`使用系统Chrome: ${chromePath}`);
          break;
        }
      }
    }
    
    const browser = await puppeteer.launch(launchOptions);
    
    try {
      // 创建新页面
      const page = await browser.newPage();
      
      // 设置页面超时
      page.setDefaultTimeout(120000);
      page.setDefaultNavigationTimeout(120000);
      
      // 设置页面内容
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 60000
      });
      
      // 等待一段时间确保所有内容都已加载
      await page.waitForTimeout(2000);
      
      // 生成PDF
      console.log('正在生成PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '8px',
          right: '8px',
          bottom: '8px',
          left: '8px'
        },
        timeout: 120000 // 120秒超时
      });
      
      // 保存PDF文件
      const pdfPath = path.join(storyDir, 'story.pdf');
      fs.writeFileSync(pdfPath, pdfBuffer);
      console.log(`PDF文件已保存到: ${pdfPath}`);
      
      return pdfBuffer;
    } finally {
      // 确保浏览器关闭
      await browser.close();
      console.log('浏览器实例已关闭');
    }
  } catch (error) {
    console.error('PDF生成过程中发生错误:', error);
    throw error;
  }
}