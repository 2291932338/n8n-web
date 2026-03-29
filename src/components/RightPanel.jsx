/**
 * 右侧面板
 * 输出预览区：状态展示 + 消息流 + 预览内容 + 用户交互
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

        {/* 处理中（没有历史记录时显示加载动画） */}
        {isProcessing && (!history || history.length === 0) && (
          <LoadingSpinner message={statusMessage} />
        )}

        {/* 消息流（有历史记录时） */}
        {!isIdle && !isFailed && history && history.length > 0 && (
          <div className="space-y-6">
            <MessageStream history={history} isCompleted={isCompleted} />

            {/* 处理中时在消息流下方追加加载状态 */}
            {isProcessing && (
              <LoadingSpinner message={statusMessage} />
            )}

            {/* 完成时显示最终预览（如果不在历史记录中已渲染） */}
            {isCompleted && preview && (
              <div className="mt-6 rounded-2xl border-2 border-green-200 bg-green-50/50 p-5 dark:border-green-800 dark:bg-green-900/10">
                <div className="mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  <h3 className="text-sm font-semibold text-green-700 dark:text-green-400">
                    最终结果
                  </h3>
                </div>
                <PreviewContent preview={preview} isCompleted={true} />
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
