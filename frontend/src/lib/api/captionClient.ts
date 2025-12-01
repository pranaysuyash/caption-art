/**
 * Caption API Client
 * Wraps backend API calls for caption generation
 */

import { backendClient } from './backendClient'

export interface CaptionResult {
  baseCaption: string
  variants: string[]
  generationTime: number
}

export class CaptionClient {
  /**
   * Generate captions for an image
   */
  async generate(imageDataUrl: string): Promise<CaptionResult> {
    const startTime = Date.now()
    
    try {
      const response = await backendClient.generateCaption(imageDataUrl)
      const generationTime = Date.now() - startTime
      
      return {
        baseCaption: response.baseCaption,
        variants: response.variants,
        generationTime
      }
    } catch (error) {
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Failed to generate captions'
      )
    }
  }
}

export const captionClient = new CaptionClient()
