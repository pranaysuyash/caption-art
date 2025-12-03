"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.log = void 0;
exports.requestLogger = requestLogger;
var uuid_1 = require("uuid");
var pino_1 = __importDefault(require("pino"));
var MetricsService_1 = require("../services/MetricsService");
// Import pino with better configuration
var pinoLogger;
var loggerInstance;
try {
    pinoLogger = (0, pino_1.default)({
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV === 'development'
            ? {
                target: 'pino-pretty',
                options: {
                    colorize: true,
                },
            }
            : undefined,
        formatters: {
            level: function (label) {
                return { level: label };
            },
        },
        timestamp: pino_1.default.stdTimeFunctions.isoTime,
    });
    loggerInstance = pinoLogger;
}
catch (err) {
    // fallback to console (console implements info/error/debug on Node)
    loggerInstance = console;
}
// Export the logger instance for use across the codebase
exports.log = loggerInstance;
// Enhanced middleware that adds request ID and logs request start and finish
function requestLogger(req, res, next) {
    var _a;
    // Add request ID if not already present
    var requestId = (req.headers && req.headers['x-request-id']) || (0, uuid_1.v4)();
    req.requestId = requestId;
    var startTime = Date.now();
    var originalSend = res.send;
    // Override response send to add logging context
    if (typeof res.send === 'function') {
        res.send = function (chunk) {
            var _a;
            // Ensure res.locals exists before using it
            if (!res.locals)
                res.locals = {};
            if (!res.locals.responseLogged) {
                var duration = Date.now() - startTime;
                var durationSec = duration / 1000;
                try {
                    exports.log.info({
                        requestId: requestId,
                        method: req.method,
                        path: req.path,
                        status: res.statusCode,
                        duration: duration,
                        userAgent: typeof req.get === 'function'
                            ? req.get('User-Agent')
                            : (_a = req.headers) === null || _a === void 0 ? void 0 : _a['user-agent'],
                        ip: req.ip,
                    }, 'request finished');
                    // Track API request metrics
                    MetricsService_1.MetricsService.trackApiRequest(req.method, req.path, res.statusCode, durationSec);
                }
                catch (e) {
                    // Best-effort: if logging fails in stubbed environments, swallow to avoid crashing tests
                }
                res.locals.responseLogged = true;
            }
            return originalSend.call(this, chunk);
        };
    }
    // Also log on finish (for cases where send is not called directly)
    if (typeof res.on === 'function') {
        res.on('finish', function () {
            var _a;
            if (!res.locals)
                res.locals = {};
            if (!res.locals.responseLogged) {
                var duration = Date.now() - startTime;
                var durationSec = duration / 1000;
                try {
                    exports.log.info({
                        requestId: requestId,
                        method: req.method,
                        path: req.path,
                        status: res.statusCode,
                        duration: duration,
                        userAgent: typeof req.get === 'function'
                            ? req.get('User-Agent')
                            : (_a = req.headers) === null || _a === void 0 ? void 0 : _a['user-agent'],
                        ip: req.ip,
                    }, 'request finished');
                    // Track API request metrics using the metrics service
                    MetricsService_1.MetricsService.trackApiRequest(req.method, req.path, res.statusCode, durationSec);
                }
                catch (e) {
                    // swallow errors to remain compatible with test stubs
                }
                res.locals.responseLogged = true;
            }
        });
    }
    // Log request start
    exports.log.info({
        requestId: requestId,
        method: req.method,
        path: req.path,
        userAgent: typeof req.get === 'function'
            ? req.get('User-Agent')
            : (_a = req.headers) === null || _a === void 0 ? void 0 : _a['user-agent'],
        ip: req.ip,
    }, 'incoming request');
    next();
}
// Backwards-compatibility: export 'logger' as the default middleware name used elsewhere in the code
exports.logger = requestLogger;
