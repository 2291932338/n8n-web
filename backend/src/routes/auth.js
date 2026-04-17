import express from 'express'
import rateLimit from 'express-rate-limit'
import { prisma } from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { clearSessionCookie, createSessionToken, setSessionCookie } from '../utils/auth.js'
import { verifyPassword } from '../utils/password.js'

export const authRouter = express.Router()

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
})

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  }
}

authRouter.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')

    if (!email || !password) {
      return res.status(400).json({ success: false, message: '邮箱和密码不能为空' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' })
    }

    const isValid = await verifyPassword(password, user.passwordHash)
    if (!isValid) {
      return res.status(401).json({ success: false, message: '邮箱或密码错误' })
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    setSessionCookie(res, createSessionToken(updatedUser))
    res.json({ success: true, user: publicUser(updatedUser) })
  } catch (err) {
    next(err)
  }
})

authRouter.post('/logout', (_req, res) => {
  clearSessionCookie(res)
  res.json({ success: true })
})

authRouter.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: publicUser(req.user) })
})
