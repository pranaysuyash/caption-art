"use strict";
/**
 * Metrics Service
 * Implements application metrics collection for observability
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
var InMemoryMetricsRegistry = /** @class */ (function () {
    function InMemoryMetricsRegistry() {
        this.counters = new Map(); // name -> labelKey -> value
        this.gauges = new Map();
        this.histograms = new Map(); // Store all observed values
    }
    InMemoryMetricsRegistry.prototype.incrementCounter = function (name, labels, value) {
        if (labels === void 0) { labels = {}; }
        if (value === void 0) { value = 1; }
        var labelKey = this.getLabelKey(labels);
        var map = this.counters.get(name);
        if (!map) {
            map = new Map();
            this.counters.set(name, map);
        }
        var currentValue = map.get(labelKey) || 0;
        map.set(labelKey, currentValue + value);
    };
    InMemoryMetricsRegistry.prototype.setGauge = function (name, value, labels) {
        if (labels === void 0) { labels = {}; }
        var labelKey = this.getLabelKey(labels);
        var map = this.gauges.get(name);
        if (!map) {
            map = new Map();
            this.gauges.set(name, map);
        }
        map.set(labelKey, value);
    };
    InMemoryMetricsRegistry.prototype.observeHistogram = function (name, value, labels) {
        if (labels === void 0) { labels = {}; }
        var labelKey = this.getLabelKey(labels);
        var map = this.histograms.get(name);
        if (!map) {
            map = new Map();
            this.histograms.set(name, map);
        }
        var currentValues = map.get(labelKey) || [];
        currentValues.push(value);
        map.set(labelKey, currentValues);
    };
    InMemoryMetricsRegistry.prototype.getMetrics = function () {
        var metrics = [];
        // Format counters
        for (var _i = 0, _a = this.counters.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], name_1 = _b[0], counterMap = _b[1];
            metrics.push("# TYPE ".concat(name_1, " counter"));
            for (var _c = 0, _d = counterMap.entries(); _c < _d.length; _c++) {
                var _e = _d[_c], labelKey = _e[0], value = _e[1];
                var labels = this.parseLabelKey(labelKey);
                var labelsStr = labels ? "{".concat(Object.entries(labels).map(function (_a) {
                    var k = _a[0], v = _a[1];
                    return "".concat(k, "=\"").concat(v, "\"");
                }).join(','), "}") : '';
                metrics.push("".concat(name_1).concat(labelsStr, " ").concat(value));
            }
        }
        // Format gauges
        for (var _f = 0, _g = this.gauges.entries(); _f < _g.length; _f++) {
            var _h = _g[_f], name_2 = _h[0], gaugeMap = _h[1];
            metrics.push("# TYPE ".concat(name_2, " gauge"));
            for (var _j = 0, _k = gaugeMap.entries(); _j < _k.length; _j++) {
                var _l = _k[_j], labelKey = _l[0], value = _l[1];
                var labels = this.parseLabelKey(labelKey);
                var labelsStr = labels ? "{".concat(Object.entries(labels).map(function (_a) {
                    var k = _a[0], v = _a[1];
                    return "".concat(k, "=\"").concat(v, "\"");
                }).join(','), "}") : '';
                metrics.push("".concat(name_2).concat(labelsStr, " ").concat(value));
            }
        }
        // Format histograms (simplified - just count, sum, and basic quantiles)
        for (var _m = 0, _o = this.histograms.entries(); _m < _o.length; _m++) {
            var _p = _o[_m], name_3 = _p[0], histogramMap = _p[1];
            metrics.push("# TYPE ".concat(name_3, "_count counter"));
            metrics.push("# TYPE ".concat(name_3, "_sum counter"));
            metrics.push("# TYPE ".concat(name_3, "_avg gauge"));
            for (var _q = 0, _r = histogramMap.entries(); _q < _r.length; _q++) {
                var _s = _r[_q], labelKey = _s[0], values = _s[1];
                var labels = this.parseLabelKey(labelKey);
                var labelsStr = labels ? "{".concat(Object.entries(labels).map(function (_a) {
                    var k = _a[0], v = _a[1];
                    return "".concat(k, "=\"").concat(v, "\"");
                }).join(','), "}") : '';
                var count = values.length;
                var sum = values.reduce(function (a, b) { return a + b; }, 0);
                var avg = count > 0 ? sum / count : 0;
                metrics.push("".concat(name_3, "_count").concat(labelsStr, " ").concat(count));
                metrics.push("".concat(name_3, "_sum").concat(labelsStr, " ").concat(sum));
                metrics.push("".concat(name_3, "_avg").concat(labelsStr, " ").concat(avg.toFixed(2)));
            }
        }
        return metrics.join('\n') + '\n';
    };
    InMemoryMetricsRegistry.prototype.getLabelKey = function (labels) {
        return Object.entries(labels)
            .sort(function (_a, _b) {
            var a = _a[0];
            var b = _b[0];
            return a.localeCompare(b);
        })
            .map(function (_a) {
            var k = _a[0], v = _a[1];
            return "".concat(k, "=").concat(v);
        })
            .join('|');
    };
    InMemoryMetricsRegistry.prototype.parseLabelKey = function (labelKey) {
        if (!labelKey)
            return null;
        var labels = {};
        if (labelKey) {
            labelKey.split('|').forEach(function (pair) {
                var _a = pair.split('='), k = _a[0], v = _a[1];
                if (k && v) {
                    labels[k] = v;
                }
            });
        }
        return labels;
    };
    return InMemoryMetricsRegistry;
}());
var registry = new InMemoryMetricsRegistry();
var MetricsService = /** @class */ (function () {
    function MetricsService() {
    }
    /**
     * Track API request
     */
    MetricsService.trackApiRequest = function (method, route, statusCode, durationSec) {
        registry.incrementCounter('api_requests_total', { method: method, route: route, status_code: statusCode.toString() }, 1);
        registry.observeHistogram('api_request_duration_seconds', durationSec, { method: method, route: route, status_code: statusCode.toString() });
    };
    /**
     * Track caption generation
     */
    MetricsService.trackCaptionGeneration = function (workspaceId, campaignId, durationSec) {
        registry.incrementCounter('caption_generations_total', { workspace_id: workspaceId, campaign_id: campaignId || 'none' }, 1);
        registry.observeHistogram('caption_generation_duration_seconds', durationSec, {
            workspace_id: workspaceId,
            campaign_id: campaignId || 'none'
        });
    };
    /**
     * Track ad creative generation
     */
    MetricsService.trackAdCreativeGeneration = function (workspaceId, campaignId, durationSec) {
        registry.incrementCounter('ad_creative_generations_total', {
            workspace_id: workspaceId,
            campaign_id: campaignId || 'none'
        }, 1);
    };
    /**
     * Track cache operation
     */
    MetricsService.trackCacheOperation = function (cacheType, isHit) {
        if (isHit) {
            registry.incrementCounter('cache_hits_total', { cache_type: cacheType }, 1);
        }
        else {
            registry.incrementCounter('cache_misses_total', { cache_type: cacheType }, 1);
        }
    };
    /**
     * Track export job
     */
    MetricsService.trackExportJob = function (workspaceId, status) {
        registry.incrementCounter('export_jobs_total', { workspace_id: workspaceId, status: status }, 1);
    };
    /**
     * Track rate limit exceeded
     */
    MetricsService.trackRateLimitExceeded = function (endpoint, userId) {
        registry.incrementCounter('rate_limit_exceeded_total', { endpoint: endpoint, user_id: userId }, 1);
    };
    /**
     * Track template learning event
     */
    MetricsService.trackTemplateLearning = function (workspaceId, templateCount) {
        registry.incrementCounter('template_learning_events_total', { workspace_id: workspaceId }, 1);
        registry.setGauge('active_templates_count', templateCount, { workspace_id: workspaceId });
    };
    /**
     * Track style profile creation
     */
    MetricsService.trackStyleProfileCreation = function (workspaceId, profileCount) {
        registry.incrementCounter('style_profiles_created_total', { workspace_id: workspaceId }, 1);
        registry.setGauge('active_style_profiles_count', profileCount, { workspace_id: workspaceId });
    };
    /**
     * Get prometheus-formatted metrics
     */
    MetricsService.getMetrics = function () {
        return registry.getMetrics();
    };
    /**
     * Track API request with duration
     */
    MetricsService.trackApiRequest = function (method, route, statusCode, durationSec) {
        registry.incrementCounter('api_requests_total', { method: method, route: route, status_code: statusCode.toString() }, 1);
        registry.observeHistogram('api_request_duration_seconds', durationSec, { method: method, route: route, status_code: statusCode.toString() });
    };
    /**
     * Create a timer for measuring durations
     */
    MetricsService.createTimer = function () {
        var _this = this;
        var start = Date.now();
        return {
            end: function (labels) {
                var durationSec = (Date.now() - start) / 1000;
                if (labels && labels.method && labels.route && labels.status_code) {
                    _this.trackApiRequest(labels.method, labels.route, parseInt(labels.status_code), durationSec);
                }
                return durationSec;
            }
        };
    };
    /**
     * Track cache operation (hit/miss) for performance metrics
     */
    MetricsService.trackCacheOperation = function (cacheType, isHit) {
        if (isHit) {
            registry.incrementCounter('cache_hits_total', { cache_type: cacheType }, 1);
        }
        else {
            registry.incrementCounter('cache_misses_total', { cache_type: cacheType }, 1);
        }
    };
    /**
     * Track export job status for metrics
     */
    MetricsService.trackExportJob = function (workspaceId, status) {
        registry.incrementCounter('export_jobs_total', { workspace_id: workspaceId, status: status }, 1);
    };
    /**
     * Track template learning event
     */
    MetricsService.trackTemplateLearning = function (workspaceId, templateCount) {
        registry.incrementCounter('template_learning_events_total', { workspace_id: workspaceId }, 1);
        registry.setGauge('active_templates_count', templateCount, { workspace_id: workspaceId });
    };
    /**
     * Track style profile creation
     */
    MetricsService.trackStyleProfileCreation = function (workspaceId, profileCount) {
        registry.incrementCounter('style_profiles_created_total', { workspace_id: workspaceId }, 1);
        registry.setGauge('active_style_profiles_count', profileCount, { workspace_id: workspaceId });
    };
    return MetricsService;
}());
exports.MetricsService = MetricsService;
