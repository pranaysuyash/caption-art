import request from 'supertest'
import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Approval API shape', () => {
  let app: any
  beforeEach(async () => {
    vi.resetModules()
    const { createServer } = await import('../../src/server')
    app = createServer({ enableRateLimiter: false })
  })

  it('should include approvalStatus and approved boolean consistently', async () => {
    const agent = request.agent(app)
    await agent.post('/api/auth/signup').send({ email: 'approval@test.com', password: 'password', agencyName: 'Approval Test' }).expect(200)
    const wsResp = await agent.post('/api/workspaces').send({ clientName: 'Approval Client' }).expect(201)
    const workspaceId = wsResp.body.workspace.id

    // Create brand kit
    await agent.post('/api/brand-kits').send({ workspaceId, colors: { primary: '#000', secondary: '#111', tertiary: '#222' }, fonts: { heading: 'Inter', body: 'Roboto' }, voicePrompt: 'Friendly and concise' }).expect(201)

    // Upload asset
    const uploadResp = await agent.post('/api/assets/upload').field('workspaceId', workspaceId).attach('files', `${process.cwd()}/test-image.png`).expect(201)
    const asset = uploadResp.body.assets[0]

    // Create caption via AuthModel and approve
    const { AuthModel } = await import('../../src/models/auth')
    const caption = AuthModel.createCaption(asset.id, workspaceId)
    const approveResp = await agent.put(`/api/approval/captions/${caption.id}/approve`).expect(200)

    // Verify approve endpoint returns caption with approvalStatus and approved boolean
    expect(approveResp.body.caption.approvalStatus).toBe('approved')
    expect(approveResp.body.caption.approved).toBe(true)

    // Verify grid includes approved boolean
    const gridResp = await agent.get(`/api/approval/workspace/${workspaceId}/grid`).expect(200)
    const gridItem = gridResp.body.grid.find((g: any) => g.asset && g.asset.id === asset.id)
    expect(gridItem).toBeDefined()
    expect(gridItem.caption.approvalStatus).toBe('approved')
    expect(gridItem.caption.approved).toBe(true)
  }, 10000)
})
