import { prisma } from '../db.js'
import { SESSION_COOKIE_NAME } from '../config.js'
import { verifySessionToken } from '../utils/auth.js'

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME]
    if (!token) {
      return res.status(401).json({ success: false, message: '请先登录' })
    }

    const payload = verifySessionToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, message: '账号不可用或已被禁用' })
    }

    req.user = user
    next()
  } catch {
    return res.status(401).json({ success: false, message: '登录状态已过期' })
  }
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: '需要管理员权限' })
  }
  next()
}
