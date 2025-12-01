/**
 * Property-based tests for CaptionCache
 * Requirements: 6.1, 6.2
 */

import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import { CaptionCache } from './captionCache'
import { GenerationResult, CaptionVariant, CaptionStyle } from './types'

/**
 * Arbitrary generator for CaptionStyle
 */
const captionStyleArbitrary = fc.constantFrom<CaptionStyle>(
  'creative',
  'funny',
  'poetic',
  'minimal',
  'dramatic',
  'quirky'
)

/**
 * Arbitrary generator for CaptionVariant
 */
const captionVariantArbitrary = fc.record({
  text: fc.string({ minLength: 10, maxLength: 100 }),
  style: captionStyleArbitrary,
  confidence: fc.option(fc.double({ min: 0, max: 1 }), { nil: undefined })
})

/**
 * Arbitrary generator for GenerationResult
 */
const generationResultArbitrary = fc.record({
  baseCaption: fc.string({ minLength: 10, maxLength: 100 }),
  variants: fc.array(captionVariantArbitrary, { minLength: 3, maxLength: 5 }),
  generationTime: fc.integer({ min: 100, max: 45000 })
})

/**
 * Arbitrary generator for image hash (SHA-256 hex string)
 * Using string generator for simplicity - actual hash format doesn't affect cache logic
 */
const imageHashArbitrary = fc.string({ minLength: 32, maxLength: 64 })

