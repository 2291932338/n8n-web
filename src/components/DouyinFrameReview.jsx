/**
 * 抖音分镜图片逐帧审核组件
 * 展示当前帧图片 + 分镜文字，提供通过/拒绝操作
 * 顶部有进度条，侧边有缩略图列表
 */

import { useState } from 'react'

const FRAME_STATUS_STYLES = {
  approved: 'ring-2 ring-green-400 opacity-100',
  rejected: 'ring-2 ring-red-400 opacity-100',
  reviewing: 'ring-2 ring-violet-500 opacity-100',
  pending: 'opacity-40',
  generating: 'opacity-60 animate-pulse',
}

export default function DouyinFrameReview({
  frames,
  currentFrameIndex,
  allFramesApproved,
  isActionSubmitting,
  onApprove,
  onReject,
  onGenerateVideo,
}) {
  const [rejectFeedback, setRejectFeedback] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [selectedFrameIdx, setSelectedFrameIdx] = useState(currentFrameIndex)

  const totalExpected = frames.length > 0 ? Math.max(frames.length, currentFrameIndex + 1) : 1
  const approvedCount = frames.filter(f => f.status === 'approved').length
  const currentFrame = frames.find(f => f.index === (selectedFrameIdx ?? currentFrameIndex))
  const reviewingFrame = frames.find(f => f.status === 'reviewing')

  const handleApprove = () => {
    setShowRejectInput(false)
    setRejectFeedback('')
    onApprove(reviewingFrame?.index ?? currentFrameIndex)
  }

  const handleReject = () => {
    if (!showRejectInput) {
      setShowRejectInput(true)
      return
    }
    onReject(reviewingFrame?.index ?? currentFrameIndex, rejectFeedback)
    setShowRejectInput(false)
    setRejectFeedback('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 进度条 */}
      <div className="rounded-xl bg-violet-50 p-3 dark:bg-violet-900/20">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-violet-700 dark:text-violet-400">
            分镜图片审核进度
          </span>
          <span className="text-xs text-violet-500 dark:text-violet-400">
            {approvedCount} / {frames.length} 已通过
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-violet-100 dark:bg-violet-900/40">
          <div
            className="h-full rounded-full bg-violet-500 transition-all duration-500"
            style={{ width: frames.length > 0 ? `${(approvedCount / frames.length) * 100}%` : '0%' }}
          />
        </div>
      </div>

      {/* 所有帧已通过 → 显示生成视频按钮 */}
      {allFramesApproved && (
        <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-5 dark:border-green-800 dark:bg-green-900/10">
          <div className="mb-3 flex items-center gap-2">
            <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <h3 className="text-sm font-semibold text-green-700 dark:text-green-400">
              所有分镜图片审核通过！
            </h3>
          </div>
          <p className="mb-4 text-xs text-green-600 dark:text-green-500">
            共 {approvedCount} 帧图片已确认。点击下方按钮开始合成视频。
          </p>
          <button
            onClick={onGenerateVideo}
            disabled={isActionSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3
              text-sm font-semibold text-white transition-colors
              hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isActionSubmitting ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 11-6.219-8.56" />
                </svg>
                提交中...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                开始生成视频
              </>
            )}
          </button>
        </div>
      )}

      {/* 帧缩略图列表 */}
      {frames.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {frames.map((frame) => (
            <button
              key={frame.index}
              onClick={() => setSelectedFrameIdx(frame.index)}
              className={`relative flex-shrink-0 h-16 w-24 overflow-hidden rounded-lg
                ${FRAME_STATUS_STYLES[frame.status] || 'opacity-40'}
                ${selectedFrameIdx === frame.index ? 'ring-2 ring-blue-500' : ''}
                transition-all`}
            >
              {frame.imageUrl ? (
                <img src={frame.imageUrl} alt={`帧${frame.index + 1}`}
                  className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <svg className="h-5 w-5 text-gray-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                </div>
              )}
              {/* 状态角标 */}
              <div className="absolute bottom-0.5 right-0.5">
                {frame.status === 'approved' && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-green-500">
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                )}
                {frame.status === 'rejected' && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500">
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </span>
                )}
              </div>
              <span className="absolute top-0.5 left-1 text-[10px] font-bold text-white drop-shadow">
                {frame.index + 1}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* 当前帧大图预览 */}
      {currentFrame && (
        <div className="rounded-2xl border border-violet-200 bg-white overflow-hidden dark:border-violet-800 dark:bg-gray-800">
          {/* 图片 */}
          <div className="relative bg-gray-50 dark:bg-gray-900">
            <img
              src={currentFrame.imageUrl}
              alt={`分镜 ${currentFrame.index + 1}`}
              className="w-full object-contain max-h-72"
              onError={(e) => { e.target.style.display = 'none' }}
            />
            <div className="absolute top-2 left-2 rounded-lg bg-black/50 px-2 py-1 text-xs text-white">
              第 {currentFrame.index + 1} 帧
            </div>
          </div>

          {/* 分镜文字 */}
          {currentFrame.storyboardText && (
            <div className="border-t border-violet-100 p-3 dark:border-violet-800">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">分镜说明</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {currentFrame.storyboardText}
              </p>
            </div>
          )}

          {/* 审核操作（仅对当前待审核帧显示） */}
          {currentFrame.status === 'reviewing' && !allFramesApproved && (
            <div className="border-t border-violet-100 p-3 dark:border-violet-800">
              {showRejectInput && (
                <div className="mb-3">
                  <textarea
                    value={rejectFeedback}
                    onChange={(e) => setRejectFeedback(e.target.value)}
                    placeholder="请输入对该帧的修改意见..."
                    rows={2}
                    className="w-full resize-none rounded-lg border border-gray-200 p-2 text-sm
                      focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-400
                      dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
                  />
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleApprove}
                  disabled={isActionSubmitting}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-green-600 py-2
                    text-sm font-semibold text-white transition-colors hover:bg-green-700
                    disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  通过
                </button>
                <button
                  onClick={handleReject}
                  disabled={isActionSubmitting || (showRejectInput && !rejectFeedback.trim())}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 py-2
                    text-sm font-semibold text-red-600 transition-colors hover:bg-red-100
                    disabled:opacity-50 disabled:cursor-not-allowed
                    dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  {showRejectInput ? '确认拒绝' : '拒绝'}
                </button>
                {showRejectInput && (
                  <button
                    onClick={() => { setShowRejectInput(false); setRejectFeedback('') }}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-500
                      hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400"
                  >
                    取消
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
