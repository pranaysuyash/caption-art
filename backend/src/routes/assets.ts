import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { getPrismaClient } from '../lib/prisma'
import { log } from '../middleware/logger'
import { createAuthMiddleware } from '../routes/auth'
import { AuthenticatedRequest } from '../types/auth'
import { UploadAssetsSchema } from '../schemas/validation'
import { safeValidateData } from '../middleware/validation'

const router = Router()
const prisma = getPrismaClient()
const requireAuth = createAuthMiddleware() as any

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads')
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true })
    }
    cb(null, uploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`)
  },
})

const fileFilter = (req: any, file: Express.Multer.File, cb: any) => {
  // Allow common image and video formats
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
  ]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 20, // Max 20 files
  },
})

// POST /api/assets/upload - Upload multiple assets
router.post(
  '/upload',
  requireAuth,
  upload.array('files', 10),
  async (req, res) => {
    try {
      const authenticatedReq = req as unknown as AuthenticatedRequest

      // Validate workspaceId parameter using safe validation
      const validation = safeValidateData(
        { workspaceId: req.body.workspaceId },
        UploadAssetsSchema.pick({ workspaceId: true })
      )

      if (!validation.success) {
        const err = (validation as any).error
        return res.status(400).json({
          error: 'Validation error',
          details: err.issues.map((issue: any) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        })
      }

      const { workspaceId } = validation.data

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

      const files = req.files as Express.Multer.File[]
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' })
      }

      // Check current asset count
      const existingAssets = await prisma.asset.count({
        where: { workspaceId },
      })
      if (existingAssets + files.length > 20) {
        return res.status(400).json({
          error: `Cannot upload ${files.length} files. Maximum 20 assets allowed per workspace. Currently have ${existingAssets}.`,
        })
      }

      const uploadedAssets = []
      for (const file of files) {
        const asset = await prisma.asset.create({
          data: {
            workspaceId,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            url: `/uploads/${file.filename}`,
          },
        })
        uploadedAssets.push(asset)
      }

      res.status(201).json({
        message: `Successfully uploaded ${uploadedAssets.length} assets`,
        assets: uploadedAssets,
      })
    } catch (error) {
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message })
      }
      log.error({ err: error }, 'Upload assets error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/assets/workspace/:workspaceId - Get all assets for a workspace
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

    const assets = await prisma.asset.findMany({
      where: { workspaceId },
    })
    res.json({ assets })
  } catch (error) {
    log.error({ err: error }, 'Get assets by workspace error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/assets/:id - Get specific asset
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params
    const asset = await prisma.asset.findUnique({
      where: { id },
    })

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    // Verify asset belongs to agency via workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: asset.workspaceId },
    })
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    res.json({ asset })
  } catch (error) {
    log.error({ err: error }, 'Get asset error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// DELETE /api/assets/:id - Delete asset
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const authenticatedReq = req as unknown as AuthenticatedRequest
    const { id } = req.params
    const asset = await prisma.asset.findUnique({
      where: { id },
    })

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' })
    }

    // Verify asset belongs to agency via workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: asset.workspaceId },
    })
    if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    // Delete physical file
    const filename = asset.url.split('/').pop()
    if (filename) {
      const filePath = path.join(process.cwd(), 'uploads', filename)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
      }
    }

    await prisma.asset.delete({ where: { id } })
    res.json({ success: true })
  } catch (error) {
    log.error({ err: error }, 'Delete asset error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
