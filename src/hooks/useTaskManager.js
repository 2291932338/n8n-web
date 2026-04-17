import { useState, useCallback, useEffect } from 'react'
import { getUserTask, getUserTasks } from '../authApi'
import { getAllTasks, deleteTask, clearAllTasks, getTask } from '../taskStore'
import { setUpdateListener } from '../backgroundPoller'

const TERMINAL_STATUSES = new Set(['completed', 'failed'])

function mergeTasks(localTasks, remoteTasks) {
  const byId = new Map()
  for (const task of localTasks || []) {
    byId.set(task.taskId, task)
  }
  for (const task of remoteTasks || []) {
    const existing = byId.get(task.taskId) || {}
    byId.set(task.taskId, { ...existing, ...task })
  }
  return [...byId.values()].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
}

export function useTaskManager() {
  const [taskRecords, setTaskRecords] = useState(() => getAllTasks())
  const [activeTaskKey, setActiveTaskKey] = useState('task_0')
  const [selectedTaskRecord, setSelectedTaskRecord] = useState(null)

  const refreshTaskRecords = useCallback(async () => {
    const localTasks = getAllTasks()
    try {
      const result = await getUserTasks()
      setTaskRecords(mergeTasks(localTasks, result.tasks || []))
    } catch {
      setTaskRecords(localTasks)
    }
  }, [])

  useEffect(() => {
    refreshTaskRecords()
  }, [refreshTaskRecords])

  useEffect(() => {
    setUpdateListener(refreshTaskRecords)
    return () => setUpdateListener(null)
  }, [refreshTaskRecords])

  const newTask = useCallback(() => {
    setSelectedTaskRecord(null)
    setActiveTaskKey(`task_${Date.now()}`)
  }, [])

  const selectTask = useCallback(async (taskId) => {
    const localRecord = getTask(taskId)
    let record = localRecord
    try {
      const result = await getUserTask(taskId)
      record = { ...(localRecord || {}), ...result.task }
    } catch {}
    if (!record) return
    setSelectedTaskRecord(record)
    setActiveTaskKey(`task_${taskId}_${Date.now()}`)
  }, [])

  const deleteTaskRecord = useCallback((taskId) => {
    deleteTask(taskId)
    setTaskRecords((records) => records.filter((task) => task.taskId !== taskId))
  }, [])

  const clearTaskRecords = useCallback((platform) => {
    clearAllTasks(platform || null)
    setTaskRecords((records) => records.filter((task) => {
      if (!TERMINAL_STATUSES.has(task.status)) return true
      if (!platform) return false
      return task.platform !== platform
    }))
  }, [])

  return {
    taskRecords,
    activeTaskKey,
    selectedTaskRecord,
    refreshTaskRecords,
    newTask,
    selectTask,
    deleteTaskRecord,
    clearTaskRecords,
  }
}
