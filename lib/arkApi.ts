import axios from 'axios'
import { generateStoryPrompt, generateImagePrompt as generateImagePromptTemplate, generateCoreElementsPrompt, generateSingleImagePrompt } from './promptTemplates'

// 生成基础一致性元素（当核心元素提取失败时使用）
const generateBasicConsistencyElements = (characters: Array<{ name: string; analysis: string }>): string => {
  const characterElements = characters.map(char => {
    const features = char.analysis.split('，')
    return `${char.name}：${features.slice(0, 4).join('，')}（每页必须保持完全一致）`
  }).join('\n')

  return `【核心一致性要求】
${characterElements}

【绘画风格统一】
- 温馨的儿童绘本风格
- 柔和的水彩质感
- 暖色调为主，营造温馨氛围
- 圆润安全的造型设计`
}

// 生成一致性增强的图片提示词
const generateConsistentImagePrompt = (params: {
  storyId: string
  characters: Array<{ name: string; analysis: string }>
  paragraphs: string[]
  title: string
  coreElements: string
}): string => {
  return `你是专业的儿童绘本插画师，请为《${params.title}》生成高度一致的插图描述。

${params.coreElements}

【故事内容】
${params.paragraphs.map((p, i) => `第${i + 1}页：${p}`).join('\n')}

【一致性要求】
1. 角色外观：严格按照上述核心要求，每个角色的发型、服装、表情、体态必须在所有页面保持完全一致
2. 绘画风格：所有插图必须使用相同的艺术风格和色彩方案
3. 构图标准：采用儿童友好的视角和构图方式
4. 质量标准：每个描述100-150字，详细具体，便于AI理解和生成

【封面特殊要求】
封面必须在画面中清晰显示故事标题"${params.title}"，标题文字要醒目易读，位置合适，不遮挡主要角色

【输出格式】
请严格按照以下格式输出：

封面：[封面插图描述，必须包含故事标题文字，展现主要角色，严格遵循一致性要求]
第1页：[第1页插图描述，对应故事内容，严格遵循一致性要求]
第2页：[第2页插图描述，对应故事内容，严格遵循一致性要求]
第3页：[第3页插图描述，对应故事内容，严格遵循一致性要求]
第4页：[第4页插图描述，对应故事内容，严格遵循一致性要求]
第5页：[第5页插图描述，对应故事内容，严格遵循一致性要求]
结尾：[结尾插图描述，温馨圆满的结局，严格遵循一致性要求]

【重要提醒】
每个描述都必须明确包含角色的关键特征，确保AI绘图时能够保持角色形象的高度一致性。`
}

// 解析一致性增强的响应
const parseConsistentImagePromptResponse = (content: string, expectedPages: number, coreElements: string, title?: string) => {
  const lines = content.split('\n').filter(line => line.trim())

  // 提取核心角色特征用于增强描述
  const characterFeatures = extractCharacterFeatures(coreElements)

  // 提取封面
  let cover = ''
  const coverLine = lines.find(line => line.startsWith('封面：'))
  if (coverLine) {
    cover = enhanceWithConsistency(coverLine.replace('封面：', '').trim(), characterFeatures)
  }

  // 提取结尾
  let ending = ''
  const endingLine = lines.find(line => line.startsWith('结尾：'))
  if (endingLine) {
    ending = enhanceWithConsistency(endingLine.replace('结尾：', '').trim(), characterFeatures)
  }

  // 提取各页
  const pages: string[] = []
  for (let i = 1; i <= expectedPages; i++) {
    const pageLine = lines.find(line => line.startsWith(`第${i}页：`))
    if (pageLine) {
      const pageDescription = pageLine.replace(`第${i}页：`, '').trim()
      pages.push(enhanceWithConsistency(pageDescription, characterFeatures))
    } else {
      // 兜底方案：生成包含一致性要求的基础描述
      const basicDescription = `温馨的儿童绘本插图，展现第${i}页的故事情节`
      pages.push(enhanceWithConsistency(basicDescription, characterFeatures))
    }
  }

  // 如果解析失败，使用兜底方案
  if (!cover) {
    cover = enhanceWithConsistency(`温馨的绘本封面，画面中清晰显示故事标题"${title || '绘本故事'}"，展现主要角色，体现故事主题`, characterFeatures)
  }
  if (!ending) {
    ending = enhanceWithConsistency('温馨圆满的故事结尾场景，传达幸福和满足感', characterFeatures)
  }

  return {
    cover,
    pages,
    ending,
    coreElements: coreElements
  }
}

// 提取角色特征
const extractCharacterFeatures = (coreElements: string): string[] => {
  const features: string[] = []
  const lines = coreElements.split('\n')

  lines.forEach(line => {
    if (line.includes('：') && (line.includes('岁') || line.includes('穿') || line.includes('发'))) {
      const feature = line.trim()
      if (feature.length > 0) {
        features.push(feature)
      }
    }
  })

  return features
}

