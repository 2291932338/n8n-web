/**
 * 进行中任务列表
 * 显示所有非终态任务，支持点击切换活跃任务
 */

import TaskStatusDot from './TaskStatusDot'

const TERMINAL_STATUSES = new Set(['completed', 'failed'])

const PLATFORM_LABELS = {
  xiaohongshu: '小红书',
  douyin: '抖音',
}

const STATUS_TEXT = {
  submitting:            '提交中',
  processing:            '处理中',
  waiting_user_feedback: '待确认',
  revising:              '修改中',
  frame_review:          '逐帧审核',
  video_generating:      '生成视频中',
  video_review:          '视频待确认',
}

const NEEDS_ACTION = new Set(['waiting_user_feedback', 'frame_review', 'video_review'])

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function OngoingTaskList({ tasks, activeTaskId, onSelectTask }) {
  const ongoingTasks = tasks.filter((t) => !TERMINAL_STATUSES.has(t.status))

  if (ongoingTasks.length === 0) return null

  return (
    <div className="mb-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          进行中
        </span>
        <span className="rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-semibold text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
          {ongoingTasks.length}
        </span>
      </div>

      <div className="max-h-[220px] overflow-y-auto space-y-1.5 pr-0.5">
        {ongoingTasks.map((task) => {
          const isActive = task.taskId === activeTaskId
          const needsAction = NEEDS_ACTION.has(task.status)
          const previewText =
            task.previewHistory?.length > 0
              ? task.previewHistory[task.previewHistory.length - 1].text
              : task.preview?.text || ''
          const statusText = STATUS_TEXT[task.status] || task.status

          return (
            <button
              key={task.taskId}
              onClick={() => onSelectTask(task.taskId)}
              className={`w-full rounded-lg border text-left transition-all duration-150 ${
                isActive
                  ? 'border-blue-300 bg-blue-50 shadow-sm dark:border-blue-700 dark:bg-blue-900/20'
                  : needsAction
                  ? 'border-purple-200 bg-purple-50 hover:border-purple-300 hover:bg-purple-50/80 dark:border-purple-800 dark:bg-purple-900/10 dark:hover:bg-purple-900/20'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700'
              }`}
            >
              <div className="flex items-start gap-2 p-2.5">
                {/* 状态动画圆点 */}
                <div className="mt-0.5 shrink-0">
                  <TaskStatusDot status={task.status} />
                </div>

                {/* 内容 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded bg-gray-100 px-1 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                      {PLATFORM_LABELS[task.platform] || task.platform}
                    </span>
                    <span className={`text-[10px] font-medium ${
                      needsAction
                        ? 'text-purple-600 dark:text-purple-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    }`}>
                      {statusText}
                    </span>
                    {needsAction && (
                      <span className="rounded-full bg-purple-500 px-1.5 py-0.5 text-[9px] font-bold text-white animate-blink">
                        需操作
                      </span>
                    )}
                  </div>
                  {previewText ? (
                    <p className="mt-0.5 text-[11px] text-gray-600 line-clamp-1 dark:text-gray-400">
                      {previewText}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                      {task.statusMessage || '处理中...'}
                    </p>
                  )}
                </div>

                {/* 时间 + 当前活跃标记 */}
                <div className="shrink-0 text-right">
                  <p className="text-[10px] text-gray-400">{formatTime(task.createdAt)}</p>
                  {isActive && (
                    <span className="mt-0.5 inline-block rounded bg-blue-500 px-1 py-0.5 text-[9px] font-semibold text-white">
                      当前
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
