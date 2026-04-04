/**
 * XhsImageReview 组件
 * 小红书逐张图片审核：每次展示一张待审图，用户通过或拒绝后继续下一张
 */

import { useState } from 'react'
import ImageLightbox from './ImageLightbox'

export default function XhsImageReview({
  xhsImages = [],
  currentIndex = 0,
  isSubmitting = false,
  onApprove,
  onReject,
}) {
  const [rejectFeedback, setRejectFeedback] = useState('')
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState(null)

  const total = xhsImages.length
  const approvedImages = xhsImages.filter((img) => img.status === 'approved')
  const currentImage = xhsImages[currentIndex]

  const handleApprove = () => {
    setShowRejectInput(false)
    setRejectFeedback('')
    if (onApprove) onApprove(currentIndex)
  }

  const handleRejectSubmit = () => {
    if (!rejectFeedback.trim()) return
    setShowRejectInput(false)
    if (onReject) onReject(currentIndex, rejectFeedback.trim())
    setRejectFeedback('')
  }

  if (!currentImage) return null

  return (
    <div className="space-y-4">
      {/* 进度标题 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          图片审核
        </h3>
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
          第 {currentIndex + 1} 张 / 共 {total} 张
        </span>
      </div>

      {/* 进度条 */}
      <div className="h-1.5 w-full rounded-full bg-gray-100 dark:bg-gray-700">
        <div
          className="h-1.5 rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((approvedImages.length) / total) * 100}%` }}
        />
      </div>

      {/* 当前待审核图片 */}
      <div className="rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/10">
        <p className="mb-3 text-xs font-medium text-blue-600 dark:text-blue-400">
          当前图片（点击可放大）
        </p>
        <button
          onClick={() => setLightboxUrl(currentImage.url)}
          className="block w-full overflow-hidden rounded-xl border border-blue-100 dark:border-blue-800"
        >
          <img
            src={currentImage.url}
            alt={`图片 ${currentIndex + 1}`}
            className="h-64 w-full object-cover transition-transform hover:scale-105"
          />
        </button>
      </div>

      {/* 操作按钮 */}
      {!showRejectInput ? (
        <div className="flex gap-3">
          <button
            onClick={handleApprove}
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-green-500 py-2.5 text-sm font-semibold text-white
              hover:bg-green-600 active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors"
          >
            {isSubmitting ? '提交中...' : '✓ 通过'}
          </button>
          <button
            onClick={() => setShowRejectInput(true)}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold
              text-red-600 hover:bg-red-100 active:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors dark:border-red-800 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            ✕ 重新生成
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={rejectFeedback}
            onChange={(e) => setRejectFeedback(e.target.value)}
            placeholder="请说明修改意见（必填）..."
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm
              text-gray-700 placeholder-gray-400 focus:border-blue-300 focus:outline-none focus:ring-1
              focus:ring-blue-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300
              dark:placeholder-gray-500 dark:focus:border-blue-600"
          />
          <div className="flex gap-2">
            <button
              onClick={handleRejectSubmit}
              disabled={!rejectFeedback.trim() || isSubmitting}
              className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-semibold text-white
                hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '提交中...' : '提交重新生成'}
            </button>
            <button
              onClick={() => { setShowRejectInput(false); setRejectFeedback('') }}
              disabled={isSubmitting}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-500
                hover:bg-gray-50 disabled:opacity-50 transition-colors dark:border-gray-600
                dark:text-gray-400 dark:hover:bg-gray-700"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {/* 已通过的图片缩略图 */}
      {approvedImages.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium text-gray-400 dark:text-gray-500">
            已通过 ({approvedImages.length} 张)
          </p>
          <div className="flex flex-wrap gap-2">
            {xhsImages.map((img, i) =>
              img.status === 'approved' ? (
                <button
                  key={i}
                  onClick={() => setLightboxUrl(img.url)}
                  className="h-14 w-14 overflow-hidden rounded-lg border-2 border-green-300 opacity-70
                    hover:opacity-100 transition-opacity dark:border-green-700"
                >
                  <img src={img.url} alt={`已通过 ${i + 1}`} className="h-full w-full object-cover" />
                </button>
              ) : null
            )}
          </div>
        </div>
      )}

      {/* 图片放大灯箱 */}
      {lightboxUrl && (
        <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}
    </div>
  )
}
