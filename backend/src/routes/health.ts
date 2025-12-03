import { Router, Request, Response } from 'express'
import { HealthResponse } from '../types/api'
import { MetricsService } from '../services/MetricsService'
import { log } from '../middleware/logger'

const router = Router()

/**
 * GET /api/health
 * Returns service health status
 *
 * Response:
 * - status: 'healthy' | 'unhealthy' - Service status
 * - timestamp: string - Current timestamp in ISO format
 * - uptime: number - Process uptime in seconds
 */
router.get('/', (req: Request, res: Response) => {
  const response: HealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }

  res.json(response)
})

/**
 * GET /api/health/metrics
 * Returns prometheus-formatted metrics
 */
router.get('/metrics', (_req: Request, res: Response) => {
  try {
    const metrics = MetricsService.getMetrics()
    res.setHeader('Content-Type', 'text/plain')
    res.send(metrics)
  } catch (error) {
    log.error({ err: error }, 'Failed to collect metrics')
    res.status(500).json({ error: 'Failed to collect metrics' })
  }
})

export default router
