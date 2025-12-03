import dotenv from 'dotenv'
// Load environment variables before anything else
dotenv.config()

import express from 'express'
import cookieParser from 'cookie-parser'
import path from 'path'
import { config } from './config'
import { corsMiddleware } from './middleware/cors'
import { requestIdMiddleware } from './middleware/requestId'
import { wafMiddleware } from './middleware/waf'
import { errorHandler } from './middleware/errorHandler'
import { requestLogger, log } from './middleware/logger'
// import { rateLimiter } from './middleware/rateLimiter'

// Pre-declare exports as function stubs to avoid circular dependency issues
// These will be reassigned below after actual function definitions
// Export mutable bindings so tests that import createServer can get the
// up-to-date implementation even when circular dependencies exist.
// Export named functions directly so the function bindings are defined
// immediately at module evaluation time. This avoids intermittent
// "createServer is not a function" errors when other modules import the
// server during a circular dependency.
export function createServer(
  options: { enableRateLimiter?: boolean; loadRoutes?: boolean } = {}
) {
  return createServerImpl(options)
}

export function startServer(): void {
  return startServerImpl()
}

if (process.env.NODE_ENV === 'test') {
  // eslint-disable-next-line no-console
  console.log(
    '[server.ts] module evaluated (test) createServer type:',
    typeof createServer
  )
}

// Attach to CommonJS exports directly to ensure the bindings exist for
// consumers that access module.exports (and for circular import cases).
// This is safe because we export the named functions above and only need to
// ensure the properties are present immediately on module.exports.
;(module as any).exports.createServer = createServer
;(module as any).exports.startServer = startServer

// Ensure module.exports contains named and default exports for all module
// loaders (CommonJS and ESM interop). This helps in test environments that
// import CommonJS modules using ESM syntax and expect named exports.
Object.assign((module as any).exports, {
  createServer,
  startServer,
})
// Avoid explicitly touching module.exports.__esModule - it may be read-only
// in some loaders (e.g., ts-node), and adding it can cause TypeError.

// Minimal debug outputs to verify module.exports shape in the test environment.
// Kept minimal to reduce noisy warnings; this is only used to validate the
// shape of exports during a test run.
if (process.env.NODE_ENV === 'test') {
  // eslint-disable-next-line no-console
  console.log(
    '[server.ts] module.exports keys after assignment:',
    Object.keys(module.exports || {})
  )
}

// Also provide a default export that exposes the current bindings. This keeps
// backwards compatibility with code that imports the default and expects an
// object with createServer/startServer getters.
// No default export - keep only named exports. This avoids ESM/CJS interop
// issues where dynamic import only exposes `default` and not named exports.

// Global route registry to make route information accessible across functions
let globalMountedRoutes: Array<{
  mount: string
  innerRoutes?: Array<{ method: string; path: string }>
}> = []

