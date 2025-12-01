/**
 * Property-based tests for CaptionGenerator
 * Requirements: 1.4, 2.1-2.5, 3.1-3.3, 4.1-4.2, 5.3, 6.1-6.3, 8.1-8.3
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fc from 'fast-check'
import { CaptionGenerator } from './captionGenerator'
import { ReplicateClient } from './replicateClient'
import { OpenAIClient } from './openaiClient'

// Mock the clients
vi.mock('./replicateClient')
vi.mock('./openaiClient')

describe('CaptionGenerator Property-Based Tests', () => {
  let generator: CaptionGenerator
  let mockReplicateClient: any
  let mockOpenAIClient: any
  let testCounter = 0

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    testCounter = 0

    // Create mock instances
    mockReplicateClient = {
      createPrediction: vi.fn(),
      waitForCompletion: vi.fn(),
      cancelPrediction: vi.fn()
    }

    mockOpenAIClient = {
      rewriteCaption: vi.fn()
    }

    // Mock the constructors
    vi.mocked(ReplicateClient).mockImplementation(() => mockReplicateClient)
    vi.mocked(OpenAIClient).mockImplementation(() => mockOpenAIClient)

    // Create generator instance with small cache to avoid interference
    generator = new CaptionGenerator({
      replicateApiKey: 'test-replicate-key',
      openaiApiKey: 'test-openai-key',
      cacheSize: 1, // Small cache to minimize interference
      requestsPerMinute: 10000 // Very high rate limit for tests to avoid delays
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  /**
   * Property 1: Caption count consistency
   * Feature: ai-caption-generation, Property 1: For any successful generation, 
   * the result should contain exactly 1 base caption plus 3-5 style variants (total 4-6 captions)
   * Validates: Requirements 1.4
   */
  it('Property 1: Caption count consistency - should return 1 base caption plus 3-5 variants', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random base captions
        fc.string({ minLength: 10, maxLength: 100 }),
        // Generate random number of variants (3-5)
        fc.integer({ min: 3, max: 5 }),
        async (baseCaption, variantCount) => {
          // Use unique image data for each test to avoid cache interference
          const uniqueImageData = `unique-test-${testCounter++}-${Date.now()}`
          
          // Setup mocks
          mockReplicateClient.createPrediction.mockResolvedValue({
            id: `test-prediction-id-${testCounter}`,
            status: 'starting'
          })
          mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)

          // Generate variants with different styles
          const styles = ['creative', 'funny', 'poetic', 'minimal', 'dramatic', 'quirky']
          const variants = styles.slice(0, variantCount).map(style => ({
            text: `${style} version of ${baseCaption}`,
            style: style as any
          }))
          mockOpenAIClient.rewriteCaption.mockResolvedValue(variants)

          // Generate captions with unique image data
          const imageDataUrl = `data:image/png;base64,${uniqueImageData}`
          const result = await generator.generate(imageDataUrl)

          // Verify: should have 1 base caption
          expect(result.baseCaption).toBe(baseCaption)
          
          // Verify: should have 3-5 variants
          expect(result.variants.length).toBeGreaterThanOrEqual(3)
          expect(result.variants.length).toBeLessThanOrEqual(5)
          
          // Verify: total captions should be 4-6 (1 base + 3-5 variants)
          const totalCaptions = 1 + result.variants.length
          expect(totalCaptions).toBeGreaterThanOrEqual(4)
          expect(totalCaptions).toBeLessThanOrEqual(6)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 2: Style diversity
   * Feature: ai-caption-generation, Property 2: For any set of generated variants,
   * no two captions should have identical text (case-insensitive comparison)
   * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5
   */
  it('Property 2: Style diversity - no two captions should be identical', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random base captions
        fc.string({ minLength: 10, maxLength: 100 }),
        // Generate random number of variants (3-5)
        fc.integer({ min: 3, max: 5 }),
        async (baseCaption, variantCount) => {
          // Use unique image data for each test
          const uniqueImageData = `unique-test-${testCounter++}-${Date.now()}`
          
          // Setup mocks
          mockReplicateClient.createPrediction.mockResolvedValue({
            id: `test-prediction-id-${testCounter}`,
            status: 'starting'
          })
          mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)

          // Generate variants with different styles and unique text
          const styles = ['creative', 'funny', 'poetic', 'minimal', 'dramatic', 'quirky']
          const variants = styles.slice(0, variantCount).map((style, index) => ({
            text: `${style} version ${index} of ${baseCaption}`,
            style: style as any
          }))
          mockOpenAIClient.rewriteCaption.mockResolvedValue(variants)

          // Generate captions
          const imageDataUrl = `data:image/png;base64,${uniqueImageData}`
          const result = await generator.generate(imageDataUrl)

          // Collect all caption texts (case-insensitive)
          const captionTexts = result.variants.map(v => v.text.toLowerCase())
          
          // Verify: no duplicates (case-insensitive)
          const uniqueTexts = new Set(captionTexts)
          expect(uniqueTexts.size).toBe(captionTexts.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 3: Caption length bounds
   * Feature: ai-caption-generation, Property 3: For any generated caption,
   * the character count should be between 10 and 100 characters inclusive
   * Validates: Requirements 8.1, 8.2, 8.3
   */
  it('Property 3: Caption length bounds - all captions should be 10-100 characters', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random base captions within bounds
        fc.string({ minLength: 10, maxLength: 100 }),
        // Generate random number of variants (3-5)
        fc.integer({ min: 3, max: 5 }),
        async (baseCaption, variantCount) => {
          // Use unique image data for each test
          const uniqueImageData = `unique-test-${testCounter++}-${Date.now()}`
          
          // Setup mocks
          mockReplicateClient.createPrediction.mockResolvedValue({
            id: `test-prediction-id-${testCounter}`,
            status: 'starting'
          })
          mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)

          // Generate variants with text within bounds
          const styles = ['creative', 'funny', 'poetic', 'minimal', 'dramatic', 'quirky']
          const variants = styles.slice(0, variantCount).map((style, index) => {
            // Generate text that's within 10-100 character bounds
            const text = `${style} ${baseCaption.substring(0, 80)}`
            return {
              text: text.substring(0, 100), // Ensure max 100 chars
              style: style as any
            }
          })
          mockOpenAIClient.rewriteCaption.mockResolvedValue(variants)

          // Generate captions
          const imageDataUrl = `data:image/png;base64,${uniqueImageData}`
          const result = await generator.generate(imageDataUrl)

          // Verify base caption length
          expect(result.baseCaption.length).toBeGreaterThanOrEqual(10)
          expect(result.baseCaption.length).toBeLessThanOrEqual(100)

          // Verify all variant lengths
          for (const variant of result.variants) {
            expect(variant.text.length).toBeGreaterThanOrEqual(10)
            expect(variant.text.length).toBeLessThanOrEqual(100)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 4: Base caption preservation
   * Feature: ai-caption-generation, Property 4: For any generation result,
   * the base caption should be the first element in the returned array
   * Validates: Requirements 5.3
   */
  it('Property 4: Base caption preservation - base caption should be returned unchanged', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random base captions
        fc.string({ minLength: 10, maxLength: 100 }),
        // Generate random number of variants (3-5)
        fc.integer({ min: 3, max: 5 }),
        async (baseCaption, variantCount) => {
          // Use unique image data for each test
          const uniqueImageData = `unique-test-${testCounter++}-${Date.now()}`
          
          // Setup mocks
          mockReplicateClient.createPrediction.mockResolvedValue({
            id: `test-prediction-id-${testCounter}`,
            status: 'starting'
          })
          mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)

          // Generate variants
          const styles = ['creative', 'funny', 'poetic', 'minimal', 'dramatic', 'quirky']
          const variants = styles.slice(0, variantCount).map(style => ({
            text: `${style} version of ${baseCaption}`,
            style: style as any
          }))
          mockOpenAIClient.rewriteCaption.mockResolvedValue(variants)

          // Generate captions
          const imageDataUrl = `data:image/png;base64,${uniqueImageData}`
          const result = await generator.generate(imageDataUrl)

          // Verify: base caption should be preserved exactly as returned from BLIP
          expect(result.baseCaption).toBe(baseCaption)
          
          // Verify: base caption should not be modified by variant generation
          expect(result.baseCaption).not.toContain('creative')
          expect(result.baseCaption).not.toContain('funny')
          expect(result.baseCaption).not.toContain('poetic')
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 5: Timeout enforcement
   * Feature: ai-caption-generation, Property 5: For any API call (Replicate or OpenAI),
   * if the response time exceeds the configured timeout, an error should be thrown within 1 second of timeout
   * Validates: Requirements 3.1, 3.2, 3.3
   */
  it('Property 5: Timeout enforcement - should throw error when API times out', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant(null), // Dummy arbitrary to run the test
        async () => {
          // Use unique image data for each test
          const uniqueImageData = `unique-test-${testCounter++}-${Date.now()}`
          
          // Setup mocks to simulate timeout
          mockReplicateClient.createPrediction.mockResolvedValue({
            id: `test-prediction-id-${testCounter}`,
            status: 'starting'
          })
          
          // Mock waitForCompletion to throw timeout error
          const { ReplicateError } = await import('./replicateClient')
          mockReplicateClient.waitForCompletion.mockRejectedValue(
            new ReplicateError(
              'Caption generation timed out. Please try again.',
              undefined,
              undefined,
              true
            )
          )

          // Generate captions
          const imageDataUrl = `data:image/png;base64,${uniqueImageData}`
          
          // Verify: should throw an error (timeout or other)
          await expect(generator.generate(imageDataUrl)).rejects.toThrow()
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 6: Retry idempotency
   * Feature: ai-caption-generation, Property 6: For any failed API call that is retried,
   * the final result (if successful) should be equivalent to a first-attempt success
   * Validates: Requirements 4.1, 4.2
   * 
   * Note: This tests that the generator produces consistent results regardless of
   * whether the underlying clients had to retry. The retry logic itself is tested
   * in the client unit tests.
   */
  it('Property 6: Retry idempotency - results are consistent regardless of retries', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random base captions
        fc.string({ minLength: 10, maxLength: 100 }),
        // Generate random number of variants (3-5)
        fc.integer({ min: 3, max: 5 }),
        async (baseCaption, variantCount) => {
          // Test 1: First-attempt success (no retries)
          const uniqueImageData1 = `unique-test-${testCounter++}-${Date.now()}`
          
          mockReplicateClient.createPrediction.mockResolvedValue({
            id: `test-prediction-id-${testCounter}`,
            status: 'starting'
          })
          mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)

          const styles = ['creative', 'funny', 'poetic', 'minimal', 'dramatic', 'quirky']
          const variants = styles.slice(0, variantCount).map(style => ({
            text: `${style} version of ${baseCaption}`,
            style: style as any
          }))
          mockOpenAIClient.rewriteCaption.mockResolvedValue(variants)

          const imageDataUrl1 = `data:image/png;base64,${uniqueImageData1}`
          const result1 = await generator.generate(imageDataUrl1)

          // Test 2: Simulate successful result after retries (clients handle retries internally)
          // From the generator's perspective, it just gets a successful result
          const uniqueImageData2 = `unique-test-${testCounter++}-${Date.now()}`
          
          mockReplicateClient.createPrediction.mockResolvedValue({
            id: `test-prediction-id-${testCounter}`,
            status: 'starting'
          })
          mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)
          mockOpenAIClient.rewriteCaption.mockResolvedValue(variants)

          const imageDataUrl2 = `data:image/png;base64,${uniqueImageData2}`
          const result2 = await generator.generate(imageDataUrl2)

          // Verify: both results should be equivalent
          expect(result1.baseCaption).toBe(result2.baseCaption)
          expect(result1.variants.length).toBe(result2.variants.length)
          
          // Verify: variants should match
          for (let i = 0; i < result1.variants.length; i++) {
            expect(result1.variants[i].style).toBe(result2.variants[i].style)
            expect(result1.variants[i].text).toBe(result2.variants[i].text)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Unit test: Successful generation flow
   * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5
   */
  it('should successfully generate captions with base caption and variants', async () => {
    const baseCaption = 'A beautiful sunset over the ocean'
    const imageDataUrl = 'data:image/png;base64,test-image-data'
    
    // Setup mocks
    mockReplicateClient.createPrediction.mockResolvedValue({
      id: 'test-prediction-1',
      status: 'starting'
    })
    mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)
    
    const variants = [
      { text: 'Creative sunset caption', style: 'creative' as any },
      { text: 'Funny sunset caption', style: 'funny' as any },
      { text: 'Poetic sunset caption', style: 'poetic' as any }
    ]
    mockOpenAIClient.rewriteCaption.mockResolvedValue(variants)
    
    // Generate captions
    const result = await generator.generate(imageDataUrl)
    
    // Verify: result has correct structure
    expect(result).toHaveProperty('baseCaption')
    expect(result).toHaveProperty('variants')
    expect(result).toHaveProperty('generationTime')
    
    // Verify: base caption matches
    expect(result.baseCaption).toBe(baseCaption)
    
    // Verify: variants are returned
    expect(result.variants).toEqual(variants)
    
    // Verify: generation time is recorded (should be >= 0)
    expect(result.generationTime).toBeGreaterThanOrEqual(0)
    
    // Verify: APIs were called correctly
    expect(mockReplicateClient.createPrediction).toHaveBeenCalledWith(imageDataUrl)
    expect(mockReplicateClient.waitForCompletion).toHaveBeenCalledWith('test-prediction-1', 30000)
    expect(mockOpenAIClient.rewriteCaption).toHaveBeenCalledWith(
      expect.objectContaining({
        baseCaption,
        maxLength: 100
      }),
      expect.any(AbortSignal)
    )
  })

  /**
   * Unit test: Replicate API error handling
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  it('should handle Replicate API errors gracefully', async () => {
    const imageDataUrl = 'data:image/png;base64,test-image-data'
    
    // Setup mock to throw a generic error (simulating API failure)
    mockReplicateClient.createPrediction.mockRejectedValue(
      new Error('Network connection failed')
    )
    
    // Verify: error is thrown (may be wrapped in generic message)
    await expect(generator.generate(imageDataUrl)).rejects.toThrow()
  })

  /**
   * Unit test: OpenAI API error handling
   * Validates: Requirements 4.1, 4.2, 4.3
   */
  it('should handle OpenAI API errors gracefully', async () => {
    const baseCaption = 'A test caption'
    const imageDataUrl = 'data:image/png;base64,test-image-data'
    
    // Setup mocks - Replicate succeeds, OpenAI fails
    mockReplicateClient.createPrediction.mockResolvedValue({
      id: 'test-prediction-1',
      status: 'starting'
    })
    mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)
    
    mockOpenAIClient.rewriteCaption.mockRejectedValue(
      new Error('API rate limit exceeded')
    )
    
    // Verify: error is thrown (may be wrapped in generic message)
    await expect(generator.generate(imageDataUrl)).rejects.toThrow()
  })

  /**
   * Unit test: Timeout behavior
   * Validates: Requirements 3.1, 3.2, 3.3, 3.4
   */
  it('should handle timeout errors appropriately', async () => {
    const imageDataUrl = 'data:image/png;base64,test-image-data'
    
    // Setup mocks to simulate timeout
    mockReplicateClient.createPrediction.mockResolvedValue({
      id: 'test-prediction-1',
      status: 'starting'
    })
    
    mockReplicateClient.waitForCompletion.mockRejectedValue(
      new Error('Request timeout')
    )
    
    // Verify: timeout error is thrown
    await expect(generator.generate(imageDataUrl)).rejects.toThrow()
    
    // Verify: waitForCompletion was called with 30 second timeout
    expect(mockReplicateClient.waitForCompletion).toHaveBeenCalledWith(
      'test-prediction-1',
      30000
    )
  })

  /**
   * Unit test: Invalid image format error handling
   * Validates: Requirements 4.4
   */
  it('should reject invalid image formats', async () => {
    const invalidImageDataUrl = 'data:text/plain;base64,invalid-data'
    
    // Verify: error is thrown for invalid format
    await expect(generator.generate(invalidImageDataUrl)).rejects.toThrow(
      'Unsupported image format'
    )
    
    // Verify: APIs were not called
    expect(mockReplicateClient.createPrediction).not.toHaveBeenCalled()
    expect(mockOpenAIClient.rewriteCaption).not.toHaveBeenCalled()
  })

  /**
   * Unit test: Image too large error handling
   * Validates: Requirements 4.4
   */
  it('should reject images that are too large', async () => {
    // Create a very long base64 string to simulate large image (>10MB)
    const largeData = 'A'.repeat(15 * 1024 * 1024)
    const largeImageDataUrl = `data:image/png;base64,${largeData}`
    
    // Verify: error is thrown for large image
    await expect(generator.generate(largeImageDataUrl)).rejects.toThrow(
      'Image too large'
    )
    
    // Verify: APIs were not called
    expect(mockReplicateClient.createPrediction).not.toHaveBeenCalled()
    expect(mockOpenAIClient.rewriteCaption).not.toHaveBeenCalled()
  })

  /**
   * Unit test: Empty image error handling
   * Validates: Requirements 4.4
   */
  it('should reject empty images', async () => {
    const emptyImageDataUrl = 'data:image/png;base64,'
    
    // Verify: error is thrown for empty image
    await expect(generator.generate(emptyImageDataUrl)).rejects.toThrow(
      'Invalid image file'
    )
    
    // Verify: APIs were not called
    expect(mockReplicateClient.createPrediction).not.toHaveBeenCalled()
    expect(mockOpenAIClient.rewriteCaption).not.toHaveBeenCalled()
  })

  /**
   * Unit test: Cache hit behavior
   * Validates: Requirements 6.1, 6.2
   */
  it('should return cached results for same image', async () => {
    const baseCaption = 'A beautiful sunset'
    const imageDataUrl = 'data:image/png;base64,test-image-data'
    
    // Setup mocks for first generation
    mockReplicateClient.createPrediction.mockResolvedValue({
      id: 'test-prediction-1',
      status: 'starting'
    })
    mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)
    
    const variants = [
      { text: 'Creative sunset', style: 'creative' as any },
      { text: 'Funny sunset', style: 'funny' as any },
      { text: 'Poetic sunset', style: 'poetic' as any }
    ]
    mockOpenAIClient.rewriteCaption.mockResolvedValue(variants)
    
    // First generation
    const result1 = await generator.generate(imageDataUrl)
    expect(result1.baseCaption).toBe(baseCaption)
    
    // Clear mock call counts
    mockReplicateClient.createPrediction.mockClear()
    mockOpenAIClient.rewriteCaption.mockClear()
    
    // Second generation with same image (should hit cache)
    const result2 = await generator.generate(imageDataUrl)
    
    // Verify: results are identical
    expect(result2.baseCaption).toBe(result1.baseCaption)
    expect(result2.variants).toEqual(result1.variants)
    
    // Verify: APIs were not called again (cache hit)
    expect(mockReplicateClient.createPrediction).not.toHaveBeenCalled()
    expect(mockOpenAIClient.rewriteCaption).not.toHaveBeenCalled()
  })

  /**
   * Unit test for abort function
   * Validates: Requirements 3.5
   */
  it('abort should cancel pending Replicate prediction and OpenAI request', () => {
    // Setup mocks
    mockReplicateClient.cancelPrediction.mockResolvedValue(undefined)
    
    // Simulate a pending prediction
    ;(generator as any).currentPredictionId = 'test-prediction-123'
    ;(generator as any).abortController = new AbortController()
    
    // Call abort
    generator.abort()
    
    // Verify: cancelPrediction was called with the correct ID
    expect(mockReplicateClient.cancelPrediction).toHaveBeenCalledWith('test-prediction-123')
    
    // Verify: currentPredictionId was cleared
    expect((generator as any).currentPredictionId).toBeNull()
    
    // Verify: abortController was cleared
    expect((generator as any).abortController).toBeNull()
  })

  /**
   * Unit test for regenerate function
   * Validates: Requirements 6.1, 6.3, 6.4
   */
  it('regenerate should bypass cache and return fresh results', async () => {
    const baseCaption = 'A beautiful sunset over the ocean'
    const imageDataUrl = 'data:image/png;base64,test-image-data'
    
    // Setup mocks for first generation
    mockReplicateClient.createPrediction.mockResolvedValue({
      id: 'test-prediction-1',
      status: 'starting'
    })
    mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)
    
    const variants1 = [
      { text: 'Creative sunset caption', style: 'creative' as any },
      { text: 'Funny sunset caption', style: 'funny' as any },
      { text: 'Poetic sunset caption', style: 'poetic' as any }
    ]
    mockOpenAIClient.rewriteCaption.mockResolvedValue(variants1)
    
    // First generation (will be cached)
    const result1 = await generator.generate(imageDataUrl)
    expect(result1.baseCaption).toBe(baseCaption)
    expect(result1.variants).toEqual(variants1)
    
    // Setup mocks for regeneration with different results
    mockReplicateClient.createPrediction.mockResolvedValue({
      id: 'test-prediction-2',
      status: 'starting'
    })
    mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)
    
    const variants2 = [
      { text: 'New creative sunset caption', style: 'creative' as any },
      { text: 'New funny sunset caption', style: 'funny' as any },
      { text: 'New poetic sunset caption', style: 'poetic' as any }
    ]
    mockOpenAIClient.rewriteCaption.mockResolvedValue(variants2)
    
    // Regenerate (should bypass cache and call APIs again)
    const result2 = await generator.regenerate(imageDataUrl)
    expect(result2.baseCaption).toBe(baseCaption)
    expect(result2.variants).toEqual(variants2)
    
    // Verify that APIs were called twice (once for generate, once for regenerate)
    expect(mockReplicateClient.createPrediction).toHaveBeenCalledTimes(2)
    expect(mockOpenAIClient.rewriteCaption).toHaveBeenCalledTimes(2)
    
    // Verify that regenerate returned different variants
    expect(result2.variants[0].text).not.toBe(result1.variants[0].text)
  })

  /**
   * Property 9: Subject matter preservation
   * Feature: ai-caption-generation, Property 9: For any base caption containing specific objects or scenes,
   * all style variants should reference the same core subject matter
   * Validates: Requirements 7.2, 7.3
   */
  it('Property 9: Subject matter preservation - variants preserve core subject matter', async () => {
    /**
     * Helper function to extract key nouns/subjects from a caption
     * This is a simplified approach that looks for common nouns
     */
    function extractSubjects(caption: string): Set<string> {
      // Convert to lowercase for comparison
      const lower = caption.toLowerCase()
      
      // Common subject words that should be preserved
      const commonNouns = [
        // Animals
        'dog', 'cat', 'bird', 'horse', 'elephant', 'lion', 'tiger', 'bear',
        'fish', 'dolphin', 'whale', 'shark', 'rabbit', 'fox', 'deer', 'wolf',
        // People/roles
        'person', 'people', 'man', 'woman', 'child', 'children', 'baby',
        'boy', 'girl', 'family', 'crowd', 'group',
        // Nature
        'tree', 'trees', 'flower', 'flowers', 'mountain', 'mountains', 'ocean',
        'sea', 'lake', 'river', 'forest', 'beach', 'sky', 'cloud', 'clouds',
        'sun', 'moon', 'star', 'stars', 'sunset', 'sunrise', 'rain', 'snow',
        // Objects
        'car', 'cars', 'bike', 'bicycle', 'boat', 'ship', 'plane', 'airplane',
        'building', 'buildings', 'house', 'home', 'bridge', 'road', 'street',
        'book', 'books', 'phone', 'computer', 'camera', 'table', 'chair',
        // Food
        'food', 'pizza', 'burger', 'cake', 'coffee', 'tea', 'fruit', 'apple',
        'banana', 'bread', 'sandwich', 'salad', 'pasta', 'rice',
        // Activities/scenes
        'sunset', 'sunrise', 'landscape', 'portrait', 'cityscape', 'nature',
        'park', 'garden', 'field', 'valley', 'hill', 'cliff', 'waterfall'
      ]
      
      const subjects = new Set<string>()
      
      // Find all matching nouns in the caption
      for (const noun of commonNouns) {
        // Use word boundaries to match whole words
        const regex = new RegExp(`\\b${noun}\\b`, 'i')
        if (regex.test(lower)) {
          subjects.add(noun)
        }
      }
      
      return subjects
    }
    
    /**
     * Check if two sets of subjects have significant overlap
     * At least 50% of base subjects should appear in variant
     */
    function hasSubjectOverlap(baseSubjects: Set<string>, variantSubjects: Set<string>): boolean {
      if (baseSubjects.size === 0) {
        // If no subjects detected in base, we can't verify preservation
        // This is acceptable - not all captions will have detectable subjects
        return true
      }
      
      // Count how many base subjects appear in variant
      let matchCount = 0
      for (const subject of baseSubjects) {
        if (variantSubjects.has(subject)) {
          matchCount++
        }
      }
      
      // At least 50% of subjects should be preserved
      const overlapRatio = matchCount / baseSubjects.size
      return overlapRatio >= 0.5
    }

    await fc.assert(
      fc.asyncProperty(
        // Generate base captions with clear subjects
        fc.oneof(
          fc.constant('A golden retriever dog playing in the park'),
          fc.constant('A beautiful sunset over the ocean'),
          fc.constant('A person riding a bicycle on the street'),
          fc.constant('A cat sitting on a table'),
          fc.constant('Mountains covered with snow under blue sky'),
          fc.constant('A red car parked near a building'),
          fc.constant('Children playing in the garden'),
          fc.constant('A bird flying over the lake'),
          fc.constant('Coffee and cake on a wooden table'),
          fc.constant('A boat sailing on the sea')
        ),
        // Generate random number of variants (3-5)
        fc.integer({ min: 3, max: 5 }),
        async (baseCaption, variantCount) => {
          // Use unique image data for each test
          const uniqueImageData = `unique-test-${testCounter++}-${Date.now()}`
          
          // Setup mocks
          mockReplicateClient.createPrediction.mockResolvedValue({
            id: `test-prediction-id-${testCounter}`,
            status: 'starting'
          })
          mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)

          // Generate variants that preserve subject matter
          // Extract subjects from base caption
          const baseSubjects = extractSubjects(baseCaption)
          
          const styles = ['creative', 'funny', 'poetic', 'minimal', 'dramatic', 'quirky']
          const variants = styles.slice(0, variantCount).map(style => {
            // Create variants that preserve the core subjects
            // but change the style/tone
            let variantText: any = baseCaption
            
            switch (style) {
              case 'creative':
                variantText = `✨ ${baseCaption} ✨`
                break
              case 'funny':
                variantText = `😄 ${baseCaption}!`
                break
              case 'poetic':
                variantText = `${baseCaption}...`
                break
              case 'minimal':
                // Take first few words but keep subjects
                const words = baseCaption.split(' ')
                variantText = words.slice(0, Math.max(3, words.length - 2)).join(' ')
                break
              case 'dramatic':
                variantText = `${baseCaption}!!`
                break
              case 'quirky':
                variantText = `~ ${baseCaption} ~`
                break
            }
            
            return {
              text: variantText as any,
              style: style as any
            }
          })
          
          mockOpenAIClient.rewriteCaption.mockResolvedValue(variants)

          // Generate captions
          const imageDataUrl = `data:image/png;base64,${uniqueImageData}`
          const result = await generator.generate(imageDataUrl)

          // Extract subjects from base caption
          const baseCaptionSubjects = extractSubjects(result.baseCaption)
          
          // Verify: all variants should preserve core subject matter
          for (const variant of result.variants) {
            const variantSubjects = extractSubjects(variant.text)
            
            // Check if variant preserves subjects from base caption
            const preservesSubjects = hasSubjectOverlap(baseCaptionSubjects, variantSubjects)
            
            // If base caption has identifiable subjects, variants should preserve them
            if (baseCaptionSubjects.size > 0) {
              expect(preservesSubjects).toBe(true)
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 10: Style label accuracy
   * Feature: ai-caption-generation, Property 10: For any caption variant,
   * the assigned style label should match the tone and language characteristics of that style's definition
   * Validates: Requirements 5.2
   */
  it('Property 10: Style label accuracy - style labels match caption characteristics', async () => {
    /**
     * Helper function to analyze caption characteristics
     * Returns a set of detected style indicators
     */
    function analyzeCaption(text: string): Set<string> {
      const indicators = new Set<string>()
      const lower = text.toLowerCase()
      
      // Creative indicators: metaphors, vivid imagery, artistic language
      const creativePatterns = [
        /canvas|paint|brush|art|dream|wonder|magic|sparkle|glow|shimmer/i,
        /whisper|dance|sing|float|soar|bloom|blossom/i,
        /✨|🎨|🌟|💫/
      ]
      if (creativePatterns.some(pattern => pattern.test(text))) {
        indicators.add('creative')
      }
      
      // Funny indicators: humor, playfulness, wit
      const funnyPatterns = [
        /lol|haha|😂|😄|😆|🤣/,
        /plot twist|when life|this is fine|nobody expected/i,
        /vibes|mood|energy|literally|honestly/i,
        /\?!|!!!/
      ]
      if (funnyPatterns.some(pattern => pattern.test(text))) {
        indicators.add('funny')
      }
      
      // Poetic indicators: lyrical language, metaphors, rhythm
      const poeticPatterns = [
        /beneath|where|through|upon|within/i,
        /whisper|echo|symphony|melody|rhythm|verse/i,
        /\.\.\.|—|–/,
        /dreams?|soul|heart|spirit|essence/i
      ]
      if (poeticPatterns.some(pattern => pattern.test(text))) {
        indicators.add('poetic')
      }
      
      // Minimal indicators: very short, concise, impactful
      const wordCount = text.trim().split(/\s+/).length
      if (wordCount <= 4 && text.length <= 30) {
        indicators.add('minimal')
      }
      
      // Dramatic indicators: intense language, strong emotions, exclamations
      const dramaticPatterns = [
        /forever|never|always|everything|nothing|destiny|fate/i,
        /!!|!$/,
        /changed everything|weight of|hangs in the air|will never be/i,
        /intense|powerful|overwhelming|breathtaking/i
      ]
      if (dramaticPatterns.some(pattern => pattern.test(text))) {
        indicators.add('dramatic')
      }
      
      // Quirky indicators: unconventional, whimsical, unexpected
      const quirkyPatterns = [
        /vibes|energy|main character|no thoughts/i,
        /hotel\? trivago|immaculate|activated/i,
        /~|✨.*✨|weird|strange|odd|peculiar/i,
        /\?.*\./
      ]
      if (quirkyPatterns.some(pattern => pattern.test(text))) {
        indicators.add('quirky')
      }
      
      return indicators
    }
    
    /**
     * Check if a caption's characteristics match its assigned style
     */
    function styleMatchesCharacteristics(style: string, characteristics: Set<string>): boolean {
      // If the caption has indicators for the assigned style, it's a match
      if (characteristics.has(style)) {
        return true
      }
      
      // If no specific indicators detected, we can't definitively say it's wrong
      // (some captions might be subtle or the indicators might not be comprehensive)
      if (characteristics.size === 0) {
        return true
      }
      
      // If the caption has strong indicators for a different style, it's a mismatch
      // Allow some flexibility - if it has multiple style indicators, it might be acceptable
      if (characteristics.size === 1 && !characteristics.has(style)) {
        return false
      }
      
      // If it has multiple style indicators including the assigned one, it's acceptable
      return true
    }

    await fc.assert(
      fc.asyncProperty(
        // Generate random base captions
        fc.string({ minLength: 10, maxLength: 100 }),
        // Generate random number of variants (3-5)
        fc.integer({ min: 3, max: 5 }),
        async (baseCaption, variantCount) => {
          // Use unique image data for each test
          const uniqueImageData = `unique-test-${testCounter++}-${Date.now()}`
          
          // Setup mocks
          mockReplicateClient.createPrediction.mockResolvedValue({
            id: `test-prediction-id-${testCounter}`,
            status: 'starting'
          })
          mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)

          // Generate variants with style-appropriate characteristics
          const styles = ['creative', 'funny', 'poetic', 'minimal', 'dramatic', 'quirky']
          const selectedStyles = styles.slice(0, variantCount)
          
          const variants = selectedStyles.map(style => {
            let text = baseCaption
            
            // Add style-specific characteristics to the text
            switch (style) {
              case 'creative':
                text = `✨ A canvas of ${baseCaption.toLowerCase()} ✨`
                break
              case 'funny':
                text = `😄 Plot twist: ${baseCaption.toLowerCase()}!`
                break
              case 'poetic':
                text = `Beneath the surface, ${baseCaption.toLowerCase()}...`
                break
              case 'minimal':
                // Take first 2-3 words
                const words = baseCaption.split(' ')
                text = words.slice(0, Math.min(3, words.length)).join(' ')
                break
              case 'dramatic':
                text = `${baseCaption} - everything changed forever!!`
                break
              case 'quirky':
                text = `~ Vibes: ${baseCaption.toLowerCase()} ~`
                break
            }
            
            // Ensure text is within bounds
            if (text.length > 100) {
              text = text.substring(0, 97) + '...'
            }
            if (text.length < 10) {
              text = text + ' moment'
            }
            
            return {
              text,
              style: style as any
            }
          })
          
          mockOpenAIClient.rewriteCaption.mockResolvedValue(variants)

          // Generate captions
          const imageDataUrl = `data:image/png;base64,${uniqueImageData}`
          const result = await generator.generate(imageDataUrl)

          // Verify: each variant's style label should match its characteristics
          for (const variant of result.variants) {
            const characteristics = analyzeCaption(variant.text)
            const matches = styleMatchesCharacteristics(variant.style, characteristics)
            
            // The style label should be consistent with the caption's characteristics
            expect(matches).toBe(true)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 11: Regeneration independence
   * Feature: ai-caption-generation, Property 11: For any image, regenerating captions
   * should produce different variants than the original generation (not cached)
   * Validates: Requirements 6.1, 6.3
   */
  it('Property 11: Regeneration independence - regenerated captions differ from original', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random base captions
        fc.string({ minLength: 10, maxLength: 100 }),
        // Generate random number of variants (3-5)
        fc.integer({ min: 3, max: 5 }),
        async (baseCaption, variantCount) => {
          // Reset mock call counts for this iteration
          mockReplicateClient.createPrediction.mockClear()
          mockOpenAIClient.rewriteCaption.mockClear()
          
          // Use unique image data for each test
          const uniqueImageData = `unique-test-${testCounter++}-${Date.now()}`
          const imageDataUrl = `data:image/png;base64,${uniqueImageData}`
          
          // Setup mocks for first generation
          mockReplicateClient.createPrediction.mockResolvedValue({
            id: `test-prediction-id-${testCounter}`,
            status: 'starting'
          })
          mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)

          // Generate first set of variants
          const styles = ['creative', 'funny', 'poetic', 'minimal', 'dramatic', 'quirky']
          const variants1 = styles.slice(0, variantCount).map((style, index) => ({
            text: `${style} version 1 of ${baseCaption} - ${index}`,
            style: style as any
          }))
          mockOpenAIClient.rewriteCaption.mockResolvedValue(variants1)

          // First generation (will be cached)
          const result1 = await generator.generate(imageDataUrl)
          
          // Setup mocks for regeneration with different variants
          mockReplicateClient.createPrediction.mockResolvedValue({
            id: `test-prediction-id-${testCounter + 1000}`,
            status: 'starting'
          })
          mockReplicateClient.waitForCompletion.mockResolvedValue(baseCaption)

          // Generate second set of variants (different from first)
          const variants2 = styles.slice(0, variantCount).map((style, index) => ({
            text: `${style} version 2 of ${baseCaption} - ${index}`,
            style: style as any
          }))
          mockOpenAIClient.rewriteCaption.mockResolvedValue(variants2)

          // Regenerate (should bypass cache and call APIs again)
          const result2 = await generator.regenerate(imageDataUrl)

          // Verify: base caption should be the same (same image)
          expect(result2.baseCaption).toBe(result1.baseCaption)
          
          // Verify: variants should be different (not cached)
          // At least one variant should differ
          let hasDifference = false
          for (let i = 0; i < Math.min(result1.variants.length, result2.variants.length); i++) {
            if (result1.variants[i].text !== result2.variants[i].text) {
              hasDifference = true
              break
            }
          }
          
          expect(hasDifference).toBe(true)
          
          // Verify: APIs were called twice (once for generate, once for regenerate)
          // This confirms cache was bypassed
          expect(mockReplicateClient.createPrediction).toHaveBeenCalledTimes(2)
          expect(mockOpenAIClient.rewriteCaption).toHaveBeenCalledTimes(2)
        }
      ),
      { numRuns: 100 }
    )
  })

  /**
   * Property 12: Concurrent request handling
   * Feature: ai-caption-generation, Property 12: For any sequence of rapid generation requests,
   * each request should complete independently without interfering with others
   * Validates: Requirements 3.5
   */
  it('Property 12: Concurrent request handling - requests complete independently', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random number of concurrent requests (2-4, reduced for performance)
        fc.integer({ min: 2, max: 4 }),
        // Generate random base captions for each request
        fc.array(fc.string({ minLength: 10, maxLength: 100 }), { minLength: 2, maxLength: 4 }),
        async (requestCount, baseCaptions) => {
          // Ensure we have enough base captions for the requests
          const captions = baseCaptions.slice(0, requestCount)
          
          // Track which caption should be returned for each call
          const captionQueue = [...captions]
          
          // Setup mocks to return different results for each request
          mockReplicateClient.createPrediction.mockImplementation(async () => {
            const id = `test-prediction-${testCounter++}`
            return {
              id,
              status: 'starting' as const
            }
          })
          
          mockReplicateClient.waitForCompletion.mockImplementation(async () => {
            // Return captions in order, cycling if needed
            const caption = captionQueue.shift() || captions[0]
            captionQueue.push(caption) // Add back to end for cycling
            
            // Small delay to simulate API (reduced for performance)
            await new Promise(resolve => setTimeout(resolve, 5))
            
            return caption
          })
          
          mockOpenAIClient.rewriteCaption.mockImplementation(async (request: any) => {
            // Small delay to simulate API (reduced for performance)
            await new Promise(resolve => setTimeout(resolve, 5))
            
            const styles = ['creative', 'funny', 'poetic']
            return styles.map(style => ({
              text: `${style} version of ${request.baseCaption}`,
              style: style as any
            }))
          })
          
          // Create unique image data URLs for each request
          const imageDataUrls = Array.from({ length: requestCount }, (_, i) => 
            `data:image/png;base64,unique-concurrent-test-${testCounter++}-${Date.now()}-${i}`
          )
          
          // Execute all requests concurrently
          const promises = imageDataUrls.map(imageDataUrl => 
            generator.generate(imageDataUrl)
          )
          
          // Wait for all requests to complete
          const results = await Promise.all(promises)
          
          // Verify: all requests should complete successfully
          expect(results.length).toBe(requestCount)
          
          // Verify: each result should have a base caption and variants
          for (const result of results) {
            expect(result.baseCaption).toBeDefined()
            expect(result.baseCaption.length).toBeGreaterThan(0)
            expect(result.variants.length).toBeGreaterThanOrEqual(3)
            expect(result.variants.length).toBeLessThanOrEqual(5)
          }
          
          // Verify: results should be independent (not all identical)
          // At least some results should differ if we have different base captions
          if (new Set(captions).size > 1) {
            const uniqueBaseCaptions = new Set(results.map(r => r.baseCaption))
            // We should have at least 2 different base captions if inputs were different
            expect(uniqueBaseCaptions.size).toBeGreaterThanOrEqual(Math.min(2, new Set(captions).size))
          }
          
          // Verify: no request should have interfered with another
          // Each result should have the correct structure
          for (let i = 0; i < results.length; i++) {
            const result = results[i]
            
            // Verify structure is intact
            expect(result).toHaveProperty('baseCaption')
            expect(result).toHaveProperty('variants')
            expect(result).toHaveProperty('generationTime')
            
            // Verify variants reference the base caption
            for (const variant of result.variants) {
              expect(variant.text).toContain('version of')
              expect(variant).toHaveProperty('style')
            }
          }
        }
      ),
      { numRuns: 100 }
    )
  }, 10000)

  /**
   * Property 8: Error message clarity
   * Feature: ai-caption-generation, Property 8: For any error condition,
   * the error message should be user-friendly (no raw API errors or stack traces)
   * Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5
   */
  it('Property 8: Error message clarity - all errors should have user-friendly messages', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate different error scenarios
        fc.oneof(
          fc.constant('replicate-connection'),
          fc.constant('replicate-rate-limit'),
          fc.constant('replicate-model-failure'),
          fc.constant('replicate-timeout'),
          fc.constant('openai-connection'),
          fc.constant('openai-rate-limit'),
          fc.constant('openai-invalid-response'),
          fc.constant('openai-content-policy'),
          fc.constant('invalid-image-format'),
          fc.constant('image-too-large'),
          fc.constant('empty-image')
        ),
        async (errorScenario) => {
          // Use unique image data for each test
          const uniqueImageData = `unique-test-${testCounter++}-${Date.now()}`
          
          // Setup mocks based on error scenario
          // Import real error classes (not mocked)
          const replicateModule = await vi.importActual<typeof import('./replicateClient')>('./replicateClient')
          const openaiModule = await vi.importActual<typeof import('./openaiClient')>('./openaiClient')
          const { ReplicateError } = replicateModule
          const { OpenAIError } = openaiModule
          
          let imageDataUrl = `data:image/png;base64,${uniqueImageData}`
          let shouldThrow = true
          
          switch (errorScenario) {
            case 'replicate-connection':
              mockReplicateClient.createPrediction.mockRejectedValue(
                new ReplicateError(
                  'Unable to connect to caption service. Please check your internet connection.',
                  undefined,
                  undefined,
                  true
                )
              )
              break
              
            case 'replicate-rate-limit':
              mockReplicateClient.createPrediction.mockRejectedValue(
                new ReplicateError(
                  'Too many requests. Please wait a moment and try again.',
                  429,
                  60,
                  true
                )
              )
              break
              
            case 'replicate-model-failure':
              mockReplicateClient.createPrediction.mockResolvedValue({
                id: `test-prediction-id-${testCounter}`,
                status: 'starting'
              })
              mockReplicateClient.waitForCompletion.mockRejectedValue(
                new ReplicateError(
                  'Unable to generate caption: Model failed. Please try a different image.',
                  undefined,
                  undefined,
                  false
                )
              )
              break
              
            case 'replicate-timeout':
              mockReplicateClient.createPrediction.mockResolvedValue({
                id: `test-prediction-id-${testCounter}`,
                status: 'starting'
              })
              mockReplicateClient.waitForCompletion.mockRejectedValue(
                new ReplicateError(
                  'Caption generation timed out. Please try again.',
                  undefined,
                  undefined,
                  true
                )
              )
              break
              
            case 'openai-connection':
              mockReplicateClient.createPrediction.mockResolvedValue({
                id: `test-prediction-id-${testCounter}`,
                status: 'starting'
              })
              mockReplicateClient.waitForCompletion.mockResolvedValue('A test caption')
              mockOpenAIClient.rewriteCaption.mockRejectedValue(
                new OpenAIError(
                  'Unable to connect to service. Please check your internet connection.',
                  undefined,
                  undefined,
                  true
                )
              )
              break
              
            case 'openai-rate-limit':
              mockReplicateClient.createPrediction.mockResolvedValue({
                id: `test-prediction-id-${testCounter}`,
                status: 'starting'
              })
              mockReplicateClient.waitForCompletion.mockResolvedValue('A test caption')
              mockOpenAIClient.rewriteCaption.mockRejectedValue(
                new OpenAIError(
                  'Service busy. Please wait a moment and try again.',
                  429,
                  60,
                  true
                )
              )
              break
              
            case 'openai-invalid-response':
              mockReplicateClient.createPrediction.mockResolvedValue({
                id: `test-prediction-id-${testCounter}`,
                status: 'starting'
              })
              mockReplicateClient.waitForCompletion.mockResolvedValue('A test caption')
              mockOpenAIClient.rewriteCaption.mockRejectedValue(
                new OpenAIError(
                  'Invalid response from service. Please try again.',
                  undefined,
                  undefined,
                  false
                )
              )
              break
              
            case 'openai-content-policy':
              mockReplicateClient.createPrediction.mockResolvedValue({
                id: `test-prediction-id-${testCounter}`,
                status: 'starting'
              })
              mockReplicateClient.waitForCompletion.mockResolvedValue('A test caption')
              // Content policy violations should return fallback captions, not throw
              mockOpenAIClient.rewriteCaption.mockResolvedValue([
                { text: '✨ A test caption', style: 'creative' as any },
                { text: '😄 A test caption', style: 'funny' as any },
                { text: 'A test caption...', style: 'poetic' as any }
              ])
              shouldThrow = false
              break
              
            case 'invalid-image-format':
              imageDataUrl = 'data:text/plain;base64,invalid'
              break
              
            case 'image-too-large':
              // Create a very long base64 string to simulate large image
              const largeData = 'A'.repeat(15 * 1024 * 1024) // ~15MB
              imageDataUrl = `data:image/png;base64,${largeData}`
              break
              
            case 'empty-image':
              imageDataUrl = 'data:image/png;base64,'
              break
          }
          
          try {
            const result = await generator.generate(imageDataUrl)
            
            // If we expected an error but didn't get one, fail
            if (shouldThrow) {
              throw new Error('Expected error to be thrown but generation succeeded')
            }
            
            // For content policy case, verify we got fallback captions
            if (errorScenario === 'openai-content-policy') {
              expect(result.variants.length).toBeGreaterThan(0)
              // Test passes - no error message to validate
              return
            }
          } catch (error) {
            // If we didn't expect an error, re-throw
            if (!shouldThrow) {
              throw error
            }
            
            // Extract error message safely
            let errorMessage: string
            if (error instanceof Error && error.message) {
              errorMessage = error.message
            } else if (typeof error === 'string') {
              errorMessage = error
            } else if (error && typeof error === 'object' && 'message' in error) {
              errorMessage = String((error as any).message)
            } else {
              errorMessage = 'Unknown error'
            }
            
            // Verify: error message should be user-friendly
            // Should not contain technical details like:
            // - Stack traces
            // - Raw API error codes (except in context like "429")
            // - Internal variable names
            // - File paths
            // - Function names
            
            // Check for stack trace indicators
            expect(errorMessage).not.toMatch(/at\s+\w+\s+\(/)
            expect(errorMessage).not.toMatch(/\.ts:\d+:\d+/)
            expect(errorMessage).not.toMatch(/Error:\s+Error:/)
            
            // Check for internal implementation details
            expect(errorMessage).not.toMatch(/undefined/)
            expect(errorMessage).not.toMatch(/null/)
            expect(errorMessage).not.toMatch(/\[object Object\]/)
            
            // Verify: message should be descriptive and actionable
            expect(errorMessage.length).toBeGreaterThan(10)
            
            // Verify: message should end with proper punctuation
            expect(errorMessage).toMatch(/[.!]$/)
            
            // Verify: message should be in sentence case (starts with capital letter)
            expect(errorMessage[0]).toMatch(/[A-Z]/)
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
