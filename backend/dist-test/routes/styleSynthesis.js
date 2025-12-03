"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var zod_1 = require("zod");
var auth_1 = require("../models/auth");
var auth_2 = require("../routes/auth");
var validateRequest_1 = __importDefault(require("../middleware/validateRequest"));
var styleSynthesisService_1 = require("../services/styleSynthesisService");
var logger_1 = require("../middleware/logger");
var router = (0, express_1.Router)();
var requireAuth = (0, auth_2.createAuthMiddleware)();
var styleSynthesisService = new styleSynthesisService_1.StyleSynthesisService();
// Validation schemas
var analyzeStyleSchema = zod_1.z.object({
    referenceId: zod_1.z.string().min(1, 'Reference ID is required'),
});
var synthesizeStylesSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().min(1, 'Workspace ID is required'),
    styleReferences: zod_1.z.array(zod_1.z.string()).min(1, 'At least one style reference is required'),
    synthesisMode: zod_1.z.enum(['dominant', 'balanced', 'creative', 'conservative']).optional(),
    targetFormat: zod_1.z.string().optional(),
    brandKitId: zod_1.z.string().optional(),
    campaignId: zod_1.z.string().optional(),
});
var findMatchingStylesSchema = zod_1.z.object({
    query: zod_1.z.string().min(1, 'Search query is required'),
    workspaceId: zod_1.z.string().min(1, 'Workspace ID is required'),
    limit: zod_1.z.number().min(1).max(50).optional(),
});
var styleSynthesisIdSchema = zod_1.z.object({
    synthesisId: zod_1.z.string().min(1, 'Style synthesis ID is required'),
});
var styleReferenceIdSchema = zod_1.z.object({
    referenceId: zod_1.z.string().min(1, 'Style reference ID is required'),
});
// In-memory storage for v2 (in production, use database)
var styleSyntheses = new Map();
var styleReferences = new Map();
/**
 * POST /api/style-synthesis/analyze
 * Analyze a style reference to extract visual attributes
 */
