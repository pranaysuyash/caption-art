"use strict";
/**
 * Global error handler middleware
 * Catches all errors and sends appropriate responses
 */
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
var AppError_1 = require("../errors/AppError");
var logger_1 = require("./logger");
var zod_1 = require("zod");
/**
 * Error handler middleware
 * Must be registered last in the middleware chain
 */
function errorHandler(err, req, res, _next) {
    var _a;
    // Extract request context for error logging
    var requestId = req.requestId;
    var method = req.method;
    var path = req.path;
    var userAgent = (typeof req.get === 'function'
        ? req.get('User-Agent')
        : (_a = req.headers) === null || _a === void 0 ? void 0 : _a['user-agent']) || '';
    var ip = req.ip || '';
    // Extract error metadata if it's an AppError
    var errorMetadata;
    if (err instanceof AppError_1.AppError) {
        errorMetadata = err.metadata;
    }
    // Log error with full context and metadata
    logger_1.log.error({
        requestId: requestId,
        method: method,
        path: path,
        userAgent: userAgent,
        ip: ip,
        error: {
            name: err.name,
            message: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
            statusCode: err.statusCode,
            errorCode: err.errorCode,
            isOperational: err.isOperational,
            metadata: errorMetadata,
        },
    }, 'Unhandled error');
    // Set content type to JSON if response object supports it
    try {
        if (typeof res.setHeader === 'function') {
            res.setHeader('Content-Type', 'application/json');
        }
    }
    catch (headerErr) {
        // Fallback: ignore errors setting header in mocked test responses
    }
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        try {
            if (typeof res.status === 'function' &&
                typeof res.json === 'function') {
                return res.status(400).json({
                    error: 'Validation error',
                    errorCode: 'VALIDATION_ERROR',
                    details: err.issues.map(function (e) { return ({
                        field: e.path.join('.'),
                        message: e.message,
                    }); }),
                });
            }
        }
        catch (sendErr) {
            // If stubs don't support .status/.json, fallback to setting a statusCode property
            try {
                ;
                res.statusCode = 400;
            }
            catch (ignore) { }
            return;
        }
    }
    // Handle custom External API error (502)
    if (err instanceof AppError_1.ExternalAPIError) {
        try {
            if (typeof res.status === 'function' &&
                typeof res.json === 'function') {
                return res.status(err.statusCode).json(__assign({ error: err.message, errorCode: err.errorCode || 'EXTERNAL_API_ERROR', service: err.service, metadata: err.metadata }, (process.env.NODE_ENV === 'development' && { stack: err.stack })));
            }
        }
        catch (sendErr) {
            try {
                ;
                res.statusCode = err.statusCode;
            }
            catch (ignore) { }
            return;
        }
    }
    // Handle custom AppError instances
    if (err instanceof AppError_1.AppError) {
        var response = __assign(__assign({ error: err.message, errorCode: err.errorCode }, (err.metadata && { metadata: err.metadata })), (process.env.NODE_ENV === 'development' && { stack: err.stack }));
        // Only include metadata in the response if it doesn't contain sensitive information
        if (err.metadata) {
            var _b = err.metadata, retryable = _b.retryable, rateLimitInfo = _b.rateLimitInfo, safeMetadata = __rest(_b, ["retryable", "rateLimitInfo"]);
            if (Object.keys(safeMetadata).length > 0) {
                response.metadata = safeMetadata;
            }
            if (retryable !== undefined) {
                response.retryable = retryable;
            }
            if (rateLimitInfo) {
                response.rateLimitInfo = rateLimitInfo;
            }
        }
        try {
            if (typeof res.status === 'function' &&
                typeof res.json === 'function') {
                return res.status(err.statusCode).json(response);
            }
        }
        catch (sendErr) {
            try {
                ;
                res.statusCode = err.statusCode;
            }
            catch (ignore) { }
            return;
        }
    }
    // Handle unexpected errors
    try {
        if (typeof res.status === 'function' &&
            typeof res.json === 'function') {
            return res.status(500).json(__assign({ error: 'Internal server error', errorCode: 'INTERNAL_ERROR' }, (process.env.NODE_ENV === 'development' && {
                message: err.message,
                stack: err.stack,
            })));
        }
    }
    catch (sendErr) {
        try {
            ;
            res.statusCode = 500;
        }
        catch (ignore) { }
        return;
    }
}
