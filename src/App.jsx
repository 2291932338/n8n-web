/**
 * App 主组件
 * 整合左右面板、状态管理、API 调用
 * 异步模式：提交后立即解锁表单，任务在后台轮询
 */

import { useState, useCallback, useEffect } from 'react'
import config from './config'
import { useTask } from './hooks/useTask'
import { useTaskManager } from './hooks/useTaskManager'
import Header from './components/Header'
import LeftPanel from './components/LeftPanel'
import RightPanel from './components/RightPanel'

function TaskInstance({ platform, onPlatformChange, taskRecords, onDeleteTask, onClearTasks, onTaskSaved }) {
  const task = useTask(onTaskSaved)

  const handleSubmit = useCallback((formData) => {
    task.submit(platform, formData)
  }, [task, platform])

  // 提交后表单仅在 submitting 阶段（约 500ms）短暂锁定，其余时间可自由切换
  const isFormLocked = task.taskStatus === 'submitting'

  return (
    <>
      {/* 左侧面板 */}
      <aside className="w-full border-r border-gray-100 bg-white p-6 overflow-y-auto
        md:w-[40%] lg:w-[38%] xl:w-[35%]
        dark:border-gray-800 dark:bg-gray-900">
        <LeftPanel
          platform={platform}
          onPlatformChange={onPlatformChange}
          onSubmit={handleSubmit}
          isSubmitting={isFormLocked}
          taskStatus={task.taskStatus}
          taskRecords={taskRecords}
          onDeleteTask={onDeleteTask}
          onClearTasks={onClearTasks}
        />
      </aside>

      {/* 右侧面板 */}
      <section className="hidden flex-1 bg-gray-50 p-6 md:flex md:flex-col
        dark:bg-gray-900/50">
        <RightPanel
          platform={platform}
          taskStatus={task.taskStatus}
          stepName={task.stepName}
          statusMessage={task.statusMessage}
          preview={task.preview}
          history={task.history}
          previewHistory={task.previewHistory}
          allowRevise={task.allowRevise}
          allowConfirm={task.allowConfirm}
          errorMessage={task.errorMessage}
          isActionSubmitting={task.isActionSubmitting}
          frames={task.frames}
          currentFrameIndex={task.currentFrameIndex}
          videoUrl={task.videoUrl}
          onRevise={task.revise}
          onConfirm={task.confirm}
          onRetry={task.reset}
          onRegenImages={task.regenImages}
          onApproveFrame={task.approveFrame}
          onRejectFrame={task.rejectFrame}
          onGenerateVideo={task.triggerGenerateVideo}
          onRegenVideo={task.regenVideo}
          onConfirmVideo={task.confirmVideo}
        />
      </section>

      {/* 移动端底部预览区 */}
      <div className="md:hidden border-t border-gray-100 bg-white p-4 overflow-y-auto max-h-[50vh]
        dark:border-gray-800 dark:bg-gray-900">
        <RightPanel
          platform={platform}
          taskStatus={task.taskStatus}
          stepName={task.stepName}
          statusMessage={task.statusMessage}
          preview={task.preview}
          history={task.history}
          previewHistory={task.previewHistory}
          allowRevise={task.allowRevise}
          allowConfirm={task.allowConfirm}
          errorMessage={task.errorMessage}
          isActionSubmitting={task.isActionSubmitting}
          frames={task.frames}
          currentFrameIndex={task.currentFrameIndex}
          videoUrl={task.videoUrl}
          onRevise={task.revise}
          onConfirm={task.confirm}
          onRetry={task.reset}
          onRegenImages={task.regenImages}
          onApproveFrame={task.approveFrame}
          onRejectFrame={task.rejectFrame}
          onGenerateVideo={task.triggerGenerateVideo}
          onRegenVideo={task.regenVideo}
          onConfirmVideo={task.confirmVideo}
        />
      </div>
    </>
  )
}

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

  // ========== 任务管理 ==========
  const {
    taskRecords,
    activeTaskKey,
    refreshTaskRecords,
    deleteTaskRecord,
    clearTaskRecords,
  } = useTaskManager()

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900">
      <Header
        isDark={isDark}
        onToggleDark={() => setIsDark((d) => !d)}
      />

      <main className="flex flex-1 overflow-hidden">
        {/*
          key={activeTaskKey} 确保平台切换或新任务时 useTask 实例干净重置。
          目前每次平台切换都重置任务状态（简单可靠），
          如需跨平台保留任务可去掉 platform 部分的 key 依赖。
        */}
        <TaskInstance
          key={activeTaskKey}
          platform={platform}
          onPlatformChange={setPlatform}
          taskRecords={taskRecords}
          onDeleteTask={deleteTaskRecord}
          onClearTasks={clearTaskRecords}
          onTaskSaved={refreshTaskRecords}
        />
      </main>
    </div>
  )
}
