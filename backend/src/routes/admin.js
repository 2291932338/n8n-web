import express from 'express'
import { prisma } from '../db.js'
import { requireAdmin, requireAuth } from '../middleware/auth.js'
import { hashPassword } from '../utils/password.js'

export const adminRouter = express.Router()

adminRouter.use(requireAuth, requireAdmin)

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  }
}

adminRouter.get('/overview', async (_req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalTasks, completedTasks, failedTasks, processingTasks] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.workflowTask.count(),
      prisma.workflowTask.count({ where: { status: 'COMPLETED' } }),
      prisma.workflowTask.count({ where: { status: 'FAILED' } }),
      prisma.workflowTask.count({ where: { status: { notIn: ['COMPLETED', 'FAILED'] } } }),
    ])

    res.json({
      success: true,
      overview: {
        totalUsers,
        activeUsers,
        totalTasks,
        completedTasks,
        failedTasks,
        processingTasks,
      },
    })
  } catch (err) {
    next(err)
  }
})

adminRouter.get('/users', async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    })

    const taskStats = await prisma.workflowTask.groupBy({
      by: ['userId', 'status'],
      _count: { _all: true },
    })

    const lastTasks = await prisma.workflowTask.groupBy({
      by: ['userId'],
      _max: { createdAt: true },
    })

    const statsByUser = new Map()
    for (const stat of taskStats) {
      const current = statsByUser.get(stat.userId) || { completed: 0, failed: 0, processing: 0 }
      if (stat.status === 'COMPLETED') current.completed += stat._count._all
      else if (stat.status === 'FAILED') current.failed += stat._count._all
      else current.processing += stat._count._all
      statsByUser.set(stat.userId, current)
    }

    const lastTaskByUser = new Map(lastTasks.map((item) => [item.userId, item._max.createdAt]))

    res.json({
      success: true,
      users: users.map((user) => ({
        ...publicUser(user),
        totalUsage: user._count.tasks,
        completed: statsByUser.get(user.id)?.completed || 0,
        failed: statsByUser.get(user.id)?.failed || 0,
        processing: statsByUser.get(user.id)?.processing || 0,
        lastUsedAt: lastTaskByUser.get(user.id) || null,
      })),
    })
  } catch (err) {
    next(err)
  }
})

adminRouter.post('/users', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    const role = req.body?.role === 'ADMIN' ? 'ADMIN' : 'USER'

    if (!email || !password) {
      return res.status(400).json({ success: false, message: '邮箱和初始密码不能为空' })
    }

    if (password.length < 8) {
      return res.status(400).json({ success: false, message: '密码至少需要 8 位' })
    }

    const user = await prisma.user.create({
      data: {
        email,
        role,
        passwordHash: await hashPassword(password),
      },
    })

    res.status(201).json({ success: true, user: publicUser(user) })
  } catch (err) {
    if (err.code === 'P2002') {
      return res.status(409).json({ success: false, message: '该邮箱已存在' })
    }
    next(err)
  }
})

adminRouter.patch('/users/:id/status', async (req, res, next) => {
  try {
    const status = req.body?.status === 'DISABLED' ? 'DISABLED' : 'ACTIVE'
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { status },
    })
    res.json({ success: true, user: publicUser(user) })
  } catch (err) {
    next(err)
  }
})

adminRouter.get('/tasks', async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 50), 200)
    const tasks = await prisma.workflowTask.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true },
        },
      },
    })

    res.json({ success: true, tasks })
  } catch (err) {
    next(err)
  }
})
