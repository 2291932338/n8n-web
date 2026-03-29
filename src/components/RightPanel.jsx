/**
 * 右侧面板
 * 输出预览区：状态展示 + 预览内容 + 消息流 + 用户交互
 */

import StatusIndicator from './StatusIndicator'
import EmptyState from './EmptyState'
import ErrorState from './ErrorState'
import LoadingSpinner from './LoadingSpinner'
import MessageStream from './MessageStream'
import PreviewContent from './PreviewContent'
import UserActionBar from './UserActionBar'

export default function RightPanel({
  taskStatus,
  stepName,
  statusMessage,
  preview,
  history,
  allowRevise,
  allowConfirm,
  errorMessage,
  isActionSubmitting,
  onRevise,
  onConfirm,
  onRetry,
}) {
  const isCompleted = taskStatus === 'completed'
  const isFailed = taskStatus === 'failed'
  const isIdle = taskStatus === 'idle'
  const isProcessing = taskStatus === 'processing' || taskStatus === 'submitting' || taskStatus === 'revising'
  const isWaiting = taskStatus === 'waiting_user_feedback'

  return (
    <div className="flex h-full flex-col">
      {/* 状态栏 */}
      {!isIdle && (
        <div className="mb-4 flex-shrink-0">
          <StatusIndicator status={taskStatus} stepName={stepName} message={statusMessage} />
        </div>
      )}

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        {/* 空状态 */}
        {isIdle && <EmptyState />}

        {/* 错误状态 */}
        {isFailed && <ErrorState message={errorMessage} onRetry={onRetry} />}

        {/* 处理中（没有预览内容时显示加载动画） */}
        {isProcessing && !preview && (
          <LoadingSpinner message={statusMessage} />
        )}

        {/* 预览内容区 - 等待反馈或已完成时直接显示 */}
        {(isWaiting || isCompleted) && preview && preview.text && (
          <div className="space-y-6">
            {/* 文案内容 */}
            <div className={`rounded-2xl border-2 p-5 ${
              isCompleted
                ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10'
                : 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10'
            }`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${
                  isCompleted
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-blue-700 dark:text-blue-400'
                }`}>
                  {isCompleted ? '最终文案' : '文案预览（初稿）'}
                </h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(preview.text).catch(() => {
                      const ta = document.createElement('textarea')
                      ta.value = preview.text
                      document.body.appendChild(ta)
                      ta.select()
                      document.execCommand('copy')
                      document.body.removeChild(ta)
                    })
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium
                    text-gray-500 hover:bg-white hover:text-gray-700 hover:border-gray-300 transition-all
                    dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  复制文案
                </button>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                {preview.text}
              </div>
            </div>

            {/* 图片 */}
            {preview.images && preview.images.length > 0 && (
              <PreviewContent preview={{ text: null, images: preview.images, videos: [] }} isCompleted={isCompleted} />
            )}

            {/* 视频 */}
            {preview.videos && preview.videos.length > 0 && (
              <PreviewContent preview={{ text: null, images: [], videos: preview.videos }} isCompleted={isCompleted} />
            )}
          </div>
        )}

        {/* 消息流 */}
        {!isIdle && !isFailed && history && history.length > 0 && (
          <div className="mt-6">
            <MessageStream history={history} isCompleted={isCompleted} />

            {isProcessing && (
              <div className="mt-4">
                <LoadingSpinner message={statusMessage} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* 用户交互区 */}
      {(isWaiting || isCompleted) && !isFailed && (
        <div className="mt-4 flex-shrink-0">
          <UserActionBar
            onRevise={onRevise}
            onConfirm={onConfirm}
            allowRevise={isWaiting && allowRevise}
            allowConfirm={isWaiting && allowConfirm}
            isSubmitting={isActionSubmitting}
          />
        </div>
      )}
    </div>
  )
}
