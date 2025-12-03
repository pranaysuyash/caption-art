import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import { log } from './middleware/logger'

const app = express()

app.use(express.json())

// Simple test route
app.get('/test', (req, res) => {
  res.json({ message: 'Server is working!' })
})

// Test the health route directly
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

const port = process.env.PORT || 3001

app.listen(port, () => {
  log.info({ port }, 'Test server running')
})
