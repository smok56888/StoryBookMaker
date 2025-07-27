import puppeteer from 'puppeteer'

interface StoryPage {
  id: number
  content: string
  imageUrl: string
  audioUrl?: string
}

interface Story {
  id: string
  title: string
  pages: StoryPage[]
  totalPages: number
  protagonistImage?: string
  coverImage?: string
  endingPage?: {
    imageUrl: string
  }
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
    ]
  
  // 检查是否在Mac Silicon上运行
    if (process.platform === 'darwin' && process.arch === 'arm64') {
      console.log('🍎 检测到Mac Silicon，使用优化设置...')
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
      )
    }

    return baseArgs
  }

  async generatePDF(story: Story): Promise<Buffer> {
    console.log('🚀 开始生成PDF，启动浏览器...')
    
    let browser
    try {
      browser = await puppeteer.launch({
        headless: true,
        timeout: 90000, // 增加浏览器启动超时时间到90秒
        args: this.getBrowserArgs()
      })
    } catch (error) {
      console.error('❌ 浏览器启动失败:', error)
      throw new Error(`浏览器启动失败: ${error instanceof Error ? error.message : String(error)}`)
    }
    
    try {
      const page = await browser.newPage()
      
      // 设置更长的超时时间
      page.setDefaultTimeout(180000) // 增加到3分钟
      page.setDefaultNavigationTimeout(180000)
      
      // 设置页面大小为A4
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 1,
      })

      // 1. 若有结尾页，插入到pages最后
      let pages = [...story.pages];
      if (story.endingPage && story.endingPage.imageUrl) {
        console.log('📄 检测到结尾页，添加到PDF中')
        pages.push({
          id: pages.length + 1,
          content: '',
          imageUrl: story.endingPage.imageUrl
        });
      } else {
        console.log('⚠️ 未检测到结尾页')
      }
      const storyWithEnding = { ...story, pages, totalPages: pages.length };

      // 生成完整的HTML内容
      const html = this.generateHTML(storyWithEnding)
      
      console.log('📄 设置HTML内容...')
      
      // 设置HTML内容
      await page.setContent(html, {
        waitUntil: ['networkidle2', 'domcontentloaded'], // 改为networkidle2，更宽松的等待条件
        timeout: 180000
      })     
 // 等待图片加载完成
      console.log('📄 等待图片加载...')
      try {
        await page.waitForSelector('img', { timeout: 10000 })
        // 等待所有图片加载完成
        await page.evaluate(() => {
          const images = Array.from(document.querySelectorAll('img'))
          return Promise.all(images.map(img => {
            if (img.complete) return Promise.resolve()
            return new Promise((resolve) => {
              img.addEventListener('load', resolve)
              img.addEventListener('error', resolve) // 即使图片加载失败也继续
              setTimeout(resolve, 5000) // 5秒后强制继续
            })
          }))
        })
      } catch (error) {
        console.log('⚠️  图片加载超时，继续生成PDF...')
      }

      // 额外等待时间确保渲染完成
      await new Promise(resolve => setTimeout(resolve, 3000))

      console.log('📄 生成PDF文件...')
      
      // 生成PDF - 封面和结尾页无边距，正文页保持小边距
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0px',
          right: '0px', 
          bottom: '0px',
          left: '0px'
        },
        timeout: 120000 // 增加PDF生成超时时间
      }) 
     console.log('✅ PDF生成完成')
      return Buffer.from(pdfBuffer)
    } catch (error) {
      console.error('❌ PDF生成失败:', error)
      throw error
    } finally {
      if (browser) {
        try {
          await browser.close()
        } catch (error) {
          console.error('❌ 关闭浏览器失败:', error)
        }
      }
    }
  }

  private generateHTML(story: Story): string {
    const cleanTitle = this.cleanTitle(story.title)
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cleanTitle}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800&family=Comic+Neue:wght@400;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
        

    body {
      font-family: 'Comic Neue', 'Nunito', 'Comic Sans MS', '微软雅黑', 'Microsoft YaHei', 'SimHei', cursive, sans-serif;
      line-height: 1.6;
      color: #2c3e50;
      background: #fff;
    }
    
    .page {
      width: 210mm;
      height: 297mm;
      padding: 10mm;
      margin: 0 auto;
      background: white;
      page-break-after: always;
      position: relative;
      overflow: hidden;
      box-sizing: border-box;
    }
    
    .page:last-child {
      page-break-after: avoid;
    }
    
    /* 封面页 - 占满整个画面 */
    .cover-page {
      position: relative;
      overflow: hidden;
      background: #f8f9fa;
      padding: 0 !important;
      margin: 0 !important;
    }
    
    /* 内容页样式 - 匹配预览版本，添加彩色渐变背景 */
    .content-page { 
      position: relative;
      overflow: hidden;
    }
        

    .content-page.page-1 { background: linear-gradient(135deg, #fff5f5 0%, #ffe0e6 100%); }
    .content-page.page-2 { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); }
    .content-page.page-3 { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }
    .content-page.page-4 { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); }
    .content-page.page-5 { background: linear-gradient(135deg, #fdf4ff 0%, #f3e8ff 100%); }
    .content-page.page-6 { background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); }
    .content-page.page-7 { background: linear-gradient(135deg, #fef7cd 0%, #fde68a 100%); }
    .content-page.page-8 { background: linear-gradient(135deg, #ecfdf5 0%, #bbf7d0 100%); }
    .content-page.page-9 { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); }
    .content-page.page-10 { background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); }
    .content-page.page-11 { background: linear-gradient(135deg, #f7fee7 0%, #ecfccb 100%); }
    .content-page.page-12 { background: linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); }
    .content-page.page-13 { background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); }
    .content-page.page-14 { background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); }
    .content-page.page-15 { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); }
    .content-page.page-16 { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); }
    .content-page.page-17 { background: linear-gradient(135deg, #fefce8 0%, #fef08a 100%); }
    .content-page.page-18 { background: linear-gradient(135deg, #f0fdfa 0%, #a7f3d0 100%); }
    .content-page.page-19 { background: linear-gradient(135deg, #fdf4ff 0%, #e879f9 20%, #f3e8ff 100%); }
    .content-page.page-20 { background: linear-gradient(135deg, #fff1f2 0%, #fecaca 50%, #fef3c7 100%); }
     
   /* 图片容器样式 - 缩减上方空间到1/2 */
    .image-container {
      position: absolute;
      top: 6px; /* 原来13px的1/2约为6px */
      left: 0;
      right: 0;
      bottom: 180px; /* 为底部文字区域留出足够空间（120px + 15px边距 + 额外空间） */
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .image-container img {
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      object-fit: contain;
    }
    
    /* 文字覆盖层样式 - 白色60%透明度，15px边距 */
    .text-overlay {
      position: absolute;
      bottom: 15px;
      left: 15px;
      right: 15px;
      background: rgba(255, 255, 255, 0.6);
      padding: 15px;
      min-height: 140px; /* 增加文字区域高度 */
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
    }
    
    .text-overlay p {
      font-size: 24px;
      line-height: 1.8;
      color: #1f2937;
      font-weight: 600;
      text-align: center;
      margin: 0;
      max-width: 90%;
    }
    
    /* 页码样式 - 放置在右下角，在文字区域内 */
    .page-number {
      position: absolute;
      bottom: 25px; /* 在文字区域内部 */
      right: 25px; /* 在文字区域内部 */
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      padding: 5px 10px;
      font-size: 14px;
      font-weight: 500;
      color: #374151;
      z-index: 10; /* 确保页码在文字区域之上 */
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    /* 打印样式 */
    @media print {
      .page {
        margin: 0;
        box-shadow: none;
        page-break-inside: avoid;
      }
      
      @page {
        size: A4;
        margin: 0;
      }
    }
  </style>
</head>
<body>
  ${this.generateCoverPage(story)}
  ${this.generateContentPages(story)}
</body>
</html>
    `
  }

  private generateCoverPage(story: Story): string {
    const cleanTitle = this.cleanTitle(story.title)
    
    // 封面页占满整个画面，无边距
    return `
    <div class="page cover-page" style="padding: 0; margin: 0;">
      <div style="position: relative; width: 100%; height: 100%; overflow: hidden;">
        <!-- 封面图片 - 占满整个画面 -->
        ${story.coverImage ? `
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0;">
          <img src="${story.coverImage}" alt="封面图片" style="width: 100%; height: 100%; object-fit: cover;" />
        </div>` : `
        <!-- 如果没有封面图片，使用渐变背景 -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(135deg, #a8e6cf 0%, #dcedc8 30%, #f4ff81 70%, #81c784 100%);">
          <!-- 标题，居中显示 -->
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <h1 style="font-size: 48px; font-weight: bold; color: #2e7d32; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1); margin: 0;">
              ${cleanTitle}
            </h1>
          </div>
        </div>`}
      </div>
    </div>
    `
  }

  private generateContentPages(story: Story): string {
    return story.pages.map((page, index) => {
      const pageNumber = index + 1
      const isEndingPage = page.content === '' && page.imageUrl // 判断是否为结尾页
      
      if (isEndingPage) {
        // 结尾页：图片占满整个画面，无边距
        return `
        <div class="page content-page page-${pageNumber}" style="padding: 0; margin: 0;">
          <div style="position: relative; width: 100%; height: 100%; overflow: hidden;">
            <img src="${page.imageUrl}" alt="结尾页" style="width: 100%; height: 100%; object-fit: cover;" />
          </div>
        </div>
        `
      } else {
        // 正文页：优化图片位置和文字区域
        return `
        <div class="page content-page page-${pageNumber}">
          <!-- 图片区域 - 缩减上方空间到1/2 -->
          <div class="image-container">
            ${this.generateImageContent(page.imageUrl, pageNumber)}
          </div>
          <!-- 文字区域 - 白色60%透明度，15px边距 -->
          <div class="text-overlay">
            <p>${page.content}</p>
          </div>
          <!-- 页码 - 右下角 -->
          <div class="page-number">
            ${pageNumber}
          </div>
        </div>
        `
      }
    }).join('')
  }

  private generateImageContent(imageUrl: string, pageNumber: number): string {
    if (imageUrl) {
      // 图片适应容器大小，确保完美居中
      return `<img src="${imageUrl}" alt="第${pageNumber}页插图" style="max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; display: block; margin: auto;" />`
    } else {
      return `
      <div style="width: 100%; height: 100%; background: #f3f4f6; display: flex; align-items: center; justify-content: center; flex-direction: column;">
        <div style="font-size: 64px; margin-bottom: 16px;">📄</div>
        <p style="color: #6b7280; font-size: 16px;">图片加载中...</p>
      </div>
      `
    }
  }

  private cleanTitle(title: string): string {
    // 移除多余的标点符号和空格
    return title.replace(/^【|】$|^《|》$/g, '').trim()
  }


}