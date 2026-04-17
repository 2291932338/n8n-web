import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import cookieParser from 'cookie-parser'
import { config } from './config.js'
import { authRouter } from './routes/auth.js'
import { adminRouter } from './routes/admin.js'
import { tasksRouter } from './routes/tasks.js'
import { workflowsRouter } from './routes/workflows.js'

export function createApp() {
  const app = express()

  app.set('trust proxy', 1)
  app.use(helmet())
  app.use(cors({
    origin: config.frontendOrigin,
    credentials: true,
  }))
  app.use(express.json({ limit: '1mb' }))
  app.use(cookieParser())
  app.use(morgan(config.isProduction ? 'combined' : 'dev'))

  app.get('/health', (_req, res) => {
    res.json({ success: true, service: 'workflow-studio-backend' })
  })

  app.use('/api/auth', authRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/tasks', tasksRouter)
  app.use('/api/workflows', workflowsRouter)

  app.use((_req, res) => {
    res.status(404).json({ success: false, message: '接口不存在' })
  })

  app.use((err, _req, res, _next) => {
    console.error(err)
    res.status(500).json({
      success: false,
      message: config.isProduction ? '服务器内部错误' : err.message,
    })
  })

  return app
}
