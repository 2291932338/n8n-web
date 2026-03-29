/**
 * 加载动画组件
 */

export default function LoadingSpinner({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
      {/* 动画圆环 */}
      <div className="relative h-16 w-16 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-gray-100 dark:border-gray-700" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary-300 animate-spin"
          style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}
        />
      </div>

      {/* 文字 */}
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs">
          {message}
        </p>
      )}

      {/* 提示 */}
      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        请耐心等待，AI 正在努力工作...
      </p>
    </div>
  )
}
