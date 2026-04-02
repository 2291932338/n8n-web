/**
 * 任务历史记录组件
 * 列表展示历史任务，支持展开查看详情（文案/图片/视频/版本历史）
 */

import { useState } from 'react'

const PLATFORM_LABELS = {
  xiaohongshu: '小红书',
  douyin: '抖音',
}

const STATUS_LABELS = {
  submitting:            { text: '提交中',    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  processing:            { text: '处理中',    cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  waiting_user_feedback: { text: '待确认',    cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  revising:              { text: '修改中',    cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  frame_review:          { text: '逐帧审核',  cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  video_generating:      { text: '生成视频中', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300' },
  video_review:          { text: '视频待确认', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
  completed:             { text: '已完成',    cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  failed:                { text: '已失败',    cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
}

function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function copyText(text) {
  try {
    navigator.clipboard.writeText(text)
  } catch {
    const el = document.createElement('textarea')
    el.value = text
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
  }
}

function TaskDetailPanel({ task }) {
  const [copiedIdx, setCopiedIdx] = useState(null)

  const handleCopy = (text, idx) => {
    copyText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 1500)
  }

  return (
    <div className="mt-3 space-y-3 border-t border-gray-100 pt-3 dark:border-gray-700">
      {/* 表单参数 */}
      {task.formParams && Object.keys(task.formParams).length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">提交参数</p>
          <div className="rounded-md bg-gray-50 p-2 dark:bg-gray-800">
            {Object.entries(task.formParams).map(([k, v]) => (
              <div key={k} className="flex gap-1 text-xs">
                <span className="min-w-[5rem] text-gray-400 dark:text-gray-500">{k}:</span>
                <span className="text-gray-700 dark:text-gray-300 break-all">{String(v)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 版本历史 */}
      {task.previewHistory && task.previewHistory.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
            版本历史（{task.previewHistory.length} 个版本）
          </p>
          <div className="space-y-2">
            {task.previewHistory.map((v, idx) => (
              <div key={idx} className="rounded-md border border-gray-100 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {v.label} · {formatTime(v.timestamp)}
                  </span>
                  <button
                    onClick={() => handleCopy(v.text, idx)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {copiedIdx === idx ? '已复制' : '复制'}
                  </button>
                </div>
                {v.feedback && (
                  <p className="mb-1 text-xs text-orange-500 dark:text-orange-400">
                    修改意见：{v.feedback}
                  </p>
                )}
                <p className="text-xs text-gray-700 line-clamp-4 dark:text-gray-300">{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 最终预览图片 */}
      {task.preview?.images && task.preview.images.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
            图片（{task.preview.images.length} 张）
          </p>
          <div className="flex flex-wrap gap-1">
            {task.preview.images.map((url, i) => (
              <a key={i} href={url} target="_blank" rel="noreferrer">
                <img
                  src={url}
                  alt={`图片${i + 1}`}
                  className="h-16 w-16 rounded object-cover border border-gray-100 dark:border-gray-700"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 最终预览视频 */}
      {task.preview?.videos && task.preview.videos.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-semibold text-gray-400 dark:text-gray-500">
            视频（{task.preview.videos.length} 个）
          </p>
          <div className="space-y-1">
            {task.preview.videos.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                className="block truncate text-xs text-blue-500 underline hover:text-blue-700 dark:text-blue-400"
              >
                视频 {i + 1}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 错误信息 */}
      {task.errorMessage && (
        <div className="rounded-md bg-red-50 p-2 dark:bg-red-900/20">
          <p className="text-xs text-red-600 dark:text-red-400">错误：{task.errorMessage}</p>
        </div>
      )}
    </div>
  )
}

export default function TaskHistory({ tasks, onDelete, onClearAll }) {
  const [expandedId, setExpandedId] = useState(null)
  const [filterPlatform, setFilterPlatform] = useState('all')
  const [confirmClear, setConfirmClear] = useState(false)

  const filtered = filterPlatform === 'all'
    ? tasks
    : tasks.filter((t) => t.platform === filterPlatform)

  const handleToggle = (taskId) => {
    setExpandedId((prev) => (prev === taskId ? null : taskId))
  }

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 3000)
      return
    }
    onClearAll(filterPlatform === 'all' ? null : filterPlatform)
    setConfirmClear(false)
    setExpandedId(null)
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-600">
        <svg className="mb-3 h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm">暂无历史记录</p>
        <p className="mt-1 text-xs">已完成或失败的任务记录将保存在这里</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* 筛选 + 清空 */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-lg border border-gray-200 p-0.5 dark:border-gray-700">
          {['all', 'xiaohongshu', 'douyin'].map((p) => (
            <button
              key={p}
              onClick={() => setFilterPlatform(p)}
              className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                filterPlatform === p
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
              }`}
            >
              {p === 'all' ? '全部' : PLATFORM_LABELS[p]}
            </button>
          ))}
        </div>
        <button
          onClick={handleClear}
          className={`text-xs transition-colors ${
            confirmClear
              ? 'font-semibold text-red-500 hover:text-red-700'
              : 'text-gray-400 hover:text-red-500'
          }`}
        >
          {confirmClear ? '再次点击确认清空' : '清空'}
        </button>
      </div>

      {/* 任务列表 */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">该平台暂无记录</p>
        ) : (
          filtered.map((task) => {
            const statusInfo = STATUS_LABELS[task.status] || STATUS_LABELS.processing
            const isExpanded = expandedId === task.taskId
            const latestText = task.previewHistory?.length > 0
              ? task.previewHistory[task.previewHistory.length - 1].text
              : task.preview?.text || ''

            return (
              <div
                key={task.taskId}
                className="rounded-lg border border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800"
              >
                {/* 头部行 */}
                <div
                  className="flex cursor-pointer items-start gap-2 p-3"
                  onClick={() => handleToggle(task.taskId)}
                >
                  {/* 平台标签 */}
                  <span className="mt-0.5 shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                    {PLATFORM_LABELS[task.platform] || task.platform}
                  </span>

                  {/* 文案预览 + 时间 */}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-gray-700 line-clamp-2 dark:text-gray-300">
                      {latestText || task.statusMessage || task.errorMessage || '（无内容）'}
                    </p>
                    <p className="mt-1 text-[10px] text-gray-400">{formatTime(task.createdAt)}</p>
                  </div>

                  {/* 状态徽章 */}
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium ${statusInfo.cls}`}>
                    {statusInfo.text}
                  </span>

                  {/* 展开箭头 */}
                  <svg
                    className={`mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>

                {/* 展开详情 */}
                {isExpanded && (
                  <div className="border-t border-gray-50 px-3 pb-3 dark:border-gray-700">
                    <TaskDetailPanel task={task} />
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete(task.taskId)
                          if (expandedId === task.taskId) setExpandedId(null)
                        }}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        删除此记录
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
