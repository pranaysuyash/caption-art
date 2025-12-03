/**
 * Cost-weighted rate limiting middleware
 * Implements tiered rate limiting based on endpoint cost and user tier
 */

import { Request, Response, NextFunction } from 'express';
import rateLimit, { Options } from 'express-rate-limit';
import { log } from '../middleware/logger';
import { AuthModel } from '../models/auth';

// Memory store for rate limiting (in production, use Redis)
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
    windowMs: number;
  };
}

const store: RateLimitStore = {};

// Cost multipliers by endpoint - higher = more restrictive
const ENDPOINT_COSTS: { [key: string]: number } = {
  // Free endpoints (no external API calls)
  'GET:/api/health': 0.5,
  'GET:/api/workspaces': 0.5,
  'GET:/api/assets/workspace/:id': 0.5,
  'GET:/api/captions/workspace/:id': 0.5,

  // Medium cost (single AI call)
  'POST:/api/caption': 1,
  'POST:/api/mask': 1,
  
  // Higher cost (multiple AI calls + processing)
  'POST:/api/caption/batch': 3,
  'POST:/api/creative-engine/generate': 5,
  
  // Highest cost (comprehensive processing)
  'POST:/api/export/workspace/:id/start': 2, // Heavy file processing
};

// Default rate limits by user tier
const TIER_LIMITS: { [key: string]: number } = {
  free: 50,     // 50 points per 15 min
  paid: 500,    // 500 points per 15 min
  premium: 1000, // 1000 points per 15 min
  enterprise: 5000, // 5000 points per 15 min
};

export interface CostWeightedRateLimitOptions {
  windowMs?: number;    // Time window in milliseconds (default: 15 min)
  maxPoints?: number;   // Max total cost points per window
  defaultCost?: number; // Default cost for endpoints not in ENDPOINT_COSTS
  skipFailedRequests?: boolean; // Whether to skip cost if request fails validation
}

/**
 * Creates a cost-weighted rate limiter
 */
export function createCostWeightedRateLimiter(options?: CostWeightedRateLimitOptions) {
  const windowMs = options?.windowMs || 15 * 60 * 1000; // 15 minutes default
  const defaultCost = options?.defaultCost || 1;
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Get agency from request (assuming auth middleware runs first)
    const agencyId = (req as any).agency?.id;
    
    if (!agencyId) {
      // If no agency info, use basic rate limiting for unauthenticated endpoints
      return next();
    }

    // Determine endpoint cost
    const method = req.method;
    const path = req.path;
    const endpointKey = `${method}:${path}`;
    
    // Find the most specific matching endpoint (supporting :id patterns)
    let cost = defaultCost;
    if (ENDPOINT_COSTS[endpointKey]) {
      cost = ENDPOINT_COSTS[endpointKey];
    } else {
      // Check for pattern matches (e.g., match /api/assets/workspace/123 with /api/assets/workspace/:id)
      for (const [pattern, patternCost] of Object.entries(ENDPOINT_COSTS)) {
        if (pathMatchesPattern(path, pattern.replace(/[^:]*:/, '').replace(/:[^/]+/g, ':id'))) {
          cost = patternCost;
          break;
        }
      }
    }
    
    // Get agency info to determine rate limit
    const agency = AuthModel.getAgencyById(agencyId);
    const planType = agency?.planType || 'free';
    const maxPoints = options?.maxPoints || TIER_LIMITS[planType] || TIER_LIMITS.free;
    
    // Create rate limit key based on IP and agency
    const key = `${req.ip}:${agencyId}`;
    const now = Date.now();
    
    // Initialize or get existing limit info
    if (!store[key] || now > store[key].resetTime) {
      store[key] = {
        count: 0,
        resetTime: now + windowMs,
        windowMs,
      };
    }
    
    // Check if this request would exceed the limit
    const projectedCount = store[key].count + cost;
    
    if (projectedCount > maxPoints) {
      log.info({
        agencyId,
        ip: req.ip,
        endpoint: endpointKey,
        cost,
        currentPoints: store[key].count,
        maxPoints,
        method,
        path
      }, 'Rate limit exceeded');
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Cost limit exceeded. Current: ${store[key].count}/${maxPoints} points. Request would add ${cost} points.`,
        resetTime: new Date(store[key].resetTime).toISOString(),
        retryAfter: Math.ceil((store[key].resetTime - now) / 1000)
      });
    }
    
    // Add cost to current count and proceed
    store[key].count += cost;
    
    // Set response headers
    res.setHeader('X-RateLimit-Remaining', maxPoints - projectedCount);
    res.setHeader('X-RateLimit-Limit', maxPoints);
    res.setHeader('X-RateLimit-Reset', new Date(store[key].resetTime).toISOString());
    res.setHeader('X-RateLimit-Cost', cost);
    res.setHeader('X-RateLimit-Window', windowMs);
    
    log.info({
      agencyId,
      ip: req.ip,
      endpoint: endpointKey,
      cost,
      currentPoints: store[key].count,
      maxPoints,
      method,
      path
    }, 'Rate limit check passed');
    
    next();
  };
}

/**
 * Helper function to match route patterns with parameter placeholders
 */
function pathMatchesPattern(path: string, pattern: string): boolean {
  // Replace dynamic segments like /api/assets/123 with /api/assets/:id for comparison
  const pathParts = path.split('/');
  const patternParts = pattern.split('/');
  
  if (pathParts.length !== patternParts.length) {
    return false;
  }
  
  for (let i = 0; i < pathParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      // Dynamic segment - match anything
      continue;
    }
    if (pathParts[i] !== patternParts[i]) {
      return false;
    }
  }
  
  return true;
}

/**
 * Gets the cost of a specific endpoint
 */
export function getEndpointCost(method: string, path: string): number {
  const endpointKey = `${method}:${path}`;
  return ENDPOINT_COSTS[endpointKey] || 1;
}

/**
 * Gets current rate limit status for an agency
 */
export function getRateLimitStatus(agencyId: string, ip: string): {
  currentPoints: number;
  maxPoints: number;
  resetTime: Date;
  windowMs: number;
  remainingPoints: number;
} {
  const key = `${ip}:${agencyId}`;
  const limitInfo = store[key];
  
  if (!limitInfo) {
    return {
      currentPoints: 0,
      maxPoints: 0,
      resetTime: new Date(),
      windowMs: 0,
      remainingPoints: 0
    };
  }
  
  const agency = AuthModel.getAgencyById(agencyId);
  const planType = agency?.planType || 'free';
  const maxPoints = TIER_LIMITS[planType] || TIER_LIMITS.free;
  
  return {
    currentPoints: limitInfo.count,
    maxPoints,
    resetTime: new Date(limitInfo.resetTime),
    windowMs: limitInfo.windowMs,
    remainingPoints: maxPoints - limitInfo.count
  };
}