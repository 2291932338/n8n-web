/**
 * 抖音视频审核组件
 * 显示生成的视频，提供确认完成 / 重新生成视频 两个操作
 */

export default function DouyinVideoReview({
  videoUrl,
  isActionSubmitting,
  onConfirmVideo,
  onRegenVideo,
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border-2 border-teal-200 bg-teal-50/50 p-4 dark:border-teal-800 dark:bg-teal-900/10">
        <h3 className="mb-3 text-sm font-semibold text-teal-700 dark:text-teal-400">
          视频已生成，请预览确认
        </h3>

        {/* 视频播放器 */}
        {videoUrl ? (
          <div className="overflow-hidden rounded-xl bg-black">
            <video
              src={videoUrl}
              controls
              className="w-full max-h-72"
              preload="metadata"
            >
              您的浏览器不支持视频播放
            </video>
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800">
            <p className="text-sm text-gray-400">视频加载中...</p>
          </div>
        )}

        {/* 下载链接 */}
        {videoUrl && (
          <a
            href={videoUrl}
            download
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex items-center gap-1.5 text-xs text-teal-500 hover:text-teal-700 dark:text-teal-400"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            下载视频
          </a>
        )}
      </div>

      {/* 提示 */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        对视频满意？点击「确认完成」结束任务；不满意可点击「重新生成视频」（分镜图片不会改变）。
      </p>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button
          onClick={onConfirmVideo}
          disabled={isActionSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 py-3
            text-sm font-semibold text-white transition-colors
            hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isActionSubmitting ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 11-6.219-8.56" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          确认完成任务
        </button>

        <button
          onClick={onRegenVideo}
          disabled={isActionSubmitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 py-3
            text-sm font-semibold text-orange-600 transition-colors
            hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed
            dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          重新生成视频
        </button>
      </div>
    </div>
  )
}
