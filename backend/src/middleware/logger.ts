import { Express, NextFunction, Request, Response } from 'express'
import pino from 'pino'

const isTestEnv = process.env.NODE_ENV === 'test'
const testVerboseLogging = process.env.TEST_VERBOSE_LOGGING === 'true'
const logThresholdMs = Number(process.env.TEST_LOG_THRESHOLD_MS ?? '250')

// In tests, vitest spies are attached to console.log/console.error. To keep
// assertions simple we map info->console.log and warn/error to console.warn/console.error.
// Outside tests we delegate to pino for structured logging.
const consoleLogger = {
  info: (...args: any[]) => console.log(...args),
  warn: (...args: any[]) => console.warn(...args),
  error: (...args: any[]) => console.error(...args),
  debug: (...args: any[]) => console.debug(...args),
}

const baseLogger = isTestEnv
  ? consoleLogger
  : pino({ level: process.env.LOG_LEVEL ?? 'info' })
export const log = baseLogger

export type RequestMetrics = {
  method: string
  path: string
  statusCode: number
  durationMs: number
}

type AggregatedStats = {
  requests: RequestMetrics[]
  slowRequests: RequestMetrics[]
}

const aggregatedStats: AggregatedStats = {
  requests: [],
  slowRequests: [],
}

const shouldLogForDuration = (durationMs: number) =>
  durationMs >= logThresholdMs

export const clearRequestStats = (app?: Express) => {
  if (app) {
    delete (app.locals as any)._requestStats
    return
  }

  aggregatedStats.requests = []
  aggregatedStats.slowRequests = []
}

export const getRequestStats = (app?: Express) => {
  if (app) {
    const stats = (app.locals as any)._requestStats as
      | AggregatedStats
      | undefined
    if (!stats) return null
    return {
      requests: [...(stats.requests ?? [])],
      slowRequests: [...(stats.slowRequests ?? [])],
    }
  }

  return {
    requests: [...aggregatedStats.requests],
    slowRequests: [...aggregatedStats.slowRequests],
  }
}

const recordAndLog = (metrics: RequestMetrics) => {
  aggregatedStats.requests.push(metrics)
  if (shouldLogForDuration(metrics.durationMs)) {
    aggregatedStats.slowRequests.push(metrics)
  }

  const ts = new Date().toISOString()
  const status = metrics.statusCode
  const duration = metrics.durationMs
  const message = `[${ts}] ${metrics.method} ${metrics.path} ${status} ${duration.toFixed(2)}ms`

  const logPayload = { ...metrics, status, duration, ts }

  if (!isTestEnv) {
    baseLogger.info({ ...logPayload, type: 'request' }, message)
    return
  }

  // In tests, always emit a human-readable log line so console spies pick it up
  // and property tests can assert on method/path/status/duration.
  baseLogger.info(logPayload, message)
}

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = performance.now()
  const path = (req as any).path ?? req.originalUrl ?? req.url ?? ''
  const tsStart = new Date().toISOString()
  const startMsg = `[${tsStart}] ${req.method} ${path} start`
  baseLogger.info(
    {
      method: req.method,
      path,
      requestId: (req as any).requestId,
      ts: tsStart,
    },
    startMsg
  )

  res.on('finish', () => {
    const durationMs = performance.now() - start
    const metrics: RequestMetrics = {
      method: req.method,
      path,
      statusCode: res.statusCode,
      durationMs,
    }
    recordAndLog(metrics)

    // Keep optional per-app stats for tests that inspect app.locals
    const app = req.app as Express | undefined
    if (app) {
      const stats: AggregatedStats = (app.locals as any)._requestStats || {
        requests: [],
        slowRequests: [],
      }
      stats.requests.push(metrics)
      if (shouldLogForDuration(metrics.durationMs)) {
        stats.slowRequests.push(metrics)
      }
      ;(app.locals as any)._requestStats = stats
    }
  })

  next()
}

export const logger = requestLogger
export default requestLogger
