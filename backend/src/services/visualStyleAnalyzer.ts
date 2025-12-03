import OpenAI from 'openai'
import { log } from '../middleware/logger'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface VisualStyleAnalysis {
  extractedColors: string[]
  detectedLayout: 'center-focus' | 'bottom-text' | 'top-text' | 'split'
  textDensity: 'minimal' | 'moderate' | 'heavy'
  styleTags: string[]
  dominantColors: string[]
  colorPalette: string[]
  composition: string
  typography: string
  visualElements: string[]
}

export class VisualStyleAnalyzer {
  /**
   * Analyze a reference creative image to extract visual style characteristics
   */
  static async analyzeVisualStyle(
    imageUrl: string
  ): Promise<VisualStyleAnalysis> {
    try {
      const systemPrompt = `You are a visual design analysis expert. Analyze the provided image and extract detailed style characteristics.

Your analysis should identify:
1. Color palette - extract the main 5-7 colors visible in the image (hex codes if possible)
2. Layout pattern - determine the primary layout structure
3. Text density - assess how much text is present
4. Style characteristics - identify key design style attributes
5. Composition - describe the overall visual composition
6. Typography - assess font styles and text treatment
7. Visual elements - identify notable design elements

Return your analysis as a JSON object with this structure:
{
  "extractedColors": ["#color1", "#color2", "#color3"],
  "detectedLayout": "center-focus" | "bottom-text" | "top-text" | "split",
  "textDensity": "minimal" | "moderate" | "heavy",
  "styleTags": ["high-contrast", "bold-typography", "minimal", "vibrant", "monochrome"],
  "dominantColors": ["#color1", "#color2"],
  "colorPalette": ["#color1", "#color2", "#color3", "#color4", "#color5"],
  "composition": "description of overall composition",
  "typography": "description of typography style",
  "visualElements": ["element1", "element2", "element3"]
}

Layout patterns:
- center-focus: Main subject/element centered in frame
- bottom-text: Text positioned at bottom of image
- top-text: Text positioned at top of image
- split: Image divided into sections (left/right, top/bottom)

Text density:
- minimal: Very little text, just logo or short headline
- moderate: Noticeable text but not overwhelming
- heavy: Text is a dominant element in the design`

      const completion = await openai.chat.completions.create({
        model: 'gpt-4-vision-preview',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image and extract the visual style characteristics:',
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.2, // Lower temperature for consistent analysis
        response_format: { type: 'json_object' },
      })

      const analysis = completion.choices[0]?.message?.content?.trim()

      if (!analysis) {
        throw new Error(
          'Failed to analyze visual style: No content returned from AI'
        )
      }

      const visualAnalysis = JSON.parse(analysis) as VisualStyleAnalysis

      // Validate and normalize the response
      return {
        extractedColors: visualAnalysis.extractedColors || [],
        detectedLayout: this.normalizeLayout(visualAnalysis.detectedLayout),
        textDensity: this.normalizeTextDensity(visualAnalysis.textDensity),
        styleTags: this.normalizeStyleTags(visualAnalysis.styleTags || []),
        dominantColors:
          visualAnalysis.dominantColors ||
          visualAnalysis.extractedColors?.slice(0, 2) ||
          [],
        colorPalette:
          visualAnalysis.colorPalette || visualAnalysis.extractedColors || [],
        composition:
          visualAnalysis.composition || 'Visual composition analysis',
        typography: visualAnalysis.typography || 'Typography style analysis',
        visualElements: visualAnalysis.visualElements || [],
      }
    } catch (error) {
      log.error({ err: error }, 'Error analyzing visual style')

      // Fallback to basic analysis if AI fails
      return this.getFallbackAnalysis(imageUrl)
    }
  }

  /**
   * Normalize layout value to allowed types
   */
  private static normalizeLayout(
    layout: string
  ): 'center-focus' | 'bottom-text' | 'top-text' | 'split' {
    const validLayouts = ['center-focus', 'bottom-text', 'top-text', 'split']
    return validLayouts.includes(layout) ? (layout as any) : 'center-focus'
  }

  /**
   * Normalize text density value to allowed types
   */
  private static normalizeTextDensity(
    density: string
  ): 'minimal' | 'moderate' | 'heavy' {
    const validDensities = ['minimal', 'moderate', 'heavy']
    return validDensities.includes(density) ? (density as any) : 'moderate'
  }

  /**
   * Normalize and limit style tags
   */
  private static normalizeStyleTags(tags: string[]): string[] {
    const allStyleTags = [
      'high-contrast',
      'bold-typography',
      'minimal',
      'vibrant',
      'monochrome',
      'gradient',
      'geometric',
      'organic',
      'retro',
      'modern',
      'classic',
      'playful',
      'professional',
      'elegant',
      'edgy',
      'clean',
    ]

    return tags
      .filter((tag) => allStyleTags.includes(tag.toLowerCase()))
      .slice(0, 5) // Limit to 5 most relevant tags
  }

  /**
   * Fallback analysis for when AI analysis fails
   */
  private static getFallbackAnalysis(imageUrl: string): VisualStyleAnalysis {
    return {
      extractedColors: ['#000000', '#FFFFFF', '#3B82F6', '#10B981', '#F59E0B'],
      detectedLayout: 'center-focus',
      textDensity: 'moderate',
      styleTags: ['clean', 'professional'],
      dominantColors: ['#000000', '#FFFFFF'],
      colorPalette: ['#000000', '#FFFFFF', '#3B82F6', '#10B981', '#F59E0B'],
      composition: 'Balanced visual composition with central focus',
      typography: 'Clean, readable typography',
      visualElements: ['Central imagery', 'Text overlay', 'Brand elements'],
    }
  }

  /**
   * Convert visual style analysis into prompt instructions for creative generation
   */
  static visualStyleToPrompt(analysis: VisualStyleAnalysis): string {
    const instructions = []

    if (analysis.styleTags && analysis.styleTags.length > 0) {
      instructions.push(
        `Style: Create a ${analysis.styleTags.join(', ')} design`
      )
    }

    if (analysis.detectedLayout) {
      instructions.push(
        `Layout: Use a ${analysis.detectedLayout.replace('-', ' ')} layout`
      )
    }

    if (analysis.colorPalette && analysis.colorPalette.length > 0) {
      instructions.push(
        `Colors: Use a color palette similar to ${analysis.colorPalette.join(', ')}`
      )
    }

    if (analysis.textDensity) {
      instructions.push(`Text: Use ${analysis.textDensity} text placement`)
    }

    if (analysis.composition) {
      instructions.push(`Composition: ${analysis.composition}`)
    }

    if (analysis.typography) {
      instructions.push(`Typography: ${analysis.typography}`)
    }

    return instructions.join('\n- ')
  }
}
