/**
 * App 主组件
 * 整合左右面板、状态管理、API 调用
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import config from './config'
import { startWorkflow, submitUserAction, createStatusPoller } from './api'
import { saveTask, getAllTasks, deleteTask, clearAllTasks } from './taskStore'
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

  // ========== 任务历史记录 ==========
  const [taskRecords, setTaskRecords] = useState(() => getAllTasks())

  // 刷新任务列表的辅助函数
  const refreshTaskRecords = useCallback(() => {
    setTaskRecords(getAllTasks())
  }, [])

  const handleDeleteTask = useCallback((taskId) => {
    deleteTask(taskId)
    refreshTaskRecords()
  }, [refreshTaskRecords])

  const handleClearTasks = useCallback((targetPlatform) => {
    clearAllTasks(targetPlatform)
    refreshTaskRecords()
  }, [refreshTaskRecords])

  // ========== 任务状态 ==========
  const [taskStatus, setTaskStatus] = useState('idle')
  const [taskId, setTaskId] = useState(null)
  const [stepName, setStepName] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [preview, setPreview] = useState(null)
  const [history, setHistory] = useState([])
  const [allowRevise, setAllowRevise] = useState(false)
  const [allowConfirm, setAllowConfirm] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isActionSubmitting, setIsActionSubmitting] = useState(false)
  const [previewHistory, setPreviewHistory] = useState([]) // 历史文案版本

  // 用 ref 追踪首次修改，避免 useCallback 闭包问题
  const isFirstReviseRef = useRef(true)

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

  // 用 ref 追踪当前任务 ID，供闭包内使用
  const currentTaskIdRef = useRef(null)
  // 用 ref 追踪当前平台，供闭包内使用
  const currentPlatformRef = useRef('xiaohongshu')
  // 用 ref 追踪当前表单参数
  const currentFormParamsRef = useRef(null)

  // 持久化当前任务状态到 taskStore
  const persistTask = useCallback((patch) => {
    const taskId = currentTaskIdRef.current
    if (!taskId) return
    saveTask({
      taskId,
      platform: currentPlatformRef.current,
      formParams: currentFormParamsRef.current,
      ...patch,
    })
    refreshTaskRecords()
  }, [refreshTaskRecords])

  // 启动轮询
  const startPolling = useCallback((tid, currentPlatform) => {
    cleanupPoller()
    stopPollerRef.current = createStatusPoller(tid, handleStatusUpdate, handlePollError, currentPlatform)
  }, [cleanupPoller, handleStatusUpdate, handlePollError])

  // ========== 提交表单 ==========
  const handleSubmit = useCallback(async (formData) => {
    const createdAt = Date.now()
    currentPlatformRef.current = platform
    currentFormParamsRef.current = formData
    currentTaskIdRef.current = null

    try {
      setTaskStatus('submitting')
      setTaskId(null)
      setStepName('')
      setStatusMessage('正在提交任务，等待 AI 生成...')
      setPreview(null)
      setHistory([])
      setAllowRevise(false)
      setAllowConfirm(false)
      setErrorMessage('')
      setPreviewHistory([])
      isFirstReviseRef.current = true

      const sessionId = uuidv4()
      const result = await startWorkflow(platform, sessionId, formData)

      if (!result.success) {
        setTaskStatus('failed')
        setErrorMessage(result.message || '启动工作流失败')
        // 任务失败时仍保存记录（此时 taskId 可能来自 result）
        const failedId = result.taskId || sessionId
        currentTaskIdRef.current = failedId
        setTaskId(failedId)
        persistTask({
          taskId: failedId,
          status: 'failed',
          preview: null,
          previewHistory: [],
          stepName: '',
          statusMessage: result.message || '启动工作流失败',
          errorMessage: result.message || '启动工作流失败',
          createdAt,
        })
        return
      }

      const newTaskId = result.taskId
      currentTaskIdRef.current = newTaskId
      setTaskId(newTaskId)

      if (result.preview) {
        const initHistory = [{ version: 1, label: '初稿', text: result.preview.text, timestamp: Date.now() }]
        setPreview(result.preview)
        setHistory(result.history || [])
        setStepName(result.stepName || 'draft')
        setStatusMessage(result.message || '初稿已生成，请预览并确认或提出修改意见')
        setAllowRevise(result.allowRevise !== undefined ? result.allowRevise : true)
        setAllowConfirm(result.allowConfirm !== undefined ? result.allowConfirm : true)
        setTaskStatus('waiting_user_feedback')
        // 保存初稿到历史
        setPreviewHistory(initHistory)
        persistTask({
          taskId: newTaskId,
          status: 'waiting_user_feedback',
          preview: result.preview,
          previewHistory: initHistory,
          stepName: result.stepName || 'draft',
          statusMessage: result.message || '初稿已生成',
          errorMessage: null,
          createdAt,
        })
      } else if (config.MOCK_ENABLED) {
        setTaskStatus('processing')
        setStatusMessage(result.message || '工作流已启动')
        persistTask({
          taskId: newTaskId,
          status: 'processing',
          preview: null,
          previewHistory: [],
          stepName: '',
          statusMessage: result.message || '工作流已启动',
          errorMessage: null,
          createdAt,
        })
        startPolling(newTaskId, platform)
      } else {
        setTaskStatus('completed')
        setStatusMessage(result.message || '工作流已完成')
        persistTask({
          taskId: newTaskId,
          status: 'completed',
          preview: result.preview || null,
          previewHistory: [],
          stepName: result.stepName || '',
          statusMessage: result.message || '工作流已完成',
          errorMessage: null,
          createdAt,
        })
      }
    } catch (err) {
      setTaskStatus('failed')
      setErrorMessage(err.message || '提交失败，请检查网络连接')
      persistTask({
        status: 'failed',
        preview: null,
        previewHistory: [],
        stepName: '',
        statusMessage: '',
        errorMessage: err.message || '提交失败，请检查网络连接',
        createdAt,
      })
    }
  }, [platform, startPolling, persistTask])

  // ========== 用户操作：提交修改 ==========
  const handleRevise = useCallback(async (feedback) => {
    if (!taskId) return
    try {
      setIsActionSubmitting(true)
      setTaskStatus('revising')
      setStatusMessage('正在提交修改意见，等待 AI 重新生成...')

      const sendPreviousText = isFirstReviseRef.current ? (preview?.text || '') : ''
      const result = await submitUserAction(taskId, 'revise', feedback, sendPreviousText, platform)
      isFirstReviseRef.current = false

      if (!result.success) {
        setTaskStatus('failed')
        setErrorMessage(result.message || '提交修改失败')
        persistTask({ status: 'failed', errorMessage: result.message || '提交修改失败' })
        return
      }

      if (result.preview) {
        setPreview(result.preview)
        setHistory(result.history || [])
        setStepName(result.stepName || 'draft')
        setStatusMessage(result.message || '已根据修改意见重新生成')
        setAllowRevise(result.allowRevise !== undefined ? result.allowRevise : true)
        setAllowConfirm(result.allowConfirm !== undefined ? result.allowConfirm : true)
        const newStatus = result.status === 'completed' ? 'completed' : 'waiting_user_feedback'
        setTaskStatus(newStatus)
        // 保存修改版到历史
        setPreviewHistory(prev => {
          const updated = [
            ...prev,
            {
              version: prev.length + 1,
              label: '第' + prev.length + '次修改',
              feedback: feedback,
              text: result.preview.text,
              timestamp: Date.now()
            }
          ]
          persistTask({
            status: newStatus,
            preview: result.preview,
            previewHistory: updated,
            stepName: result.stepName || 'draft',
            statusMessage: result.message || '已根据修改意见重新生成',
            errorMessage: null,
          })
          return updated
        })
      } else if (config.MOCK_ENABLED) {
        setTaskStatus('processing')
        setStatusMessage(result.message || '正在根据修改意见重新生成...')
        persistTask({ status: 'processing', statusMessage: result.message || '正在根据修改意见重新生成...' })
        startPolling(taskId, platform)
      } else {
        setTaskStatus('completed')
        setStatusMessage(result.message || '修改完成')
        persistTask({ status: 'completed', statusMessage: result.message || '修改完成' })
      }
    } catch (err) {
      setTaskStatus('failed')
      setErrorMessage(err.message || '提交修改失败')
      persistTask({ status: 'failed', errorMessage: err.message || '提交修改失败' })
    } finally {
      setIsActionSubmitting(false)
    }
  }, [taskId, preview, startPolling, platform, persistTask])

  // ========== 用户操作：确认继续 ==========
  const handleConfirm = useCallback(async () => {
    if (!taskId) return
    try {
      setIsActionSubmitting(true)
      setTaskStatus('processing')
      setStatusMessage('确认成功，等待生成最终版本...')

      const result = await submitUserAction(taskId, 'confirm', '', preview?.text || '', platform)
      if (!result.success) {
        setTaskStatus('failed')
        setErrorMessage(result.message || '确认失败')
        persistTask({ status: 'failed', errorMessage: result.message || '确认失败' })
        return
      }

      if (result.preview) {
        setPreview(result.preview)
        setHistory(result.history || [])
        setStepName('final')
        setStatusMessage(result.message || '内容生成完成！')
        setAllowRevise(false)
        setAllowConfirm(false)
        setTaskStatus('completed')
        // 保存终稿到历史
        setPreviewHistory(prev => {
          const updated = [
            ...prev,
            { version: prev.length + 1, label: '终稿', text: result.preview.text, timestamp: Date.now() }
          ]
          persistTask({
            status: 'completed',
            preview: result.preview,
            previewHistory: updated,
            stepName: 'final',
            statusMessage: result.message || '内容生成完成！',
            errorMessage: null,
          })
          return updated
        })
      } else if (config.MOCK_ENABLED) {
        setStatusMessage(result.message || '正在生成最终版本...')
        persistTask({ status: 'processing', statusMessage: result.message || '正在生成最终版本...' })
        startPolling(taskId, platform)
      } else {
        setTaskStatus('completed')
        setStatusMessage(result.message || '已完成')
        persistTask({ status: 'completed', statusMessage: result.message || '已完成' })
      }
    } catch (err) {
      setTaskStatus('failed')
      setErrorMessage(err.message || '确认失败')
      persistTask({ status: 'failed', errorMessage: err.message || '确认失败' })
    } finally {
      setIsActionSubmitting(false)
    }
  }, [taskId, preview, startPolling, platform, persistTask])

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
    setPreviewHistory([])
    isFirstReviseRef.current = true
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
            taskRecords={taskRecords}
            onDeleteTask={handleDeleteTask}
            onClearTasks={handleClearTasks}
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
            previewHistory={previewHistory}
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
          previewHistory={previewHistory}
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
