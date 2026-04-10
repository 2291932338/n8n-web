/**
 * 抖音分镜文档审核组件（批量模式）
 * 以卡片形式展示每个分镜场景，支持确认/修改操作
 */

import { useState } from 'react'

function SceneCard({ scene, index }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-xl border border-violet-100 bg-white overflow-hidden dark:border-violet-800 dark:bg-gray-800">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-violet-50/50
          dark:hover:bg-violet-900/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100
            text-xs font-bold text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
            {index + 1}
          </span>
          <div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {scene.title || `场景 ${index + 1}`}
            </span>
            {scene.duration && (
              <span className="ml-2 text-xs text-gray-400">({scene.duration})</span>
            )}
          </div>
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-violet-50 px-4 py-3 space-y-2 dark:border-violet-800/50">
          {scene.cameraAngle && (
            <div className="flex gap-2">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">镜头</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{scene.cameraAngle}</span>
            </div>
          )}
          {scene.visualDescription && (
            <div className="flex gap-2">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">画面</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{scene.visualDescription}</span>
            </div>
          )}
          {scene.narration && (
            <div className="flex gap-2">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">旁白</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{scene.narration}</span>
            </div>
          )}
          {scene.subtitle && (
            <div className="flex gap-2">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">字幕</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{scene.subtitle}</span>
            </div>
          )}
          {scene.transition && (
            <div className="flex gap-2">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">转场</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{scene.transition}</span>
            </div>
          )}
          {scene.bgm && (
            <div className="flex gap-2">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">BGM</span>
              <span className="text-sm text-gray-600 dark:text-gray-300">{scene.bgm}</span>
            </div>
          )}
          {scene.notes && (
            <div className="flex gap-2">
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 w-16 flex-shrink-0">备注</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 italic">{scene.notes}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * 尝试解析分镜文档为结构化数据
 * 支持 JSON 格式和纯文本格式
 */
function parseStoryboard(doc) {
  if (!doc) return null

  // 如果是对象或数组，直接返回
  if (typeof doc === 'object') {
    return { scenes: Array.isArray(doc) ? doc : (doc.scenes || [doc]), raw: null }
  }

  // 尝试解析 JSON
  try {
    const parsed = JSON.parse(doc)
    const scenes = Array.isArray(parsed) ? parsed : (parsed.scenes || [parsed])
    return { scenes, raw: null }
  } catch {
    // 非 JSON，作为纯文本返回
    return { scenes: [], raw: doc }
  }
}

export default function DouyinStoryboardReview({
  storyboardDocument,
  previewText,
  isActionSubmitting,
}) {
  const [copied, setCopied] = useState(false)

  const parsed = parseStoryboard(storyboardDocument)
  const hasScenes = parsed && parsed.scenes.length > 0
  const rawText = parsed?.raw || previewText || (typeof storyboardDocument === 'string' ? storyboardDocument : '')

  const handleCopy = () => {
    const text = rawText || JSON.stringify(parsed?.scenes, null, 2)
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
    <div className="space-y-4">
      {/* 标题栏 */}
      <div className="rounded-2xl border-2 border-violet-200 bg-violet-50/50 p-4 dark:border-violet-800 dark:bg-violet-900/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="18" rx="2" />
              <line x1="8" y1="7" x2="16" y2="7" />
              <line x1="8" y1="11" x2="16" y2="11" />
              <line x1="8" y1="15" x2="12" y2="15" />
            </svg>
            <h3 className="text-sm font-semibold text-violet-700 dark:text-violet-400">
              分镜文档预览
            </h3>
          </div>
          <button
            onClick={handleCopy}
            disabled={isActionSubmitting}
            className="flex items-center gap-1.5 rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-medium
              text-violet-500 hover:bg-white hover:text-violet-700 hover:border-violet-300 transition-all
              dark:border-violet-700 dark:text-violet-400 dark:hover:bg-violet-900/30"
          >
            {copied ? '已复制' : (
              <>
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
                复制文档
              </>
            )}
          </button>
        </div>

        {hasScenes && (
          <p className="text-xs text-violet-500 dark:text-violet-400">
            共 {parsed.scenes.length} 个分镜场景，请审核后确认或提出修改意见
          </p>
        )}
      </div>

      {/* 结构化场景卡片 */}
      {hasScenes && (
        <div className="space-y-3">
          {parsed.scenes.map((scene, i) => (
            <SceneCard key={i} scene={scene} index={i} />
          ))}
        </div>
      )}

      {/* 纯文本展示（非结构化时 fallback） */}
      {!hasScenes && rawText && (
        <div className="rounded-2xl border border-violet-100 bg-white p-4 dark:border-violet-800 dark:bg-gray-800">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300 max-h-96 overflow-y-auto">
            {rawText}
          </div>
        </div>
      )}

      {/* 提示 */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        请仔细审核分镜文档内容。确认后系统将根据分镜内容批量生成配图、配音和字幕文件。
      </p>
    </div>
  )
}