router.post('/analyze', requireAuth, (0, validateRequest_1.default)(analyzeStyleSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var referenceId, reference, workspace, analysis, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                referenceId = req.validatedData.referenceId;
                reference = styleReferences.get(referenceId);
                if (!reference) {
                    // Try to get from auth model or create mock for testing
                    reference = {
                        id: referenceId,
                        name: "Style Reference ".concat(referenceId),
                        description: 'Mock style reference for analysis',
                        url: "https://example.com/style/".concat(referenceId),
                        type: 'image',
                        tags: ['test'],
                        workspaceId: 'test-workspace',
                        createdAt: new Date(),
                    };
                    styleReferences.set(referenceId, reference);
                }
                workspace = auth_1.AuthModel.getWorkspaceById(reference.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                logger_1.log.info({ referenceId: referenceId, requestId: req.requestId }, 'Analyzing style reference');
                return [4 /*yield*/, styleSynthesisService.analyzeStyleReference(reference)];
            case 1:
                analysis = _a.sent();
                res.json({
                    success: true,
                    analysis: analysis,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_1.log.error({ err: error_1, requestId: req.requestId }, 'Style analysis error');
                if (error_1 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_1.message })];
                }
                res.status(500).json({ error: 'Failed to analyze style reference' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/style-synthesis/synthesize
 * Synthesize multiple style references into a unified style
 */
router.post('/synthesize', requireAuth, (0, validateRequest_1.default)(synthesizeStylesSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestData, workspace, brandKit, campaign, campaignWorkspace, synthesisRequest, result, synthesisWithMetadata, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                requestData = req.validatedData;
                workspace = auth_1.AuthModel.getWorkspaceById(requestData.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                brandKit = void 0;
                if (requestData.brandKitId) {
                    brandKit = auth_1.AuthModel.getBrandKitById(requestData.brandKitId);
                    if (!brandKit || brandKit.workspaceId !== requestData.workspaceId) {
                        return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
                    }
                }
                campaign = void 0;
                if (requestData.campaignId) {
                    campaign = auth_1.AuthModel.getCampaignById(requestData.campaignId);
                    if (!campaign) {
                        return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
                    }
                    campaignWorkspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                    if (!campaignWorkspace || campaignWorkspace.agencyId !== req.agency.id) {
                        return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                    }
                }
                logger_1.log.info({
                    workspaceId: requestData.workspaceId,
                    referenceCount: requestData.styleReferences.length,
                    synthesisMode: requestData.synthesisMode,
                    requestId: req.requestId,
                }, 'Starting style synthesis');
                synthesisRequest = {
                    workspaceId: requestData.workspaceId,
                    styleReferences: requestData.styleReferences,
                    synthesisMode: requestData.synthesisMode || 'balanced',
                    targetFormat: requestData.targetFormat,
                };
                return [4 /*yield*/, styleSynthesisService.synthesizeStyles(synthesisRequest, brandKit, campaign)
                    // Store synthesis result
                ];
            case 1:
                result = _a.sent();
                synthesisWithMetadata = {
                    id: result.id,
                    request: synthesisRequest,
                    result: result,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                styleSyntheses.set(result.id, synthesisWithMetadata);
                logger_1.log.info({
                    synthesisId: result.id,
                    qualityScore: result.qualityMetrics.overallScore,
                    processingTime: result.processingTime,
                    requestId: req.requestId,
                }, 'Style synthesis completed');
                res.json({
                    success: true,
                    result: result,
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_1.log.error({ err: error_2, requestId: req.requestId }, 'Style synthesis error');
                if (error_2 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_2.message })];
                }
                res.status(500).json({ error: 'Failed to synthesize styles' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/style-synthesis/match
 * Find style references that match a given aesthetic
 */
router.get('/match', requireAuth, (0, validateRequest_1.default)(findMatchingStylesSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, query, workspaceId, _b, limit, workspace, matches, error_3;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                _a = req.validatedData, query = _a.query, workspaceId = _a.workspaceId, _b = _a.limit, limit = _b === void 0 ? 10 : _b;
                workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                logger_1.log.info({ query: query, workspaceId: workspaceId, limit: limit, requestId: req.requestId }, 'Searching for matching styles');
                return [4 /*yield*/, styleSynthesisService.findMatchingStyles(query, workspaceId, limit)];
            case 1:
                matches = _c.sent();
                res.json({
                    success: true,
                    matches: matches,
                    pagination: {
                        query: query,
                        limit: limit,
                        total: matches.length,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _c.sent();
                logger_1.log.error({ err: error_3, requestId: req.requestId }, 'Style matching error');
                if (error_3 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_3.message })];
                }
                res.status(500).json({ error: 'Failed to find matching styles' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/style-synthesis
 * List all style syntheses for the agency
 */
router.get('/', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, workspaceId_1, synthesisMode_1, _b, page, _c, limit, agencyWorkspaces, workspaceIds_1, filteredSyntheses, startIndex, endIndex, paginatedSyntheses;
    return __generator(this, function (_d) {
        try {
            _a = req.query, workspaceId_1 = _a.workspaceId, synthesisMode_1 = _a.synthesisMode, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 20 : _c;
            agencyWorkspaces = auth_1.AuthModel.getAllWorkspaces().filter(function (workspace) {
                return workspace.agencyId === req.agency.id;
            });
            workspaceIds_1 = agencyWorkspaces.map(function (w) { return w.id; });
            filteredSyntheses = Array.from(styleSyntheses.values()).filter(function (synthesis) {
                var matches = true;
                if (workspaceId_1) {
                    matches = matches && synthesis.request.workspaceId === workspaceId_1;
                }
                if (synthesisMode_1) {
                    matches = matches && synthesis.result.synthesizedStyle.synthesisMode === synthesisMode_1;
                }
                matches = matches && workspaceIds_1.includes(synthesis.request.workspaceId);
                return matches;
            });
            // Sort by creation date (newest first)
            filteredSyntheses.sort(function (a, b) { return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); });
            startIndex = (Number(page) - 1) * Number(limit);
            endIndex = startIndex + Number(limit);
            paginatedSyntheses = filteredSyntheses.slice(startIndex, endIndex);
            res.json({
                success: true,
                syntheses: paginatedSyntheses,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: filteredSyntheses.length,
                    totalPages: Math.ceil(filteredSyntheses.length / Number(limit)),
                },
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'List style syntheses error');
            res.status(500).json({ error: 'Failed to list style syntheses' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/style-synthesis/:synthesisId
 * Get specific style synthesis by ID
 */
router.get('/:synthesisId', requireAuth, (0, validateRequest_1.default)(styleSynthesisIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var synthesisId, synthesis, workspace;
    return __generator(this, function (_a) {
        try {
            synthesisId = req.validatedData.synthesisId;
            synthesis = styleSyntheses.get(synthesisId);
            if (!synthesis) {
                return [2 /*return*/, res.status(404).json({ error: 'Style synthesis not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(synthesis.request.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            res.json({
                success: true,
                synthesis: synthesis,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Get style synthesis error');
            res.status(500).json({ error: 'Failed to get style synthesis' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * POST /api/style-synthesis/:synthesisId/duplicate
 * Duplicate style synthesis with different settings
 */
router.post('/:synthesisId/duplicate', requireAuth, (0, validateRequest_1.default)(styleSynthesisIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var synthesisId, _a, synthesisMode, targetFormat, additionalReferences, existingSynthesis, workspace, duplicateRequest, result, duplicate, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                synthesisId = req.validatedData.synthesisId;
                _a = req.body, synthesisMode = _a.synthesisMode, targetFormat = _a.targetFormat, additionalReferences = _a.additionalReferences;
                existingSynthesis = styleSyntheses.get(synthesisId);
                if (!existingSynthesis) {
                    return [2 /*return*/, res.status(404).json({ error: 'Style synthesis not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(existingSynthesis.request.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                duplicateRequest = __assign(__assign({}, existingSynthesis.request), { synthesisMode: synthesisMode || existingSynthesis.request.synthesisMode, targetFormat: targetFormat || existingSynthesis.request.targetFormat, styleReferences: additionalReferences
                        ? __spreadArray(__spreadArray([], existingSynthesis.request.styleReferences, true), additionalReferences, true) : existingSynthesis.request.styleReferences });
                logger_1.log.info({ originalId: synthesisId, requestId: req.requestId }, 'Duplicating style synthesis');
                return [4 /*yield*/, styleSynthesisService.synthesizeStyles(duplicateRequest)
                    // Store duplicate
                ];
            case 1:
                result = _b.sent();
                duplicate = __assign(__assign({}, existingSynthesis), { id: result.id, request: duplicateRequest, result: result, createdAt: new Date(), updatedAt: new Date(), name: "".concat(existingSynthesis.name || 'Style Synthesis', " (Duplicate)") });
                styleSyntheses.set(result.id, duplicate);
                logger_1.log.info({ synthesisId: result.id, originalId: synthesisId }, 'Style synthesis duplicated');
                res.json({
                    success: true,
                    synthesis: duplicate,
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                logger_1.log.error({ err: error_4, requestId: req.requestId }, 'Duplicate style synthesis error');
                res.status(500).json({ error: 'Failed to duplicate style synthesis' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * DELETE /api/style-synthesis/:synthesisId
 * Delete style synthesis
 */
router.delete('/:synthesisId', requireAuth, (0, validateRequest_1.default)(styleSynthesisIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var synthesisId, existingSynthesis, workspace;
    return __generator(this, function (_a) {
        try {
            synthesisId = req.validatedData.synthesisId;
            existingSynthesis = styleSyntheses.get(synthesisId);
            if (!existingSynthesis) {
                return [2 /*return*/, res.status(404).json({ error: 'Style synthesis not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(existingSynthesis.request.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            styleSyntheses.delete(synthesisId);
            logger_1.log.info({ synthesisId: synthesisId }, 'Style synthesis deleted');
            res.json({
                success: true,
                message: 'Style synthesis deleted successfully',
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Delete style synthesis error');
            res.status(500).json({ error: 'Failed to delete style synthesis' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/style-synthesis/workspace/:workspaceId/stats
 * Get statistics for style syntheses in a workspace
 */
router.get('/workspace/:workspaceId/stats', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var workspaceId_2, workspace, workspaceSyntheses, stats;
    return __generator(this, function (_a) {
        try {
            workspaceId_2 = req.params.workspaceId;
            workspace = auth_1.AuthModel.getWorkspaceById(workspaceId_2);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            workspaceSyntheses = Array.from(styleSyntheses.values()).filter(function (synthesis) { return synthesis.request.workspaceId === workspaceId_2; });
            stats = {
                totalSyntheses: workspaceSyntheses.length,
                avgQualityScore: workspaceSyntheses.length > 0
                    ? Math.round(workspaceSyntheses.reduce(function (sum, s) { return sum + s.result.qualityMetrics.overallScore; }, 0) / workspaceSyntheses.length)
                    : 0,
                synthesisModes: workspaceSyntheses.reduce(function (modes, s) {
                    var mode = s.result.synthesizedStyle.synthesisMode;
                    modes[mode] = (modes[mode] || 0) + 1;
                    return modes;
                }, {}),
                avgProcessingTime: workspaceSyntheses.length > 0
                    ? Math.round(workspaceSyntheses.reduce(function (sum, s) { return sum + s.result.processingTime; }, 0) / workspaceSyntheses.length)
                    : 0,
            };
            res.json({
                success: true,
                stats: stats,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Get style synthesis stats error');
            res.status(500).json({ error: 'Failed to get style synthesis statistics' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/style-synthesis/health
 * Health check endpoint
 */
router.get('/health', function (req, res) {
    res.json({
        status: 'ok',
        service: 'style-synthesis-service',
        timestamp: new Date().toISOString(),
        synthesesCount: styleSyntheses.size,
        referencesCount: styleReferences.size,
        capabilities: [
            'style-reference-analysis',
            'multi-style-synthesis',
            'style-matching-search',
            'dominant-mode-synthesis',
            'balanced-mode-synthesis',
            'creative-mode-synthesis',
            'conservative-mode-synthesis',
            'quality-metrics',
            'brand-alignment-scoring',
        ],
    });
});
exports.default = router;