// 用一致性特征增强描述
const enhanceWithConsistency = (description: string, characterFeatures: string[]): string => {
  if (characterFeatures.length === 0) {
    return description
  }

  // 如果描述中没有包含角色特征，则添加
  const hasCharacterInfo = characterFeatures.some(feature => {
    const characterName = feature.split('：')[0]
    return description.includes(characterName)
  })

  if (!hasCharacterInfo && characterFeatures.length > 0) {
    // 添加主要角色的关键特征
    const mainCharacterFeature = characterFeatures[0]
    const characterName = mainCharacterFeature.split('：')[0]
    const keyFeatures = mainCharacterFeature.split('：')[1].split('，').slice(0, 2).join('，')

    return `${description}。${characterName}（${keyFeatures}）保持一致的外观特征。`
  }

  return description
}

// 日志工具函数
const logApiCall = {
  // 记录API调用开始
  start: (apiName: string, params: any) => {
    const sanitizedParams = sanitizeLogData(params)
    console.log(`\n🚀 [豆包API] ${apiName} - 开始调用`)
    console.log(`📋 [豆包API] ${apiName} - 调用参数:`, JSON.stringify(sanitizedParams, null, 2))
    console.log(`⏰ [豆包API] ${apiName} - 调用时间:`, new Date().toISOString())
  },

  // 记录API调用成功
  success: (apiName: string, response: any, duration?: number) => {
    const sanitizedResponse = sanitizeLogData(response)
    console.log(`✅ [豆包API] ${apiName} - 调用成功`)
    console.log(`📊 [豆包API] ${apiName} - 响应数据:`, JSON.stringify(sanitizedResponse, null, 2))
    if (duration) {
      console.log(`⏱️  [豆包API] ${apiName} - 耗时: ${duration}ms`)
    }
    console.log(`🏁 [豆包API] ${apiName} - 完成时间:`, new Date().toISOString())
  },

  // 记录API调用失败
  error: (apiName: string, error: any, duration?: number) => {
    const sanitizedError = sanitizeLogData(error)
    console.log(`❌ [豆包API] ${apiName} - 调用失败`)
    console.log(`💥 [豆包API] ${apiName} - 错误信息:`, JSON.stringify(sanitizedError, null, 2))
    if (duration) {
      console.log(`⏱️  [豆包API] ${apiName} - 耗时: ${duration}ms`)
    }
    console.log(`🏁 [豆包API] ${apiName} - 失败时间:`, new Date().toISOString())
  },

  // 记录重试信息
  retry: (apiName: string, attempt: number, maxRetries: number, error?: any) => {
    console.log(`🔄 [豆包API] ${apiName} - 重试 ${attempt}/${maxRetries}`)
    if (error) {
      console.log(`🔍 [豆包API] ${apiName} - 重试原因:`, error.message || error)
    }
  }
}

// 数据清理函数，用于日志输出时简化长内容
const sanitizeLogData = (data: any): any => {
  if (!data) return data

  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // 处理base64图片数据
      if (obj.startsWith('data:image/') || (obj.length > 100 && /^[A-Za-z0-9+/=]+$/.test(obj))) {
        return `[BASE64_IMAGE_DATA:${obj.length}字符]`
      }
      // 处理长文本
      if (obj.length > 500) {
        return `${obj.substring(0, 200)}...[截断:总长度${obj.length}字符]...${obj.substring(obj.length - 100)}`
      }
      return obj
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize)
    }

    if (obj && typeof obj === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(obj)) {
        // 特殊处理一些敏感字段
        if (key === 'Authorization' || key === 'authorization') {
          sanitized[key] = '[API_KEY_HIDDEN]'
        } else if (key === 'image' && typeof value === 'string' && value.length > 100) {
          sanitized[key] = `[BASE64_IMAGE:${value.length}字符]`
        } else if (key === 'b64_json' && typeof value === 'string') {
          sanitized[key] = `[BASE64_JSON:${value.length}字符]`
        } else if (key === 'prompt' && typeof value === 'string' && value.length > 300) {
          sanitized[key] = `${value.substring(0, 150)}...[截断:总长度${value.length}字符]...${value.substring(value.length - 50)}`
        } else if (key === 'content' && typeof value === 'string' && value.length > 300) {
          sanitized[key] = `${value.substring(0, 150)}...[截断:总长度${value.length}字符]...${value.substring(value.length - 50)}`
        } else {
          sanitized[key] = sanitize(value)
        }
      }
      return sanitized
    }

    return obj
  }

  return sanitize(data)
}

// 豆包API配置
const ARK_BASE_URL = process.env.ARK_BASE_URL || 'https://api.doubao.com'
const ARK_API_KEY = process.env.ARK_API_KEY || '75879918-5f2c-4c02-8276-caf865b06b06'
const ARK_TEXT_TO_IMAGE_MODEL = process.env.ARK_TEXT_TO_IMAGE_MODEL || 'doubao-seedream-3-0-t2i-250415'
const ARK_IMAGE_ANALYSIS_MODEL = process.env.ARK_IMAGE_ANALYSIS_MODEL || 'doubao-seed-1-6-250615'

