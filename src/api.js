/**
 * API 接口封装层
 * 异步模式：startWorkflow 立即返回 taskId，前端轮询 STATUS_QUERY_URL 获取结果
 * submitUserAction 同样立即返回，结果通过轮询获取
 */

import config, { getUrlsForPlatform } from './config'
import {
  mockStartWorkflow,
  mockQueryStatus,
  mockUserAction,
  mockRegenerateImages,
  mockFrameAction,
  mockGenerateVideo,
  mockRegenerateVideo,
} from './mock'

/**
 * 安全解析响应 JSON
 * n8n Respond 节点配置为 No Data 时返回空 body，直接 res.json() 会 throw。
 * 空响应视为操作已受理（success:true），前端靠轮询获取后续状态。
 */
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

/**
 * 启动工作流（异步：n8n 立即返回 taskId，后台处理）
 * @returns {Promise<{success, taskId, status, message}>}
 */
export async function startWorkflow(platform, sessionId, params) {
  if (config.MOCK_ENABLED) {
    return mockStartWorkflow(platform, sessionId, params)
  }

  const urls = getUrlsForPlatform(platform)
  const res = await fetch(urls.START_WORKFLOW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, sessionId, params }),
  })

  if (!res.ok) {
    throw new Error(`启动工作流失败: ${res.status} ${res.statusText}`)
  }

  return parseResponse(res)
}

/**
 * 查询任务状态（轮询使用）
 * @param {string} taskId
 * @param {'xiaohongshu' | 'douyin'} platform
 */
export async function queryStatus(taskId, platform) {
  if (config.MOCK_ENABLED) {
    return mockQueryStatus(taskId)
  }

  const urls = getUrlsForPlatform(platform)
  const url = `${urls.STATUS_QUERY_URL}?taskId=${encodeURIComponent(taskId)}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`查询状态失败: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data[0] : data
}

/**
 * 用户操作回传（异步：n8n 立即返回，结果通过轮询获取）
 * @param {string} taskId
 * @param {'revise' | 'confirm' | 'confirm_video'} action
 * @param {string} feedback
 * @param {string} previousText
 * @param {'xiaohongshu' | 'douyin'} platform
 * @returns {Promise<{success, status, message}>}
 */
export async function submitUserAction(taskId, action, feedback = '', previousText = '', platform = 'xiaohongshu') {
  if (config.MOCK_ENABLED) {
    return mockUserAction(taskId, action, feedback)
  }

  const urls = getUrlsForPlatform(platform)
  const res = await fetch(urls.USER_ACTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, action, feedback, previousText }),
  })

  if (!res.ok) {
    throw new Error(`提交操作失败: ${res.status} ${res.statusText}`)
  }

  return parseResponse(res)
}

/**
 * 小红书：重新生成图片（文案已确认，只重新生成配图）
 * @param {string} taskId
 * @param {string} confirmedText  已确认的文案
 * @param {'xiaohongshu'} platform
 * @returns {Promise<{success, status, message}>}
 */
export async function regenerateImages(taskId, confirmedText, platform = 'xiaohongshu') {
  if (config.MOCK_ENABLED) {
    return mockRegenerateImages(taskId, confirmedText)
  }

  const urls = getUrlsForPlatform(platform)
  const res = await fetch(urls.REGENERATE_IMAGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, confirmedText }),
  })

  if (!res.ok) {
    throw new Error(`重新生成图片失败: ${res.status} ${res.statusText}`)
  }

  return parseResponse(res)
}

/**
 * 抖音：单帧审核（通过/拒绝）
 * @param {string} taskId
 * @param {number} frameIndex   当前审核的帧索引（0-based）
 * @param {'approve' | 'reject'} action
 * @param {string} feedback     拒绝时填写的修改意见
 * @param {'douyin'} platform
 * @returns {Promise<{success, status, message}>}
 */
export async function submitFrameAction(taskId, frameIndex, action, feedback = '', platform = 'douyin') {
  if (config.MOCK_ENABLED) {
    return mockFrameAction(taskId, frameIndex, action, feedback)
  }

  const urls = getUrlsForPlatform(platform)
  const res = await fetch(urls.FRAME_ACTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, frameIndex, action, feedback }),
  })

  if (!res.ok) {
    throw new Error(`帧审核提交失败: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data[0] : data
}

/**
 * 抖音：触发视频生成（所有帧审核通过后调用）
 * @param {string} taskId
 * @param {Array<{index, imageUrl, storyboardText}>} frames  所有已通过的帧
 * @param {string} confirmedText  已确认的分镜稿件文本
 * @param {'douyin'} platform
 * @returns {Promise<{success, status, message}>}
 */
export async function generateVideo(taskId, frames, confirmedText, platform = 'douyin') {
  if (config.MOCK_ENABLED) {
    return mockGenerateVideo(taskId, frames, confirmedText)
  }

  const urls = getUrlsForPlatform(platform)
  const res = await fetch(urls.GENERATE_VIDEO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, frames, confirmedText }),
  })

  if (!res.ok) {
    throw new Error(`触发视频生成失败: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data[0] : data
}

/**
 * 抖音：重新生成视频（不重走图片流程）
 * @param {string} taskId
 * @param {'douyin'} platform
 * @returns {Promise<{success, status, message}>}
 */
export async function regenerateVideo(taskId, platform = 'douyin') {
  if (config.MOCK_ENABLED) {
    return mockRegenerateVideo(taskId)
  }

  const urls = getUrlsForPlatform(platform)
  const res = await fetch(urls.REGENERATE_VIDEO_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId }),
  })

  if (!res.ok) {
    throw new Error(`重新生成视频失败: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data[0] : data
}

/**
 * 轮询状态管理器
 * 持续轮询直到任务进入终态（completed/failed）或达到超时
 * @param {string} taskId
 * @param {Function} onUpdate  每次轮询回调
 * @param {Function} onError   错误/超时回调
 * @param {'xiaohongshu' | 'douyin'} platform
 * @returns {Function}  stop 函数，调用后停止轮询
 */
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

      // 终态不再继续轮询
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


