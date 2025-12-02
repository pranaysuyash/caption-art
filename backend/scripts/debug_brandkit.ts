import request from 'supertest'
import { createServer } from '../src/server'

async function run() {
  const app = createServer({ enableRateLimiter: false })
  const agent = request.agent(app)

  await agent
    .post('/api/auth/signup')
    .send({
      email: 'export-test@test.com',
      password: 'password',
      agencyName: 'Export Test',
    })
  const wsResp = await agent
    .post('/api/workspaces')
    .send({ clientName: 'Export Client' })
  console.log('workspace created status', wsResp.status)
  console.log('workspace raw text:', wsResp.text)
  console.log('workspace body object keys:', Object.keys(wsResp.body || {}))
  const workspaceId = wsResp.body.workspace.id

  const brandResp = await agent
    .post('/api/brand-kits')
    .send({
      workspaceId,
      colors: { primary: '#000000', secondary: '#111111', tertiary: '#222222' },
      fonts: { heading: 'Inter', body: 'Roboto' },
      voicePrompt: 'Friendly and concise',
    })
  console.log('brandResp', brandResp.status, brandResp.body)
}

run().catch((e) => {
  console.error('Error in debug script', e)
  process.exit(1)
})
