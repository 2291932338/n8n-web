/**
 * 抖音分镜文档审核组件（批量模式）
 * 以卡片形式展示每个分镜场景，支持确认/修改操作
 */

import { useEffect, useRef, useState } from 'react'

const SCENE_FIELDS = [
  { key: 'title', label: '标题', type: 'input' },
  { key: 'duration', label: '时长', type: 'input' },
  { key: 'cameraAngle', label: '镜头', type: 'textarea' },
  { key: 'visualDescription', label: '画面', type: 'textarea' },
  { key: 'narration', label: '旁白', type: 'textarea' },
  { key: 'subtitle', label: '字幕', type: 'textarea' },
  { key: 'transition', label: '转场', type: 'textarea' },
  { key: 'bgm', label: 'BGM', type: 'textarea' },
  { key: 'notes', label: '备注', type: 'textarea' },
]

function FieldEditor({ field, value, onChange, disabled }) {
  const baseClass = `w-full rounded-lg border border-violet-100 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition
    focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60
    dark:border-violet-800 dark:bg-gray-900/70 dark:text-gray-200 dark:focus:border-violet-500`

  if (field.type === 'input') {
    return (
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={baseClass}
      />
    )
  }

  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={2}
      className={`${baseClass} min-h-[70px] resize-y leading-relaxed`}
    />
  )
}