// 提示词优化辅助函数（保留用于图片生成优化）

const optimizeImagePrompt = (originalPrompt: string, imageType: 'cover' | 'content' | 'ending', title?: string) => {
  // 根据图片类型添加特定的优化指令
  const typeSpecificPrompts = {
    cover: `封面设计，必须在画面中清晰显示故事标题文字${title ? `"${title}"` : ''}，标题文字要醒目易读，可以使用装饰性字体，整体构图要吸引眼球，展现故事主题`,
    content: '故事内页插图，要准确表现当页情节，角色表情生动，场景细节丰富',
    ending: '结尾页插图，要营造温馨圆满的氛围，给读者满足感和幸福感'
  }

  const baseOptimization = `
【构图要求】采用黄金分割比例，主体居中偏上，符合儿童视觉习惯
【光影效果】柔和的自然光照，避免强烈阴影，营造温暖氛围
【细节处理】丰富但不复杂的细节，每个元素都有存在意义
【情感传达】通过色彩、表情、肢体语言准确传达情感
【安全考虑】所有元素都要圆润安全，无尖锐或危险暗示`

  return `${originalPrompt}

${typeSpecificPrompts[imageType]}
${baseOptimization}`
}

// 类型定义
export interface AnalyzeResult {
  success: boolean
  data?: {
    description: string
    features: {
      head: string
      body: string
      limbs: string
      facial: string
      expression: string
      hair: string
      clothing: {
        top: string
        bottom: string
        accessories: string
      }
    }
  }
  error?: string
}

export interface StoryResult {
  success: boolean
  data?: {
    title: string
    paragraphs: string[]
  }
  error?: string
}

export interface PromptResult {
  success: boolean
  data?: {
    cover: string
    pages: string[]
    ending: string
    coreElements?: string // 新增核心形象元素
  }
  error?: string
}

export interface CoreElementsResult {
  success: boolean
  data?: {
    coreElements: string
  }
  error?: string
}

export interface ImageResult {
  success: boolean
  data?: {
    image: string // base64格式
  }
  error?: string
}

// 创建axios实例
const arkClient = axios.create({
  baseURL: ARK_BASE_URL,
  headers: {
    'Authorization': `Bearer ${ARK_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 90000 // 优化为90秒超时，平衡速度和成功率
})

// 添加请求拦截器，用于详细日志记录
arkClient.interceptors.request.use(
  config => {
    console.log(`🌐 [HTTP请求] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`)
    console.log(`📤 [HTTP请求] 请求头:`, sanitizeLogData(config.headers))
    if (config.data) {
      console.log(`📦 [HTTP请求] 请求体:`, sanitizeLogData(config.data))
    }
    return config
  },
  error => {
    console.error('❌ [HTTP请求] 请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 添加响应拦截器，用于详细日志记录
arkClient.interceptors.response.use(
  response => {
    console.log(`📥 [HTTP响应] ${response.status} ${response.statusText}`)
    console.log(`📊 [HTTP响应] 响应头:`, sanitizeLogData(response.headers))
    console.log(`📋 [HTTP响应] 响应体:`, sanitizeLogData(response.data))
    return response
  },
  error => {
    console.error(`💥 [HTTP响应] ${error.response?.status || 'NETWORK_ERROR'}:`, error.response?.statusText || error.message)
    if (error.response?.data) {
      console.error(`📋 [HTTP响应] 错误响应体:`, sanitizeLogData(error.response.data))
    }
    return Promise.reject(error)
  }
)

// 图片分析
export async function analyzeImage(imageBase64: string): Promise<AnalyzeResult> {
  const apiName = '图片分析'
  const startTime = Date.now()

  try {
    const prompt = `请详细分析这张人物图片，提取以下信息：
1. 头部特征：五官、表情、神态
2. 发型发色：具体描述
3. 躯干特征：体型、姿态
4. 四肢特征：手臂、腿部
5. 服装细节：上衣、下衣、袜子、配饰等
6. 整体风格：年龄感、性格特征

请以结构化的方式描述，用于后续绘本插图的一致性参考。这是给3-6岁儿童看的绘本，需要保持童真可爱的风格。`

    const requestData = {
      model: ARK_IMAGE_ANALYSIS_MODEL,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: prompt
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64.replace(/^data:image\/[^;]+;base64,/, '')}`
              }
            }
          ]
        }
      ],
      max_tokens: 5000,
      temperature: 0.6
    }

    // 记录API调用开始
    logApiCall.start(apiName, {
      model: requestData.model,
      prompt: prompt,
      imageSize: imageBase64.length,
      max_tokens: requestData.max_tokens,
      temperature: requestData.temperature
    })

    // 根据豆包图片解析API文档构建请求
    // 参考文档: https://www.volcengine.com/docs/82379/1362931
    const response = await arkClient.post('/chat/completions', requestData)

    const content = response.data.choices[0]?.message?.content
    if (!content) {
      throw new Error('未获取到分析结果')
    }

    const duration = Date.now() - startTime
    const result = {
      success: true,
      data: {
        description: content,
        features: {
          head: content,
          body: content,
          limbs: content,
          facial: content,
          expression: content,
          hair: content,
          clothing: {
            top: content,
            bottom: content,
            accessories: content
          }
        }
      }
    }

    // 记录API调用成功
    logApiCall.success(apiName, {
      status: response.status,
      usage: response.data.usage,
      contentLength: content.length,
      result: result
    }, duration)

    return result
  } catch (error: any) {
    const duration = Date.now() - startTime

    // 记录API调用失败
    logApiCall.error(apiName, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code
    }, duration)

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || '图片分析失败'
    }
  }
}

