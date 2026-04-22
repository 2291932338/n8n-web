import { useState } from 'react'
import PlatformTabs from './PlatformTabs'
import DynamicForm from './DynamicForm'
import TaskHistory from './TaskHistory'
import OngoingTaskList from './OngoingTaskList'
import { getSchemaByPlatform } from '../formSchema'
import { getPlatformGroup, getPlatformLabel } from '../platforms'

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
  const [activeTab, setActiveTab] = useState('form')
  const [isPlatformSelectorOpen, setIsPlatformSelectorOpen] = useState(false)
  const schema = getSchemaByPlatform(platform)
  const isDisabled = isSubmitting
  const platformGroup = getPlatformGroup(platform)
  const platformGroupLabel = platformGroup === 'video' ? '视频工作流' : '图文工作流'
  const platformLabel = getPlatformLabel(platform)

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

      {ongoingTasks.length > 0 && (
        <OngoingTaskList
          tasks={ongoingTasks}
          activeTaskId={activeTaskId}
          onSelectTask={handleSelectTask}
        />
      )}

      {activeTab === 'form' ? (
        <>
          <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  选择模块与平台
                </h2>
                <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                  {platformGroupLabel} / {platformLabel}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPlatformSelectorOpen((open) => !open)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 transition hover:border-gray-300 hover:text-gray-900 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:text-white"
              >
                {isPlatformSelectorOpen ? '收起' : '展开'}
                <svg
                  className={`h-4 w-4 transition-transform ${isPlatformSelectorOpen ? 'rotate-180' : ''}`}
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="M5 7.5 10 12.5 15 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            {isPlatformSelectorOpen && (
              <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-700">
                <PlatformTabs
                  value={platform}
                  onChange={onPlatformChange}
                  disabled={isDisabled}
                />
              </div>
            )}
          </div>

          <div className="mb-6 h-px bg-gray-100 dark:bg-gray-700" />

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
