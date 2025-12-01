import request from 'supertest'
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'

describe('Export integration', () => {
  let app: any
  beforeEach(async () => {
    vi.resetModules()
    const { createServer } = await import('../../src/server')
    app = createServer({ enableRateLimiter: false })
  })

  afterEach(() => {
    // reset modules again
    vi.resetModules()
  })

  it('should start an export job when approved captions exist', async () => {
    // Signup
    const agent = request.agent(app)
    const signupResp = await agent
      .post('/api/auth/signup')
      .send({ email: 'export-test@test.com', password: 'password', agencyName: 'Export Test' })
      .expect(200)

    // Create workspace
    const wsResp = await agent
      .post('/api/workspaces')
      .send({ clientName: 'Export Client' })
      .expect(201)
    const workspaceId = wsResp.body.workspace.id

    // Create minimal brand kit
    await agent
      .post('/api/brand-kits')
      .send({ workspaceId, colors: { primary: '#000', secondary: '#111', tertiary: '#222' }, fonts: { heading: 'Inter', body: 'Roboto' }, voicePrompt: 'Friendly and concise' })
      .expect(201)

    // Upload an asset (use repo test-image.png)
    const uploadResp = await agent
      .post('/api/assets/upload')
      .field('workspaceId', workspaceId)
      .attach('files', `${process.cwd()}/test-image.png`)
      .expect(201)

    const asset = uploadResp.body.assets[0]
    expect(asset).toBeDefined()

    // Create a caption using AuthModel to avoid AI dependency
    const { AuthModel } = await import('../../src/models/auth')
    const caption = AuthModel.createCaption(asset.id, workspaceId)

    // Approve the caption via API
    const approveResp = await agent.put(`/api/approval/captions/${caption.id}/approve`).expect(200)
    expect(approveResp.body.caption.approvalStatus).toBe('approved')

    // Confirm export POST route is mounted in router
    const routesResp = await agent.get('/api/_routes').expect(200)
    const hasStartRoute = routesResp.body.routes.some((r: any) => r.path === '/workspace/:workspaceId/start' && r.method === 'POST')
    expect(hasStartRoute).toBeTruthy()

    // Now start export
    const startResp = await agent.post(`/api/export/workspace/${workspaceId}/start`).expect(201)
    expect(startResp.body.jobId).toBeDefined()
    expect(startResp.body.message).toMatch(/Export started for/)

    // Check that job exists via GET jobs
    const jobsResp = await agent.get(`/api/export/workspace/${workspaceId}/jobs`).expect(200)
    expect(Array.isArray(jobsResp.body.jobs)).toBeTruthy()
    expect(jobsResp.body.jobs.length).toBeGreaterThanOrEqual(1)
  }, 10000)
})

