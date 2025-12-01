/**
 * Main Caption Generator orchestrator
 * Requirements: All
 */

import { GenerationResult } from './types'
import { ReplicateClient, ReplicateError } from './replicateClient'
import { OpenAIClient, OpenAIConfig, OpenAIError } from './openaiClient'
import { CaptionCache } from './captionCache'
import { getAllStyles } from './stylePrompts'
import { hashImage } from './imageHasher'
import { RateLimiter } from './rateLimiter'

/**
 * Configuration for CaptionGenerator
 */
export interface CaptionGeneratorConfig {
  replicateApiKey: string
  openaiApiKey: string
  maxRetries?: number
  timeout?: number
  cacheSize?: number
  cacheTTL?: number
  requestsPerMinute?: number
}

/**
 * Main caption generation orchestrator
 * Requirements: All
 */
export class CaptionGenerator {
  private replicateClient: ReplicateClient
  private openaiClient: OpenAIClient
  private cache: CaptionCache
  private rateLimiter: RateLimiter
  private currentPredictionId: string | null = null
  private abortController: AbortController | null = null
  // Request deduplication: track in-flight requests by image hash
  private inFlightRequests: Map<string, Promise<GenerationResult>> = new Map()
  // Prefetching: track prefetch promises
  private prefetchPromises: Map<string, Promise<GenerationResult>> = new Map()

  constructor(config: CaptionGeneratorConfig) {
    // Initialize Replicate client
    this.replicateClient = new ReplicateClient(config.replicateApiKey)
    
    // Initialize OpenAI client with configuration
    const openaiConfig: OpenAIConfig = {
      apiKey: config.openaiApiKey,
      model: 'gpt-3.5-turbo',
      temperature: 0.8,
      maxTokens: 150
    }
    this.openaiClient = new OpenAIClient(openaiConfig)
    
    // Initialize cache
    const cacheSize = config.cacheSize || 50
    const cacheTTL = config.cacheTTL || 3600000 // 1 hour default
    this.cache = new CaptionCache(cacheSize, cacheTTL)
    
    // Initialize rate limiter - Requirements: 4.3
    const requestsPerMinute = config.requestsPerMinute || 10
    this.rateLimiter = new RateLimiter({ requestsPerMinute })
  }

  /**
   * Validate image data URL
   * Requirements: 4.4
   */
  private validateImageDataUrl(imageDataUrl: string): void {
    // Check if data is provided
    if (!imageDataUrl || typeof imageDataUrl !== 'string') {
      throw new Error('Invalid image data.')
    }
    
    // Check if it's a valid data URL
    if (!imageDataUrl.startsWith('data:image/')) {
      throw new Error('Unsupported image format. Please use JPG, PNG, or WebP.')
    }
    
    // Extract MIME type
    const mimeMatch = imageDataUrl.match(/^data:(image\/[a-z]+);/)
    if (!mimeMatch) {
      throw new Error('Invalid image data format.')
    }
    
    const mimeType = mimeMatch[1]
    const supportedTypes = ['image/jpeg', 'image/png', 'image/webp']
    
    if (!supportedTypes.includes(mimeType)) {
      throw new Error('Unsupported image format. Please use JPG, PNG, or WebP.')
    }
    
    // Check if image has content (data URL should have base64 data after comma)
    const base64Data = imageDataUrl.split(',')[1]
    if (!base64Data || base64Data.length === 0) {
      throw new Error('Invalid image file. Please try another.')
    }
    
    // Estimate file size from base64 (rough approximation: base64 is ~1.37x original size)
    const estimatedSize = (base64Data.length * 3) / 4
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (estimatedSize > maxSize) {
      throw new Error('Image too large. Please use an image under 10MB.')
    }
  }

  /**
   * Generate captions for an image
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 6.1, 6.2, 4.3
   */
  async generate(imageDataUrl: string): Promise<GenerationResult> {
    // Validate image format - Requirements: 4.4
    this.validateImageDataUrl(imageDataUrl)
    
    // Hash image for cache key and deduplication
    const imageHash = await hashImage(imageDataUrl)
    
    // Check cache for existing result - Requirements: 6.1, 6.2
    const cachedResult = this.cache.get(imageHash)
    if (cachedResult) {
      return cachedResult
    }
    
    // Request deduplication: check if request is already in flight - Requirements: 6.1, 6.2
    const inFlightRequest = this.inFlightRequests.get(imageHash)
    if (inFlightRequest) {
      return inFlightRequest
    }
    
    // Apply rate limiting - Requirements: 4.3
    const generationPromise = this.rateLimiter.enqueue(() => 
      this.performGeneration(imageDataUrl, imageHash)
    )
    
    // Track in-flight request
    this.inFlightRequests.set(imageHash, generationPromise)
    
    try {
      const result = await generationPromise
      return result
    } finally {
      // Clean up in-flight request tracking
      this.inFlightRequests.delete(imageHash)
    }
  }

