/**
 * 抖音素材生成进度组件（批量模式）
 * 显示素材批量生成的整体进度和当前步骤
 */

export default function DouyinMediaProgress({
  generationProgress,
  statusMessage,
}) {
  const current = generationProgress?.current || 0
  const total = generationProgress?.total || 0
  const currentStep = generationProgress?.currentStep || ''
  const displayCurrent = Math.min(current + 1, total)
  const percentage = total > 0 ? Math.round((displayCurrent / total) * 100) : 0

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-8">
      {/* 圆形进度指示 */}
      <div className="relative flex h-32 w-32 items-center justify-center">
        <svg className="h-32 w-32 -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="50"
            fill="none" stroke="currentColor"
            className="text-violet-100 dark:text-violet-900/30"
            strokeWidth="8"
          />
          <circle
            cx="60" cy="60" r="50"
            fill="none" stroke="currentColor"
            className="text-violet-500 transition-all duration-700"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 50}`}
            strokeDashoffset={`${2 * Math.PI * 50 * (1 - percentage / 100)}`}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {percentage}%
          </span>
          {total > 0 && (
            <span className="text-xs text-gray-400">{displayCurrent}/{total}</span>
          )}
        </div>
      </div>

      {/* 状态文字 */}
      <div className="text-center space-y-2">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {statusMessage || '正在生成素材...'}
        </p>
        {currentStep && (
          <p className="text-xs text-violet-500 dark:text-violet-400">
            {currentStep}
          </p>
        )}
      </div>

      {/* 进度条 */}
      <div className="w-full max-w-xs">
        <div className="h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/30">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-700"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 提示 */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center max-w-sm">
        正在根据分镜文档批量生成配图、配音和字幕文件，请耐心等待...
      </p>
    </div>
  )
}
