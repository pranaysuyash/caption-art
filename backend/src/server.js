// Re-export createServer/startServer from the TypeScript file when available.
// Many test runners try to import `src/server` and depending on loader behavior
// this file may be resolved first. Instead of exporting an empty object we
// attempt to delegate to the TypeScript file so that named exports like
// `createServer` are available regardless of whether the test runtime is
// loading .js or .ts files.
try {
  // Attempt to require the TS file directly (ts-node/register or the test
  // environment often makes this possible). If not available, this will
  // throw and fall back to an empty export to avoid hard failures.
  const tsModule = require('./server.ts')
  if (tsModule && typeof tsModule.createServer === 'function') {
    module.exports.createServer = tsModule.createServer
    if (typeof tsModule.startServer === 'function') {
      module.exports.startServer = tsModule.startServer
    }
  } else if (
    tsModule &&
    tsModule.default &&
    typeof tsModule.default.createServer === 'function'
  ) {
    // Some setups put named exports under `default` when transpiling ESM to CJS.
    module.exports.createServer = tsModule.default.createServer
    if (tsModule.default.startServer) {
      module.exports.startServer = tsModule.default.startServer
    }
  } else {
    module.exports = {}
  }
} catch (err) {
  // If requiring the TS file fails, try a direct require of compiled JS
  // (e.g., during build). If that also fails, remain a no-op object so tests
  // that import `src/server` can still run and fail less catastrophically.
  try {
    const compiled = require('./server')
    if (compiled && typeof compiled.createServer === 'function') {
      module.exports.createServer = compiled.createServer
      if (typeof compiled.startServer === 'function') {
        module.exports.startServer = compiled.startServer
      }
    } else {
      module.exports = {}
    }
  } catch (err2) {
    module.exports = {}
  }
}
