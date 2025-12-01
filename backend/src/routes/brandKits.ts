import { Router } from 'express'
import { z } from 'zod'
import { AuthModel } from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
const requireAuth = createAuthMiddleware() as any

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
router.post('/', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const brandKitData = createBrandKitSchema.parse(req.body)

    // Verify workspace belongs to current agency
    const workspace = AuthModel.getWorkspaceById(brandKitData.workspaceId)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const brandKit = await AuthModel.createBrandKit({
      workspaceId: brandKitData.workspaceId,
      colors: brandKitData.colors,
      fonts: brandKitData.fonts,
      logo: brandKitData.logo,
      voicePrompt: brandKitData.voicePrompt,
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
    console.error('Create brand kit error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/brand-kits/:id - Get specific brand kit
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params
    const brandKit = AuthModel.getBrandKitById(id)

    if (!brandKit) {
      return res.status(404).json({ error: 'Brand kit not found' })
    }

    // Verify brand kit belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(brandKit.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json({ brandKit })
  } catch (error) {
    console.error('Get brand kit error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/brand-kits/:id - Update brand kit
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params
    const updates = updateBrandKitSchema.parse(req.body)

    const brandKit = AuthModel.getBrandKitById(id)
    if (!brandKit) {
      return res.status(404).json({ error: 'Brand kit not found' })
    }

    // Verify brand kit belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(brandKit.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const updatedBrandKit = AuthModel.updateBrandKit(id, updates)
    if (!updatedBrandKit) {
      return res.status(404).json({ error: 'Brand kit not found' })
    }

    res.json({ brandKit: updatedBrandKit })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: error.issues })
    }
    console.error('Update brand kit error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/brand-kits/:id - Delete brand kit
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params
    const brandKit = AuthModel.getBrandKitById(id)

    if (!brandKit) {
      return res.status(404).json({ error: 'Brand kit not found' })
    }

    // Verify brand kit belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(brandKit.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const deleted = AuthModel.deleteBrandKit(id)
    if (!deleted) {
      return res.status(404).json({ error: 'Brand kit not found' })
    }

    res.json({ message: 'Brand kit deleted successfully' })
  } catch (error) {
    console.error('Delete brand kit error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/brand-kits/workspace/:workspaceId - Get brand kit by workspace
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

    const brandKit = AuthModel.getBrandKitByWorkspace(workspaceId)
    if (!brandKit) {
      return res.status(404).json({ error: 'Brand kit not found' })
    }

    res.json({ brandKit })
  } catch (error) {
    console.error('Get brand kit by workspace error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
