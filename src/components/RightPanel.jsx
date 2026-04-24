/**
 * 右侧面板
 * 根据 platform + taskStatus/stepName 路由显示对应内容
 * 小红书：文案预览 + 图片 + 重新生成图片
 * 抖音：稿件预览 → 分镜审核 → 视频生成 → 视频审核
 */

import { useEffect, useRef, useState } from 'react'
import StatusIndicator from './StatusIndicator'
import EmptyState from './EmptyState'
import ErrorState from './ErrorState'
import LoadingSpinner from './LoadingSpinner'
import MessageStream from './MessageStream'
import PreviewContent from './PreviewContent'
import UserActionBar from './UserActionBar'
import RegenerateImagesButton from './RegenerateImagesButton'
import DouyinFrameReview from './DouyinFrameReview'
import DouyinVideoReview from './DouyinVideoReview'
import DouyinStoryboardReview from './DouyinStoryboardReview'
import DouyinMediaProgress from './DouyinMediaProgress'
import DouyinProductionResult from './DouyinProductionResult'
import XhsImageReview from './XhsImageReview'
import { isVideoPlatform } from '../platforms'

function VersionHistory({ previewHistory }) {
  const [expandedVersion, setExpandedVersion] = useState(null)
  if (!previewHistory || previewHistory.length <= 1) return null
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

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false)
  const handle = () => {
    navigator.clipboard.writeText(text).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  return (
    <button
      onClick={handle}
      className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium
        text-gray-500 hover:bg-white hover:text-gray-700 hover:border-gray-300 transition-all
        dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
    >
      {copied ? '已复制' : (
        <>
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="9" y="9" width="13" height="13" rx="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          复制文案
        </>
      )}
    </button>
  )
}

