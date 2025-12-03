"use strict";
/**
 * Cost-weighted rate limiting middleware
 * Implements tiered rate limiting based on endpoint cost and user tier
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCostWeightedRateLimiter = createCostWeightedRateLimiter;
exports.getEndpointCost = getEndpointCost;
exports.getRateLimitStatus = getRateLimitStatus;
var logger_1 = require("../middleware/logger");
var auth_1 = require("../models/auth");
var store = {};
// Cost multipliers by endpoint - higher = more restrictive
var ENDPOINT_COSTS = {
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
var TIER_LIMITS = {
    free: 50, // 50 points per 15 min
    paid: 500, // 500 points per 15 min
    premium: 1000, // 1000 points per 15 min
    enterprise: 5000, // 5000 points per 15 min
};
/**
 * Creates a cost-weighted rate limiter
 */
function createCostWeightedRateLimiter(options) {
    var windowMs = (options === null || options === void 0 ? void 0 : options.windowMs) || 15 * 60 * 1000; // 15 minutes default
    var defaultCost = (options === null || options === void 0 ? void 0 : options.defaultCost) || 1;
    return function (req, res, next) {
        var _a;
        // Get agency from request (assuming auth middleware runs first)
        var agencyId = (_a = req.agency) === null || _a === void 0 ? void 0 : _a.id;
        if (!agencyId) {
            // If no agency info, use basic rate limiting for unauthenticated endpoints
            return next();
        }
        // Determine endpoint cost
        var method = req.method;
        var path = req.path;
        var endpointKey = "".concat(method, ":").concat(path);
        // Find the most specific matching endpoint (supporting :id patterns)
        var cost = defaultCost;
        if (ENDPOINT_COSTS[endpointKey]) {
            cost = ENDPOINT_COSTS[endpointKey];
        }
        else {
            // Check for pattern matches (e.g., match /api/assets/workspace/123 with /api/assets/workspace/:id)
            for (var _i = 0, _b = Object.entries(ENDPOINT_COSTS); _i < _b.length; _i++) {
                var _c = _b[_i], pattern = _c[0], patternCost = _c[1];
                if (pathMatchesPattern(path, pattern.replace(/[^:]*:/, '').replace(/:[^/]+/g, ':id'))) {
                    cost = patternCost;
                    break;
                }
            }
        }
        // Get agency info to determine rate limit
        var agency = auth_1.AuthModel.getAgencyById(agencyId);
        var planType = (agency === null || agency === void 0 ? void 0 : agency.planType) || 'free';
        var maxPoints = (options === null || options === void 0 ? void 0 : options.maxPoints) || TIER_LIMITS[planType] || TIER_LIMITS.free;
        // Create rate limit key based on IP and agency
        var key = "".concat(req.ip, ":").concat(agencyId);
        var now = Date.now();
        // Initialize or get existing limit info
        if (!store[key] || now > store[key].resetTime) {
            store[key] = {
                count: 0,
                resetTime: now + windowMs,
                windowMs: windowMs,
            };
        }
        // Check if this request would exceed the limit
        var projectedCount = store[key].count + cost;
        if (projectedCount > maxPoints) {
            logger_1.log.info({
                agencyId: agencyId,
                ip: req.ip,
                endpoint: endpointKey,
                cost: cost,
                currentPoints: store[key].count,
                maxPoints: maxPoints,
                method: method,
                path: path
            }, 'Rate limit exceeded');
            return res.status(429).json({
                error: 'Rate limit exceeded',
                message: "Cost limit exceeded. Current: ".concat(store[key].count, "/").concat(maxPoints, " points. Request would add ").concat(cost, " points."),
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
        logger_1.log.info({
            agencyId: agencyId,
            ip: req.ip,
            endpoint: endpointKey,
            cost: cost,
            currentPoints: store[key].count,
            maxPoints: maxPoints,
            method: method,
            path: path
        }, 'Rate limit check passed');
        next();
    };
}
/**
 * Helper function to match route patterns with parameter placeholders
 */
function pathMatchesPattern(path, pattern) {
    // Replace dynamic segments like /api/assets/123 with /api/assets/:id for comparison
    var pathParts = path.split('/');
    var patternParts = pattern.split('/');
    if (pathParts.length !== patternParts.length) {
        return false;
    }
    for (var i = 0; i < pathParts.length; i++) {
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
function getEndpointCost(method, path) {
    var endpointKey = "".concat(method, ":").concat(path);
    return ENDPOINT_COSTS[endpointKey] || 1;
}
/**
 * Gets current rate limit status for an agency
 */
function getRateLimitStatus(agencyId, ip) {
    var key = "".concat(ip, ":").concat(agencyId);
    var limitInfo = store[key];
    if (!limitInfo) {
        return {
            currentPoints: 0,
            maxPoints: 0,
            resetTime: new Date(),
            windowMs: 0,
            remainingPoints: 0
        };
    }
    var agency = auth_1.AuthModel.getAgencyById(agencyId);
    var planType = (agency === null || agency === void 0 ? void 0 : agency.planType) || 'free';
    var maxPoints = TIER_LIMITS[planType] || TIER_LIMITS.free;
    return {
        currentPoints: limitInfo.count,
        maxPoints: maxPoints,
        resetTime: new Date(limitInfo.resetTime),
        windowMs: limitInfo.windowMs,
        remainingPoints: maxPoints - limitInfo.count
    };
}