// 故事生成
export async function generateStory(params: {
  characters: Array<{ name: string; age: string; gender: string; analysis?: string }>
  outline: string
  style: string
  count: number
}): Promise<StoryResult> {
  const apiName = '故事生成'
  const startTime = Date.now()

  try {
    // 使用新的提示词模板系统
    const prompt = generateStoryPrompt({
      characters: params.characters,
      outline: params.outline,
      style: params.style || '温馨童真',
      count: params.count
    })

    // 根据豆包对话API文档构建请求
    // 参考文档: https://www.volcengine.com/docs/82379/1494384
    const requestData = {
      model: ARK_IMAGE_ANALYSIS_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 5000,
      temperature: 0.7
    }

    // 记录API调用开始
    logApiCall.start(apiName, {
      model: requestData.model,
      characters: params.characters.map(c => ({ name: c.name, age: c.age, gender: c.gender })),
      outline: params.outline,
      style: params.style,
      count: params.count,
      promptLength: prompt.length,
      max_tokens: requestData.max_tokens,
      temperature: requestData.temperature
    })

    // 添加重试机制
    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        if (retries > 0) {
          logApiCall.retry(apiName, retries + 1, maxRetries)
        }
        response = await arkClient.post('/chat/completions', requestData)
        break; // 成功则跳出循环
      } catch (error: any) {
        retries++
        logApiCall.retry(apiName, retries, maxRetries, error)

        if (retries >= maxRetries) {
          throw error; // 达到最大重试次数，抛出错误
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, retries * 2000));
      }
    }

    if (!response) {
      throw new Error('所有重试都失败了');
    }

    const content = response.data.choices[0]?.message?.content
    if (!content) {
      throw new Error('未获取到故事内容')
    }

    // 解析标题和段落 - 改进版本
    // 首先尝试提取标题
    let title = '我的绘本故事'
    const titleMatch = content.match(/(?:标题：|##\s*)(.+?)(?:\n|$)/i)
    if (titleMatch) {
      title = titleMatch[1].trim()
    }

    // 多种方式尝试解析段落
    let paragraphs: string[] = []

    // 方法1: 标准格式 "第X段："
    const standardParagraphs = content.match(/第\d+段：([^第]+?)(?=第\d+段：|$)/g)
    if (standardParagraphs && standardParagraphs.length > 0) {
      paragraphs = standardParagraphs.map((p: string) =>
        p.replace(/第\d+段：/, '').trim().replace(/\*\*/g, '')
      ).filter((p: string) => p.length > 0)
    }

    // 方法2: 如果标准格式失败，尝试识别 "**第X段**" 格式
    if (paragraphs.length === 0) {
      const starParagraphs = content.match(/\*\*第\d+段\*\*([^*]+?)(?=\*\*第\d+段\*\*|$)/g)
      if (starParagraphs && starParagraphs.length > 0) {
        paragraphs = starParagraphs.map((p: string) =>
          p.replace(/\*\*第\d+段\*\*/, '').trim().replace(/\*\*/g, '')
        ).filter((p: string) => p.length > 0)
      }
    }

    // 方法3: 智能分割混合内容
    if (paragraphs.length === 0) {
      // 移除标题行和格式标记
      let cleanContent = content
        .replace(/(?:标题：|##\s*).+?(?:\n|$)/i, '')
        .replace(/\*\*第\d+段\*\*/g, '|||SPLIT|||')
        .replace(/第\d+段：/g, '|||SPLIT|||')

      // 按分割标记分割
      const segments = cleanContent.split('|||SPLIT|||')
        .map((s: string) => s.trim().replace(/\*\*/g, ''))
        .filter((s: string) => s.length > 10) // 过滤太短的片段

      if (segments.length > 0) {
        paragraphs = segments.slice(0, params.count)
      }
    }

    // 方法4: 最后的兜底方案 - 按句号分组
    if (paragraphs.length === 0) {
      const sentences = content
        .replace(/(?:标题：|##\s*).+?(?:\n|$)/i, '')
        .split(/[。！？]/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 5)

      // 将句子分组，每组2-3个句子
      const groupedSentences = []
      for (let i = 0; i < sentences.length && groupedSentences.length < params.count; i += 2) {
        const group = sentences.slice(i, i + 2).join('。') + '。'
        if (group.length > 10) {
          groupedSentences.push(group)
        }
      }

      paragraphs = groupedSentences
    }

    // 确保段落数量符合要求
    if (paragraphs.length > params.count) {
      paragraphs = paragraphs.slice(0, params.count)
    }

    const duration = Date.now() - startTime
    const result = {
      success: true,
      data: {
        title,
        paragraphs
      }
    }

    // 记录API调用成功
    logApiCall.success(apiName, {
      status: response.status,
      usage: response.data.usage,
      contentLength: content.length,
      parsedTitle: title,
      parsedParagraphsCount: paragraphs.length,
      expectedCount: params.count,
      result: result
    }, duration)

    return result
  } catch (error: any) {
    const duration = Date.now() - startTime

    // 记录API调用失败
    logApiCall.error(apiName, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code
    }, duration)

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || '故事生成失败'
    }
  }
}

// 提取核心形象元素（增强版）
export async function extractCoreElements(params: {
  storyId: string
  characters: Array<{ name: string; analysis: string }>
  paragraphs: string[]
  title: string
}): Promise<CoreElementsResult> {
  const apiName = '核心形象元素提取'
  const startTime = Date.now()

  try {
    const prompt = generateCoreElementsPrompt({
      storyId: params.storyId,
      characters: params.characters,
      paragraphs: params.paragraphs,
      title: params.title
    })

    const requestData = {
      model: ARK_IMAGE_ANALYSIS_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 5000, // 增加token数量以获得更详细的描述
      temperature: 0.7 // 降低温度以确保一致性
    }

    // 记录API调用开始
    logApiCall.start(apiName, {
      model: requestData.model,
      storyId: params.storyId,
      title: params.title,
      charactersCount: params.characters.length,
      paragraphsCount: params.paragraphs.length,
      promptLength: prompt.length,
      max_tokens: requestData.max_tokens,
      temperature: requestData.temperature
    })

    // 使用更低的温度和更多的token来确保详细和一致的输出
    const response = await arkClient.post('/chat/completions', requestData)

    const content = response.data.choices[0]?.message?.content
    if (!content) {
      throw new Error('未获取到核心形象元素内容')
    }

    // 验证输出格式是否符合要求
    const hasRequiredSections = [
      '===== 人物一致性档案 =====',
      '===== 色彩方案 =====',
      '===== 绘画风格 ====='
    ].every(section => content.includes(section))

    let finalContent = content
    let isRetry = false

    if (!hasRequiredSections) {
      logApiCall.retry(apiName, 1, 1, new Error('格式不完整，需要重新生成'))

      // 如果格式不完整，尝试用更明确的提示词重新生成
      const retryPrompt = prompt + `

【重要提醒】
请严格按照指定格式输出，必须包含以下部分：
===== 人物一致性档案 =====
===== 物品一致性档案 =====
===== 环境一致性档案 =====
===== 色彩方案 =====
===== 绘画风格 =====

每个部分都要详细填写，不能省略。`

      const retryResponse = await arkClient.post('/chat/completions', {
        model: ARK_IMAGE_ANALYSIS_MODEL,
        messages: [
          {
            role: 'user',
            content: retryPrompt
          }
        ],
        max_tokens: 5000,
        temperature: 0.5 // 进一步降低温度
      })

      const retryContent = retryResponse.data.choices[0]?.message?.content
      if (retryContent) {
        finalContent = retryContent
        isRetry = true
      }
    }

    const duration = Date.now() - startTime
    const result = {
      success: true,
      data: {
        coreElements: finalContent
      }
    }

    // 记录API调用成功
    logApiCall.success(apiName, {
      status: response.status,
      usage: response.data.usage,
      contentLength: finalContent.length,
      hasRequiredSections: hasRequiredSections,
      isRetry: isRetry,
      sectionsFound: [
        '===== 人物一致性档案 =====',
        '===== 物品一致性档案 =====',
        '===== 环境一致性档案 =====',
        '===== 色彩方案 =====',
        '===== 绘画风格 ====='
      ].filter(section => finalContent.includes(section)),
      result: result
    }, duration)

    return result
  } catch (error: any) {
    const duration = Date.now() - startTime

    // 记录API调用失败
    logApiCall.error(apiName, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code
    }, duration)

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || '核心形象元素提取失败'
    }
  }
}

