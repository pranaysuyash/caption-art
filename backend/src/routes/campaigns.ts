import { Router } from 'express'
import { z } from 'zod'
import { getPrismaClient } from '../lib/prisma'
import { createAuthMiddleware } from '../routes/auth'
import { validateRequest } from '../middleware/validation'
import { AuthenticatedRequest } from '../types/auth'
import { CreateCampaignSchema } from '../schemas/validation'
import { log } from '../middleware/logger'

const router = Router()
// Defer prisma acquisition to runtime to avoid creating the client during module import
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
    const prisma = getPrismaClient()
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
      console.log(
        'Create campaign payload placements:',
        JSON.stringify(validatedData.placements)
      )
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
          callToAction: validatedData.primaryCTA || null,
          secondaryCTA: validatedData.secondaryCTA || null,
          primaryOffer: validatedData.primaryOffer || null,
          targetAudience: validatedData.targetAudience || null,
          placements: JSON.stringify(validatedData.placements || ['ig-feed']),
          mustIncludePhrases: validatedData.mustIncludePhrases
            ? JSON.stringify(validatedData.mustIncludePhrases)
            : null,
          mustExcludePhrases: validatedData.mustExcludePhrases
            ? JSON.stringify(validatedData.mustExcludePhrases)
            : null,
          headlineMaxLength: validatedData.headlineMaxLength || null,
          bodyMaxLength: validatedData.bodyMaxLength || null,
          referenceCaptions: validatedData.referenceCaptions
            ? JSON.stringify(validatedData.referenceCaptions)
            : null,
          keywords: validatedData.keywords
            ? JSON.stringify(validatedData.keywords)
            : null,
          // pack additional fields into briefData JSON column
          briefData,
          status: validatedData.status || 'draft',
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
  const prisma = getPrismaClient()
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const workspaceId = req.query.workspaceId as string
    const statusQuery = req.query.status as string | undefined

    if (workspaceId) {
      // Verify workspace belongs to agency
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      })
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const where: any = { workspaceId }
      if (statusQuery) {
        const statuses = statusQuery.split(',').map((s) => s.trim())
        where.status = { in: statuses }
      }
      const campaigns = await prisma.campaign.findMany({ where })
      const parsed = campaigns.map((c) => ({
        ...c,
        placements: c.placements ? JSON.parse(c.placements) : undefined,
        mustIncludePhrases: c.mustIncludePhrases
          ? JSON.parse(c.mustIncludePhrases)
          : undefined,
        mustExcludePhrases: c.mustExcludePhrases
          ? JSON.parse(c.mustExcludePhrases)
          : undefined,
        referenceCaptions: c.referenceCaptions
          ? JSON.parse(c.referenceCaptions)
          : undefined,
        keywords: c.keywords ? JSON.parse(c.keywords) : undefined,
      }))
      res.json({ campaigns: parsed })
    } else {
      // Get all campaigns for agency by finding workspaces first
      const workspaces = await prisma.workspace.findMany({
        where: { agencyId: authenticatedReq.agency.id },
        select: { id: true },
      })
      const workspaceIds = workspaces.map((w) => w.id)

      const where: any = { workspaceId: { in: workspaceIds } }
      if (statusQuery) {
        const statuses = statusQuery.split(',').map((s) => s.trim())
        where.status = { in: statuses }
      }
      const campaigns = await prisma.campaign.findMany({ where })
      const parsed = campaigns.map((c) => ({
        ...c,
        placements: c.placements ? JSON.parse(c.placements) : undefined,
        mustIncludePhrases: c.mustIncludePhrases
          ? JSON.parse(c.mustIncludePhrases)
          : undefined,
        mustExcludePhrases: c.mustExcludePhrases
          ? JSON.parse(c.mustExcludePhrases)
          : undefined,
        referenceCaptions: c.referenceCaptions
          ? JSON.parse(c.referenceCaptions)
          : undefined,
        keywords: c.keywords ? JSON.parse(c.keywords) : undefined,
      }))
      res.json({ campaigns: parsed })
    }
  } catch (error) {
    log.error({ error }, 'List campaigns error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/campaigns/:id - Get specific campaign
router.get('/:id', requireAuth, async (req, res) => {
  const prisma = getPrismaClient()
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

    // Parse JSON string fields for consumer friendliness
    const parsedCampaign = {
      ...campaign,
      placements: campaign.placements
        ? JSON.parse(campaign.placements)
        : undefined,
      mustIncludePhrases: campaign.mustIncludePhrases
        ? JSON.parse(campaign.mustIncludePhrases)
        : undefined,
      mustExcludePhrases: campaign.mustExcludePhrases
        ? JSON.parse(campaign.mustExcludePhrases)
        : undefined,
      referenceCaptions: campaign.referenceCaptions
        ? JSON.parse(campaign.referenceCaptions)
        : undefined,
      keywords: campaign.keywords ? JSON.parse(campaign.keywords) : undefined,
    }

    res.json({
      campaign: parsedCampaign,
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
    const prisma = getPrismaClient()
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
      if (validatedData.primaryOffer)
        updateData.primaryOffer = validatedData.primaryOffer
      if (validatedData.primaryCTA)
        updateData.callToAction = validatedData.primaryCTA
      if (validatedData.secondaryCTA)
        updateData.secondaryCTA = validatedData.secondaryCTA
      if (validatedData.targetAudience)
        updateData.targetAudience = validatedData.targetAudience
      if (validatedData.placements)
        updateData.placements = JSON.stringify(validatedData.placements)
      if (validatedData.status) updateData.status = validatedData.status
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
      if (validatedData.referenceCaptions)
        updateData.referenceCaptions = JSON.stringify(
          validatedData.referenceCaptions
        )
      if (validatedData.keywords)
        updateData.keywords = JSON.stringify(validatedData.keywords)
      if (
        validatedData.objective ||
        validatedData.launchType ||
        validatedData.funnelStage
      ) {
        updateData.briefData = {
          ...(campaign.briefData as any),
          objective:
            validatedData.objective || (campaign as any).briefData?.objective,
          launchType:
            validatedData.launchType || (campaign as any).briefData?.launchType,
          funnelStage:
            validatedData.funnelStage ||
            (campaign as any).briefData?.funnelStage,
          placements:
            validatedData.placements || (campaign as any).briefData?.placements,
          headlineMaxLength:
            validatedData.headlineMaxLength ??
            (campaign as any).briefData?.headlineMaxLength,
          bodyMaxLength:
            validatedData.bodyMaxLength ??
            (campaign as any).briefData?.bodyMaxLength,
          mustIncludePhrases:
            validatedData.mustIncludePhrases ??
            (campaign as any).briefData?.mustIncludePhrases,
          mustExcludePhrases:
            validatedData.mustExcludePhrases ??
            (campaign as any).briefData?.mustExcludePhrases,
          referenceCaptions:
            validatedData.referenceCaptions ??
            (campaign as any).briefData?.referenceCaptions,
        }
      }

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
  const prisma = getPrismaClient()
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
  const prisma = getPrismaClient()
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
  const prisma = getPrismaClient()
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

// POST /api/campaigns/:id/archive - Archive campaign (soft delete)
router.post('/:id/archive', requireAuth, async (req, res) => {
  const prisma = getPrismaClient()
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

    const archivedCampaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'archived' },
    })
    res.json({ campaign: archivedCampaign })
  } catch (error) {
    log.error({ error }, 'Archive campaign error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/campaigns/:id/unarchive - Unarchive campaign (restore to draft)
router.post('/:id/unarchive', requireAuth, async (req, res) => {
  const prisma = getPrismaClient()
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

    const unarchivedCampaign = await prisma.campaign.update({
      where: { id },
      data: { status: 'draft' },
    })
    res.json({ campaign: unarchivedCampaign })
  } catch (error) {
    log.error({ error }, 'Unarchive campaign error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
