/**
 * 右侧面板
 * 输出预览区：状态展示 + 预览内容 + 历史版本 + 用户交互
 */

import { useState } from 'react'
import StatusIndicator from './StatusIndicator'
import EmptyState from './EmptyState'
import ErrorState from './ErrorState'
import LoadingSpinner from './LoadingSpinner'
import MessageStream from './MessageStream'
import PreviewContent from './PreviewContent'
import UserActionBar from './UserActionBar'

function VersionHistory({ previewHistory, currentText }) {
  const [expandedVersion, setExpandedVersion] = useState(null)

  if (!previewHistory || previewHistory.length <= 1) return null

  // 不显示最新版（因为已经在上方显示了）
  const olderVersions = previewHistory.slice(0, -1).reverse()

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-3 text-sm font-semibold text-gray-600 dark:text-gray-400">
        历史版本 ({olderVersions.length})
      </h3>
      <div className="space-y-2">
        {olderVersions.map((item) => (
          <div key={item.version} className="rounded-xl border border-gray-100 dark:border-gray-700">
            <button
              onClick={() => setExpandedVersion(expandedVersion === item.version ? null : item.version)}
              className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-xl"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                  {item.version}
                </span>
                <div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                  {item.feedback && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      修改意见: {item.feedback.length > 30 ? item.feedback.slice(0, 30) + '...' : item.feedback}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {new Date(item.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                <svg
                  className={`h-4 w-4 text-gray-400 transition-transform ${expandedVersion === item.version ? 'rotate-180' : ''}`}
                  viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </div>
            </button>
            {expandedVersion === item.version && (
              <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-700">
                <div className="mb-2 flex justify-end">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.text).catch(() => {
                        const ta = document.createElement('textarea')
                        ta.value = item.text
                        document.body.appendChild(ta)
                        ta.select()
                        document.execCommand('copy')
                        document.body.removeChild(ta)
                      })
                    }}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    复制此版本
                  </button>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600 dark:text-gray-400 max-h-60 overflow-y-auto">
                  {item.text}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function RightPanel({
  taskStatus,
  stepName,
  statusMessage,
  preview,
  history,
  previewHistory,
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

        {/* 预览内容区 */}
        {(isWaiting || isCompleted) && preview && preview.text && (
          <div className="space-y-6">
            {/* 当前文案 */}
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
                  {isCompleted ? '最终文案' : (previewHistory && previewHistory.length > 1
                    ? '当前版本（第' + previewHistory.length + '版）'
                    : '文案预览（初稿）'
                  )}
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

            {/* 历史版本 */}
            <VersionHistory previewHistory={previewHistory} currentText={preview.text} />
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
