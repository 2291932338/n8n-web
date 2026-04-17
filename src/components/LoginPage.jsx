import { useState } from 'react'

export default function LoginPage({ onLogin, isDark, onToggleDark }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await onLogin(email, password)
    } catch (err) {
      setError(err.message || '登录失败')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-full overflow-hidden bg-[#f4efe7] text-stone-950 dark:bg-[#101512] dark:text-stone-50">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-amber-300/30 blur-3xl dark:bg-emerald-700/20" />
        <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-sky-300/20 blur-3xl dark:bg-sky-700/10" />
        <div className="absolute bottom-[-120px] left-1/3 h-80 w-80 rounded-full bg-lime-300/20 blur-3xl dark:bg-lime-600/10" />
      </div>

      <div className="relative mx-auto flex min-h-full max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <section className="animate-fade-in">
            <div className="mb-6 inline-flex rounded-full border border-stone-300/80 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-stone-500 backdrop-blur dark:border-stone-700 dark:bg-white/5 dark:text-stone-400">
              WorkflowStudio Private Access
            </div>
            <h1 className="max-w-2xl text-5xl font-black leading-[0.95] tracking-tight text-stone-950 dark:text-white md:text-7xl">
              登录后开始你的内容工作流
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-stone-600 dark:text-stone-300">
              这个版本会把使用记录绑定到账号，后续管理员可以看到每个账号的调用次数、成功次数和失败次数。
            </p>
            <div className="mt-8 grid max-w-xl gap-3 text-sm text-stone-600 dark:text-stone-300 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-300/70 bg-white/50 p-4 backdrop-blur dark:border-stone-700 dark:bg-white/5">
                <div className="text-2xl font-black text-stone-950 dark:text-white">01</div>
                <div className="mt-1">账号隔离</div>
              </div>
              <div className="rounded-2xl border border-stone-300/70 bg-white/50 p-4 backdrop-blur dark:border-stone-700 dark:bg-white/5">
                <div className="text-2xl font-black text-stone-950 dark:text-white">02</div>
                <div className="mt-1">管理员统计</div>
              </div>
              <div className="rounded-2xl border border-stone-300/70 bg-white/50 p-4 backdrop-blur dark:border-stone-700 dark:bg-white/5">
                <div className="text-2xl font-black text-stone-950 dark:text-white">03</div>
                <div className="mt-1">后端代理</div>
              </div>
            </div>
          </section>

          <section className="animate-slide-up rounded-[2rem] border border-stone-200 bg-white/85 p-6 shadow-2xl shadow-stone-300/40 backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/80 dark:shadow-black/30 md:p-8">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-stone-950 dark:text-white">账号登录</h2>
                <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">使用管理员创建的邮箱和密码登录。</p>
              </div>
              <button
                type="button"
                onClick={onToggleDark}
                className="rounded-full border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-500 transition hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                {isDark ? '浅色' : '深色'}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">邮箱</span>
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  autoComplete="email"
                  required
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900 focus:ring-4 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-white dark:focus:ring-stone-700"
                  placeholder="admin@example.com"
                />
              </label>

              <label className="block">
                <span className="text-sm font-semibold text-stone-700 dark:text-stone-200">密码</span>
                <input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  autoComplete="current-password"
                  required
                  className="mt-2 w-full rounded-2xl border border-stone-200 bg-white px-4 py-3 text-stone-900 outline-none transition focus:border-stone-900 focus:ring-4 focus:ring-stone-200 dark:border-stone-700 dark:bg-stone-900 dark:text-white dark:focus:border-white dark:focus:ring-stone-700"
                  placeholder="请输入密码"
                />
              </label>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-stone-950 px-5 py-3 text-sm font-black text-white transition hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-stone-950"
              >
                {isSubmitting ? '登录中...' : '进入工作台'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  )
}
