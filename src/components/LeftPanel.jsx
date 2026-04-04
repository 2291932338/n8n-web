/**
 * 左侧面板
 * 包含平台选择、表单填写、进行中任务列表、历史记录
 */

import { useState } from 'react'
import PlatformTabs from './PlatformTabs'
import DynamicForm from './DynamicForm'
import TaskHistory from './TaskHistory'
import OngoingTaskList from './OngoingTaskList'
import { getSchemaByPlatform } from '../formSchema'

const TERMINAL_STATUSES = new Set(['completed', 'failed'])

export default function LeftPanel({
  platform,
  onPlatformChange,
  onSubmit,
  isSubmitting,
  taskStatus,
  taskRecords,
  activeTaskId,
  onDeleteTask,
  onClearTasks,
  onNewTask,
  onSelectTask,
}) {
  const [activeTab, setActiveTab] = useState('form') // 'form' | 'history'
  const schema = getSchemaByPlatform(platform)
  const isDisabled = isSubmitting

  const ongoingTasks = (taskRecords || []).filter((t) => !TERMINAL_STATUSES.has(t.status))
  const historyTasks = (taskRecords || []).filter((t) => TERMINAL_STATUSES.has(t.status))

  const handleNewTask = () => {
    setActiveTab('form')
    if (onNewTask) onNewTask()
  }

  const handleSelectTask = (taskId) => {
    setActiveTab('form')
    if (onSelectTask) onSelectTask(taskId)
  }

  return (
    <div className="flex h-full flex-col">
      {/* 顶部 Tab：新任务 / 历史记录 */}
      <div className="mb-3 flex rounded-xl border border-gray-100 p-1 dark:border-gray-700">
        <button
          onClick={handleNewTask}
          className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'form'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          新任务
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`relative flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
              : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
          }`}
        >
          历史记录
          {historyTasks.length > 0 && (
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
              activeTab === 'history'
                ? 'bg-white/20 text-white dark:bg-gray-900/20 dark:text-gray-900'
                : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {historyTasks.length}
            </span>
          )}
        </button>
      </div>

      {/* 进行中任务（常驻区块，任何 tab 下都显示） */}
      {ongoingTasks.length > 0 && (
        <OngoingTaskList
          tasks={ongoingTasks}
          activeTaskId={activeTaskId}
          onSelectTask={handleSelectTask}
        />
      )}

      {activeTab === 'form' ? (
        <>
          {/* 平台选择 */}
          <div className="mb-6">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              选择平台
            </h2>
            <PlatformTabs
              value={platform}
              onChange={onPlatformChange}
              disabled={isDisabled}
            />
          </div>

          {/* 分割线 */}
          <div className="mb-6 h-px bg-gray-100 dark:bg-gray-700" />

          {/* 表单区域 */}
          <div className="flex-1 overflow-y-auto pr-1 -mr-1">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              内容参数
            </h2>
            <DynamicForm
              key={platform}
              schema={schema}
              platform={platform}
              onSubmit={onSubmit}
              isSubmitting={isDisabled}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 -mr-1">
          <TaskHistory
            tasks={historyTasks}
            onDelete={onDeleteTask}
            onClearAll={onClearTasks}
          />
        </div>
      )}
    </div>
  )
}
