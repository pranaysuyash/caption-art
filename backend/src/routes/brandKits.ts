import { Router } from 'express'
import { z } from 'zod'
import { getPrismaClient } from '../lib/prisma'
import { log } from '../middleware/logger'
import { createAuthMiddleware } from '../routes/auth'
import { validateRequest } from '../middleware/validation'
import { AuthenticatedRequest } from '../types/auth'
import { MaskingService } from '../services/maskingService'

const router = Router()
const requireAuth = createAuthMiddleware() as any
const prisma = getPrismaClient()

// Validation schemas
const createBrandKitSchema = z.object({
  workspaceId: z.string().min(1),
  colors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
    secondary: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
    tertiary: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  }),
  fonts: z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
  }),
  logo: z
    .object({
      url: z.string().url(),
      position: z.enum([
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ]),
    })
    .optional(),
  voicePrompt: z.string().min(1).max(500),
})

const updateBrandKitSchema = z.object({
  colors: z
    .object({
      primary: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
      secondary: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
      tertiary: z
        .string()
        .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
    })
    .optional(),
  fonts: z
    .object({
      heading: z.string().min(1),
      body: z.string().min(1),
    })
    .optional(),
  logo: z
    .object({
      url: z.string().url(),
      position: z.enum([
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
      ]),
    })
    .optional(),
  voicePrompt: z.string().min(1).max(500).optional(),
})

// POST /api/brand-kits - Create new brand kit
router.post(
  '/',
  requireAuth,
  validateRequest({ body: createBrandKitSchema }),
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      let brandKitData = req.body
      // sanitize voice prompt to avoid injection patterns
      if (brandKitData.voicePrompt) {
        const { sanitizeText } = await import('../utils/sanitizers')
        brandKitData = {
          ...brandKitData,
          voicePrompt: sanitizeText(brandKitData.voicePrompt, 500),
        }
      }

      // Verify workspace belongs to current agency
      const workspace = await prisma.workspace.findUnique({
        where: { id: brandKitData.workspaceId },
      })
      if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' })
      }

      if (workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      const brandKit = await prisma.brandKit.create({
        data: {
          workspaceId: brandKitData.workspaceId,
          agencyId: authenticatedReq.agency.id,
          primaryColor: brandKitData.colors.primary,
          secondaryColor: brandKitData.colors.secondary,
          tertiaryColor: brandKitData.colors.tertiary,
          headingFont: brandKitData.fonts.heading,
          bodyFont: brandKitData.fonts.body,
          logoUrl: brandKitData.logo?.url,
          logoPosition: brandKitData.logo?.position,
          voicePrompt: brandKitData.voicePrompt,
        },
      })

      res.status(201).json({ brandKit })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Invalid input', details: error.issues })
      }
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }
      log.error({ err: error }, 'Create brand kit error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/brand-kits/:id - Get specific brand kit
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params
    const brandKit = await prisma.brandKit.findUnique({
      where: { id },
    })

    if (!brandKit) {
      return res.status(404).json({ error: 'Brand kit not found' })
    }

    // Verify brand kit belongs to agency via workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: brandKit.workspaceId },
    })
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json({ brandKit })
  } catch (error) {
    log.error({ err: error }, 'Get brand kit error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/brand-kits/:id - Update brand kit
router.put(
  '/:id',
  requireAuth,
  validateRequest({ body: updateBrandKitSchema }),
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest
      const { id } = req.params
      let updates = req.body
      if (updates.voicePrompt) {
        const { sanitizeText } = await import('../utils/sanitizers')
        updates = {
          ...updates,
          voicePrompt: sanitizeText(updates.voicePrompt, 500),
        }
      }

      const brandKit = await prisma.brandKit.findUnique({ where: { id } })
      if (!brandKit) {
        return res.status(404).json({ error: 'Brand kit not found' })
      }

      // Verify brand kit belongs to agency via workspace
      const workspace = await prisma.workspace.findUnique({
        where: { id: brandKit.workspaceId },
      })
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      // Build update data, converting colors/fonts objects to flat structure
      const updateData: any = {}
      if (updates.colors) {
        if (updates.colors.primary)
          updateData.primaryColor = updates.colors.primary
        if (updates.colors.secondary)
          updateData.secondaryColor = updates.colors.secondary
        if (updates.colors.tertiary)
          updateData.tertiaryColor = updates.colors.tertiary
      }
      if (updates.fonts) {
        if (updates.fonts.heading)
          updateData.headingFont = updates.fonts.heading
        if (updates.fonts.body) updateData.bodyFont = updates.fonts.body
      }
      if (updates.logo) {
        updateData.logoUrl = updates.logo.url
        updateData.logoPosition = updates.logo.position
      }
      if (updates.voicePrompt) updateData.voicePrompt = updates.voicePrompt

      const updatedBrandKit = await prisma.brandKit.update({
        where: { id },
        data: updateData,
      })

      res.json({ brandKit: updatedBrandKit })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ error: 'Invalid input', details: error.issues })
      }
      log.error({ err: error }, 'Update brand kit error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /api/brand-kits/:id - Delete brand kit
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const brandKit = await prisma.brandKit.findUnique({ where: { id } })

    if (!brandKit) {
      return res.status(404).json({ error: 'Brand kit not found' })
    }

    // Verify brand kit belongs to agency via workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: brandKit.workspaceId },
    })
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Check if brand kit is in use before deletion
    const isInUse = await prisma.campaign.count({ where: { brandKitId: id } })
    if (isInUse > 0) {
      return res.status(400).json({ error: 'Brand kit is in use by campaigns' })
    }

    await prisma.brandKit.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    log.error({ err: error }, 'Delete brand kit error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/brand-kits/workspace/:workspaceId - Get brand kit by workspace
router.get('/workspace/:workspaceId', requireAuth, async (req, res) => {
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

    const brandKit = await prisma.brandKit.findUnique({
      where: { workspaceId },
    })
    if (!brandKit) {
      return res.status(404).json({ error: 'Brand kit not found' })
    }

    res.json({ brandKit })
  } catch (error) {
    log.error({ err: error }, 'Get brand kit by workspace error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/brand-kits/masking-models - Get available masking models
router.get('/masking-models', (req, res) => {
  try {
    const models = MaskingService.getAvailableModels()
    const defaultModel = MaskingService.getDefaultModel()

    res.json({
      models,
      defaultModel,
      count: Object.keys(models).length,
    })
  } catch (error) {
    log.error({ err: error }, 'Get masking models error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/brand-kits/:id/masking-model - Update brand kit masking model
router.put('/:id/masking-model', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const updateSchema = z.object({
      maskingModel: z.enum([
        'rembg-replicate',
        'sam3',
        'rf-detr',
        'roboflow',
        'hf-model-id',
      ]),
    })

    const { maskingModel } = (req as any).validatedData

    const brandKit = await prisma.brandKit.findUnique({
      where: { id },
    })
    if (!brandKit) {
      return res.status(404).json({ error: 'Brand kit not found' })
    }

    // Verify brand kit belongs to current agency via workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: brandKit.workspaceId },
    })
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Update brand kit with masking model
    const updatedBrandKit = await prisma.brandKit.update({
      where: { id },
      data: {
        maskingModel,
      },
    })

    if (!updatedBrandKit) {
      return res.status(404).json({ error: 'Brand kit not found' })
    }

    res.json({
      message: 'Masking model updated successfully',
      brandKit: updatedBrandKit,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: error.issues })
    }
    log.error({ err: error }, 'Update masking model error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
