/**
 * Property-based tests for MaskCache
 * Requirements: 6.1, 6.2, 6.3
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { MaskCache } from './maskCache';
import { MaskResult } from './types';

/**
 * Arbitrary generator for quality rating
 */
const qualityArbitrary = fc.constantFrom<'high' | 'medium' | 'low'>(
  'high',
  'medium',
  'low'
);

/**
 * Arbitrary generator for HTMLImageElement mock
 * We create a minimal mock that satisfies the interface
 */
const mockImageArbitrary = fc.constant({
  width: 100,
  height: 100,
  src: 'data:image/png;base64,mock'
} as unknown as HTMLImageElement);

/**
 * Arbitrary generator for MaskResult
 */
const maskResultArbitrary = fc.record({
  maskUrl: fc.webUrl(),
  maskImage: mockImageArbitrary,
  generationTime: fc.integer({ min: 100, max: 45000 }),
  quality: qualityArbitrary
});

/**
 * Arbitrary generator for image hash (SHA-256 hex string)
 */
const imageHashArbitrary = fc.string({ minLength: 32, maxLength: 64 });

describe('MaskCache', () => {
  describe('Property 5: Cache hit consistency', () => {
    /**
     * **Feature: image-segmentation-masking, Property 5: Cache hit consistency**
     * **Validates: Requirements 6.3**
     * 
     * For any image that has been processed before, if the cache contains a valid entry,
     * the returned mask should be identical to the cached mask
     */
    it('should return identical results for cache hits', () => {
      fc.assert(
        fc.property(
          imageHashArbitrary,
          maskResultArbitrary,
          (imageHash, result) => {
            // Create a fresh cache for each test
            const cache = new MaskCache(30, 2 * 60 * 60 * 1000);
            
            // Store the result in cache
            cache.set(imageHash, result);
            
            // Retrieve the result from cache
            const cachedResult = cache.get(imageHash);
            
            // Verify cache hit returns identical result
            expect(cachedResult).not.toBeNull();
            expect(cachedResult).toEqual(result);
            
            // Verify deep equality of properties
            expect(cachedResult?.maskUrl).toBe(result.maskUrl);
            expect(cachedResult?.generationTime).toBe(result.generationTime);
            expect(cachedResult?.quality).toBe(result.quality);
            expect(cachedResult?.maskImage).toBe(result.maskImage);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for cache misses', () => {
      fc.assert(
        fc.property(
          imageHashArbitrary,
          (imageHash) => {
            const cache = new MaskCache(30, 2 * 60 * 60 * 1000);
            
            // Try to get a result that was never cached
            const result = cache.get(imageHash);
            
            // Verify cache miss returns null
            expect(result).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for expired entries', async () => {
      await fc.assert(
        fc.asyncProperty(
          imageHashArbitrary,
          maskResultArbitrary,
          async (imageHash, result) => {
            // Create cache with very short TTL (1ms)
            const cache = new MaskCache(30, 1);
            
            // Store the result
            cache.set(imageHash, result);
            
            // Wait for TTL to expire
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                resolve();
              }, 10);
            });
            
            // Try to get expired entry
            const cachedResult = cache.get(imageHash);
            
            // Verify expired entry returns null
            expect(cachedResult).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain cache consistency across multiple operations', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              hash: imageHashArbitrary,
              result: maskResultArbitrary
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (entries) => {
            const cache = new MaskCache(30, 2 * 60 * 60 * 1000);
            
            // Store all entries
            for (const entry of entries) {
              cache.set(entry.hash, entry.result);
            }
            
            // Verify all entries can be retrieved with identical results
            for (const entry of entries) {
              const cachedResult = cache.get(entry.hash);
              expect(cachedResult).toEqual(entry.result);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle cache updates correctly', () => {
      fc.assert(
        fc.property(
          imageHashArbitrary,
          maskResultArbitrary,
          maskResultArbitrary,
          (imageHash, result1, result2) => {
            const cache = new MaskCache(30, 2 * 60 * 60 * 1000);
            
            // Store first result
            cache.set(imageHash, result1);
            
            // Verify first result is cached
            expect(cache.get(imageHash)).toEqual(result1);
            
            // Update with second result
            cache.set(imageHash, result2);
            
            // Verify second result is now cached
            expect(cache.get(imageHash)).toEqual(result2);
            expect(cache.get(imageHash)).not.toEqual(result1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('LRU eviction', () => {
    it('should evict least recently used entry when cache is full', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              hash: imageHashArbitrary,
              result: maskResultArbitrary
            }),
            { minLength: 6, maxLength: 10 }
          ),
          (entries) => {
            // Create cache with small size
            const cache = new MaskCache(5, 2 * 60 * 60 * 1000);
            
            // Fill cache to capacity
            for (let i = 0; i < 5; i++) {
              cache.set(entries[i].hash, entries[i].result);
            }
            
            // Verify cache is full
            expect(cache.size()).toBe(5);
            
            // Add one more entry (should evict LRU)
            cache.set(entries[5].hash, entries[5].result);
            
            // Verify cache size is still at max
            expect(cache.size()).toBe(5);
            
            // Verify first entry (LRU) was evicted
            expect(cache.get(entries[0].hash)).toBeNull();
            
            // Verify new entry is present
            expect(cache.get(entries[5].hash)).toEqual(entries[5].result);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should update LRU order on access', async () => {
      // Use a deterministic test to avoid issues with duplicate hash generation
      const cache = new MaskCache(3, 2 * 60 * 60 * 1000);
      
      const result1: MaskResult = {
        maskUrl: 'http://example.com/mask1.png',
        maskImage: { width: 100, height: 100 } as HTMLImageElement,
        generationTime: 100,
        quality: 'high'
      };
      const result2: MaskResult = {
        maskUrl: 'http://example.com/mask2.png',
        maskImage: { width: 100, height: 100 } as HTMLImageElement,
        generationTime: 200,
        quality: 'medium'
      };
      const result3: MaskResult = {
        maskUrl: 'http://example.com/mask3.png',
        maskImage: { width: 100, height: 100 } as HTMLImageElement,
        generationTime: 300,
        quality: 'low'
      };
      const result4: MaskResult = {
        maskUrl: 'http://example.com/mask4.png',
        maskImage: { width: 100, height: 100 } as HTMLImageElement,
        generationTime: 400,
        quality: 'high'
      };
      
      const delay = () => new Promise(resolve => setTimeout(resolve, 5));
      
      // Fill cache: hash1, hash2, hash3 (LRU order: hash1 oldest)
      cache.set('hash1', result1);
      await delay();
      cache.set('hash2', result2);
      await delay();
      cache.set('hash3', result3);
      
      expect(cache.size()).toBe(3);
      
      // Access hash1 (moves it to most recently used)
      await delay();
      expect(cache.get('hash1')).toEqual(result1);
      
      // Add hash4 (should evict hash2, which is now LRU)
      await delay();
      cache.set('hash4', result4);
      
      expect(cache.size()).toBe(3);
      
      // hash1 should still be present (was accessed)
      expect(cache.get('hash1')).toEqual(result1);
      
      // hash2 should be evicted (was LRU)
      expect(cache.get('hash2')).toBeNull();
      
      // hash3 and hash4 should be present
      expect(cache.get('hash3')).toEqual(result3);
      expect(cache.get('hash4')).toEqual(result4);
    });
  });

  describe('TTL expiration', () => {
    it('should remove expired entries on prune', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              hash: imageHashArbitrary,
              result: maskResultArbitrary
            }),
            { minLength: 3, maxLength: 5 }
          ),
          async (entries) => {
            // Filter to ensure unique hashes
            const uniqueEntries = entries.filter((entry, index, self) => 
              self.findIndex(e => e.hash === entry.hash) === index
            );
            
            // Create cache with short TTL
            const cache = new MaskCache(30, 1);
            
            // Store entries
            for (const entry of uniqueEntries) {
              cache.set(entry.hash, entry.result);
            }
            
            // Wait for TTL to expire
            await new Promise<void>((resolve) => {
              setTimeout(() => {
                resolve();
              }, 10);
            });
            
            // Prune expired entries
            cache.prune();
            
            // Verify all entries were removed
            expect(cache.size()).toBe(0);
            
            for (const entry of uniqueEntries) {
              expect(cache.get(entry.hash)).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Cache operations', () => {
    it('should clear all entries', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              hash: imageHashArbitrary,
              result: maskResultArbitrary
            }),
            { minLength: 1, maxLength: 10 }
          ),
          (entries) => {
            const cache = new MaskCache(30, 2 * 60 * 60 * 1000);
            
            // Store entries
            for (const entry of entries) {
              cache.set(entry.hash, entry.result);
            }
            
            // Verify entries are present
            expect(cache.size()).toBe(entries.length);
            
            // Clear cache
            cache.clear();
            
            // Verify cache is empty
            expect(cache.size()).toBe(0);
            
            for (const entry of entries) {
              expect(cache.get(entry.hash)).toBeNull();
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly report has() for existing entries', () => {
      fc.assert(
        fc.property(
          imageHashArbitrary,
          maskResultArbitrary,
          (imageHash, result) => {
            const cache = new MaskCache(30, 2 * 60 * 60 * 1000);
            
            // Verify entry doesn't exist
            expect(cache.has(imageHash)).toBe(false);
            
            // Store entry
            cache.set(imageHash, result);
            
            // Verify entry exists
            expect(cache.has(imageHash)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should track cache statistics', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              hash: imageHashArbitrary,
              result: maskResultArbitrary
            }),
            { minLength: 1, maxLength: 5 }
          ),
          (entries) => {
            const cache = new MaskCache(30, 2 * 60 * 60 * 1000);
            
            // Store entries
            for (const entry of entries) {
              cache.set(entry.hash, entry.result);
            }
            
            // Get stats
            const stats = cache.getStats();
            
            // Verify stats
            expect(stats.size).toBe(entries.length);
            expect(stats.maxSize).toBe(30);
            expect(stats.ttl).toBe(2 * 60 * 60 * 1000);
            
            // Access some entries (hits)
            for (const entry of entries) {
              cache.get(entry.hash);
            }
            
            // Try to access non-existent entry (miss)
            cache.get('nonexistent');
            
            const newStats = cache.getStats();
            expect(newStats.hits).toBe(entries.length);
            expect(newStats.misses).toBe(1);
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});

/**
 * Unit tests for MaskCache
 * Tests specific scenarios for cache operations
 */
describe('MaskCache - Unit Tests', () => {
  const mockResult: MaskResult = {
    maskUrl: 'https://example.com/mask.png',
    maskImage: { width: 100, height: 100 } as HTMLImageElement,
    generationTime: 1000,
    quality: 'high'
  };

  describe('Constructor', () => {
    it('should create cache with default values', () => {
      const cache = new MaskCache();
      const stats = cache.getStats();

      expect(stats.maxSize).toBe(30);
      expect(stats.ttl).toBe(2 * 60 * 60 * 1000);
      expect(stats.size).toBe(0);
    });

    it('should create cache with custom values', () => {
      const cache = new MaskCache(50, 3600000);
      const stats = cache.getStats();

      expect(stats.maxSize).toBe(50);
      expect(stats.ttl).toBe(3600000);
    });
  });

  describe('Basic operations', () => {
    it('should store and retrieve entries', () => {
      const cache = new MaskCache();

      cache.set('hash1', mockResult);

      const result = cache.get('hash1');
      expect(result).toEqual(mockResult);
    });

    it('should return null for non-existent entries', () => {
      const cache = new MaskCache();

      const result = cache.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should update existing entries', () => {
      const cache = new MaskCache();
      const updatedResult = { ...mockResult, quality: 'medium' as const };

      cache.set('hash1', mockResult);
      cache.set('hash1', updatedResult);

      const result = cache.get('hash1');
      expect(result?.quality).toBe('medium');
    });

    it('should check entry existence with has()', () => {
      const cache = new MaskCache();

      expect(cache.has('hash1')).toBe(false);

      cache.set('hash1', mockResult);

      expect(cache.has('hash1')).toBe(true);
    });

    it('should report correct size', () => {
      const cache = new MaskCache();

      expect(cache.size()).toBe(0);

      cache.set('hash1', mockResult);
      expect(cache.size()).toBe(1);

      cache.set('hash2', mockResult);
      expect(cache.size()).toBe(2);

      cache.clear();
      expect(cache.size()).toBe(0);
    });
  });

  describe('Statistics tracking', () => {
    it('should track cache hits', () => {
      const cache = new MaskCache();
      cache.set('hash1', mockResult);

      cache.get('hash1');
      cache.get('hash1');

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
    });

    it('should track cache misses', () => {
      const cache = new MaskCache();

      cache.get('nonexistent1');
      cache.get('nonexistent2');

      const stats = cache.getStats();
      expect(stats.misses).toBe(2);
    });

    it('should track both hits and misses', () => {
      const cache = new MaskCache();
      cache.set('hash1', mockResult);

      cache.get('hash1'); // hit
      cache.get('nonexistent'); // miss
      cache.get('hash1'); // hit

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
    });

    it('should reset stats on clear', () => {
      const cache = new MaskCache();
      cache.set('hash1', mockResult);
      cache.get('hash1');
      cache.get('nonexistent');

      cache.clear();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.size).toBe(0);
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest entry when cache is full', () => {
      const cache = new MaskCache(3, 2 * 60 * 60 * 1000);

      cache.set('hash1', mockResult);
      cache.set('hash2', mockResult);
      cache.set('hash3', mockResult);

      expect(cache.size()).toBe(3);

      // Adding 4th entry should evict hash1
      cache.set('hash4', mockResult);

      expect(cache.size()).toBe(3);
      expect(cache.has('hash1')).toBe(false);
      expect(cache.has('hash4')).toBe(true);
    });

    it('should not evict when updating existing entry', () => {
      const cache = new MaskCache(3, 2 * 60 * 60 * 1000);

      cache.set('hash1', mockResult);
      cache.set('hash2', mockResult);
      cache.set('hash3', mockResult);

      // Update existing entry
      cache.set('hash2', { ...mockResult, quality: 'medium' as const });

      expect(cache.size()).toBe(3);
      expect(cache.has('hash1')).toBe(true);
      expect(cache.has('hash2')).toBe(true);
      expect(cache.has('hash3')).toBe(true);
    });
  });

  describe('TTL expiration', () => {
    it('should return null for expired entries', async () => {
      const cache = new MaskCache(30, 10); // 10ms TTL

      cache.set('hash1', mockResult);

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));

      const result = cache.get('hash1');
      expect(result).toBeNull();
    });

    it('should not return expired entries even if they exist', async () => {
      const cache = new MaskCache(30, 10);

      cache.set('hash1', mockResult);

      expect(cache.has('hash1')).toBe(true);

      await new Promise(resolve => setTimeout(resolve, 20));

      const result = cache.get('hash1');
      expect(result).toBeNull();
    });

    it('should remove expired entries from cache on get', async () => {
      const cache = new MaskCache(30, 10);

      cache.set('hash1', mockResult);
      expect(cache.size()).toBe(1);

      await new Promise(resolve => setTimeout(resolve, 20));

      cache.get('hash1'); // Should remove expired entry

      expect(cache.size()).toBe(0);
    });

    it('should prune all expired entries', async () => {
      const cache = new MaskCache(30, 10);

      cache.set('hash1', mockResult);
      cache.set('hash2', mockResult);
      cache.set('hash3', mockResult);

      expect(cache.size()).toBe(3);

      await new Promise(resolve => setTimeout(resolve, 20));

      cache.prune();

      expect(cache.size()).toBe(0);
    });

    it('should not prune non-expired entries', async () => {
      const cache = new MaskCache(30, 1000); // 1 second TTL

      cache.set('hash1', mockResult);
      cache.set('hash2', mockResult);

      // Wait a bit but not enough to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      cache.prune();

      expect(cache.size()).toBe(2);
      expect(cache.has('hash1')).toBe(true);
      expect(cache.has('hash2')).toBe(true);
    });
  });

  describe('Clear operation', () => {
    it('should remove all entries', () => {
      const cache = new MaskCache();

      cache.set('hash1', mockResult);
      cache.set('hash2', mockResult);
      cache.set('hash3', mockResult);

      expect(cache.size()).toBe(3);

      cache.clear();

      expect(cache.size()).toBe(0);
      expect(cache.has('hash1')).toBe(false);
      expect(cache.has('hash2')).toBe(false);
      expect(cache.has('hash3')).toBe(false);
    });

    it('should reset statistics', () => {
      const cache = new MaskCache();

      cache.set('hash1', mockResult);
      cache.get('hash1');
      cache.get('nonexistent');

      let stats = cache.getStats();
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);

      cache.clear();

      stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });
});
