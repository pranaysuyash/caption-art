/**
 * MaskCache - Caches generated masks to avoid redundant API calls
 * 
 * Features:
 * - LRU (Least Recently Used) eviction policy
 * - TTL (Time To Live) expiration
 * - Configurable max size and TTL
 * - Cache statistics tracking
 */

import { MaskResult } from './types';

/**
 * Cache entry containing mask result and metadata
 */
export interface MaskCacheEntry {
  imageHash: string;
  maskResult: MaskResult;
  timestamp: number;
  lastAccessed: number;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  ttl: number;
}

/**
 * MaskCache class for caching mask generation results
 */
export class MaskCache {
  private cache: Map<string, MaskCacheEntry>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds
  private hits: number;
  private misses: number;

  /**
   * Create a new MaskCache
   * 
   * @param maxSize - Maximum number of entries (default: 30)
   * @param ttl - Time to live in milliseconds (default: 2 hours)
   */
  constructor(maxSize: number = 30, ttl: number = 2 * 60 * 60 * 1000) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Add or update a cache entry
   * 
   * Implements LRU eviction when cache is full
   * 
   * @param imageHash - Hash of the image
   * @param result - Mask generation result
   */
  set(imageHash: string, result: MaskResult): void {
    const now = Date.now();

    // If cache is full and this is a new entry, evict LRU
    if (this.cache.size >= this.maxSize && !this.cache.has(imageHash)) {
      this.evictLRU();
    }

    // Add or update entry
    const entry: MaskCacheEntry = {
      imageHash,
      maskResult: result,
      timestamp: now,
      lastAccessed: now
    };

    this.cache.set(imageHash, entry);
  }

  /**
   * Retrieve a cache entry
   * 
   * Returns null if entry doesn't exist or has expired
   * Updates last accessed time on hit
   * 
   * @param imageHash - Hash of the image
   * @returns Cached mask result or null
   */
  get(imageHash: string): MaskResult | null {
    const entry = this.cache.get(imageHash);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    const now = Date.now();
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(imageHash);
      this.misses++;
      return null;
    }

    // Update last accessed time
    entry.lastAccessed = now;
    this.hits++;

    return entry.maskResult;
  }

  /**
   * Check if cache contains an entry
   * 
   * Does not update access time or check expiration
   * 
   * @param imageHash - Hash of the image
   * @returns True if entry exists
   */
  has(imageHash: string): boolean {
    return this.cache.has(imageHash);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Remove expired entries
   * 
   * Should be called periodically to free memory
   */
  prune(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [hash, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        toDelete.push(hash);
      }
    }

    for (const hash of toDelete) {
      this.cache.delete(hash);
    }
  }

  /**
   * Get cache statistics
   * 
   * @returns Cache stats including hits, misses, and size
   */
  getStats(): CacheStats {
    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.maxSize,
      ttl: this.ttl
    };
  }

  /**
   * Get current cache size
   * 
   * @returns Number of entries in cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Evict least recently used entry
   * 
   * Called when cache is full
   */
  private evictLRU(): void {
    let oldestHash: string | null = null;
    let oldestTime = Infinity;

    for (const [hash, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestHash = hash;
      }
    }

    if (oldestHash) {
      this.cache.delete(oldestHash);
    }
  }
}