// 生成插图提示词（增强一致性版本）
export async function generateImagePrompt(params: {
  storyId: string
  characters: Array<{ name: string; analysis: string }>
  paragraphs: string[]
  title: string
}): Promise<PromptResult> {
  const apiName = '插图提示词生成'
  const startTime = Date.now()

  try {
    // 优化：直接生成基础一致性描述，减少API调用次数
    const coreElements = generateBasicConsistencyElements(params.characters)

    // 第二步：基于核心形象元素生成插图提示词
    const prompt = generateConsistentImagePrompt({
      storyId: params.storyId,
      characters: params.characters,
      paragraphs: params.paragraphs,
      title: params.title,
      coreElements: coreElements
    })

    const requestData = {
      model: ARK_IMAGE_ANALYSIS_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 5000, // 适中的token数量，平衡速度和质量
      temperature: 0.7 // 较低温度确保一致性
    }

    // 记录API调用开始
    logApiCall.start(apiName, {
      model: requestData.model,
      storyId: params.storyId,
      title: params.title,
      charactersCount: params.characters.length,
      paragraphsCount: params.paragraphs.length,
      hasCoreElements: !!coreElements,
      coreElementsLength: coreElements.length,
      promptLength: prompt.length,
      max_tokens: requestData.max_tokens,
      temperature: requestData.temperature,
      consistencyMode: true
    })

    const response = await arkClient.post('/chat/completions', requestData)

    const content = response.data.choices[0]?.message?.content
    if (!content) {
      throw new Error('未获取到提示词内容')
    }

    // 解析响应并应用一致性增强
    const result = parseConsistentImagePromptResponse(content, params.paragraphs.length, coreElements, params.title)

    const duration = Date.now() - startTime

    // 记录API调用成功
    logApiCall.success(apiName, {
      status: response.status,
      usage: response.data.usage,
      contentLength: content.length,
      parsedCover: !!result.cover,
      parsedPages: result.pages.length,
      parsedEnding: !!result.ending,
      expectedPages: params.paragraphs.length,
      coreElementsUsed: !!coreElements,
      averageDescriptionLength: Math.round([result.cover, ...result.pages, result.ending].reduce((sum, desc) => sum + desc.length, 0) / (result.pages.length + 2)),
      result: {
        success: true,
        data: result
      }
    }, duration)

    return {
      success: true,
      data: result
    }
  } catch (error: any) {
    const duration = Date.now() - startTime

    // 记录API调用失败
    logApiCall.error(apiName, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code
    }, duration)

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || '提示词生成失败'
    }
  }
}

