/**
 * 预览内容渲染组件
 * 负责渲染文本、图片网格、视频播放器
 */

import { useState } from 'react'
import ImageLightbox from './ImageLightbox'

export default function PreviewContent({ preview, isCompleted }) {
  const [lightboxImage, setLightboxImage] = useState(null)
  const [copiedText, setCopiedText] = useState(false)

  if (!preview) return null

  const { text, images, videos } = preview

  const handleCopyText = async () => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = text
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopiedText(true)
      setTimeout(() => setCopiedText(false), 2000)
    }
  }

  return (
    <div className="space-y-6 animate-slide-up">
      {/* 文本内容 */}
      {text && (
        <div className="rounded-2xl border border-gray-100 bg-gray-50/50 p-5 dark:border-gray-700 dark:bg-gray-800/50">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {isCompleted ? '最终文案' : '文案预览'}
            </h4>
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium
                text-gray-500 hover:bg-white hover:text-gray-700 hover:border-gray-300 transition-all
                dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              {copiedText ? (
                <>
                  <svg className="h-3.5 w-3.5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                  已复制
                </>
              ) : (
                <>
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                  复制文案
                </>
              )}
            </button>
          </div>
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300">
            {text}
          </div>
        </div>
      )}

      {/* 图片网格 */}
      {images && images.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              配图预览 ({images.length})
            </h4>
            <button
              onClick={async () => {
                for (let i = 0; i < images.length; i++) {
                  try {
                    const res = await fetch(images[i])
                    const blob = await res.blob()
                    const ext = blob.type.split('/')[1] || 'jpg'
                    const blobUrl = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = blobUrl
                    a.download = `image_${i + 1}.${ext}`
                    a.click()
                    URL.revokeObjectURL(blobUrl)
                    if (i < images.length - 1) await new Promise(r => setTimeout(r, 500))
                  } catch {
                    window.open(images[i], '_blank')
                  }
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium
                text-gray-500 hover:bg-white hover:text-gray-700 hover:border-gray-300 transition-all
                dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              下载全部
            </button>
          </div>
          <div className={`grid gap-3 ${
            images.length === 1 ? 'grid-cols-1' :
            images.length === 2 ? 'grid-cols-2' :
            'grid-cols-2 lg:grid-cols-3'
          }`}>
            {images.map((url, idx) => (
              <div
                key={idx}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-gray-100
                  bg-gray-50 aspect-[4/5] dark:border-gray-700 dark:bg-gray-800"
                onClick={() => setLightboxImage(url)}
              >
                <img
                  src={url}
                  alt={`配图 ${idx + 1}`}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-300">
                  <svg className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 视频播放器 */}
      {videos && videos.length > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              视频预览
            </h4>
            <button
              onClick={async () => {
                for (let i = 0; i < videos.length; i++) {
                  try {
                    const res = await fetch(videos[i])
                    const blob = await res.blob()
                    const blobUrl = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = blobUrl
                    a.download = `video_${i + 1}.mp4`
                    a.click()
                    URL.revokeObjectURL(blobUrl)
                    if (i < videos.length - 1) await new Promise(r => setTimeout(r, 500))
                  } catch {
                    window.open(videos[i], '_blank')
                  }
                }
              }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium
                text-gray-500 hover:bg-white hover:text-gray-700 hover:border-gray-300 transition-all
                dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              下载视频
            </button>
          </div>
          <div className="space-y-3">
            {videos.map((url, idx) => (
              <div key={idx} className="overflow-hidden rounded-xl border border-gray-100 bg-black dark:border-gray-700">
                <video
                  controls
                  preload="metadata"
                  className="w-full"
                  style={{ maxHeight: '400px' }}
                >
                  <source src={url} type="video/mp4" />
                  您的浏览器不支持视频播放
                </video>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 图片灯箱 */}
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  )
}
