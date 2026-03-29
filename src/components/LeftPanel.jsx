/**
 * 左侧面板
 * 包含平台选择、表单填写
 */

import PlatformTabs from './PlatformTabs'
import DynamicForm from './DynamicForm'
import { getSchemaByPlatform } from '../formSchema'

export default function LeftPanel({ platform, onPlatformChange, onSubmit, isSubmitting, taskStatus }) {
  const schema = getSchemaByPlatform(platform)
  const isDisabled = isSubmitting || taskStatus === 'processing' || taskStatus === 'revising'

  return (
    <div className="flex h-full flex-col">
      {/* 平台选择 */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          选择平台
        </h2>
        <PlatformTabs
          value={platform}
          onChange={onPlatformChange}
          disabled={isDisabled}
        />
      </div>

      {/* 分割线 */}
      <div className="mb-6 h-px bg-gray-100 dark:bg-gray-700" />

      {/* 表单区域 */}
      <div className="flex-1 overflow-y-auto pr-1 -mr-1">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          内容参数
        </h2>
        <DynamicForm
          key={platform}
          schema={schema}
          platform={platform}
          onSubmit={onSubmit}
          isSubmitting={isDisabled}
        />
      </div>
    </div>
  )
}