  /**
   * Internal method to perform the actual generation
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   */
  private async performGeneration(imageDataUrl: string, imageHash: string): Promise<GenerationResult> {
    const startTime = Date.now()
    
    // Create abort controller for this generation
    this.abortController = new AbortController()
    
    try {
      // Call Replicate BLIP API
      const prediction = await this.replicateClient.createPrediction(imageDataUrl)
      this.currentPredictionId = prediction.id
      
      // Wait for base caption (30 second timeout)
      const baseCaption = await this.replicateClient.waitForCompletion(
        prediction.id,
        30000
      )
      
      this.currentPredictionId = null
      
      // Call OpenAI API for variants with abort signal
      const styles = getAllStyles()
      const variants = await this.openaiClient.rewriteCaption({
        baseCaption,
        styles,
        maxLength: 100
      }, this.abortController.signal)
      
      // Calculate generation time
      const generationTime = Date.now() - startTime
      
      // Create result
      const result: GenerationResult = {
        baseCaption,
        variants,
        generationTime
      }
      
      // Cache result
      this.cache.set(imageHash, result)
      
      // Clean up abort controller
      this.abortController = null
      
      return result
      
    } catch (error) {
      this.currentPredictionId = null
      this.abortController = null
      
      // Re-throw with user-friendly messages
      if (error instanceof ReplicateError || error instanceof OpenAIError) {
        throw error
      }
      
      // Check if it was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Caption generation was canceled.')
      }
      
      throw new Error('Caption generation failed. Please try again.')
    }
  }

  /**
   * Regenerate captions for an image (bypass cache)
   * Requirements: 6.1, 6.3, 6.4
   */
  async regenerate(imageDataUrl: string): Promise<GenerationResult> {
    const startTime = Date.now()
    
    // Validate image format - Requirements: 4.4
    this.validateImageDataUrl(imageDataUrl)
    
    // Create abort controller for this regeneration
    this.abortController = new AbortController()
    
    try {
      // Call Replicate BLIP API (bypass cache)
      const prediction = await this.replicateClient.createPrediction(imageDataUrl)
      this.currentPredictionId = prediction.id
      
      // Wait for base caption
      const baseCaption = await this.replicateClient.waitForCompletion(
        prediction.id,
        30000
      )
      
      this.currentPredictionId = null
      
      // Call OpenAI API for new variants with abort signal
      const styles = getAllStyles()
      const variants = await this.openaiClient.rewriteCaption({
        baseCaption,
        styles,
        maxLength: 100
      }, this.abortController.signal)
      
      // Calculate generation time
      const generationTime = Date.now() - startTime
      
      // Create result (don't cache regenerated results)
      const result: GenerationResult = {
        baseCaption,
        variants,
        generationTime
      }
      
      // Clean up abort controller
      this.abortController = null
      
      return result
      
    } catch (error) {
      this.currentPredictionId = null
      this.abortController = null
      
      // Re-throw with user-friendly messages
      if (error instanceof ReplicateError || error instanceof OpenAIError) {
        throw error
      }
      
      // Check if it was aborted
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Caption generation was canceled.')
      }
      
      throw new Error('Caption regeneration failed. Please try again.')
    }
  }

  /**
   * Abort pending caption generation
   * Requirements: 3.5
   */
  abort(): void {
    // Cancel pending Replicate prediction
    if (this.currentPredictionId) {
      this.replicateClient.cancelPrediction(this.currentPredictionId)
        .catch(err => console.warn('Failed to cancel Replicate prediction:', err))
      this.currentPredictionId = null
    }
    
    // Cancel pending OpenAI request using AbortController
    if (this.abortController) {
      this.abortController.abort()
      this.abortController = null
    }
  }

  /**
   * Get estimated wait time for rate limiting
   * Requirements: 4.3
   */
  getWaitTime(): number {
    return this.rateLimiter.getWaitTime()
  }

  /**
   * Get current queue size for rate limiting
   * Requirements: 4.3
   */
  getQueueSize(): number {
    return this.rateLimiter.getQueueSize()
  }

  /**
   * Prefetch captions for an image in the background
   * Requirements: 3.1, 3.2, 3.3
   * 
   * Starts generation before user explicitly requests it.
   * Result is cached for instant display when requested.
   */
  async prefetch(imageDataUrl: string): Promise<void> {
    try {
      // Validate image format - Requirements: 4.4
      this.validateImageDataUrl(imageDataUrl)
      
      // Hash image for cache key
      const imageHash = await hashImage(imageDataUrl)
      
      // Check if already cached or in flight
      if (this.cache.has(imageHash) || this.inFlightRequests.has(imageHash)) {
        return
      }
      
      // Check if already prefetching
      if (this.prefetchPromises.has(imageHash)) {
        return
      }
      
      // Start prefetch in background
      const prefetchPromise = this.rateLimiter.enqueue(() => 
        this.performGeneration(imageDataUrl, imageHash)
      )
      
      this.prefetchPromises.set(imageHash, prefetchPromise)
      
      // Wait for completion and clean up
      try {
        await prefetchPromise
      } finally {
        this.prefetchPromises.delete(imageHash)
      }
    } catch (error) {
      // Silently fail prefetch - user can still request explicitly
      console.debug('Prefetch failed:', error)
    }
  }

  /**
   * Check if captions are ready (cached or prefetched)
   * Requirements: 3.1, 3.2, 3.3
   */
  async isReady(imageDataUrl: string): Promise<boolean> {
    try {
      const imageHash = await hashImage(imageDataUrl)
      return this.cache.has(imageHash)
    } catch {
      return false
    }
  }
}
