# 阶段一技术方案细化

## 整体架构与技术选型（企业级标准）

### 1. 架构分层
- **前端**：基于 Next.js（React），采用组件化开发，页面与业务逻辑分离，支持服务端渲染（SSR）与静态生成（SSG）。
- **后端**：采用 Next.js API Routes 实现 BFF（Backend For Frontend）模式，后续可平滑迁移至独立 Node.js/Koa/Fastify 服务。
- **AI能力层**：通过 `/lib/arkApi.ts` 统一封装大模型API，便于后续切换/扩展。
- **数据与缓存层**：所有业务数据、缓存、文件（如图片、PDF、JSON）均以 storyId 归档，存储于本地 `/data/{storyId}/` 目录，后续可平滑迁移至对象存储（如OSS、S3）或数据库。

### 2. 技术选型
- **前端**：Next.js 15.x、React 19、TypeScript、Tailwind CSS、shadcn/ui 组件库
- **后端**：Node.js 20+、Next.js API Routes（可扩展为 Koa/Fastify/Express）
- **AI对接**：HTTP API（RESTful），支持异步/超时/重试机制
- **数据存储**：本地文件系统，结构化为 `/data/{storyId}/`，后续可接入云存储/数据库
- **PDF生成**：推荐使用 `pdf-lib`、`puppeteer` 或 `pdfkit` 等 Node.js 库
- **日志与监控**：
  - 统一日志（如 winston/pino），分 info、warn、error 级别，关键操作与异常均记录
  - 关键接口调用、AI交互、文件操作均需日志
  - 预留监控/告警接口，便于后续接入企业监控平台（如Prometheus、Sentry等）
- **API安全**：
  - 生产环境需接入鉴权（如JWT、API Key、OAuth2），防止未授权访问
  - 限流与防刷（如express-rate-limit）
  - 敏感信息（如API Key）通过环境变量管理，不入库不入代码
- **异常处理**：
  - 前后端均需全链路异常捕获，后端返回标准错误码与错误信息，前端toast友好提示
  - AI接口/文件操作/业务逻辑异常均需兜底处理，防止服务崩溃
- **测试与质量保障**：
  - 单元测试（Jest）、接口测试（Supertest）、端到端测试（Playwright/Cypress）
  - 关键业务流程、AI接口、文件操作均需覆盖
- **CI/CD与部署**：
  - 推荐采用 GitHub Actions/GitLab CI 实现自动化测试、构建、部署
  - 支持容器化部署（Docker），便于本地/云端一致性
  - 生产环境建议接入Nginx/PM2等进程管理与反向代理

---

本文档细化 `stage_1_plan.md` 中每个子任务的技术实现，包含前后端交互、API文档、后端处理逻辑等。

---

## 1. Ark API 封装与测试

### 1.1 /lib/arkApi.ts 设计
- 封装豆包API请求，统一处理API Key、BaseURL、模型ID。
- 提供方法：
  - `analyzeImage(imageBase64: string): Promise<AnalyzeResult>`
  - `generateStory(params: { characters, outline, style, count }): Promise<StoryResult>`
  - `generateImagePrompt(params: { storyId, pageIndex, type }): Promise<PromptResult>`  // 新增：生成绘本图片情景描述
  - `generateImage(params: { prompt, type, storyId, title }): Promise<ImageResult>`
- 支持watermark参数、base64图片处理。
- 错误处理：捕获API异常，返回标准错误对象，前端toast提示。

#### 示例代码片段
```ts
export async function analyzeImage(imageBase64: string) { /* ... */ }
export async function generateStory(params) { /* ... */ }
export async function generateImagePrompt(params) { /* ... */ } // 新增
export async function generateImage(params) { /* ... */ }
```

---

## 2. 后端接口设计与实现

### 2.1 API 路由与文档

#### 2.1.1 故事生成/重新生成
- **POST /api/story/generate**
- **请求体**：
```json
{
  "characters": [{"name":"","age":"","gender":"","image":"base64..."}],
  "outline": "故事梗概",
  "style": "风格约束",
  "count": 5
}
```
- **响应体**：
```json
{
  "storyId": "string",
  "title": "故事标题",
  "paragraphs": ["段落1", "段落2", ...]
}
```
- **后端逻辑**：
  1. 对每个角色图片调用 analyzeImage，缓存分析结果（本地文件，key=storyId）。
  2. 调用 generateStory，传入角色分析、梗概、风格、段落数。
  3. 生成 storyId，保存草稿。
  4. 返回 storyId、标题、段落。

#### 2.1.2 插图提示词生成
- **POST /api/story/prompts**
- **请求体**：
```json
{ "storyId": "string" }
```
- **响应体**：
```json
{
  "cover": "封面提示词",
  "pages": ["第1页提示词", ...],
  "ending": "结尾提示词"
}
```
- **后端逻辑**：
  1. 通过 storyId 获取缓存的角色分析、段落（本地文件）。
  2. 一次性整体提交所有故事和人物信息给大模型，构造prompt，要求大模型扮演“专业童话绘本插图师”，为每一页（封面、正文、结尾）生成插图情景描述，禁止出现对话和文字，强调风格连贯、童真可爱。
  3. 在一次交互中拿到所有页面的提示词，解析后缓存。
  4. 返回所有提示词。

#### 2.1.3 插图生成
- **POST /api/story/image**
- **请求体**：
```json
{
  "storyId": "string",
  "type": "cover|content|ending",
  "index": 0, // 正文页索引，封面/结尾可省略
  "prompt": "提示词",
  "title": "故事标题"
}
```
- **响应体**：
```json
{
  "image": "base64..."
}
```
- **后端逻辑**：
  1. 调用 generateImage，传递尺寸、watermark=false。
  2. 返回base64图片。

