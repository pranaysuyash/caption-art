#!/usr/bin/env node

const { createServer } = require('./dist/server.js')

try {
  const app = createServer()
  const port = process.env.PORT || 3001

  app.listen(port, () => {
    console.log(`Server running on port ${port}`)
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
  })
} catch (error) {
  console.error('Failed to start server:', error)
  process.exit(1)
}