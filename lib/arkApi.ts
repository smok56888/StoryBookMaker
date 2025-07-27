import axios from 'axios'
import { generateStoryPrompt, generateImagePrompt as generateImagePromptTemplate } from './promptTemplates'

// 豆包API配置
const ARK_BASE_URL = process.env.ARK_BASE_URL || 'https://api.doubao.com'
const ARK_API_KEY = process.env.ARK_API_KEY || '75879918-5f2c-4c02-8276-caf865b06b06'
const ARK_TEXT_TO_IMAGE_MODEL = process.env.ARK_TEXT_TO_IMAGE_MODEL || 'doubao-seedream-3-0-t2i-250415'
const ARK_IMAGE_ANALYSIS_MODEL = process.env.ARK_IMAGE_ANALYSIS_MODEL || 'doubao-seed-1-6-250615'

// 提示词优化辅助函数（保留用于图片生成优化）

const optimizeImagePrompt = (originalPrompt: string, imageType: 'cover' | 'content' | 'ending') => {
  // 根据图片类型添加特定的优化指令
  const typeSpecificPrompts = {
    cover: '封面设计，需要包含故事标题，整体构图要吸引眼球，展现故事主题',
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
  timeout: 180000 // 增加到180秒超时
})

// 添加请求拦截器，用于调试
arkClient.interceptors.request.use(
  config => {
    console.log(`发送请求到: ${config.baseURL}${config.url}`)
    console.log('请求头:', JSON.stringify(config.headers, null, 2))
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 添加响应拦截器，用于调试
arkClient.interceptors.response.use(
  response => {
    console.log(`收到响应: ${response.status}`)
    return response
  },
  error => {
    console.error('响应错误:', error.response?.status, error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// 图片分析
export async function analyzeImage(imageBase64: string): Promise<AnalyzeResult> {
  try {
    const prompt = `请详细分析这张人物图片，提取以下信息：
1. 头部特征：五官、表情、神态
2. 发型发色：具体描述
3. 躯干特征：体型、姿态
4. 四肢特征：手臂、腿部
5. 服装细节：上衣、下衣、袜子、配饰等
6. 整体风格：年龄感、性格特征

请以结构化的方式描述，用于后续绘本插图的一致性参考。这是给3-6岁儿童看的绘本，需要保持童真可爱的风格。`

    // 根据豆包图片解析API文档构建请求
    // 参考文档: https://www.volcengine.com/docs/82379/1362931
    const response = await arkClient.post('/chat/completions', {
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
      max_tokens: 1000,
      temperature: 0.3
    })

    const content = response.data.choices[0]?.message?.content
    if (!content) {
      throw new Error('未获取到分析结果')
    }

    return {
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
  } catch (error: any) {
    console.error('图片分析失败:', error)
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
  try {
    console.log('生成故事参数:', JSON.stringify(params, null, 2))

    // 使用新的提示词模板系统
    const prompt = generateStoryPrompt({
      characters: params.characters,
      outline: params.outline,
      style: params.style || '温馨童真',
      count: params.count
    })

    console.log('发送到豆包的提示词:', prompt)

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
      max_tokens: 2000,
      temperature: 0.7
    }

    console.log('请求数据:', JSON.stringify(requestData, null, 2))

    // 添加重试机制
    let response;
    let retries = 0;
    const maxRetries = 3;

    while (retries < maxRetries) {
      try {
        console.log(`尝试生成故事 (尝试 ${retries + 1}/${maxRetries})`)
        response = await arkClient.post('/chat/completions', requestData)
        break; // 成功则跳出循环
      } catch (error: any) {
        retries++
        console.error(`故事生成尝试 ${retries}/${maxRetries} 失败:`, error.message)

        if (retries >= maxRetries) {
          throw error; // 达到最大重试次数，抛出错误
        }

        // 等待一段时间后重试
        console.log(`等待 ${retries * 2} 秒后重试...`)
        await new Promise(resolve => setTimeout(resolve, retries * 2000));
      }
    }

    if (!response) {
      throw new Error('所有重试都失败了');
    }

    console.log('豆包API响应:', JSON.stringify(response.data, null, 2))

    const content = response.data.choices[0]?.message?.content
    if (!content) {
      throw new Error('未获取到故事内容')
    }

    console.log('豆包返回的内容:', content)

    // 解析标题和段落
    const lines = content.split('\n').filter((line: string) => line.trim())
    const titleMatch = lines.find((line: string) => line.includes('标题：'))
    const title = titleMatch ? titleMatch.replace('标题：', '').trim() : '我的绘本故事'

    const paragraphs = lines
      .filter((line: string) => /第\d+段：/.test(line))
      .map((line: string) => line.replace(/第\d+段：/, '').trim())
      .filter((p: string) => p.length > 0)

    if (paragraphs.length === 0) {
      console.log('未找到标准格式的段落，尝试按行分割')
      // 如果没有找到标准格式，尝试按行分割
      const allParagraphs = lines
        .filter((line: string) => !line.includes('标题：') && line.length > 20)
        .slice(0, params.count)

      if (allParagraphs.length === 0) {
        console.log('按行分割也未找到合适段落，尝试直接分割内容')
        // 如果按行分割也没有找到合适的段落，直接将内容按句号分割
        const sentences = content.split('。').filter((s: string) => s.trim().length > 0).map((s: string) => s + '。')
        const groupedSentences = []

        // 将句子分组，每2-3个句子一组
        for (let i = 0; i < sentences.length; i += 2) {
          if (i + 1 < sentences.length) {
            groupedSentences.push(sentences[i] + sentences[i + 1])
          } else {
            groupedSentences.push(sentences[i])
          }
        }

        return {
          success: true,
          data: {
            title,
            paragraphs: groupedSentences.slice(0, params.count)
          }
        }
      }

      return {
        success: true,
        data: {
          title,
          paragraphs: allParagraphs
        }
      }
    }

    console.log('解析出的段落:', paragraphs)

    return {
      success: true,
      data: {
        title,
        paragraphs: paragraphs.slice(0, params.count)
      }
    }
  } catch (error: any) {
    console.error('故事生成失败:', error)
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || '故事生成失败'
    }
  }
}

// 生成插图提示词
export async function generateImagePrompt(params: {
  storyId: string
  characters: Array<{ name: string; analysis: string }>
  paragraphs: string[]
  title: string
}): Promise<PromptResult> {
  try {
    // 使用新的提示词模板系统
    const prompt = generateImagePromptTemplate({
      storyId: params.storyId,
      characters: params.characters,
      paragraphs: params.paragraphs,
      title: params.title
    })

    const response = await arkClient.post('/chat/completions', {
      model: ARK_IMAGE_ANALYSIS_MODEL,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.6
    })

    const content = response.data.choices[0]?.message?.content
    if (!content) {
      throw new Error('未获取到提示词内容')
    }

    // 解析提示词
    const lines = content.split('\n').filter((line: string) => line.trim())
    const coverMatch = lines.find((line: string) => line.includes('封面：'))
    const cover = coverMatch ? coverMatch.replace('封面：', '').trim() : '温馨的故事封面场景'

    const endingMatch = lines.find((line: string) => line.includes('结尾页：'))
    const ending = endingMatch ? endingMatch.replace('结尾页：', '').trim() : '温馨的故事结尾场景'

    const pages = lines
      .filter((line: string) => /第\d+页：/.test(line))
      .map((line: string) => line.replace(/第\d+页：/, '').trim())
      .filter((p: string) => p.length > 0)

    return {
      success: true,
      data: {
        cover,
        pages: pages.length > 0 ? pages : params.paragraphs.map(() => '温馨的童话场景'),
        ending
      }
    }
  } catch (error: any) {
    console.error('提示词生成失败:', error)
    return {
      success: false,
      error: error.response?.data?.error?.message || error.message || '提示词生成失败'
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
  try {
    console.log('图片生成参数:', JSON.stringify({
      type: params.type,
      storyId: params.storyId,
      title: params.title,
      promptLength: params.prompt.length
    }, null, 2))

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
    
    const optimizedPrompt = optimizeImagePrompt(params.prompt, imageType)
    
    const enhancedPrompt = `${optimizedPrompt}

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

    console.log('发送到豆包的图片生成提示词:', enhancedPrompt)

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

    console.log('豆包API请求数据:', JSON.stringify(requestData, null, 2))

    // 使用axios调用豆包API
    let retries = 0;
    const maxRetries = 3;
    let responseData = null;

    while (retries < maxRetries) {
      try {
        console.log(`尝试生成图片 (尝试 ${retries + 1}/${maxRetries})`)

        // 实际API调用 - 使用正确的豆包API端点
        console.log(`发送请求到: ${ARK_BASE_URL}/images/generations`);
        console.log('请求头:', {
          'Authorization': `Bearer ${ARK_API_KEY}`,
          'Content-Type': 'application/json'
        });

        // 根据豆包文生图API文档，正确的端点是 /images/generations
        const response = await arkClient.post('/images/generations', requestData);

        console.log('收到响应状态:', response.status);
        console.log('响应头:', JSON.stringify(response.headers, null, 2));

        responseData = response.data;
        console.log('请求成功，收到响应');
        break;
      } catch (error: any) {
        retries++;
        console.error(`图片生成尝试 ${retries}/${maxRetries} 失败:`, error.message);

        // 详细记录错误信息
        if (error.response) {
          console.error('响应状态:', error.response.status);
          console.error('响应数据:', JSON.stringify(error.response.data, null, 2));
        }

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
        console.log(`等待 ${retries * 2} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, retries * 2000));
      }
    }

    if (!responseData) {
      throw new Error('所有重试都失败了');
    }

    console.log('豆包图片生成API响应数据结构:', Object.keys(responseData));

    // 根据豆包API文档检查响应数据结构
    if (!responseData || !responseData.data || !Array.isArray(responseData.data) || responseData.data.length === 0) {
      console.error('无效的图片生成响应:', JSON.stringify(responseData, null, 2));
      throw new Error('无效的图片生成响应');
    }

    // 根据豆包API文档获取图片数据
    const imageData = responseData.data[0]?.b64_json;
    if (!imageData) {
      console.error('响应中没有图片数据:', JSON.stringify(responseData, null, 2));
      throw new Error('未获取到图片数据');
    }

    return {
      success: true,
      data: {
        image: imageData
      }
    };
  } catch (error: any) {
    console.error('图片生成失败:', error);

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

    return {
      success: false,
      error: errorMessage
    };
  }
}