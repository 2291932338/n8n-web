/**
 * 消息流组件
 * 展示工作流历史交互记录，类似聊天界面
 */

import { useRef, useEffect } from 'react'
import PreviewContent from './PreviewContent'

function MessageBubble({ message, isCompleted }) {
  const isUser = message.role === 'user'
  const isPreview = message.type === 'preview'

  // 尝试解析 preview 类型的 content
  let previewData = null
  if (isPreview) {
    try {
      previewData = JSON.parse(message.content)
    } catch {
      previewData = null
    }
  }

  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className={`flex gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : ''}`}>
      {/* 头像 */}
      <div className={`flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold
        ${isUser
          ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300'
          : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
        }`}
      >
        {isUser ? '你' : 'AI'}
      </div>

      {/* 内容 */}
      <div className={`flex-1 max-w-[85%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed
          ${isUser
            ? 'bg-primary-600 text-white dark:bg-primary-500 rounded-tr-md'
            : 'bg-white border border-gray-100 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 rounded-tl-md'
          }
          ${isPreview ? 'w-full' : ''}
        `}>
          {isPreview && previewData ? (
            <PreviewContent preview={previewData} isCompleted={isCompleted} />
          ) : (
            <span className="whitespace-pre-wrap">{message.content}</span>
          )}
        </div>
        {time && (
          <p className={`mt-1 text-xs text-gray-400 dark:text-gray-500 ${isUser ? 'text-right' : ''}`}>
            {time}
          </p>
        )}
      </div>
    </div>
  )
}

export default function MessageStream({ history, isCompleted }) {
  const bottomRef = useRef(null)

  // 新消息自动滚动到底部
  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [history?.length])

  if (!history || history.length === 0) return null

  return (
    <div className="space-y-4">
      {history.map((msg, idx) => (
        <MessageBubble key={idx} message={msg} isCompleted={isCompleted} />
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
