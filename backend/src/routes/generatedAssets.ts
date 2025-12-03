import { Router } from 'express'
import { z } from 'zod'
import { AuthModel } from '../models/auth'
import { log } from '../middleware/logger'
import { createAuthMiddleware } from '../routes/auth'
import validateRequest from '../middleware/validateRequest'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
const requireAuth = createAuthMiddleware() as any

// Validation schemas
const approveRejectSchema = z.object({
  reason: z.string().optional(),
})

const batchApproveRejectSchema = z.object({
  assetIds: z.array(z.string().min(1)),
  reason: z.string().optional(),
})

// GET /api/generated-assets/workspace/:workspaceId - Get all generated assets for workspace
router.get('/workspace/:workspaceId', requireAuth, async (req, res) => {
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

    const generatedAssets = AuthModel.getGeneratedAssetsByWorkspace(workspaceId)

    // Enrich with source asset information
    const enrichedAssets = generatedAssets.map((asset) => {
      const sourceAsset = AuthModel.getAssetById(asset.sourceAssetId)
      const caption = AuthModel.getCaptionById(asset.captionId)
      return {
        ...asset,
        sourceAsset: sourceAsset
          ? {
              id: sourceAsset.id,
              originalName: sourceAsset.originalName,
              mimeType: sourceAsset.mimeType,
              url: sourceAsset.url,
            }
          : null,
        caption: caption
          ? {
              id: caption.id,
              text: caption.text,
              status: caption.status,
              approvalStatus: caption.approvalStatus,
              approved: caption.approvalStatus === 'approved',
            }
          : null,
      }
    })

    res.json({ generatedAssets: enrichedAssets })
  } catch (error) {
    log.error({ err: error }, 'Get generated assets error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/generated-assets/job/:jobId - Get generated assets for a batch job
router.get('/job/:jobId', requireAuth, async (req, res) => {
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

    const generatedAssets = AuthModel.getGeneratedAssetsByJob(jobId)

    // Enrich generated assets similar to workspace endpoint
    const enrichedAssets = generatedAssets.map((asset) => {
      const sourceAsset = AuthModel.getAssetById(asset.sourceAssetId)
      const caption = AuthModel.getCaptionById(asset.captionId)
      return {
        ...asset,
        approved: asset.approvalStatus === 'approved',
        sourceAsset: sourceAsset
          ? {
              id: sourceAsset.id,
              originalName: sourceAsset.originalName,
              mimeType: sourceAsset.mimeType,
              url: sourceAsset.url,
            }
          : null,
        caption: caption
          ? {
              id: caption.id,
              text: caption.text,
              status: caption.status,
              approvalStatus: caption.approvalStatus,
              approved: caption.approvalStatus === 'approved',
            }
          : null,
      }
    })

    res.json({ generatedAssets: enrichedAssets })
  } catch (error) {
    log.error({ err: error }, 'Get generated assets by job error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/generated-assets/workspace/:workspaceId/approved - Get only approved generated assets
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

      const approvedAssets = AuthModel.getApprovedGeneratedAssets(workspaceId)

      // Enrich with source asset information
      const enrichedAssets = approvedAssets.map((asset) => {
        const sourceAsset = AuthModel.getAssetById(asset.sourceAssetId)
        return {
          ...asset,
          approved: asset.approvalStatus === 'approved',
          sourceAsset: sourceAsset
            ? {
                id: sourceAsset.id,
                originalName: sourceAsset.originalName,
                mimeType: sourceAsset.mimeType,
                url: sourceAsset.url,
              }
            : null,
        }
      })

      res.json({ generatedAssets: enrichedAssets })
    } catch (error) {
      log.error({ err: error }, 'Get approved generated assets error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /api/generated-assets/:assetId/approve - Approve a generated asset
router.put('/:assetId/approve', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { assetId } = req.params

    const generatedAsset = AuthModel.getGeneratedAssetById(assetId)
    if (!generatedAsset) {
      return res.status(404).json({ error: 'Generated asset not found' })
    }

    // Verify asset belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(generatedAsset.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const approvedAsset = AuthModel.approveGeneratedAsset(assetId)
    if (!approvedAsset) {
      return res.status(404).json({ error: 'Generated asset not found' })
    }

    res.json({
      message: 'Generated asset approved successfully',
      generatedAsset: {
        ...approvedAsset,
        approved: approvedAsset.approvalStatus === 'approved',
      },
    })
  } catch (error) {
    log.error({ err: error }, 'Approve generated asset error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/generated-assets/:assetId/reject - Reject a generated asset
router.put(
  '/:assetId/reject',
  requireAuth,
  validateRequest(approveRejectSchema) as any,
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      const { assetId } = req.params
      const { reason } = (req as any).validatedData

      const generatedAsset = AuthModel.getGeneratedAssetById(assetId)
      if (!generatedAsset) {
        return res.status(404).json({ error: 'Generated asset not found' })
      }

      // Verify asset belongs to agency via workspace
      const workspace = AuthModel.getWorkspaceById(generatedAsset.workspaceId)
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const rejectedAsset = AuthModel.rejectGeneratedAsset(assetId)
      if (!rejectedAsset) {
        return res.status(404).json({ error: 'Generated asset not found' })
      }

      res.json({
        message: 'Generated asset rejected successfully',
        generatedAsset: {
          ...rejectedAsset,
          approved: rejectedAsset.approvalStatus === 'approved',
        },
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Invalid input', details: error.issues })
      }
      log.error({ err: error }, 'Reject generated asset error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/generated-assets/batch-approve - Approve multiple generated assets
router.post(
  '/batch-approve',
  requireAuth,
  validateRequest(batchApproveRejectSchema) as any,
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      const { assetIds } = (req as any).validatedData

      // Verify all assets belong to current agency
      for (const assetId of assetIds) {
        const generatedAsset = AuthModel.getGeneratedAssetById(assetId)
        if (!generatedAsset) {
          return res
            .status(404)
            .json({ error: `Generated asset ${assetId} not found` })
        }

        const workspace = AuthModel.getWorkspaceById(generatedAsset.workspaceId)
        if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
          return res
            .status(403)
            .json({ error: 'Access denied for generated asset ${assetId}' })
        }
      }

      const result = AuthModel.batchApproveGeneratedAssets(assetIds)

      res.json({
        message: `Successfully approved ${result.approved} generated assets`,
        ...result,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Invalid input', details: error.issues })
      }
      log.error({ err: error }, 'Batch approve generated assets error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/generated-assets/batch-reject - Reject multiple generated assets
router.post(
  '/batch-reject',
  requireAuth,
  validateRequest(batchApproveRejectSchema) as any,
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      const { assetIds, reason } = (req as any).validatedData

      // Verify all assets belong to current agency
      for (const assetId of assetIds) {
        const generatedAsset = AuthModel.getGeneratedAssetById(assetId)
        if (!generatedAsset) {
          return res
            .status(404)
            .json({ error: `Generated asset ${assetId} not found` })
        }

        const workspace = AuthModel.getWorkspaceById(generatedAsset.workspaceId)
        if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
          return res
            .status(403)
            .json({ error: 'Access denied for generated asset ${assetId}' })
        }
      }

      const result = AuthModel.batchRejectGeneratedAssets(assetIds)

      res.json({
        message: `Successfully rejected ${result.rejected} generated assets`,
        ...result,
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Invalid input', details: error.issues })
      }
      log.error({ err: error }, 'Batch reject generated assets error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/generated-assets/workspace/:workspaceId/stats - Get approval statistics
router.get('/workspace/:workspaceId/stats', requireAuth, async (req, res) => {
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

    const allGeneratedAssets =
      AuthModel.getGeneratedAssetsByWorkspace(workspaceId)

    const stats = {
      total: allGeneratedAssets.length,
      pending: allGeneratedAssets.filter((a) => a.approvalStatus === 'pending')
        .length,
      approved: allGeneratedAssets.filter(
        (a) => a.approvalStatus === 'approved'
      ).length,
      rejected: allGeneratedAssets.filter(
        (a) => a.approvalStatus === 'rejected'
      ).length,
      byFormat: {
        'instagram-square': allGeneratedAssets.filter(
          (a) => a.format === 'instagram-square'
        ).length,
        'instagram-story': allGeneratedAssets.filter(
          (a) => a.format === 'instagram-story'
        ).length,
      },
      byLayout: {
        'center-focus': allGeneratedAssets.filter(
          (a) => a.layout === 'center-focus'
        ).length,
        'bottom-text': allGeneratedAssets.filter(
          (a) => a.layout === 'bottom-text'
        ).length,
        'top-text': allGeneratedAssets.filter((a) => a.layout === 'top-text')
          .length,
      },
    }

    res.json({ stats })
  } catch (error) {
    log.error({ err: error }, 'Get generated assets stats error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/generated-assets/:assetId - Delete a generated asset
router.delete('/:assetId', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { assetId } = req.params

    const generatedAsset = AuthModel.getGeneratedAssetById(assetId)
    if (!generatedAsset) {
      return res.status(404).json({ error: 'Generated asset not found' })
    }

    // Verify asset belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(generatedAsset.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const deleted = AuthModel.deleteGeneratedAsset(assetId)
    if (!deleted) {
      return res.status(404).json({ error: 'Generated asset not found' })
    }

    res.json({ message: 'Generated asset deleted successfully' })
  } catch (error) {
    log.error({ err: error }, 'Delete generated asset error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
