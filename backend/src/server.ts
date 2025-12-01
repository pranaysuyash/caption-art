import dotenv from 'dotenv'
// Load environment variables before anything else
dotenv.config()

import express, { Express } from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import { config } from './config'
import { corsMiddleware } from './middleware/cors'
import { errorHandler } from './middleware/errorHandler'
import { logger } from './middleware/logger'
import { rateLimiter } from './middleware/rateLimiter'
import authRouter from './routes/auth'
import workspacesRouter from './routes/workspaces'
import brandKitsRouter from './routes/brandKits'
import assetsRouter from './routes/assets'
import batchRouter from './routes/batch'
import approvalRouter from './routes/approval'
import exportRouter from './routes/export'
import generatedAssetsRouter from './routes/generatedAssets'
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

  // 3. Cookie parser for session management
  app.use(cookieParser())

  // 4. JSON body parser
  app.use(express.json({ limit: '10mb' }))

  // 5. Serve static files from uploads and generated directories
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
  app.use('/generated', express.static(path.join(process.cwd(), 'generated')))

  // 6. Rate limiter for API routes (can be disabled for testing)
  if (enableRateLimiter) {
    app.use('/api/', rateLimiter)
  }

  // Routes (auth first, then workspaces, brand kits, assets, batch, approval, export, generated assets, then existing routes)
  app.use('/api/auth', authRouter)
  app.use('/api/workspaces', workspacesRouter)
  app.use('/api/brand-kits', brandKitsRouter)
  app.use('/api/assets', assetsRouter)
  app.use('/api/batch', batchRouter)
  app.use('/api/approval', approvalRouter)
  app.use('/api/export', exportRouter)
  app.use('/api/generated-assets', generatedAssetsRouter)
  app.use('/api/caption', captionRouter)
  app.use('/api/mask', maskRouter)
  app.use('/api/verify', verifyRouter)
  app.use('/api/health', healthRouter)
  app.use('/api/story', storyRouter)

  // Error handling middleware - must be last
  app.use(errorHandler)

  // Dev helper: list registered routes for debugging
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/_routes', (_, res) => {
      try {
        // Express mounts are in app._router.stack
        const routes: Array<{ method: string; path: string }> = []
        if ((app as any)._router && (app as any)._router.stack) {
          for (const layer of (app as any)._router.stack) {
            if (layer.route && layer.route.path) {
              const routePath = layer.route.path
              const methods = Object.keys(layer.route.methods)
              for (const method of methods) {
                routes.push({ method: method.toUpperCase(), path: routePath })
              }
            } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
              // nested router
              for (const nested of layer.handle.stack) {
                if (nested.route && nested.route.path) {
                  const routePath = nested.route.path
                  const methods = Object.keys(nested.route.methods)
                  for (const method of methods) {
                    // include base path of the router if available
                    const basePath = layer.regexp && layer.regexp.source ? (layer.regexp.source === '^\\/\\?$', '' ) : ''
                    routes.push({ method: method.toUpperCase(), path: routePath })
                  }
                }
              }
            }
          }
        }

        res.json({ routes })
      } catch (err) {
        console.error('Error listing routes', err)
        res.status(500).json({ error: 'Failed to list routes' })
      }
    })
  }

  return app
}

export function startServer(): void {
  const app = createServer()
  const port = config.port

  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
    console.log(`Environment: ${config.env}`)

    // Log all mounted routes for easier debugging
    try {
      const routes: Array<{ method: string; path: string }> = []
      if ((app as any)._router && (app as any)._router.stack) {
        for (const layer of (app as any)._router.stack) {
          if (layer.route && layer.route.path) {
            const routePath = layer.route.path
            const methods = Object.keys(layer.route.methods)
            for (const method of methods) {
              routes.push({ method: method.toUpperCase(), path: routePath })
            }
          } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
            for (const nested of layer.handle.stack) {
              if (nested.route && nested.route.path) {
                const routePath = nested.route.path
                const methods = Object.keys(nested.route.methods)
                for (const method of methods) {
                  routes.push({ method: method.toUpperCase(), path: routePath })
                }
              }
            }
          }
        }
      }
      console.log('Registered routes:', routes)
    } catch (error) {
      console.error('Failed to list routes on startup', error)
    }
  })
}

// Start server if this file is run directly
if (require.main === module) {
  startServer()
}
