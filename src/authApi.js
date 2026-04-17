const API_BASE = import.meta.env.VITE_API_BASE_URL || ''

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const text = await res.text()
  const data = text ? JSON.parse(text) : {}

  if (!res.ok) {
    throw new Error(data.message || `请求失败：${res.status}`)
  }

  return data
}

export function login(email, password) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export function logout() {
  return request('/api/auth/logout', { method: 'POST' })
}

export function getCurrentUser() {
  return request('/api/auth/me')
}

export function getAdminOverview() {
  return request('/api/admin/overview')
}

export function getAdminUsers() {
  return request('/api/admin/users')
}

export function getAdminTasks(limit = 50) {
  return request(`/api/admin/tasks?limit=${encodeURIComponent(limit)}`)
}

export function createAdminUser({ email, password, role = 'USER' }) {
  return request('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify({ email, password, role }),
  })
}

export function updateUserStatus(id, status) {
  return request(`/api/admin/users/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function getUserTasks() {
  return request('/api/tasks')
}

export function getUserTask(taskId) {
  return request(`/api/tasks/${encodeURIComponent(taskId)}`)
}
