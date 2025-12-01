import dotenv from 'dotenv'
// Load environment variables before anything else
dotenv.config()

import express, { Express } from 'express'
import { config } from './config'
import { corsMiddleware } from './middleware/cors'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './middleware/logger'
import { rateLimiter } from './middleware/rateLimiter'
import captionRouter from './routes/caption'
import maskRouter from './routes/mask'
import verifyRouter from './routes/verify'
import healthRouter from './routes/health'
import storyRouter from './routes/story'

export function createServer(
  options: { enableRateLimiter?: boolean } = {}
): Express {
  const { enableRateLimiter = true } = options
  const app = express()

  // Middleware - order matters!
  // 1. CORS must be first to handle preflight requests
  app.use(corsMiddleware)

  // 2. Logger to track all requests
  app.use(logger)

  // 3. JSON body parser
  app.use(express.json({ limit: '10mb' }))

  // 4. Rate limiter for API routes (can be disabled for testing)
  if (enableRateLimiter) {
    app.use('/api/', rateLimiter)
  }

  // Routes
  app.use('/api/caption', captionRouter)
  app.use('/api/mask', maskRouter)
  app.use('/api/verify', verifyRouter)
  app.use('/api/health', healthRouter)
  app.use('/api/story', storyRouter)

  // Error handling middleware - must be last
  app.use(errorHandler)

  return app
}

export function startServer(): void {
  const app = createServer()
  const port = config.port

  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
    console.log(`Environment: ${config.env}`)
  })
}

// Start server if this file is run directly
if (require.main === module) {
  startServer()
}
