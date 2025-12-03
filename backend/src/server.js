// JS shim to always load the latest TypeScript server implementation
// Works in Vitest/vite-node by registering ts-node transpile-only.
try {
  require('ts-node/register/transpile-only')
} catch (e) {
  // If ts-node is unavailable, we'll fall back to compiled dist output.
}

let mod = {}
try {
  mod = require('./server.ts')
} catch (e) {
  try {
    mod = require('../dist/server.js')
  } catch (e2) {
    mod = {}
  }
}

module.exports = {
  createServer: mod.createServer || (mod.default && mod.default.createServer),
  startServer: mod.startServer || (mod.default && mod.default.startServer),
}
