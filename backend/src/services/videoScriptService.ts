import OpenAI from 'openai'
import { VideoScript, VideoStoryboard, BrandKit, Campaign } from '../models/auth'
import { CampaignAwareService, AssetContext } from './campaignAwareService'
import { log } from '../middleware/logger'

export interface VideoScriptGenerationRequest {
  campaignId?: string
  brandKitId?: string
  assetDescription: string
  product: {
    name: string
    category: string
    features?: string[]
    benefits?: string[]
    useCases?: string[]
  }
  videoLength: number // in seconds
  platforms: ('instagram' | 'facebook' | 'linkedin' | 'tiktok')[]
  tone: string[]
  objective: 'awareness' | 'consideration' | 'conversion' | 'retention'
  targetAudience?: {
    demographics?: string
    psychographics?: string
    painPoints?: string[]
  }
  includeStoryboard: boolean
  visualStyle?: string // for image generation
  customInstructions?: string
}

export interface VideoScriptGenerationResult {
  videoScript: VideoScript
  videoStoryboard?: VideoStoryboard
  qualityScore: number
  recommendations: string[]
  estimatedPerformance: {
    engagementRate: number
    completionRate: number
    shareability: number
  }
}

export class VideoScriptService {
  private openai: OpenAI
  private campaignAwareService: CampaignAwareService

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
    this.campaignAwareService = new CampaignAwareService()
  }

  /**
   * Generate video script with optional storyboard
   */
  async generateVideoScript(
    request: VideoScriptGenerationRequest,
    campaign?: Campaign,
    brandKit?: BrandKit
  ): Promise<VideoScriptGenerationResult> {
    try {
      log.info(
        {
          videoLength: request.videoLength,
          platforms: request.platforms,
          includeStoryboard: request.includeStoryboard,
          productName: request.product.name,
        },
        `Generating video script for ${request.product.name}`
      )

      // Generate video script using AI
      const videoScript = await this.generateScript(request, campaign, brandKit)

      // Generate storyboard if requested
      let videoStoryboard: VideoStoryboard | undefined
      if (request.includeStoryboard) {
        videoStoryboard = await this.generateStoryboard(videoScript, request, campaign, brandKit)
      }

      // Calculate quality score
      const qualityScore = this.calculateQualityScore(videoScript, request)

      // Generate recommendations
      const recommendations = this.generateRecommendations(videoScript, request)

      // Estimate performance
      const estimatedPerformance = this.estimatePerformance(videoScript, request)

      log.info(
        {
          videoLength: videoScript.totalDuration,
          sceneCount: videoScript.scenes.length,
          qualityScore,
          hasStoryboard: !!videoStoryboard,
        },
        `Video script generated successfully`
      )

      return {
        videoScript,
        videoStoryboard,
        qualityScore,
        recommendations,
        estimatedPerformance,
      }
    } catch (error) {
      log.error({ err: error }, 'Video script generation error')
      throw new Error(`Failed to generate video script: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Generate the video script content
   */
  private async generateScript(
    request: VideoScriptGenerationRequest,
    campaign?: Campaign,
    brandKit?: BrandKit
  ): Promise<VideoScript> {
    const prompt = this.buildVideoScriptPrompt(request, campaign, brandKit)

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert video script writer specializing in short-form social media content. Create compelling, engaging video scripts that drive action.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    })

    const response = completion.choices[0]?.message?.content
    if (!response) {
      throw new Error('Failed to generate video script content')
    }

    return this.parseVideoScriptResponse(response, request)
  }

  /**
   * Build comprehensive prompt for video script generation
   */
  private buildVideoScriptPrompt(
    request: VideoScriptGenerationRequest,
    campaign?: Campaign,
    brandKit?: BrandKit
  ): string {
    // Use campaign-aware prompting if we have context
    if (campaign && brandKit) {
      const campaignContext = this.campaignAwareService.buildCampaignContext(campaign, brandKit)

      const assetContext: AssetContext = {
        description: request.assetDescription,
        category: 'video-script',
        features: request.product.features,
        benefits: request.product.benefits,
        useCases: request.product.useCases,
      }

      const basePrompt = this.campaignAwareService.generateCampaignAwarePrompt(
        campaignContext,
        assetContext,
        'main', // variation type not as relevant for video
        request.platforms,
        'video-script'
      )

      // Add video-specific requirements to the campaign-aware prompt
      return `${basePrompt}

VIDEO-SPECIFIC REQUIREMENTS:
Video Length: ${request.videoLength} seconds
Product: ${request.product.name} (${request.product.category})
Scene Structure: 5 scenes (Hook → Problem → Benefit → Demo → CTA)
Platform: ${request.platforms.join(', ')}
${request.customInstructions ? `Custom Instructions: ${request.customInstructions}` : ''}

SCENE BREAKDOWN:
- Scene 1 (Hook): 2-4 seconds - Grab attention immediately
- Scene 2 (Problem): 3-5 seconds - Identify audience pain point
- Scene 3 (Benefit): 3-5 seconds - Show the solution/benefit
- Scene 4 (Demo): 4-7 seconds - Quick demonstration or proof
- Scene 5 (CTA): 2-3 seconds - Clear call to action

VIDEO SCRIPT OUTPUT FORMAT:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "type": "hook",
      "duration": 3,
      "script": "Compelling opening that grabs attention",
      "visualNotes": "Visual description of what happens on screen"
    },
    {
      "sceneNumber": 2,
      "type": "problem",
      "duration": 4,
      "script": "Problem statement that resonates with audience",
      "visualNotes": "Visual showing the problem"
    },
    {
      "sceneNumber": 3,
      "type": "benefit",
      "duration": 4,
      "script": "Benefit statement showing the solution",
      "visualNotes": "Visual showing the positive outcome"
    },
    {
      "sceneNumber": 4,
      "type": "demo",
      "duration": 5,
      "script": "Quick demonstration or proof",
      "visualNotes": "Visual of product in action"
    },
    {
      "sceneNumber": 5,
      "type": "cta",
      "duration": 2,
      "script": "Clear call to action",
      "visualNotes": "Visual reinforcing the CTA"
    }
  ],
  "totalDuration": 18,
  "cta": "Strong call to action text",
  "platform": "${request.platforms[0]}"
}

