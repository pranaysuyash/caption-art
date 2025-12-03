"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables before anything else
dotenv_1.default.config();
var express_1 = __importDefault(require("express"));
var cookie_parser_1 = __importDefault(require("cookie-parser"));
var path_1 = __importDefault(require("path"));
var config_1 = require("./config");
var cors_1 = require("./middleware/cors");
var requestId_1 = require("./middleware/requestId");
var waf_1 = require("./middleware/waf");
var errorHandler_1 = require("./middleware/errorHandler");
var logger_1 = require("./middleware/logger");
// import { rateLimiter } from './middleware/rateLimiter'
var costWeightedRateLimiter_1 = require("./middleware/costWeightedRateLimiter");
var auth_1 = __importDefault(require("./routes/auth"));
var workspaces_1 = __importDefault(require("./routes/workspaces"));
var brandKits_1 = __importDefault(require("./routes/brandKits"));
var assets_1 = __importDefault(require("./routes/assets"));
var batch_1 = __importDefault(require("./routes/batch"));
var approval_1 = __importDefault(require("./routes/approval"));
var export_1 = __importDefault(require("./routes/export"));
var auth_2 = require("./routes/auth");
var exportService_1 = require("./services/exportService");
var auth_3 = require("./models/auth");
var generatedAssets_1 = __importDefault(require("./routes/generatedAssets"));
var caption_1 = __importDefault(require("./routes/caption"));
var mask_1 = __importDefault(require("./routes/mask"));
var verify_1 = __importDefault(require("./routes/verify"));
var health_1 = __importDefault(require("./routes/health"));
var story_1 = __importDefault(require("./routes/story"));
var campaigns_1 = __importDefault(require("./routes/campaigns"));
var referenceCreatives_1 = __importDefault(require("./routes/referenceCreatives"));
var creativeEngine_1 = __importDefault(require("./routes/creativeEngine"));
var analyzeStyle_1 = __importDefault(require("./routes/analyzeStyle"));
var campaignBriefs_1 = __importDefault(require("./routes/campaignBriefs"));
var adCreatives_1 = __importDefault(require("./routes/adCreatives"));
var styleMemory_1 = __importDefault(require("./routes/styleMemory"));
var videoScripts_1 = __importDefault(require("./routes/videoScripts"));
var multiFormat_1 = __importDefault(require("./routes/multiFormat"));
var styleSynthesis_1 = __importDefault(require("./routes/styleSynthesis"));
// Global route registry to make route information accessible across functions
var globalMountedRoutes = [];
function createServer(options) {
    var _this = this;
    if (options === void 0) { options = {}; }
    var _a = options.enableRateLimiter, enableRateLimiter = _a === void 0 ? true : _a;
    var app = (0, express_1.default)();
    // Reset the global mounted routes for each server instance
    globalMountedRoutes = [];
    // Monkeypatch app.use to record mount paths and inner routes
    var originalUse = app.use.bind(app);
    app.use = function useWrapper() {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        try {
            if (args.length >= 2 && typeof args[0] === 'string' && args[1]) {
                var mount = args[0];
                var handler = args[1];
                var innerRoutes = [];
                // Try to extract inner routes from the handler/router
                if (handler && typeof handler === 'object') {
                    if (Array.isArray(handler.stack)) {
                        for (var _a = 0, _b = handler.stack; _a < _b.length; _a++) {
                            var l = _b[_a];
                            if (l && l.route && l.route.path) {
                                var methods = Object.keys(l.route.methods || {});
                                for (var _c = 0, methods_1 = methods; _c < methods_1.length; _c++) {
                                    var m = methods_1[_c];
                                    innerRoutes.push({
                                        method: m.toUpperCase(),
                                        path: l.route.path,
                                    });
                                }
                            }
                        }
                    }
                    // Check for symbol-backed stacks (Express may use Symbols)
                    var syms = Object.getOwnPropertySymbols(handler);
                    for (var _d = 0, syms_1 = syms; _d < syms_1.length; _d++) {
                        var s = syms_1[_d];
                        var val = handler[s];
                        if (val && Array.isArray(val.stack)) {
                            for (var _e = 0, _f = val.stack; _e < _f.length; _e++) {
                                var l = _f[_e];
                                if (l && l.route && l.route.path) {
                                    var methods = Object.keys(l.route.methods || {});
                                    for (var _g = 0, methods_2 = methods; _g < methods_2.length; _g++) {
                                        var m = methods_2[_g];
                                        innerRoutes.push({
                                            method: m.toUpperCase(),
                                            path: l.route.path,
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                globalMountedRoutes.push({
                    mount: mount,
                    innerRoutes: innerRoutes.length ? innerRoutes : undefined,
                });
            }
        }
        catch (err) {
            logger_1.log.error({ err: err }, 'Failed to extract inner routes from handler');
        }
        return originalUse.apply(void 0, args);
    };
    // Helper: attempt to find where the router stack is stored on the app
    var findRouterStack = function () {
        var candidates = ['_router', 'router', 'handle'];
        for (var _i = 0, candidates_1 = candidates; _i < candidates_1.length; _i++) {
            var c = candidates_1[_i];
            var obj = app[c];
            if (obj && typeof obj === 'object' && Array.isArray(obj.stack)) {
                return { prop: c, stack: obj.stack };
            }
        }
        // fallback: search any property with a stack array
        for (var _a = 0, _b = Object.getOwnPropertyNames(app); _a < _b.length; _a++) {
            var p = _b[_a];
            var v = app[p];
            if (v && typeof v === 'object' && Array.isArray(v.stack)) {
                return { prop: p, stack: v.stack };
            }
        }
        return { prop: undefined, stack: [] };
    };
    // Middleware - order matters!
    // 1. CORS must be first to handle preflight requests
    app.use(cors_1.corsMiddleware);
    // 1b. WAF middleware to block known suspicious payloads when enabled
    app.use(waf_1.wafMiddleware);
    // 2. Request id assignment and Logger to track all requests
    app.use(requestId_1.requestIdMiddleware);
    app.use(logger_1.requestLogger);
    // 3. Cookie parser for session management
    app.use((0, cookie_parser_1.default)());
    // 4. JSON body parser
    app.use(express_1.default.json({ limit: '10mb' }));
    // 5. Serve static files from uploads and generated directories
    app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
    app.use('/generated', express_1.default.static(path_1.default.join(process.cwd(), 'generated')));
    // 6. Cost-weighted rate limiter for API routes (can be disabled for testing)
    if (enableRateLimiter) {
        var costWeightedRateLimiter = (0, costWeightedRateLimiter_1.createCostWeightedRateLimiter)({
            windowMs: 15 * 60 * 1000, // 15 minutes
            maxPoints: 500, // Default max points, will be adjusted based on user tier
        });
        app.use('/api/', costWeightedRateLimiter);
    }
    // Routes (auth first, then workspaces, brand kits, assets, batch, approval, export, generated assets, then existing routes)
    app.use('/api/auth', auth_1.default);
    app.use('/api/workspaces', workspaces_1.default);
    app.use('/api/brand-kits', brandKits_1.default);
    app.use('/api/assets', assets_1.default);
    app.use('/api/batch', batch_1.default);
    app.use('/api/approval', approval_1.default);
    // Fallback server-level POST route for starting export, to prevent 404 when router route matching fails for POST. This duplicates exportRouter POST handler for now.
    var requireAuthInline = (0, auth_2.createAuthMiddleware)();
    app.post('/api/export/workspace/:workspaceId/start', requireAuthInline, function (req, res) { return __awaiter(_this, void 0, void 0, function () {
        var authenticatedReq, workspaceId, workspace, approvedCaptions, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    authenticatedReq = req;
                    workspaceId = req.params.workspaceId;
                    workspace = auth_3.AuthModel.getWorkspaceById(workspaceId);
                    if (!workspace) {
                        return [2 /*return*/, res.status(404).json({ error: 'Workspace not found' })];
                    }
                    if (workspace.agencyId !== authenticatedReq.agency.id) {
                        return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                    }
                    approvedCaptions = auth_3.AuthModel.getApprovedCaptionsByWorkspace(workspaceId);
                    if (approvedCaptions.length === 0) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ error: 'No approved captions found for export' })];
                    }
                    return [4 /*yield*/, exportService_1.ExportService.startExport(workspaceId)];
                case 1:
                    result = _a.sent();
                    res.status(201).json(result);
                    return [3 /*break*/, 3];
                case 2:
                    error_1 = _a.sent();
                    if (error_1 instanceof Error) {
                        return [2 /*return*/, res.status(400).json({ error: error_1.message })];
                    }
                    logger_1.log.error({ err: error_1 }, 'Start export error (fallback route)');
                    res.status(500).json({ error: 'Internal server error' });
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); });
    // Mount export router at /api/export
    app.use('/api/export', export_1.default);
    app.use('/api/generated-assets', generatedAssets_1.default);
    app.use('/api/caption', caption_1.default);
    app.use('/api/mask', mask_1.default);
    app.use('/api/verify', verify_1.default);
    app.use('/api/health', health_1.default);
    app.use('/api/story', story_1.default);
    app.use('/api/campaigns', campaigns_1.default);
    app.use('/api/reference-creatives', referenceCreatives_1.default);
    app.use('/api/creative-engine', creativeEngine_1.default);
    app.use('/api/analyze-style', analyzeStyle_1.default);
    app.use('/api/campaign-briefs', campaignBriefs_1.default);
    app.use('/api/ad-creatives', adCreatives_1.default);
    app.use('/api/style-memory', styleMemory_1.default);
    app.use('/api/video-scripts', videoScripts_1.default);
    app.use('/api/multi-format', multiFormat_1.default);
    app.use('/api/style-synthesis', styleSynthesis_1.default);
    // Simple test route to debug route registration
    logger_1.log.info({ env: process.env.NODE_ENV }, 'NODE_ENV value on startup');
    logger_1.log.info('Setting up dev-only debug routes');
    if (process.env.NODE_ENV !== 'production') {
        app.get('/api/_test', function (_, res) {
            res.json({
                message: 'Route registration working',
                timestamp: new Date().toISOString(),
            });
        });
        // Detailed route listing with stack and regexp info
        app.get('/api/_routes_full', function (_, res) {
            try {
                var routerInfo = findRouterStack();
                var stack = routerInfo.stack;
                // fallback to globalMountedRoutes if stack is empty
                var fallbackMountedRoutes = globalMountedRoutes;
                var layers = stack.map(function (layer) {
                    var info = { name: layer.name };
                    if (layer.regexp)
                        info.regexp = layer.regexp.source;
                    if (layer.route && layer.route.path) {
                        info.route = {
                            path: layer.route.path,
                            methods: Object.keys(layer.route.methods),
                        };
                    }
                    if (layer.handle && layer.handle.stack) {
                        info.handleStack = layer.handle.stack.map(function (nested) { return ({
                            name: nested.name,
                            regexp: nested.regexp ? nested.regexp.source : undefined,
                            route: nested.route
                                ? {
                                    path: nested.route.path,
                                    methods: Object.keys(nested.route.methods),
                                }
                                : undefined,
                        }); });
                    }
                    return info;
                });
                res.json({ layers: layers, mountedRoutes: fallbackMountedRoutes });
            }
            catch (err) {
                logger_1.log.error({ err: err }, 'Error listing full routes');
                res.status(500).json({ error: 'Failed to list routes' });
            }
        });
        // Simple route listing that matches older tests/tools expectations
        app.get('/api/_routes', function (_, res) {
            try {
                var routerInfo = findRouterStack();
                var stack = routerInfo.stack;
                var routes_1 = [];
                var walk_1 = function (items, prefix) {
                    if (prefix === void 0) { prefix = ''; }
                    for (var _i = 0, items_1 = items; _i < items_1.length; _i++) {
                        var layer = items_1[_i];
                        if (!layer)
                            continue;
                        if (layer.route && layer.route.path) {
                            var innerPath = layer.route.path;
                            var fullPath = "".concat(prefix).concat(innerPath);
                            var methods = Object.keys(layer.route.methods || {});
                            for (var _a = 0, methods_3 = methods; _a < methods_3.length; _a++) {
                                var method = methods_3[_a];
                                // Expose both the inner route path (route.path) and a mountedPath for clarity
                                routes_1.push({
                                    method: method.toUpperCase(),
                                    path: innerPath,
                                    mountedPath: fullPath,
                                });
                            }
                        }
                        else if (layer.handle && layer.handle.stack) {
                            var mountPath = layer.regexp && layer.regexp.source
                                ? layer.regexp.source
                                    .replace('^\\/', '/')
                                    .replace('\\/?(?=\/|$)', '')
                                    .replace('(?=\/|$)', '')
                                    .replace('^', '')
                                    .replace('\\', '')
                                    .replace('(?:', '')
                                    .replace(')?', '')
                                : '';
                            walk_1(layer.handle.stack, prefix + mountPath);
                        }
                    }
                };
                walk_1(stack, '');
                // Also append any recorded globalMountedRoutes that we couldn't find via stack
                for (var _i = 0, globalMountedRoutes_1 = globalMountedRoutes; _i < globalMountedRoutes_1.length; _i++) {
                    var m = globalMountedRoutes_1[_i];
                    if (m.innerRoutes) {
                        for (var _a = 0, _b = m.innerRoutes; _a < _b.length; _a++) {
                            var r = _b[_a];
                            routes_1.push({
                                method: r.method,
                                path: r.path,
                                mountedPath: "".concat(m.mount).concat(r.path),
                            });
                        }
                    }
                    else {
                        // If no inner routes are available, expose the mount path itself
                        routes_1.push({ method: 'ALL', path: '*', mountedPath: m.mount });
                    }
                }
                res.json({ routes: routes_1 });
            }
            catch (err) {
                logger_1.log.error({ err: err }, 'Error listing routes');
                res.status(500).json({ error: 'Failed to list routes' });
            }
        });
        // Debug route to inspect internal router object keys and stack length
        logger_1.log.info('Registering debug route /api/_debug_router');
        app.get('/api/_debug_router', function (_, res) {
            try {
                var results = {};
                var candidates = ['_router', 'router', 'app', 'handle', 'stack'];
                for (var _i = 0, candidates_2 = candidates; _i < candidates_2.length; _i++) {
                    var candidate = candidates_2[_i];
                    var obj = app[candidate];
                    if (obj && typeof obj === 'object') {
                        var symKeys = Object.getOwnPropertySymbols(obj)
                            .map(function (s) { return s.toString(); })
                            .slice(0, 20);
                        var stackVal = obj.stack;
                        results[candidate] = {
                            isObject: true,
                            keys: Object.getOwnPropertyNames(obj).slice(0, 50),
                            symKeys: symKeys,
                            stackIsArray: Array.isArray(stackVal),
                            stackType: stackVal ? typeof stackVal : undefined,
                            stackLength: Array.isArray(stackVal)
                                ? stackVal.length
                                : undefined,
                        };
                    }
                    else {
                        results[candidate] = { isObject: !!obj };
                    }
                }
                // Also find any app property that contains a 'stack' array
                var stackProps = {};
                for (var _a = 0, _b = Object.getOwnPropertyNames(app); _a < _b.length; _a++) {
                    var prop = _b[_a];
                    var val = app[prop];
                    if (val && typeof val === 'object') {
                        if (Array.isArray(val.stack)) {
                            stackProps[prop] = val.stack.length;
                        }
                        else if (val &&
                            val instanceof Map &&
                            typeof val.size === 'number') {
                            stackProps[prop] = val.size;
                        }
                    }
                }
                // Additional diagnostics for router and handler objects
                var inspectObj = function (objName) {
                    var obj = app[objName];
                    if (!obj || typeof obj !== 'object')
                        return null;
                    var details = { keys: Object.getOwnPropertyNames(obj) };
                    details.symbols = Object.getOwnPropertySymbols(obj).map(function (s) {
                        return s.toString();
                    });
                    details.keyTypes = {};
                    for (var _i = 0, _a = details.keys.slice(0, 50); _i < _a.length; _i++) {
                        var k = _a[_i];
                        var v = obj[k];
                        details.keyTypes[k] = Array.isArray(v)
                            ? "array:".concat(v.length)
                            : typeof v;
                    }
                    return details;
                };
                var routerDetails = inspectObj('router');
                var handleDetails = inspectObj('handle');
                res.json({ results: results, stackProps: stackProps, routerDetails: routerDetails, handleDetails: handleDetails });
            }
            catch (err) {
                logger_1.log.error({ err: err }, 'Error inspecting router');
                res.status(500).json({ error: 'Failed to inspect router' });
            }
        });
    }
    // Error handling middleware - must be last
    app.use(errorHandler_1.errorHandler);
    // Debugging: inspect router at the end of server creation
    try {
        var hasRouter = !!app._router;
        var stackLen = app._router && app._router.stack
            ? app._router.stack.length
            : 0;
        logger_1.log.info({ hasRouter: hasRouter, stackLen: stackLen }, 'createServer - app._router present? stack length');
        var appKeys = Object.getOwnPropertyNames(app).slice(0, 50);
        logger_1.log.info({ appKeys: appKeys }, 'createServer - app keys');
        if (hasRouter) {
            var routerKeys = Object.getOwnPropertyNames(app._router).slice(0, 50);
            logger_1.log.info({ routerKeys: routerKeys }, 'createServer - router keys');
        }
    }
    catch (err) {
        logger_1.log.error({ err: err }, 'createServer router debug error');
    }
    return app;
}
function startServer() {
    var app = createServer();
    var port = config_1.config.port;
    app.listen(port, function () {
        logger_1.log.info({ port: port }, "Server running on port ".concat(port));
        logger_1.log.info({ env: config_1.config.env }, "Environment");
        // Log all registered routes for easier debugging
        try {
            // Helper: attempt to find where the router stack is stored on the app
            var findRouterStack = function () {
                var candidates = ['_router', 'router', 'handle'];
                for (var _i = 0, candidates_3 = candidates; _i < candidates_3.length; _i++) {
                    var c = candidates_3[_i];
                    var obj = app[c];
                    if (obj && typeof obj === 'object' && Array.isArray(obj.stack)) {
                        return { prop: c, stack: obj.stack };
                    }
                }
                // fallback: search any property that contains a stack array
                for (var _a = 0, _b = Object.getOwnPropertyNames(app); _a < _b.length; _a++) {
                    var p = _b[_a];
                    var v = app[p];
                    if (v && typeof v === 'object' && Array.isArray(v.stack)) {
                        return { prop: p, stack: v.stack };
                    }
                }
                return { prop: undefined, stack: [] };
            };
            var routerInfo = findRouterStack();
            logger_1.log.info({ routerProp: routerInfo.prop }, 'router prop used on startup');
            var routes_2 = [];
            var seen_1 = new Set();
            var walk_2 = function (stack, prefix) {
                if (prefix === void 0) { prefix = ''; }
                for (var _i = 0, stack_1 = stack; _i < stack_1.length; _i++) {
                    var layer = stack_1[_i];
                    if (!layer)
                        continue;
                    // Final route
                    if (layer.route && layer.route.path) {
                        var methods = Object.keys(layer.route.methods || {});
                        var fullPath = "".concat(prefix).concat(layer.route.path);
                        for (var _a = 0, methods_4 = methods; _a < methods_4.length; _a++) {
                            var method = methods_4[_a];
                            var key = "".concat(method.toUpperCase(), " ").concat(fullPath);
                            if (!seen_1.has(key)) {
                                seen_1.add(key);
                                routes_2.push({ method: method.toUpperCase(), path: fullPath });
                            }
                        }
                    }
                    else if (layer.handle && layer.handle.stack) {
                        // Router mounted; attempt to derive path from layer.regexp
                        var mountPath = '';
                        if (layer.regexp && layer.regexp.source) {
                            // Turn the express regex back into a path approximation for readability
                            var regexSource = layer.regexp.source;
                            mountPath = regexSource
                                .replace('^\\/', '/')
                                .replace('\\/?(?=\/|$)', '')
                                .replace('(?=\/|$)', '')
                                .replace('^', '')
                                .replace('\\', '')
                                .replace('(?:', '')
                                .replace(')?', '');
                        }
                        walk_2(layer.handle.stack, prefix + mountPath);
                    }
                }
            };
            walk_2(routerInfo.stack, '');
            // Also include routes that were captured during app.use calls (globalMountedRoutes)
            for (var _i = 0, globalMountedRoutes_2 = globalMountedRoutes; _i < globalMountedRoutes_2.length; _i++) {
                var m = globalMountedRoutes_2[_i];
                if (m.innerRoutes) {
                    for (var _a = 0, _b = m.innerRoutes; _a < _b.length; _a++) {
                        var r = _b[_a];
                        var fullPath = "".concat(m.mount).concat(r.path);
                        var key = "".concat(r.method, " ").concat(fullPath);
                        if (!seen_1.has(key)) {
                            seen_1.add(key);
                            routes_2.push({ method: r.method, path: fullPath });
                        }
                    }
                }
                else {
                    // If no inner routes are available, just log the mount path
                    var key = "ALL ".concat(m.mount);
                    if (!seen_1.has(key)) {
                        seen_1.add(key);
                        routes_2.push({ method: 'ALL', path: m.mount });
                    }
                }
            }
            logger_1.log.info({ routes: routes_2 }, 'Registered routes');
        }
        catch (error) {
            logger_1.log.error({ error: error }, 'Failed to list routes on startup');
        }
    });
}
// Provide default export
exports.default = { createServer: createServer, startServer: startServer };
// Start server if this file is run directly
if (require.main === module) {
    startServer();
}
