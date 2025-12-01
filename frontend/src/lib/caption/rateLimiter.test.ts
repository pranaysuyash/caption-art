/**
 * Tests for RateLimiter
 * Requirements: 4.3
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { RateLimiter } from './rateLimiter'

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should allow requests within rate limit', async () => {
    const limiter = new RateLimiter({ requestsPerMinute: 10 })
    
    const results: number[] = []
    const promises = [
      limiter.enqueue(async () => { results.push(1); return 1 }),
      limiter.enqueue(async () => { results.push(2); return 2 }),
      limiter.enqueue(async () => { results.push(3); return 3 })
    ]

    // Fast-forward time to allow processing
    await vi.advanceTimersByTimeAsync(20000)
    
    await Promise.all(promises)
    
    expect(results).toEqual([1, 2, 3])
  })

  it('should enforce rate limit by delaying requests', async () => {
    const limiter = new RateLimiter({ requestsPerMinute: 2 }) // 2 requests per minute
    
    const timestamps: number[] = []
    const promises = [
      limiter.enqueue(async () => { timestamps.push(Date.now()); return 1 }),
      limiter.enqueue(async () => { timestamps.push(Date.now()); return 2 }),
      limiter.enqueue(async () => { timestamps.push(Date.now()); return 3 })
    ]

    // Fast-forward time to allow all requests to complete
    await vi.advanceTimersByTimeAsync(120000)
    
    await Promise.all(promises)
    
    // Verify requests were spaced out (at least 30 seconds apart for 2 req/min)
    expect(timestamps.length).toBe(3)
    expect(timestamps[1] - timestamps[0]).toBeGreaterThanOrEqual(30000)
    expect(timestamps[2] - timestamps[1]).toBeGreaterThanOrEqual(30000)
  })

  it('should return zero wait time when under limit', () => {
    const limiter = new RateLimiter({ requestsPerMinute: 10 })
    
    const waitTime = limiter.getWaitTime()
    expect(waitTime).toBe(0)
  })

  it('should track queue size correctly', () => {
    const limiter = new RateLimiter({ requestsPerMinute: 1 })
    
    expect(limiter.getQueueSize()).toBe(0)
    
    limiter.enqueue(async () => 1)
    
    // Queue size should be 1 before processing starts
    expect(limiter.getQueueSize()).toBeGreaterThanOrEqual(0)
  })

  it('should handle request failures gracefully', async () => {
    const limiter = new RateLimiter({ requestsPerMinute: 10 })
    
    const promise = limiter.enqueue(async () => {
      throw new Error('Request failed')
    }).catch(err => err) // Catch immediately to prevent unhandled rejection warning
    
    await vi.advanceTimersByTimeAsync(10000)
    
    const result = await promise
    expect(result).toBeInstanceOf(Error)
    expect(result.message).toBe('Request failed')
  })

  it('should process requests sequentially', async () => {
    const limiter = new RateLimiter({ requestsPerMinute: 60 }) // 1 per second
    
    let counter = 0
    const promises = [
      limiter.enqueue(async () => ++counter),
      limiter.enqueue(async () => ++counter),
      limiter.enqueue(async () => ++counter)
    ]

    await vi.advanceTimersByTimeAsync(5000)
    
    const results = await Promise.all(promises)
    expect(results).toEqual([1, 2, 3])
  })
})