// 快速生成插图提示词（单次调用版本）
export async function generateImagePromptFast(params: {
  storyId: string
  characters: Array<{ name: string; analysis: string }>
  paragraphs: string[]
  title: string
}): Promise<PromptResult> {
  const apiName = '快速插图提示词生成'
  const startTime = Date.now()

  try {
    // 使用精简的提示词，专注于快速生成
    const characterInfo = params.characters.map(char =>
      `${char.name}：${char.analysis.split('，').slice(0, 3).join('，')}`
    ).join('；')

    const prompt = `作为儿童绘本插画师，为《${params.title}》生成插图描述。

角色：${characterInfo}

故事：${params.paragraphs.map((p, i) => `${i + 1}.${p}`).join(' ')}

要求：保持角色一致，温馨儿童风格，每个描述60-80字。

格式：
封面：[描述]
页1：[描述]
页2：[描述]
页3：[描述]
页4：[描述]
页5：[描述]
结尾：[描述]`

    const requestData = {
      model: ARK_IMAGE_ANALYSIS_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000, // 进一步减少token
      temperature: 0.7 // 稍高温度，提高生成速度
    }

    logApiCall.start(apiName, {
      model: requestData.model,
      promptLength: prompt.length,
      max_tokens: requestData.max_tokens,
      temperature: requestData.temperature,
      mode: 'fast'
    })

    const response = await arkClient.post('/chat/completions', requestData)
    const content = response.data.choices[0]?.message?.content

    if (!content) {
      throw new Error('未获取到提示词内容')
    }

    // 快速解析
    const result = parseFastResponse(content, params.paragraphs.length)
    const duration = Date.now() - startTime

    logApiCall.success(apiName, {
      status: response.status,
      usage: response.data.usage,
      contentLength: content.length,
      result: { success: true, data: result }
    }, duration)

    return { success: true, data: result }
  } catch (error: any) {
    const duration = Date.now() - startTime
    logApiCall.error(apiName, { message: error.message }, duration)
    return { success: false, error: error.message || '快速提示词生成失败' }
  }
}

// 快速解析响应
const parseFastResponse = (content: string, expectedPages: number) => {
  const lines = content.split('\n').filter(line => line.trim())

  const cover = lines.find(line => /^封面[：:]/.test(line))?.replace(/^封面[：:]/, '').trim() ||
    '温馨的绘本封面，画面中清晰显示故事标题，展现主要角色和故事主题'

  const ending = lines.find(line => /^结尾[：:]/.test(line))?.replace(/^结尾[：:]/, '').trim() ||
    '温馨的故事结尾，传达圆满和幸福'

  const pages: string[] = []
  for (let i = 1; i <= expectedPages; i++) {
    const page = lines.find(line => new RegExp(`^页${i}[：:]`).test(line))?.replace(new RegExp(`^页${i}[：:]`), '').trim() ||
      `第${i}页的温馨插图场景，保持角色一致性`
    pages.push(page)
  }

  return { cover, pages, ending, coreElements: null }
}

