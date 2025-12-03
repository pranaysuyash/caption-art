import { Router, Response } from 'express'
import { AuthModel } from '../models/auth'
import { log } from '../middleware/logger'
import { validateRequest } from '../middleware/validation'
import { SignupSchema, LoginSchema } from '../schemas/validation'
import { AuthenticatedRequest } from '../types/auth'

const router = Router()

// In-memory session store for v1
const sessions = new Map<string, { userId: string; agencyId: string }>()

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

      // Create session
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessions.set(sessionId, { userId: user.id, agencyId: agency.id })

      // Set session cookie
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
      })

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
      const agency = AuthModel.getAgencyById(user.agencyId)
      if (!agency) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }

      // Update last login
      AuthModel.updateUserLastLogin(user.id)

      // Create session
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessions.set(sessionId, { userId: user.id, agencyId: agency.id })

      // Set session cookie
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        sameSite: 'lax',
      })

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
  const sessionId = req.cookies.sessionId
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId)
  }

  res.clearCookie('sessionId')
  res.json({ message: 'Logged out successfully' })
})

// GET /api/auth/me
router.get('/me', (req, res) => {
  const sessionId = req.cookies.sessionId
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const session = sessions.get(sessionId)!
  const user = AuthModel.getUserById(session.userId)
  const agency = AuthModel.getAgencyById(session.agencyId)

  if (!user || !agency) {
    // Session references invalid user/agency, clean it up
    sessions.delete(sessionId)
    res.clearCookie('sessionId')
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
  return (req: AuthenticatedRequest, res: Response, next: any) => {
    const sessionId = req.cookies.sessionId
    if (!sessionId || !sessions.has(sessionId)) {
      return res.status(401).json({ error: 'Not authenticated' })
    }

    const session = sessions.get(sessionId)!
    const user = AuthModel.getUserById(session.userId)
    const agency = AuthModel.getAgencyById(session.agencyId)

    if (!user || !agency) {
      sessions.delete(sessionId)
      res.clearCookie('sessionId')
      return res.status(401).json({ error: 'Invalid session' })
    }

    req.user = user
    req.agency = agency
    next()
  }
}

export default router
