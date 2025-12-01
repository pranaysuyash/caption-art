import { Request, Response, NextFunction } from 'express'
import { config } from '../config'

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

  // Set CORS headers
  if (Array.isArray(origin)) {
    const requestOrigin = req.headers.origin
    if (requestOrigin && origin.includes(requestOrigin)) {
      res.setHeader('Access-Control-Allow-Origin', requestOrigin)
    }
  } else {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }

  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS'
  )
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  next()
}
