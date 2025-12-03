import { Router } from 'express'
import { z } from 'zod'
import { AuthModel } from '../models/auth'
import { log } from '../middleware/logger'
import { createAuthMiddleware } from '../routes/auth'
import { AuthenticatedRequest } from '../types/auth'
import { ExportService } from '../services/exportService'
import path from 'path'

const router = Router()
log.info('Initializing export router')
const requireAuth = createAuthMiddleware() as any

// Debug: log every request into export router
router.use((req, res, next) => {
  log.info(
    { requestId: (req as any).requestId, method: req.method, path: req.path },
    'EXPORT ROUTER REQ'
  )
  next()
})

// Debug: generic catch-all on export router
router.use((req, res, next) => {
  log.info(
    { requestId: (req as any).requestId, method: req.method, path: req.path },
    'EXPORT ROUTER CATCHALL'
  )
  next()
})

// POST /api/export/workspace/:workspaceId/start - Start export job
router.post('/workspace/:workspaceId/start', requireAuth, async (req, res) => {
  log.info(
    { requestId: (req as any).requestId, workspaceId: req.params.workspaceId },
    'Incoming POST /workspace/:workspaceId/start'
  )
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

    // Check if there are approved captions to export
    const approvedCaptions =
      AuthModel.getApprovedCaptionsByWorkspace(workspaceId)
    if (approvedCaptions.length === 0) {
      return res
        .status(400)
        .json({ error: 'No approved captions found for export' })
    }

    const result = await ExportService.startExport(workspaceId)

    res.status(201).json(result)
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message })
    }
    log.error(
      { requestId: (req as any).requestId, err: error },
      'Start export error'
    )
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/export/jobs/:jobId - Get export job status
router.get('/jobs/:jobId', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { jobId } = req.params
    const job = AuthModel.getExportJobById(jobId)

    if (!job) {
      return res.status(404).json({ error: 'Export job not found' })
    }

    // Verify job belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(job.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json({ job })
  } catch (error) {
    log.error(
      { requestId: (req as any).requestId, err: error },
      'Get export job error'
    )
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/export/workspace/:workspaceId/jobs - Get export jobs for workspace
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

    const jobs = AuthModel.getExportJobsByWorkspace(workspaceId)
    res.json({ jobs })
  } catch (error) {
    log.error(
      { requestId: (req as any).requestId, err: error },
      'Get export jobs error'
    )
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/export/jobs/:jobId/download - Download completed export
router.get('/jobs/:jobId/download', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { jobId } = req.params
    const job = AuthModel.getExportJobById(jobId)

    if (!job) {
      return res.status(404).json({ error: 'Export job not found' })
    }

    // Verify job belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(job.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (job.status !== 'completed' || !job.zipFilePath) {
      return res.status(400).json({ error: 'Export not ready for download' })
    }

    const fileName = path.basename(job.zipFilePath)
    res.download(job.zipFilePath, fileName, (err) => {
      if (err) {
        log.error({ err }, 'Download error')
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download failed' })
        }
      }
    })
  } catch (error) {
    log.error({ err: error }, 'Download export error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/export/workspace/:workspaceId/summary - Get export summary for workspace
router.get('/workspace/:workspaceId/summary', requireAuth, async (req, res) => {
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
    const assets = AuthModel.getAssetsByWorkspace(workspaceId)

    // Estimate file size
    let estimatedBytes = 1024 // ~1KB for metadata
    estimatedBytes += approvedCaptions.length * 500 // ~500 bytes per caption

    for (const caption of approvedCaptions) {
      const asset = assets.find((a) => a.id === caption.assetId)
      if (asset) {
        estimatedBytes += asset.size || 0
      }
    }

    const formatSize = (bytes: number): string => {
      if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)} KB`
      } else {
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      }
    }

    res.json({
      workspace: {
        id: workspace.id,
        clientName: workspace.clientName,
      },
      readyForExport: approvedCaptions.length > 0,
      totalApproved: approvedCaptions.length,
      totalAssets: assets.length,
      estimatedSize: formatSize(estimatedBytes),
      recentExports: AuthModel.getExportJobsByWorkspace(workspaceId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 5),
    })
  } catch (error) {
    log.error(
      { requestId: (req as any).requestId, err: error },
      'Get export summary error'
    )
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/export/jobs/:jobId - Delete export job and files
router.delete('/jobs/:jobId', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { jobId } = req.params
    const job = AuthModel.getExportJobById(jobId)

    if (!job) {
      return res.status(404).json({ error: 'Export job not found' })
    }

    // Verify job belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(job.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const deleted = AuthModel.deleteExportJob(jobId)
    if (!deleted) {
      return res.status(404).json({ error: 'Export job not found' })
    }

    res.json({ message: 'Export job deleted successfully' })
  } catch (error) {
    log.error(
      { requestId: (req as any).requestId, err: error },
      'Delete export job error'
    )
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/export/cleanup - Clean up old exports (admin only)
router.post('/cleanup', requireAuth, async (req, res) => {
  try {
    const { olderThanHours = 24 } = req.body

    const deletedCount = await ExportService.cleanupOldExports(olderThanHours)

    res.json({
      message: `Cleaned up ${deletedCount} old export files`,
      deletedCount,
      olderThanHours,
    })
  } catch (error) {
    log.error(
      { requestId: (req as any).requestId, err: error },
      'Cleanup exports error'
    )
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/export/workspace/:workspaceId/history - Get export history
router.get('/workspace/:workspaceId/history', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { workspaceId } = req.params
    const limit = parseInt(req.query.limit as string) || 10

    // Verify workspace belongs to current agency
    const workspace = AuthModel.getWorkspaceById(workspaceId)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const history = AuthModel.getExportHistory(workspaceId, limit)

    res.json({
      workspaceId,
      ...history,
    })
  } catch (error) {
    log.error(
      { requestId: (req as any).requestId, err: error },
      'Get export history error'
    )
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/export/workspace/:workspaceId/statistics - Get export statistics
router.get(
  '/workspace/:workspaceId/statistics',
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

      const statistics = AuthModel.getExportStatistics(workspaceId)

      res.json({
        workspaceId,
        ...statistics,
      })
    } catch (error) {
      log.error(
        { requestId: (req as any).requestId, err: error },
        'Get export statistics error'
      )
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/export/workspace/:workspaceId/jobs - List all export jobs
router.get('/workspace/:workspaceId/jobs', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { workspaceId } = req.params
    const status = req.query.status as string
    const limit = parseInt(req.query.limit as string) || 20

    // Verify workspace belongs to current agency
    const workspace = AuthModel.getWorkspaceById(workspaceId)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    let jobs = AuthModel.getExportJobsByWorkspace(workspaceId)

    // Filter by status if provided
    if (status) {
      jobs = jobs.filter((job) => job.status === status)
    }

    // Sort by creation date (most recent first)
    jobs.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    // Apply limit
    jobs = jobs.slice(0, limit)

    res.json({
      workspaceId,
      jobs,
      count: jobs.length,
      filters: {
        status: status || 'all',
        limit,
      },
    })
  } catch (error) {
    log.error({ err: error }, 'Get export jobs error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
