import { createServer } from './src/server'

const app = createServer({ enableRateLimiter: false })

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

console.log(routes)