describe('CaptionCache', () => {
  describe('Property 7: Cache hit consistency', () => {
    /**
     * **Feature: ai-caption-generation, Property 7: Cache hit consistency**
     * **Validates: Requirements 6.2**
     * 
     * For any image that has been processed before, if the cache contains a valid entry,
     * the returned result should match the cached result exactly
     */
    it('should return identical results for cache hits', () => {
      fc.assert(
        fc.property(
          imageHashArbitrary,
          generationResultArbitrary,
          (imageHash, result) => {
            // Create a fresh cache for each test
            const cache = new CaptionCache(50, 3600000)
            
            // Store the result in cache
            cache.set(imageHash, result)
            
            // Retrieve the result from cache
            const cachedResult = cache.get(imageHash)
            
            // Verify cache hit returns identical result
            expect(cachedResult).not.toBeNull()
            expect(cachedResult).toEqual(result)
            
            // Verify deep equality of nested structures
            expect(cachedResult?.baseCaption).toBe(result.baseCaption)
            expect(cachedResult?.generationTime).toBe(result.generationTime)
            expect(cachedResult?.variants).toHaveLength(result.variants.length)
            
            // Verify each variant matches
            cachedResult?.variants.forEach((variant, index) => {
              expect(variant.text).toBe(result.variants[index].text)
              expect(variant.style).toBe(result.variants[index].style)
              expect(variant.confidence).toBe(result.variants[index].confidence)
            })
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return null for cache misses', () => {
      fc.assert(
        fc.property(
          imageHashArbitrary,
          (imageHash) => {
            const cache = new CaptionCache(50, 3600000)
            
            // Try to get a result that was never cached
            const result = cache.get(imageHash)
            
            // Verify cache miss returns null
            expect(result).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should return null for expired entries', async () => {
      await fc.assert(
        fc.asyncProperty(
          imageHashArbitrary,
          generationResultArbitrary,
          async (imageHash, result) => {
            // Create cache with very short TTL (1ms)
            const cache = new CaptionCache(50, 1)
            
            // Store the result
            cache.set(imageHash, result)
            
            // Wait for TTL to expire
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                resolve()
              }, 10)
            })
            
            // Try to get expired entry
            const cachedResult = cache.get(imageHash)
            
            // Verify expired entry returns null
            expect(cachedResult).toBeNull()
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should maintain cache consistency across multiple operations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              hash: imageHashArbitrary,
              result: generationResultArbitrary
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (entries) => {
            const cache = new CaptionCache(50, 3600000)
            
            // Store all entries
            for (const entry of entries) {
              cache.set(entry.hash, entry.result)
            }
            
            // Verify all entries can be retrieved with identical results
            for (const entry of entries) {
              const cachedResult = cache.get(entry.hash)
              expect(cachedResult).toEqual(entry.result)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should handle cache updates correctly', () => {
      fc.assert(
        fc.property(
          imageHashArbitrary,
          generationResultArbitrary,
          generationResultArbitrary,
          (imageHash, result1, result2) => {
            const cache = new CaptionCache(50, 3600000)
            
            // Store first result
            cache.set(imageHash, result1)
            
            // Verify first result is cached
            expect(cache.get(imageHash)).toEqual(result1)
            
            // Update with second result
            cache.set(imageHash, result2)
            
            // Verify second result is now cached
            expect(cache.get(imageHash)).toEqual(result2)
            expect(cache.get(imageHash)).not.toEqual(result1)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('LRU eviction', () => {
    it('should evict least recently used entry when cache is full', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              hash: imageHashArbitrary,
              result: generationResultArbitrary
            }),
            { minLength: 6, maxLength: 10 }
          ),
          (entries) => {
            // Create cache with small size
            const cache = new CaptionCache(5, 3600000)
            
            // Fill cache to capacity
            for (let i = 0; i < 5; i++) {
              cache.set(entries[i].hash, entries[i].result)
            }
            
            // Verify cache is full
            expect(cache.size()).toBe(5)
            
            // Add one more entry (should evict LRU)
            cache.set(entries[5].hash, entries[5].result)
            
            // Verify cache size is still at max
            expect(cache.size()).toBe(5)
            
            // Verify first entry (LRU) was evicted
            expect(cache.get(entries[0].hash)).toBeNull()
            
            // Verify new entry is present
            expect(cache.get(entries[5].hash)).toEqual(entries[5].result)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should update LRU order on access', () => {
      // Use a simpler, deterministic test instead of property-based
      // to avoid issues with duplicate hash generation
      const cache = new CaptionCache(3, 3600000)
      
      const result1: GenerationResult = {
        baseCaption: 'test1',
        variants: [],
        generationTime: 100
      }
      const result2: GenerationResult = {
        baseCaption: 'test2',
        variants: [],
        generationTime: 100
      }
      const result3: GenerationResult = {
        baseCaption: 'test3',
        variants: [],
        generationTime: 100
      }
      const result4: GenerationResult = {
        baseCaption: 'test4',
        variants: [],
        generationTime: 100
      }
      
      // Fill cache: hash1, hash2, hash3 (LRU order: hash1 oldest)
      cache.set('hash1', result1)
      // Small delay to ensure different timestamps
      const delay = () => new Promise(resolve => setTimeout(resolve, 5))
      
      return (async () => {
        await delay()
        cache.set('hash2', result2)
        await delay()
        cache.set('hash3', result3)
        
        expect(cache.size()).toBe(3)
        
        // Access hash1 (moves it to most recently used)
        await delay()
        expect(cache.get('hash1')).toEqual(result1)
        
        // Add hash4 (should evict hash2, which is now LRU)
        await delay()
        cache.set('hash4', result4)
        
        expect(cache.size()).toBe(3)
        
        // hash1 should still be present (was accessed)
        expect(cache.get('hash1')).toEqual(result1)
        
        // hash2 should be evicted (was LRU)
        expect(cache.get('hash2')).toBeNull()
        
        // hash3 and hash4 should be present
        expect(cache.get('hash3')).toEqual(result3)
        expect(cache.get('hash4')).toEqual(result4)
      })()
    })
  })

  describe('TTL expiration', () => {
    it('should remove expired entries on prune', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              hash: imageHashArbitrary,
              result: generationResultArbitrary
            }),
            { minLength: 3, maxLength: 5 }
          ),
          async (entries) => {
            // Filter to ensure unique hashes
            const uniqueEntries = entries.filter((entry, index, self) => 
              self.findIndex(e => e.hash === entry.hash) === index
            )
            
            // Create cache with short TTL
            const cache = new CaptionCache(50, 1)
            
            // Store entries
            for (const entry of uniqueEntries) {
              cache.set(entry.hash, entry.result)
            }
            
            // Wait for TTL to expire
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                resolve()
              }, 10)
            })
            
            // Prune expired entries
            cache.prune()
            
            // Verify all entries were removed
            expect(cache.size()).toBe(0)
            
            for (const entry of uniqueEntries) {
              expect(cache.get(entry.hash)).toBeNull()
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Cache operations', () => {
    it('should clear all entries', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              hash: imageHashArbitrary,
              result: generationResultArbitrary
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (entries) => {
            const cache = new CaptionCache(50, 3600000)
            
            // Store entries
            for (const entry of entries) {
              cache.set(entry.hash, entry.result)
            }
            
            // Verify entries are present
            expect(cache.size()).toBe(entries.length)
            
            // Clear cache
            cache.clear()
            
            // Verify cache is empty
            expect(cache.size()).toBe(0)
            
            for (const entry of entries) {
              expect(cache.get(entry.hash)).toBeNull()
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should correctly report has() for existing entries', () => {
      fc.assert(
        fc.property(
          imageHashArbitrary,
          generationResultArbitrary,
          (imageHash, result) => {
            const cache = new CaptionCache(50, 3600000)
            
            // Verify entry doesn't exist
            expect(cache.has(imageHash)).toBe(false)
            
            // Store entry
            cache.set(imageHash, result)
            
            // Verify entry exists
            expect(cache.has(imageHash)).toBe(true)
          }
        ),
        { numRuns: 100 }
      )
    })
  })
})
