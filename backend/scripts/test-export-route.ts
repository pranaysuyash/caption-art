import request from 'supertest'
import { createServer } from '../src/server'
import { log } from '../src/middleware/logger'

async function run() {
  const app = createServer()

  // List export router stack
  const exportRouter = require('../src/routes/export').default
  log.info(
    { length: (exportRouter as any).stack.length },
    'exportRouter.stack length'
  )

  // Test POST /api/export/workspace/:workspaceId/start
  const res = await request(app)
    .post('/api/export/workspace/workspace_1764656042703_qnqphg9dc/start')
    .set('Content-Type', 'application/json')
  log.info(
    { status: res.status, body: res.text },
    'POST /api/export/.../start result'
  )
}

run().catch((err) => {
  log.error({ err }, 'Unhandled error in test-export-route')
  process.exit(1)
})
