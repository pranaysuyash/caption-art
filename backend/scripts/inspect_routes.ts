import { createServer } from '../src/server'
import { log } from '../src/middleware/logger'

async function inspect() {
  const app = createServer({ enableRateLimiter: false })
  const routerObj =
    (app as any)._router || (app as any).router || (app as any).app || undefined
  log.debug(
    { topLevelKeys: Object.getOwnPropertyNames(app).slice(0, 40) },
    'Top-level keys on app'
  )
  if (routerObj)
    log.debug(
      { routerKeys: Object.getOwnPropertyNames(routerObj).slice(0, 40) },
      'Router object keys'
    )
  const stack = routerObj && routerObj.stack ? routerObj.stack : []
  const routes: Array<{ method: string; path: string }> = []

  const walk = (stackItems: any[], prefix = '') => {
    for (const layer of stackItems) {
      if (!layer) continue
      if (layer.route && layer.route.path) {
        const path = `${prefix}${layer.route.path}`
        const methods = Object.keys(layer.route.methods || {})
        for (const method of methods) {
          routes.push({ method: method.toUpperCase(), path })
        }
      } else if (layer.handle && layer.handle.stack) {
        let mount = ''
        if (layer.regexp && layer.regexp.source) {
          mount = layer.regexp.source
            .replace('^\\/', '/')
            .replace('\\/?(?=\/|$)', '')
            .replace('(?=\/|$)', '')
            .replace('^', '')
            .replace('\\', '')
            .replace('(?:', '')
            .replace(')?', '')
        }
        walk(layer.handle.stack, prefix + mount)
      }
    }
  }
  walk(stack, '')

  log.info({ routes }, 'Discovered routes')
}

inspect()
