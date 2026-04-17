import express from 'express'
import { randomUUID } from 'crypto'
import { prisma } from '../db.js'
import { config, getWebhookUrls } from '../config.js'
import { requireAuth } from '../middleware/auth.js'

export const workflowsRouter = express.Router()

workflowsRouter.use(requireAuth)

function normalizeStatus(result) {
  if (result.status === 'completed') return 'COMPLETED'
  if (result.status === 'failed') return 'FAILED'
  if (result.status === 'waiting_user_feedback') return 'WAITING_USER_FEEDBACK'
  if (result.stepName === 'xhs_image_review') return 'IMAGE_REVIEW'
  if (result.stepName === 'douyin_frame_review' || result.stepName === 'douyin_frame_generating') return 'FRAME_REVIEW'
  if (result.stepName === 'douyin_video_generating') return 'VIDEO_GENERATING'
  if (result.stepName === 'douyin_video_review') return 'VIDEO_REVIEW'
  return 'PROCESSING'
}

function isTerminal(status) {
  return status === 'COMPLETED' || status === 'FAILED'
}

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

async function postJson(url, body) {
  if (!url) throw new Error('对应的 n8n Webhook 尚未配置')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.n8nTimeoutMs)

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    if (!res.ok) {
      throw new Error(`n8n 请求失败：${res.status} ${res.statusText}`)
    }

    return parseResponse(res)
  } finally {
    clearTimeout(timer)
  }
}

async function getJson(url) {
  if (!url) throw new Error('对应的 n8n Webhook 尚未配置')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), config.n8nTimeoutMs)

  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      throw new Error(`n8n 查询失败：${res.status} ${res.statusText}`)
    }
    const data = await res.json()
    return Array.isArray(data) ? data[0] : data
  } finally {
    clearTimeout(timer)
  }
}

async function findOwnedTask(userId, taskId) {
  return prisma.workflowTask.findFirst({
    where: { userId, taskId },
  })
}

async function updateTaskFromResult(taskId, result) {
  const status = normalizeStatus(result)
  return prisma.workflowTask.update({
    where: { taskId },
    data: {
      status,
      resultPreview: result.preview || undefined,
      errorMessage: status === 'FAILED' ? (result.message || '工作流执行失败') : null,
      completedAt: isTerminal(status) ? new Date() : undefined,
    },
  })
}

async function recordEvent({ userId, taskId, action, status, metadata }) {
  await prisma.workflowEvent.create({
    data: {
      userId,
      taskId,
      action,
      status,
      metadata,
    },
  })
}

workflowsRouter.post('/start', async (req, res, next) => {
  const platform = req.body?.platform === 'douyin' ? 'douyin' : 'xiaohongshu'
  const sessionId = String(req.body?.sessionId || randomUUID())
  const params = req.body?.params || {}
  const urls = getWebhookUrls(platform)

  try {
    const existingTask = await prisma.workflowTask.findUnique({ where: { taskId: sessionId } })
    if (existingTask && existingTask.userId !== req.user.id) {
      return res.status(409).json({ success: false, message: '任务 ID 已存在' })
    }

    await prisma.workflowTask.upsert({
      where: { taskId: sessionId },
      create: {
        userId: req.user.id,
        platform,
        taskId: sessionId,
        status: 'PROCESSING',
        inputParams: params,
      },
      update: {
        status: 'PROCESSING',
        inputParams: params,
        errorMessage: null,
        completedAt: null,
      },
    })

    const result = await postJson(urls.START_WORKFLOW_URL, { platform, sessionId, params })
    await recordEvent({ userId: req.user.id, taskId: sessionId, action: 'start', status: 'success', metadata: result })

    res.json({ taskId: sessionId, ...result })
  } catch (err) {
    await prisma.workflowTask.update({
      where: { taskId: sessionId },
      data: { status: 'FAILED', errorMessage: err.message, completedAt: new Date() },
    }).catch(() => {})
    await recordEvent({ userId: req.user.id, taskId: sessionId, action: 'start', status: 'failed', metadata: { message: err.message } }).catch(() => {})
    next(err)
  }
})

