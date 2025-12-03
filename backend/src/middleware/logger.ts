import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import pino from 'pino'

// Import pino with better configuration
let pinoLogger: any
let loggerInstance: any

try {
  pinoLogger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport:
      process.env.NODE_ENV === 'development'
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
            },
          }
        : undefined,
    formatters: {
      level(label: string) {
        return { level: label }
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  })
  loggerInstance = pinoLogger
} catch (err) {
  // fallback to console (console implements info/error/debug on Node)
  loggerInstance = console
}

// Export the logger instance for use across the codebase
export const log = loggerInstance

// Enhanced middleware that adds request ID and logs request start and finish
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Add request ID if not already present
  const requestId =
    (req.headers && (req.headers['x-request-id'] as string)) || uuidv4()
  ;(req as any).requestId = requestId

  const startTime = Date.now()
  const originalSend = res.send

  // Override response send to add logging context
  if (typeof res.send === 'function') {
    res.send = function (chunk: any) {
      // Ensure res.locals exists before using it
      if (!res.locals) (res as any).locals = {}
      if (!res.locals.responseLogged) {
        const duration = Date.now() - startTime
        try {
          log.info(
            {
              requestId,
              method: req.method,
              path: req.path,
              status: res.statusCode,
              duration,
              userAgent:
                typeof (req as any).get === 'function'
                  ? (req as any).get('User-Agent')
                  : req.headers?.['user-agent'],
              ip: req.ip,
            },
            'request finished'
          )
        } catch (e) {
          // Best-effort: if logging fails in stubbed environments, swallow to avoid crashing tests
        }
        res.locals.responseLogged = true
      }
      return originalSend.call(this, chunk)
    }
  }

  // Also log on finish (for cases where send is not called directly)
  if (typeof res.on === 'function') {
    res.on('finish', () => {
      if (!res.locals) (res as any).locals = {}
      if (!res.locals.responseLogged) {
        const duration = Date.now() - startTime
        try {
          log.info(
            {
              requestId,
              method: req.method,
              path: req.path,
              status: res.statusCode,
              duration,
              userAgent:
                typeof (req as any).get === 'function'
                  ? (req as any).get('User-Agent')
                  : req.headers?.['user-agent'],
              ip: req.ip,
            },
            'request finished'
          )
        } catch (e) {
          // swallow errors to remain compatible with test stubs
        }
        res.locals.responseLogged = true
      }
    })
  }

  // Log request start
  log.info(
    {
      requestId,
      method: req.method,
      path: req.path,
      userAgent:
        typeof (req as any).get === 'function'
          ? (req as any).get('User-Agent')
          : req.headers?.['user-agent'],
      ip: req.ip,
    },
    'incoming request'
  )

  next()
}

// Backwards-compatibility: export 'logger' as the default middleware name used elsewhere in the code
export const logger = requestLogger
