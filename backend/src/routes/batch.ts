import { Router } from 'express'
import { z } from 'zod'
import { AuthModel } from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import { AuthenticatedRequest } from '../types/auth'
import { CaptionGenerator } from '../services/captionGenerator'

const router = Router()
const requireAuth = createAuthMiddleware() as any

// Validation schemas
const startBatchSchema = z.object({
  workspaceId: z.string().min(1),
  assetIds: z.array(z.string().min(1)).min(1).max(10),
})

// POST /api/batch/generate - Start batch caption generation
router.post('/generate', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { workspaceId, assetIds } = startBatchSchema.parse(req.body)

    // Verify workspace belongs to current agency
    const workspace = AuthModel.getWorkspaceById(workspaceId)
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
    console.error('Start batch generation error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/batch/jobs/:jobId - Get specific batch job status
router.get('/jobs/:jobId', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { jobId } = req.params
    const job = AuthModel.getBatchJobById(jobId)

    if (!job) {
      return res.status(404).json({ error: 'Batch job not found' })
    }

    // Verify job belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(job.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get captions for this job
    const jobCaptions = []
    for (const assetId of job.assetIds) {
      const captions = AuthModel.getCaptionsByAsset(assetId)
      if (captions.length > 0) {
        const asset = AuthModel.getAssetById(assetId)
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
    console.error('Get batch job error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/batch/workspace/:workspaceId/jobs - Get all batch jobs for a workspace
router.get('/workspace/:workspaceId/jobs', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { workspaceId } = req.params

    // Verify workspace belongs to current agency
    const workspace = AuthModel.getWorkspaceById(workspaceId)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const jobs = AuthModel.getBatchJobsByWorkspace(workspaceId)
    res.json({ jobs })
  } catch (error) {
    console.error('Get batch jobs error:', error)
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
      const workspace = AuthModel.getWorkspaceById(workspaceId)
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' })
      }

      if (workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const captions = AuthModel.getCaptionsByWorkspace(workspaceId)

      // Enrich captions with asset information
      const enrichedCaptions = captions.map((caption) => {
        const asset = AuthModel.getAssetById(caption.assetId)
        return {
          ...caption,
          approved: caption.approvalStatus === 'approved',
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

      res.json({ captions: enrichedCaptions })
    } catch (error) {
      console.error('Get captions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /api/batch/captions/:captionId - Update caption text (manual editing)
router.put('/captions/:captionId', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { captionId } = req.params
    const { text } = req.body

    if (typeof text !== 'string') {
      return res.status(400).json({ error: 'Caption text is required' })
    }

    const caption = AuthModel.getCaptionById(captionId)
    if (!caption) {
      return res.status(404).json({ error: 'Caption not found' })
    }

    // Verify caption belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(caption.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updatedCaption = AuthModel.updateCaption(captionId, {
      text: text.trim(),
      status: 'completed',
    })

    if (!updatedCaption) {
      return res.status(404).json({ error: 'Caption not found' })
    }

    res.json({
      caption: {
        ...updatedCaption,
        approved: updatedCaption.approvalStatus === 'approved',
      },
    })
  } catch (error) {
    console.error('Update caption error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/batch/captions/:captionId - Delete caption
router.delete('/captions/:captionId', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { captionId } = req.params
    const caption = AuthModel.getCaptionById(captionId)

    if (!caption) {
      return res.status(404).json({ error: 'Caption not found' })
    }

    // Verify caption belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(caption.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const deleted = AuthModel.deleteCaption(captionId)
    if (!deleted) {
      return res.status(404).json({ error: 'Caption not found' })
    }

    res.json({ message: 'Caption deleted successfully' })
  } catch (error) {
    console.error('Delete caption error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
