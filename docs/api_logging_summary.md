# 豆包API接口调用日志系统

## 概述

为了更好地监控和调试豆包API的调用情况，我们实现了一套完整的接口调用日志系统。该系统能够详细记录所有API调用的参数、返回值、耗时和错误信息，同时对长内容和敏感信息进行智能简化处理。

## 核心功能

### 1. 全面的日志记录

#### API调用生命周期跟踪
- **调用开始**: 记录调用参数、时间戳
- **调用成功**: 记录响应数据、耗时统计
- **调用失败**: 记录错误信息、失败原因
- **重试机制**: 记录重试次数、重试原因

#### HTTP请求/响应拦截
- **请求拦截**: 记录请求方法、URL、请求头、请求体
- **响应拦截**: 记录响应状态、响应头、响应体
- **错误拦截**: 记录网络错误、超时等异常情况

### 2. 智能数据清理

#### 长内容简化
```typescript
// 超过500字符的文本自动截断
"这是一个很长的提示词内容..." → "这是一个很长的提示词内容...[截断:总长度1250字符]...结尾部分"
```

#### 敏感信息保护
```typescript
// API密钥自动隐藏
"Authorization": "Bearer sk-1234567890" → "Authorization": "[API_KEY_HIDDEN]"

// Base64图片数据简化显示
"data:image/jpeg;base64,/9j/4AAQ..." → "[BASE64_IMAGE_DATA:245678字符]"
```

#### 结构化数据处理
- 递归处理嵌套对象和数组
- 保持数据结构完整性
- 智能识别特殊字段类型

### 3. 分类日志标识

#### 日志级别标识
- 🚀 **API调用开始**: 蓝色火箭图标
- ✅ **API调用成功**: 绿色对勾图标
- ❌ **API调用失败**: 红色叉号图标
- 🔄 **API重试**: 黄色循环图标
- 🌐 **HTTP请求**: 地球图标
- 📥 **HTTP响应**: 收件箱图标

#### 信息类型标识
- 📋 **调用参数**: 剪贴板图标
- 📊 **响应数据**: 图表图标
- 💥 **错误信息**: 爆炸图标
- ⏱️ **耗时统计**: 秒表图标
- 🏁 **完成时间**: 旗帜图标

## 实现细节

### 1. 日志工具函数

```typescript
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
```

### 2. 数据清理函数

```typescript
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
        // 特殊处理敏感字段
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
```

### 3. HTTP拦截器增强

```typescript
// 请求拦截器
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

// 响应拦截器
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
```

## 覆盖的API接口

### 1. 图片分析 (analyzeImage)
- **调用参数**: 模型、提示词、图片大小、token限制、温度
- **响应数据**: 状态码、使用量统计、内容长度、分析结果
- **特殊处理**: 图片base64数据自动简化显示

### 2. 故事生成 (generateStory)
- **调用参数**: 模型、角色信息、故事大纲、风格、段落数量
- **响应数据**: 状态码、使用量统计、解析结果、段落数量
- **特殊处理**: 长提示词自动截断，重试机制记录

### 3. 核心形象元素提取 (extractCoreElements)
- **调用参数**: 模型、故事信息、角色数量、段落数量
- **响应数据**: 状态码、使用量统计、格式验证结果、重试状态
- **特殊处理**: 格式验证失败时的重试日志

### 4. 插图提示词生成 (generateImagePrompt)
- **调用参数**: 模型、故事信息、核心元素长度
- **响应数据**: 状态码、使用量统计、解析统计、质量检查
- **特殊处理**: 多步骤调用的关联日志

### 5. 单页提示词生成 (generateSinglePagePrompt)
- **调用参数**: 模型、页面类型、内容长度、核心元素长度
- **响应数据**: 状态码、使用量统计、提示词长度
- **特殊处理**: 页面类型和索引的详细记录

### 6. 图片生成 (generateImage)
- **调用参数**: 模型、图片类型、提示词长度、图片尺寸
- **响应数据**: 状态码、使用量统计、图片数据长度、重试次数
- **特殊处理**: Base64图片数据简化，重试机制详细记录

## 日志输出示例

