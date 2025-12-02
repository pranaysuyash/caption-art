import request from 'supertest'
import { createServer } from '../src/server'

async function run() {
  const app = createServer()

  // List export router stack
  const exportRouter = require('../src/routes/export').default
  console.log('exportRouter.stack length:', (exportRouter as any).stack.length)

  // Test POST /api/export/workspace/:workspaceId/start
  const res = await request(app)
    .post('/api/export/workspace/workspace_1764656042703_qnqphg9dc/start')
    .set('Content-Type', 'application/json')
  console.log('POST /api/export/.../start status:', res.status)
  console.log('Body:', res.text)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
