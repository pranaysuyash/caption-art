import OpenAI from 'openai'
import { AuthModel } from '../models/auth'
import { log } from '../middleware/logger'
import { ImageRenderer } from './imageRenderer'
import { StyleAnalyzer, StyleProfile } from './styleAnalyzer'
import { CacheService } from './CacheService'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export type CaptionTemplate =
  | 'punchy'
  | 'descriptive'
  | 'hashtag-heavy'
  | 'storytelling'
  | 'question'
export type CaptionAngle =
  | 'emotional'
  | 'data-driven'
  | 'question-based'
  | 'cta-focused'
  | 'educational'

export interface GenerationRequest {
  assetId: string
  workspaceId: string
  brandVoicePrompt: string
  assetUrl?: string
  assetDescription?: string
  template?: CaptionTemplate
  angle?: CaptionAngle
  // Campaign context for quality
  campaignObjective?: string
  funnelStage?: string
  targetAudience?: string
  brandPersonality?: string
  valueProposition?: string
  mustIncludePhrases?: string[]
  mustExcludePhrases?: string[]
  platform?: string
  // Reference style injection
  referenceCaptions?: string[]
  learnedStyleProfile?: StyleProfile
}

export const CAPTION_TEMPLATES = {
  punchy: {
    name: 'Punchy & Bold',
    prompt:
      'Create short, punchy captions that grab attention immediately. Use strong action words, minimal text, and powerful statements. Perfect for bold brands.',
    length: '1-2 sentences',
    style: 'Bold, confident, attention-grabbing',
  },
  descriptive: {
    name: 'Descriptive & Detailed',
    prompt:
      'Create detailed, descriptive captions that tell the full story behind the image. Include context, details, and comprehensive information.',
    length: '3-5 sentences',
    style: 'Informative, thorough, educational',
  },
  'hashtag-heavy': {
    name: 'Hashtag-Heavy',
    prompt:
      'Create engaging captions with extensive hashtag strategy. Include 10-15 relevant hashtags, mix of broad and niche tags, and industry-specific keywords.',
    length: '2-3 sentences + hashtags',
    style: 'Discoverable, trending, community-focused',
  },
  storytelling: {
    name: 'Storytelling',
    prompt:
      'Create narrative-driven captions that tell a compelling story. Use emotional language, personal anecdotes, and engaging storytelling techniques.',
    length: '3-4 sentences',
    style: 'Personal, emotional, engaging',
  },
  question: {
    name: 'Question-Based',
    prompt:
      'Create captions that ask engaging questions to drive comments and interaction. Use open-ended questions, polls, and conversation starters.',
    length: '2-3 sentences',
    style: 'Interactive, conversational, engaging',
  },
}

export const CAPTION_ANGLES = {
  emotional: {
    name: 'Emotional',
    prompt:
      'Appeal to emotions, desires, and aspirations. Use evocative language, sensory words, and emotional triggers. Connect on a personal level.',
    focus: 'Feelings, dreams, personal connection',
  },
  'data-driven': {
    name: 'Data-Driven',
    prompt:
      'Lead with facts, statistics, or specific benefits. Use numbers, percentages, and concrete evidence. Build credibility through data.',
    focus: 'Numbers, facts, measurable results',
  },
  'question-based': {
    name: 'Question-Based',
    prompt:
      'Start with a compelling question that engages the audience. Create curiosity and encourage responses. Make it thought-provoking.',
    focus: 'Curiosity, engagement, conversation',
  },
  'cta-focused': {
    name: 'CTA-Focused',
    prompt:
      'Drive immediate action with clear, urgent calls-to-action. Use imperative verbs and action-oriented language. Create urgency.',
    focus: 'Action, urgency, conversion',
  },
  educational: {
    name: 'Educational',
    prompt:
      'Teach something valuable. Share tips, insights, or how-to information. Position as helpful expert. Provide actionable value.',
    focus: 'Knowledge, tips, value delivery',
  },
}

