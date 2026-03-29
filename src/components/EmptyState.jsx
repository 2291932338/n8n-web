/**
 * 空状态组件
 */

export default function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center py-20 animate-fade-in">
      {/* 图标 */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-50 dark:bg-gray-800">
        <svg className="h-10 w-10 text-gray-300 dark:text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>

      {/* 标题 */}
      <h3 className="mb-2 text-lg font-semibold text-gray-700 dark:text-gray-300">
        准备就绪
      </h3>

      {/* 描述 */}
      <p className="mb-6 max-w-sm text-center text-sm leading-relaxed text-gray-400 dark:text-gray-500">
        在左侧选择平台并填写参数，点击「开始生成」即可启动 AI 工作流。
        生成的内容将在这里实时展示。
      </p>

      {/* 步骤提示 */}
      <div className="flex flex-col gap-3 text-sm text-gray-400 dark:text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">1</span>
          <span>选择平台（小红书 / 抖音）</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">2</span>
          <span>填写内容参数</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">3</span>
          <span>预览、修改、确认</span>
        </div>
      </div>
    </div>
  )
}
