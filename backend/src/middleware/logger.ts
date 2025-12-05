import { Request, Response, NextFunction, Express } from 'express'
import { v4 as uuidv4 } from 'uuid'
import pino from 'pino'
import { MetricsService } from '../services/MetricsService'

// Create a logger instance depending on environment
let pinoLogger: any
let loggerInstance: any

if (process.env.NODE_ENV === 'test') {
  loggerInstance = {
    info: (...args: any[]) => console.info(...args),
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
    debug: (...args: any[]) => console.debug(...args),
  }
} else {
  try {
    pinoLogger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
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
    loggerInstance = console
  }
}

export const log = loggerInstance

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers && (req.headers['x-request-id'] as string)) || uuidv4()
  ;(req as any).requestId = requestId

  const startTime = Date.now()
  const originalSend = res.send

  const shouldLogForDuration = (durMs: number) => {
    const isTest = process.env.NODE_ENV === 'test'
    const verboseTestLogging = process.env.TEST_VERBOSE_LOGGING === 'true'
    const testLogThresholdMs = Number(process.env.TEST_LOG_THRESHOLD_MS || '10')
    return !isTest || verboseTestLogging || (res.statusCode >= 400) || durMs >= testLogThresholdMs
  }

  const recordAndLog = (duration: number) => {
    try {
      const durationSec = duration / 1000
      if (shouldLogForDuration(duration)) {
        try {
          log.info(
            {
              requestId,
              method: req.method,
              path: (req as any).path || (req as any).originalUrl || '',
              status: res.statusCode,
              duration,
              userAgent:
                typeof (req as any).get === 'function' ? (req as any).get('User-Agent') : req.headers?.['user-agent'],
              ip: req.ip,
            },
            'request finished'
          )
        } catch (e) {
          // swallow logging errors in test/stubbed environments
        }
        try {
          MetricsService.trackApiRequest(req.method, req.path as any, res.statusCode, durationSec)
        } catch (e) {
          // swallow metrics errors
        }
      }
    } catch (e) {
      // swallow
    }
  }

  // Override send to detect responses directly
  if (typeof res.send === 'function') {
    res.send = function (chunk: any) {
      try {
        if (!res.locals) (res as any).locals = {}
        if (!res.locals.responseLogged) {
          const duration = Date.now() - startTime
          recordAndLog(duration)
          res.locals.responseLogged = true
        }
      } catch (e) {
        // swallow
      }
      return originalSend.call(this, chunk)
    }
  }

  // Also listen to finish in case send is not called directly
  if (typeof res.on === 'function') {
    res.on('finish', () => {
      try {
        if (!res.locals) (res as any).locals = {}
        if (!res.locals.responseLogged) {
          const duration = Date.now() - startTime
          recordAndLog(duration)
          res.locals.responseLogged = true
        }
      } catch (e) {
        // swallow
      }
    })
  }

  // Log request start (respecting verbose flag)
  const isTest = process.env.NODE_ENV === 'test'
  const verboseTestLogging = process.env.TEST_VERBOSE_LOGGING === 'true'
  if (!isTest || verboseTestLogging) {
    log.info(
      {
        requestId,
        method: req.method,
        path: (req as any).path || (req as any).originalUrl || '',
        userAgent:
          typeof (req as any).get === 'function' ? (req as any).get('User-Agent') : req.headers?.['user-agent'],
        ip: req.ip,
      },
      'incoming request'
    )
  }

  // Aggregated minimal stats for tests
  try {
    const app = (req as any).app as Express | undefined
    if (app) {
      const stats = (app.locals as any)._requestStats || { totalRequests: 0, endpoints: {} }
      stats.totalRequests = (stats.totalRequests || 0) + 1
      const ep = (req as any).originalUrl || (req as any).url || '/'
      if (!stats.endpoints[ep]) stats.endpoints[ep] = { count: 0, totalDuration: 0, maxDuration: 0 }
      stats.endpoints[ep].count += 1
      ;(app.locals as any)._requestStats = stats
    }
  } catch (e) {
    // swallow
  }

  next()
}

export const logger = requestLogger

export function getRequestStats(app?: Express) {
  try {
    if (!app) return null
    return (app.locals as any)._requestStats || null
  } catch (e) {
    return null
  }
}

export function clearRequestStats(app?: Express) {
  try {
    if (!app) return
    delete (app.locals as any)._requestStats
  } catch (e) {
    // swallow
  }
}

