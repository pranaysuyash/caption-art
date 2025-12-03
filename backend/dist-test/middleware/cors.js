"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsMiddleware = corsMiddleware;
var config_1 = require("../config");
var logger_1 = require("./logger");
/**
 * CORS middleware that handles cross-origin requests
 * Configures CORS headers based on environment variables
 */
function corsMiddleware(req, res, next) {
    var origin = config_1.config.cors.origin;
    // Protect: in production, explicit allowlist only. Deny wildcard if present to avoid accidental wide-open CORS.
    if (origin === '*' && process.env.NODE_ENV === 'production') {
        // Security: wildcard origin not permitted in production - block cross-origin requests
        var message = 'Wildcard CORS not allowed in production. Set explicit CORS_ORIGIN.';
        logger_1.log.warn(message);
        if (req.headers.origin) {
            res.status(403).json({ error: message });
            return;
        }
    }
    // Set CORS headers
    if (Array.isArray(origin)) {
        var requestOrigin = req.headers.origin;
        if (requestOrigin && origin.includes(requestOrigin)) {
            res.setHeader('Access-Control-Allow-Origin', requestOrigin);
        }
    }
    else {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    next();
}
