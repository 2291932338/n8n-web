/**
 * useTaskManager hook
 * 管理多个并发任务，维护活跃任务列表，并提供任务切换能力
 * 每个任务有独立的 useTask 实例（通过 key 强制重建）
 */

import { useState, useCallback } from 'react'
import { getAllTasks, deleteTask, clearAllTasks, getTask } from '../taskStore'

export function useTaskManager() {
  const [taskRecords, setTaskRecords] = useState(() => getAllTasks())
  // key 变化时 App 层的 useTask 实例会重建
  const [activeTaskKey, setActiveTaskKey] = useState('task_0')
  // 切换到已有任务时，传给 useTask 用于恢复状态
  const [selectedTaskRecord, setSelectedTaskRecord] = useState(null)

  const refreshTaskRecords = useCallback(() => {
    setTaskRecords(getAllTasks())
  }, [])

  const newTask = useCallback(() => {
    setSelectedTaskRecord(null)
    setActiveTaskKey(`task_${Date.now()}`)
  }, [])

  // 切换到已有任务（恢复状态并重启轮询）
  const selectTask = useCallback((taskId) => {
    const record = getTask(taskId)
    if (!record) return
    setSelectedTaskRecord(record)
    setActiveTaskKey(`task_${taskId}_${Date.now()}`)
  }, [])

  const deleteTaskRecord = useCallback((taskId) => {
    deleteTask(taskId)
    setTaskRecords(getAllTasks())
  }, [])

  const clearTaskRecords = useCallback((platform) => {
    clearAllTasks(platform || null)
    setTaskRecords(getAllTasks())
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
