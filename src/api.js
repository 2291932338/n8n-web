/**
 * API 接口封装层
 * 同步模式：前端等待 n8n 返回完整结果，不再轮询
 */

import config from './config'
import { mockStartWorkflow, mockQueryStatus, mockUserAction } from './mock'

/**
 * 启动工作流（同步等待 AI 生成完成）
 * n8n 需要在 AI 生成完毕后再 Respond to Webhook
 * @returns {Promise<{success, taskId, status, preview, history, allowRevise, allowConfirm, message}>}
 */
export async function startWorkflow(platform, sessionId, params) {
  if (config.MOCK_ENABLED) {
    return mockStartWorkflow(platform, sessionId, params)
  }

  const res = await fetch(config.START_WORKFLOW_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, sessionId, params }),
  })

  if (!res.ok) {
    throw new Error(`启动工作流失败: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  // n8n 可能返回数组，取第一个元素
  return Array.isArray(data) ? data[0] : data
}

/**
 * 查询任务状态（保留用于 Mock 模式）
 */
export async function queryStatus(taskId) {
  if (config.MOCK_ENABLED) {
    return mockQueryStatus(taskId)
  }

  const url = `${config.STATUS_QUERY_URL}?taskId=${encodeURIComponent(taskId)}`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`查询状态失败: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data[0] : data
}

/**
 * 用户操作回传（同步等待 n8n 返回修改后的结果）
 * @returns {Promise<{success, status, message, preview?, history?}>}
 */
export async function submitUserAction(taskId, action, feedback = '', previousText = '') {
  if (config.MOCK_ENABLED) {
    return mockUserAction(taskId, action, feedback)
  }

  const res = await fetch(config.USER_ACTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, action, feedback, previousText }),
  })

  if (!res.ok) {
    throw new Error(`提交操作失败: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data[0] : data
}

/**
 * 轮询状态管理器（仅 Mock 模式使用）
 */
export function createStatusPoller(taskId, onUpdate, onError) {
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

      const result = await queryStatus(taskId)
      if (stopped) return

      onUpdate(result)

      if (result.status === 'processing' || result.status === 'waiting_user_feedback') {
        const interval = result.status === 'waiting_user_feedback'
          ? config.POLL_INTERVAL * 3
          : config.POLL_INTERVAL
        timer = setTimeout(poll, interval)
      }
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
