/**
 * Client-side rate limiter for API requests
 * Requirements: 4.3
 */

/**
 * Rate limiter configuration
 */
export interface RateLimiterConfig {
  requestsPerMinute: number
  queueSize?: number
}

/**
 * Queued request with promise resolvers
 */
interface QueuedRequest<T> {
  fn: () => Promise<T>
  resolve: (value: T) => void
  reject: (error: Error) => void
  timestamp: number
}

/**
 * Client-side rate limiter that queues requests and enforces rate limits
 * Requirements: 4.3
 */
export class RateLimiter {
  private queue: QueuedRequest<any>[] = []
  private processing = false
  private requestsPerMinute: number
  private maxQueueSize: number
  private requestTimestamps: number[] = []

  constructor(config: RateLimiterConfig) {
    this.requestsPerMinute = config.requestsPerMinute
    this.maxQueueSize = config.queueSize || 10
  }

  /**
   * Enqueue a request to be executed with rate limiting
   * Requirements: 4.3
   */
  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      // Check if queue is full
      if (this.queue.length >= this.maxQueueSize) {
        reject(new Error('Too many requests. Please wait a moment.'))
        return
      }

      // Add to queue
      this.queue.push({
        fn,
        resolve,
        reject,
        timestamp: Date.now()
      })

      // Start processing
      this.process()
    })
  }

  /**
   * Process queued requests with rate limiting
   * Requirements: 4.3
   */
  private async process(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return
    }

    this.processing = true

    while (this.queue.length > 0) {
      // Clean up old timestamps (older than 1 minute)
      const now = Date.now()
      const oneMinuteAgo = now - 60000
      this.requestTimestamps = this.requestTimestamps.filter(t => t > oneMinuteAgo)

      // Check if we can make a request
      if (this.requestTimestamps.length >= this.requestsPerMinute) {
        // Calculate wait time until oldest request expires
        const oldestTimestamp = this.requestTimestamps[0]
        const waitTime = oldestTimestamp + 60000 - now

        if (waitTime > 0) {
          // Wait before processing next request
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
      }

      // Get next request from queue
      const request = this.queue.shift()
      if (!request) {
        break
      }

      // Record request timestamp
      this.requestTimestamps.push(Date.now())

      // Execute request
      try {
        const result = await request.fn()
        request.resolve(result)
      } catch (error) {
        request.reject(error as Error)
      }

      // Calculate delay to maintain rate limit
      const delay = Math.ceil(60000 / this.requestsPerMinute)
      
      // Only wait if there are more requests in queue
      if (this.queue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    this.processing = false
  }

  /**
   * Get estimated wait time for next request
   * Requirements: 4.3
   */
  getWaitTime(): number {
    const now = Date.now()
    const oneMinuteAgo = now - 60000
    const recentRequests = this.requestTimestamps.filter(t => t > oneMinuteAgo)

    if (recentRequests.length < this.requestsPerMinute) {
      return 0
    }

    // Calculate when the oldest request will expire
    const oldestTimestamp = recentRequests[0]
    const waitTime = oldestTimestamp + 60000 - now

    return Math.max(0, waitTime)
  }

  /**
   * Get current queue size
   */
  getQueueSize(): number {
    return this.queue.length
  }

  /**
   * Clear all queued requests
   */
  clear(): void {
    // Reject all queued requests
    for (const request of this.queue) {
      request.reject(new Error('Rate limiter cleared'))
    }
    this.queue = []
  }
}
