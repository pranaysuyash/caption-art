import rateLimit from 'express-rate-limit'

/**
 * Rate limiter middleware configuration
 * Environment-aware rate limiting:
 * - Production: 5 requests per 15 minutes per IP (strict)
 * - Development: 1000 requests per minute per IP (lenient)
 */
export const rateLimiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' 
    ? 15 * 60 * 1000  // 15 minutes in production
    : 1 * 60 * 1000,  // 1 minute in development
  max: process.env.NODE_ENV === 'production' 
    ? 5      // Strict limit for production (prevents API cost abuse)
    : 1000,  // Lenient limit for development
  message: 'Too many requests, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests, please try again later',
      retryAfter: res.getHeader('Retry-After')
    })
  },
})
