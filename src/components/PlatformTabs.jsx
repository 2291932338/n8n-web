/**
 * 平台切换选项卡 (Segmented Control)
 */

const platforms = [
  {
    key: 'xiaohongshu',
    label: '小红书',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    description: '图文笔记 + 配图',
  },
  {
    key: 'douyin',
    label: '抖音',
    icon: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18V5l12-2v13" />
        <circle cx="6" cy="18" r="3" />
        <circle cx="18" cy="16" r="3" />
      </svg>
    ),
    description: '短视频脚本 + 分镜',
  },
]

export default function PlatformTabs({ value, onChange, disabled }) {
  return (
    <div className="flex gap-2 rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-700/50">
      {platforms.map((p) => {
        const isActive = value === p.key
        return (
          <button
            key={p.key}
            type="button"
            onClick={() => !disabled && onChange(p.key)}
            disabled={disabled}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium
              transition-all duration-200 disabled:cursor-not-allowed
              ${isActive
                ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            title={p.description}
          >
            {p.icon}
            {p.label}
          </button>
        )
      })}
    </div>
  )
}
