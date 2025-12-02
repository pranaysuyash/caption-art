import { createServer } from '../src/server'

const app = createServer()
const stack = (app as any)._router ? (app as any)._router.stack : []

function formatLayer(layer: any): any {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase()).join(',')
    return `${methods} ${layer.route.path}`
  }

  if (layer.name === 'router' && layer.handle && layer.handle.stack) {
    const regexpSource = layer.regexp && layer.regexp.source ? layer.regexp.source : ''
    // Convert ^\/? to '/'
    const basePath = regexpSource
      .replace('^\\/', '/')
      .replace('\\/?$', '')
      .replace('\\/', '/')

    const nested = layer.handle.stack.map(formatLayer).filter(Boolean)
    return nested.map((n: any) => `${basePath} ${n}`)
  }

  if (layer.name) {
    return layer.name
  }

  return null
}

const routes: string[] = []
for (const layer of stack) {
  const r = formatLayer(layer)
  if (r) {
    if (Array.isArray(r)) routes.push(...r)
    else routes.push(r)
  }
}

console.log(JSON.stringify(routes, null, 2))
