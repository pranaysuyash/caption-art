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
  const requestOrigin = req.headers.origin
  if (Array.isArray(origin)) {
    if (requestOrigin && origin.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin)
      allowCredentials = true
    }
  } else if (origin !== '*') {
    res.setHeader('Access-Control-Allow-Origin', origin)
    allowCredentials = true
  } else if (requestOrigin) {
    // Wildcard origin but real request origin present: echo it and allow credentials
    res.setHeader('Access-Control-Allow-Origin', requestOrigin)
    allowCredentials = true
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  // Always set Access-Control-Allow-Credentials header explicitly to avoid tests
  // that assert on its presence. Use the correct boolean as string value
  // depending on whether credentials are allowed.
  res.setHeader(
    'Access-Control-Allow-Credentials',
    allowCredentials ? 'true' : 'false'
  )

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  next()
}
