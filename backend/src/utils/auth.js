import jwt from 'jsonwebtoken'
import { config, SESSION_COOKIE_NAME } from '../config.js'

const SESSION_TTL = '7d'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000

export function createSessionToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
    },
    config.sessionSecret,
    { expiresIn: SESSION_TTL },
  )
}

export function verifySessionToken(token) {
  return jwt.verify(token, config.sessionSecret)
}

export function setSessionCookie(res, token) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    maxAge: SESSION_TTL_MS,
    path: '/',
  })
}

export function clearSessionCookie(res) {
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.cookieSecure,
    path: '/',
  })
}
