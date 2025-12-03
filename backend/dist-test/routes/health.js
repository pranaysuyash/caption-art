"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var MetricsService_1 = require("../services/MetricsService");
var router = (0, express_1.Router)();
/**
 * GET /api/health
 * Returns service health status
 *
 * Response:
 * - status: 'healthy' | 'unhealthy' - Service status
 * - timestamp: string - Current timestamp in ISO format
 * - uptime: number - Process uptime in seconds
 */
router.get('/', function (req, res) {
    var response = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    };
    res.json(response);
});
/**
 * GET /api/health/metrics
 * Returns prometheus-formatted metrics
 */
router.get('/metrics', function (_req, res) {
    try {
        var metrics = MetricsService_1.MetricsService.getMetrics();
        res.setHeader('Content-Type', 'text/plain');
        res.send(metrics);
    }
    catch (error) {
        console.error('Metrics error:', error);
        res.status(500).json({ error: 'Failed to collect metrics' });
    }
});
exports.default = router;
