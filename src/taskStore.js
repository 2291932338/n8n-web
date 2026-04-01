/**
 * 任务历史存储模块
 * 基于 localStorage 的任务记录 CRUD，支持跨页面刷新持久化
 * 最多保存 MAX_TASK_RECORDS 条，超出时 FIFO 淘汰最旧的
 */

import config from './config'

const STORAGE_KEY = `${config.STORAGE_PREFIX}task_records`
const MAX_RECORDS = config.MAX_TASK_RECORDS || 50

/**
 * 从 localStorage 读取所有任务记录
 * @returns {Array}
 */
function readAll() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

/**
 * 将任务列表写入 localStorage
 * @param {Array} records
 */
function writeAll(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // localStorage 写入失败（如隐私模式或存储已满），静默忽略
  }
}

/**
 * 保存（新建或更新）一条任务记录
 * @param {{
 *   taskId: string,
 *   platform: 'xiaohongshu' | 'douyin',
 *   status: string,
 *   formParams: object,
 *   preview: object | null,
 *   previewHistory: Array,
 *   stepName: string,
 *   statusMessage: string,
 *   errorMessage: string | null,
 *   createdAt: number,
 * }} task
 */
export function saveTask(task) {
  const records = readAll()
  const now = Date.now()
  const existingIdx = records.findIndex((r) => r.taskId === task.taskId)

  if (existingIdx !== -1) {
    // 更新现有记录
    records[existingIdx] = { ...records[existingIdx], ...task, updatedAt: now }
  } else {
    // 新增记录：超出上限时淘汰最旧的（按 createdAt 升序，最旧在前）
    const newRecord = { ...task, createdAt: task.createdAt || now, updatedAt: now }
    records.push(newRecord)

    if (records.length > MAX_RECORDS) {
      records.sort((a, b) => a.createdAt - b.createdAt)
      records.splice(0, records.length - MAX_RECORDS)
    }
  }

  writeAll(records)
}

/**
 * 获取单条任务记录
 * @param {string} taskId
 * @returns {object | null}
 */
export function getTask(taskId) {
  return readAll().find((r) => r.taskId === taskId) || null
}

/**
 * 获取所有任务记录，按创建时间倒序（最新在前）
 * @param {'xiaohongshu' | 'douyin' | null} platform  传 null 获取全部平台
 * @returns {Array}
 */
export function getAllTasks(platform = null) {
  const records = readAll()
  const filtered = platform ? records.filter((r) => r.platform === platform) : records
  return [...filtered].sort((a, b) => b.createdAt - a.createdAt)
}

/**
 * 删除单条任务记录
 * @param {string} taskId
 */
export function deleteTask(taskId) {
  const records = readAll().filter((r) => r.taskId !== taskId)
  writeAll(records)
}

/**
 * 清空任务记录
 * @param {'xiaohongshu' | 'douyin' | null} platform  传 null 清空所有平台
 */
export function clearAllTasks(platform = null) {
  if (!platform) {
    writeAll([])
    return
  }
  const records = readAll().filter((r) => r.platform !== platform)
  writeAll(records)
}
