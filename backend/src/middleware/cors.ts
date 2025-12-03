import { Request, Response, NextFunction } from 'express'
import { config } from '../config'
import { log } from './logger'

/**
 * CORS middleware that handles cross-origin requests
 * Configures CORS headers based on environment variables
 */
export function corsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const origin = config.cors.origin

  // Protect: in production, explicit allowlist only. Deny wildcard if present to avoid accidental wide-open CORS.
  if (origin === '*' && process.env.NODE_ENV === 'production') {
    // Security: wildcard origin not permitted in production - block cross-origin requests
    const message =
      'Wildcard CORS not allowed in production. Set explicit CORS_ORIGIN.'
    log.warn(message)
    if (req.headers.origin) {
      res.status(403).json({ error: message })
      return
    }
  }

  // Set CORS headers
  let allowCredentials = false
  if (Array.isArray(origin)) {
    const requestOrigin = req.headers.origin
    if (requestOrigin && origin.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin)
      allowCredentials = true // Allow credentials only for explicit allowlist
    }
  } else if (origin !== '*') {
    // Specific origin (not wildcard) - safe to allow credentials
    res.setHeader('Access-Control-Allow-Origin', origin)
    allowCredentials = true
  } else {
    // Wildcard origin - do not allow credentials (CORS spec violation)
    res.setHeader('Access-Control-Allow-Origin', origin)
    allowCredentials = false
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Only allow credentials when origin is explicit (not wildcard)
  if (allowCredentials) {
    res.setHeader('Access-Control-Allow-Credentials', 'true')
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  next()
}
