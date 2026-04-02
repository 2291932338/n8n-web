/**
 * 任务状态动画指示器
 * 根据 taskStatus 渲染不同颜色和动画的圆点
 */

const DOT_CONFIG = {
  submitting:             { color: 'bg-blue-400',   anim: 'animate-ping-slow',  ring: 'bg-blue-200 dark:bg-blue-800' },
  processing:             { color: 'bg-yellow-400', anim: 'animate-spin-slow',  ring: null, spin: true },
  revising:               { color: 'bg-orange-400', anim: 'animate-ping-slow',  ring: 'bg-orange-200 dark:bg-orange-800' },
  video_generating:       { color: 'bg-yellow-400', anim: 'animate-ping-slow',  ring: 'bg-yellow-200 dark:bg-yellow-800' },
  waiting_user_feedback:  { color: 'bg-purple-500', anim: 'animate-blink',      ring: null },
  frame_review:           { color: 'bg-purple-500', anim: 'animate-blink',      ring: null },
  video_review:           { color: 'bg-purple-500', anim: 'animate-blink',      ring: null },
  completed:              { color: 'bg-green-500',  anim: '',                   ring: null },
  failed:                 { color: 'bg-red-500',    anim: '',                   ring: null },
}

export default function TaskStatusDot({ status, size = 'sm' }) {
  const cfg = DOT_CONFIG[status] || { color: 'bg-gray-400', anim: '', ring: null }
  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5'

  // ping 动画：相对容器 + 外圈 + 内点
  if (cfg.ring) {
    return (
      <span className="relative inline-flex items-center justify-center" style={{ width: 14, height: 14 }}>
        <span className={`absolute inline-flex rounded-full ${cfg.ring} ${cfg.anim}`}
          style={{ width: 14, height: 14 }} />
        <span className={`relative inline-flex rounded-full ${dotSize} ${cfg.color}`} />
      </span>
    )
  }

  // spin 动画（processing）：小圆弧 spinner
  if (status === 'processing' || status === 'submitting') {
    return (
      <span className={`inline-block ${dotSize} animate-spin-slow rounded-full border-2 border-yellow-200 border-t-yellow-500 dark:border-yellow-800 dark:border-t-yellow-400`} />
    )
  }

  // blink 动画（需要用户操作）
  if (cfg.anim === 'animate-blink') {
    return (
      <span className={`inline-block ${dotSize} rounded-full ${cfg.color} ${cfg.anim}`} />
    )
  }

  // 静态点（completed / failed）
  return (
    <span className={`inline-block ${dotSize} rounded-full ${cfg.color}`} />
  )
}
