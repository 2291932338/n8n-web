import dotenv from 'dotenv'

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'

function required(name, fallback = undefined) {
  const value = process.env[name] || fallback
  if (!value && isProduction) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction,
  port: Number(process.env.PORT || 4000),
  databaseUrl: required('DATABASE_URL'),
  sessionSecret: required('SESSION_SECRET', isProduction ? undefined : 'dev-only-session-secret'),
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  adminEmail: process.env.ADMIN_EMAIL,
  adminInitialPassword: process.env.ADMIN_INITIAL_PASSWORD,
  n8nTimeoutMs: Number(process.env.N8N_TIMEOUT_MS || 60000),
  webhooks: {
    xiaohongshu: {
      START_WORKFLOW_URL: process.env.XHS_START_WORKFLOW_URL,
      STATUS_QUERY_URL: process.env.XHS_STATUS_QUERY_URL,
      USER_ACTION_URL: process.env.XHS_USER_ACTION_URL,
      REGENERATE_IMAGE_URL: process.env.XHS_REGENERATE_IMAGE_URL,
    },
    douyin: {
      START_WORKFLOW_URL: process.env.DOUYIN_START_WORKFLOW_URL,
      STATUS_QUERY_URL: process.env.DOUYIN_STATUS_QUERY_URL,
      DOWNLOAD_URL: process.env.DOUYIN_DOWNLOAD_URL,
      USER_ACTION_URL: process.env.DOUYIN_USER_ACTION_URL,
      FRAME_ACTION_URL: process.env.DOUYIN_FRAME_ACTION_URL,
      GENERATE_VIDEO_URL: process.env.DOUYIN_GENERATE_VIDEO_URL,
      REGENERATE_VIDEO_URL: process.env.DOUYIN_REGENERATE_VIDEO_URL,
    },
  },
}

export const SESSION_COOKIE_NAME = 'wfs_session'

export function getWebhookUrls(platform) {
  return platform === 'douyin' ? config.webhooks.douyin : config.webhooks.xiaohongshu
}
