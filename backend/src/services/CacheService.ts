/**
 * Cache Service for images, captions, and masks
 * Implements a multi-layer cache with in-memory and file-based storage
 */

import { log } from '../middleware/logger';
import fs from 'fs/promises';
import path from 'path';
import { createHash } from 'crypto';

// Cache entry interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
  size?: number; // Size in bytes
  hits: number; // Number of times accessed
}

// Cache configuration
interface CacheConfig {
  maxSize?: number; // Max size in bytes
  maxEntries?: number; // Max number of entries
  defaultTTL?: number; // Default time to live in ms (default: 1 hour)
  autoEvict?: boolean; // Whether to auto-evict when limits are reached
}

// Cache statistics
interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  memorySize: number;
  hitRate: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache: Map<string, CacheEntry<any>> = new Map();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    entries: 0,
    memorySize: 0,
    hitRate: 0
  };
  private config: CacheConfig;
  private fileCacheDir: string;

  private constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize || 50 * 1024 * 1024, // 50MB default
      maxEntries: config.maxEntries || 1000,
      defaultTTL: config.defaultTTL || 60 * 60 * 1000, // 1 hour default
      autoEvict: config.autoEvict !== undefined ? config.autoEvict : true
    };

    // Set up file cache directory
    this.fileCacheDir = path.join(process.cwd(), 'cache');
    this.ensureCacheDir();

    log.info({
      maxSize: this.config.maxSize,
      maxEntries: this.config.maxEntries,
      defaultTTL: this.config.defaultTTL
    }, 'Cache service initialized');
  }

  public static getInstance(config?: CacheConfig): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService(config);
    }
    return CacheService.instance;
  }

  private ensureCacheDir(): void {
    try {
      fs.mkdir(this.fileCacheDir, { recursive: true });
    } catch (err) {
      log.error({ err }, 'Failed to create cache directory');
    }
  }

  /**
   * Get an item from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const now = Date.now();
    
    // Check in-memory cache first
    const entry = this.cache.get(key);
    if (entry) {
      // Check if entry is expired
      if (now - entry.timestamp > entry.ttl) {
        await this.delete(key);
        this.stats.misses++;
        return null;
      }
      
      // Update hits and access time
      entry.hits++;
      this.stats.hits++;
      this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
      
      log.debug({ key, hits: entry.hits }, 'Cache hit');
      return entry.data as T;
    }

    // Check file-based cache
    const fileKey = this.getFileKey(key);
    try {
      const fileExists = await this.fileExists(fileKey);
      if (fileExists) {
        const fileContent = await fs.readFile(fileKey, 'utf-8');
        const parsed = JSON.parse(fileContent) as CacheEntry<T>;
        
        // Check if file entry is expired
        if (now - parsed.timestamp > parsed.ttl) {
          await this.deleteFile(fileKey);
          this.stats.misses++;
          return null;
        }
        
        // Add to memory cache for faster access next time
        this.cache.set(key, parsed);
        this.stats.hits++;
        this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
        
        log.debug({ key }, 'Cache hit from file');
        return parsed.data;
      }
    } catch (err) {
      log.warn({ err, key }, 'Error reading from file cache');
    }

    this.stats.misses++;
    log.debug({ key }, 'Cache miss');
    return null;
  }

  /**
   * Set an item in cache
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<boolean> {
    const resolvedTTL = ttl || this.config.defaultTTL!;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: resolvedTTL,
      hits: 0
    };

    // Calculate size for memory tracking
    const dataSize = JSON.stringify(data).length;
    entry.size = dataSize;

    // Add to memory cache
    this.cache.set(key, entry as CacheEntry<any>);
    this.stats.entries = this.cache.size;
    this.stats.memorySize += dataSize;

    // Check if we need to evict entries
    if (this.config.autoEvict) {
      await this.evictIfNeeded();
    }

    log.debug({ key, ttl: resolvedTTL, dataSize }, 'Cache set');
    return true;
  }

  /**
   * Delete an item from cache
   */
  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.memorySize -= entry.size || 0;
      this.cache.delete(key);
      this.stats.entries = this.cache.size;
    }

    // Delete from file cache too
    const fileKey = this.getFileKey(key);
    await this.deleteFile(fileKey);

    log.debug({ key }, 'Cache delete');
    return true;
  }

  /**
   * Check if key exists in cache (without retrieving)
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key);
    if (entry) {
      const now = Date.now();
      if (now - entry.timestamp > entry.ttl) {
        await this.delete(key);
        return false;
      }
      return true;
    }

    // Check file cache
    const fileKey = this.getFileKey(key);
    const fileExists = await this.fileExists(fileKey);
    if (fileExists) {
      try {
        const content = await fs.readFile(fileKey, 'utf-8');
        const parsed = JSON.parse(content) as CacheEntry<any>;
        const now = Date.now();
        if (now - parsed.timestamp > parsed.ttl) {
          await this.deleteFile(fileKey);
          return false;
        }
        return true;
      } catch {
        return false;
      }
    }

    return false;
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      entries: 0,
      memorySize: 0,
      hitRate: 0
    };

    // Clear file cache
    try {
      const files = await fs.readdir(this.fileCacheDir);
      for (const file of files) {
        await fs.unlink(path.join(this.fileCacheDir, file));
      }
    } catch (err) {
      log.error({ err }, 'Error clearing file cache');
    }

    log.info('Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Evict entries if limits are exceeded
   */
  private async evictIfNeeded(): Promise<void> {
    if (this.config.maxEntries && this.cache.size > this.config.maxEntries) {
      // Least Recently Used (LRU) eviction
      const oldestKey = this.getOldestEntry();
      if (oldestKey) {
        await this.delete(oldestKey);
        log.info({ 
          reason: 'max_entries', 
          max: this.config.maxEntries,
          current: this.cache.size
        }, 'Cache eviction triggered');
      }
    }

    if (this.config.maxSize && this.stats.memorySize > this.config.maxSize) {
      // Remove oldest entries until under size limit
      while (this.stats.memorySize > this.config.maxSize! && this.cache.size > 0) {
        const oldestKey = this.getOldestEntry();
        if (oldestKey) {
          await this.delete(oldestKey);
          log.info({ 
            reason: 'max_size', 
            maxSize: this.config.maxSize,
            currentSize: this.stats.memorySize
          }, 'Cache eviction triggered');
        } else {
          break; // Safety break if no entries to evict
        }
      }
    }
  }

  /**
   * Get the oldest cache entry (LRU)
   */
  private getOldestEntry(): string | null {
    let oldestKey: string | null = null;
    let oldestTime = Number.MAX_SAFE_INTEGER;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  /**
   * Generate file key for file-based caching
   */
  private getFileKey(key: string): string {
    // Create a safe filename by hashing the key
    const hash = createHash('sha256').update(key).digest('hex');
    return path.join(this.fileCacheDir, `${hash}.json`);
  }

  /**
   * Check if file exists
   */
  private async fileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Delete file
   */
  private async deleteFile(filepath: string): Promise<void> {
    try {
      await fs.unlink(filepath);
    } catch {
      // File might not exist, which is fine
    }
  }

  /**
   * Cache specific operations for different data types
   */

  // Caption specific methods
  async getCaption(key: string): Promise<string | null> {
    return this.get<string>(`caption:${key}`);
  }

  async setCaption(key: string, caption: string, ttl?: number): Promise<boolean> {
    return this.set<string>(`caption:${key}`, caption, ttl);
  }

  // Image specific methods  
  async getImage(key: string): Promise<Buffer | null> {
    const base64 = await this.get<string>(`image:${key}`);
    return base64 ? Buffer.from(base64, 'base64') : null;
  }

  async setImage(key: string, imageBuffer: Buffer, ttl?: number): Promise<boolean> {
    return this.set<string>(`image:${key}`, imageBuffer.toString('base64'), ttl);
  }

  // Mask specific methods
  async getMask(key: string): Promise<Buffer | null> {
    const base64 = await this.get<string>(`mask:${key}`);
    return base64 ? Buffer.from(base64, 'base64') : null;
  }

  async setMask(key: string, maskBuffer: Buffer, ttl?: number): Promise<boolean> {
    return this.set<string>(`mask:${key}`, maskBuffer.toString('base64'), ttl);
  }

  // Caption generation result (with variations)
  async getCaptionVariations(key: string): Promise<any | null> {
    return this.get<any>(`variations:${key}`);
  }

  async setCaptionVariations(key: string, variations: any, ttl?: number): Promise<boolean> {
    return this.set<any>(`variations:${key}`, variations, ttl);
  }
}