export const PLATFORM_PRESETS = {
  'ig-feed': {
    name: 'Instagram Feed',
    maxLength: 2200,
    idealLength: 125,
    tone: 'casual and visual-first',
    hashtagStrategy: 'Include 5-10 relevant hashtags',
    emojiUsage: 'Use emojis liberally to add personality',
    style: 'Short paragraphs, conversational, story-driven',
    guidelines: [
      'First line is critical (shown in preview)',
      'Use line breaks for readability',
      'Include call-to-action or question',
      'Hashtags at end or integrated naturally',
    ],
  },
  'ig-story': {
    name: 'Instagram Story',
    maxLength: 500,
    idealLength: 60,
    tone: 'urgent and direct',
    hashtagStrategy: '1-3 hashtags max',
    emojiUsage: 'Minimal emojis for emphasis',
    style: 'Very short, punchy, immediate',
    guidelines: [
      'Grab attention in 2-3 seconds',
      'Swipe-up or action-focused',
      'Time-sensitive language',
    ],
  },
  'fb-feed': {
    name: 'Facebook Feed',
    maxLength: 63206,
    idealLength: 200,
    tone: 'community-focused and conversational',
    hashtagStrategy: 'Use 1-3 hashtags sparingly',
    emojiUsage: 'Moderate emoji use',
    style: 'Longer-form storytelling, personal',
    guidelines: [
      'Tell a complete story',
      'Ask questions to drive comments',
      'Tag relevant people/pages',
      'Use natural language',
    ],
  },
  'fb-story': {
    name: 'Facebook Story',
    maxLength: 500,
    idealLength: 50,
    tone: 'casual and immediate',
    hashtagStrategy: 'No hashtags needed',
    emojiUsage: 'Minimal emojis',
    style: 'Very brief, action-oriented',
    guidelines: ['Quick consumption', 'Clear single message'],
  },
  'li-feed': {
    name: 'LinkedIn Feed',
    maxLength: 3000,
    idealLength: 150,
    tone: 'professional and value-driven',
    hashtagStrategy: '3-5 professional hashtags',
    emojiUsage: 'Minimal or no emojis',
    style: 'Professional, insights-focused, educational',
    guidelines: [
      'Lead with value proposition',
      'Industry insights or expertise',
      'Professional call-to-action',
      'Avoid overly casual language',
      'Data and credibility matter',
    ],
  },
}

