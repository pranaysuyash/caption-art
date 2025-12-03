"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wafMiddleware = wafMiddleware;
var config_1 = require("../config");
var logger_1 = require("./logger");
var suspiciousPatterns = [
    /<script\b[^>]*>([\s\S]*?)<\/script>/i,
    /\bUNION\b\s+SELECT\b/i,
    /\bDROP\b\s+TABLE\b/i,
    /\brm\s+-rf\b/i,
    /\bINSERT\b\s+INTO\b/i,
    /<iframe\b[^>]*>/i,
];
function wafMiddleware(req, res, next) {
    if (!config_1.config.waf || !config_1.config.waf.enable)
        return next();
    try {
        var bodyString = JSON.stringify(req.body || '');
        for (var _i = 0, suspiciousPatterns_1 = suspiciousPatterns; _i < suspiciousPatterns_1.length; _i++) {
            var p = suspiciousPatterns_1[_i];
            if (p.test(bodyString)) {
                logger_1.log.warn({ pattern: p.toString() }, 'WAF blocked request matching suspicious pattern');
                return res.status(400).json({ error: 'Request blocked by WAF' });
            }
        }
    }
    catch (err) {
        // If body can't be stringified, skip WAF check
        logger_1.log.warn('WAF skip: body stringify failed');
    }
    return next();
}
exports.default = wafMiddleware;
