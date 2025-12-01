import { Request } from 'express'
import { User, Agency } from '../models/auth'

export interface AuthenticatedRequest extends Request {
  user: User
  agency: Agency
}
