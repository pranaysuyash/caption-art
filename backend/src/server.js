// Re-export createServer/startServer from the TypeScript file when available.
// Many test runners try to import `src/server` and depending on loader behavior
// this file may be resolved first. Instead of exporting an empty object we
// attempt to delegate to the TypeScript file so that named exports like
// `createServer` are available regardless of whether the test runtime is
// loading .js or .ts files.
// Lazy wrapper to re-export createServer/startServer from TypeScript file
// while ensuring the exported properties are immediately available to
// consumers who import this JS file (CJS). This avoids circular import
// issues where the TS file is required during module initialization and
// the named exports aren't yet bound.
function resolveTsModule() {
  try {
    // prefer TS source when available in dev/test environments
    const ts = require('./server.ts')
    return ts && ts.default ? ts.default : ts
  } catch (e) {
    // If we couldn't resolve the TS source (e.g., in a built environment
    // where only compiled JS exists), return null and let the lazy wrapper
    // throw a clearer error when invoked.
    return null
  }
}

function bindLazyExport(name) {
  let cached = null
  return function lazyBound(...args) {
    if (!cached) {
      const mod = resolveTsModule()
      cached = mod && (mod[name] || (mod.default && mod.default[name]))
      if (!cached) {
        throw new Error(
          `Could not resolve export \`${name}\` from server module`
        )
      }
    }
    return cached(...args)
  }
}

module.exports.createServer = bindLazyExport('createServer')
module.exports.startServer = bindLazyExport('startServer')
