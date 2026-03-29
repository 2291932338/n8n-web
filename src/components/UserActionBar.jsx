/**
 * 用户交互区
 * 修改意见输入 + 提交修改 / 确认继续按钮
 */

import { useState } from 'react'

export default function UserActionBar({
  onRevise,
  onConfirm,
  allowRevise,
  allowConfirm,
  isSubmitting,
}) {
  const [feedback, setFeedback] = useState('')

  const handleRevise = () => {
    if (!feedback.trim()) return
    onRevise(feedback.trim())
    setFeedback('')
  }

  const handleConfirm = () => {
    onConfirm()
    setFeedback('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && feedback.trim()) {
      e.preventDefault()
      handleRevise()
    }
  }

  return (
    <div className="border-t border-gray-100 bg-white/80 backdrop-blur-sm pt-4 dark:border-gray-700 dark:bg-gray-900/80">
      {/* 输入区 */}
      <div className="relative mb-3">
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入修改意见...（Enter 发送，Shift+Enter 换行）"
          rows={2}
          disabled={isSubmitting || (!allowRevise && !allowConfirm)}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pr-12 text-sm
            placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none transition-all duration-200
            dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100 dark:placeholder:text-gray-500
            dark:focus:ring-primary-400/30 dark:focus:border-primary-400"
        />
      </div>

      {/* 按钮区 */}
      <div className="flex gap-3">
        <button
          onClick={handleRevise}
          disabled={isSubmitting || !allowRevise || !feedback.trim()}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-primary-600 px-4 py-2.5
            text-sm font-semibold text-primary-600
            hover:bg-primary-50
            active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent
            transition-all duration-200
            dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20"
        >
          {isSubmitting ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          )}
          提交修改
        </button>

        <button
          onClick={handleConfirm}
          disabled={isSubmitting || !allowConfirm}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5
            text-sm font-semibold text-white shadow-lg shadow-green-600/25
            hover:bg-green-700
            active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-green-600
            transition-all duration-200
            dark:bg-green-500 dark:hover:bg-green-600 dark:shadow-green-500/20"
        >
          {isSubmitting ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
          确认继续
        </button>
      </div>
    </div>
  )
}
