import { Request, Response, NextFunction } from 'express'
import { config } from '../config'
import { log } from './logger'

const suspiciousPatterns = [
  /<script\b[^>]*>([\s\S]*?)<\/script>/i,
  /\bUNION\b\s+SELECT\b/i,
  /\bDROP\b\s+TABLE\b/i,
  /\brm\s+-rf\b/i,
  /\bINSERT\b\s+INTO\b/i,
  /<iframe\b[^>]*>/i,
]

export function wafMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!config.waf || !config.waf.enable) return next()

  try {
    const bodyString = JSON.stringify(req.body || '')
    for (const p of suspiciousPatterns) {
      if (p.test(bodyString)) {
        log.warn(
          { pattern: p.toString() },
          'WAF blocked request matching suspicious pattern'
        )
        return res.status(400).json({ error: 'Request blocked by WAF' })
      }
    }
  } catch (err) {
    // If body can't be stringified, skip WAF check
    log.warn('WAF skip: body stringify failed')
  }
  return next()
}

export default wafMiddleware
