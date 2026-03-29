/**
 * API 接口封装层
 * UI 层不直接调用 fetch，统一通过此模块与后端交互
 * 当 MOCK_ENABLED 时自动走 mock 逻辑
 */

import config from './config'
import { mockStartWorkflow, mockQueryStatus, mockUserAction } from './mock'

/**
 * 启动工作流
 * @param {string} platform - 'xiaohongshu' | 'douyin'
 * @param {string} sessionId - 前端生成的唯一会话 ID
 * @param {object} params - 表单参数
 * @returns {Promise<{success, taskId, status, message}>}
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

  return res.json()
}

/**
 * 查询任务状态
 * @param {string} taskId - 任务 ID
 * @returns {Promise<{success, taskId, status, stepName, message, preview, history, allowRevise, allowConfirm}>}
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

  return res.json()
}

/**
 * 用户操作回传
 * @param {string} taskId - 任务 ID
 * @param {'revise'|'confirm'} action - 用户操作类型
 * @param {string} feedback - 修改意见（confirm 时可为空）
 * @returns {Promise<{success, status, message}>}
 */
export async function submitUserAction(taskId, action, feedback = '') {
  if (config.MOCK_ENABLED) {
    return mockUserAction(taskId, action, feedback)
  }

  const res = await fetch(config.USER_ACTION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ taskId, action, feedback }),
  })

  if (!res.ok) {
    throw new Error(`提交操作失败: ${res.status} ${res.statusText}`)
  }

  return res.json()
}

/**
 * 轮询状态管理器
 * 创建一个可取消的轮询，定期查询任务状态
 */
export function createStatusPoller(taskId, onUpdate, onError) {
  let timer = null
  let startTime = Date.now()
  let stopped = false

  const poll = async () => {
    if (stopped) return

    try {
      // 超时检测
      if (Date.now() - startTime > config.POLL_TIMEOUT) {
        onError(new Error('轮询超时，请检查工作流状态或刷新页面重试'))
        return
      }

      const result = await queryStatus(taskId)
      if (stopped) return

      onUpdate(result)

      // 如果任务还在处理中，继续轮询
      if (result.status === 'processing' || result.status === 'waiting_user_feedback') {
        // waiting_user_feedback 时降低轮询频率
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

  // 启动轮询
  timer = setTimeout(poll, config.POLL_INTERVAL)

  // 返回停止函数
  return () => {
    stopped = true
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }
}
