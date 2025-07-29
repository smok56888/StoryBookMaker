// 测试豆包API日志系统
// 注意：这是一个演示测试文件，展示日志输出格式

// 模拟豆包API调用的日志输出
function testApiLogging() {
  console.log('🧪 开始测试豆包API日志系统...\n');

  // 模拟日志工具函数
  const logApiCall = {
    start: (apiName, params) => {
      const sanitizedParams = sanitizeLogData(params)
      console.log(`\n🚀 [豆包API] ${apiName} - 开始调用`)
      console.log(`📋 [豆包API] ${apiName} - 调用参数:`, JSON.stringify(sanitizedParams, null, 2))
      console.log(`⏰ [豆包API] ${apiName} - 调用时间:`, new Date().toISOString())
    },
    
    success: (apiName, response, duration) => {
      const sanitizedResponse = sanitizeLogData(response)
      console.log(`✅ [豆包API] ${apiName} - 调用成功`)
      console.log(`📊 [豆包API] ${apiName} - 响应数据:`, JSON.stringify(sanitizedResponse, null, 2))
      if (duration) {
        console.log(`⏱️  [豆包API] ${apiName} - 耗时: ${duration}ms`)
      }
      console.log(`🏁 [豆包API] ${apiName} - 完成时间:`, new Date().toISOString())
    },
    
    error: (apiName, error, duration) => {
      const sanitizedError = sanitizeLogData(error)
      console.log(`❌ [豆包API] ${apiName} - 调用失败`)
      console.log(`💥 [豆包API] ${apiName} - 错误信息:`, JSON.stringify(sanitizedError, null, 2))
      if (duration) {
        console.log(`⏱️  [豆包API] ${apiName} - 耗时: ${duration}ms`)
      }
      console.log(`🏁 [豆包API] ${apiName} - 失败时间:`, new Date().toISOString())
    },
    
    retry: (apiName, attempt, maxRetries, error) => {
      console.log(`🔄 [豆包API] ${apiName} - 重试 ${attempt}/${maxRetries}`)
      if (error) {
        console.log(`🔍 [豆包API] ${apiName} - 重试原因:`, error.message || error)
      }
    }
  }

  // 数据清理函数
  const sanitizeLogData = (data) => {
    if (!data) return data
    
    const sanitize = (obj) => {
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
        const sanitized = {}
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'Authorization' || key === 'authorization') {
            sanitized[key] = '[API_KEY_HIDDEN]'
          } else if (key === 'image' && typeof value === 'string' && value.length > 100) {
            sanitized[key] = `[BASE64_IMAGE:${value.length}字符]`
          } else if (key === 'b64_json' && typeof value === 'string') {
            sanitized[key] = `[BASE64_JSON:${value.length}字符]`
          } else if (key === 'prompt' && typeof value === 'string' && value.length > 300) {
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

  // 测试1: 故事生成API调用日志
  console.log('📖 测试1: 故事生成API调用日志')
  const storyParams = {
    model: 'doubao-seed-1-6-250615',
    characters: [
      { name: '小明', age: '5', gender: 'male' },
      { name: '小花', age: '4', gender: 'female' }
    ],
    outline: '小明和小花在公园里帮助迷路的小猫找到妈妈的温馨故事',
    style: '友谊成长',
    count: 5,
    promptLength: 1250,
    max_tokens: 2000,
    temperature: 0.7
  }

  logApiCall.start('故事生成', storyParams)
  
  // 模拟成功响应
  setTimeout(() => {
    const storyResponse = {
      status: 200,
      usage: {
        prompt_tokens: 156,
        completion_tokens: 445,
        total_tokens: 601
      },
      contentLength: 892,
      parsedTitle: '小明和小花的善良之心',
      parsedParagraphsCount: 5,
      expectedCount: 5,
      result: {
        success: true,
        data: {
          title: '小明和小花的善良之心',
          paragraphs: ['段落1...', '段落2...', '段落3...', '段落4...', '段落5...']
        }
      }
    }
    
    logApiCall.success('故事生成', storyResponse, 3240)
  }, 100)

  // 测试2: 图片生成API调用日志
  setTimeout(() => {
    console.log('\n🎨 测试2: 图片生成API调用日志')
    const imageParams = {
      model: 'doubao-seedream-3-0-t2i-250415',
      type: 'cover',
      storyId: 'story_123456',
      title: '小明和小花的善良之心',
      originalPromptLength: 245,
      enhancedPromptLength: 1680,
      imageSize: '1024x1448',
      n: 1,
      response_format: 'b64_json',
      watermark: false
    }

    logApiCall.start('图片生成', imageParams)
    
    // 模拟重试
    setTimeout(() => {
      logApiCall.retry('图片生成', 1, 3, new Error('网络超时'))
    }, 200)
    
    // 模拟成功响应
    setTimeout(() => {
      const imageResponse = {
        status: 200,
        usage: {
          prompt_tokens: 234,
          completion_tokens: 0,
          total_tokens: 234
        },
        dataCount: 1,
        imageDataLength: 245678, // 模拟base64图片长度
        retries: 1,
        result: {
          success: true,
          data: {
            image: '[BASE64_IMAGE:245678字符]'
          }
        }
      }
      
      logApiCall.success('图片生成', imageResponse, 8750)
    }, 400)
  }, 500)

  // 测试3: 核心形象元素提取API调用日志
  setTimeout(() => {
    console.log('\n🎯 测试3: 核心形象元素提取API调用日志')
    const coreElementsParams = {
      model: 'doubao-seed-1-6-250615',
      storyId: 'story_123456',
      title: '小明和小花的善良之心',
      charactersCount: 2,
      paragraphsCount: 5,
      promptLength: 2340,
      max_tokens: 2000,
      temperature: 0.2
    }

    logApiCall.start('核心形象元素提取', coreElementsParams)
    
    // 模拟成功响应
    setTimeout(() => {
      const coreElementsResponse = {
        status: 200,
        usage: {
          prompt_tokens: 345,
          completion_tokens: 678,
          total_tokens: 1023
        },
        contentLength: 1456,
        hasRequiredSections: true,
        isRetry: false,
        sectionsFound: [
          '===== 人物一致性档案 =====',
          '===== 物品一致性档案 =====',
          '===== 环境一致性档案 =====',
          '===== 色彩方案 =====',
          '===== 绘画风格 ====='
        ],
        result: {
          success: true,
          data: {
            coreElements: '===== 人物一致性档案 =====\n小明\n- 头部：发型[黑色短发，略微蓬松]...[截断:总长度1456字符]...整体质感：[手绘/数字绘画/水彩等]'
          }
        }
      }
      
      logApiCall.success('核心形象元素提取', coreElementsResponse, 4560)
    }, 300)
  }, 1000)

  // 测试4: API调用失败日志
  setTimeout(() => {
    console.log('\n💥 测试4: API调用失败日志')
    const failParams = {
      model: 'doubao-seed-1-6-250615',
      prompt: '测试提示词...',
      max_tokens: 1000,
      temperature: 0.5
    }

    logApiCall.start('图片分析', failParams)
    
    // 模拟失败响应
    setTimeout(() => {
      const errorInfo = {
        message: 'API请求失败',
        status: 429,
        data: {
          error: {
            message: 'Rate limit exceeded',
            type: 'rate_limit_error',
            code: 'rate_limit_exceeded'
          }
        },
        code: 'RATE_LIMIT'
      }
      
      logApiCall.error('图片分析', errorInfo, 1200)
    }, 200)
  }, 1500)

  // 测试5: HTTP请求/响应拦截器日志
  setTimeout(() => {
    console.log('\n🌐 测试5: HTTP请求/响应拦截器日志')
    
    // 模拟HTTP请求日志
    console.log(`🌐 [HTTP请求] POST https://api.doubao.com/chat/completions`)
    console.log(`📤 [HTTP请求] 请求头:`, {
      'Authorization': '[API_KEY_HIDDEN]',
      'Content-Type': 'application/json',
      'User-Agent': 'axios/1.6.0'
    })
    console.log(`📦 [HTTP请求] 请求体:`, {
      model: 'doubao-seed-1-6-250615',
      messages: [
        {
          role: 'user',
          content: '请生成一个儿童故事...[截断:总长度1250字符]...温馨的结尾。'
        }
      ],
      max_tokens: 2000,
      temperature: 0.7
    })
    
    // 模拟HTTP响应日志
    setTimeout(() => {
      console.log(`📥 [HTTP响应] 200 OK`)
      console.log(`📊 [HTTP响应] 响应头:`, {
        'content-type': 'application/json',
        'x-request-id': 'req_123456789',
        'x-ratelimit-remaining': '99'
      })
      console.log(`📋 [HTTP响应] 响应体:`, {
        id: 'chatcmpl-123456',
        object: 'chat.completion',
        created: 1703123456,
        model: 'doubao-seed-1-6-250615',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: '标题：小明和小花的善良之心\n\n第1段：小明和小花在公园里玩耍...[截断:总长度892字符]...开心地笑了。'
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 156,
          completion_tokens: 445,
          total_tokens: 601
        }
      })
    }, 100)
  }, 2000)

  console.log('\n✨ 豆包API日志系统测试完成')
  console.log('\n📝 日志功能说明:')
  console.log('- 🚀 API调用开始: 记录调用参数和时间')
  console.log('- ✅ API调用成功: 记录响应数据和耗时')
  console.log('- ❌ API调用失败: 记录错误信息和耗时')
  console.log('- 🔄 API重试: 记录重试次数和原因')
  console.log('- 🌐 HTTP拦截器: 记录请求和响应详情')
  console.log('- 📋 数据清理: 自动简化长内容和敏感信息')
}

// 运行测试
testApiLogging()