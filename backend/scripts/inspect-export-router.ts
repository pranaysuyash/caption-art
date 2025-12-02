import exportRouter from '../src/routes/export'

const stack = (exportRouter as any).stack
console.log('exportRouter.stack length:', stack ? stack.length : 0)

function formatLayer(layer: any): any {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods)
      .map((m) => m.toUpperCase())
      .join(',')
    return `${methods} ${layer.route.path}`
  }
  if (layer.name === 'router' && layer.handle && layer.handle.stack) {
    const nested = layer.handle.stack.map(formatLayer).filter(Boolean)
    return nested.map((n: any) => `${n}`)
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