import { Request, Response, NextFunction, Express } from 'express'
import { v4 as uuidv4 } from 'uuid'
import pino from 'pino'
import { MetricsService } from '../services/MetricsService'

// Create a logger instance depending on environment
let pinoLogger: any
let loggerInstance: any

if (process.env.NODE_ENV === 'test') {
  loggerInstance = {
    info: (...args: any[]) => console.info(...args),
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
    debug: (...args: any[]) => console.debug(...args),
  }
} else {
  try {
    pinoLogger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          ? { target: 'pino-pretty', options: { colorize: true } }
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
    loggerInstance = console
  }
}

export const log = loggerInstance

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers && (req.headers['x-request-id'] as string)) || uuidv4()
  ;(req as any).requestId = requestId

  const startTime = Date.now()
  const originalSend = res.send

  const shouldLogForDuration = (durMs: number) => {
    const isTest = process.env.NODE_ENV === 'test'
    const verboseTestLogging = process.env.TEST_VERBOSE_LOGGING === 'true'
    const testLogThresholdMs = Number(process.env.TEST_LOG_THRESHOLD_MS || '10')
    return !isTest || verboseTestLogging || (res.statusCode >= 400) || durMs >= testLogThresholdMs
  }

  const recordAndLog = (duration: number) => {
    try {
      const durationSec = duration / 1000
      if (shouldLogForDuration(duration)) {
        try {
          log.info(
            {
              requestId,
              method: req.method,
              path: (req as any).path || (req as any).originalUrl || '',
              status: res.statusCode,
              duration,
              userAgent:
                typeof (req as any).get === 'function' ? (req as any).get('User-Agent') : req.headers?.['user-agent'],
              ip: req.ip,
            },
            'request finished'
          )
        } catch (e) {
          // swallow logging errors in test/stubbed environments
        }
        try {
          MetricsService.trackApiRequest(req.method, req.path as any, res.statusCode, durationSec)
        } catch (e) {
          // swallow metrics errors
        }
      }
    } catch (e) {
      // swallow
    }
  }

  // Override send to detect responses directly
  if (typeof res.send === 'function') {
    res.send = function (chunk: any) {
      try {
        if (!res.locals) (res as any).locals = {}
        if (!res.locals.responseLogged) {
          const duration = Date.now() - startTime
          recordAndLog(duration)
          res.locals.responseLogged = true
        }
      } catch (e) {
        // swallow
      }
      return originalSend.call(this, chunk)
    }
  }

  // Also listen to finish in case send is not called directly
  if (typeof res.on === 'function') {
    res.on('finish', () => {
      try {
        if (!res.locals) (res as any).locals = {}
        if (!res.locals.responseLogged) {
          const duration = Date.now() - startTime
          recordAndLog(duration)
          res.locals.responseLogged = true
        }
      } catch (e) {
        // swallow
      }
    })
  }

  // Log request start (respecting verbose flag)
  const isTest = process.env.NODE_ENV === 'test'
  const verboseTestLogging = process.env.TEST_VERBOSE_LOGGING === 'true'
  if (!isTest || verboseTestLogging) {
    log.info(
      {
        requestId,
        method: req.method,
        path: (req as any).path || (req as any).originalUrl || '',
        userAgent:
          typeof (req as any).get === 'function' ? (req as any).get('User-Agent') : req.headers?.['user-agent'],
        ip: req.ip,
      },
      'incoming request'
    )
  }

  // Aggregated minimal stats for tests
  try {
    const app = (req as any).app as Express | undefined
    if (app) {
      const stats = (app.locals as any)._requestStats || { totalRequests: 0, endpoints: {} }
      stats.totalRequests = (stats.totalRequests || 0) + 1
      const ep = (req as any).originalUrl || (req as any).url || '/'
      if (!stats.endpoints[ep]) stats.endpoints[ep] = { count: 0, totalDuration: 0, maxDuration: 0 }
      stats.endpoints[ep].count += 1
      ;(app.locals as any)._requestStats = stats
    }
  } catch (e) {
    // swallow
  }

  next()
}

export const logger = requestLogger

export function getRequestStats(app?: Express) {
  try {
    if (!app) return null
    return (app.locals as any)._requestStats || null
  } catch (e) {
    return null
  }
}

export function clearRequestStats(app?: Express) {
  try {
    if (!app) return
    delete (app.locals as any)._requestStats
  } catch (e) {
    // swallow
  }
}
import { Request, Response, NextFunction, Express } from 'express'
import { v4 as uuidv4 } from 'uuid'
import pino from 'pino'
import { MetricsService } from '../services/MetricsService'

