import { useEffect, useState } from 'react'
import { createAdminUser, getAdminOverview, getAdminTasks, getAdminUsers, updateUserStatus } from '../authApi'

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</div>
      <div className="mt-2 text-3xl font-black text-gray-950 dark:text-white">{value}</div>
    </div>
  )
}

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [tasks, setTasks] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ email: '', password: '', role: 'USER' })
  const [isCreating, setIsCreating] = useState(false)

  const loadData = async () => {
    setError('')
    setIsLoading(true)
    try {
      const [overviewResult, usersResult, tasksResult] = await Promise.all([
        getAdminOverview(),
        getAdminUsers(),
        getAdminTasks(50),
      ])
      setOverview(overviewResult.overview)
      setUsers(usersResult.users || [])
      setTasks(tasksResult.tasks || [])
    } catch (err) {
      setError(err.message || '加载管理员数据失败')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleCreate = async (event) => {
    event.preventDefault()
    setIsCreating(true)
    setError('')
    try {
      await createAdminUser(form)
      setForm({ email: '', password: '', role: 'USER' })
      await loadData()
    } catch (err) {
      setError(err.message || '创建用户失败')
    } finally {
      setIsCreating(false)
    }
  }

  const toggleUser = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
    await updateUserStatus(user.id, nextStatus)
    await loadData()
  }

  if (isLoading) {
    return <div className="p-8 text-sm text-gray-500 dark:text-gray-400">正在加载管理员面板...</div>
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50 p-6 dark:bg-gray-950">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-400">Admin Console</p>
          <h2 className="mt-2 text-3xl font-black text-gray-950 dark:text-white">管理员面板</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">查看账号使用情况，创建内部用户，观察任务成功和失败数量。</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          <StatCard label="总用户" value={overview?.totalUsers || 0} />
          <StatCard label="活跃用户" value={overview?.activeUsers || 0} />
          <StatCard label="总调用" value={overview?.totalTasks || 0} />
          <StatCard label="成功" value={overview?.completedTasks || 0} />
          <StatCard label="失败" value={overview?.failedTasks || 0} />
          <StatCard label="处理中" value={overview?.processingTasks || 0} />
        </div>

        <form onSubmit={handleCreate} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-black text-gray-950 dark:text-white">创建用户</h3>
            <span className="text-xs text-gray-400">仅管理员可见</span>
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
            <input
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              type="email"
              required
              placeholder="用户邮箱"
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
            <input
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              type="text"
              required
              minLength={8}
              placeholder="初始密码，至少 8 位"
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            />
            <select
              value={form.role}
              onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm outline-none focus:border-gray-900 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
            >
              <option value="USER">普通用户</option>
              <option value="ADMIN">管理员</option>
            </select>
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-xl bg-gray-950 px-5 py-2 text-sm font-bold text-white disabled:opacity-60 dark:bg-white dark:text-gray-950"
            >
              {isCreating ? '创建中' : '创建'}
            </button>
          </div>
        </form>

        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h3 className="text-lg font-black text-gray-950 dark:text-white">用户使用情况</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 text-sm dark:divide-gray-800">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-400 dark:bg-gray-950/50">
                <tr>
                  <th className="px-5 py-3">邮箱</th>
                  <th className="px-5 py-3">角色</th>
                  <th className="px-5 py-3">状态</th>
                  <th className="px-5 py-3">总调用</th>
                  <th className="px-5 py-3">成功</th>
                  <th className="px-5 py-3">失败</th>
                  <th className="px-5 py-3">最近使用</th>
                  <th className="px-5 py-3">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {users.map((user) => (
                  <tr key={user.id} className="text-gray-700 dark:text-gray-200">
                    <td className="px-5 py-3 font-semibold">{user.email}</td>
                    <td className="px-5 py-3">{user.role === 'ADMIN' ? '管理员' : '普通用户'}</td>
                    <td className="px-5 py-3">{user.status === 'ACTIVE' ? '启用' : '禁用'}</td>
                    <td className="px-5 py-3">{user.totalUsage}</td>
                    <td className="px-5 py-3">{user.completed}</td>
                    <td className="px-5 py-3">{user.failed}</td>
                    <td className="px-5 py-3">{user.lastUsedAt ? new Date(user.lastUsedAt).toLocaleString() : '-'}</td>
                    <td className="px-5 py-3">
                      <button
                        type="button"
                        onClick={() => toggleUser(user)}
                        className="rounded-lg border border-gray-200 px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                      >
                        {user.status === 'ACTIVE' ? '禁用' : '启用'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-100 px-5 py-4 dark:border-gray-800">
            <h3 className="text-lg font-black text-gray-950 dark:text-white">最近任务</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {tasks.length === 0 ? (
              <div className="px-5 py-8 text-sm text-gray-400">暂无任务记录。下一阶段接入后端代理后会自动统计。</div>
            ) : tasks.map((task) => (
              <div key={task.id} className="grid gap-2 px-5 py-4 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-[1fr_120px_120px_180px]">
                <div>
                  <div className="font-semibold text-gray-900 dark:text-white">{task.user?.email}</div>
                  <div className="text-xs text-gray-400">{task.taskId}</div>
                </div>
                <div>{task.platform}</div>
                <div>{task.status}</div>
                <div>{new Date(task.createdAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
