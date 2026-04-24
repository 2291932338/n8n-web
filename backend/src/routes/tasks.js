import express from 'express'
import { prisma } from '../db.js'
import { requireAuth } from '../middleware/auth.js'

export const tasksRouter = express.Router()

tasksRouter.use(requireAuth)

function toClientTask(task) {
  const metadata = task.metadata || {}
  const preview = metadata.confirmedText
    ? { ...(task.resultPreview || {}), text: metadata.confirmedText }
    : (task.resultPreview || null)

  return {
    id: task.id,
    taskId: task.taskId,
    platform: task.platform,
    status: task.status.toLowerCase(),
    formParams: task.inputParams || null,
    preview,
    previewHistory: metadata.previewHistory || [],
    stepName: metadata.stepName || '',
    statusMessage: metadata.statusMessage || '',
    errorMessage: task.errorMessage || null,
    createdAt: task.createdAt?.getTime ? task.createdAt.getTime() : task.createdAt,
    updatedAt: task.updatedAt?.getTime ? task.updatedAt.getTime() : task.updatedAt,
    completedAt: task.completedAt,
    downloadUrl: metadata.downloadUrl || null,
    fileList: metadata.fileList || [],
    storyboardDocument: metadata.storyboardDocument || null,
    generationProgress: metadata.generationProgress || null,
    confirmedText: metadata.confirmedText || '',
  }
}

tasksRouter.get('/', async (req, res, next) => {
  try {
    const tasks = await prisma.workflowTask.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    res.json({ success: true, tasks: tasks.map(toClientTask) })
  } catch (err) {
    next(err)
  }
})

tasksRouter.get('/:taskId', async (req, res, next) => {
  try {
    const task = await prisma.workflowTask.findFirst({
      where: {
        taskId: req.params.taskId,
        userId: req.user.id,
      },
    })

    if (!task) {
      return res.status(404).json({ success: false, message: '任务不存在' })
    }

    res.json({ success: true, task: toClientTask(task) })
  } catch (err) {
    next(err)
  }
})
