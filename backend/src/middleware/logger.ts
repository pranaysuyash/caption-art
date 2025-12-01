import { Request, Response, NextFunction } from 'express'

/**
 * Logger middleware that logs all requests with timestamp, method, path, and response time
 */
export function logger(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now()
  const timestamp = new Date().toISOString()

  // Log request
  console.log(`[${timestamp}] ${req.method} ${req.path}`)

  // Capture response finish event to log response time
  res.on('finish', () => {
    const duration = Date.now() - startTime
    const finishTimestamp = new Date().toISOString()
    console.log(
      `[${finishTimestamp}] ${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`
    )
  })

  next()
}