function createServerImpl(
  options: { enableRateLimiter?: boolean; loadRoutes?: boolean } = {}
) {
  const { enableRateLimiter = true, loadRoutes = true } = options
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
      log.error({ err }, 'Failed to extract inner routes from handler')
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
  // 1b. WAF middleware to block known suspicious payloads when enabled
  app.use(wafMiddleware)

  // 2. Request id assignment and Logger to track all requests
  app.use(requestIdMiddleware)
  app.use(requestLogger)

  // 3. Cookie parser for session management
  app.use(cookieParser())

  // 4. JSON body parser
  app.use(express.json({ limit: '10mb' }))

  // 5. Serve static files from uploads and generated directories
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))
  app.use('/generated', express.static(path.join(process.cwd(), 'generated')))

  // 6. Cost-weighted rate limiter for API routes (can be disabled for testing)
  if (enableRateLimiter) {
    // Lazy-load to avoid circular dependency through AuthModel
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {
      createCostWeightedRateLimiter,
    } = require('./middleware/costWeightedRateLimiter')
    const costWeightedRateLimiter = createCostWeightedRateLimiter({
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxPoints: 500, // Default max points, will be adjusted based on user tier
    })
    app.use('/api/', costWeightedRateLimiter)
  }

  // Lazy-load route modules to break circular dependencies (optional in tests)
  // When loadRoutes is false, we avoid requiring route modules to make the
  // server constructable in unit tests that don't need full routing setup.
  let authRouter, workspacesRouter, brandKitsRouter
  let assetsRouter, batchRouter, approvalRouter, exportRouter
  let generatedAssetsRouter, captionRouter, maskRouter, verifyRouter
  let healthRouter, storyRouter, campaignsRouter, referenceCreativesRouter
  let creativeEngineRouter, analyzeStyleRouter, campaignBriefsRouter
  let adCreativesRouter, styleMemoryRouter, videoScriptsRouter
  let multiFormatRouter, styleSynthesisRouter, videoRendererRouter
  let publishingRouter, dashboardRouter
  if (loadRoutes) {
    // Lazy-load route modules only when requested
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const authRouter = require('./routes/auth').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const workspacesRouter = require('./routes/workspaces').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const brandKitsRouter = require('./routes/brandKits').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const assetsRouter = require('./routes/assets').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const batchRouter = require('./routes/batch').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const approvalRouter = require('./routes/approval').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const exportRouter = require('./routes/export').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const generatedAssetsRouter = require('./routes/generatedAssets').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const captionRouter = require('./routes/caption').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const maskRouter = require('./routes/mask').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const verifyRouter = require('./routes/verify').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const healthRouter = require('./routes/health').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const storyRouter = require('./routes/story').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const campaignsRouter = require('./routes/campaigns').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const referenceCreativesRouter =
      require('./routes/referenceCreatives').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const creativeEngineRouter = require('./routes/creativeEngine').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const analyzeStyleRouter = require('./routes/analyzeStyle').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const campaignBriefsRouter = require('./routes/campaignBriefs').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const adCreativesRouter = require('./routes/adCreatives').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const styleMemoryRouter = require('./routes/styleMemory').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const videoScriptsRouter = require('./routes/videoScripts').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const multiFormatRouter = require('./routes/multiFormat').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const styleSynthesisRouter = require('./routes/styleSynthesis').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const videoRendererRouter = require('./routes/videoRenderer').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const publishingRouter = require('./routes/publishing').default
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const dashboardRouter = require('./routes/dashboard').default

    // Routes (auth first, then workspaces, brand kits, assets, batch, approval, export, generated assets, then existing routes)
    app.use('/api/auth', authRouter)
    app.use('/api/workspaces', workspacesRouter)
    app.use('/api/brand-kits', brandKitsRouter)
    app.use('/api/assets', assetsRouter)
    app.use('/api/batch', batchRouter)
    app.use('/api/approval', approvalRouter)

    // Lazy-load createAuthMiddleware, AuthModel, and ExportService to avoid circular dependency
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { createAuthMiddleware } = require('./routes/auth')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { AuthModel } = require('./models/auth')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ExportService } = require('./services/exportService')

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
          log.error({ err: error }, 'Start export error (fallback route)')
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
    app.use('/api/analyze-style', analyzeStyleRouter)
    app.use('/api/campaign-briefs', campaignBriefsRouter)
    app.use('/api/ad-creatives', adCreativesRouter)
    app.use('/api/style-memory', styleMemoryRouter)
    app.use('/api/video-scripts', videoScriptsRouter)
    app.use('/api/multi-format', multiFormatRouter)
    app.use('/api/style-synthesis', styleSynthesisRouter)
    app.use('/api/video-renderer', videoRendererRouter)
    app.use('/api/publishing', publishingRouter)
    app.use('/api/dashboard', dashboardRouter)
  }

  // Simple test route to debug route registration
  log.info({ env: process.env.NODE_ENV }, 'NODE_ENV value on startup')
  log.info('Setting up dev-only debug routes')
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
        log.error({ err }, 'Error listing full routes')
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
        log.error({ err }, 'Error listing routes')
        res.status(500).json({ error: 'Failed to list routes' })
      }
    })

    // Debug route to inspect internal router object keys and stack length
    log.info('Registering debug route /api/_debug_router')
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
        log.error({ err }, 'Error inspecting router')
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
    log.info(
      { hasRouter, stackLen },
      'createServer - app._router present? stack length'
    )
    const appKeys = Object.getOwnPropertyNames(app).slice(0, 50)
    log.info({ appKeys }, 'createServer - app keys')
    if (hasRouter) {
      const routerKeys = Object.getOwnPropertyNames((app as any)._router).slice(
        0,
        50
      )
      log.info({ routerKeys }, 'createServer - router keys')
    }
  } catch (err) {
    log.error({ err }, 'createServer router debug error')
  }

  return app
}

function startServerImpl(): void {
  const app = createServer()
  const port = config.port

  app.listen(port, () => {
    log.info({ port }, `Server running on port ${port}`)
    log.info({ env: config.env }, `Environment`)

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
      log.info({ routerProp: routerInfo.prop }, 'router prop used on startup')
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

      log.info({ routes }, 'Registered routes')
    } catch (error) {
      log.error({ error }, 'Failed to list routes on startup')
    }
  })
}

// Note: export functions createServer/startServer are thin wrappers that
// delegate to the actual implementations createServerImpl/startServerImpl.
// This keeps the export bindings stable while allowing us to keep the
// implementation functions private.

// Debug: Log when module is fully evaluated
// Debug: print exports and module.exports details to help diagnose circular
// import timing issues where consumers may see undefined bindings.
// Module-level debug logging disabled to avoid triggering module export
// access timing warnings; this would read module.exports while the module is
// still being evaluated and may result in misleading circular dependency
// warnings.

// Start server if this file is run directly
if (require.main === module) {
  startServer()
}
