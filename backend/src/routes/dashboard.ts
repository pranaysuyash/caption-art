/**
 * Dashboard Routes
 * API endpoints for analytics and metrics dashboard
 */

import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { AuthModel } from '../models/auth'
import { createAuthMiddleware } from '../routes/auth'
import { validateRequest } from '../middleware/validation'
import { log } from '../middleware/logger'
import { DashboardService } from '../services/DashboardService'
import { MetricsService } from '../services/MetricsService'
import { DashboardFilters } from '../services/DashboardService'

const router = Router()
const requireAuth = createAuthMiddleware() as any

// Validation schemas
const dashboardFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  timeRange: z.enum(['day', 'week', 'month', 'quarter']).optional(),
})

// GET /api/dashboard/stats - Get comprehensive dashboard statistics
router.get('/stats', requireAuth, validateRequest({ query: dashboardFiltersSchema }), async (req, res) => {
  try {
    const authenticatedReq = req as unknown as any
    const { startDate, endDate, timeRange } = req.query

    const filters = {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      timeRange: timeRange as 'day' | 'week' | 'month' | 'quarter' | undefined,
    }

    const stats = await DashboardService.getDashboardStats(authenticatedReq.agency.id, filters)

    res.json({ stats })
  } catch (error) {
    log.error({ err: error }, 'Dashboard stats API error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/dashboard/visualization - Get metrics suitable for visualization
router.get('/visualization', requireAuth, validateRequest({ query: dashboardFiltersSchema }), async (req, res) => {
  try {
    const authenticatedReq = req as unknown as any
    const { startDate, endDate, timeRange } = req.query

    const visualizationData = await DashboardService.getVisualizationMetrics(authenticatedReq.agency.id)

    res.json({ visualizationData })
  } catch (error) {
    log.error({ err: error }, 'Dashboard visualization API error')
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /api/dashboard/metrics - Get prometheus-formatted metrics
router.get('/metrics', (_req, res) => {
  try {
    const metrics = MetricsService.getMetrics()
    res.setHeader('Content-Type', 'text/plain')
    res.send(metrics)
  } catch (error) {
    log.error({ err: error }, 'Metrics endpoint error')
    res.status(500).json({ error: 'Failed to collect metrics' })
  }
})

export default router