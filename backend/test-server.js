#!/usr/bin/env node

const { createServer } = require('./dist/server.js')
const { log } = require('./dist/middleware/logger.js')

try {
  const app = createServer()
  const port = process.env.PORT || 3001

  app.listen(port, () => {
    log.info(
      { port, environment: process.env.NODE_ENV || 'development' },
      'Server running'
    )
  })
} catch (error) {
  log.error({ err: error }, 'Failed to start server')
  process.exit(1)
}
