import { Router } from 'express'
import { z } from 'zod'
import { AuthModel } from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()
const requireAuth = createAuthMiddleware()

// Validation schemas
const createWorkspaceSchema = z.object({
  clientName: z.string().min(1).max(100),
})

const updateWorkspaceSchema = z.object({
  clientName: z.string().min(1).max(100).optional(),
  brandKitId: z.string().optional(),
})

// GET /api/workspaces - List all workspaces for the authenticated agency
router.get('/', requireAuth as any, (req, res) => {
  const authenticatedReq = req as unknown as AuthenticatedRequest
  const workspaces = AuthModel.getWorkspacesByAgency(authenticatedReq.agency.id)
  res.json({ workspaces })
})

// POST /api/workspaces - Create new workspace
router.post('/', requireAuth as any, (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { clientName } = createWorkspaceSchema.parse(req.body)

    const workspace = AuthModel.createWorkspace(
      authenticatedReq.agency.id,
      clientName
    )
    res.status(201).json({ workspace })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: error.issues })
    }
    console.error('Create workspace error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/workspaces/:id - Get specific workspace
router.get('/:id', requireAuth as any, (req, res) => {
  const authenticatedReq = req as unknown as AuthenticatedRequest
  const { id } = req.params
  const workspace = AuthModel.getWorkspaceById(id)

  if (!workspace) {
    return res.status(404).json({ error: 'Workspace not found' })
  }

  if (workspace.agencyId !== authenticatedReq.agency.id) {
    return res.status(403).json({ error: 'Access denied' })
  }

  res.json({ workspace })
})

// PUT /api/workspaces/:id - Update workspace
router.put('/:id', requireAuth as any, (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params
    const updates = updateWorkspaceSchema.parse(req.body)

    const workspace = AuthModel.getWorkspaceById(id)
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' })
    }

    if (workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    AuthModel.updateWorkspace(id, updates)
    const updatedWorkspace = AuthModel.getWorkspaceById(id)

    res.json({ workspace: updatedWorkspace })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ error: 'Invalid input', details: error.issues })
    }
    console.error('Update workspace error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/workspaces/:id - Archive workspace (soft delete)
router.delete('/:id', requireAuth as any, (req, res) => {
  const authenticatedReq = req as unknown as AuthenticatedRequest
  const { id } = req.params
  const workspace = AuthModel.getWorkspaceById(id)

  if (!workspace) {
    return res.status(404).json({ error: 'Workspace not found' })
  }

  if (workspace.agencyId !== authenticatedReq.agency.id) {
    return res.status(403).json({ error: 'Access denied' })
  }

  // For v1, we'll just mark it as archived in memory
  // In a real database, you'd do a soft delete
  AuthModel.updateWorkspace(id, {
    clientName: `[ARCHIVED] ${workspace.clientName}`,
    brandKitId: '',
  })

  res.json({ message: 'Workspace archived successfully' })
})

export default router
