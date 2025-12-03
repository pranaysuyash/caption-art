import request from 'supertest'
import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest'
import { log } from '../../src/middleware/logger'

describe('Export integration', () => {
  let app: any
  beforeEach(async () => {
    vi.resetModules()
    const serverModule = await import('../../src/server')
    const createServer =
      (serverModule as any).createServer ||
      (serverModule as any).default?.createServer
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
      .send({
        email: 'export-test@test.com',
        password: 'password',
        agencyName: 'Export Test',
      })
      .expect(200)

    // Create workspace
    const wsResp = await agent
      .post('/api/workspaces')
      .send({ clientName: 'Export Client' })
      .expect(201)
    log.debug(
      { body: wsResp.body },
      'Export integration test workspace response'
    )
    const workspaceId = wsResp.body.workspace.id

    // Create minimal brand kit
    const brandResp = await agent.post('/api/brand-kits').send({
      workspaceId,
      colors: {
        primary: '#000000',
        secondary: '#111111',
        tertiary: '#222222',
      },
      fonts: { heading: 'Inter', body: 'Roboto' },
      voicePrompt: 'Friendly and concise',
    })
    log.debug(
      { status: brandResp.status, body: brandResp.body },
      'Brand kit response'
    )
    expect(brandResp.status).toBe(201)

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
    const approveResp = await agent
      .put(`/api/approval/captions/${caption.id}/approve`)
      .expect(200)
    expect(approveResp.body.caption.approvalStatus).toBe('approved')

    // Query runtime route listing (best-effort) - do not rely on it for logic
    const routesResp = await agent.get('/api/_routes').expect(200)
    log.debug({ routes: routesResp.body }, 'All routes in server')

    // Now start export
    const startResp = await agent
      .post(`/api/export/workspace/${workspaceId}/start`)
      .expect(201)
    expect(startResp.body.jobId).toBeDefined()
    expect(startResp.body.message).toMatch(/Export started for/)

    // Check that job exists via GET jobs
    const jobsResp = await agent
      .get(`/api/export/workspace/${workspaceId}/jobs`)
      .expect(200)
    expect(Array.isArray(jobsResp.body.jobs)).toBeTruthy()
    expect(jobsResp.body.jobs.length).toBeGreaterThanOrEqual(1)
  }, 10000)
})
