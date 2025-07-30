# PDF生成替代方案

## 问题说明
在网络受限的环境中，Chrome/Puppeteer可能无法正常工作。这里提供几种PDF生成的替代方案。

## 方案1: 使用wkhtmltopdf (推荐)

### 安装wkhtmltopdf
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y wkhtmltopdf

# 验证安装
wkhtmltopdf --version
```

### 配置项目使用wkhtmltopdf
在.env.local中添加：
```bash
PDF_GENERATOR=wkhtmltopdf
WKHTMLTOPDF_PATH=/usr/bin/wkhtmltopdf
DISABLE_PUPPETEER_PDF=true
```

## 方案2: 使用jsPDF (纯JavaScript)

### 优势
- 无需浏览器依赖
- 纯JavaScript实现
- 已经在项目中安装

### 配置
在.env.local中添加：
```bash
PDF_GENERATOR=jspdf
DISABLE_PUPPETEER_PDF=true
```

## 方案3: 使用PDFKit (Node.js)

### 优势
- 服务端PDF生成
- 无浏览器依赖
- 已经在项目中安装

### 配置
在.env.local中添加：
```bash
PDF_GENERATOR=pdfkit
DISABLE_PUPPETEER_PDF=true
```

## 方案4: 完全禁用PDF功能

如果PDF功能不是必需的：

```bash
# 在.env.local中添加
DISABLE_PDF_GENERATION=true
```

## 自动检测脚本

创建一个自动检测最佳PDF方案的脚本：

```bash
#!/bin/bash
# detect-pdf-solution.sh

echo "🔍 检测最佳PDF生成方案..."

# 检查wkhtmltopdf
if command -v wkhtmltopdf &> /dev/null; then
    echo "✓ 检测到 wkhtmltopdf"
    echo "PDF_GENERATOR=wkhtmltopdf" >> .env.local
    echo "WKHTMLTOPDF_PATH=$(which wkhtmltopdf)" >> .env.local
    exit 0
fi

# 检查Chrome
if command -v google-chrome-stable &> /dev/null; then
    echo "✓ 检测到 Chrome"
    echo "PUPPETEER_EXECUTABLE_PATH=$(which google-chrome-stable)" >> .env.local
    exit 0
fi

# 检查Chromium
if command -v chromium-browser &> /dev/null; then
    echo "✓ 检测到 Chromium"
    echo "PUPPETEER_EXECUTABLE_PATH=$(which chromium-browser)" >> .env.local
    exit 0
fi

# 使用jsPDF作为后备方案
echo "⚠ 未检测到浏览器，使用jsPDF作为后备方案"
echo "PDF_GENERATOR=jspdf" >> .env.local
echo "DISABLE_PUPPETEER_PDF=true" >> .env.local
```

## 项目代码适配

### 在PDF生成代码中添加条件判断

```javascript
// lib/pdfGenerator.ts
export async function generatePDF(content: string, options: any) {
  const pdfGenerator = process.env.PDF_GENERATOR || 'puppeteer';
  
  switch (pdfGenerator) {
    case 'wkhtmltopdf':
      return await generateWithWkhtmltopdf(content, options);
    case 'jspdf':
      return await generateWithJsPDF(content, options);
    case 'pdfkit':
      return await generateWithPDFKit(content, options);
    default:
      if (process.env.DISABLE_PDF_GENERATION === 'true') {
        throw new Error('PDF generation is disabled');
      }
      return await generateWithPuppeteer(content, options);
  }
}
```

## 推荐配置

### 对于网络受限环境
```bash
# .env.local
PDF_GENERATOR=jspdf
DISABLE_PUPPETEER_PDF=true
DISABLE_PDF_GENERATION=false
```

### 对于有wkhtmltopdf的环境
```bash
# .env.local
PDF_GENERATOR=wkhtmltopdf
WKHTMLTOPDF_PATH=/usr/bin/wkhtmltopdf
DISABLE_PUPPETEER_PDF=true
```

### 完全禁用PDF
```bash
# .env.local
DISABLE_PDF_GENERATION=true
```

这样可以确保应用在任何环境下都能正常运行，即使没有Chrome浏览器。