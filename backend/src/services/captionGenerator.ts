import OpenAI from 'openai'
import { AuthModel } from '../models/auth'
import { ImageRenderer } from './imageRenderer'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GenerationRequest {
  assetId: string
  workspaceId: string
  brandVoicePrompt: string
  assetUrl?: string
  assetDescription?: string
}

export class CaptionGenerator {
  /**
   * Generate a caption for a single asset using AI
   */
  static async generateCaption(request: GenerationRequest): Promise<string> {
    const { assetId, workspaceId, brandVoicePrompt, assetDescription } = request

    // Get asset information outside try block for error handling
    const asset = AuthModel.getAssetById(assetId)
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`)
    }

    try {

      // Create a descriptive prompt based on asset type
      let assetTypeDescription = ''
      if (asset.mimeType.startsWith('image/')) {
        assetTypeDescription = `image named "${asset.originalName}"`
      } else if (asset.mimeType.startsWith('video/')) {
        assetTypeDescription = `video named "${asset.originalName}"`
      } else {
        assetTypeDescription = `media file named "${asset.originalName}"`
      }

      // Build the AI prompt
      const systemPrompt = `You are a professional social media caption writer. Your task is to create engaging, on-brand captions for visual content.

Brand Voice Instructions:
${brandVoicePrompt}

Guidelines:
- Write captions that are compelling and drive engagement
- Keep captions concise but impactful (1-3 sentences)
- Include relevant hashtags when appropriate
- Match the brand voice consistently
- Focus on the visual content's story or message
- Make it suitable for platforms like Instagram, Facebook, LinkedIn`

      const userPrompt = `Write a social media caption for this ${assetTypeDescription}. ${
        assetDescription ? `Additional context: ${assetDescription}` : ''
      }

Create a caption that aligns with the brand voice and would work well for social media platforms.`

      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      })

      const caption = completion.choices[0]?.message?.content?.trim()

      if (!caption) {
        throw new Error('Failed to generate caption: No content returned from AI')
      }

      return caption
    } catch (error) {
      console.error(`Error generating caption for asset ${assetId}:`, error)

      if (error instanceof Error) {
        // Return a fallback caption if AI generation fails
        return `Check out this ${asset?.originalName || 'content'}! 🎨 #creative #inspiration`
      }

      throw error
    }
  }

  /**
   * Process a batch job - generate captions and render images for all assets
   * This runs in a single thread (sequentially) as per v1 requirements
   */
  static async processBatchJob(jobId: string): Promise<void> {
    try {
      const job = AuthModel.getBatchJobById(jobId)
      if (!job) {
        throw new Error(`Batch job ${jobId} not found`)
      }

      if (job.status !== 'pending') {
        throw new Error(`Batch job ${jobId} is not in pending status`)
      }

      // Update job status to processing
      AuthModel.updateBatchJob(jobId, {
        status: 'processing',
        startedAt: new Date(),
      })

      // Get workspace brand kit for voice prompt and styling
      const brandKit = AuthModel.getBrandKitByWorkspace(job.workspaceId)
      if (!brandKit) {
        throw new Error(`No brand kit found for workspace ${job.workspaceId}`)
      }

      // Get workspace agency for watermark logic
      const workspace = AuthModel.getWorkspaceById(job.workspaceId)
      const agency = workspace ? AuthModel.getAgencyById(workspace.agencyId) : null

      let processedCount = 0

      // Process assets sequentially (single-threaded as per requirements)
      for (const assetId of job.assetIds) {
        try {
          const asset = AuthModel.getAssetById(assetId)
          if (!asset) {
            throw new Error(`Asset ${assetId} not found`)
          }

          // Create or get caption for this asset
          let caption = AuthModel.getCaptionsByAsset(assetId)[0]
          if (!caption) {
            caption = AuthModel.createCaption(assetId, job.workspaceId)
          }

          // Update caption status to generating
          AuthModel.updateCaption(caption.id, {
            status: 'generating',
          })

          // Generate caption using AI
          const captionText = await this.generateCaption({
            assetId,
            workspaceId: job.workspaceId,
            brandVoicePrompt: brandKit.voicePrompt,
          })

          // Update caption with generated text
          AuthModel.updateCaption(caption.id, {
            text: captionText,
            status: 'completed',
            generatedAt: new Date(),
          })

          // Generate rendered images if we have an agency for watermark logic
          if (agency) {
            const assetPath = path.join(process.cwd(), asset.url)

            // Render multiple formats for V1
            const renderedFormats = await ImageRenderer.renderMultipleFormats(
              assetPath,
              captionText,
              brandKit,
              agency
            )

            // Create generated asset records for each rendered format
            for (const rendered of renderedFormats) {
              AuthModel.createGeneratedAsset({
                jobId: jobId,
                sourceAssetId: assetId,
                workspaceId: job.workspaceId,
                captionId: caption.id,
                approvalStatus: 'pending',
                format: rendered.format as 'instagram-square' | 'instagram-story',
                layout: rendered.layout as 'center-focus' | 'bottom-text' | 'top-text',
                caption: captionText,
                imageUrl: rendered.imageUrl,
                thumbnailUrl: rendered.thumbnailUrl,
                watermark: agency.planType === 'free'
              })
            }
          }

          processedCount++
        } catch (error) {
          console.error(`Error processing asset ${assetId}:`, error)

          // Update caption status to failed
          const caption = AuthModel.getCaptionsByAsset(assetId)[0]
          if (caption) {
            AuthModel.updateCaption(caption.id, {
              status: 'failed',
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }

        // Update job progress
        AuthModel.updateBatchJob(jobId, {
          processedCount,
        })

        // Longer delay between requests when rendering images
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      // Mark job as completed
      AuthModel.updateBatchJob(jobId, {
        status: 'completed',
        completedAt: new Date(),
      })

    } catch (error) {
      console.error(`Error processing batch job ${jobId}:`, error)

      // Mark job as failed
      AuthModel.updateBatchJob(jobId, {
        status: 'failed',
        completedAt: new Date(),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  /**
   * Start batch generation for a list of assets
   */
  static async startBatchGeneration(
    workspaceId: string,
    assetIds: string[]
  ): Promise<{ jobId: string; message: string }> {
    // Validate workspace
    const workspace = AuthModel.getWorkspaceById(workspaceId)
    if (!workspace) {
      throw new Error('Workspace not found')
    }

    // Validate brand kit exists
    const brandKit = AuthModel.getBrandKitByWorkspace(workspaceId)
    if (!brandKit) {
      throw new Error('No brand kit found for this workspace. Please create a brand kit first.')
    }

    // Validate assets
    if (assetIds.length === 0) {
      throw new Error('No assets provided for generation')
    }

    if (assetIds.length > 30) {
      throw new Error('Maximum 30 assets allowed per batch')
    }

    // Verify all assets exist and belong to workspace
    for (const assetId of assetIds) {
      const asset = AuthModel.getAssetById(assetId)
      if (!asset) {
        throw new Error(`Asset ${assetId} not found`)
      }
      if (asset.workspaceId !== workspaceId) {
        throw new Error(`Asset ${assetId} does not belong to this workspace`)
      }
    }

    // Create batch job
    const job = AuthModel.createBatchJob(workspaceId, assetIds)

    // Start processing in background
    this.processBatchJob(job.id).catch(error => {
      console.error(`Background processing failed for job ${job.id}:`, error)
    })

    return {
      jobId: job.id,
      message: `Started batch generation for ${assetIds.length} assets`,
    }
  }
}