// 生成单页图片提示词（带一致性验证）
export async function generateSinglePagePrompt(params: {
  pageType: 'cover' | 'content' | 'ending'
  pageIndex?: number
  content: string
  title: string
  coreElements: string
  previousImages?: string[]
}): Promise<{ success: boolean; data?: { prompt: string }; error?: string }> {
  const apiName = '单页提示词生成'
  const startTime = Date.now()

  try {
    const prompt = generateSingleImagePrompt({
      pageType: params.pageType,
      pageIndex: params.pageIndex,
      content: params.content,
      title: params.title,
      coreElements: params.coreElements,
      previousImages: params.previousImages
    })

    const requestData = {
      model: ARK_IMAGE_ANALYSIS_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 8000,
      temperature: 0.7 // 使用很低的温度确保一致性
    }

    // 记录API调用开始
    logApiCall.start(apiName, {
      model: requestData.model,
      pageType: params.pageType,
      pageIndex: params.pageIndex,
      title: params.title,
      contentLength: params.content.length,
      coreElementsLength: params.coreElements.length,
      previousImagesCount: params.previousImages?.length || 0,
      promptLength: prompt.length,
      max_tokens: requestData.max_tokens,
      temperature: requestData.temperature
    })

    const response = await arkClient.post('/chat/completions', requestData)

    const content = response.data.choices[0]?.message?.content
    if (!content) {
      throw new Error('未获取到单页提示词内容')
    }

    const duration = Date.now() - startTime
    const result = {
      success: true,
      data: {
        prompt: content.trim()
      }
    }

    // 记录API调用成功
    logApiCall.success(apiName, {
      status: response.status,
      usage: response.data.usage,
      contentLength: content.length,
      promptLength: content.trim().length,
      result: result
    }, duration)

    return result
  } catch (error: any) {
    const duration = Date.now() - startTime

    // 记录API调用失败
    logApiCall.error(apiName, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code
    }, duration)

    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || '单页提示词生成失败'
    }
  }
}

