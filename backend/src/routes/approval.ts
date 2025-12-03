import { Router } from 'express'
import { z } from 'zod'
import { AuthModel } from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import { validateRequest } from '../middleware/validation'
import { AuthenticatedRequest } from '../types/auth'
import {
  ApproveRejectSchema,
  BatchApproveRejectSchema,
} from '../schemas/validation'
import { log } from '../middleware/logger'

const router = Router()
const requireAuth = createAuthMiddleware() as any

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
    const gridData = assets.map((asset) => {
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
        caption: caption
          ? {
              id: caption.id,
              text:
                caption.variations.length > 0
                  ? caption.variations[0]?.text || ''
                  : '',
              variations: caption.variations.map((v) => ({
                ...v,
                approved: v.approvalStatus === 'approved',
              })),
              primaryVariation: caption.primaryVariationId
                ? caption.variations.find(
                    (v) => v.id === caption.primaryVariationId
                  )
                : caption.variations[0] || null,
              status: caption.status,
              approvalStatus: caption.approvalStatus,
              approved: caption.approvalStatus === 'approved',
              generatedAt: caption.generatedAt,
              approvedAt: caption.approvedAt,
              rejectedAt: caption.rejectedAt,
              errorMessage: caption.errorMessage,
            }
          : null,
      }
    })

    // Get approval statistics
    const stats = {
      total: captions.length,
      pending: captions.filter((c) => c.approvalStatus === 'pending').length,
      approved: captions.filter((c) => c.approvalStatus === 'approved').length,
      rejected: captions.filter((c) => c.approvalStatus === 'rejected').length,
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
    log.error({ error }, 'Get approval grid error')
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
        text:
          approvedCaption.variations.length > 0
            ? approvedCaption.variations[0]?.text || ''
            : '', // For backward compatibility
        approved: approvedCaption.approvalStatus === 'approved',
        variations: approvedCaption.variations.map((v) => ({
          ...v,
          approved: v.approvalStatus === 'approved',
        })),
        primaryVariation: approvedCaption.primaryVariationId
          ? approvedCaption.variations.find(
              (v) => v.id === approvedCaption.primaryVariationId
            )
          : approvedCaption.variations[0] || null,
      },
    })
  } catch (error) {
    log.error({ error }, 'Approve caption error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/approval/captions/:captionId/reject - Reject a caption
router.put(
  '/captions/:captionId/reject',
  requireAuth,
  validateRequest({
    params: z.object({ captionId: z.string().min(1) }),
    body: ApproveRejectSchema,
  }),
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      const { captionId } = req.params
      const { reason } = req.body

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
          text:
            rejectedCaption.variations.length > 0
              ? rejectedCaption.variations[0]?.text || ''
              : '', // For backward compatibility
          approved: rejectedCaption.approvalStatus === 'approved',
          variations: rejectedCaption.variations.map((v) => ({
            ...v,
            approved: v.approvalStatus === 'approved',
          })),
          primaryVariation: rejectedCaption.primaryVariationId
            ? rejectedCaption.variations.find(
                (v) => v.id === rejectedCaption.primaryVariationId
              )
            : rejectedCaption.variations[0] || null,
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Invalid input', details: error.issues })
      }
      log.error({ error }, 'Reject caption error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/approval/batch-approve - Approve multiple captions
router.post(
  '/batch-approve',
  requireAuth,
  validateRequest({ body: BatchApproveRejectSchema }),
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      const { captionIds } = req.body

      // Verify all captions belong to current agency
      for (const captionId of captionIds) {
        const caption = AuthModel.getCaptionById(captionId)
        if (!caption) {
          return res
            .status(404)
            .json({ error: `Caption ${captionId} not found` })
        }

        const workspace = AuthModel.getWorkspaceById(caption.workspaceId)
        if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
          return res
            .status(403)
            .json({ error: 'Access denied for caption ${captionId}' })
        }
      }

      const result = AuthModel.batchApproveCaptions(captionIds)

      res.json({
        message: `Successfully approved ${result.approved} captions`,
        ...result,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Invalid input', details: error.issues })
      }
      log.error({ error }, 'Batch approve error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/approval/batch-reject - Reject multiple captions
router.post(
  '/batch-reject',
  requireAuth,
  validateRequest({ body: BatchApproveRejectSchema }),
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      const { captionIds, reason } = req.body

      // Verify all captions belong to current agency
      for (const captionId of captionIds) {
        const caption = AuthModel.getCaptionById(captionId)
        if (!caption) {
          return res
            .status(404)
            .json({ error: `Caption ${captionId} not found` })
        }

        const workspace = AuthModel.getWorkspaceById(caption.workspaceId)
        if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
          return res
            .status(403)
            .json({ error: 'Access denied for caption ${captionId}' })
        }
      }

      const result = AuthModel.batchRejectCaptions(captionIds, reason)

      res.json({
        message: `Successfully rejected ${result.rejected} captions`,
        ...result,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Invalid input', details: error.issues })
      }
      log.error({ error }, 'Batch reject error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/approval/workspace/:workspaceId/approved - Get approved captions only
router.get(
  '/workspace/:workspaceId/approved',
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

      const approvedCaptions =
        AuthModel.getApprovedCaptionsByWorkspace(workspaceId)

      // Enrich with asset information
      const enrichedCaptions = approvedCaptions.map((caption) => {
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

      res.json({
        captions: enrichedCaptions,
        count: enrichedCaptions.length,
      })
    } catch (error) {
      log.error({ error }, 'Get approved captions error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/approval/auto-approve-best - Auto-approve the highest scoring caption per asset
router.post('/auto-approve-best', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { workspaceId } = req.body

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' })
    }

    // Verify workspace belongs to current agency
    const workspace = AuthModel.getWorkspaceById(workspaceId)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Get all captions for the workspace
    const captions = AuthModel.getCaptionsByWorkspace(workspaceId)

    let approvedCount = 0

    // For each caption, find the highest scoring variation and approve it
    for (const caption of captions) {
      if (caption.variations.length > 0) {
        // Find the variation with the highest score
        let bestVariation = caption.variations[0]
        let highestScore = bestVariation.qualityScore || 0

        for (const variation of caption.variations) {
          const score = variation.qualityScore || 0
          if (score > highestScore) {
            highestScore = score
            bestVariation = variation
          }
        }

        // Approve the best variation
        const result = AuthModel.approveCaptionVariation(
          caption.id,
          bestVariation.id
        )
        if (result) {
          approvedCount++
        }
      }
    }

    res.json({
      message: `Auto-approved best variations for ${approvedCount} captions`,
      approvedCount,
    })
  } catch (error) {
    log.error({ error }, 'Auto-approve best error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
