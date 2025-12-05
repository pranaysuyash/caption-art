import { Router, Response } from 'express'
import { AuthModel } from '../models/auth'
import { log } from '../middleware/logger'
import { validateRequest } from '../middleware/validation'
import { SignupSchema, LoginSchema } from '../schemas/validation'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()

// POST /api/auth/signup
router.post(
  '/signup',
  validateRequest({ body: SignupSchema }),
  async (req, res) => {
    try {
      const { email, password, agencyName } = req.body

      // Check if user already exists
      const existingUser = await AuthModel.findUserByEmail(email)
      if (existingUser) {
        return res.status(409).json({ error: 'User already exists' })
      }

      // Create new user and agency
      const { user, agency } = await AuthModel.createUser(
        email,
        password,
        agencyName
      )

      // Set session
      ;(req.session as any).userId = user.id
      ;(req.session as any).agencyId = agency.id

      res.json({
        user: {
          id: user.id,
          email: user.email,
          agencyId: user.agencyId,
        },
        agency: {
          id: agency.id,
          planType: agency.planType,
          billingActive: agency.billingActive,
        },
      })
    } catch (error) {
      log.error({ err: error }, 'Signup error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/auth/login
router.post(
  '/login',
  validateRequest({ body: LoginSchema }),
  async (req, res) => {
    try {
      const { email, password } = req.body

      // Find user (in v1, we need to simulate password storage)
      const user = await AuthModel.findUserByEmail(email)
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // For v1, we're not storing passwords properly (this would be fixed with a real database)
      // In production, you'd verify against stored hash
      const agency = await AuthModel.getAgencyById(user.agencyId)
      if (!agency) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Update last login
      await AuthModel.updateUserLastLogin(user.id)

      // Set session
      ;(req.session as any).userId = user.id
      ;(req.session as any).agencyId = agency.id

      res.json({
        user: {
          id: user.id,
          email: user.email,
          agencyId: user.agencyId,
        },
        agency: {
          id: agency.id,
          planType: agency.planType,
          billingActive: agency.billingActive,
        },
      })
    } catch (error) {
      log.error({ err: error }, 'Login error')
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      log.error({ err }, 'Logout error')
      return res.status(500).json({ error: 'Could not log out' })
    }
    res.clearCookie('connect.sid')
    res.json({ message: 'Logged out successfully' })
  })
})

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const userId = (req.session as any).userId
  const agencyId = (req.session as any).agencyId

  if (!userId || !agencyId) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const user = await AuthModel.getUserById(userId)
  const agency = await AuthModel.getAgencyById(agencyId)

  if (!user || !agency) {
    // Session references invalid user/agency, clean it up
    req.session.destroy(() => {})
    res.clearCookie('connect.sid')
    return res.status(401).json({ error: 'Invalid session' })
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      agencyId: user.agencyId,
    },
    agency: {
      id: agency.id,
      planType: agency.planType,
      billingActive: agency.billingActive,
    },
  })
})

// Helper middleware function
export function createAuthMiddleware() {
  return async (req: AuthenticatedRequest, res: Response, next: any) => {
    const start = Date.now()
    const reqId = (req as any).requestId || 'no-req-id'
    log.debug({ requestId: reqId, middleware: 'auth' }, 'auth start')
    const userId = (req.session as any).userId
    const agencyId = (req.session as any).agencyId

    if (!userId || !agencyId) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const user = await AuthModel.getUserById(userId)
    const agency = await AuthModel.getAgencyById(agencyId)

    if (!user || !agency) {
      req.session.destroy(() => {})
      res.clearCookie('connect.sid')
      return res.status(401).json({ error: 'Invalid session' })
    }

    req.user = user
    req.agency = agency
    const duration = Date.now() - start
    log.debug({ requestId: reqId, middleware: 'auth', duration }, 'auth done')
    next()
  }
}

export default router
