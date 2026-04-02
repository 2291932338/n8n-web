/**
 * useTaskManager hook
 * 管理多个并发任务，维护活跃任务列表，并提供任务切换能力
 * 每个任务有独立的 useTask 实例（通过 key 强制重建）
 */

import { useState, useCallback } from 'react'
import { getAllTasks, deleteTask, clearAllTasks } from '../taskStore'

/**
 * 返回任务管理器和当前活跃任务的 key（用于 App 层创建 useTask 实例）
 *
 * 设计说明：
 * React 不支持动态数量的 hooks，因此我们不能为每个任务动态创建 useTask。
 * 解决方案：App 层只维护"当前显示任务"的单个 useTask 实例，
 * 通过改变 key prop 来强制重建（类似 React key 重置技巧）。
 * 后台任务的状态通过 taskStore（localStorage）持久化，
 * 历史任务列表从 taskStore 读取展示。
 *
 * @returns {{
 *   taskRecords: Array,
 *   activeTaskKey: string,
 *   refreshTaskRecords: Function,
 *   selectTask: Function,  // 切换到历史任务（只读查看）
 *   deleteTaskRecord: Function,
 *   clearTaskRecords: Function,
 *   newTask: Function,     // 开启新任务（重置 activeTaskKey）
 * }}
 */
export function useTaskManager() {
  const [taskRecords, setTaskRecords] = useState(() => getAllTasks())
  // key 变化时 App 层的 useTask 实例会重建
  const [activeTaskKey, setActiveTaskKey] = useState('task_0')

  const refreshTaskRecords = useCallback(() => {
    setTaskRecords(getAllTasks())
  }, [])

  const newTask = useCallback(() => {
    setActiveTaskKey(`task_${Date.now()}`)
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
    refreshTaskRecords,
    newTask,
    deleteTaskRecord,
    clearTaskRecords,
  }
}
