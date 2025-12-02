import { Router } from 'express'
import { z } from 'zod'
import { AuthModel, Campaign } from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
console.log('Initializing campaigns router')
const requireAuth = createAuthMiddleware() as any

// Schema validation
const createCampaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  description: z.string().optional(),
  brandKitId: z.string().min(1, 'Brand kit ID is required'),
  objective: z.enum(['awareness', 'traffic', 'conversion', 'engagement']),
  launchType: z.enum(['new-launch', 'evergreen', 'seasonal', 'sale', 'event']),
  funnelStage: z.enum(['cold', 'warm', 'hot']),
  primaryOffer: z.string().optional(),
  primaryCTA: z.string().optional(),
  secondaryCTA: z.string().optional(),
  targetAudience: z.string().optional(),
  placements: z.array(z.enum(['ig-feed', 'ig-story', 'fb-feed', 'fb-story', 'li-feed'])),
  headlineMaxLength: z.number().optional(),
  bodyMaxLength: z.number().optional(),
  mustIncludePhrases: z.array(z.string()).optional(),
  mustExcludePhrases: z.array(z.string()).optional(),
})

const updateCampaignSchema = createCampaignSchema.partial()

// Debug middleware
router.use((req, res, next) => {
  console.log('CAMPAIGNS ROUTER REQ:', req.method, req.path)
  next()
})

// POST /api/campaigns - Create new campaign
router.post('/', requireAuth, async (req, res) => {
  console.log('Creating campaign')
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const validatedData = createCampaignSchema.parse(req.body)

    // Verify brand kit exists and belongs to agency's workspace
    const brandKit = AuthModel.getBrandKitById(validatedData.brandKitId)
    if (!brandKit) {
      return res.status(404).json({ error: 'Brand kit not found' })
    }

    const workspace = AuthModel.getWorkspaceById(brandKit.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const campaign = await AuthModel.createCampaign({
      workspaceId: brandKit.workspaceId,
      brandKitId: validatedData.brandKitId,
      name: validatedData.name,
      description: validatedData.description,
      objective: validatedData.objective,
      launchType: validatedData.launchType,
      funnelStage: validatedData.funnelStage,
      primaryOffer: validatedData.primaryOffer,
      primaryCTA: validatedData.primaryCTA,
      secondaryCTA: validatedData.secondaryCTA,
      targetAudience: validatedData.targetAudience,
      placements: validatedData.placements,
      headlineMaxLength: validatedData.headlineMaxLength,
      bodyMaxLength: validatedData.bodyMaxLength,
      mustIncludePhrases: validatedData.mustIncludePhrases,
      mustExcludePhrases: validatedData.mustExcludePhrases,
    })

    res.status(201).json({ campaign })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues })
    }
    console.error('Create campaign error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/campaigns - List campaigns for agency
router.get('/', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const workspaceId = req.query.workspaceId as string

    if (workspaceId) {
      // Verify workspace belongs to agency
      const workspace = AuthModel.getWorkspaceById(workspaceId)
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const campaigns = AuthModel.getCampaignsByWorkspace(workspaceId)
      res.json({ campaigns })
    } else {
      // Get all campaigns for agency
      const campaigns = AuthModel.getCampaignsByAgency(authenticatedReq.agency.id)
      res.json({ campaigns })
    }
  } catch (error) {
    console.error('List campaigns error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/campaigns/:id - Get specific campaign
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const campaign = AuthModel.getCampaignById(id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Verify campaign belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Enrich with brand kit and reference creatives
    const brandKit = AuthModel.getBrandKitById(campaign.brandKitId)
    const referenceCreatives = AuthModel.getReferenceCreativesByCampaign(id)

    res.json({
      campaign,
      brandKit,
      referenceCreatives
    })
  } catch (error) {
    console.error('Get campaign error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/campaigns/:id - Update campaign
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params
    const validatedData = updateCampaignSchema.parse(req.body)

    const campaign = AuthModel.getCampaignById(id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Verify campaign belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updatedCampaign = await AuthModel.updateCampaign(id, validatedData)
    res.json({ campaign: updatedCampaign })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.issues })
    }
    console.error('Update campaign error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const campaign = AuthModel.getCampaignById(id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Verify campaign belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const deleted = AuthModel.deleteCampaign(id)
    if (!deleted) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    res.json({ message: 'Campaign deleted successfully' })
  } catch (error) {
    console.error('Delete campaign error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/campaigns/:id/launch - Launch campaign (set status to active)
router.post('/:id/launch', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const campaign = AuthModel.getCampaignById(id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Verify campaign belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const launchedCampaign = await AuthModel.updateCampaign(id, { status: 'active' })
    res.json({ campaign: launchedCampaign })
  } catch (error) {
    console.error('Launch campaign error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/campaigns/:id/pause - Pause campaign
router.post('/:id/pause', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const campaign = AuthModel.getCampaignById(id)
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Verify campaign belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(campaign.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const pausedCampaign = await AuthModel.updateCampaign(id, { status: 'paused' })
    res.json({ campaign: pausedCampaign })
  } catch (error) {
    console.error('Pause campaign error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router