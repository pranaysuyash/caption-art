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
import exportRouter, { } from './routes/export'
import { createAuthMiddleware } from './routes/auth'
import { ExportService } from './services/exportService'
import { AuthModel } from './models/auth'
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

  // Fallback server-level POST route for starting export, to prevent 404 when router route matching fails for POST. This duplicates exportRouter POST handler for now.
  const requireAuthInline = createAuthMiddleware() as any
  app.post('/api/export/workspace/:workspaceId/start', requireAuthInline, async (req, res) => {
    try {
      const authenticatedReq: any = req
      const { workspaceId } = req.params

      const workspace = AuthModel.getWorkspaceById(workspaceId)
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' })
      }

      if (workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const approvedCaptions = AuthModel.getApprovedCaptionsByWorkspace(workspaceId)
      if (approvedCaptions.length === 0) {
        return res.status(400).json({ error: 'No approved captions found for export' })
      }

      const result = await ExportService.startExport(workspaceId)
      res.status(201).json(result)
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }
      console.error('Start export error (fallback route):', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  })
  app.use('/api/export', exportRouter)
  app.use('/api/generated-assets', generatedAssetsRouter)
  app.use('/api/caption', captionRouter)
  app.use('/api/mask', maskRouter)
  app.use('/api/verify', verifyRouter)
  app.use('/api/health', healthRouter)
  app.use('/api/story', storyRouter)

  // Simple test route to debug route registration
  if (process.env.NODE_ENV !== 'production') {
     app.get('/api/_test', (_, res) => {
      res.json({ message: 'Route registration working', timestamp: new Date().toISOString() })
    })
      // Detailed route listing with stack and regexp info
      app.get('/api/_routes_full', (_, res) => {
        try {
          const stack = (app as any)._router ? (app as any)._router.stack : []
          const layers = stack.map((layer: any) => {
            const info: any = { name: layer.name }
            if (layer.regexp) info.regexp = layer.regexp.source
            if (layer.route && layer.route.path) {
              info.route = { path: layer.route.path, methods: Object.keys(layer.route.methods) }
            }
            if (layer.handle && layer.handle.stack) {
              info.handleStack = layer.handle.stack.map((nested: any) => ({
                name: nested.name,
                regexp: nested.regexp ? nested.regexp.source : undefined,
                route: nested.route ? { path: nested.route.path, methods: Object.keys(nested.route.methods) } : undefined,
              }))
            }
            return info
          })
          res.json({ layers })
        } catch (err) {
          console.error('Error listing full routes', err)
          res.status(500).json({ error: 'Failed to list routes' })
        }
      })
  }

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
