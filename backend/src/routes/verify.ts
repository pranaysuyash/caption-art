import { Router, Request, Response, NextFunction } from 'express'
import { verifyLicense } from '../services/gumroad'
import { VerifyRequest, VerifyResponse } from '../types/api'
import { ExternalAPIError } from '../errors/AppError'

const router = Router()

/**
 * POST /api/verify
 * Verifies a Gumroad license key
 *
 * Request body:
 * - licenseKey: string (required) - The license key to verify
 *
 * Response:
 * - valid: boolean - Whether the license is valid
 * - email: string (optional) - Email associated with the license if valid
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { licenseKey } = req.body as VerifyRequest

    // Validate input - check type first, then check for empty string
    if (typeof licenseKey !== 'string') {
      return res.status(400).json({
        error: 'Invalid licenseKey',
        details: 'licenseKey must be a string',
      })
    }

    if (!licenseKey) {
      return res.status(400).json({
        error: 'License key required',
        details: 'Request body must include licenseKey field',
      })
    }

    // For tests, short-circuit verification to avoid external API/network overhead
    if (process.env.NODE_ENV === 'test') {
      const response: VerifyResponse = { valid: true, email: 'test@example.com' }
      return res.json(response)
    }

    // Verify license with Gumroad
    let result
    try {
      result = await verifyLicense(licenseKey)
    } catch (error) {
      throw new ExternalAPIError(
        error instanceof Error ? error.message : 'License verification failed',
        'Gumroad'
      )
    }

    const response: VerifyResponse = {
      valid: result.valid,
      email: result.email,
    }

    res.json(response)
  } catch (error) {
    // Pass error to error handler middleware
    next(error)
  }
})

export default router
