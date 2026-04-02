/**
 * 小红书：重新生成图片按钮
 * 在文案已确认后显示，让用户一键用当前文案重新生成配图
 */

import { useState } from 'react'

export default function RegenerateImagesButton({ onRegenImages, isSubmitting }) {
  const [clicked, setClicked] = useState(false)

  const handleClick = async () => {
    setClicked(true)
    try {
      await onRegenImages()
    } finally {
      setClicked(false)
    }
  }

  const busy = isSubmitting || clicked

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className="flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5
        text-sm font-medium text-orange-600 transition-all
        hover:bg-orange-100 hover:border-orange-300
        disabled:opacity-50 disabled:cursor-not-allowed
        dark:border-orange-800 dark:bg-orange-900/20 dark:text-orange-400
        dark:hover:bg-orange-900/40"
    >
      {busy ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12a9 9 0 11-6.219-8.56" />
          </svg>
          重新生成图片中...
        </>
      ) : (
        <>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          重新生成图片
        </>
      )}
    </button>
  )
}
