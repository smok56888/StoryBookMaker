import fs from 'fs'
import path from 'path'

// 数据存储基础路径
const DATA_DIR = path.join(process.cwd(), 'data')

// 确保目录存在
function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

// 生成故事ID
export function generateStoryId(): string {
  return `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// 获取故事目录路径
export function getStoryDir(storyId: string): string {
  return path.join(DATA_DIR, storyId)
}

// 保存角色分析结果
export function saveCharacterAnalysis(storyId: string, characters: any[]) {
  const storyDir = getStoryDir(storyId)
  ensureDir(storyDir)
  
  const filePath = path.join(storyDir, 'characters.json')
  fs.writeFileSync(filePath, JSON.stringify(characters, null, 2))
}

// 读取角色分析结果
export function loadCharacterAnalysis(storyId: string): any[] | null {
  const filePath = path.join(getStoryDir(storyId), 'characters.json')
  if (!fs.existsSync(filePath)) return null
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

// 保存故事内容
export function saveStory(storyId: string, story: { title: string; paragraphs: string[] }) {
  const storyDir = getStoryDir(storyId)
  ensureDir(storyDir)
  
  // 如果是编辑现有故事，删除旧的PDF文件
  deletePdf(storyId)
  
  const filePath = path.join(storyDir, 'story.json')
  fs.writeFileSync(filePath, JSON.stringify(story, null, 2))
}

// 读取故事内容
export function loadStory(storyId: string): { title: string; paragraphs: string[] } | null {
  const filePath = path.join(getStoryDir(storyId), 'story.json')
  if (!fs.existsSync(filePath)) return null
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

// 获取完整的故事数据（包括内容、图片、提示词等）
export function getStory(storyId: string): any {
  try {
    const story = loadStory(storyId)
    const characters = loadCharacterAnalysis(storyId)
    const prompts = loadPrompts(storyId)
    const status = loadStoryStatus(storyId)
    
    // 加载所有图片
    const coverImage = loadImage(storyId, 'cover')
    const endingImage = loadImage(storyId, 'ending')
    
    // 加载正文图片
    const contentImages = []
    if (story && story.paragraphs) {
      for (let i = 0; i < story.paragraphs.length; i++) {
        const image = loadImage(storyId, 'content', i)
        contentImages.push(image)
      }
    }
    
    return {
      storyId,
      title: story?.title || '',
      paragraphs: story?.paragraphs || [],
      characters,
      prompts,
      status: status?.status || 'draft',
      updatedAt: status?.updatedAt,
      images: {
        cover: coverImage,
        content: contentImages,
        ending: endingImage
      }
    }
  } catch (error) {
    console.error(`获取故事 ${storyId} 数据失败:`, error)
    return null
  }
}

// 保存提示词
export function savePrompts(storyId: string, prompts: { cover: string; pages: string[]; ending: string }) {
  const storyDir = getStoryDir(storyId)
  ensureDir(storyDir)
  
  const filePath = path.join(storyDir, 'prompts.json')
  fs.writeFileSync(filePath, JSON.stringify(prompts, null, 2))
}

// 读取提示词
export function loadPrompts(storyId: string): { cover: string; pages: string[]; ending: string } | null {
  const filePath = path.join(getStoryDir(storyId), 'prompts.json')
  if (!fs.existsSync(filePath)) return null
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

// 保存图片
export function saveImage(storyId: string, type: 'cover' | 'content' | 'ending', imageBase64: string, index?: number) {
  const storyDir = getStoryDir(storyId)
  const imagesDir = path.join(storyDir, 'images')
  ensureDir(imagesDir)
  
  // 如果是保存新图片，删除旧的PDF文件
  deletePdf(storyId)
  
  let filename: string
  if (type === 'cover') {
    filename = 'cover.jpg'
  } else if (type === 'ending') {
    filename = 'ending.jpg'
  } else {
    filename = `page_${index || 0}.jpg`
  }
  
  const filePath = path.join(imagesDir, filename)
  const buffer = Buffer.from(imageBase64, 'base64')
  fs.writeFileSync(filePath, buffer)
  
  return filePath
}

// 读取图片
export function loadImage(storyId: string, type: 'cover' | 'content' | 'ending', index?: number): string | null {
  let filename: string
  if (type === 'cover') {
    filename = 'cover.jpg'
  } else if (type === 'ending') {
    filename = 'ending.jpg'
  } else {
    filename = `page_${index || 0}.jpg`
  }
  
  const filePath = path.join(getStoryDir(storyId), 'images', filename)
  if (!fs.existsSync(filePath)) return null
  
  try {
    const buffer = fs.readFileSync(filePath)
    return buffer.toString('base64')
  } catch {
    return null
  }
}

// 保存故事状态
export function saveStoryStatus(storyId: string, status: 'draft' | 'completed') {
  const storyDir = getStoryDir(storyId)
  ensureDir(storyDir)
  
  const statusData = {
    status,
    updatedAt: new Date().toISOString()
  }
  
  const filePath = path.join(storyDir, 'status.json')
  fs.writeFileSync(filePath, JSON.stringify(statusData, null, 2))
}

// 读取故事状态
export function loadStoryStatus(storyId: string): { status: 'draft' | 'completed'; updatedAt: string } | null {
  const filePath = path.join(getStoryDir(storyId), 'status.json')
  if (!fs.existsSync(filePath)) return null
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return null
  }
}

// 检查PDF是否存在
export function pdfExists(storyId: string): boolean {
  const filePath = path.join(getStoryDir(storyId), 'story.pdf')
  return fs.existsSync(filePath)
}

// 删除PDF文件（用于二次编辑后重新生成）
export function deletePdf(storyId: string) {
  const filePath = path.join(getStoryDir(storyId), 'story.pdf')
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
}

// 获取所有故事列表，按日期分组
export function getAllStories(page = 1, pageSize = 10): {
  stories: Array<{
    date: string;
    items: Array<{
      storyId: string;
      title: string;
      coverImage: string | null;
      createdAt: string;
      status: 'draft' | 'completed';
    }>;
  }>;
  total: number;
  totalPages: number;
} {
  // 确保数据目录存在
  ensureDir(DATA_DIR)
  
  // 读取所有故事目录
  const storyDirs = fs.readdirSync(DATA_DIR)
    .filter(dir => dir.startsWith('story_'))
    .map(storyId => {
      // 获取故事信息
      const story = loadStory(storyId)
      const status = loadStoryStatus(storyId)
      const coverImage = loadImage(storyId, 'cover')
      
      // 获取创建时间
      const createdAt = storyId.split('_')[1] 
        ? new Date(parseInt(storyId.split('_')[1])).toISOString()
        : new Date().toISOString()
      
      // 获取日期（YYYY-MM-DD格式）
      const date = createdAt.split('T')[0]
      
      return {
        storyId,
        title: story?.title || '未命名故事',
        coverImage,
        createdAt,
        date,
        status: status?.status || 'draft'
      }
    })
    // 按创建时间降序排序（最新的在前）
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  
  // 计算分页
  const total = storyDirs.length
  const totalPages = Math.ceil(total / pageSize)
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const pagedStories = storyDirs.slice(startIndex, endIndex)
  
  // 按日期分组
  const groupedStories: Record<string, any[]> = {}
  pagedStories.forEach(story => {
    if (!groupedStories[story.date]) {
      groupedStories[story.date] = []
    }
    groupedStories[story.date].push({
      storyId: story.storyId,
      title: story.title,
      coverImage: story.coverImage,
      createdAt: story.createdAt,
      status: story.status
    })
  })
  
  // 转换为数组格式
  const stories = Object.entries(groupedStories).map(([date, items]) => ({
    date,
    items
  })).sort((a, b) => b.date.localeCompare(a.date)) // 日期降序排序
  
  return {
    stories,
    total,
    totalPages
  }
}

// 删除故事
export function deleteStory(storyId: string): boolean {
  const storyDir = getStoryDir(storyId)
  
  // 检查故事是否存在
  if (!fs.existsSync(storyDir)) {
    return false
  }
  
  try {
    // 递归删除目录及其内容
    fs.rmSync(storyDir, { recursive: true, force: true })
    return true
  } catch (error) {
    console.error(`删除故事 ${storyId} 失败:`, error)
    return false
  }
}