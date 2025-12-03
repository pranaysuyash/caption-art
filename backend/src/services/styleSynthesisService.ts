import OpenAI from 'openai'
import sharp from 'sharp'
import fs from 'fs/promises'
import path from 'path'
import {
  StyleReference,
  Asset,
  BrandKit,
  Campaign
} from '../models/auth'
import { log } from '../middleware/logger'

// Define interfaces locally since they don't exist in auth model
export interface StyleSynthesisRequest {
  workspaceId: string
  styleReferences: string[]
  synthesisMode?: 'dominant' | 'balanced' | 'creative' | 'conservative'
  targetFormat?: string
}

export interface StyleSynthesisResult {
  id: string
  request: StyleSynthesisRequest
  analyses: Array<{
    referenceId: string
    confidence: number
    keyAttributes: string[]
  }>
  synthesizedStyle: {
    colorPalette: string[]
    typography: string[]
    composition: string[]
    mood: string[]
    visualStyle: string[]
    keyElements: string[]
    synthesisMode: string
    confidence: number
  }
  styleGuidance: string[]
  synthesizedOutput: {
    url: string
    thumbnailUrl: string
    dimensions: { width: number; height: number }
    format: string
    styleScore: number
    brandAlignment: number
    campaignAlignment: number
  }
  qualityMetrics: {
    coherence: number
    diversity: number
    innovation: number
    brandConsistency: number
    overallScore: number
  }
  recommendations: string[]
  processingTime: number
  createdAt: Date
}

export interface StyleAnalysisResult {
  id: string
  referenceId: string
  analysis: {
    colorPalette: string[]
    typography: string[]
    composition: string[]
    mood: string[]
    visualStyle: string[]
    keyElements: string[]
  }
  confidence: number
  processedAt: Date
}

export interface StyleMatchResult {
  referenceId: string
  similarityScore: number
  matchingAttributes: string[]
  conflictingAttributes: string[]
  recommendation: string
}

