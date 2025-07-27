# 绘本工坊 - AI绘本创作平台

这是一个基于Next.js和豆包大模型API的AI绘本创作平台，支持角色定制、故事生成、插图创作和PDF导出等功能。

## 功能特点

- **角色定制**：支持多角色设定，包含姓名、年龄、性别等详细信息
- **AI故事生成**：基于角色和梗概，智能生成完整故事情节
- **插图创作**：自动生成绘本封面、正文插图和结尾页
- **实时预览**：创作过程中随时预览绘本效果
- **PDF导出**：一键导出高质量PDF文件，支持打印和分享
- **作品管理**：按时间线管理所有创作，随时回顾和编辑历史作品

## 技术栈

- **前端**：Next.js 15.x、React 19、TypeScript、Tailwind CSS、shadcn/ui组件库
- **后端**：Next.js API Routes
- **AI对接**：豆包大模型API（文本生成、图片识别、文生图）
- **数据存储**：本地文件系统
- **PDF生成**：pdf-lib

## 快速开始

1. 安装依赖：

```bash
npm install
```

2. 配置环境变量：

创建`.env.local`文件，添加以下内容：

```
ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3
ARK_API_KEY=75879918-5f2c-4c02-8276-caf865b06b06
ARK_TEXT_TO_IMAGE_MODEL=doubao-seedream-3-0-t2i-250415
ARK_IMAGE_ANALYSIS_MODEL=doubao-seed-1-6-250615
```

3. 启动开发服务器：

```bash
npm run dev
```

4. 访问 [http://localhost:3000](http://localhost:3000) 开始使用

## 项目结构

- `/app` - Next.js页面和API路由
- `/components` - React组件
- `/lib` - 工具函数和API封装
- `/data` - 本地数据存储目录

## API接口

- `POST /api/story/generate` - 故事生成
- `POST /api/story/prompts` - 插图提示词生成
- `POST /api/story/image` - 插图生成
- `POST /api/story/complete` - 完成创作
- `GET /api/story/pdf` - PDF下载

## 使用流程

1. 创作设置：上传角色图片、填写角色信息、故事梗概和风格约束
2. 故事生成：生成故事内容，支持编辑
3. 插图生成：生成封面、正文和结尾插图
4. 预览导出：预览绘本效果，导出PDF

## 许可证

MIT