import config from '../config'

export default function Header({
  taskStatus,
  isDark,
  onToggleDark,
  user,
  view = 'app',
  onShowApp,
  onShowAdmin,
  onLogout,
}) {
  const connectionLabel = config.MOCK_ENABLED ? 'Mock 模式' : '已连接'
  const connectionColor = config.MOCK_ENABLED ? 'bg-yellow-400' : 'bg-green-400'

  const taskStatusLabels = {
    idle: null,
    submitting: '提交中',
    processing: '处理中',
    waiting_user_feedback: '等待确认',
    revising: '修改中',
    completed: '已完成',
    failed: '失败',
  }
  const taskLabel = taskStatusLabels[taskStatus]
  const isAdmin = user?.role === 'ADMIN'

  return (
    <header className="flex items-center justify-between border-b border-gray-100 bg-white/80 px-6 py-3 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-900/80">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 dark:bg-primary-500">
          <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm font-bold text-gray-900 dark:text-white">{config.APP_NAME}</h1>
          <p className="text-xs text-gray-400 dark:text-gray-500">{config.APP_SUBTITLE}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 md:flex dark:bg-gray-800">
          <span className={`h-2 w-2 rounded-full ${connectionColor}`} />
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{connectionLabel}</span>
        </div>

        {taskLabel && view === 'app' && (
          <div className="hidden items-center gap-2 rounded-lg bg-gray-50 px-3 py-1.5 md:flex dark:bg-gray-800">
            {(taskStatus === 'processing' || taskStatus === 'submitting' || taskStatus === 'revising') && (
              <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
            )}
            {taskStatus === 'waiting_user_feedback' && (
              <span className="h-2 w-2 animate-pulse-slow rounded-full bg-purple-400" />
            )}
            {taskStatus === 'completed' && <span className="h-2 w-2 rounded-full bg-green-400" />}
            {taskStatus === 'failed' && <span className="h-2 w-2 rounded-full bg-red-400" />}
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{taskLabel}</span>
          </div>
        )}

        {user && (
          <div className="hidden max-w-[220px] truncate rounded-lg bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-500 md:block dark:bg-gray-800 dark:text-gray-300">
            {user.email}
          </div>
        )}

        {isAdmin && (
          <div className="flex rounded-lg border border-gray-100 p-1 dark:border-gray-700">
            <button
              type="button"
              onClick={onShowApp}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${view === 'app' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
            >
              工作台
            </button>
            <button
              type="button"
              onClick={onShowAdmin}
              className={`rounded-md px-3 py-1 text-xs font-bold transition ${view === 'admin' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}
            >
              管理
            </button>
          </div>
        )}

        <button
          onClick={onToggleDark}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          title={isDark ? '切换到浅色模式' : '切换到深色模式'}
        >
          {isDark ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
          )}
        </button>

        {user && (
          <button
            type="button"
            onClick={onLogout}
            className="rounded-lg border border-gray-100 px-3 py-1.5 text-xs font-bold text-gray-500 transition hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
          >
            退出
          </button>
        )}
      </div>
    </header>
  )
}
