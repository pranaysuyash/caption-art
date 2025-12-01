import { Router, Request, Response } from 'express'
import { HealthResponse } from '../types/api'

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

export default router
