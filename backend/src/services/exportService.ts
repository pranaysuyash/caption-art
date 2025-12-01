import archiver from 'archiver'
import fs from 'fs'
import path from 'path'
import { AuthModel, Caption, Asset, GeneratedAsset } from '../models/auth'

export interface ExportOptions {
  includeAssets: boolean
  includeCaptions: boolean
  includeGeneratedImages: boolean
  format: 'zip' | 'json'
}

export class ExportService {
  /**
   * Create a zip export of approved captions and assets
   */
  static async createExport(
    workspaceId: string,
    options: ExportOptions = { includeAssets: false, includeCaptions: true, includeGeneratedImages: true, format: 'zip' }
  ): Promise<{ zipFilePath: string; fileName: string }> {
    const workspace = AuthModel.getWorkspaceById(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    const approvedCaptions = AuthModel.getApprovedCaptionsByWorkspace(workspaceId)
    const approvedGeneratedAssets = AuthModel.getApprovedGeneratedAssets(workspaceId)

    if (approvedCaptions.length === 0 && approvedGeneratedAssets.length === 0) {
      throw new Error('No approved content found for export')
    }

    const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const fileName = `${workspace.clientName.replace(/[^a-zA-Z0-9]/g, '_')}_export_${exportId}.zip`
    const zipFilePath = path.join(process.cwd(), 'exports', fileName)

    // Ensure exports directory exists
    const exportsDir = path.dirname(zipFilePath)
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true })
    }

    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipFilePath)
      const archive = archiver('zip', { zlib: { level: 9 } })

      output.on('close', () => {
        resolve({ zipFilePath, fileName })
      })

      archive.on('error', (err) => {
        reject(err)
      })

      archive.pipe(output)

      try {
        // Add metadata
        const metadata = {
          exportDate: new Date().toISOString(),
          workspace: {
            id: workspace.id,
            clientName: workspace.clientName,
          },
          counts: {
            captions: approvedCaptions.length,
            generatedImages: approvedGeneratedAssets.length,
            assets: options.includeAssets ? approvedCaptions.length : 0,
          },
          brandKit: AuthModel.getBrandKitByWorkspace(workspaceId),
        }

        archive.append(JSON.stringify(metadata, null, 2), { name: 'metadata.json' })

        if (options.includeCaptions) {
          // Add captions as text file
          const captionsText = approvedCaptions.map((caption, index) => {
            const asset = AuthModel.getAssetById(caption.assetId)
            return `=== Caption ${index + 1} ===\n` +
                   `Asset: ${asset?.originalName || 'Unknown'}\n` +
                   `Caption: ${caption.text}\n` +
                   `Generated: ${caption.generatedAt?.toISOString() || 'Unknown'}\n` +
                   `Approved: ${caption.approvedAt?.toISOString() || 'Unknown'}\n\n`
          }).join('')

          archive.append(captionsText, { name: 'captions.txt' })

          // Add captions as JSON
          const enrichedCaptions = approvedCaptions.map(caption => {
            const asset = AuthModel.getAssetById(caption.assetId)
            return {
              ...caption,
              approved: caption.approvalStatus === 'approved',
              asset: asset ? {
                id: asset.id,
                originalName: asset.originalName,
                mimeType: asset.mimeType,
              } : null,
            }
          })

          archive.append(JSON.stringify(enrichedCaptions, null, 2), { name: 'captions.json' })
        }

        if (options.includeAssets) {
          // Create assets directory and add original files
          for (const caption of approvedCaptions) {
            const asset = AuthModel.getAssetById(caption.assetId)
            if (asset && fs.existsSync(path.join(process.cwd(), asset.url))) {
              const assetFilePath = path.join(process.cwd(), asset.url)
              const zipAssetPath = path.join('assets', 'originals', asset.originalName)
              archive.file(assetFilePath, { name: zipAssetPath })
            }
          }
        }

        if (options.includeGeneratedImages) {
          // Create generated-images directory and add rendered images
          for (const generatedAsset of approvedGeneratedAssets) {
            if (fs.existsSync(path.join(process.cwd(), generatedAsset.imageUrl))) {
              const imageFilePath = path.join(process.cwd(), generatedAsset.imageUrl)
              const zipImagePath = path.join('generated-images', `${generatedAsset.format}`, generatedAsset.layout, `${path.basename(generatedAsset.imageUrl)}`)
              archive.file(imageFilePath, { name: zipImagePath })
            }
          }
        }

        // Add README
        const readme = `# ${workspace.clientName} Export

This export contains approved captions and assets from the caption-art system.

## Contents:
- metadata.json: Export information and counts
- captions.txt: Human-readable captions with asset names
- captions.json: Machine-readable caption data
${options.includeAssets ? '- assets/originals/: Original asset files' : ''}
${options.includeGeneratedImages ? '- generated-images/: Rendered social media posts' : ''}

## Generated:
${new Date().toISOString()}

## Counts:
- Approved Captions: ${approvedCaptions.length}
${approvedGeneratedAssets.length > 0 ? `- Generated Images: ${approvedGeneratedAssets.length}` : ''}
${options.includeAssets ? `- Original Assets: ${approvedCaptions.length}` : ''}

Thank you for using caption-art!
`

        archive.append(readme, { name: 'README.md' })

        archive.finalize()
      } catch (error) {
        reject(error)
      }
    })
  }

  /**
   * Process an export job asynchronously
   */
  static async processExportJob(jobId: string): Promise<void> {
    try {
      const job = AuthModel.getExportJobById(jobId)
      if (!job) {
        throw new Error(`Export job ${jobId} not found`)
      }

      // Update job status to processing
      AuthModel.updateExportJob(jobId, {
        status: 'processing',
      })

      // Create the export
      const { zipFilePath } = await this.createExport(job.workspaceId, {
        includeAssets: false, // Don't include original assets by default
        includeCaptions: true,
        includeGeneratedImages: true,
        format: 'zip',
      })

      // Update job with completed status
      AuthModel.updateExportJob(jobId, {
        status: 'completed',
        zipFilePath,
        completedAt: new Date(),
      })

    } catch (error) {
      console.error(`Error processing export job ${jobId}:`, error)

      // Mark job as failed
      AuthModel.updateExportJob(jobId, {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Start a new export job for approved captions and generated assets
   */
  static async startExport(workspaceId: string): Promise<{ jobId: string; message: string }> {
    const approvedCaptions = AuthModel.getApprovedCaptionsByWorkspace(workspaceId)
    const approvedGeneratedAssets = AuthModel.getApprovedGeneratedAssets(workspaceId)

    if (approvedCaptions.length === 0 && approvedGeneratedAssets.length === 0) {
      throw new Error('No approved content found for export')
    }

    // Create export job
    const job = AuthModel.createExportJob(
      workspaceId,
      approvedCaptions.length + approvedGeneratedAssets.length,
      approvedCaptions.length,
      approvedGeneratedAssets.length
    )

    // Start processing in background
    this.processExportJob(job.id).catch(error => {
      console.error(`Background export processing failed for job ${job.id}:`, error)
    })

    const totalContent = approvedCaptions.length + approvedGeneratedAssets.length
    return {
      jobId: job.id,
      message: `Export started for ${totalContent} approved items (${approvedCaptions.length} captions, ${approvedGeneratedAssets.length} generated images)`,
    }
  }

  /**
   * Clean up old export files
   */
  static async cleanupOldExports(olderThanHours: number = 24): Promise<number> {
    const exportsDir = path.join(process.cwd(), 'exports')
    if (!fs.existsSync(exportsDir)) {
      return 0
    }

    const files = fs.readdirSync(exportsDir)
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000)
    let deletedCount = 0

    for (const file of files) {
      const filePath = path.join(exportsDir, file)
      const stats = fs.statSync(filePath)

      if (stats.mtime.getTime() < cutoffTime) {
        try {
          fs.unlinkSync(filePath)
          deletedCount++
        } catch (error) {
          console.error(`Error deleting old export file ${file}:`, error)
        }
      }
    }

    return deletedCount
  }
}