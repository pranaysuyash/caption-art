import request from 'supertest'
import { createServer } from '../src/server'
import { log } from '../src/middleware/logger'

async function run() {
  const app = createServer({ enableRateLimiter: false })
  const agent = request.agent(app)

  await agent.post('/api/auth/signup').send({
    email: 'export-test@test.com',
    password: 'password',
    agencyName: 'Export Test',
  })
  const wsResp = await agent
    .post('/api/workspaces')
    .send({ clientName: 'Export Client' })
  log.debug({ status: wsResp.status }, 'workspace created')
  log.debug({ text: wsResp.text }, 'workspace raw text')
  log.debug(
    { keys: Object.keys(wsResp.body || {}) },
    'workspace body object keys'
  )
  const workspaceId = wsResp.body.workspace.id

  const brandResp = await agent.post('/api/brand-kits').send({
    workspaceId,
    colors: { primary: '#000000', secondary: '#111111', tertiary: '#222222' },
    fonts: { heading: 'Inter', body: 'Roboto' },
    voicePrompt: 'Friendly and concise',
  })
  log.debug(
    { status: brandResp.status, body: brandResp.body },
    'brand response'
  )
}

run().catch((e) => {
  log.error({ err: e }, 'Error in debug script')
  process.exit(1)
})