function SceneCard({ scene, index, onSceneChange, isActionSubmitting, allowEdit }) {
  const [expanded, setExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const displayFields = SCENE_FIELDS.filter((field) => (
    !['title', 'duration'].includes(field.key) && scene[field.key]
  ))

  useEffect(() => {
    if (!allowEdit) setIsEditing(false)
  }, [allowEdit])

  return (
    <div className="rounded-xl border border-violet-100 bg-white overflow-hidden dark:border-violet-800 dark:bg-gray-800">
      <div className="flex items-center justify-between px-4 py-3 hover:bg-violet-50/50 dark:hover:bg-violet-900/20 transition-colors">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="min-w-0 flex flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-violet-100
            text-xs font-bold text-violet-600 dark:bg-violet-900/40 dark:text-violet-400">
            {index + 1}
          </span>
          <div className="min-w-0">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {scene.title || `场景 ${index + 1}`}
            </span>
            {scene.duration && (
              <span className="ml-2 text-xs text-gray-400">({scene.duration})</span>
            )}
          </div>
        </button>
        <div className="flex items-center gap-2">
          {allowEdit && (
            <button
              type="button"
              onClick={() => {
                setIsEditing((editing) => !editing)
                if (!expanded) setExpanded(true)
              }}
              className={`rounded-lg border px-2.5 py-1 text-xs font-medium transition ${
                isEditing
                  ? 'border-violet-300 bg-violet-100 text-violet-700 dark:border-violet-700 dark:bg-violet-900/40 dark:text-violet-300'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-violet-200 hover:text-violet-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:hover:text-violet-300'
              }`}
            >
              {isEditing ? '完成' : '编辑'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="rounded-lg p-1 text-gray-400 hover:bg-white hover:text-gray-600 dark:hover:bg-gray-900 dark:hover:text-gray-300"
            aria-label={expanded ? '收起分镜' : '展开分镜'}
          >
            <svg
              className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-violet-50 px-4 py-3 dark:border-violet-800/50">
          {allowEdit && isEditing ? (
            <div className="space-y-3">
              {SCENE_FIELDS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-400 dark:text-gray-500">
                    {field.label}
                  </label>
                  <FieldEditor
                    field={field}
                    value={scene[field.key]}
                    disabled={isActionSubmitting}
                    onChange={(value) => onSceneChange(index, field.key, value)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {displayFields.length > 0 ? displayFields.map((field) => (
                <div key={field.key} className="flex gap-2">
                  <span className="w-16 flex-shrink-0 text-xs font-medium text-gray-400 dark:text-gray-500">
                    {field.label}
                  </span>
                  <span className={`text-sm ${field.key === 'notes' ? 'text-gray-500 italic dark:text-gray-400' : 'text-gray-600 dark:text-gray-300'}`}>
                    {scene[field.key]}
                  </span>
                </div>
              )) : (
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  暂无分镜内容，点击编辑补充。
                </p>
              )}
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

function resizeTextareaToContent(element) {
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${element.scrollHeight}px`
}

function serializeStoryboard(originalDocument, scenes) {
  if (Array.isArray(originalDocument)) {
    return JSON.stringify(scenes, null, 2)
  }

  if (originalDocument && typeof originalDocument === 'object') {
    return JSON.stringify({ ...originalDocument, scenes }, null, 2)
  }

  return JSON.stringify({ scenes }, null, 2)
}

export default function DouyinStoryboardReview({
  storyboardDocument,
  previewText,
  editableText,
  isDirty,
  allowEdit = true,
  onEditableTextChange,
  onEditableTextBlur,
  isActionSubmitting,
}) {
  const [copied, setCopied] = useState(false)
  const editableTextareaRef = useRef(null)

  const editableParsed = parseStoryboard(editableText)
  const storyboardParsed = parseStoryboard(storyboardDocument)
  const parsed = editableParsed?.scenes?.length > 0 ? editableParsed : (storyboardParsed || editableParsed)
  const hasScenes = parsed && parsed.scenes.length > 0
  const rawText = parsed?.raw || previewText || (typeof storyboardDocument === 'string' ? storyboardDocument : '')
  const hasEditableText = typeof editableText === 'string'
  const [editableScenes, setEditableScenes] = useState(parsed?.scenes || [])

  useEffect(() => {
    resizeTextareaToContent(editableTextareaRef.current)
  }, [editableText])

  useEffect(() => {
    setEditableScenes(parsed?.scenes || [])
  }, [editableText, storyboardDocument, previewText])

  const handleSceneChange = (sceneIndex, fieldKey, value) => {
    setEditableScenes((currentScenes) => {
      const nextScenes = currentScenes.map((scene, index) => (
        index === sceneIndex ? { ...scene, [fieldKey]: value } : scene
      ))
      onEditableTextChange?.(serializeStoryboard(storyboardDocument, nextScenes))
      return nextScenes
    })
  }

  const handleCopy = () => {
    const text = hasScenes
      ? serializeStoryboard(storyboardDocument, editableScenes)
      : (hasEditableText ? editableText : (rawText || JSON.stringify(parsed?.scenes, null, 2)))
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
            共 {parsed.scenes.length} 个分镜场景，{allowEdit ? '可直接编辑卡片或提出修改意见' : '正在按确认后的分镜生成素材'}
          </p>
        )}
      </div>

      {hasEditableText && !hasScenes && (
        <div className="rounded-2xl border border-violet-100 bg-white p-4 dark:border-violet-800 dark:bg-gray-800">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-violet-600 dark:text-violet-400">
              可编辑分镜文档
            </h4>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {isDirty ? '已手动修改' : '点击下方内容即可修改'}
            </span>
          </div>
          <textarea
            ref={editableTextareaRef}
            value={editableText}
            onChange={(e) => onEditableTextChange?.(e.target.value)}
            onBlur={onEditableTextBlur}
            disabled={isActionSubmitting}
            aria-label="编辑当前分镜初稿"
            className="min-h-[360px] w-full resize-none overflow-hidden rounded-xl border border-violet-100 bg-violet-50/30 px-4 py-3 text-sm leading-relaxed text-gray-700 outline-none transition
              focus:border-violet-300 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-60
              dark:border-violet-800 dark:bg-gray-900/60 dark:text-gray-200 dark:focus:border-violet-500"
          />
          <p className={`mt-2 text-xs ${isDirty ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500'}`}>
            {isDirty ? '确认后会把当前编辑后的分镜文档发给 n8n 继续生成素材。' : '下方卡片是结构化速览，最终以此编辑框中的内容为准。'}
          </p>
        </div>
      )}

      {/* 结构化场景卡片 */}
      {hasScenes && (
        <div className="space-y-3">
          {editableScenes.map((scene, i) => (
            <SceneCard
              key={i}
              scene={scene}
              index={i}
              allowEdit={allowEdit}
              isActionSubmitting={isActionSubmitting}
              onSceneChange={handleSceneChange}
            />
          ))}
        </div>
      )}

      {/* 纯文本展示（非结构化时 fallback） */}
      {!hasEditableText && !hasScenes && rawText && (
        <div className="rounded-2xl border border-violet-100 bg-white p-4 dark:border-violet-800 dark:bg-gray-800">
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-gray-300 max-h-96 overflow-y-auto">
            {rawText}
          </div>
        </div>
      )}

      {/* 提示 */}
      <p className="text-xs text-gray-400 dark:text-gray-500">
        {allowEdit ? '请直接在每个分镜卡片里修改内容。确认后系统将根据修改后的结构化分镜批量生成配图、配音和字幕文件。' : '当前为已确认分镜预览，素材生成中不可编辑。'}
      </p>
    </div>
  )
}
