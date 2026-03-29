/**
 * App 主组件
 * 整合左右面板、状态管理、API 调用
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import config from './config'
import { startWorkflow, submitUserAction, createStatusPoller } from './api'
import Header from './components/Header'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'

export default function App() {
  // ========== 暗色模式 ==========
  const [isDark, setIsDark] = useState(() => {
    try {
      const saved = localStorage.getItem(`${config.STORAGE_PREFIX}dark`)
      if (saved !== null) return saved === 'true'
    } catch {}
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    try {
      localStorage.setItem(`${config.STORAGE_PREFIX}dark`, String(isDark))
    } catch {}
  }, [isDark])

  // ========== 平台选择 ==========
  const [platform, setPlatform] = useState('xiaohongshu')

  // ========== 任务状态 ==========
  const [taskStatus, setTaskStatus] = useState('idle') // idle | submitting | processing | waiting_user_feedback | revising | completed | failed
  const [taskId, setTaskId] = useState(null)
  const [stepName, setStepName] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [preview, setPreview] = useState(null)
  const [history, setHistory] = useState([])
  const [allowRevise, setAllowRevise] = useState(false)
  const [allowConfirm, setAllowConfirm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isActionSubmitting, setIsActionSubmitting] = useState(false)

  // 轮询停止函数 ref
  const stopPollerRef = useRef(null)

  // 清理轮询
  const cleanupPoller = useCallback(() => {
    if (stopPollerRef.current) {
      stopPollerRef.current()
      stopPollerRef.current = null
    }
  }, [])

  // 状态更新处理器
  const handleStatusUpdate = useCallback((result) => {
    if (!result.success) {
      setTaskStatus('failed')
      setErrorMessage(result.message || '获取状态失败')
      cleanupPoller()
      return
    }

    setStepName(result.stepName || '')
    setStatusMessage(result.message || '')
    setPreview(result.preview || null)
    setHistory(result.history || [])
    setAllowRevise(result.allowRevise || false)
    setAllowConfirm(result.allowConfirm || false)

    if (result.status === 'completed') {
      setTaskStatus('completed')
      cleanupPoller()
    } else if (result.status === 'failed') {
      setTaskStatus('failed')
      setErrorMessage(result.message || '工作流执行失败')
      cleanupPoller()
    } else if (result.status === 'waiting_user_feedback') {
      setTaskStatus('waiting_user_feedback')
    } else {
      setTaskStatus('processing')
    }
  }, [cleanupPoller])

  // 轮询错误处理
  const handlePollError = useCallback((err) => {
    setTaskStatus('failed')
    setErrorMessage(err.message || '轮询出错')
    cleanupPoller()
  }, [cleanupPoller])

  // 启动轮询
  const startPolling = useCallback((tid) => {
    cleanupPoller()
    stopPollerRef.current = createStatusPoller(tid, handleStatusUpdate, handlePollError)
  }, [cleanupPoller, handleStatusUpdate, handlePollError])

  // ========== 提交表单 ==========
  const handleSubmit = useCallback(async (formData) => {
    try {
      // 重置状态
      setTaskStatus('submitting')
      setTaskId(null)
      setStepName('')
      setStatusMessage('正在提交任务...')
      setPreview(null)
      setHistory([])
      setAllowRevise(false)
      setAllowConfirm(false)
      setErrorMessage('')

      const sessionId = uuidv4()
      const result = await startWorkflow(platform, sessionId, formData)

      if (!result.success) {
        setTaskStatus('failed')
        setErrorMessage(result.message || '启动工作流失败')
        return
      }

      const newTaskId = result.taskId
      setTaskId(newTaskId)
      setTaskStatus('processing')
      setStatusMessage(result.message || '工作流已启动')

      // 开始轮询
      startPolling(newTaskId)
    } catch (err) {
      setTaskStatus('failed')
      setErrorMessage(err.message || '提交失败，请检查网络连接')
    }
  }, [platform, startPolling])

  // ========== 用户操作：提交修改 ==========
  const handleRevise = useCallback(async (feedback) => {
    if (!taskId) return
    try {
      setIsActionSubmitting(true)
      setTaskStatus('revising')
      setStatusMessage('正在提交修改意见...')

      const result = await submitUserAction(taskId, 'revise', feedback)
      if (!result.success) {
        setTaskStatus('failed')
        setErrorMessage(result.message || '提交修改失败')
        return
      }

      setTaskStatus('processing')
      setStatusMessage(result.message || '正在根据修改意见重新生成...')
      startPolling(taskId)
    } catch (err) {
      setTaskStatus('failed')
      setErrorMessage(err.message || '提交修改失败')
    } finally {
      setIsActionSubmitting(false)
    }
  }, [taskId, startPolling])

  // ========== 用户操作：确认继续 ==========
  const handleConfirm = useCallback(async () => {
    if (!taskId) return
    try {
      setIsActionSubmitting(true)
      setTaskStatus('processing')
      setStatusMessage('确认成功，正在生成最终版本...')

      const result = await submitUserAction(taskId, 'confirm', '')
      if (!result.success) {
        setTaskStatus('failed')
        setErrorMessage(result.message || '确认失败')
        return
      }

      setStatusMessage(result.message || '正在生成最终版本...')
      startPolling(taskId)
    } catch (err) {
      setTaskStatus('failed')
      setErrorMessage(err.message || '确认失败')
    } finally {
      setIsActionSubmitting(false)
    }
  }, [taskId, startPolling])

  // ========== 重试 ==========
  const handleRetry = useCallback(() => {
    setTaskStatus('idle')
    setTaskId(null)
    setStepName('')
    setStatusMessage('')
    setPreview(null)
    setHistory([])
    setAllowRevise(false)
    setAllowConfirm(false)
    setErrorMessage('')
    cleanupPoller()
  }, [cleanupPoller])

  // 组件卸载时清理
  useEffect(() => {
    return () => cleanupPoller()
  }, [cleanupPoller])

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部标题栏 */}
      <Header
        taskStatus={taskStatus}
        isDark={isDark}
        onToggleDark={() => setIsDark((d) => !d)}
      />

      {/* 主体内容：左右分栏 */}
      <main className="flex flex-1 overflow-hidden">
        {/* 左侧面板 */}
        <aside className="w-full border-r border-gray-100 bg-white p-6 overflow-y-auto
          md:w-[40%] lg:w-[38%] xl:w-[35%]
          dark:border-gray-800 dark:bg-gray-900">
          <LeftPanel
            platform={platform}
            onPlatformChange={setPlatform}
            onSubmit={handleSubmit}
            isSubmitting={taskStatus === 'submitting'}
            taskStatus={taskStatus}
          />
        </aside>

        {/* 右侧面板 */}
        <section className="hidden flex-1 bg-gray-50 p-6 md:flex md:flex-col
          dark:bg-gray-900/50">
          <RightPanel
            taskStatus={taskStatus}
            stepName={stepName}
            statusMessage={statusMessage}
            preview={preview}
            history={history}
            allowRevise={allowRevise}
            allowConfirm={allowConfirm}
            errorMessage={errorMessage}
            isActionSubmitting={isActionSubmitting}
            onRevise={handleRevise}
            onConfirm={handleConfirm}
            onRetry={handleRetry}
          />
        </section>
      </main>

      {/* 移动端底部预览区（md 以下显示） */}
      <div className="md:hidden border-t border-gray-100 bg-white p-4 overflow-y-auto max-h-[50vh]
        dark:border-gray-800 dark:bg-gray-900">
        <RightPanel
          taskStatus={taskStatus}
          stepName={stepName}
          statusMessage={statusMessage}
          preview={preview}
          history={history}
          allowRevise={allowRevise}
          allowConfirm={allowConfirm}
          errorMessage={errorMessage}
          isActionSubmitting={isActionSubmitting}
          onRevise={handleRevise}
          onConfirm={handleConfirm}
          onRetry={handleRetry}
        />
      </div>
    </div>
  )
}
