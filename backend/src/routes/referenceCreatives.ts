import { Router } from 'express'
import { z } from 'zod'
import { AuthModel, ReferenceCreative } from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import { AuthenticatedRequest } from '../types/auth'
import path from 'path'
import fs from 'fs'

const router = Router()
console.log('Initializing reference creatives router')
const requireAuth = createAuthMiddleware() as any

// Schema validation
const createReferenceCreativeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  campaignId: z.string().optional(),
  notes: z.string().optional(),
  workspaceId: z.string().min(1, 'Workspace ID is required'),
})

// Debug middleware
router.use((req, res, next) => {
  console.log('REFERENCE CREATIVES ROUTER REQ:', req.method, req.path)
  next()
})

// POST /api/reference-creatives/upload - Upload reference creative
router.post('/upload', requireAuth, async (req, res) => {
  console.log('Uploading reference creative')
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest

    // For now, handle file upload as base64 or URL
    // In a production system, you'd handle multipart/form-data
    const { name, campaignId, notes, workspaceId, imageUrl } = req.body

    // Validate required fields
    if (!name || !workspaceId || !imageUrl) {
      return res.status(400).json({ error: 'Name, workspaceId, and imageUrl are required' })
    }

    // Verify workspace belongs to agency
    const workspace = AuthModel.getWorkspaceById(workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Verify campaign exists and belongs to workspace if provided
    if (campaignId) {
      const campaign = AuthModel.getCampaignById(campaignId)
      if (!campaign || campaign.workspaceId !== workspaceId) {
        return res.status(404).json({ error: 'Campaign not found' })
      }
    }

    // Generate thumbnail URL (for now, use the same as image)
    const thumbnailUrl = imageUrl

    // Extract style information from the image
    const styleAnalysis = await extractStyleFromImage(imageUrl)

    const referenceCreative = await AuthModel.createReferenceCreative({
      name,
      campaignId,
      notes,
      workspaceId,
      imageUrl,
      thumbnailUrl,
      extractedColors: styleAnalysis.colors,
      detectedLayout: styleAnalysis.layout,
      textDensity: styleAnalysis.textDensity,
      styleTags: styleAnalysis.tags,
    })

    res.status(201).json({ referenceCreative })
  } catch (error) {
    console.error('Upload reference creative error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/reference-creatives - List reference creatives
router.get('/', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const workspaceId = req.query.workspaceId as string
    const campaignId = req.query.campaignId as string

    let referenceCreatives: ReferenceCreative[] = []

    if (campaignId) {
      // Get creatives for specific campaign
      referenceCreatives = AuthModel.getReferenceCreativesByCampaign(campaignId)
    } else if (workspaceId) {
      // Verify workspace belongs to agency
      const workspace = AuthModel.getWorkspaceById(workspaceId)
      if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' })
      }

      referenceCreatives = AuthModel.getReferenceCreativesByWorkspace(workspaceId)
    } else {
      // Get all creatives for agency
      const agencyWorkspaces = Array.from(AuthModel.getAllWorkspaces()).filter(w => w.agencyId === authenticatedReq.agency.id)
      const workspaceIds = agencyWorkspaces.map(w => w.id)

      for (const wsId of workspaceIds) {
        referenceCreatives.push(...AuthModel.getReferenceCreativesByWorkspace(wsId))
      }
    }

    res.json({ referenceCreatives })
  } catch (error) {
    console.error('List reference creatives error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/reference-creatives/:id - Get specific reference creative
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const referenceCreative = AuthModel.getReferenceCreativeById(id)
    if (!referenceCreative) {
      return res.status(404).json({ error: 'Reference creative not found' })
    }

    // Verify reference creative belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(referenceCreative.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Enrich with campaign info if available
    let campaign = null
    if (referenceCreative.campaignId) {
      campaign = AuthModel.getCampaignById(referenceCreative.campaignId)
    }

    res.json({ referenceCreative, campaign })
  } catch (error) {
    console.error('Get reference creative error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// PUT /api/reference-creatives/:id - Update reference creative
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const { name, notes, campaignId } = req.body

    const referenceCreative = AuthModel.getReferenceCreativeById(id)
    if (!referenceCreative) {
      return res.status(404).json({ error: 'Reference creative not found' })
    }

    // Verify reference creative belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(referenceCreative.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Verify campaign if provided
    if (campaignId && campaignId !== referenceCreative.campaignId) {
      const campaign = AuthModel.getCampaignById(campaignId)
      if (!campaign || campaign.workspaceId !== referenceCreative.workspaceId) {
        return res.status(404).json({ error: 'Campaign not found' })
      }
    }

    const updatedReferenceCreative = await AuthModel.updateReferenceCreative(id, {
      name,
      notes,
      campaignId,
    })

    res.json({ referenceCreative: updatedReferenceCreative })
  } catch (error) {
    console.error('Update reference creative error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/reference-creatives/:id - Delete reference creative
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const referenceCreative = AuthModel.getReferenceCreativeById(id)
    if (!referenceCreative) {
      return res.status(404).json({ error: 'Reference creative not found' })
    }

    // Verify reference creative belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(referenceCreative.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const deleted = AuthModel.deleteReferenceCreative(id)
    if (!deleted) {
      return res.status(404).json({ error: 'Reference creative not found' })
    }

    res.json({ message: 'Reference creative deleted successfully' })
  } catch (error) {
    console.error('Delete reference creative error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// POST /api/reference-creatives/:id/analyze - Re-analyze style from image
router.post('/:id/analyze', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params

    const referenceCreative = AuthModel.getReferenceCreativeById(id)
    if (!referenceCreative) {
      return res.status(404).json({ error: 'Reference creative not found' })
    }

    // Verify reference creative belongs to agency via workspace
    const workspace = AuthModel.getWorkspaceById(referenceCreative.workspaceId)
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Re-extract style information
    const styleAnalysis = await extractStyleFromImage(referenceCreative.imageUrl)

    const updatedReferenceCreative = await AuthModel.updateReferenceCreative(id, {
      extractedColors: styleAnalysis.colors,
      detectedLayout: styleAnalysis.layout,
      textDensity: styleAnalysis.textDensity,
      styleTags: styleAnalysis.tags,
    })

    res.json({
      referenceCreative: updatedReferenceCreative,
      analysis: styleAnalysis
    })
  } catch (error) {
    console.error('Analyze reference creative error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

/**
 * Extract style information from image URL
 * This is a placeholder implementation - in production you'd use image processing libraries
 */
async function extractStyleFromImage(imageUrl: string): Promise<{
  colors: string[]
  layout: 'center-focus' | 'bottom-text' | 'top-text' | 'split'
  textDensity: 'minimal' | 'moderate' | 'heavy'
  tags: string[]
}> {
  try {
    // Placeholder implementation - in production you'd:
    // 1. Download/load the image
    // 2. Use color-thief or similar to extract dominant colors
    // 3. Use OCR to detect text regions and density
    // 4. Analyze layout patterns
    // 5. Classify style attributes

    // For now, return mock data
    return {
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
      layout: 'center-focus',
      textDensity: 'moderate',
      tags: ['high-contrast', 'bold-typography', 'vibrant-colors', 'centered-layout']
    }
  } catch (error) {
    console.error('Style extraction failed:', error)
    // Return safe defaults
    return {
      colors: ['#000000', '#FFFFFF'],
      layout: 'center-focus',
      textDensity: 'minimal',
      tags: ['unknown']
    }
  }
}

export default router