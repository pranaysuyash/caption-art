import { createCanvas, loadImage, registerFont } from 'canvas'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'
import { createHash } from 'crypto'
import { AuthModel, BrandKit, Agency } from '../models/auth'
import { log } from '../middleware/logger'
import { MaskingService } from './maskingService'
import { CacheService } from './CacheService'

export interface RenderOptions {
  format: 'instagram-square' | 'instagram-story'
  layout: 'center-focus' | 'bottom-text' | 'top-text'
  caption: string
  brandKit: BrandKit
  watermark: boolean
  quality?: number
  workspaceId: string
}

export interface RenderResult {
  imageUrl: string
  thumbnailUrl: string
  width: number
  height: number
}

export class ImageRenderer {
  private static OUTPUT_DIR = path.join(process.cwd(), 'generated')
  private static THUMBNAIL_SIZE = 300

  // Format dimensions
  private static DIMENSIONS = {
    'instagram-square': { width: 1080, height: 1080 },
    'instagram-story': { width: 1080, height: 1920 },
  }

  static async initialize(): Promise<void> {
    // Ensure output directory exists
    if (!fs.existsSync(this.OUTPUT_DIR)) {
      fs.mkdirSync(this.OUTPUT_DIR, { recursive: true })
    }

    // Register fonts (you may need to provide actual font files)
    // For now, we'll use system fonts
    try {
      // Attempt to register common fonts
      registerFont(path.join(process.cwd(), 'fonts', 'Inter-Bold.ttf'), {
        family: 'Inter Bold',
      })
      registerFont(path.join(process.cwd(), 'fonts', 'Inter-Regular.ttf'), {
        family: 'Inter Regular',
      })
    } catch (error) {
      log.warn('Custom fonts not found, using system fonts')
    }
  }

  /**
   * Remove background from image using configurable masking service
   */
  private static async removeBackground(
    imagePath: string,
    workspaceId: string
  ): Promise<Buffer> {
    try {
      // Get masking model preference from workspace brand kit
      const brandKit = AuthModel.getBrandKitByWorkspace(workspaceId)
      const maskingModel =
        brandKit?.maskingModel || MaskingService.getDefaultModel()

      // Apply masking using the selected model
      const maskingResult = await MaskingService.applyMasking({
        imagePath,
        model: maskingModel,
      })

      // Read the processed image
      return fs.readFileSync(maskingResult.maskPath)
    } catch (error) {
      log.error({ err: error }, 'Background removal failed')
      // Fallback: return original image
      return fs.readFileSync(imagePath)
    }
  }

  /**
   * Apply mask to isolate subject
   */
  private static async applyMask(
    imagePath: string,
    workspaceId: string
  ): Promise<Buffer> {
    return await this.removeBackground(imagePath, workspaceId)
  }

  /**
   * Generate a color palette from brand colors
   */
  private static generateColorPalette(brandKit: BrandKit) {
    return {
      primary: brandKit.colors.primary,
      secondary: brandKit.colors.secondary,
      tertiary: brandKit.colors.tertiary,
      text: this.getContrastColor(brandKit.colors.primary),
      background: this.lightenColor(brandKit.colors.primary, 95),
    }
  }

  /**
   * Get contrasting text color
   */
  private static getContrastColor(hexColor: string): string {
    const r = parseInt(hexColor.slice(1, 3), 16)
    const g = parseInt(hexColor.slice(3, 5), 16)
    const b = parseInt(hexColor.slice(5, 7), 16)
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luminance > 0.5 ? '#000000' : '#FFFFFF'
  }

  /**
   * Lighten a color
   */
  private static lightenColor(hexColor: string, percent: number): string {
    const num = parseInt(hexColor.slice(1), 16)
    const amt = Math.round(2.55 * percent)
    const R = (num >> 16) + amt
    const G = ((num >> 8) & 0x00ff) + amt
    const B = (num & 0x0000ff) + amt
    return (
      '#' +
      (
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
      )
        .toString(16)
        .slice(1)
    )
  }

  /**
   * Wrap text to fit within specified width
   */
  private static wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      if (testLine.length > maxWidth) {
        if (currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          lines.push(word)
        }
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }

