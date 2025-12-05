import { Router } from 'express'
import { z } from 'zod'
import { getPrismaClient } from '../lib/prisma'
import { log } from '../middleware/logger'
import { createAuthMiddleware } from '../routes/auth'
import { validateRequest } from '../middleware/validation'
import { AuthenticatedRequest } from '../types/auth'
import { CaptionGenerator } from '../services/captionGenerator'
import { StartBatchSchema } from '../schemas/validation'

const router = Router()
// Defer Prisma client acquisition to runtime
const requireAuth = createAuthMiddleware() as any

// POST /api/batch/generate - Start batch caption generation
router.post(
  '/generate',
  requireAuth,
  validateRequest({ body: StartBatchSchema }),
  async (req, res) => {
    const prisma = getPrismaClient()
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      const { workspaceId, assetIds } = req.body

      // Verify workspace belongs to current agency
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      })
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' })
      }

      if (workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Start batch generation
      const result = await CaptionGenerator.startBatchGeneration(
        workspaceId,
        assetIds
      )

      res.status(201).json(result)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Invalid input', details: error.issues })
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }
      log.error({ err: error }, 'Start batch generation error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/batch/jobs/:jobId - Get specific batch job status
router.get('/jobs/:jobId', requireAuth, async (req, res) => {
  const prisma = getPrismaClient()
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { jobId } = req.params
    const job = await prisma.batchJob.findUnique({
      where: { id: jobId },
    })

    if (!job) {
      return res.status(404).json({ error: 'Batch job not found' })
    }

    // Verify job belongs to agency via workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: job.workspaceId },
    })
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get captions for this job
    const assetIds = (job.result as any)?.assetIds || []
    const jobCaptions = []
    for (const assetId of assetIds) {
      const captions = await prisma.caption.findMany({
        where: { assetId },
      })
      if (captions.length > 0) {
        const asset = await prisma.asset.findUnique({
          where: { id: assetId },
        })
        jobCaptions.push({
          assetId,
          assetName: asset?.originalName || 'Unknown',
          caption: {
            ...captions[0],
            approved: captions[0].approvalStatus === 'approved',
          },
        })
      }
    }

    res.json({
      job,
      captions: jobCaptions,
    })
  } catch (error) {
    log.error({ err: error }, 'Get batch job error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/batch/workspace/:workspaceId/jobs - Get all batch jobs for a workspace
router.get('/workspace/:workspaceId/jobs', requireAuth, async (req, res) => {
  const prisma = getPrismaClient()
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { workspaceId } = req.params

    // Verify workspace belongs to current agency
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
    })
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const jobs = await prisma.batchJob.findMany({
      where: { workspaceId },
    })
    res.json({ jobs })
  } catch (error) {
    log.error({ err: error }, 'Get batch jobs error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/batch/workspace/:workspaceId/captions - Get all captions for a workspace
router.get(
  '/workspace/:workspaceId/captions',
  requireAuth,
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      const { workspaceId } = req.params

      // Verify workspace belongs to current agency
      const workspace = await prisma.workspace.findUnique({
        where: { id: workspaceId },
      })
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' })
      }

      if (workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const captions = await prisma.caption.findMany({
        where: { workspaceId },
        include: {
          variations: true,
        },
      })

      // Enrich captions with asset information
      const enrichedCaptions = await Promise.all(
        captions.map(async (caption) => {
          const asset = await prisma.asset.findUnique({
            where: { id: caption.assetId },
          })
          return {
            ...caption,
            text:
              caption.variations.length > 0
                ? caption.variations[0]?.text || ''
                : '', // For backward compatibility
            approved: caption.approvalStatus === 'approved',
            variations: caption.variations.map((v) => ({
              ...v,
              approved: v.approvalStatus === 'approved',
            })),
            primaryVariation: caption.primaryVariationId
              ? caption.variations.find(
                  (v) => v.id === caption.primaryVariationId
                )
              : caption.variations[0] || null,
            asset: asset
              ? {
                  id: asset.id,
                  originalName: asset.originalName,
                  mimeType: asset.mimeType,
                  url: asset.url,
                }
              : null,
          }
        })
      )

      res.json({ captions: enrichedCaptions })
    } catch (error) {
      log.error({ err: error }, 'Get captions error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /api/batch/captions/:captionId - Update caption text (manual editing)
router.put('/captions/:captionId', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { captionId } = req.params
    const { sanitizeText } = await import('../utils/sanitizers')
    const { text } = req.body
    const safeText = sanitizeText(text, 2200)

    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Caption text is required' })
    }

    const caption = await prisma.caption.findUnique({
      where: { id: captionId },
      include: { variations: true },
    })
    if (!caption) {
      return res.status(404).json({ error: 'Caption not found' })
    }

    // Verify caption belongs to agency via workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: caption.workspaceId },
    })
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // For backward compatibility and manual editing, add a new variation with the edited text
    const newVariation = await prisma.captionVariation.create({
      data: {
        captionId,
        text: (safeText || text || '').trim(),
        tone: 'default',
        approvalStatus: 'pending',
      },
    })

    // Set this new variation as the primary one
    const updatedCaption = await prisma.caption.update({
      where: { id: captionId },
      data: { primaryVariationId: newVariation.id },
      include: { variations: true },
    })

    const latestVariation = newVariation

    res.json({
      caption: {
        ...updatedCaption,
        text: latestVariation?.text || '',
        approved: updatedCaption.approvalStatus === 'approved',
        variations: updatedCaption.variations.map((v) => ({
          ...v,
          approved: v.approvalStatus === 'approved',
        })),
        primaryVariation: updatedCaption.primaryVariationId
          ? updatedCaption.variations.find(
              (v) => v.id === updatedCaption.primaryVariationId
            )
          : updatedCaption.variations[0] || null,
      },
    })
  } catch (error) {
    log.error({ err: error }, 'Update caption error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/batch/captions/:captionId - Delete caption
router.delete('/captions/:captionId', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { captionId } = req.params
    const caption = await prisma.caption.findUnique({
      where: { id: captionId },
    })

    if (!caption) {
      return res.status(404).json({ error: 'Caption not found' })
    }

    // Verify caption belongs to agency via workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: caption.workspaceId },
    })
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    await prisma.caption.delete({
      where: { id: captionId },
    })

    res.json({ message: 'Caption deleted successfully' })
  } catch (error) {
    log.error({ err: error }, 'Delete caption error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
