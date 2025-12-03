import { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const headerId = (req.headers['x-request-id'] as string) || ''
  const id = headerId || uuidv4()
  res.setHeader('X-Request-Id', id)
  ;(req as any).requestId = id
  next()
}

export default requestIdMiddleware
