import express from 'express'
import cors from 'cors'
import { config } from './config.js'
import { apiRouter } from './routes/index.js'
import { errorHandler, notFound } from './middlewares/error.js'
import * as paymentController from './controllers/paymentController.js'

export function createApp() {
  const app = express()
  app.use(
    cors({
      origin(origin, cb) {
        if (!origin) return cb(null, true)
        if (config.clientOrigins.includes(origin)) return cb(null, true)
        return cb(null, false)
      },
      credentials: true,
    }),
  )
  app.post(
    '/api/payments/webhook',
    express.raw({ type: 'application/json' }),
    (req, res, next) => {
      const rawBuf = Buffer.isBuffer(req.body) ? req.body : Buffer.from(String(req.body || ''), 'utf8')
      try {
        const txt = rawBuf.length ? rawBuf.toString('utf8') : '{}'
        req.body = JSON.parse(txt)
      } catch {
        req.body = {}
      }
      req.paystackRawBody = rawBuf
      paymentController.paystackWebhook(req, res, next)
    },
  )
  app.use(express.json())

  app.use('/api', apiRouter)

  app.use(notFound)
  app.use(errorHandler)
  return app
}