### 成功调用示例
```
🚀 [豆包API] 故事生成 - 开始调用
📋 [豆包API] 故事生成 - 调用参数: {
  "model": "doubao-seed-1-6-250615",
  "characters": [{"name": "小明", "age": "5", "gender": "male"}],
  "outline": "小明在公园里的冒险故事",
  "style": "冒险探索",
  "count": 5,
  "promptLength": 1250,
  "max_tokens": 2000,
  "temperature": 0.7
}
⏰ [豆包API] 故事生成 - 调用时间: 2025-07-29T06:43:23.098Z

✅ [豆包API] 故事生成 - 调用成功
📊 [豆包API] 故事生成 - 响应数据: {
  "status": 200,
  "usage": {"prompt_tokens": 156, "completion_tokens": 445, "total_tokens": 601},
  "contentLength": 892,
  "parsedTitle": "小明的公园冒险",
  "parsedParagraphsCount": 5,
  "expectedCount": 5
}
⏱️  [豆包API] 故事生成 - 耗时: 3240ms
🏁 [豆包API] 故事生成 - 完成时间: 2025-07-29T06:43:26.338Z
```

### 失败调用示例
```
🚀 [豆包API] 图片生成 - 开始调用
📋 [豆包API] 图片生成 - 调用参数: {
  "model": "doubao-seedream-3-0-t2i-250415",
  "type": "cover",
  "prompt": "一个温馨的儿童故事封面...[截断:总长度1680字符]...适合纸质出版",
  "imageSize": "1024x1448"
}
⏰ [豆包API] 图片生成 - 调用时间: 2025-07-29T06:43:30.123Z

🔄 [豆包API] 图片生成 - 重试 1/3
🔍 [豆包API] 图片生成 - 重试原因: 网络超时

❌ [豆包API] 图片生成 - 调用失败
💥 [豆包API] 图片生成 - 错误信息: {
  "message": "API请求失败",
  "status": 429,
  "data": {"error": {"message": "Rate limit exceeded", "type": "rate_limit_error"}},
  "code": "RATE_LIMIT"
}
⏱️  [豆包API] 图片生成 - 耗时: 8750ms
🏁 [豆包API] 图片生成 - 失败时间: 2025-07-29T06:43:38.873Z
```

## 使用效果

### 1. 调试效率提升
- **问题定位**: 快速定位API调用失败的具体原因
- **性能分析**: 详细的耗时统计帮助识别性能瓶颈
- **参数验证**: 清晰的参数日志帮助验证调用正确性

### 2. 监控能力增强
- **调用统计**: 实时监控API调用频率和成功率
- **错误追踪**: 详细的错误信息便于问题追踪
- **重试分析**: 重试机制的详细记录帮助优化策略

### 3. 开发体验改善
- **可读性强**: 结构化的日志输出易于阅读
- **信息完整**: 涵盖调用生命周期的所有关键信息
- **安全保护**: 自动隐藏敏感信息，保护API密钥

## 配置选项

### 环境变量控制
```bash
# 开发环境启用详细日志
NODE_ENV=development

# 生产环境可以通过环境变量控制日志级别
LOG_LEVEL=info
API_LOG_ENABLED=true
```

### 日志级别设置
- **DEBUG**: 显示所有日志信息
- **INFO**: 显示重要的调用信息
- **WARN**: 只显示警告和错误
- **ERROR**: 只显示错误信息

## 后续优化方向

### 1. 日志持久化
- 将日志写入文件系统
- 支持日志轮转和压缩
- 集成日志分析工具

### 2. 性能监控
- 添加性能指标统计
- 支持调用链追踪
- 集成APM监控系统

### 3. 告警机制
- 错误率阈值告警
- 响应时间异常告警
- API配额使用告警

### 4. 可视化界面
- 实时日志查看界面
- 调用统计图表
- 错误分析报告

## 总结

通过实现这套完整的豆包API接口调用日志系统，我们显著提升了系统的可观测性和可维护性。该系统不仅能够帮助开发者快速定位和解决问题，还为系统优化和性能调优提供了重要的数据支持。

### 核心价值
1. **提升调试效率**: 详细的日志信息大幅减少问题定位时间
2. **增强监控能力**: 全面的调用监控帮助及时发现异常
3. **保护敏感信息**: 智能的数据清理确保日志安全
4. **改善开发体验**: 结构化的日志输出提升开发效率

### 技术特色
1. **智能数据处理**: 自动识别和简化长内容及敏感信息
2. **全生命周期跟踪**: 覆盖API调用的所有关键节点
3. **可视化标识**: 丰富的图标和颜色提升日志可读性
4. **灵活配置**: 支持多种日志级别和输出格式

这套日志系统为绘本工坊的稳定运行和持续优化提供了强有力的技术保障。