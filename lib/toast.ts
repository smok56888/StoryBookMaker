import { toast } from 'sonner'

// 成功提示
export function showSuccess(message: string) {
  toast.success(message)
}

// 错误提示
export function showError(message: string) {
  toast.error(message)
}

// 警告提示
export function showWarning(message: string) {
  toast.warning(message)
}

// 信息提示
export function showInfo(message: string) {
  toast.info(message)
}

// 处理API错误
export function handleApiError(error: any) {
  if (error.response?.data?.error) {
    showError(error.response.data.error)
  } else if (error.message) {
    showError(error.message)
  } else {
    showError('操作失败，请重试')
  }
}