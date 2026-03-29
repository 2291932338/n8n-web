/**
 * 错误状态组件
 */

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      {/* 图标 */}
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
        <svg className="h-8 w-8 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4" />
          <circle cx="12" cy="16" r="0.5" fill="currentColor" />
        </svg>
      </div>

      <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
        出错了
      </h3>

      <p className="mb-6 max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">
        {message || '工作流执行过程中出现错误，请检查网络连接后重试。'}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 rounded-xl bg-red-600 px-6 py-2.5 text-sm font-semibold text-white
            shadow-lg shadow-red-600/25 hover:bg-red-700 active:scale-[0.98] transition-all"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
          </svg>
          重新尝试
        </button>
      )}
    </div>
  )
}
