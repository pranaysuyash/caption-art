import { Router } from 'express'
import { z } from 'zod'
import { getPrismaClient } from '../lib/prisma'
import { createAuthMiddleware } from '../routes/auth'
import { validateRequest } from '../middleware/validation'
import { AuthenticatedRequest } from '../types/auth'
import { CreateCampaignSchema } from '../schemas/validation'
import { log } from '../middleware/logger'

const router = Router()
const prisma = getPrismaClient()
log.info('Initializing campaigns router')
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
  placements: z.array(
    z.enum(['ig-feed', 'ig-story', 'fb-feed', 'fb-story', 'li-feed'])
  ),
  referenceCaptions: z.array(z.string()).optional(),
  headlineMaxLength: z.number().optional(),
  bodyMaxLength: z.number().optional(),
  mustIncludePhrases: z.array(z.string()).optional(),
  mustExcludePhrases: z.array(z.string()).optional(),
})

const updateCampaignSchema = createCampaignSchema.partial()

// Debug middleware
router.use((req, res, next) => {
  log.debug({ method: req.method, path: req.path }, 'CAMPAIGNS ROUTER REQ')
  next()
})

// POST /api/campaigns - Create new campaign
router.post(
  '/',
  requireAuth,
  validateRequest({ body: CreateCampaignSchema }),
  async (req, res) => {
    log.info('Creating campaign')
    console.log('Create campaign: req.body', JSON.stringify(req.body))
    log.info({ body: req.body }, 'Create campaign payload')
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      let validatedData = req.body
      // Sanitize textual fields
      const { sanitizeText } = await import('../utils/sanitizers')
      validatedData = {
        ...validatedData,
        name: sanitizeText(validatedData.name, 200) || validatedData.name,
        description:
          sanitizeText(validatedData.description, 1000) ||
          validatedData.description,
        primaryCTA:
          sanitizeText(validatedData.primaryCTA, 50) ||
          validatedData.primaryCTA,
        secondaryCTA:
          sanitizeText(validatedData.secondaryCTA, 50) ||
          validatedData.secondaryCTA,
      }

      let workspaceId = validatedData.workspaceId
      let brandKitId = validatedData.brandKitId

      // Defensive defaults and type checks to prevent runtime errors
      if (
        !validatedData.placements ||
        !Array.isArray(validatedData.placements)
      ) {
        log.warn(
          { placements: validatedData.placements },
          'Missing or invalid placements; defaulting to ig-feed'
        )
        validatedData.placements = ['ig-feed']
      }
      // Ensure brandKitId is undefined when not provided (Prisma prefers null/undefined over empty string)
      if (!brandKitId) brandKitId = undefined

      // Resolve workspace from brand kit if provided
      if (brandKitId) {
        const brandKit = await prisma.brandKit.findUnique({
          where: { id: brandKitId },
        })
        if (!brandKit) {
          return res.status(404).json({ error: 'Brand kit not found' })
        }
        workspaceId = brandKit.workspaceId
      }

      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      })
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Build briefData JSON object for schema fields that don't exist on Campaign
      const briefData: any = {
        objective: validatedData.objective,
        launchType: validatedData.launchType,
        funnelStage: validatedData.funnelStage,
        placements: validatedData.placements || ['ig-feed'],
        headlineMaxLength: validatedData.headlineMaxLength || null,
        bodyMaxLength: validatedData.bodyMaxLength || null,
        mustIncludePhrases: validatedData.mustIncludePhrases || null,
        mustExcludePhrases: validatedData.mustExcludePhrases || null,
        referenceCaptions: validatedData.referenceCaptions || null,
      }

      // Print placements for debugging to stdout for easier debugging
      console.log('Create campaign payload placements:', JSON.stringify(validatedData.placements))
      log.info(
        { workspaceId, brandKitId, validatedData, briefData },
        'Campaign creation debug'
      )
      const campaign = await prisma.campaign.create({
        data: {
          workspaceId,
          brandKitId: brandKitId || undefined,
          name: validatedData.name,
          description: validatedData.description,
          callToAction:
            validatedData.primaryCTA || validatedData.primaryCTA || null,
          primaryOffer: validatedData.primaryOffer || null,
          targetAudience: validatedData.targetAudience || null,
          // pack additional fields into briefData JSON column
          briefData,
          status: 'draft',
        },
      })

      res.status(201).json({ campaign })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Validation error', details: error.issues })
      }
      log.error(
        {
          error: error instanceof Error ? error.message : error,
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Create campaign error'
      )
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/campaigns - List campaigns for agency
router.get('/', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const workspaceId = req.query.workspaceId as string

    if (workspaceId) {
      // Verify workspace belongs to agency
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      })
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const campaigns = await prisma.campaign.findMany({
        where: { workspaceId },
      })
      res.json({ campaigns })
    } else {
      // Get all campaigns for agency by finding workspaces first
      const workspaces = await prisma.workspace.findMany({
        where: { agencyId: authenticatedReq.agency.id },
        select: { id: true },
      })
      const workspaceIds = workspaces.map((w) => w.id)

      const campaigns = await prisma.campaign.findMany({
        where: { workspaceId: { in: workspaceIds } },
      })
      res.json({ campaigns })
    }
  } catch (error) {
    log.error({ error }, 'List campaigns error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/campaigns/:id - Get specific campaign
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        brandKit: true,
      },
    })
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Verify campaign belongs to agency via workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: campaign.workspaceId },
    })
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get reference creatives
    const referenceCreatives = await prisma.adCreative.findMany({
      where: { campaignId: id },
      take: 5, // Limit to first 5 as references
    })

    res.json({
      campaign,
      brandKit: campaign.brandKit,
      referenceCreatives,
    })
  } catch (error) {
    log.error({ error }, 'Get campaign error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/campaigns/:id - Update campaign
router.put(
  '/:id',
  requireAuth,
  validateRequest({
    params: z.object({ id: z.string().min(1) }),
    body: CreateCampaignSchema.partial(),
  }),
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      const { id } = req.params
      let validatedData = req.body
      const { sanitizeText } = await import('../utils/sanitizers')
      validatedData = {
        ...validatedData,
        name: sanitizeText(validatedData.name, 200) || validatedData.name,
        description:
          sanitizeText(validatedData.description, 1000) ||
          validatedData.description,
        primaryCTA:
          sanitizeText(validatedData.primaryCTA, 50) ||
          validatedData.primaryCTA,
        secondaryCTA:
          sanitizeText(validatedData.secondaryCTA, 50) ||
          validatedData.secondaryCTA,
      }

      const campaign = await prisma.campaign.findUnique({ where: { id } })
      if (!campaign) {
        return res.status(404).json({ error: 'Campaign not found' })
      }

      // Verify campaign belongs to agency via workspace
      const workspace = await prisma.workspace.findUnique({
        where: { id: campaign.workspaceId },
      })
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Build update data
      const updateData: any = {}
      if (validatedData.name) updateData.name = validatedData.name
      if (validatedData.description)
        updateData.description = validatedData.description
      if (validatedData.objective)
        updateData.objective = validatedData.objective
      if (validatedData.launchType)
        updateData.launchType = validatedData.launchType
      if (validatedData.funnelStage)
        updateData.funnelStage = validatedData.funnelStage
      if (validatedData.primaryOffer)
        updateData.primaryOffer = validatedData.primaryOffer
      if (validatedData.primaryCTA)
        updateData.primaryCTA = validatedData.primaryCTA
      if (validatedData.secondaryCTA)
        updateData.secondaryCTA = validatedData.secondaryCTA
      if (validatedData.targetAudience)
        updateData.targetAudience = validatedData.targetAudience
      if (validatedData.placements)
        updateData.placements = validatedData.placements.join(',')
      if (validatedData.headlineMaxLength)
        updateData.headlineMaxLength = validatedData.headlineMaxLength
      if (validatedData.bodyMaxLength)
        updateData.bodyMaxLength = validatedData.bodyMaxLength
      if (validatedData.mustIncludePhrases)
        updateData.mustIncludePhrases = JSON.stringify(
          validatedData.mustIncludePhrases
        )
      if (validatedData.mustExcludePhrases)
        updateData.mustExcludePhrases = JSON.stringify(
          validatedData.mustExcludePhrases
        )

      const updatedCampaign = await prisma.campaign.update({
        where: { id },
        data: updateData,
      })
      res.json({ campaign: updatedCampaign })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Validation error', details: error.issues })
      }
      log.error({ error }, 'Update campaign error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const campaign = await prisma.campaign.findUnique({ where: { id } })
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Verify campaign belongs to agency via workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: campaign.workspaceId },
    })
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await prisma.campaign.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    log.error({ error }, 'Delete campaign error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/campaigns/:id/launch - Launch campaign (set status to active)
router.post('/:id/launch', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const campaign = await prisma.campaign.findUnique({ where: { id } })
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Verify campaign belongs to agency via workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: campaign.workspaceId },
    })
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const launchedCampaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'active' },
    })
    res.json({ campaign: launchedCampaign })
  } catch (error) {
    log.error({ error }, 'Launch campaign error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/campaigns/:id/pause - Pause campaign
router.post('/:id/pause', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const campaign = await prisma.campaign.findUnique({ where: { id } })
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' })
    }

    // Verify campaign belongs to agency via workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: campaign.workspaceId },
    })
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const pausedCampaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'paused' },
    })
    res.json({ campaign: pausedCampaign })
  } catch (error) {
    log.error({ error }, 'Pause campaign error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