    return lines
  }

  /**
   * Render the main image with text and branding
   */
  static async renderImage(
    sourceImagePath: string,
    options: RenderOptions
  ): Promise<RenderResult> {
    await this.initialize()

    // Create cache key based on image path and render options
    const hashSource = `${sourceImagePath}_${options.format}_${options.layout}_${options.caption}_${options.watermark}_${JSON.stringify(options.brandKit)}`
    const cacheKey = `render_${createHash('md5').update(hashSource).digest('hex')}`
    const cacheService = CacheService.getInstance()

    // Try to get from cache first
    const cachedResult = await cacheService.get<RenderResult>(cacheKey)
    if (cachedResult) {
      log.info({ cacheKey }, 'Image rendered from cache')
      return cachedResult
    }

    const {
      format,
      layout,
      caption,
      brandKit,
      watermark,
      quality = 90,
    } = options
    const dimensions = this.DIMENSIONS[format]
    const colors = this.generateColorPalette(brandKit)

    // Create canvas
    const canvas = createCanvas(dimensions.width, dimensions.height)
    const ctx = canvas.getContext('2d')

    // Fill background
    ctx.fillStyle = colors.background
    ctx.fillRect(0, 0, dimensions.width, dimensions.height)

    try {
      // Apply mask to source image
      const maskedImageBuffer = await this.applyMask(
        sourceImagePath,
        options.workspaceId
      )
      const maskedImage = await loadImage(maskedImageBuffer)

      // Calculate subject dimensions and position based on layout
      let subjectX, subjectY, subjectWidth, subjectHeight

      switch (layout) {
        case 'center-focus':
          subjectWidth = dimensions.width * 0.8
          subjectHeight = dimensions.height * 0.6
          subjectX = (dimensions.width - subjectWidth) / 2
          subjectY = (dimensions.height - subjectHeight) / 2
          break

        case 'bottom-text':
          subjectWidth = dimensions.width * 0.9
          subjectHeight = dimensions.height * 0.7
          subjectX = (dimensions.width - subjectWidth) / 2
          subjectY = dimensions.height * 0.1
          break

        case 'top-text':
          subjectWidth = dimensions.width * 0.9
          subjectHeight = dimensions.height * 0.7
          subjectX = (dimensions.width - subjectWidth) / 2
          subjectY = dimensions.height * 0.2
          break

        default:
          subjectWidth = dimensions.width * 0.8
          subjectHeight = dimensions.height * 0.6
          subjectX = (dimensions.width - subjectWidth) / 2
          subjectY = (dimensions.height - subjectHeight) / 2
      }

      // Draw the masked subject
      ctx.drawImage(
        maskedImage,
        subjectX,
        subjectY,
        subjectWidth,
        subjectHeight
      )

      // Add caption text
      if (caption) {
        const maxCharsPerLine = Math.floor(dimensions.width / 20) // Approximate character width
        const lines = this.wrapText(caption, maxCharsPerLine)

        let textY: number
        const fontSize = Math.max(24, Math.floor(dimensions.width / 30))
        ctx.font = `bold ${fontSize}px "${brandKit.fonts.heading}"`
        ctx.fillStyle = colors.text
        ctx.textAlign = 'center'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2

        switch (layout) {
          case 'bottom-text':
            textY = dimensions.height * 0.85
            break
          case 'top-text':
            textY = dimensions.height * 0.1 + lines.length * fontSize * 1.2
            break
          case 'center-focus':
          default:
            textY = dimensions.height * 0.9
            break
        }

        lines.forEach((line, index) => {
          const lineY = textY + index * fontSize * 1.2
          ctx.fillText(line, dimensions.width / 2, lineY)
        })
      }

      // Add watermark for free users
      if (watermark) {
        ctx.font = '14px Arial'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.textAlign = 'right'
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
        ctx.shadowBlur = 2
        ctx.fillText(
          'caption-art.app',
          dimensions.width - 10,
          dimensions.height - 10
        )
      }

      // Add brand color accent
      ctx.fillStyle = colors.primary
      ctx.fillRect(0, 0, dimensions.width, 8) // Top border
      ctx.fillRect(0, dimensions.height - 8, dimensions.width, 8) // Bottom border

      // Generate unique filename
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const baseFilename = `render_${timestamp}_${random}`

      // Save main image
      const mainFilename = `${baseFilename}.jpg`
      const mainPath = path.join(this.OUTPUT_DIR, mainFilename)
      const buffer = canvas.toBuffer('image/jpeg', { quality })
      fs.writeFileSync(mainPath, buffer)

      // Generate and save thumbnail
      const thumbnailFilename = `${baseFilename}_thumb.jpg`
      const thumbnailPath = path.join(this.OUTPUT_DIR, thumbnailFilename)

      await sharp(buffer)
        .resize(this.THUMBNAIL_SIZE, this.THUMBNAIL_SIZE, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath)

      const result = {
        imageUrl: `/generated/${mainFilename}`,
        thumbnailUrl: `/generated/${thumbnailFilename}`,
        width: dimensions.width,
        height: dimensions.height,
      }

      // Cache the result for faster retrieval next time
      await cacheService.set(cacheKey, result, 24 * 60 * 60 * 1000) // Cache for 24 hours

      return result
    } catch (error) {
      log.error({ err: error }, 'Image rendering failed')
      throw new Error(
        `Failed to render image: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Render multiple images for different formats
   */
  static async renderMultipleFormats(
    sourceImagePath: string,
    caption: string,
    brandKit: BrandKit,
    agency: Agency,
    workspaceId: string
  ): Promise<Array<{ format: string; layout: string } & RenderResult>> {
    const watermark = agency.planType === 'free'
    const results = []

    // Render Instagram Square (2 layouts)
    for (const layout of ['center-focus', 'bottom-text'] as const) {
      try {
        const result = await this.renderImage(sourceImagePath, {
          format: 'instagram-square',
          layout,
          caption,
          brandKit,
          watermark,
          workspaceId,
        })
        results.push({ format: 'instagram-square', layout, ...result })
      } catch (error) {
        log.error({ err: error, layout }, `Failed to render ${layout}`)
      }
    }

    // Render Instagram Story (1 layout)
    try {
      const result = await this.renderImage(sourceImagePath, {
        format: 'instagram-story',
        layout: 'center-focus',
        caption,
        brandKit,
        watermark,
        workspaceId,
      })
      results.push({
        format: 'instagram-story',
        layout: 'center-focus',
        ...result,
      })
    } catch (error) {
      log.error({ err: error }, 'Failed to render story')
    }

    return results
  }

  /**
   * Clean up old generated files
   */
  static async cleanupOldFiles(olderThanHours: number = 24): Promise<number> {
    if (!fs.existsSync(this.OUTPUT_DIR)) {
      return 0
    }

    const files = fs.readdirSync(this.OUTPUT_DIR)
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000
    let deletedCount = 0

    for (const file of files) {
      const filePath = path.join(this.OUTPUT_DIR, file)
      const stats = fs.statSync(filePath)

      if (stats.mtime.getTime() < cutoffTime) {
        try {
          fs.unlinkSync(filePath)
          deletedCount++
        } catch (error) {
          log.error(
            { err: error, file },
            `Error deleting old generated file ${file}`
          )
        }
      }
    }

    return deletedCount
  }
}
