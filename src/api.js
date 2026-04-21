import config from './config'
import {
  mockStartWorkflow,
  mockQueryStatus,
  mockUserAction,
  mockRegenerateImages,
  mockFrameAction,
  mockGenerateVideo,
  mockRegenerateVideo,
} from './mock'

const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

async function parseResponse(res) {
  const text = await res.text()
  if (!text || text.trim() === '') {
    return { success: true, status: 'processing', message: '操作已受理' }
  }
  try {
    const data = JSON.parse(text)
    return Array.isArray(data) ? data[0] : data
  } catch {
    return { success: true, status: 'processing', message: '操作已受理' }
  }
}

async function apiRequest(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const data = await parseResponse(res)
  if (!res.ok) {
    throw new Error(data.message || `请求失败：${res.status} ${res.statusText}`)
  }
  return data
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error(`读取文件失败：${file.name}`))
    reader.readAsDataURL(file)
  })
}

export async function uploadReferenceImages(files, platform = 'xiaohongshu') {
  const imageFiles = Array.isArray(files) ? files.filter(Boolean) : []
  if (imageFiles.length === 0) {
    return { success: true, files: [] }
  }

  if (config.MOCK_ENABLED) {
    return {
      success: true,
      files: imageFiles.map((file, index) => ({
        name: file.name,
        type: file.type,
        size: file.size,
        url: `https://placehold.co/1024x1024/png?text=${encodeURIComponent(`reference-${index + 1}`)}`,
      })),
    }
  }

  const payloadFiles = await Promise.all(imageFiles.map(async (file) => ({
    name: file.name,
    type: file.type,
    dataUrl: await readFileAsDataUrl(file),
  })))

  return apiRequest('/api/uploads/reference-images', {
    method: 'POST',
    body: JSON.stringify({ platform, files: payloadFiles }),
  })
}

export async function deleteReferenceImages(storageKeys = []) {
  const keys = Array.isArray(storageKeys) ? storageKeys.filter(Boolean) : []
  if (keys.length === 0) {
    return { success: true, deletedCount: 0 }
  }

  if (config.MOCK_ENABLED) {
    return { success: true, deletedCount: keys.length }
  }

  return apiRequest('/api/uploads/reference-images', {
    method: 'DELETE',
    body: JSON.stringify({ storageKeys: keys }),
  })
}

export async function startWorkflow(platform, sessionId, params) {
  if (config.MOCK_ENABLED) {
    return mockStartWorkflow(platform, sessionId, params)
  }

  return apiRequest('/api/workflows/start', {
    method: 'POST',
    body: JSON.stringify({ platform, sessionId, params }),
  })
}

export async function queryStatus(taskId, platform) {
  if (config.MOCK_ENABLED) {
    return mockQueryStatus(taskId)
  }

  return apiRequest(`/api/workflows/status?taskId=${encodeURIComponent(taskId)}&platform=${encodeURIComponent(platform || '')}`)
}

export async function cancelWorkflow(taskId) {
  if (config.MOCK_ENABLED) {
    return { success: true, status: 'failed', message: '任务已由用户停止', taskId }
  }

  return apiRequest('/api/workflows/cancel', {
    method: 'POST',
    body: JSON.stringify({ taskId }),
  })
}

export async function submitUserAction(taskId, action, feedback = '', previousText = '', platform = 'xiaohongshu') {
  if (config.MOCK_ENABLED) {
    return mockUserAction(taskId, action, feedback)
  }

  return apiRequest('/api/workflows/action', {
    method: 'POST',
    body: JSON.stringify({ taskId, action, feedback, previousText, platform }),
  })
}

export async function regenerateImages(taskId, confirmedText, platform = 'xiaohongshu') {
  if (config.MOCK_ENABLED) {
    return mockRegenerateImages(taskId, confirmedText)
  }

  return apiRequest('/api/workflows/regenerate-images', {
    method: 'POST',
    body: JSON.stringify({ taskId, confirmedText, platform }),
  })
}

export async function submitFrameAction(taskId, frameIndex, action, feedback = '', platform = 'douyin') {
  if (config.MOCK_ENABLED) {
    return mockFrameAction(taskId, frameIndex, action, feedback)
  }

  return apiRequest('/api/workflows/frame-action', {
    method: 'POST',
    body: JSON.stringify({ taskId, frameIndex, action, feedback, platform }),
  })
}

export async function generateVideo(taskId, frames, confirmedText, platform = 'douyin') {
  if (config.MOCK_ENABLED) {
    return mockGenerateVideo(taskId, frames, confirmedText)
  }

  return apiRequest('/api/workflows/generate-video', {
    method: 'POST',
    body: JSON.stringify({ taskId, frames, confirmedText, platform }),
  })
}

export async function regenerateVideo(taskId, platform = 'douyin') {
  if (config.MOCK_ENABLED) {
    return mockRegenerateVideo(taskId)
  }

  return apiRequest('/api/workflows/regenerate-video', {
    method: 'POST',
    body: JSON.stringify({ taskId, platform }),
  })
}

export function createStatusPoller(taskId, onUpdate, onError, platform = 'xiaohongshu') {
  let timer = null
  let startTime = Date.now()
  let stopped = false

  const poll = async () => {
    if (stopped) return

    try {
      if (Date.now() - startTime > config.POLL_TIMEOUT) {
        onError(new Error('轮询超时，请检查工作流状态或刷新页面重试'))
        return
      }

      const result = await queryStatus(taskId, platform)
      if (stopped) return

      onUpdate(result)

      if (result.status === 'completed' || result.status === 'failed') return

      timer = setTimeout(poll, config.POLL_INTERVAL)
    } catch (err) {
      if (!stopped) {
        onError(err)
      }
    }
  }

  timer = setTimeout(poll, config.POLL_INTERVAL)

  return () => {
    stopped = true
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
}