VIDEO SCRIPT GUIDELINES:
- Total script must be exactly ${request.videoLength} seconds
- Each scene should flow naturally into the next
- Use conversational, engaging language
- Include visual directions for each scene
- End with a strong, clear call to action
- Adapt tone for ${request.platforms.join(' and ')} audience
- Focus on ${request.objective} objective
- Use these tones: ${request.tone.join(', ')}

Generate a compelling ${request.videoLength}-second video script for ${request.product.name}.
      `.trim()
    }

    // Fallback to basic prompting without campaign context
    return `
Generate a ${request.videoLength}-second video script for ${request.product.name}.

PRODUCT DETAILS:
Name: ${request.product.name}
Category: ${request.product.category}
Features: ${request.product.features?.join(', ') || 'Not specified'}
Benefits: ${request.product.benefits?.join(', ') || 'Not specified'}
Use Cases: ${request.product.useCases?.join(', ') || 'Not specified'}

ASSET DESCRIPTION:
${request.assetDescription}

VIDEO REQUIREMENTS:
Length: ${request.videoLength} seconds
Platforms: ${request.platforms.join(', ')}
Objective: ${request.objective}
Tone: ${request.tone.join(', ')}
${request.customInstructions ? `Custom Instructions: ${request.customInstructions}` : ''}

TARGET AUDIENCE:
${request.targetAudience ? `
- Demographics: ${request.targetAudience.demographics}
- Psychographics: ${request.targetAudience.psychographics}
- Pain Points: ${request.targetAudience.painPoints?.join(', ')}
` : 'General audience'}

CAMPAIGN CONTEXT:
${campaign ? `
- Campaign Name: ${campaign.name}
- Key Message: ${campaign.brief?.keyMessage || 'Not specified'}
- Primary Audience: ${campaign.brief?.primaryAudience?.demographics || 'Not specified'}
` : 'No specific campaign context provided'}

BRAND CONTEXT:
${brandKit ? `
- Brand Personality: ${brandKit.brandPersonality || 'Professional'}
- Value Proposition: ${brandKit.valueProposition || 'Quality products'}
- Brand Colors: ${brandKit.colors?.primary || 'Not specified'}, ${brandKit.colors?.secondary || 'Not specified'}
` : 'No specific brand context provided'}

5-SCENE STRUCTURE:
1. Hook (2-4s): Grab attention immediately
2. Problem (3-5s): Identify audience pain point
3. Benefit (3-5s): Show the solution/benefit
4. Demo (4-7s): Quick demonstration or proof
5. CTA (2-3s): Clear call to action

OUTPUT FORMAT:
{
  "scenes": [
    {
      "sceneNumber": 1,
      "type": "hook",
      "duration": 3,
      "script": "Opening hook",
      "visualNotes": "Visual description"
    },
    {
      "sceneNumber": 2,
      "type": "problem",
      "duration": 4,
      "script": "Problem statement",
      "visualNotes": "Visual showing problem"
    },
    {
      "sceneNumber": 3,
      "type": "benefit",
      "duration": 4,
      "script": "Benefit statement",
      "visualNotes": "Visual showing benefit"
    },
    {
      "sceneNumber": 4,
      "type": "demo",
      "duration": 5,
      "script": "Demonstration",
      "visualNotes": "Visual of product in action"
    },
    {
      "sceneNumber": 5,
      "type": "cta",
      "duration": 2,
      "script": "Call to action",
      "visualNotes": "Visual reinforcing CTA"
    }
  ],
  "totalDuration": 18,
  "cta": "Strong call to action",
  "platform": "primary platform"
}

