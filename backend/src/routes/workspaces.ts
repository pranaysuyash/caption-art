import { Router } from 'express'
import { z } from 'zod'
import { getPrismaClient } from '../lib/prisma'
import { log } from '../middleware/logger'
import { createAuthMiddleware } from '../routes/auth'
import { validateRequest } from '../middleware/validation'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
const requireAuth = createAuthMiddleware()
const prisma = getPrismaClient()

// Validation schemas
const createWorkspaceSchema = z.object({
  clientName: z.string().min(1).max(100),
  industry: z.string().max(100).optional(),
})

const updateWorkspaceSchema = z.object({
  clientName: z.string().min(1).max(100).optional(),
  industry: z.string().max(100).optional(),
  brandKitId: z.string().optional(),
})

// GET /api/workspaces - List all workspaces for the authenticated agency
router.get('/', requireAuth as any, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const workspaces = await prisma.workspace.findMany({
      where: { agencyId: authenticatedReq.agency.id },
      include: { brandKit: true },
    })
    res.json({ workspaces })
  } catch (error) {
    log.error({ err: error }, 'Failed to fetch workspaces')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/workspaces - Create new workspace
router.post(
  '/',
  requireAuth as any,
  validateRequest({ body: createWorkspaceSchema }),
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      const { clientName, industry } = req.body

      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          agencyId: authenticatedReq.agency.id,
          clientName,
          industry,
        },
      })

      // Seed a default brand kit so downstream flows have a real kit
      const defaultBrandKit = await prisma.brandKit
        .create({
          data: {
            workspaceId: workspace.id,
            agencyId: authenticatedReq.agency.id,
            primaryColor: '#FF6B6B',
            secondaryColor: '#4ECDC4',
            tertiaryColor: '#FFE66D',
            headingFont: 'Space Grotesk',
            bodyFont: 'JetBrains Mono',
            voicePrompt:
              'Bold, friendly, and clear. Keep copy concise, action-oriented, and on-brand.',
            brandPersonality: 'Creative, confident, collaborative',
            targetAudience: 'Modern creative teams and marketers',
            valueProposition: 'Faster, better on-brand captions and creatives',
            forbiddenPhrases: JSON.stringify([]),
            preferredPhrases: JSON.stringify([]),
          },
        })
        .catch((err: any) => {
          log.warn({ err }, 'Failed to create default brand kit for workspace')
          return null
        })

      if (process.env.NODE_ENV !== 'production') {
        log.info({ workspace, defaultBrandKit }, 'Created workspace (debug)')
      }
      res.status(201).json({ workspace, brandKit: defaultBrandKit })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Invalid input', details: error.issues })
      }
      log.error({ err: error }, 'Create workspace error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/workspaces/:id - Get specific workspace
router.get('/:id', requireAuth as any, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const workspace = await prisma.workspace.findUnique({
      where: { id },
      include: { brandKit: true },
    })

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json({ workspace })
  } catch (error) {
    log.error({ err: error }, 'Failed to fetch workspace')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/workspaces/:id - Update workspace
router.put(
  '/:id',
  requireAuth as any,
  validateRequest({
    params: z.object({ id: z.string().min(1) }),
    body: updateWorkspaceSchema,
  }),
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      const { id } = req.params
      const updates = req.body

      const workspace = await prisma.workspace.findUnique({ where: { id } })
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' })
      }

      if (workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const updatedWorkspace = await prisma.workspace.update({
        where: { id },
        data: updates,
        include: { brandKit: true },
      })

      res.json({ workspace: updatedWorkspace })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Invalid input', details: error.issues })
      }
      log.error({ err: error }, 'Update workspace error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /api/workspaces/:id - Archive workspace (soft delete)
router.delete('/:id', requireAuth as any, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const workspace = await prisma.workspace.findUnique({ where: { id } })

    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Soft delete: mark as archived by prefixing the name
    await prisma.workspace.update({
      where: { id },
      data: {
        clientName: `[ARCHIVED] ${workspace.clientName}`,
      },
    })

    res.json({ message: 'Workspace archived successfully' })
  } catch (error) {
    log.error({ err: error }, 'Archive workspace error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
