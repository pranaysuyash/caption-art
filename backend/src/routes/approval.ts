import { Router } from 'express'
import { z } from 'zod'
import { AuthModel } from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
const requireAuth = createAuthMiddleware() as any

// Validation schemas
const approveRejectSchema = z.object({
  reason: z.string().optional(),
})

const batchApproveRejectSchema = z.object({
  captionIds: z.array(z.string()).min(1),
  reason: z.string().optional(),
})

// GET /api/approval/workspace/:workspaceId/grid - Get approval grid data
router.get('/workspace/:workspaceId/grid', requireAuth, async (req, res) => {
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

    // Get all assets and captions for the workspace
    const assets = AuthModel.getAssetsByWorkspace(workspaceId)
    const captions = AuthModel.getCaptionsByWorkspace(workspaceId)

    // Build grid data with asset and caption information
    const gridData = assets.map(asset => {
      const assetCaptions = AuthModel.getCaptionsByAsset(asset.id)
      const caption = assetCaptions[0] || null

      return {
        asset: {
          id: asset.id,
          originalName: asset.originalName,
          mimeType: asset.mimeType,
          url: asset.url,
          uploadedAt: asset.uploadedAt,
        },
        caption: caption ? {
          id: caption.id,
          text: caption.text,
          status: caption.status,
          approvalStatus: caption.approvalStatus,
          approved: caption.approvalStatus === 'approved',
          generatedAt: caption.generatedAt,
          approvedAt: caption.approvedAt,
          rejectedAt: caption.rejectedAt,
          errorMessage: caption.errorMessage,
        } : null,
      }
    })

    // Get approval statistics
    const stats = {
      total: captions.length,
      pending: captions.filter(c => c.approvalStatus === 'pending').length,
      approved: captions.filter(c => c.approvalStatus === 'approved').length,
      rejected: captions.filter(c => c.approvalStatus === 'rejected').length,
    }

    res.json({
      workspace: {
        id: workspace.id,
        clientName: workspace.clientName,
      },
      grid: gridData,
      stats,
    })
  } catch (error) {
    console.error('Get approval grid error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/approval/captions/:captionId/approve - Approve a caption
router.put('/captions/:captionId/approve', requireAuth, async (req, res) => {
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

    const approvedCaption = AuthModel.approveCaption(captionId)
    if (!approvedCaption) {
      return res.status(404).json({ error: 'Caption not found' })
    }

    res.json({
      message: 'Caption approved successfully',
      caption: {
        ...approvedCaption,
        approved: approvedCaption.approvalStatus === 'approved'
      },
    })
  } catch (error) {
    console.error('Approve caption error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/approval/captions/:captionId/reject - Reject a caption
router.put('/captions/:captionId/reject', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { captionId } = req.params
    const { reason } = approveRejectSchema.parse(req.body)

    const caption = AuthModel.getCaptionById(captionId)
    if (!caption) {
      return res.status(404).json({ error: 'Caption not found' })
    }

    // Verify caption belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(caption.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const rejectedCaption = AuthModel.rejectCaption(captionId, reason)
    if (!rejectedCaption) {
      return res.status(404).json({ error: 'Caption not found' })
    }

    res.json({
      message: 'Caption rejected successfully',
      caption: {
        ...rejectedCaption,
        approved: rejectedCaption.approvalStatus === 'approved'
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues })
    }
    console.error('Reject caption error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/approval/batch-approve - Approve multiple captions
router.post('/batch-approve', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { captionIds } = batchApproveRejectSchema.parse(req.body)

    // Verify all captions belong to current agency
    for (const captionId of captionIds) {
      const caption = AuthModel.getCaptionById(captionId)
      if (!caption) {
        return res.status(404).json({ error: `Caption ${captionId} not found` })
      }

      const workspace = AuthModel.getWorkspaceById(caption.workspaceId)
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied for caption ${captionId}' })
      }
    }

    const result = AuthModel.batchApproveCaptions(captionIds)

    res.json({
      message: `Successfully approved ${result.approved} captions`,
      ...result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues })
    }
    console.error('Batch approve error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/approval/batch-reject - Reject multiple captions
router.post('/batch-reject', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { captionIds, reason } = batchApproveRejectSchema.parse(req.body)

    // Verify all captions belong to current agency
    for (const captionId of captionIds) {
      const caption = AuthModel.getCaptionById(captionId)
      if (!caption) {
        return res.status(404).json({ error: `Caption ${captionId} not found` })
      }

      const workspace = AuthModel.getWorkspaceById(caption.workspaceId)
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied for caption ${captionId}' })
      }
    }

    const result = AuthModel.batchRejectCaptions(captionIds, reason)

    res.json({
      message: `Successfully rejected ${result.rejected} captions`,
      ...result,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.issues })
    }
    console.error('Batch reject error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/approval/workspace/:workspaceId/approved - Get approved captions only
router.get('/workspace/:workspaceId/approved', requireAuth, async (req, res) => {
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

    const approvedCaptions = AuthModel.getApprovedCaptionsByWorkspace(workspaceId)

    // Enrich with asset information
    const enrichedCaptions = approvedCaptions.map(caption => {
      const asset = AuthModel.getAssetById(caption.assetId)
      return {
        ...caption,
        approved: caption.approvalStatus === 'approved',
        asset: asset ? {
          id: asset.id,
          originalName: asset.originalName,
          mimeType: asset.mimeType,
          url: asset.url,
        } : null,
      }
    })

    res.json({
      captions: enrichedCaptions,
      count: enrichedCaptions.length,
    })
  } catch (error) {
    console.error('Get approved captions error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router