export class CaptionGenerator {
  /**
   * Generate a caption for a single asset using AI
   */
  static async generateCaption(request: GenerationRequest): Promise<string> {
    const {
      assetId,
      workspaceId,
      brandVoicePrompt,
      assetDescription,
      template = 'descriptive',
    } = request

    // Get asset information outside try block for error handling
    const asset = AuthModel.getAssetById(assetId)
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`)
    }

    // Create cache key based on request parameters for deduplication
    const cacheKey = `caption_${assetId}_${template}_${request.angle || 'none'}_${request.platform || 'none'}`
    const cacheService = CacheService.getInstance()

    try {
      // Try to get from cache first
      const cachedCaption = await cacheService.get<string>(cacheKey)
      if (cachedCaption) {
        log.info({ assetId, cacheKey }, 'Caption served from cache')
        return cachedCaption
      }

      // Create a descriptive prompt based on asset type
      let assetTypeDescription = ''
      if (asset.mimeType.startsWith('image/')) {
        assetTypeDescription = `image named "${asset.originalName}"`
      } else if (asset.mimeType.startsWith('video/')) {
        assetTypeDescription = `video named "${asset.originalName}"`
      } else {
        assetTypeDescription = `media file named "${asset.originalName}"`
      }

      // Get template instructions
      const templateConfig = CAPTION_TEMPLATES[template]

      // Get angle instructions if specified
      const angleConfig = request.angle ? CAPTION_ANGLES[request.angle] : null
      const angleContext = angleConfig
        ? `

Caption Angle: ${angleConfig.name}
${angleConfig.prompt}
Focus: ${angleConfig.focus}`
        : ''

      // Build enhanced AI prompt with campaign context
      const campaignContext = request.campaignObjective
        ? `

Campaign Context:
- Primary Objective: ${request.campaignObjective} (optimize caption for this goal)
- Funnel Stage: ${request.funnelStage || 'awareness'} (adjust messaging depth accordingly)
- Target Audience: ${request.targetAudience || 'general audience'}
- Brand Personality: ${request.brandPersonality || 'professional'}
- Value Proposition: ${request.valueProposition || 'quality and innovation'}`
        : ''

      const constraintsContext =
        request.mustIncludePhrases || request.mustExcludePhrases
          ? `

Required Constraints:
${request.mustIncludePhrases && request.mustIncludePhrases.length > 0 ? `- MUST include these phrases: ${request.mustIncludePhrases.join(', ')}` : ''}
${request.mustExcludePhrases && request.mustExcludePhrases.length > 0 ? `- MUST NOT include these phrases: ${request.mustExcludePhrases.join(', ')}` : ''}`
          : ''

      // Get platform preset if specified
      const platformPreset = request.platform
        ? PLATFORM_PRESETS[request.platform as keyof typeof PLATFORM_PRESETS]
        : null
      const platformContext = platformPreset
        ? `

Platform: ${platformPreset.name}
- Tone: ${platformPreset.tone}
- Ideal Length: ~${platformPreset.idealLength} characters (max ${platformPreset.maxLength})
- Hashtag Strategy: ${platformPreset.hashtagStrategy}
- Emoji Usage: ${platformPreset.emojiUsage}
- Style: ${platformPreset.style}
- Guidelines: ${platformPreset.guidelines.join('; ')}`
        : request.platform
          ? `

Platform: ${request.platform}
${request.platform === 'ig-feed' || request.platform === 'ig-story' ? '- Use casual, visual-first language with emojis' : ''}
${request.platform === 'fb-feed' || request.platform === 'fb-story' ? '- Use community-focused, conversational tone' : ''}
${request.platform === 'li-feed' ? '- Use professional, value-driven language, minimal emojis' : ''}`
          : ''

      // Add reference style context if available
      const referenceStyleContext = request.learnedStyleProfile
        ? `

Reference Style (MATCH THIS CLOSELY):
${StyleAnalyzer.styleProfileToPrompt(request.learnedStyleProfile)}

Style Examples:
${
  request.referenceCaptions
    ? request.referenceCaptions
        .slice(0, 3)
        .map((ref, idx) => `Example ${idx + 1}: "${ref}"`)
        .join('\n')
    : ''
}

Important: Maintain the same tone, vocabulary, structure, and style patterns as the examples above.`
        : ''

      const systemPrompt = `You are a professional social media caption writer. Your task is to create engaging, on-brand captions for visual content.

Brand Voice Instructions:
${brandVoicePrompt}${campaignContext}${constraintsContext}${platformContext}${referenceStyleContext}${angleContext}

Template Style: ${templateConfig.name}
${templateConfig.prompt}
Target Length: ${templateConfig.length}
Style Guide: ${templateConfig.style}

Guidelines:
- Follow the template style exactly
- Match the brand voice consistently${referenceStyleContext ? '\n- CRITICAL: Match the reference style patterns closely' : ''}
- Align with campaign objective and funnel stage${angleConfig ? `\n- Use the ${angleConfig.name} angle to differentiate this variation` : ''}
- Focus on the visual content's story or message
- Write compelling content that drives engagement
- Respect all required constraints (must include/exclude phrases)`

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
        throw new Error(
          'Failed to generate caption: No content returned from AI'
        )
      }

      // Cache the generated caption for future requests
      await cacheService.set(cacheKey, caption, 24 * 60 * 60 * 1000) // Cache for 24 hours

      return caption
    } catch (error) {
      log.error({ err: error, assetId }, `Error generating caption for asset`)

      if (error instanceof Error) {
        // Return a fallback caption if AI generation fails
        return `Check out this ${asset?.originalName || 'content'}! 🎨 #creative #inspiration`
      }

