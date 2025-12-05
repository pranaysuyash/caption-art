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

  const start = Date.now()
  const reqId = (req as any).requestId || 'no-req-id'
  log.debug({ requestId: reqId, middleware: 'waf' }, 'WAF start')

  try {
    const bodyString = JSON.stringify(req.body || '')
    for (const p of suspiciousPatterns) {
      if (p.test(bodyString)) {
        log.warn(
          { pattern: p.toString() },
          'WAF blocked request matching suspicious pattern'
        )
        const duration = Date.now() - start
        log.warn(
          { requestId: reqId, pattern: p.toString(), duration },
          'WAF blocked request matching suspicious pattern'
        )
        return res.status(400).json({ error: 'Request blocked by WAF' })
      }
    }
  } catch (err) {
    // If body can't be stringified, skip WAF check
    const duration = Date.now() - start
    log.warn({ requestId: reqId, duration }, 'WAF skip: body stringify failed')
  }
  const duration = Date.now() - start
  log.debug({ requestId: reqId, middleware: 'waf', duration }, 'WAF done')
  return next()
}

export default wafMiddleware
