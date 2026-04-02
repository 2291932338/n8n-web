/**
 * useTask hook
 * 封装单任务的完整状态机，支持小红书和抖音两种流程
 *
 * 小红书流程：submitting → processing → waiting_user_feedback → (revising →) completed
 *   额外：completed 后可 regenerate_images → processing → completed
 *
 * 抖音流程：submitting → processing → waiting_user_feedback (稿件) →
 *   frame_review → video_generating → video_review → completed
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  startWorkflow,
  submitUserAction,
  regenerateImages,
  submitFrameAction,
  generateVideo,
  regenerateVideo,
} from '../api'
import { usePoller } from './usePoller'
import { saveTask } from '../taskStore'

const INITIAL_STATE = {
  taskId: null,
  platform: 'xiaohongshu',
  formParams: null,
  taskStatus: 'idle',      // idle|submitting|processing|waiting_user_feedback|revising|frame_review|video_generating|video_review|completed|failed
  stepName: '',
  statusMessage: '',
  preview: null,           // { text, images, videos }
  history: [],
  previewHistory: [],
  allowRevise: false,
  allowConfirm: false,
  errorMessage: '',
  isActionSubmitting: false,
  createdAt: null,
  // 抖音专用
  frames: [],              // [{ index, imageUrl, storyboardText, status }]
  currentFrameIndex: 0,
  confirmedText: '',       // 抖音已确认的分镜稿件
  videoUrl: null,
}

const TERMINAL_STATUSES = new Set(['completed', 'failed'])

/**
 * 从持久化的任务记录恢复初始状态
 * taskStore 中保存的 status 字段对应 taskStatus
 */
function hydrateFromRecord(record) {
  if (!record) return INITIAL_STATE
  return {
    ...INITIAL_STATE,
    taskId: record.taskId,
    platform: record.platform || 'xiaohongshu',
    formParams: record.formParams || null,
    taskStatus: record.status || 'idle',
    stepName: record.stepName || '',
    statusMessage: record.statusMessage || '',
    preview: record.preview || null,
    previewHistory: record.previewHistory || [],
    errorMessage: record.errorMessage || '',
    createdAt: record.createdAt || null,
    frames: record.frames || [],
    videoUrl: record.videoUrl || null,
  }
}