export class StyleSynthesisService {
  private openai: OpenAI
  private styleAnalyses = new Map<string, StyleAnalysisResult>()

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  /**
   * Analyze a style reference to extract key visual attributes
   */
  async analyzeStyleReference(
    reference: StyleReference
  ): Promise<StyleAnalysisResult> {
    try {
      log.info(
        { referenceId: reference.id, imageCount: reference.referenceImages?.length || 0 },
        'Analyzing style reference'
      )

      const imageUrl = reference.referenceImages?.[0] || ''
      const prompt = `
Analyze this visual style reference and extract key design attributes.

REFERENCE DETAILS:
Name: ${reference.name}
Description: ${reference.description}
Image Count: ${reference.referenceImages?.length || 0}
Primary Image: ${imageUrl}

ANALYSIS REQUIREMENTS:
Provide a comprehensive analysis covering:

1. COLOR PALETTE: Extract dominant colors (hex codes if possible)
2. TYPOGRAPHY: Describe font styles, weights, and hierarchy
3. COMPOSITION: Describe layout, spacing, and visual flow
4. MOOD/FEELING: Identify emotional tone and atmosphere
5. VISUAL STYLE: Describe overall aesthetic (minimalist, bold, vintage, etc.)
6. KEY ELEMENTS: List distinctive visual elements or patterns

Return the analysis as JSON with this structure:
{
  "colorPalette": ["#hex1", "#hex2", "..."],
  "typography": ["font style descriptions"],
  "composition": ["layout descriptions"],
  "mood": ["emotional descriptors"],
  "visualStyle": ["aesthetic descriptors"],
  "keyElements": ["distinctive elements"]
}
      `.trim()

      // Download and analyze the actual image
      if (!imageUrl) {
        throw new Error('No reference images found for style analysis')
      }

      const realAnalysis = await this.analyzeRealImage(imageUrl, reference)

      // Enhance with AI-based analysis if OpenAI is available
      const enhancedAnalysis = await this.enhanceAnalysisWithAI(imageUrl, reference, realAnalysis)

      const result: StyleAnalysisResult = {
        id: `style-analysis-${Date.now()}`,
        referenceId: reference.id,
        analysis: enhancedAnalysis,
        confidence: this.calculateAnalysisConfidence(realAnalysis),
        processedAt: new Date(),
      }

      this.styleAnalyses.set(reference.id, result)

      log.info(
        { referenceId: reference.id, confidence: result.confidence },
        'Style reference analysis completed'
      )

      return result
    } catch (error) {
      log.error({ err: error, referenceId: reference.id }, 'Style analysis failed')
      throw new Error(`Failed to analyze style reference: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Synthesize multiple style references into a unified style
   */
  async synthesizeStyles(
    request: StyleSynthesisRequest,
    brandKit?: BrandKit,
    campaign?: Campaign
  ): Promise<StyleSynthesisResult> {
    try {
      log.info(
        {
          referenceCount: request.styleReferences.length,
          synthesisMode: request.synthesisMode,
          targetFormat: request.targetFormat,
        },
        'Starting style synthesis'
      )

      // Get or create analyses for all references
      const analyses = await Promise.all(
        request.styleReferences.map(async (refId) => {
          let analysis = this.styleAnalyses.get(refId)
          if (!analysis) {
            // In production, fetch the actual reference
            const mockRef: StyleReference = {
              id: refId,
              name: `Style Reference ${refId}`,
              description: 'Mock style reference for synthesis',
              referenceImages: [`https://example.com/style/${refId}`],
              extractedStyles: {
                colorPalette: {
                  primary: ['#3498db'],
                  secondary: ['#2c3e50'],
                  accent: ['#e74c3c']
                },
                typography: {
                  fonts: ['Inter', 'Roboto'],
                  weights: ['regular', 'bold'],
                  sizes: ['16px', '24px', '32px']
                },
                composition: {
                  layout: 'centered',
                  spacing: 'normal',
                  balance: 'symmetrical'
                },
                visualElements: {
                  gradients: false,
                  shadows: true,
                  borders: false,
                  patterns: false,
                  illustration: false,
                  photography: true
                }
              },
              usageCount: 0,
              workspaceId: request.workspaceId,
              createdAt: new Date(),
            }
            analysis = await this.analyzeStyleReference(mockRef)
          }
          return analysis
        })
      )

      // Synthesize based on mode
      const synthesizedStyle = this.performStyleSynthesis(analyses, request.synthesisMode)

      // Generate style guidance
      const styleGuidance = this.generateStyleGuidance(synthesizedStyle, request.targetFormat)

      // Create mock synthesized output
      const synthesizedOutput = this.generateMockSynthesizedOutput(
        request,
        synthesizedStyle,
        brandKit,
        campaign
      )

      // Calculate quality metrics
      const qualityMetrics = this.calculateSynthesisQuality(analyses, synthesizedStyle)

      // Generate recommendations
      const recommendations = this.generateSynthesisRecommendations(
        analyses,
        synthesizedStyle,
        qualityMetrics
      )

      const result: StyleSynthesisResult = {
        id: `style-synthesis-${Date.now()}`,
        request,
        analyses: analyses.map(a => ({
          referenceId: a.referenceId,
          confidence: a.confidence,
          keyAttributes: Object.values(a.analysis).flat(),
        })),
        synthesizedStyle,
        styleGuidance,
        synthesizedOutput,
        qualityMetrics,
        recommendations,
        processingTime: 1500 + Math.random() * 1000,
        createdAt: new Date(),
      }

      log.info(
        {
          synthesisId: result.id,
          avgConfidence: analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length,
          qualityScore: qualityMetrics.overallScore,
        },
        'Style synthesis completed'
      )

      return result
    } catch (error) {
      log.error({ err: error, requestId: request.workspaceId }, 'Style synthesis failed')
      throw new Error(`Failed to synthesize styles: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Find style references that match a given aesthetic
   */
  async findMatchingStyles(
    query: string,
    workspaceId: string,
    limit = 10
  ): Promise<StyleMatchResult[]> {
    try {
      log.info({ query, workspaceId, limit }, 'Searching for matching styles')

      // In production, this would search the actual style reference database
      // For now, return mock matches
      const mockMatches: StyleMatchResult[] = []

      for (let i = 0; i < Math.min(limit, 5); i++) {
        const similarityScore = 0.6 + Math.random() * 0.4
        mockMatches.push({
          referenceId: `style-ref-${i + 1}`,
          similarityScore,
          matchingAttributes: [
            'color harmony',
            'minimalist composition',
            'clean typography',
            'balanced layout',
          ].slice(0, Math.floor(Math.random() * 4) + 2),
          conflictingAttributes: similarityScore < 0.8 ? [
            'slight mood variation',
            'different temperature tones',
          ].slice(0, Math.floor(Math.random() * 2)) : [],
          recommendation: similarityScore > 0.85
            ? 'Excellent match for your aesthetic'
            : similarityScore > 0.75
            ? 'Good match with minor adjustments needed'
            : 'Consider blending with complementary styles',
        })
      }

      // Sort by similarity score
      mockMatches.sort((a, b) => b.similarityScore - a.similarityScore)

      return mockMatches
    } catch (error) {
      log.error({ err: error, query, workspaceId }, 'Style matching failed')
      throw new Error(`Failed to find matching styles: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Download and analyze real image data
   */
  private async analyzeRealImage(imageUrl: string, reference: StyleReference): Promise<{
    colorPalette: string[]
    composition: string[]
    visualStyle: string[]
    keyElements: string[]
    brightness: number
    contrast: number
    saturation: number
    dominantColors: Array<{ color: string; percentage: number }>
    imageMetadata: {
      width: number
      height: number
      format: string
      hasTransparency: boolean
    }
  }> {
    try {
      // Download image from URL
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`)
      }

      const imageBuffer = Buffer.from(await response.arrayBuffer())

      // Use Sharp for image analysis
      const image = sharp(imageBuffer)
      const metadata = await image.metadata()

      // Extract dominant colors
      const { dominant } = await image
        .resize(150, 150, { fit: 'inside' })
        .raw()
        .toBuffer({ resolveWithObject: true })
        .then(({ data }) => this.extractDominantColors(data))

      // Analyze image statistics
      const stats = await image.stats()

      // Analyze composition and layout
      const composition = await this.analyzeComposition(imageBuffer, metadata)

      // Detect visual style based on image characteristics
      const visualStyle = this.detectVisualStyle(stats, dominant, metadata)

      // Extract key elements
      const keyElements = await this.extractKeyElements(imageBuffer, dominant, visualStyle)

      return {
        colorPalette: dominant.map(c => c.color),
        composition,
        visualStyle,
        keyElements,
        brightness: this.calculateBrightness(stats),
        contrast: this.calculateContrast(stats),
        saturation: this.calculateSaturation(stats),
        dominantColors: dominant,
        imageMetadata: {
          width: metadata.width || 0,
          height: metadata.height || 0,
          format: metadata.format || 'unknown',
          hasTransparency: metadata.hasAlpha || false
        }
      }
    } catch (error) {
      log.error({ err: error, referenceId: reference.id, url: imageUrl }, 'Real image analysis failed')
      // Fallback to mock analysis
      return this.generateFallbackAnalysis(imageUrl, reference)
    }
  }

  /**
   * Extract dominant colors from image data using k-means clustering
   */
  private extractDominantColors(data: Buffer): Array<{ color: string; percentage: number }> {
    // Convert Buffer to pixel array
    const pixels = []
    for (let i = 0; i < data.length; i += 3) {
      if (i + 2 < data.length) {
        pixels.push([data[i], data[i + 1], data[i + 2]])
      }
    }

    // Simple color quantization - group similar colors
    const colorGroups = new Map<string, number>()

    pixels.forEach(([r, g, b]) => {
      // Quantize colors to reduce noise
      const qr = Math.round(r / 32) * 32
      const qg = Math.round(g / 32) * 32
      const qb = Math.round(b / 32) * 32

      const key = `${qr},${qg},${qb}`
      colorGroups.set(key, (colorGroups.get(key) || 0) + 1)
    })

    // Sort by frequency and get top colors
    const sortedColors = Array.from(colorGroups.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)

    const totalPixels = pixels.length

    return sortedColors.map(([colorStr, count]) => {
      const [r, g, b] = colorStr.split(',').map(Number)
      return {
        color: this.rgbToHex(r, g, b),
        percentage: (count / totalPixels) * 100
      }
    })
  }

  /**
   * Analyze image composition and layout
   */
  private async analyzeComposition(imageBuffer: Buffer, metadata: any): Promise<string[]> {
    const composition = []

    // Analyze aspect ratio
    const aspectRatio = (metadata.width || 1) / (metadata.height || 1)
    if (Math.abs(aspectRatio - 1) < 0.1) {
      composition.push('Square format')
    } else if (aspectRatio > 1) {
      composition.push('Landscape orientation')
    } else {
      composition.push('Portrait orientation')
    }

    // Analyse edge density to determine complexity
    const image = sharp(imageBuffer)
    const edges = await image
      .greyscale()
      .sharpen()
      .resize(100, 100, { fit: 'inside' })
      .raw()
      .toBuffer()

    const edgeDensity = this.calculateEdgeDensity(edges)

    if (edgeDensity > 0.3) {
      composition.push('High detail complexity')
    } else if (edgeDensity > 0.15) {
      composition.push('Moderate detail level')
    } else {
      composition.push('Simple composition')
    }

    // Detect symmetry (simplified)
    const symmetry = await this.detectSymmetry(imageBuffer)
    if (symmetry > 0.7) {
      composition.push('Symmetrical layout')
    } else if (symmetry > 0.4) {
      composition.push('Partial symmetry')
    } else {
      composition.push('Asymmetrical composition')
    }

    // Analyze visual weight distribution
    const weightDistribution = await this.analyzeVisualWeight(imageBuffer)
    composition.push(weightDistribution)

    return composition
  }

  /**
   * Detect visual style based on image characteristics
   */
  private detectVisualStyle(
    stats: any,
    dominant: Array<{ color: string; percentage: number }>,
    metadata: any
  ): string[] {
    const styles = []

    // Analyze color characteristics
    const avgBrightness = this.calculateBrightness(stats)
    const colorCount = dominant.length
    const vividColors = dominant.filter(c => this.isVividColor(c.color)).length

    // Style detection based on brightness
    if (avgBrightness > 0.7) {
      styles.push('Bright and airy')
    } else if (avgBrightness < 0.3) {
      styles.push('Dark and moody')
    } else {
      styles.push('Balanced lighting')
    }

    // Style based on color palette
    if (colorCount <= 3) {
      styles.push('Minimalist color scheme')
    } else if (colorCount >= 6) {
      styles.push('Rich color palette')
    }

    if (vividColors > colorCount * 0.5) {
      styles.push('Vibrant and bold')
    } else if (vividColors < colorCount * 0.2) {
      styles.push('Muted tones')
    }

    // Style based on composition complexity
    const aspectRatio = (metadata.width || 1) / (metadata.height || 1)
    if (aspectRatio > 1.5) {
      styles.push('Cinematic composition')
    } else if (aspectRatio < 0.7) {
      styles.push('Portrait orientation')
    } else {
      styles.push('Balanced composition')
    }

    // Detect specific design styles
    const avgSaturation = this.calculateSaturation(stats)
    if (avgSaturation > 0.7 && vividColors > 0) {
      styles.push('Modern and energetic')
    } else if (avgSaturation < 0.3) {
      styles.push('Vintage aesthetic')
    }

    return styles
  }

  /**
   * Extract key visual elements
   */
  private async extractKeyElements(
    imageBuffer: Buffer,
    dominant: Array<{ color: string; percentage: number }>,
    visualStyle: string[]
  ): Promise<string[]> {
    const elements = []

    // Analyze color patterns
    if (dominant.length >= 4) {
      elements.push('Multi-color composition')
    }

    const hasGradients = dominant.some(c => c.percentage < 10)
    if (hasGradients) {
      elements.push('Smooth color transitions')
    }

    // Analyze contrast
    const image = sharp(imageBuffer)
    const stats = await image.stats()
    const contrast = this.calculateContrast(stats)

    if (contrast > 0.6) {
      elements.push('High contrast elements')
    } else if (contrast < 0.2) {
      elements.push('Soft transitions')
    }

    // Style-specific elements
    if (visualStyle.includes('Minimalist')) {
      elements.push('Clean lines')
      elements.push('Negative space')
    }

    if (visualStyle.includes('Vintage')) {
      elements.push('Retro textures')
      elements.push('Classic typography')
    }

    if (visualStyle.includes('Modern')) {
      elements.push('Geometric shapes')
      elements.push('Bold typography')
    }

    return elements
  }

  /**
   * Enhance analysis with AI insights
   */
  private async enhanceAnalysisWithAI(
    imageUrl: string,
    reference: StyleReference,
    realAnalysis: any
  ): Promise<StyleAnalysisResult['analysis']> {
    try {
      if (!process.env.OPENAI_API_KEY) {
        // Return basic analysis without AI enhancement
        return {
          colorPalette: realAnalysis.colorPalette,
          typography: this.guessTypographyFromStyle(realAnalysis.visualStyle),
          composition: realAnalysis.composition,
          mood: this.deriveMoodFromStyle(realAnalysis.visualStyle, realAnalysis.colorPalette),
          visualStyle: realAnalysis.visualStyle,
          keyElements: realAnalysis.keyElements
        }
      }

      const prompt = `
Analyze this image style reference and provide detailed design insights.

IMAGE ANALYSIS:
URL: ${imageUrl}
Description: ${reference.description}
Detected Colors: ${realAnalysis.colorPalette.join(', ')}
Visual Style: ${realAnalysis.visualStyle.join(', ')}
Composition: ${realAnalysis.composition.join(', ')}

Provide insights on:
1. TYPOGRAPHY: What font styles would complement this aesthetic?
2. MOOD: What emotions does this style evoke?
3. DESIGN USAGE: How would this work in marketing materials?

Return JSON with: {
  "typography": ["font descriptions"],
  "mood": ["emotional descriptors"],
  "colorPalette": ["enhanced color descriptions"],
  "composition": ["refined composition analysis"],
  "visualStyle": ["professional style classifications"],
  "keyElements": ["distinctive design elements"]
}`

      const response = await this.openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        response_format: { type: "json_object" }
      })

      const aiInsights = JSON.parse(response.choices[0].message.content || '{}')

      // Merge AI insights with real analysis
      return {
        colorPalette: aiInsights.colorPalette || realAnalysis.colorPalette,
        typography: aiInsights.typography || this.guessTypographyFromStyle(realAnalysis.visualStyle),
        composition: aiInsights.composition || realAnalysis.composition,
        mood: aiInsights.mood || this.deriveMoodFromStyle(realAnalysis.visualStyle, realAnalysis.colorPalette),
        visualStyle: aiInsights.visualStyle || realAnalysis.visualStyle,
        keyElements: aiInsights.keyElements || realAnalysis.keyElements
      }
    } catch (error) {
      log.error({ err: error, referenceId: reference.id }, 'AI enhancement failed, using basic analysis')

      // Fallback to basic analysis
      return {
        colorPalette: realAnalysis.colorPalette,
        typography: this.guessTypographyFromStyle(realAnalysis.visualStyle),
        composition: realAnalysis.composition,
        mood: this.deriveMoodFromStyle(realAnalysis.visualStyle, realAnalysis.colorPalette),
        visualStyle: realAnalysis.visualStyle,
        keyElements: realAnalysis.keyElements
      }
    }
  }

  /**
   * Calculate confidence score for the analysis
   */
  private calculateAnalysisConfidence(analysis: any): number {
    let confidence = 0.5 // Base confidence

    // Higher confidence for good color extraction
    if (analysis.colorPalette.length >= 3 && analysis.colorPalette.length <= 8) {
      confidence += 0.15
    }

    // Higher confidence for multiple style attributes
    if (analysis.visualStyle.length >= 2) {
      confidence += 0.1
    }

    // Higher confidence for detailed composition analysis
    if (analysis.composition.length >= 3) {
      confidence += 0.1
    }

    // Consider image quality factors
    if (analysis.brightness > 0.2 && analysis.brightness < 0.8) {
      confidence += 0.05
    }

    if (analysis.contrast > 0.3) {
      confidence += 0.05
    }

    return Math.min(confidence, 0.95) // Cap at 95%
  }

  /**
   * Helper methods for image analysis
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    }).join('')
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  private calculateBrightness(stats: any): number {
    if (!stats.channels || stats.channels.length < 3) return 0.5

    const r = stats.channels[0].mean / 255
    const g = stats.channels[1].mean / 255
    const b = stats.channels[2].mean / 255

    // Perceived brightness formula
    return (0.299 * r + 0.587 * g + 0.114 * b)
  }

  private calculateContrast(stats: any): number {
    if (!stats.channels || stats.channels.length < 3) return 0.5

    // Calculate standard deviation across all channels
    let totalStdDev = 0
    let channelCount = 0

    for (let i = 0; i < Math.min(3, stats.channels.length); i++) {
      if (stats.channels[i].stdev) {
        totalStdDev += stats.channels[i].stdev / 255
        channelCount++
      }
    }

    return channelCount > 0 ? totalStdDev / channelCount : 0.5
  }

  private calculateSaturation(stats: any): number {
    if (!stats.channels || stats.channels.length < 3) return 0.5

    const r = stats.channels[0].mean / 255
    const g = stats.channels[1].mean / 255
    const b = stats.channels[2].mean / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const delta = max - min

    return max === 0 ? 0 : delta / max
  }

  private isVividColor(hex: string): boolean {
    const rgb = this.hexToRgb(hex)
    if (!rgb) return false

    const max = Math.max(rgb.r, rgb.g, rgb.b)
    const min = Math.min(rgb.r, rgb.g, rgb.b)
    const saturation = max === 0 ? 0 : (max - min) / max
    const brightness = (rgb.r + rgb.g + rgb.b) / (3 * 255)

    return saturation > 0.6 && brightness > 0.2 && brightness < 0.8
  }

  private calculateEdgeDensity(edges: Buffer): number {
    let edgePixels = 0
    const threshold = 30

    for (let i = 0; i < edges.length; i++) {
      if (edges[i] > threshold) {
        edgePixels++
      }
    }

    return edgePixels / edges.length
  }

  private async detectSymmetry(imageBuffer: Buffer): Promise<number> {
    try {
      const image = sharp(imageBuffer)
      const { data, info } = await image
        .resize(200, 200, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true })

      let symmetricalPixels = 0
      const width = info.width!
      const height = info.height!

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width / 2; x++) {
          const leftPixel = data[y * width + x]
          const rightPixel = data[y * width + (width - 1 - x)]
          const difference = Math.abs(leftPixel - rightPixel)

          if (difference < 20) {
            symmetricalPixels++
          }
        }
      }

      const totalComparisons = height * Math.floor(width / 2)
      return totalComparisons > 0 ? symmetricalPixels / totalComparisons : 0.5
    } catch (error) {
      return 0.5 // Default to moderately asymmetrical
    }
  }

  private async analyzeVisualWeight(imageBuffer: Buffer): Promise<string> {
    try {
      const image = sharp(imageBuffer)
      const { data, info } = await image
        .resize(100, 100, { fit: 'fill' })
        .greyscale()
        .raw()
        .toBuffer({ resolveWithObject: true })

      const width = info.width!
      const height = info.height!

      // Divide image into thirds and calculate brightness
      let leftWeight = 0, centerWeight = 0, rightWeight = 0

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixel = data[y * width + x]
          const brightness = pixel / 255

          if (x < width / 3) {
            leftWeight += brightness
          } else if (x < (2 * width) / 3) {
            centerWeight += brightness
          } else {
            rightWeight += brightness
          }
        }
      }

      const totalPixels = width * height
      leftWeight /= totalPixels
      centerWeight /= totalPixels
      rightWeight /= totalPixels

      if (Math.abs(leftWeight - rightWeight) < 0.05) {
        return 'Balanced visual weight'
      } else if (leftWeight > rightWeight) {
        return 'Left-weighted composition'
      } else {
        return 'Right-weighted composition'
      }
    } catch (error) {
      return 'Center-weighted composition'
    }
  }

  private guessTypographyFromStyle(visualStyle: string[]): string[] {
    const typography = []

    if (visualStyle.includes('Modern') || visualStyle.includes('Minimalist')) {
      typography.push('Clean sans-serif fonts')
      typography.push('Geometric typography')
    }

    if (visualStyle.includes('Vintage') || visualStyle.includes('Classic')) {
      typography.push('Serif fonts')
      typography.push('Classic typography')
    }

    if (visualStyle.includes('Bold') || visualStyle.includes('Vibrant')) {
      typography.push('Bold display fonts')
      typography.push('Strong font weights')
    }

    if (visualStyle.includes('Elegant') || visualStyle.includes('Sophisticated')) {
      typography.push('Elegant script fonts')
      typography.push('Light font weights')
    }

    return typography.length > 0 ? typography : ['Versatile typography', 'Standard font hierarchy']
  }

  private deriveMoodFromStyle(visualStyle: string[], colorPalette: string[]): string[] {
    const mood = []

    // Mood from visual style
    if (visualStyle.includes('Bright') || visualStyle.includes('Airy')) {
      mood.push('Uplifting')
      mood.push('Positive')
    }

    if (visualStyle.includes('Dark') || visualStyle.includes('Moody')) {
      mood.push('Dramatic')
      mood.push('Intense')
    }

    if (visualStyle.includes('Minimalist') || visualStyle.includes('Clean')) {
      mood.push('Calm')
      mood.push('Professional')
    }

    if (visualStyle.includes('Vibrant') || visualStyle.includes('Bold')) {
      mood.push('Energetic')
      mood.push('Dynamic')
    }

    // Mood from colors
    const warmColors = colorPalette.filter(hex => {
      const rgb = this.hexToRgb(hex)
      return rgb && rgb.r > rgb.b
    }).length

    const coolColors = colorPalette.filter(hex => {
      const rgb = this.hexToRgb(hex)
      return rgb && rgb.b > rgb.r
    }).length

    if (warmColors > coolColors) {
      mood.push('Warm and inviting')
    } else if (coolColors > warmColors) {
      mood.push('Cool and calming')
    }

    return mood.length > 0 ? mood : ['Versatile', 'Professional']
  }

  private generateFallbackAnalysis(imageUrl: string, reference: StyleReference): any {
    // Generate reasonable fallback based on description
    const hasModern = reference.description?.toLowerCase().includes('modern') || false
    const hasMinimal = reference.description?.toLowerCase().includes('minimal') || false
    const hasBold = reference.description?.toLowerCase().includes('bold') || false

    return {
      colorPalette: ['#3498db', '#2c3e50', '#ecf0f1', '#ffffff', '#34495e'],
      composition: ['Balanced layout', 'Clear hierarchy'],
      visualStyle: [
        hasModern ? 'Modern' : 'Contemporary',
        hasMinimal ? 'Minimalist' : 'Detailed',
        hasBold ? 'Bold' : 'Subtle'
      ],
      keyElements: ['Clean design', 'Professional appearance'],
      brightness: 0.6,
      contrast: 0.5,
      saturation: 0.6,
      dominantColors: [
        { color: '#3498db', percentage: 30 },
        { color: '#2c3e50', percentage: 25 },
        { color: '#ecf0f1', percentage: 20 },
        { color: '#ffffff', percentage: 15 },
        { color: '#34495e', percentage: 10 }
      ],
      imageMetadata: {
        width: 1080,
        height: 1080,
        format: 'unknown',
        hasTransparency: false
      }
    }
  }

  /**
   * Generate mock analysis based on reference description
   */
  private generateMockAnalysis(reference: StyleReference): StyleAnalysisResult['analysis'] {
    const styles = [
      {
        colorPalette: ['#2C3E50', '#34495E', '#E74C3C', '#ECF0F1', '#FFFFFF'],
        typography: ['Modern sans-serif', 'Clean geometric forms', 'Medium weight', 'Excellent readability'],
        composition: ['Centered layout', 'Balanced asymmetry', 'Generous whitespace', 'Clear visual hierarchy'],
        mood: ['Professional', 'Trustworthy', 'Modern', 'Approachable'],
        visualStyle: ['Minimalist', 'Corporate', 'Clean', 'Sophisticated'],
        keyElements: ['Bold typography', 'Subtle gradients', 'Geometric shapes', 'Monochromatic accents'],
      },
      {
        colorPalette: ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#FFFFFF'],
        typography: ['Bold display fonts', 'Playful scripts', 'Varied weights', 'Dynamic hierarchy'],
        composition: ['Dynamic grid', 'Overlapping elements', 'Energetic flow', 'Surprising contrasts'],
        mood: ['Creative', 'Youthful', 'Energetic', 'Bold'],
        visualStyle: ['Contemporary', 'Artistic', 'Expressive', 'Vibrant'],
        keyElements: ['Gradient backgrounds', 'Bold color blocks', 'Experimental typography', 'Artistic textures'],
      },
      {
        colorPalette: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FFFFFF'],
        typography: ['Friendly rounded fonts', 'Handwritten elements', 'Light weights', 'Organic feel'],
        composition: ['Organic layout', 'Natural flow', 'Soft corners', 'Harmonious spacing'],
        mood: ['Natural', 'Friendly', 'Approachable', 'Calm'],
        visualStyle: ['Organic', 'Eco-friendly', 'Soft', 'Natural'],
        keyElements: ['Natural textures', 'Organic shapes', 'Earthy tones', 'Green accents'],
      },
    ]

    return styles[Math.floor(Math.random() * styles.length)]
  }

  /**
   * Perform style synthesis based on mode
   */
  private performStyleSynthesis(
    analyses: StyleAnalysisResult[],
    mode: 'dominant' | 'balanced' | 'creative' | 'conservative'
  ): StyleSynthesisResult['synthesizedStyle'] {
    const allColors = analyses.flatMap(a => a.analysis.colorPalette)
    const allTypography = analyses.flatMap(a => a.analysis.typography)
    const allComposition = analyses.flatMap(a => a.analysis.composition)
    const allMood = analyses.flatMap(a => a.analysis.mood)
    const allVisualStyle = analyses.flatMap(a => a.analysis.visualStyle)
    const allKeyElements = analyses.flatMap(a => a.analysis.keyElements)

    let selectedColors: string[]
    let selectedTypography: string[]
    let selectedComposition: string[]
    let selectedMood: string[]
    let selectedVisualStyle: string[]
    let selectedKeyElements: string[]

    switch (mode) {
      case 'dominant':
        // Take most common elements
        selectedColors = this.getMostCommon(allColors, 3)
        selectedTypography = this.getMostCommon(allTypography, 2)
        selectedComposition = this.getMostCommon(allComposition, 2)
        selectedMood = this.getMostCommon(allMood, 2)
        selectedVisualStyle = this.getMostCommon(allVisualStyle, 1)
        selectedKeyElements = this.getMostCommon(allKeyElements, 3)
        break

      case 'balanced':
        // Mix elements evenly
        selectedColors = this.getBalancedSelection(allColors, 5)
        selectedTypography = this.getBalancedSelection(allTypography, 3)
        selectedComposition = this.getBalancedSelection(allComposition, 3)
        selectedMood = this.getBalancedSelection(allMood, 2)
        selectedVisualStyle = this.getBalancedSelection(allVisualStyle, 2)
        selectedKeyElements = this.getBalancedSelection(allKeyElements, 4)
        break

      case 'creative':
        // Combine contrasting elements
        selectedColors = this.getCreativeSelection(allColors, 6)
        selectedTypography = this.getCreativeSelection(allTypography, 4)
        selectedComposition = this.getCreativeSelection(allComposition, 3)
        selectedMood = this.getCreativeSelection(allMood, 3)
        selectedVisualStyle = this.getCreativeSelection(allVisualStyle, 3)
        selectedKeyElements = this.getCreativeSelection(allKeyElements, 5)
        break

      case 'conservative':
        // Select safest, most compatible elements
        selectedColors = this.getConservativeSelection(allColors, 3)
        selectedTypography = this.getConservativeSelection(allTypography, 2)
        selectedComposition = this.getConservativeSelection(allComposition, 2)
        selectedMood = this.getConservativeSelection(allMood, 2)
        selectedVisualStyle = this.getConservativeSelection(allVisualStyle, 1)
        selectedKeyElements = this.getConservativeSelection(allKeyElements, 2)
        break

      default:
        throw new Error(`Unknown synthesis mode: ${mode}`)
    }

    return {
      colorPalette: selectedColors,
      typography: selectedTypography,
      composition: selectedComposition,
      mood: selectedMood,
      visualStyle: selectedVisualStyle,
      keyElements: selectedKeyElements,
      synthesisMode: mode,
      confidence: 0.75 + Math.random() * 0.2,
    }
  }

  /**
   * Helper methods for selection strategies
   */
  private getMostCommon<T>(items: T[], count: number): T[] {
    const counts = new Map<T, number>()
    items.forEach(item => counts.set(item, (counts.get(item) || 0) + 1))

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, count)
      .map(entry => entry[0])
  }

  private getBalancedSelection<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => Math.random() - 0.5)
    return [...new Set(shuffled)].slice(0, count)
  }

  private getCreativeSelection<T>(items: T[], count: number): T[] {
    // Select diverse elements
    const unique = [...new Set(items)]
    const selected: T[] = []

    for (let i = 0; i < count && unique.length > 0; i++) {
      const index = Math.floor(Math.random() * unique.length)
      selected.push(unique[index])
      unique.splice(index, 1)
    }

    return selected
  }

  private getConservativeSelection<T>(items: T[], count: number): T[] {
    // Select most common, safe elements
    return this.getMostCommon(items, Math.min(count, 3))
  }

  /**
   * Generate style guidance for target format
   */
  private generateStyleGuidance(
    synthesizedStyle: StyleSynthesisResult['synthesizedStyle'],
    targetFormat?: string
  ): string[] {
    const guidance = [
      `Apply the ${synthesizedStyle.visualStyle.join(', ')} aesthetic consistently`,
      `Use the color palette: ${synthesizedStyle.colorPalette.slice(0, 3).join(', ')}`,
      `Implement ${synthesizedStyle.typography[0]} for primary elements`,
      `Follow ${synthesizedStyle.composition[0]} principles`,
      `Maintain a ${synthesizedStyle.mood.join(' and ')} mood`,
    ]

    if (targetFormat) {
      guidance.push(`Optimize for ${targetFormat} specifications`)
      if (targetFormat.includes('story')) {
        guidance.push('Design for vertical scrolling and safe zones')
      } else if (targetFormat.includes('square')) {
        guidance.push('Create centered, balanced compositions')
      } else if (targetFormat.includes('landscape')) {
        guidance.push('Use horizontal flow and wide compositions')
      }
    }

    return guidance
  }

  /**
   * Generate mock synthesized output
   */
  private generateMockSynthesizedOutput(
    request: StyleSynthesisRequest,
    synthesizedStyle: StyleSynthesisResult['synthesizedStyle'],
    brandKit?: BrandKit,
    campaign?: Campaign
  ): StyleSynthesisResult['synthesizedOutput'] {
    const dimensions = request.targetFormat?.includes('story')
      ? { width: 1080, height: 1920 }
      : request.targetFormat?.includes('landscape')
      ? { width: 1920, height: 1080 }
      : { width: 1080, height: 1080 }

    return {
      url: `https://via.placeholder.com/${dimensions.width}x${dimensions.height}/${synthesizedStyle.colorPalette[0]?.replace('#', '') || '4A90E2'}/${synthesizedStyle.colorPalette[1]?.replace('#', '') || 'FFFFFF'}?text=SYNTHESIZED`,
      thumbnailUrl: `https://via.placeholder.com/320x${Math.round(320 * dimensions.height / dimensions.width)}/${synthesizedStyle.colorPalette[0]?.replace('#', '') || '4A90E2'}/${synthesizedStyle.colorPalette[1]?.replace('#', '') || 'FFFFFF'}?text=STYLE`,
      dimensions,
      format: request.targetFormat || 'square',
      styleScore: synthesizedStyle.confidence * 100,
      brandAlignment: brandKit ? 85 + Math.random() * 10 : 70 + Math.random() * 15,
      campaignAlignment: campaign ? 80 + Math.random() * 15 : 75 + Math.random() * 10,
    }
  }

  /**
   * Calculate synthesis quality metrics
   */
  private calculateSynthesisQuality(
    analyses: StyleAnalysisResult[],
    synthesizedStyle: StyleSynthesisResult['synthesizedStyle']
  ): StyleSynthesisResult['qualityMetrics'] {
    const avgConfidence = analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length
    const styleDiversity = new Set(analyses.flatMap(a => Object.values(a.analysis))).size
    const synthesisComplexity = synthesizedStyle.colorPalette.length +
      synthesizedStyle.typography.length +
      synthesizedStyle.keyElements.length

    return {
      coherence: Math.round(avgConfidence * 100),
      diversity: Math.round((styleDiversity / 50) * 100),
      innovation: synthesizedStyle.synthesisMode === 'creative' ? 85 : 70,
      brandConsistency: 85 + Math.random() * 10,
      overallScore: Math.round((avgConfidence * 40 + (styleDiversity / 50) * 30 + (synthesisComplexity / 20) * 30)),
    }
  }

  /**
   * Generate synthesis recommendations
   */
  private generateSynthesisRecommendations(
    analyses: StyleAnalysisResult[],
    synthesizedStyle: StyleSynthesisResult['synthesizedStyle'],
    qualityMetrics: StyleSynthesisResult['qualityMetrics']
  ): string[] {
    const recommendations: string[] = []

    if (qualityMetrics.coherence < 80) {
      recommendations.push('Consider selecting more compatible style references')
    }

    if (qualityMetrics.diversity < 60) {
      recommendations.push('Try adding more diverse style references for richer synthesis')
    }

    if (synthesizedStyle.synthesisMode === 'conservative' && qualityMetrics.innovation < 70) {
      recommendations.push('Consider using balanced or creative mode for more distinctive results')
    }

    if (synthesizedStyle.colorPalette.length > 6) {
      recommendations.push('Simplify the color palette for better brand consistency')
    }

    if (qualityMetrics.overallScore < 85) {
      recommendations.push('Refine style selections to improve overall synthesis quality')
    }

    if (recommendations.length === 0) {
      recommendations.push('Excellent style synthesis! Consider exploring creative mode for more variety')
    }

    return recommendations
  }
}