import { createServer } from '../src/server'

const app = createServer()

const routes: string[] = []

function walk(stack: any[], prefix = '') {
  for (const layer of stack) {
    if (layer.route && layer.route.path) {
      const methods = Object.keys(layer.route.methods)
        .map((m) => m.toUpperCase())
        .join(',')
      routes.push(`${methods} ${prefix}${layer.route.path}`)
    } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
      let layerPath = ''
      if (layer.regexp && layer.regexp.fast_star) {
        layerPath = ''
      } else if (layer.regexp && layer.regexp.source) {
        const source = layer.regexp.source
        // Express 5 layer.regexp.source often looks like '^\\/api\\/export\\/?(?=\\\/|$)'
        const matched = source.match(/\/api\/(\w[-\w]*)/)
        if (matched) {
          layerPath = '/api/' + matched[1]
        } else {
          // Attempt to build from regexp - this is best effort
          layerPath = ''
        }
      }
      walk(layer.handle.stack, prefix + layerPath)
    }
  }
}

if ((app as any)._router && (app as any)._router.stack) {
  walk((app as any)._router.stack)
}

console.log(routes)
