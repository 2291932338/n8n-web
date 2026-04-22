import { getDefaultPlatformForGroup, getPlatformGroup, getPlatformLabel, PLATFORM_GROUPS } from '../platforms'

const GROUP_ICONS = {
  article: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 0 4 24V4.5A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  video: (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
}

export default function PlatformTabs({ value, onChange, disabled }) {
  const activeGroup = getPlatformGroup(value)

  const handleGroupChange = (group) => {
    if (disabled) return
    onChange(getDefaultPlatformForGroup(group))
  }

  const activePlatforms = PLATFORM_GROUPS[activeGroup]?.platforms || []

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-gray-100 p-1.5 dark:bg-gray-700/50">
        {Object.values(PLATFORM_GROUPS).map((group) => {
          const isActive = activeGroup === group.key
          return (
            <button
              key={group.key}
              type="button"
              onClick={() => handleGroupChange(group.key)}
              disabled={disabled}
              className={`rounded-xl px-4 py-3 text-left transition-all duration-200 disabled:cursor-not-allowed ${
                isActive
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-2 text-sm font-semibold">
                {GROUP_ICONS[group.key]}
                {group.label}
              </div>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-400">{group.description}</p>
            </button>
          )
        })}
      </div>

      <div className="rounded-2xl border border-gray-100 p-1.5 dark:border-gray-700">
        <div className="grid grid-cols-3 gap-2">
          {activePlatforms.map((platform) => {
            const isActive = value === platform
            return (
              <button
                key={platform}
                type="button"
                onClick={() => !disabled && onChange(platform)}
                disabled={disabled}
                className={`rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {getPlatformLabel(platform)}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