#### 2.1.4 完成创作
- **POST /api/story/complete**
- **请求体**：
```json
{ "storyId": "string" }
```
- **响应体**：
```json
{ "success": true }
```
- **后端逻辑**：
  1. 更新故事状态为已完成。
  2. 持久化所有数据（本地文件）。
  3. 【PDF保存】创作完成时，若已生成PDF，则将PDF文件一并保存。

#### 2.1.5 PDF下载
- **GET /api/story/pdf?storyId=xxx**
- **响应**：PDF文件流
- **后端逻辑**：
  1. 检查 `/data/{storyId}/story.pdf` 是否存在：
     - 若存在且无编辑，直接读取返回。
     - 若不存在或有二次编辑，重新生成PDF文件并保存。
  2. 首次下载时实施创建PDF文件，并保存到 `/data/{storyId}/story.pdf`。
  3. 若后续有二次编辑（如故事、插图、段落等变更），需删除旧PDF文件，下载时重新生成。
  4. 返回PDF流。

#### 2.1.6 获取历史绘本列表
- **GET /api/story/history**
- **响应体**：
```json
{
  "stories": [
    {
      "date": "2025-07-21",
      "items": [
        {
          "storyId": "string",
          "title": "故事标题",
          "coverImage": "base64...",
          "createdAt": "2025-07-21T10:30:00Z",
          "status": "completed"
        },
        // 更多同一天的绘本...
      ]
    },
    // 更多不同日期的绘本分组...
  ]
}
```
- **后端逻辑**：
  1. 扫描 `/data/` 目录下所有子目录，读取每个故事的元数据。
  2. 按创建日期分组，降序排列（最新的在前）。
  3. 每个故事返回ID、标题、封面图片、创建时间、状态等信息。
  4. 支持分页查询，默认每页10条。

#### 2.1.7 删除绘本
- **DELETE /api/story/delete**
- **请求体**：
```json
{ "storyId": "string" }
```
- **响应体**：
```json
{ "success": true }
```
- **后端逻辑**：
  1. 验证storyId是否存在。
  2. 物理删除 `/data/{storyId}/` 目录及其所有内容。
  3. 返回删除结果。

---

## 3. 前端页面与交互细节

### 3.1 故事生成页
- 角色信息、图片上传、段落数输入、梗概、风格。
- 生成故事按钮可多次点击，调用 `/api/story/generate`，每次返回覆盖原内容。
- 仅支持段落编辑，无段落刷新。

### 3.2 插图生成页
- 导航栏下方“生成提示词”按钮，调用 `/api/story/prompts`，填充每页提示词。
- 每页左图右词，提示词可编辑，右上角“生成插图”按钮，调用 `/api/story/image`。
- 支持封面、正文、结尾统一交互。

### 3.3 预览页
- 图片与文字排版方式与历史作品页一致。
- PDF下载按钮，调用 `/api/story/pdf`，下载PDF。

### 3.4 历史绘本页面
- 页面加载时调用 `/api/story/history` 获取历史绘本列表。
- 按日期分组展示，每组显示日期标题。
- 每个绘本卡片显示封面图片、标题、创建时间。
- 每个绘本卡片右上角提供删除按钮。
- 点击删除按钮弹出二次确认对话框：
  - 对话框标题："确认删除"
  - 对话框内容："您确定要删除《{故事标题}》吗？此操作不可恢复。"
  - 提供"取消"和"确认删除"两个按钮
  - 点击"确认删除"后调用 `/api/story/delete` 接口
  - 删除成功后刷新列表，并显示成功提示
- 点击绘本卡片进入预览页面。
- 支持分页加载更多历史绘本。

### 3.5 草稿与编辑
- 故事生成后自动保存草稿，支持随时继续编辑。
- 支持全流程信息的重新编辑。
- 前端所有API异常toast提示。

---

## 4. 前端API客户端设计

### 4.1 /lib/apiClient.ts 设计
- 封装所有前端API调用，统一处理请求、响应、错误。
- 提供方法：
  - `generateStory(data: { characters, outline, style, count }): Promise<StoryResponse>`
  - `generatePrompts(storyId: string): Promise<PromptsResponse>`
  - `generateImage(data: { storyId, type, index?, prompt, title? }): Promise<ImageResponse>`
  - `completeStory(storyId: string): Promise<{ success: boolean }>`
  - `getPdfUrl(storyId: string): string` // 返回PDF下载链接
  - `getStoryHistory(page?: number): Promise<HistoryResponse>` // 新增：获取历史绘本列表
  - `deleteStory(storyId: string): Promise<{ success: boolean }>` // 新增：删除绘本

#### 示例代码片段
```ts
// 获取历史绘本列表
export async function getStoryHistory(page = 1) {
  const response = await apiClient.get('/story/history', { params: { page } })
  return response.data
}

// 删除绘本
export async function deleteStory(storyId: string) {
  const response = await apiClient.delete('/story/delete', { data: { storyId } })
  return response.data
}
```

## 5. 数据缓存与持久化方案
- 所有缓存均采用本地文件保存（如JSON、图片、PDF等），不使用内存或Redis。
- storyId 作为主索引，缓存角色分析、段落、提示词、图片、PDF等。
- 文件结构建议：`/data/{storyId}/` 目录下分角色、段落、提示词、图片、PDF等子文件。
- PDF文件首次下载时创建并保存，创作完成后也保存PDF，后续下载直接读取；如有二次编辑需删除旧PDF，下载时重新生成。
- 历史绘本列表通过扫描 `/data/` 目录生成，按创建日期分组。

---

如需进一步细化某一API的参数、数据结构或页面UI，请随时告知。 