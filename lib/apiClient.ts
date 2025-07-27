import axios from 'axios'

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 180000 // 增加到180秒超时
})

// 错误处理
apiClient.interceptors.response.use(
  response => response,
  error => {
    console.error('API请求错误:', error.response?.data?.error || error.message)
    return Promise.reject(error)
  }
)

// 故事生成
export async function generateStory(data: {
  characters: Array<{ name: string; age: string; gender: string; image?: string }>
  outline: string
  style: string
  count: number
}) {
  try {
    console.log('调用故事生成API:', JSON.stringify(data, null, 2));
    
    // 添加重试机制
    let response;
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        if (typeof window !== 'undefined') {
          const { toast } = require('sonner');
          if (retries > 0) {
            toast.info(`正在重试生成故事 (${retries}/${maxRetries})...`);
          }
        }
        
        response = await apiClient.post('/story/generate', data);
        break; // 成功则跳出循环
      } catch (error: any) {
        retries++;
        console.error(`故事生成尝试 ${retries}/${maxRetries} 失败:`, error.message);
        
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
    
    console.log('故事生成API响应:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error: any) {
    console.error('故事生成API错误:', error);
    // 显示友好的错误提示
    const errorMessage = error.response?.data?.error || '故事生成失败，请重试';
    // 使用toast显示错误
    if (typeof window !== 'undefined') {
      const { toast } = require('sonner');
      toast.error(errorMessage);
    }
    throw error;
  }
}

// 提示词生成
export async function generatePrompts(storyId: string) {
  const response = await apiClient.post('/story/prompts', { storyId })
  return response.data
}

// 图片生成
export async function generateImage(data: {
  storyId: string
  type: 'cover' | 'content' | 'ending'
  index?: number
  prompt: string
  title?: string
}) {
  try {
    console.log('调用图片生成API:', JSON.stringify({
      storyId: data.storyId,
      type: data.type,
      index: data.index,
      promptLength: data.prompt.length,
      title: data.title
    }, null, 2));
    
    const response = await apiClient.post('/story/image', data)
    console.log('图片生成API响应成功');
    return response.data;
  } catch (error: any) {
    console.error('图片生成API错误:', error);
    // 显示友好的错误提示
    const errorMessage = error.response?.data?.error || '图片生成失败，请重试';
    // 使用toast显示错误
    if (typeof window !== 'undefined') {
      const { toast } = require('sonner');
      toast.error(errorMessage);
    }
    throw error;
  }
}

// 完成创作
export async function completeStory(storyId: string) {
  const response = await apiClient.post('/story/complete', { storyId })
  return response.data
}

// 下载PDF - 每次都重新生成
export function getPdfUrl(storyId: string) {
  return `/api/story/pdf?storyId=${storyId}`
}

// 下载PDF文件（带状态提示）
export async function downloadPdf(storyId: string, storyTitle?: string) {
  try {
    if (typeof window !== 'undefined') {
      const { toast } = require('sonner');
      toast.info('正在生成PDF，请稍候...');
    }
    
    const response = await fetch(`/api/story/pdf?storyId=${storyId}`, {
      method: 'GET',
    });
    
    if (!response.ok) {
      throw new Error('PDF生成失败');
    }
    
    // 获取文件名
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = 'story.pdf';
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
      if (filenameMatch) {
        filename = decodeURIComponent(filenameMatch[1].replace(/['"]/g, ''));
      }
    }
    
    // 下载文件
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    if (typeof window !== 'undefined') {
      const { toast } = require('sonner');
      toast.success('PDF下载成功！');
    }
    
    return true;
  } catch (error: any) {
    console.error('PDF下载失败:', error);
    if (typeof window !== 'undefined') {
      const { toast } = require('sonner');
      toast.error('PDF下载失败，请重试');
    }
    throw error;
  }
}

// 获取历史绘本列表
export async function getStoryHistory(page = 1) {
  try {
    const response = await apiClient.get('/story/history', { params: { page } })
    return response.data
  } catch (error) {
    console.error('获取历史绘本列表失败:', error)
    // 显示友好的错误提示
    const errorMessage = error.response?.data?.error || '获取历史绘本列表失败，请重试'
    // 使用toast显示错误
    if (typeof window !== 'undefined') {
      const { toast } = require('sonner')
      toast.error(errorMessage)
    }
    throw error
  }
}

// 删除绘本
export async function deleteStory(storyId: string) {
  try {
    const response = await apiClient.delete('/story/delete', { data: { storyId } })
    return response.data
  } catch (error) {
    console.error('删除绘本失败:', error)
    // 显示友好的错误提示
    const errorMessage = error.response?.data?.error || '删除绘本失败，请重试'
    // 使用toast显示错误
    if (typeof window !== 'undefined') {
      const { toast } = require('sonner')
      toast.error(errorMessage)
    }
    throw error
  }
}

// 获取故事详情
export async function getStoryDetails(storyId: string) {
  try {
    const response = await apiClient.get(`/story/details`, { params: { storyId } })
    return response.data
  } catch (error) {
    console.error('获取故事详情失败:', error)
    // 显示友好的错误提示
    const errorMessage = error.response?.data?.error || '获取故事详情失败，请重试'
    // 使用toast显示错误
    if (typeof window !== 'undefined') {
      const { toast } = require('sonner')
      toast.error(errorMessage)
    }
    throw error
  }
}