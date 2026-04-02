/**
 * 状态指示器
 * 显示当前工作流步骤和进度
 */

const statusConfig = {
  idle: {
    color: 'text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-700',
    dot: 'bg-gray-400',
    label: '等待开始',
  },
  submitting: {
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    dot: 'bg-blue-500 animate-pulse',
    label: '正在提交...',
  },
  processing: {
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    dot: 'bg-amber-500 animate-pulse',
    label: '处理中',
  },
  waiting_user_feedback: {
    color: 'text-purple-600 dark:text-purple-400',
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    dot: 'bg-purple-500 animate-pulse-slow',
    label: '等待确认',
  },
  revising: {
    color: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    dot: 'bg-indigo-500 animate-pulse',
    label: '正在修改...',
  },
  frame_review: {
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-900/20',
    dot: 'bg-violet-500 animate-pulse-slow',
    label: '分镜审核',
  },
  video_generating: {
    color: 'text-cyan-600 dark:text-cyan-400',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    dot: 'bg-cyan-500 animate-pulse',
    label: '视频生成中',
  },
  video_review: {
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    dot: 'bg-teal-500 animate-pulse-slow',
    label: '视频审核',
  },
  completed: {
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    dot: 'bg-green-500',
    label: '已完成',
  },
  failed: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    dot: 'bg-red-500',
    label: '失败',
  },
}

const stepNames = {
  generating: '生成内容',
  draft: '初稿预览',
  image_preview: '配图预览',
  image_regen: '重新生成配图',
  video_preview: '视频预览',
  revising: '修改优化',
  finalizing: '生成终稿',
  final: '最终版本',
  // 抖音专属
  douyin_draft: '分镜稿件',
  douyin_frame_generating: '生成分镜图片',
  douyin_frame_review: '分镜图片审核',
  douyin_video_generating: '视频合成中',
  douyin_video_review: '视频审核',
}

export default function StatusIndicator({ status, stepName, message }) {
  const cfg = statusConfig[status] || statusConfig.idle
  const step = stepNames[stepName] || stepName || ''

  return (
    <div className={`flex items-center gap-3 rounded-xl ${cfg.bg} px-4 py-3`}>
      <span className={`h-2.5 w-2.5 rounded-full ${cfg.dot} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
          {step && (
            <>
              <span className="text-gray-300 dark:text-gray-600">·</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{step}</span>
            </>
          )}
        </div>
        {message && (
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">{message}</p>
        )}
      </div>
    </div>
  )
}