workflowsRouter.get('/status', async (req, res, next) => {
  try {
    const taskId = String(req.query.taskId || '')
    const task = await findOwnedTask(req.user.id, taskId)
    if (!task) return res.status(404).json({ success: false, message: '任务不存在或无权访问' })

    const urls = getWebhookUrls(task.platform)
    const url = `${urls.STATUS_QUERY_URL}?taskId=${encodeURIComponent(taskId)}`
    const result = await getJson(url)
    await updateTaskFromResult(taskId, result)

    res.json(result)
  } catch (err) {
    next(err)
  }
})

workflowsRouter.post('/action', async (req, res, next) => {
  try {
    const taskId = String(req.body?.taskId || '')
    const task = await findOwnedTask(req.user.id, taskId)
    if (!task) return res.status(404).json({ success: false, message: '任务不存在或无权访问' })

    const urls = getWebhookUrls(task.platform)
    const body = {
      taskId,
      action: req.body?.action,
      feedback: req.body?.feedback || '',
      previousText: req.body?.previousText || '',
    }
    const result = await postJson(urls.USER_ACTION_URL, body)
    await recordEvent({ userId: req.user.id, taskId, action: body.action || 'user_action', status: 'success', metadata: result })

    res.json(result)
  } catch (err) {
    next(err)
  }
})

workflowsRouter.post('/regenerate-images', async (req, res, next) => {
  try {
    const taskId = String(req.body?.taskId || '')
    const task = await findOwnedTask(req.user.id, taskId)
    if (!task) return res.status(404).json({ success: false, message: '任务不存在或无权访问' })

    const urls = getWebhookUrls(task.platform)
    const result = await postJson(urls.REGENERATE_IMAGE_URL, {
      taskId,
      confirmedText: req.body?.confirmedText || '',
    })
    await recordEvent({ userId: req.user.id, taskId, action: 'regenerate_images', status: 'success', metadata: result })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

workflowsRouter.post('/frame-action', async (req, res, next) => {
  try {
    const taskId = String(req.body?.taskId || '')
    const task = await findOwnedTask(req.user.id, taskId)
    if (!task) return res.status(404).json({ success: false, message: '任务不存在或无权访问' })

    const urls = getWebhookUrls(task.platform)
    const result = await postJson(urls.FRAME_ACTION_URL, {
      taskId,
      frameIndex: req.body?.frameIndex,
      action: req.body?.action,
      feedback: req.body?.feedback || '',
    })
    await recordEvent({ userId: req.user.id, taskId, action: `frame_${req.body?.action || 'action'}`, status: 'success', metadata: result })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

workflowsRouter.post('/generate-video', async (req, res, next) => {
  try {
    const taskId = String(req.body?.taskId || '')
    const task = await findOwnedTask(req.user.id, taskId)
    if (!task) return res.status(404).json({ success: false, message: '任务不存在或无权访问' })

    const urls = getWebhookUrls(task.platform)
    const result = await postJson(urls.GENERATE_VIDEO_URL, {
      taskId,
      frames: req.body?.frames || [],
      confirmedText: req.body?.confirmedText || '',
    })
    await recordEvent({ userId: req.user.id, taskId, action: 'generate_video', status: 'success', metadata: result })
    res.json(result)
  } catch (err) {
    next(err)
  }
})

workflowsRouter.post('/regenerate-video', async (req, res, next) => {
  try {
    const taskId = String(req.body?.taskId || '')
    const task = await findOwnedTask(req.user.id, taskId)
    if (!task) return res.status(404).json({ success: false, message: '任务不存在或无权访问' })

    const urls = getWebhookUrls(task.platform)
    const result = await postJson(urls.REGENERATE_VIDEO_URL, { taskId })
    await recordEvent({ userId: req.user.id, taskId, action: 'regenerate_video', status: 'success', metadata: result })
    res.json(result)
  } catch (err) {
    next(err)
  }
})
