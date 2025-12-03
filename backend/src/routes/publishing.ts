/**
 * Publishing Routes
 * API endpoints for direct social media publishing
 */

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { AuthModel } from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import { log } from '../middleware/logger'
import { PublishingService } from '../services/PublishingService'
import { validateRequest } from '../middleware/validation'

const router = Router()
const requireAuth = createAuthMiddleware() as any

// Validation schemas for publishing
const publishSchema = z.object({
  assetId: z.string().min(1, 'Asset ID is required'),
  caption: z.string().min(1, 'Caption is required'),
  creativeType: z.enum(['feed', 'story', 'reel', 'carousel'], {
    message: 'Creative type is required',
  }),
  platform: z.enum(['instagram', 'facebook', 'linkedin'], {
    message: 'Platform is required',
  }),
  credentials: z.object({
    accessToken: z.string().min(1, 'Access token is required'),
    pageId: z.string().optional(), // Required for Facebook/LinkedIn
  }),
  scheduling: z
    .object({
      publishAt: z.string().datetime(),
      timezone: z.string().optional(),
    })
    .optional(),
})

const analyticsSchema = z.object({
  postId: z.string().min(1, 'Post ID is required'),
  platform: z.enum(['instagram', 'facebook', 'linkedin']),
  accessToken: z.string().min(1, 'Access token is required'),
})

// POST /api/publishing/publish - Publish content to social media
router.post(
  '/publish',
  requireAuth,
  validateRequest({ body: publishSchema }),
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as any
      const {
        assetId,
        caption,
        creativeType,
        platform,
        credentials,
        scheduling,
      } = req.body

      // Verify asset belongs to current agency
      const asset = AuthModel.getAssetById(assetId)
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' })
      }

      // Verify asset belongs to current agency via workspace
      const workspace = AuthModel.getWorkspaceById(asset.workspaceId)
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Get image URL for the asset
      const imageUrl = asset.url

      const publishResult = await PublishingService.publish(
        {
          workspaceId: asset.workspaceId,
          assetId,
          caption,
          imageUrl,
          creativeType,
        },
        {
          platform,
          credentials,
          scheduling: scheduling
            ? {
                ...scheduling,
                publishAt: new Date(scheduling.publishAt),
              }
            : undefined,
        }
      )

      if (publishResult.success) {
        res.json({
          message: 'Content published successfully',
          result: publishResult,
        })
      } else {
        res.status(400).json({
          error: 'Publishing failed',
          details: publishResult.error,
        })
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Validation error', details: error.issues })
      }
      log.error({ err: error }, 'Publishing API error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/publishing/schedule - Schedule content for future publishing
router.post(
  '/schedule',
  requireAuth,
  validateRequest({ body: publishSchema }),
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as any
      const {
        assetId,
        caption,
        creativeType,
        platform,
        credentials,
        scheduling,
      } = req.body

      // Verify asset belongs to current agency
      const asset = AuthModel.getAssetById(assetId)
      if (!asset) {
        return res.status(404).json({ error: 'Asset not found' })
      }

      // Verify asset belongs to current agency via workspace
      const workspace = AuthModel.getWorkspaceById(asset.workspaceId)
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      if (!scheduling) {
        return res
          .status(400)
          .json({ error: 'Scheduling information required' })
      }

      // Get image URL for the asset
      const imageUrl = asset.url

      const scheduleResult = await PublishingService.schedule(
        {
          workspaceId: asset.workspaceId,
          assetId,
          caption,
          imageUrl,
          creativeType,
        },
        {
          platform,
          credentials,
          scheduling: {
            ...scheduling,
            publishAt: new Date(scheduling.publishAt),
          },
        }
      )

      if (scheduleResult.scheduled) {
        res.json({
          message: 'Content scheduled successfully',
          scheduleId: scheduleResult.scheduleId,
        })
      } else {
        res.status(400).json({
          error: 'Scheduling failed',
          details: scheduleResult.error,
        })
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Validation error', details: error.issues })
      }
      log.error({ err: error }, 'Scheduling API error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/publishing/analytics/:postId - Get analytics for a specific post
router.get('/analytics/:postId', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as any
    const { postId } = req.params
    const { platform, accessToken } = req.query

    if (!platform || typeof platform !== 'string') {
      return res.status(400).json({ error: 'Platform is required' })
    }

    if (!accessToken || typeof accessToken !== 'string') {
      return res.status(400).json({ error: 'Access token is required' })
    }

    // Verify platform is valid
    if (!['instagram', 'facebook', 'linkedin'].includes(platform)) {
      return res.status(400).json({ error: 'Invalid platform' })
    }

    const analytics = await PublishingService.getAnalytics(
      postId,
      platform as any,
      accessToken
    )

    if (analytics) {
      res.json({ analytics })
    } else {
      res.status(404).json({ error: 'Analytics not available' })
    }
  } catch (error) {
    log.error({ err: error, postId: req.params.postId }, 'Analytics API error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/publishing/batch - Batch publish multiple pieces of content
router.post('/batch', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as any
    const { contents, platform, credentials } = req.body

    if (!Array.isArray(contents) || contents.length === 0) {
      return res.status(400).json({ error: 'Contents array is required' })
    }

    if (!platform || !credentials) {
      return res
        .status(400)
        .json({ error: 'Platform and credentials are required' })
    }

    // Validate each content item
    for (const content of contents) {
      if (!content.assetId || !content.caption) {
        return res
          .status(400)
          .json({ error: 'Each content item must have assetId and caption' })
      }

      // Verify asset belongs to current agency
      const asset = AuthModel.getAssetById(content.assetId)
      if (!asset) {
        return res
          .status(404)
          .json({ error: `Asset ${content.assetId} not found` })
      }

      // Verify asset belongs to current agency via workspace
      const workspace = AuthModel.getWorkspaceById(asset.workspaceId)
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }
    }

    // Convert content items to proper format
    const formattedContents = contents.map((content) => ({
      workspaceId: AuthModel.getAssetById(content.assetId)!.workspaceId,
      assetId: content.assetId,
      caption: content.caption,
      imageUrl: AuthModel.getAssetById(content.assetId)!.url,
      creativeType: content.creativeType || 'feed',
    }))

    const batchResult = await PublishingService.batchPublish(
      formattedContents,
      {
        platform,
        credentials,
      }
    )

    res.json(batchResult)
  } catch (error) {
    log.error({ err: error }, 'Batch publishing API error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/publishing/stats/:workspaceId - Get publishing statistics for a workspace
router.get('/stats/:workspaceId', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as any
    const { workspaceId } = req.params

    // Verify workspace belongs to current agency
    const workspace = AuthModel.getWorkspaceById(workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const stats = await PublishingService.getPublishingStats(workspaceId)

    res.json({ stats })
  } catch (error) {
    log.error(
      { err: error, workspaceId: req.params.workspaceId },
      'Publishing stats API error'
    )
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