      throw error
    }
  }

  /**
   * Generate structured ad copy (headline, body, CTA)
   */
  static async generateAdCopy(
    request: GenerationRequest,
    angle?: CaptionAngle
  ): Promise<{ headline: string; bodyText: string; ctaText: string }> {
    const { assetId, workspaceId, brandVoicePrompt } = request

    const asset = AuthModel.getAssetById(assetId)
    if (!asset) {
      throw new Error(`Asset ${assetId} not found`)
    }

    // Create cache key for ad copy generation
    const cacheKey = `adcopy_${assetId}_${angle || 'none'}_${request.platform || 'none'}`
    const cacheService = CacheService.getInstance()

    try {
      // Try to get from cache first
      const cachedAdCopy = await cacheService.get<{ headline: string; bodyText: string; ctaText: string }>(cacheKey)
      if (cachedAdCopy) {
        log.info({ assetId, cacheKey }, 'Ad copy served from cache')
        return cachedAdCopy
      }
      // Create asset type description
      let assetTypeDescription = ''
      if (asset.mimeType.startsWith('image/')) {
        assetTypeDescription = `image named "${asset.originalName}"`
      } else if (asset.mimeType.startsWith('video/')) {
        assetTypeDescription = `video named "${asset.originalName}"`
      } else {
        assetTypeDescription = `media file named "${asset.originalName}"`
      }

      // Get angle instructions if specified
      const angleConfig = angle ? CAPTION_ANGLES[angle] : null
      const angleContext = angleConfig
        ? `\n\nCaption Angle: ${angleConfig.name}\n${angleConfig.prompt}\nFocus: ${angleConfig.focus}`
        : ''

      // Build campaign context
      const campaignContext = request.campaignObjective
        ? `\n\nCampaign Context:\n- Primary Objective: ${request.campaignObjective}\n- Funnel Stage: ${request.funnelStage || 'awareness'}\n- Target Audience: ${request.targetAudience || 'general audience'}\n- Brand Personality: ${request.brandPersonality || 'professional'}\n- Value Proposition: ${request.valueProposition || 'quality and innovation'}`
        : ''

      const constraintsContext =
        request.mustIncludePhrases || request.mustExcludePhrases
          ? `\n\nRequired Constraints:\n${request.mustIncludePhrases && request.mustIncludePhrases.length > 0 ? `- MUST include: ${request.mustIncludePhrases.join(', ')}` : ''}\n${request.mustExcludePhrases && request.mustExcludePhrases.length > 0 ? `- MUST NOT include: ${request.mustExcludePhrases.join(', ')}` : ''}`
          : ''

      // Get platform preset
      const platformPreset = request.platform
        ? PLATFORM_PRESETS[request.platform as keyof typeof PLATFORM_PRESETS]
        : null
      const platformContext = platformPreset
        ? `\n\nPlatform: ${platformPreset.name}\n- Tone: ${platformPreset.tone}\n- Style: ${platformPreset.style}\n- Emoji Usage: ${platformPreset.emojiUsage}`
        : request.platform
          ? `\n\nPlatform: ${request.platform}\n${request.platform === 'ig-feed' || request.platform === 'ig-story' ? '- Casual, visual-first with emojis' : ''}\n${request.platform === 'fb-feed' || request.platform === 'fb-story' ? '- Community-focused, conversational' : ''}\n${request.platform === 'li-feed' ? '- Professional, value-driven, minimal emojis' : ''}`
          : ''

      const systemPrompt = `You are a professional ad copywriter specializing in social media advertising.

Brand Voice Instructions:
${brandVoicePrompt}${campaignContext}${constraintsContext}${platformContext}${angleContext}

Your task is to create structured ad copy with three distinct components:

1. HEADLINE (5-10 words):
   - Attention-grabbing and benefit-focused
   - Clear value proposition
   - Strong emotional hook or compelling question

2. BODY TEXT (50-125 characters):
   - Expand on the headline
   - Include key benefit or feature
   - Create desire or urgency
   - Must be concise and punchy

3. CALL-TO-ACTION (2-4 words):
   - Action-oriented and clear
   - Aligned with campaign objective
   - Creates urgency when appropriate

Guidelines:
- Match brand voice consistently across all components
- Align with campaign objective${angleConfig ? ` and ${angleConfig.name} angle` : ''}
- Respect all required constraints
- Keep each component within character limits
- Make it suitable for paid social media ads

Return ONLY in this exact format:
HEADLINE: [your headline here]
BODY: [your body text here]
CTA: [your call-to-action here]`

      const userPrompt = `Create structured ad copy for this ${assetTypeDescription}.`

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

      const content = completion.choices[0]?.message?.content?.trim()
      if (!content) {
        throw new Error('No content returned from AI')
      }

      // Parse structured response
      const headlineMatch = content.match(/HEADLINE:\s*(.+?)(?:\n|$)/i)
      const bodyMatch = content.match(/BODY:\s*(.+?)(?:\n|$)/i)
      const ctaMatch = content.match(/CTA:\s*(.+?)(?:\n|$)/i)

      const headline =
        headlineMatch?.[1]?.trim() || 'Discover Something Amazing'
      const bodyText =
        bodyMatch?.[1]?.trim() ||
        'Transform your experience with quality you can trust.'
      const ctaText = ctaMatch?.[1]?.trim() || 'Learn More'

      const result = {
        headline: headline.slice(0, 60),
        bodyText: bodyText.slice(0, 125),
        ctaText: ctaText.slice(0, 20),
      }

      // Cache the generated ad copy for future requests
      await cacheService.set(cacheKey, result, 24 * 60 * 60 * 1000) // Cache for 24 hours

      return result
    } catch (error) {
      log.error({ err: error, assetId }, `Error generating ad copy for asset`)
      // Return fallback ad copy
      return {
        headline: 'Discover Something Amazing',
        bodyText: 'Experience quality and innovation designed for you.',
        ctaText: 'Learn More',
      }
    }
  }

  /**
   * Generate multiple caption variations for a single asset
   */
  static async generateVariations(
    request: GenerationRequest,
    count: number,
    captionId?: string
  ): Promise<string[]> {
    const angles: CaptionAngle[] = [
      'emotional',
      'data-driven',
      'question-based',
      'cta-focused',
      'educational',
    ]
    const variations: string[] = []

    // Generate variations using different angles
    for (let i = 0; i < count; i++) {
      const angle = angles[i % angles.length]
      try {
        const caption = await this.generateCaption({
          ...request,
          angle,
        })
        variations.push(caption)

        // If a captionId is provided, add this variation to the caption
        if (captionId) {
          // First, get the caption to access campaign context for scoring
          const captionRecord = AuthModel.getCaptionById(captionId)
          const assetId = captionRecord?.assetId

          let scores:
            | {
                clarity: number
                originality: number
                brandConsistency: number
                platformRelevance: number
                totalScore: number
              }
            | undefined

          if (assetId) {
            const asset = AuthModel.getAssetById(assetId)
            const brandKit = asset
              ? AuthModel.getBrandKitByWorkspace(asset.workspaceId)
              : null

            if (brandKit) {
              scores = CaptionScorer.scoreCaptionVariation(
                caption,
                brandKit.voicePrompt,
                {
                  objective: request.campaignObjective,
                  targetAudience:
                    request.targetAudience || brandKit.targetAudience,
                  brandPersonality: brandKit.brandPersonality,
                }
              )
            }
          }

          // Generate ad copy if requested (for ad copy mode)
          let adCopy = undefined
          const generateAdCopy = request.platform?.includes('ad') || false // Check if ad copy mode is requested

          if (generateAdCopy) {
            const adCopyResult = await this.generateAdCopy(
              { ...request, assetId: captionRecord?.assetId || '' },
              request.angle
            )
            adCopy = adCopyResult
          }

          await AuthModel.addCaptionVariation(captionId, {
            text: caption,
            status: 'completed',
            approvalStatus: 'pending',
            qualityScore: scores?.totalScore,
            scoreBreakdown: scores
              ? {
                  clarity: scores.clarity,
                  originality: scores.originality,
                  brandConsistency: scores.brandConsistency,
                  platformRelevance: scores.platformRelevance,
                }
              : undefined,
            adCopy: adCopy,
            generatedAt: new Date(),
          })
        }

        // Small delay between API calls to avoid rate limits
        if (i < count - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500))
        }
      } catch (error) {
        log.error(
          { err: error, variationIndex: i + 1 },
          `Failed to generate variation`
        )
        // Continue with other variations even if one fails
      }
    }

    return variations
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
      const agency = workspace
        ? AuthModel.getAgencyById(workspace.agencyId)
        : null

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

          // Get campaign context if available
          const campaign = job.campaignId
            ? AuthModel.getCampaignById(job.campaignId)
            : null

          // Generate caption variations using AI with full context
          const generationRequest: GenerationRequest = {
            assetId,
            workspaceId: job.workspaceId,
            brandVoicePrompt: brandKit.voicePrompt,
            template: job.template || 'descriptive',
            // Campaign context for quality
            campaignObjective: campaign?.objective,
            funnelStage: campaign?.funnelStage,
            targetAudience: campaign?.targetAudience || brandKit.targetAudience,
            brandPersonality: brandKit.brandPersonality,
            valueProposition: brandKit.valueProposition,
            mustIncludePhrases: campaign?.mustIncludePhrases,
            mustExcludePhrases: campaign?.mustExcludePhrases,
            platform: campaign?.placements?.[0],
          }

          // Generate primary caption first
          const captionText = await this.generateCaption(generationRequest)

          // Add the primary generated caption as a variation
          AuthModel.addCaptionVariation(caption.id, {
            text: captionText,
            status: 'completed',
            approvalStatus: 'pending',
            generatedAt: new Date(),
          })

          // Generate additional variations (3 total by default)
          const variationsCount = 3 // Default to 3 variations including the primary

          // Check if ad copy mode is enabled
          const isAdCopyMode = (job as any).generateAdCopy === true

          // Create a modified request for ad copy generation if needed
          const adCopyGenerationRequest = isAdCopyMode
            ? {
                ...generationRequest,
                platform: generationRequest.platform
                  ? `${generationRequest.platform}_ad`
                  : 'ig-feed_ad', // Mark as ad copy mode
              }
            : generationRequest

          await this.generateVariations(
            adCopyGenerationRequest,
            variationsCount - 1,
            caption.id
          )

          // Generate rendered images if we have an agency for watermark logic
          if (agency) {
            const assetPath = path.join(process.cwd(), asset.url)

            // Render multiple formats for V1
            const renderedFormats = await ImageRenderer.renderMultipleFormats(
              assetPath,
              captionText,
              brandKit,
              agency,
              job.workspaceId
            )

            // Create generated asset records for each rendered format
            for (const rendered of renderedFormats) {
              AuthModel.createGeneratedAsset({
                jobId: jobId,
                sourceAssetId: assetId,
                workspaceId: job.workspaceId,
                captionId: caption.id,
                approvalStatus: 'pending',
                format: rendered.format as
                  | 'instagram-square'
                  | 'instagram-story',
                layout: rendered.layout as
                  | 'center-focus'
                  | 'bottom-text'
                  | 'top-text',
                caption: captionText,
                imageUrl: rendered.imageUrl,
                thumbnailUrl: rendered.thumbnailUrl,
                watermark: agency.planType === 'free',
              })
            }
          }

          processedCount++
        } catch (error) {
          log.error({ err: error, assetId }, `Error processing asset`)

          // Update caption status to failed
          const caption = AuthModel.getCaptionsByAsset(assetId)[0]
          if (caption) {
            AuthModel.updateCaption(caption.id, {
              status: 'failed',
              errorMessage:
                error instanceof Error ? error.message : 'Unknown error',
            })
          }
        }

        // Update job progress
        AuthModel.updateBatchJob(jobId, {
          processedCount,
        })

        // Longer delay between requests when rendering images
        await new Promise((resolve) => setTimeout(resolve, 2000))
      }

      // Mark job as completed
      AuthModel.updateBatchJob(jobId, {
        status: 'completed',
        completedAt: new Date(),
      })
    } catch (error) {
      log.error({ err: error, jobId }, `Error processing batch job`)

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
      throw new Error(
        'No brand kit found for this workspace. Please create a brand kit first.'
      )
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
    this.processBatchJob(job.id).catch((error) => {
      log.error(
        { err: error, jobId: job.id },
        `Background processing failed for job`
      )
    })

    return {
      jobId: job.id,
      message: `Started batch generation for ${assetIds.length} assets`,
    }
  }
}