// 图片生成
export async function generateImage(params: {
  prompt: string
  type: 'cover' | 'content' | 'ending'
  storyId: string
  title: string
}): Promise<ImageResult> {
  const apiName = '图片生成'
  const startTime = Date.now()

  try {
    // 根据类型设置不同的尺寸
    let width = 1024, height = 1024
    if (params.type === 'cover' || params.type === 'ending') {
      width = 1024
      height = 1448
    }

    // 确保提示词不为空
    if (!params.prompt || params.prompt.trim() === '') {
      console.warn('提示词为空，使用默认提示词')
      params.prompt = '童话风格的绘本插图，色彩明亮，适合儿童'
    }

    // 根据图片类型确定优化策略
    const imageType = params.prompt.includes('封面') ? 'cover' :
      params.prompt.includes('结尾') ? 'ending' : 'content'

    const optimizedPrompt = optimizeImagePrompt(params.prompt, imageType, params.title)

    // 为封面添加特殊的标题显示要求
    const titleRequirement = imageType === 'cover' && params.title ? `

【标题文字要求】
- 标题内容："${params.title}"
- 文字位置：画面上方或下方显著位置，不遮挡主要角色
- 字体风格：儿童友好的装饰性字体，圆润可爱
- 文字颜色：与背景形成良好对比，确保清晰可读
- 文字大小：占画面宽度的60-80%，足够醒目
- 装饰效果：可添加阴影、描边或简单装饰，增强视觉效果` : ''

    const enhancedPrompt = `${optimizedPrompt}${titleRequirement}

【专业绘画技法】
- 艺术风格：儿童绘本插画，手绘水彩质感，温暖治愈系
- 色彩理论：采用暖色调为主（黄、橙、粉），冷色调为辅（蓝、绿）
- 笔触特点：柔和圆润的线条，无锐利边角，体现安全感
- 质感表现：丰富的纹理层次，但不过于复杂，保持清晰度

【构图美学】
- 视觉中心：运用三分法则，主体位置符合儿童视觉习惯
- 空间层次：前中后景分明，营造立体感和深度
- 色彩平衡：主色调统一，局部亮色点缀，整体和谐
- 情绪引导：通过构图和色彩引导正面情绪

【儿童心理学考量】
- 安全感：所有元素圆润可爱，无威胁性暗示
- 认知友好：符合3-6岁儿童的认知发展水平
- 情感共鸣：贴近儿童生活经验，易于理解和接受
- 审美培养：精美的艺术品质，培养儿童审美能力

【技术规格】高清分辨率，专业印刷品质，色彩饱和度适中，适合纸质出版`

    // 根据豆包文生图API文档构建请求数据
    // 参考文档: https://www.volcengine.com/docs/82379/1541523
    const requestData = {
      model: ARK_TEXT_TO_IMAGE_MODEL,
      prompt: enhancedPrompt,
      n: 1,
      size: `${width}x${height}`,
      response_format: "b64_json",
      watermark: false
    }

    // 记录API调用开始
    logApiCall.start(apiName, {
      model: requestData.model,
      type: params.type,
      storyId: params.storyId,
      title: params.title,
      originalPromptLength: params.prompt.length,
      enhancedPromptLength: enhancedPrompt.length,
      imageSize: `${width}x${height}`,
      n: requestData.n,
      response_format: requestData.response_format,
      watermark: requestData.watermark
    })

    // 使用axios调用豆包API
    let retries = 0;
    const maxRetries = 3;
    let responseData = null;
    let finalResponse = null;

    while (retries < maxRetries) {
      try {
        if (retries > 0) {
          logApiCall.retry(apiName, retries + 1, maxRetries)
        }

        // 根据豆包文生图API文档，正确的端点是 /images/generations
        const response = await arkClient.post('/images/generations', requestData);

        responseData = response.data;
        finalResponse = response;
        break;
      } catch (error: any) {
        retries++;
        logApiCall.retry(apiName, retries, maxRetries, error)

        if (retries >= maxRetries) {
          // 构造详细的错误信息
          let errorMessage = '图片生成失败';
          if (error.response) {
            const status = error.response.status;
            const data = error.response.data;

            if (status === 401) {
              errorMessage = 'API认证失败，请检查API密钥';
            } else if (status === 403) {
              errorMessage = 'API权限不足，请检查API密钥权限';
            } else if (status === 404) {
              errorMessage = 'API端点不存在，请检查API配置';
            } else if (status === 429) {
              errorMessage = 'API请求过于频繁，请稍后重试';
            } else if (status === 500) {
              errorMessage = 'API服务器内部错误';
            } else if (data && data.error && data.error.message) {
              errorMessage = `API错误: ${data.error.message}`;
            } else {
              errorMessage = `API请求失败 (状态码: ${status})`;
            }
          } else if (error.code === 'ECONNREFUSED') {
            errorMessage = '无法连接到API服务器，请检查网络连接';
          } else if (error.code === 'ETIMEDOUT') {
            errorMessage = 'API请求超时，请稍后重试';
          }

          const detailedError = new Error(errorMessage);
          (detailedError as any).originalError = error;
          throw detailedError;
        }

        // 等待一段时间后重试
        await new Promise(resolve => setTimeout(resolve, retries * 2000));
      }
    }

    if (!responseData) {
      throw new Error('所有重试都失败了');
    }

    // 根据豆包API文档检查响应数据结构
    if (!responseData || !responseData.data || !Array.isArray(responseData.data) || responseData.data.length === 0) {
      throw new Error('无效的图片生成响应');
    }

    // 根据豆包API文档获取图片数据
    const imageData = responseData.data[0]?.b64_json;
    if (!imageData) {
      throw new Error('未获取到图片数据');
    }

    const duration = Date.now() - startTime
    const result = {
      success: true,
      data: {
        image: imageData
      }
    }

    // 记录API调用成功
    logApiCall.success(apiName, {
      status: finalResponse?.status,
      usage: responseData.usage,
      dataCount: responseData.data.length,
      imageDataLength: imageData.length,
      retries: retries,
      result: result
    }, duration)

    return result;
  } catch (error: any) {
    const duration = Date.now() - startTime

    // 提供详细的错误信息
    let errorMessage = '图片生成失败';
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;

      if (status === 401) {
        errorMessage = 'API认证失败，请检查API密钥是否正确';
      } else if (status === 403) {
        errorMessage = 'API权限不足，请检查API密钥是否有文生图权限';
      } else if (status === 404) {
        errorMessage = 'API端点不存在，请检查API配置是否正确';
      } else if (status === 429) {
        errorMessage = 'API请求过于频繁，请稍后重试';
      } else if (status === 500) {
        errorMessage = 'API服务器内部错误，请稍后重试';
      } else if (data && data.error && data.error.message) {
        errorMessage = `API错误: ${data.error.message}`;
      } else {
        errorMessage = `API请求失败 (状态码: ${status})`;
      }
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = '无法连接到API服务器，请检查网络连接';
    } else if (error.code === 'ETIMEDOUT') {
      errorMessage = 'API请求超时，请稍后重试';
    } else if (error.message) {
      errorMessage = error.message;
    }

    // 记录API调用失败
    logApiCall.error(apiName, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
      originalError: error.originalError
    }, duration)

    return {
      success: false,
      error: errorMessage
    };
  }
}