function resizeTextareaToContent(element) {
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

export default function RightPanel({
  platform,
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
  xhsImages,
  currentXhsImageIndex,
  frames,
  currentFrameIndex,
  videoUrl,
  // 批量模式字段
  workflowMode,
  storyboardDocument,
  downloadUrl,
  fileList,
  generationProgress,
  onRevise,
  onConfirm,
  onPreviewTextChange,
  onRetry,
  onStopTask,
  onApproveXhsImage,
  onRejectXhsImage,
  onRegenImages,
  onApproveFrame,
  onRejectFrame,
  onGenerateVideo,
  onRegenVideo,
  onConfirmVideo,
}) {
  const isVideo = isVideoPlatform(platform)
  const isBatchMode = isVideo && workflowMode === 'batch'
  const isIdle = taskStatus === 'idle'
  const isFailed = taskStatus === 'failed'
  const isCompleted = taskStatus === 'completed'
  const isProcessing = taskStatus === 'processing' || taskStatus === 'submitting' || taskStatus === 'revising' || taskStatus === 'video_generating'
  const isWaiting = taskStatus === 'waiting_user_feedback'
  const isImageReview = taskStatus === 'image_review'
  const isFrameReview = taskStatus === 'frame_review'
  const isVideoReview = taskStatus === 'video_review'
  const canStop = !isIdle && !isFailed && !isCompleted
  const storyboardFallbackText = isBatchMode && storyboardDocument
    ? (typeof storyboardDocument === 'string' ? storyboardDocument : JSON.stringify(storyboardDocument, null, 2))
    : ''
  const draftSourceText = typeof preview?.text === 'string' ? preview.text : storyboardFallbackText
  const [draftText, setDraftText] = useState(draftSourceText)
  const [isDraftDirty, setIsDraftDirty] = useState(false)
  const draftTextareaRef = useRef(null)
  const draftTextRef = useRef(draftSourceText)
  const draftSourceTextRef = useRef(draftSourceText)
  const localDraftEditRef = useRef(false)

  useEffect(() => {
    draftSourceTextRef.current = draftSourceText
    if (localDraftEditRef.current && draftSourceText === draftTextRef.current) return

    localDraftEditRef.current = false
    draftTextRef.current = draftSourceText
    setDraftText(draftSourceText)
    setIsDraftDirty(false)
  }, [draftSourceText])

  useEffect(() => {
    resizeTextareaToContent(draftTextareaRef.current)
  }, [draftText, isWaiting])

  const handleDraftTextChange = (value) => {
    localDraftEditRef.current = true
    draftTextRef.current = value
    setDraftText(value)
    setIsDraftDirty(value !== draftSourceTextRef.current)
    onPreviewTextChange?.(value)
  }

  const commitDraftText = () => {
    const currentText = draftTextareaRef.current?.value ?? draftTextRef.current ?? draftText
    draftTextRef.current = currentText

    if (currentText !== draftSourceText) {
      onPreviewTextChange?.(currentText)
    }
    return currentText
  }

  const handleReviseDraft = (feedback) => {
    onRevise?.(feedback, commitDraftText())
  }

  const handleConfirmDraft = () => {
    onConfirm?.(commitDraftText())
  }

  // 所有帧都通过时（allFramesApproved flag 来自轮询结果，存在 frames 内部判断或通过状态判断）
  const allFramesApproved = isFrameReview && frames && frames.length > 0 && frames.every(f => f.status === 'approved')

  return (
    <div className="flex h-full flex-col">
      {/* 状态栏 */}
      {!isIdle && (
        <div className="mb-4 flex flex-shrink-0 items-stretch gap-2">
          <div className="min-w-0 flex-1">
            <StatusIndicator status={taskStatus} stepName={stepName} message={statusMessage} />
          </div>
          {canStop && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('确定要停止当前任务吗？停止后平台将不再轮询该任务。')) {
                  onStopTask?.()
                }
              }}
              disabled={isActionSubmitting}
              className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 transition hover:border-red-300 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300 dark:hover:bg-red-950/50"
            >
              停止任务
            </button>
          )}
        </div>
      )}

      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        {/* 空状态 */}
        {isIdle && <EmptyState />}

        {/* 错误状态 */}
        {isFailed && <ErrorState message={errorMessage} onRetry={onRetry} />}

        {/* ── 抖音批量模式：分镜文档审核 ── */}
        {isBatchMode && (isWaiting || isProcessing) && (storyboardDocument || draftSourceText) && (
          <DouyinStoryboardReview
            storyboardDocument={storyboardDocument}
            previewText={draftSourceText}
            editableText={draftText}
            isDirty={isDraftDirty}
            allowEdit={isWaiting}
            onEditableTextChange={handleDraftTextChange}
            onEditableTextBlur={commitDraftText}
            isActionSubmitting={isActionSubmitting}
          />
        )}

        {/* ── 抖音批量模式：素材生成进度 ── */}
        {isBatchMode && isProcessing && stepName === 'douyin_media_generating' && (
          <DouyinMediaProgress
            generationProgress={generationProgress}
            statusMessage={statusMessage}
          />
        )}

        {/* ── 抖音批量模式：生成完成，展示文件列表 ── */}
        {isBatchMode && isCompleted && (downloadUrl || (fileList && fileList.length > 0)) && (
          <DouyinProductionResult
            downloadUrl={downloadUrl}
            fileList={fileList}
            storyboardDocument={storyboardDocument}
            preview={preview}
          />
        )}

        {/* ── 小红书：逐张图片审核 ── */}
        {!isVideo && isImageReview && (
          <XhsImageReview
            xhsImages={xhsImages || []}
            currentIndex={currentXhsImageIndex}
            isSubmitting={isActionSubmitting}
            onApprove={onApproveXhsImage}
            onReject={onRejectXhsImage}
          />
        )}

        {/* ── 抖音逐帧审核模式：分镜图片逐帧审核 ── */}
        {isVideo && !isBatchMode && isFrameReview && (
          <DouyinFrameReview
            frames={frames || []}
            currentFrameIndex={currentFrameIndex}
            allFramesApproved={allFramesApproved}
            isActionSubmitting={isActionSubmitting}
            onApprove={onApproveFrame}
            onReject={onRejectFrame}
            onGenerateVideo={onGenerateVideo}
          />
        )}

        {/* ── 抖音逐帧审核模式：视频生成中 ── */}
        {isVideo && !isBatchMode && taskStatus === 'video_generating' && (
          <LoadingSpinner message={statusMessage || '正在合成视频，请稍候...'} />
        )}

        {/* ── 抖音逐帧审核模式：视频审核 ── */}
        {isVideo && !isBatchMode && isVideoReview && (
          <div className="space-y-4">
            <DouyinVideoReview
              videoUrl={videoUrl}
              isActionSubmitting={isActionSubmitting}
              onConfirmVideo={onConfirmVideo}
              onRegenVideo={onRegenVideo}
            />
          </div>
        )}

        {/* ── 处理中（无预览时）── */}
        {isProcessing && !preview && !isFrameReview &&
          !(isBatchMode && stepName === 'douyin_media_generating') && (
          <LoadingSpinner message={statusMessage} />
        )}

        {/* ── 文案预览区（小红书全程 + 抖音逐帧审核模式稿件阶段）── */}
        {/* 批量模式的 waiting_user_feedback 由 DouyinStoryboardReview 处理 */}
        {/* 批量模式的 completed 由 DouyinProductionResult 处理 */}
        {(isWaiting || isCompleted || (isProcessing && preview)) &&
          !isImageReview && !isFrameReview && !isVideoReview &&
          !(isVideo && (isFrameReview || isVideoReview || taskStatus === 'video_generating')) &&
          !(isBatchMode && (isWaiting || isProcessing) && (storyboardDocument || draftSourceText)) &&
          !(isBatchMode && isCompleted && (downloadUrl || (fileList && fileList.length > 0))) &&
          preview && preview.text && (
          <div className="space-y-6">
            {/* 文案卡片 */}
            <div className={`rounded-2xl border-2 p-5 ${
              isCompleted
                ? 'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10'
                : 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-900/10'
            }`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={`text-sm font-semibold ${
                  isCompleted ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'
                }`}>
                  {isCompleted ? '最终文案' : (
                    previewHistory && previewHistory.length > 1
                      ? `当前版本（第${previewHistory.length}版）`
                      : '文案预览（初稿）'
                  )}
                </h3>
                <CopyButton text={draftText} />
              </div>
              {isWaiting ? (
                <div className="space-y-2">
                  <textarea
                    ref={draftTextareaRef}
                    value={draftText}
                    onChange={(e) => handleDraftTextChange(e.target.value)}
                    onBlur={commitDraftText}
                    disabled={isActionSubmitting}
                    aria-label="编辑当前初稿"
                    className="min-h-[320px] w-full resize-none overflow-hidden rounded-xl border border-blue-100 bg-white/80 px-4 py-3 text-sm leading-relaxed text-gray-700 outline-none transition
                      focus:border-blue-300 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60
                      dark:border-blue-800 dark:bg-gray-900/70 dark:text-gray-200 dark:focus:border-blue-500"
                  />
                  <p className={`text-xs ${isDraftDirty ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {isDraftDirty ? '已手动修改，确认继续或提交修改时会使用当前内容。' : '可直接在预览框中修改，也可以在下方输入意见让 AI 修改。'}
                  </p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                  {preview.text}
                </div>
              )}
            </div>

            {/* 小红书：图片 + 重新生成按钮 */}
            {!isVideo && preview.images && preview.images.length > 0 && (
              <div>
                <PreviewContent preview={{ text: null, images: preview.images, videos: [] }} isCompleted={isCompleted} />
                {isCompleted && (
                  <div className="mt-3">
                    <RegenerateImagesButton onRegenImages={onRegenImages} isSubmitting={isActionSubmitting} />
                  </div>
                )}
              </div>
            )}

            {/* 视频（小红书视频 / 抖音完成后的视频）*/}
            {preview.videos && preview.videos.length > 0 && (
              <PreviewContent preview={{ text: null, images: [], videos: preview.videos }} isCompleted={isCompleted} />
            )}

            {/* 历史版本 */}
            <VersionHistory previewHistory={previewHistory} />
          </div>
        )}

        {/* 消息流 */}
        {!isIdle && !isFailed && history && history.length > 0 && !isFrameReview && !isVideoReview && (
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

      {/* 用户交互区（稿件修改/确认，小红书和抖音稿件阶段共用）*/}
      {isWaiting && !isImageReview && !isFrameReview && !isVideoReview && !isFailed && (
        <div className="mt-4 flex-shrink-0">
          <UserActionBar
            onRevise={handleReviseDraft}
            onConfirm={handleConfirmDraft}
            allowRevise={allowRevise}
            allowConfirm={allowConfirm}
            isSubmitting={isActionSubmitting}
          />
        </div>
      )}
    </div>
  )
}