export function useTask(onTaskSaved, initialTaskRecord = null) {
  const [state, setState] = useState(() => hydrateFromRecord(initialTaskRecord))

  // 用 ref 追踪最新 state，供闭包内异步回调使用
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // 首次修改标记
  const isFirstReviseRef = useRef(true)

  // 将 state 补丁合并并持久化
  const patch = useCallback((updates, persist = true) => {
    setState(prev => {
      const next = { ...prev, ...updates }
      stateRef.current = next
      if (persist && next.taskId) {
        saveTask({
          taskId: next.taskId,
          platform: next.platform,
          formParams: next.formParams,
          status: next.taskStatus,
          stepName: next.stepName,
          statusMessage: next.statusMessage,
          preview: next.preview,
          previewHistory: next.previewHistory,
          errorMessage: next.errorMessage || null,
          createdAt: next.createdAt,
          // 抖音专用字段
          frames: next.frames,
          videoUrl: next.videoUrl,
        })
        if (onTaskSaved) onTaskSaved()
      }
      return next
    })
  }, [onTaskSaved])

  // ── 轮询回调 ───────────────────────────────────────────────
  const handleStatusUpdate = useCallback((result) => {
    if (!result.success) {
      patch({ taskStatus: 'failed', errorMessage: result.message || '获取状态失败' })
      return
    }

    const cur = stateRef.current
    const isDouyin = cur.platform === 'douyin'

    // 公共字段
    const common = {
      stepName: result.stepName || '',
      statusMessage: result.message || '',
      history: result.history || cur.history,
      allowRevise: result.allowRevise || false,
      allowConfirm: result.allowConfirm || false,
    }

    if (result.status === 'failed') {
      patch({ ...common, taskStatus: 'failed', errorMessage: result.message || '工作流执行失败' })
      return
    }

    // 抖音特殊 stepName 处理
    if (isDouyin) {
      if (result.stepName === 'douyin_frame_review' || result.stepName === 'douyin_frame_generating') {
        const frames = result.frames || cur.frames
        patch({
          ...common,
          taskStatus: 'frame_review',
          frames,
          currentFrameIndex: result.currentFrameIndex ?? cur.currentFrameIndex,
          preview: result.preview || cur.preview,
        })
        return
      }
      if (result.stepName === 'douyin_video_generating') {
        patch({ ...common, taskStatus: 'video_generating' })
        return
      }
      if (result.stepName === 'douyin_video_review') {
        patch({
          ...common,
          taskStatus: 'video_review',
          videoUrl: result.videoUrl || cur.videoUrl,
          preview: result.preview || cur.preview,
        })
        return
      }
    }

    if (result.status === 'completed') {
      const updates = { ...common, taskStatus: 'completed', preview: result.preview || cur.preview }
      if (isDouyin && result.videoUrl) updates.videoUrl = result.videoUrl
      patch(updates)
      return
    }

    if (result.status === 'waiting_user_feedback') {
      const newPreview = result.preview || cur.preview
      const updates = {
        ...common,
        taskStatus: 'waiting_user_feedback',
        preview: newPreview,
      }
      // 如果是初稿（previewHistory 为空），自动记录
      if (newPreview?.text && cur.previewHistory.length === 0) {
        updates.previewHistory = [{ version: 1, label: '初稿', text: newPreview.text, timestamp: Date.now() }]
      }
      patch(updates)
      return
    }

    // 仍在 processing
    patch({ ...common, taskStatus: 'processing', preview: result.preview || cur.preview })
  }, [patch])

  const handlePollError = useCallback((err) => {
    patch({ taskStatus: 'failed', errorMessage: err.message || '轮询出错' })
  }, [patch])

  const { start: startPolling, stop: stopPolling } = usePoller(handleStatusUpdate, handlePollError)

  // 组件卸载时停止轮询
  useEffect(() => () => stopPolling(), [stopPolling])

  // 恢复已有任务：若从 initialTaskRecord 恢复且任务未终止，自动重启轮询
  useEffect(() => {
    if (!initialTaskRecord) return
    const { taskId, platform, status } = initialTaskRecord
    if (!taskId || TERMINAL_STATUSES.has(status)) return
    startPolling(taskId, platform || 'xiaohongshu')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // 仅 mount 时执行一次

  // ── 提交表单 ───────────────────────────────────────────────
  const submit = useCallback(async (platform, formData) => {
    const createdAt = Date.now()
    isFirstReviseRef.current = true

    setState({
      ...INITIAL_STATE,
      platform,
      formParams: formData,
      taskStatus: 'submitting',
      statusMessage: '正在提交任务...',
      createdAt,
    })

    try {
      const sessionId = uuidv4()
      const result = await startWorkflow(platform, sessionId, formData)

      if (!result.success) {
        const failId = result.taskId || sessionId
        patch({
          taskId: failId,
          taskStatus: 'failed',
          errorMessage: result.message || '启动工作流失败',
          createdAt,
        })
        return
      }

      const newTaskId = result.taskId
      patch({
        taskId: newTaskId,
        taskStatus: 'processing',
        statusMessage: result.message || '工作流已启动，正在处理...',
        createdAt,
      })
      // 无论 n8n 是否立即返回内容，都启动轮询
      startPolling(newTaskId, platform)

    } catch (err) {
      patch({
        taskStatus: 'failed',
        errorMessage: err.message || '提交失败，请检查网络连接',
        createdAt,
      })
    }
  }, [patch, startPolling])

  // ── 提交修改意见 ───────────────────────────────────────────
  const revise = useCallback(async (feedback) => {
    const { taskId, preview, platform } = stateRef.current
    if (!taskId) return
    try {
      patch({ isActionSubmitting: true, taskStatus: 'revising', statusMessage: '正在提交修改意见...' })
      const sendPreviousText = isFirstReviseRef.current ? (preview?.text || '') : ''
      const result = await submitUserAction(taskId, 'revise', feedback, sendPreviousText, platform)
      isFirstReviseRef.current = false

      if (!result.success) {
        patch({ taskStatus: 'failed', errorMessage: result.message || '提交修改失败', isActionSubmitting: false })
        return
      }
      // 操作成功后重新轮询
      patch({ taskStatus: 'processing', statusMessage: result.message || '修改意见已接收，重新生成中...', isActionSubmitting: false })
      startPolling(taskId, platform)
    } catch (err) {
      patch({ taskStatus: 'failed', errorMessage: err.message || '提交修改失败', isActionSubmitting: false })
    }
  }, [patch, startPolling])

  // ── 确认稿件 ───────────────────────────────────────────────
  const confirm = useCallback(async () => {
    const { taskId, preview, platform, previewHistory } = stateRef.current
    if (!taskId) return
    try {
      patch({ isActionSubmitting: true, taskStatus: 'processing', statusMessage: '确认成功，等待生成...' })

      // 保存确认时的版本到历史
      if (preview?.text) {
        const updated = [
          ...previewHistory,
          { version: previewHistory.length + 1, label: '确认版本', text: preview.text, timestamp: Date.now() }
        ]
        patch({ previewHistory: updated, confirmedText: preview.text })
      }

      const result = await submitUserAction(taskId, 'confirm', '', preview?.text || '', platform)
      if (!result.success) {
        patch({ taskStatus: 'failed', errorMessage: result.message || '确认失败', isActionSubmitting: false })
        return
      }
      patch({ taskStatus: 'processing', statusMessage: result.message || '确认成功，正在生成...', isActionSubmitting: false })
      startPolling(taskId, platform)
    } catch (err) {
      patch({ taskStatus: 'failed', errorMessage: err.message || '确认失败', isActionSubmitting: false })
    }
  }, [patch, startPolling])

  // ── 小红书：重新生成图片 ───────────────────────────────────
  const regenImages = useCallback(async () => {
    const { taskId, preview, confirmedText, platform } = stateRef.current
    if (!taskId) return
    const text = confirmedText || preview?.text || ''
    try {
      patch({ isActionSubmitting: true, taskStatus: 'processing', statusMessage: '正在重新生成图片...' })
      const result = await regenerateImages(taskId, text, platform)
      if (!result.success) {
        patch({ taskStatus: 'completed', errorMessage: result.message || '重新生成图片失败', isActionSubmitting: false })
        return
      }
      patch({ taskStatus: 'processing', statusMessage: result.message || '正在重新生成图片...', isActionSubmitting: false })
      startPolling(taskId, platform)
    } catch (err) {
      patch({ taskStatus: 'completed', errorMessage: err.message || '重新生成图片失败', isActionSubmitting: false })
    }
  }, [patch, startPolling])

  // ── 抖音：审核单帧 ─────────────────────────────────────────
  const approveFrame = useCallback(async (frameIndex) => {
    const { taskId, platform, frames } = stateRef.current
    if (!taskId) return
    try {
      patch({ isActionSubmitting: true, statusMessage: `第${frameIndex + 1}帧审核通过，等待下一帧...` })
      // 更新本地帧状态
      const updatedFrames = frames.map(f => f.index === frameIndex ? { ...f, status: 'approved' } : f)
      patch({ frames: updatedFrames })

      const result = await submitFrameAction(taskId, frameIndex, 'approve', '', platform)
      if (!result.success) {
        patch({ isActionSubmitting: false, statusMessage: result.message || '审核提交失败' })
        return
      }
      patch({ isActionSubmitting: false, taskStatus: 'processing', statusMessage: result.message || '正在生成下一帧...' })
      startPolling(taskId, platform)
    } catch (err) {
      patch({ isActionSubmitting: false, statusMessage: err.message || '审核提交失败' })
    }
  }, [patch, startPolling])

  const rejectFrame = useCallback(async (frameIndex, feedback) => {
    const { taskId, platform, frames } = stateRef.current
    if (!taskId) return
    try {
      patch({ isActionSubmitting: true, statusMessage: `正在重新生成第${frameIndex + 1}帧...` })
      const updatedFrames = frames.map(f => f.index === frameIndex ? { ...f, status: 'rejected' } : f)
      patch({ frames: updatedFrames })

      const result = await submitFrameAction(taskId, frameIndex, 'reject', feedback, platform)
      if (!result.success) {
        patch({ isActionSubmitting: false, statusMessage: result.message || '审核提交失败' })
        return
      }
      patch({ isActionSubmitting: false, taskStatus: 'processing', statusMessage: result.message || '正在重新生成该帧...' })
      startPolling(taskId, platform)
    } catch (err) {
      patch({ isActionSubmitting: false, statusMessage: err.message || '审核提交失败' })
    }
  }, [patch, startPolling])

  // ── 抖音：触发视频生成 ─────────────────────────────────────
  const triggerGenerateVideo = useCallback(async () => {
    const { taskId, frames, confirmedText, preview, platform } = stateRef.current
    if (!taskId) return
    const text = confirmedText || preview?.text || ''
    try {
      patch({ isActionSubmitting: true, taskStatus: 'video_generating', statusMessage: '正在生成视频...' })
      const result = await generateVideo(taskId, frames, text, platform)
      if (!result.success) {
        patch({ taskStatus: 'frame_review', isActionSubmitting: false, statusMessage: result.message || '触发视频生成失败' })
        return
      }
      patch({ isActionSubmitting: false, statusMessage: result.message || '视频生成中，请稍候...' })
      startPolling(taskId, platform)
    } catch (err) {
      patch({ taskStatus: 'frame_review', isActionSubmitting: false, statusMessage: err.message || '触发视频生成失败' })
    }
  }, [patch, startPolling])

  // ── 抖音：重新生成视频 ─────────────────────────────────────
  const regenVideo = useCallback(async () => {
    const { taskId, platform } = stateRef.current
    if (!taskId) return
    try {
      patch({ isActionSubmitting: true, taskStatus: 'video_generating', statusMessage: '正在重新生成视频...' })
      const result = await regenerateVideo(taskId, platform)
      if (!result.success) {
        patch({ taskStatus: 'video_review', isActionSubmitting: false, statusMessage: result.message || '重新生成视频失败' })
        return
      }
      patch({ isActionSubmitting: false, statusMessage: result.message || '正在重新生成视频...' })
      startPolling(taskId, platform)
    } catch (err) {
      patch({ taskStatus: 'video_review', isActionSubmitting: false, statusMessage: err.message || '重新生成视频失败' })
    }
  }, [patch, startPolling])

  // ── 抖音：确认视频，任务完成 ───────────────────────────────
  const confirmVideo = useCallback(async () => {
    const { taskId, platform } = stateRef.current
    if (!taskId) return
    try {
      patch({ isActionSubmitting: true, statusMessage: '正在确认完成...' })
      const result = await submitUserAction(taskId, 'confirm_video', '', '', platform)
      if (!result.success) {
        patch({ isActionSubmitting: false, statusMessage: result.message || '确认失败' })
        return
      }
      patch({ taskStatus: 'completed', isActionSubmitting: false, statusMessage: result.message || '任务已完成！' })
    } catch (err) {
      patch({ isActionSubmitting: false, statusMessage: err.message || '确认失败' })
    }
  }, [patch])

  // ── 重置（重试）───────────────────────────────────────────
  const reset = useCallback(() => {
    stopPolling()
    setState(INITIAL_STATE)
  }, [stopPolling])

  return {
    ...state,
    submit,
    revise,
    confirm,
    regenImages,
    approveFrame,
    rejectFrame,
    triggerGenerateVideo,
    regenVideo,
    confirmVideo,
    reset,
  }
}
