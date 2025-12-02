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
import { createAuthMiddleware } from './routes/auth'
import { ExportService } from './services/exportService'
import { AuthModel } from './models/auth'
import generatedAssetsRouter from './routes/generatedAssets'
import captionRouter from './routes/caption'
import maskRouter from './routes/mask'
import verifyRouter from './routes/verify'
import healthRouter from './routes/health'
import storyRouter from './routes/story'
import campaignsRouter from './routes/campaigns'
import referenceCreativesRouter from './routes/referenceCreatives'
import creativeEngineRouter from './routes/creativeEngine'

// Global route registry to make route information accessible across functions
let globalMountedRoutes: Array<{
  mount: string
  innerRoutes?: Array<{ method: string; path: string }>
}> = []

export function createServer(
  options: { enableRateLimiter?: boolean } = {}
): Express {
  const { enableRateLimiter = true } = options
  const app = express()

  // Reset the global mounted routes for each server instance
  globalMountedRoutes = []

  // Monkeypatch app.use to record mount paths and inner routes
  const originalUse = app.use.bind(app)
  ;(app as any).use = function useWrapper(...args: any[]) {
    try {
      if (args.length >= 2 && typeof args[0] === 'string' && args[1]) {
        const mount = args[0]
        const handler = args[1]
        const innerRoutes: Array<{ method: string; path: string }> = []
        // Try to extract inner routes from the handler/router
        if (handler && typeof handler === 'object') {
          if (Array.isArray(handler.stack)) {
            for (const l of handler.stack) {
              if (l && l.route && l.route.path) {
                const methods = Object.keys(l.route.methods || {})
                for (const m of methods) {
                  innerRoutes.push({
                    method: m.toUpperCase(),
                    path: l.route.path,
                  })
                }
              }
            }
          }
          // Check for symbol-backed stacks (Express may use Symbols)
          const syms = Object.getOwnPropertySymbols(handler)
          for (const s of syms) {
            const val = (handler as any)[s]
            if (val && Array.isArray(val.stack)) {
              for (const l of val.stack) {
                if (l && l.route && l.route.path) {
                  const methods = Object.keys(l.route.methods || {})
                  for (const m of methods) {
                    innerRoutes.push({
                      method: m.toUpperCase(),
                      path: l.route.path,
                    })
                  }
                }
              }
            }
          }
        }
        globalMountedRoutes.push({
          mount,
          innerRoutes: innerRoutes.length ? innerRoutes : undefined,
        })
      }
    } catch (err) {
      console.error('Failed to extract inner routes from handler', err)
    }
    return originalUse(...args)
  }

  // Helper: attempt to find where the router stack is stored on the app
  const findRouterStack = () => {
    const candidates = ['_router', 'router', 'handle']
    for (const c of candidates) {
      const obj = (app as any)[c]
      if (obj && typeof obj === 'object' && Array.isArray(obj.stack)) {
        return { prop: c, stack: obj.stack }
      }
    }
    // fallback: search any property with a stack array
    for (const p of Object.getOwnPropertyNames(app)) {
      const v = (app as any)[p]
      if (v && typeof v === 'object' && Array.isArray(v.stack)) {
        return { prop: p, stack: v.stack }
      }
    }
    return { prop: undefined, stack: [] as any[] }
  }

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
  app.post(
    '/api/export/workspace/:workspaceId/start',
    requireAuthInline,
    async (req, res) => {
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

        const approvedCaptions =
          AuthModel.getApprovedCaptionsByWorkspace(workspaceId)
        if (approvedCaptions.length === 0) {
          return res
            .status(400)
            .json({ error: 'No approved captions found for export' })
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
    }
  )
  // Mount export router at /api/export
  app.use('/api/export', exportRouter)
  app.use('/api/generated-assets', generatedAssetsRouter)
  app.use('/api/caption', captionRouter)
  app.use('/api/mask', maskRouter)
  app.use('/api/verify', verifyRouter)
  app.use('/api/health', healthRouter)
  app.use('/api/story', storyRouter)
  app.use('/api/campaigns', campaignsRouter)
  app.use('/api/reference-creatives', referenceCreativesRouter)
  app.use('/api/creative-engine', creativeEngineRouter)

  // Simple test route to debug route registration
  console.log('NODE_ENV value on startup:', process.env.NODE_ENV)
  console.log('Setting up dev-only debug routes')
  if (process.env.NODE_ENV !== 'production') {
    app.get('/api/_test', (_, res) => {
      res.json({
        message: 'Route registration working',
        timestamp: new Date().toISOString(),
      })
    })
    // Detailed route listing with stack and regexp info
    app.get('/api/_routes_full', (_, res) => {
      try {
        const routerInfo = findRouterStack()
        const stack = routerInfo.stack
        // fallback to globalMountedRoutes if stack is empty
        const fallbackMountedRoutes = globalMountedRoutes
        const layers = stack.map((layer: any) => {
          const info: any = { name: layer.name }
          if (layer.regexp) info.regexp = layer.regexp.source
          if (layer.route && layer.route.path) {
            info.route = {
              path: layer.route.path,
              methods: Object.keys(layer.route.methods),
            }
          }
          if (layer.handle && layer.handle.stack) {
            info.handleStack = layer.handle.stack.map((nested: any) => ({
              name: nested.name,
              regexp: nested.regexp ? nested.regexp.source : undefined,
              route: nested.route
                ? {
                    path: nested.route.path,
                    methods: Object.keys(nested.route.methods),
                  }
                : undefined,
            }))
          }
          return info
        })
        res.json({ layers, mountedRoutes: fallbackMountedRoutes })
      } catch (err) {
        console.error('Error listing full routes', err)
        res.status(500).json({ error: 'Failed to list routes' })
      }
    })

    // Simple route listing that matches older tests/tools expectations
    app.get('/api/_routes', (_, res) => {
      try {
        const routerInfo = findRouterStack()
        const stack = routerInfo.stack
        const routes: Array<{
          method: string
          path: string
          mountedPath?: string
        }> = []
        const walk = (items: any[], prefix = '') => {
          for (const layer of items) {
            if (!layer) continue
            if (layer.route && layer.route.path) {
              const innerPath = layer.route.path
              const fullPath = `${prefix}${innerPath}`
              const methods = Object.keys(layer.route.methods || {})
              for (const method of methods) {
                // Expose both the inner route path (route.path) and a mountedPath for clarity
                routes.push({
                  method: method.toUpperCase(),
                  path: innerPath,
                  mountedPath: fullPath,
                })
              }
            } else if (layer.handle && layer.handle.stack) {
              const mountPath =
                layer.regexp && layer.regexp.source
                  ? layer.regexp.source
                      .replace('^\\/', '/')
                      .replace('\\/?(?=\/|$)', '')
                      .replace('(?=\/|$)', '')
                      .replace('^', '')
                      .replace('\\', '')
                      .replace('(?:', '')
                      .replace(')?', '')
                  : ''
              walk(layer.handle.stack, prefix + mountPath)
            }
          }
        }
        walk(stack, '')
        // Also append any recorded globalMountedRoutes that we couldn't find via stack
        for (const m of globalMountedRoutes) {
          if (m.innerRoutes) {
            for (const r of m.innerRoutes) {
              routes.push({
                method: r.method,
                path: r.path,
                mountedPath: `${m.mount}${r.path}`,
              })
            }
          } else {
            // If no inner routes are available, expose the mount path itself
            routes.push({ method: 'ALL', path: '*', mountedPath: m.mount })
          }
        }
        res.json({ routes })
      } catch (err) {
        console.error('Error listing routes', err)
        res.status(500).json({ error: 'Failed to list routes' })
      }
    })

    // Debug route to inspect internal router object keys and stack length
    console.log('Registering debug route /api/_debug_router')
    app.get('/api/_debug_router', (_, res) => {
      try {
        const results: any = {}
        const candidates = ['_router', 'router', 'app', 'handle', 'stack']
        for (const candidate of candidates) {
          const obj = (app as any)[candidate]
          if (obj && typeof obj === 'object') {
            const symKeys = Object.getOwnPropertySymbols(obj)
              .map((s) => s.toString())
              .slice(0, 20)
            const stackVal = (obj as any).stack
            results[candidate] = {
              isObject: true,
              keys: Object.getOwnPropertyNames(obj).slice(0, 50),
              symKeys,
              stackIsArray: Array.isArray(stackVal),
              stackType: stackVal ? typeof stackVal : undefined,
              stackLength: Array.isArray(stackVal)
                ? stackVal.length
                : undefined,
            }
          } else {
            results[candidate] = { isObject: !!obj }
          }
        }

        // Also find any app property that contains a 'stack' array
        const stackProps: any = {}
        for (const prop of Object.getOwnPropertyNames(app)) {
          const val = (app as any)[prop]
          if (val && typeof val === 'object') {
            if (Array.isArray(val.stack)) {
              stackProps[prop] = val.stack.length
            } else if (
              val &&
              val instanceof Map &&
              typeof (val as any).size === 'number'
            ) {
              stackProps[prop] = (val as any).size
            }
          }
        }

        // Additional diagnostics for router and handler objects
        const inspectObj = (objName: string) => {
          const obj = (app as any)[objName]
          if (!obj || typeof obj !== 'object') return null
          const details: any = { keys: Object.getOwnPropertyNames(obj) }
          details.symbols = Object.getOwnPropertySymbols(obj).map((s) =>
            s.toString()
          )
          details.keyTypes = {}
          for (const k of details.keys.slice(0, 50)) {
            const v = (obj as any)[k]
            details.keyTypes[k] = Array.isArray(v)
              ? `array:${v.length}`
              : typeof v
          }
          return details
        }

        const routerDetails = inspectObj('router')
        const handleDetails = inspectObj('handle')

        res.json({ results, stackProps, routerDetails, handleDetails })
      } catch (err) {
        console.error('Error inspecting router', err)
        res.status(500).json({ error: 'Failed to inspect router' })
      }
    })
  }

  // Error handling middleware - must be last
  app.use(errorHandler)

  // Debugging: inspect router at the end of server creation
  try {
    const hasRouter = !!(app as any)._router
    const stackLen =
      (app as any)._router && (app as any)._router.stack
        ? (app as any)._router.stack.length
        : 0
    console.log(
      'createServer - app._router present?',
      hasRouter,
      'stack length:',
      stackLen
    )
    const appKeys = Object.getOwnPropertyNames(app).slice(0, 50)
    console.log('createServer - app keys:', appKeys)
    if (hasRouter) {
      const routerKeys = Object.getOwnPropertyNames((app as any)._router).slice(
        0,
        50
      )
      console.log('createServer - router keys:', routerKeys)
    }
  } catch (err) {
    console.error('createServer router debug error:', err)
  }

  return app
}

export function startServer(): void {
  const app = createServer()
  const port = config.port

  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
    console.log(`Environment: ${config.env}`)

    // Log all registered routes for easier debugging
    try {
      // Helper: attempt to find where the router stack is stored on the app
      const findRouterStack = () => {
        const candidates = ['_router', 'router', 'handle']
        for (const c of candidates) {
          const obj = (app as any)[c]
          if (obj && typeof obj === 'object' && Array.isArray(obj.stack)) {
            return { prop: c, stack: obj.stack }
          }
        }
        // fallback: search any property that contains a stack array
        for (const p of Object.getOwnPropertyNames(app)) {
          const v = (app as any)[p]
          if (v && typeof v === 'object' && Array.isArray(v.stack)) {
            return { prop: p, stack: v.stack }
          }
        }
        return { prop: undefined, stack: [] as any[] }
      }

      const routerInfo = findRouterStack()
      console.log('router prop used on startup:', routerInfo.prop)
      const routes: Array<{ method: string; path: string }> = []
      const seen = new Set<string>()
      const walk = (stack: any[], prefix = '') => {
        for (const layer of stack) {
          if (!layer) continue
          // Final route
          if (layer.route && layer.route.path) {
            const methods = Object.keys(layer.route.methods || {})
            const fullPath = `${prefix}${layer.route.path}`
            for (const method of methods) {
              const key = `${method.toUpperCase()} ${fullPath}`
              if (!seen.has(key)) {
                seen.add(key)
                routes.push({ method: method.toUpperCase(), path: fullPath })
              }
            }
          } else if (layer.handle && layer.handle.stack) {
            // Router mounted; attempt to derive path from layer.regexp
            let mountPath = ''
            if (layer.regexp && layer.regexp.source) {
              // Turn the express regex back into a path approximation for readability
              const regexSource: string = layer.regexp.source
              mountPath = regexSource
                .replace('^\\/', '/')
                .replace('\\/?(?=\/|$)', '')
                .replace('(?=\/|$)', '')
                .replace('^', '')
                .replace('\\', '')
                .replace('(?:', '')
                .replace(')?', '')
            }
            walk(layer.handle.stack, prefix + mountPath)
          }
        }
      }

      walk(routerInfo.stack, '')

      // Also include routes that were captured during app.use calls (globalMountedRoutes)
      for (const m of globalMountedRoutes) {
        if (m.innerRoutes) {
          for (const r of m.innerRoutes) {
            const fullPath = `${m.mount}${r.path}`
            const key = `${r.method} ${fullPath}`
            if (!seen.has(key)) {
              seen.add(key)
              routes.push({ method: r.method, path: fullPath })
            }
          }
        } else {
          // If no inner routes are available, just log the mount path
          const key = `ALL ${m.mount}`
          if (!seen.has(key)) {
            seen.add(key)
            routes.push({ method: 'ALL', path: m.mount })
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