Generate an engaging, conversion-focused video script.
    `.trim()
  }

  /**
   * Parse AI response into VideoScript
   */
  private parseVideoScriptResponse(response: string, request: VideoScriptGenerationRequest): VideoScript {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const scriptData = JSON.parse(jsonMatch[0])

      // Validate scene structure
      if (!scriptData.scenes || !Array.isArray(scriptData.scenes)) {
        throw new Error('Invalid scene structure in response')
      }

      // Ensure we have all 5 required scene types
      const requiredSceneTypes = ['hook', 'problem', 'benefit', 'demo', 'cta']
      const sceneTypes = scriptData.scenes.map((scene: any) => scene.type)

      // Add missing scenes if needed
      requiredSceneTypes.forEach((type, index) => {
        if (!sceneTypes.includes(type)) {
          scriptData.scenes.splice(index, 0, {
            sceneNumber: index + 1,
            type,
            duration: 3,
            script: `Default ${type} content for ${request.product.name}`,
            visualNotes: `Visual showing ${type}`,
          })
        }
      })

      // Recalculate durations to match requested total
      const actualDuration = scriptData.scenes.reduce((sum: number, scene: any) => sum + scene.duration, 0)
      const durationRatio = request.videoLength / actualDuration

      scriptData.scenes.forEach((scene: any) => {
        scene.duration = Math.round(scene.duration * durationRatio)
      })

      scriptData.totalDuration = scriptData.scenes.reduce((sum: number, scene: any) => sum + scene.duration, 0)
      scriptData.platform = request.platforms[0]

      return scriptData as VideoScript
    } catch (error) {
      log.error({ err: error }, 'Error parsing video script response')

      // Fallback structure
      const baseScene = {
        script: `Default content for ${request.product.name}`,
        visualNotes: 'Default visual description',
      }

      return {
        scenes: [
          { sceneNumber: 1, type: 'hook' as const, duration: 3, description: 'Hook scene', ...baseScene },
          { sceneNumber: 2, type: 'problem' as const, duration: 4, description: 'Problem scene', ...baseScene },
          { sceneNumber: 3, type: 'benefit' as const, duration: 4, description: 'Benefit scene', ...baseScene },
          { sceneNumber: 4, type: 'demo' as const, duration: 5, description: 'Demo scene', ...baseScene },
          { sceneNumber: 5, type: 'cta' as const, duration: 2, description: 'Call to action scene', ...baseScene },
        ],
        totalDuration: 18,
        cta: 'Learn more about our product',
        platform: request.platforms[0],
      }
    }
  }

  /**
   * Generate storyboard for video script
   */
  private async generateStoryboard(
    videoScript: VideoScript,
    request: VideoScriptGenerationRequest,
    campaign?: Campaign,
    brandKit?: BrandKit
  ): Promise<VideoStoryboard> {
    try {
      log.info(
        { sceneCount: videoScript.scenes.length },
        `Generating storyboard frames for video script`
      )

      // For Phase 1.4, we'll use placeholder URLs since actual image generation
      // would require integration with the existing image generator service
      const storyboardFrames = videoScript.scenes.map(scene => ({
        sceneNumber: scene.sceneNumber,
        type: scene.type,
        duration: scene.duration,
        script: scene.script,
        imageUrl: `https://via.placeholder.com/1080x1920/000000/FFFFFF?text=${encodeURIComponent(`Scene ${scene.sceneNumber}: ${scene.type.toUpperCase()}`)}`,
        thumbnailUrl: `https://via.placeholder.com/320x568/000000/FFFFFF?text=${encodeURIComponent(`${scene.sceneNumber}`)}`,
      }))

      return {
        videoScriptId: `storyboard-${Date.now()}`,
        scenes: storyboardFrames,
        totalDuration: videoScript.totalDuration,
      }
    } catch (error) {
      log.error({ err: error }, 'Error generating storyboard')
      throw new Error('Failed to generate storyboard')
    }
  }

  /**
   * Calculate quality score for video script
   */
  private calculateQualityScore(videoScript: VideoScript, request: VideoScriptGenerationRequest): number {
    let score = 0
    const maxScore = 100

    // Check scene completeness (25 points)
    const requiredSceneTypes = ['hook', 'problem', 'benefit', 'demo', 'cta']
    const hasAllScenes = requiredSceneTypes.every(type =>
      videoScript.scenes.some(scene => scene.type === type)
    )
    if (hasAllScenes) score += 25

    // Check duration accuracy (20 points)
    const durationDiff = Math.abs(videoScript.totalDuration - request.videoLength)
    if (durationDiff <= 2) score += 20
    else if (durationDiff <= 5) score += 10

    // Check scene flow (20 points)
    const scenesOrdered = videoScript.scenes.every((scene, index) =>
      scene.sceneNumber === index + 1
    )
    if (scenesOrdered) score += 20

    // Check content quality (20 points)
    const avgScriptLength = videoScript.scenes.reduce((sum, scene) =>
      sum + scene.script.length, 0) / videoScript.scenes.length
    if (avgScriptLength >= 20 && avgScriptLength <= 200) score += 10
    if (avgScriptLength > 50) score += 10

    // Check CTA strength (15 points)
    const ctaScene = videoScript.scenes.find(scene => scene.type === 'cta')
    if (ctaScene) {
      if (ctaScene.script.toLowerCase().includes('shop')) score += 5
      if (ctaScene.script.toLowerCase().includes('now')) score += 5
      if (ctaScene.script.toLowerCase().includes('get')) score += 5
    }

    return Math.min(score, maxScore)
  }

  /**
   * Generate recommendations for video script
   */
  private generateRecommendations(videoScript: VideoScript, request: VideoScriptGenerationRequest): string[] {
    const recommendations: string[] = []

    // Check duration
    if (Math.abs(videoScript.totalDuration - request.videoLength) > 2) {
      recommendations.push(`Adjust scene durations to match target length of ${request.videoLength} seconds`)
    }

    // Check scene flow
    const scenesOrdered = videoScript.scenes.every((scene, index) =>
      scene.sceneNumber === index + 1
    )
    if (!scenesOrdered) {
      recommendations.push('Ensure scenes are properly numbered and ordered')
    }

    // Check content length
    videoScript.scenes.forEach(scene => {
      if (scene.script.length < 10) {
        recommendations.push(`Add more detail to Scene ${scene.sceneNumber} (${scene.type})`)
      }
      if (scene.script.length > 150) {
        recommendations.push(`Shorten Scene ${scene.sceneNumber} (${scene.type}) for better engagement`)
      }
    })

    // Check visual notes
    videoScript.scenes.forEach(scene => {
      if (!scene.visualNotes || scene.visualNotes.length < 5) {
        recommendations.push(`Add more detailed visual notes for Scene ${scene.sceneNumber}`)
      }
    })

    // Check CTA
    const ctaScene = videoScript.scenes.find(scene => scene.type === 'cta')
    if (!ctaScene) {
      recommendations.push('Ensure a strong call-to-action scene is included')
    } else if (!ctaScene.script.match(/\b(shop|buy|get|now|start|try|learn)\b/i)) {
      recommendations.push('Strengthen the call-to-action with more action-oriented language')
    }

    return recommendations
  }

  /**
   * Estimate video performance metrics
   */
  private estimatePerformance(videoScript: VideoScript, request: VideoScriptGenerationRequest): {
    engagementRate: number
    completionRate: number
    shareability: number
  } {
    // Base metrics by objective
    const baseMetrics = {
      awareness: { engagementRate: 0.045, completionRate: 0.65, shareability: 0.025 },
      consideration: { engagementRate: 0.055, completionRate: 0.70, shareability: 0.030 },
      conversion: { engagementRate: 0.040, completionRate: 0.75, shareability: 0.015 },
      retention: { engagementRate: 0.060, completionRate: 0.60, shareability: 0.020 },
    }

    const base = baseMetrics[request.objective]

    // Platform adjustments
    const platformMultipliers = {
      instagram: 1.1,
      facebook: 1.0,
      linkedin: 0.8,
      tiktok: 1.3,
    }

    let platformMultiplier = 1.0
    request.platforms.forEach(platform => {
      platformMultiplier = Math.max(
        platformMultiplier,
        platformMultipliers[platform as keyof typeof platformMultipliers] || 1.0
      )
    })

    // Duration adjustments (shorter videos generally perform better)
    let durationMultiplier = 1.0
    if (videoScript.totalDuration <= 15) durationMultiplier = 1.2
    else if (videoScript.totalDuration <= 30) durationMultiplier = 1.0
    else if (videoScript.totalDuration <= 60) durationMultiplier = 0.9
    else durationMultiplier = 0.7

    return {
      engagementRate: base.engagementRate * platformMultiplier * durationMultiplier,
      completionRate: base.completionRate * platformMultiplier * durationMultiplier,
      shareability: base.shareability * platformMultiplier * durationMultiplier,
    }
  }
}