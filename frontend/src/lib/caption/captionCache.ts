/**
 * Caption Cache with LRU eviction and TTL expiration
 * Requirements: 6.1, 6.2
 */

import { GenerationResult } from './types'

/**
 * Cache entry with timestamp for TTL
 */
export interface CacheEntry {
  imageHash: string
  result: GenerationResult
  timestamp: number
  lastAccessed: number
}

/**
 * Caption cache with LRU eviction and TTL expiration
 * Requirements: 6.1, 6.2
 */
export class CaptionCache {
  private cache: Map<string, CacheEntry>
  private maxSize: number
  private ttl: number // Time to live in milliseconds

  /**
   * Create a new caption cache
   * @param maxSize Maximum number of entries (default: 50)
   * @param ttl Time to live in milliseconds (default: 1 hour)
   */
  constructor(maxSize: number = 50, ttl: number = 3600000) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.ttl = ttl
  }

  /**
   * Add or update a cache entry
   * Requirements: 6.1, 6.2
   * 
   * Implements LRU eviction when cache is full
   */
  set(imageHash: string, result: GenerationResult): void {
    const now = Date.now()
    
    // If entry exists, update it
    if (this.cache.has(imageHash)) {
      this.cache.set(imageHash, {
        imageHash,
        result,
        timestamp: now,
        lastAccessed: now
      })
      return
    }
    
    // If cache is full, evict least recently used entry
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }
    
    // Add new entry
    this.cache.set(imageHash, {
      imageHash,
      result,
      timestamp: now,
      lastAccessed: now
    })
  }

  /**
   * Retrieve a cache entry
   * Requirements: 6.1, 6.2
   * 
   * Returns null if entry doesn't exist or has expired
   * Updates last accessed time for LRU tracking
   */
  get(imageHash: string): GenerationResult | null {
    const entry = this.cache.get(imageHash)
    
    if (!entry) {
      return null
    }
    
    // Check if entry has expired
    const now = Date.now()
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(imageHash)
      return null
    }
    
    // Update last accessed time for LRU
    entry.lastAccessed = now
    this.cache.set(imageHash, entry)
    
    return entry.result
  }

  /**
   * Check if cache contains an entry
   * Requirements: 6.1, 6.2
   * 
   * Does not update access time (read-only check)
   */
  has(imageHash: string): boolean {
    const entry = this.cache.get(imageHash)
    
    if (!entry) {
      return false
    }
    
    // Check if entry has expired
    const now = Date.now()
    if (now - entry.timestamp > this.ttl) {
      this.cache.delete(imageHash)
      return false
    }
    
    return true
  }

  /**
   * Clear all cache entries
   * Requirements: 6.1, 6.2
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Remove expired entries
   * Requirements: 6.1
   */
  prune(): void {
    const now = Date.now()
    const toDelete: string[] = []
    
    for (const [hash, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        toDelete.push(hash)
      }
    }
    
    for (const hash of toDelete) {
      this.cache.delete(hash)
    }
  }

  /**
   * Evict the least recently used entry
   * Requirements: 6.1
   * 
   * Private helper for LRU eviction
   */
  private evictLRU(): void {
    let oldestHash: string | null = null
    let oldestTime = Infinity
    
    for (const [hash, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed
        oldestHash = hash
      }
    }
    
    if (oldestHash) {
      this.cache.delete(oldestHash)
    }
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size
  }
}