// Create a logger instance depending on environment
let pinoLogger: any
let loggerInstance: any

if (process.env.NODE_ENV === 'test') {
  loggerInstance = {
    info: (...args: any[]) => console.info(...args),
    warn: (...args: any[]) => console.warn(...args),
    error: (...args: any[]) => console.error(...args),
    debug: (...args: any[]) => console.debug(...args),
  }
} else {
  try {
    pinoLogger = pino({
      level: process.env.LOG_LEVEL || 'info',
      transport:
        process.env.NODE_ENV === 'development'
          *** End Patch
            log.info(
              {
                requestId,
                method: req.method,
                // req.path may be undefined in some test contexts; fall back to originalUrl
                path: (req as any).path || (req as any).originalUrl || '',
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

            // Track API request metrics
          } catch (e) {
            // Best-effort: swallow logging errors in stubbed environments
          }
          try {
            MetricsService.trackApiRequest(
              req.method,
              req.path,
              res.statusCode,
              durationSec
            )
          } catch (e) {
            // Best-effort: swallow metric tracking errors in stubbed environments
          }
          // Mark response as logged so we don't double log
          res.locals.responseLogged = true
      }
      return originalSend.call(this, chunk)
    }
  }

  // Also log on finish (for cases where send is not called directly)
  if (typeof res.on === 'function') {
    res.on('finish', () => {
      if (!res.locals) (res as any).locals = {}
      if (res.locals.responseLogged) return
      const duration = Date.now() - startTime
      const durationSec = duration / 1000

      try {
        const isTest = process.env.NODE_ENV === 'test'
        const verboseTestLogging = process.env.TEST_VERBOSE_LOGGING === 'true'
        const testLogThresholdMs = Number(process.env.TEST_LOG_THRESHOLD_MS || '10')
        const shouldLog =
          !isTest ||
          verboseTestLogging ||
          (res.statusCode >= 400) ||
          duration >= testLogThresholdMs

        if (shouldLog) {
          try {
            log.info(
              {
                requestId,
                method: req.method,
                path: (req as any).path || (req as any).originalUrl || '',
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
            // swallow logging errors
          }

          try {
            MetricsService.trackApiRequest(
              req.method,
              req.path,
              res.statusCode,
              durationSec
            )
          } catch (e) {
            // swallow metrics errors
          }
        }
      } catch (e) {
        // swallow errors to remain compatible with test stubs
      }
      res.locals.responseLogged = true
    })
  }

  // Log request start - but respect test verbosity settings to reduce noise
  const isTest = process.env.NODE_ENV === 'test'
  const verboseTestLogging = process.env.TEST_VERBOSE_LOGGING === 'true'
  if (!isTest || verboseTestLogging) {
    log.info(
      {
        requestId,
        method: req.method,
        path: (req as any).path || (req as any).originalUrl || '',
        userAgent:
          typeof (req as any).get === 'function'
            ? (req as any).get('User-Agent')
            : req.headers?.['user-agent'],
        ip: req.ip,
      },
      'incoming request'
    )
  }

  // Track minimal aggregated stats in app.locals for tests to assert or inspect
  try {
    const app = (req as any).app as Express | undefined
    if (app) {
      const stats = (app.locals as any)._requestStats || { totalRequests: 0, endpoints: {} }
      stats.totalRequests = (stats.totalRequests || 0) + 1
      const ep = (req as any).originalUrl || (req as any).url || '/' 
      if (!stats.endpoints[ep]) {
        stats.endpoints[ep] = { count: 0, totalDuration: 0, maxDuration: 0 }
      }
      stats.endpoints[ep].count += 1
      const existing = (app.locals as any)._requestStats || undefined
      ;(app.locals as any)._requestStats = stats
    }
  } catch (e) {
    // Swallow errors while updating aggregated stats
  }

  next()
}

// Backwards-compatibility: export 'logger' as the default middleware name used elsewhere in the code
export const logger = requestLogger

// Expose helpers for test harness to inspect/clear aggregated stats
export function getRequestStats(app?: Express) {
  try {
    if (!app) return null
    return (app.locals as any)._requestStats || null
  } catch (e) {
    return null
  }
}

export function clearRequestStats(app?: Express) {
  try {
    if (!app) return
    delete (app.locals as any)._requestStats
  } catch (e) {
    // swallow
  }
}
