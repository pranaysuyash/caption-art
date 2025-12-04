import express from 'express'
import { createAuthMiddleware } from './auth'
import { AuthModel } from '../models/auth'
import { log } from '../middleware/logger'

const router = express.Router()
const requireAuth = createAuthMiddleware() as any

/**
 * POST /api/admin/reset/workspace/:workspaceId
 * Clears in-memory data for a workspace (workspaces, campaigns, assets, captions, generated assets, brand kits, reference creatives).
 * Note: v1 only; in production this should be protected by IAM/role checks.
 */
router.post(
  '/reset/workspace/:workspaceId',
  requireAuth,
  async (req, res) => {
    try {
      const { workspaceId } = req.params
      const result = AuthModel.resetWorkspace(workspaceId)
      log.info({ workspaceId, result }, 'Admin reset workspace')
      return res.json({
        message: 'Workspace data reset',
        result,
      })
    } catch (err) {
      log.error({ err }, 'Failed to reset workspace')
      return res.status(500).json({ error: 'Failed to reset workspace' })
    }
  }
)

export default router
