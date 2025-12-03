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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var zod_1 = require("zod");
var auth_1 = require("../models/auth");
var auth_2 = require("../routes/auth");
var validateRequest_1 = __importDefault(require("../middleware/validateRequest"));
var multiFormatService_1 = require("../services/multiFormatService");
var logger_1 = require("../middleware/logger");
var router = (0, express_1.Router)();
var requireAuth = (0, auth_2.createAuthMiddleware)();
var multiFormatService = new multiFormatService_1.MultiFormatService();
// Validation schemas
var generateMultiFormatSchema = zod_1.z.object({
    sourceAssetId: zod_1.z.string().min(1, 'Source asset ID is required'),
    workspaceId: zod_1.z.string().min(1, 'Workspace ID is required'),
    captionVariationId: zod_1.z.string().optional(),
    brandKitId: zod_1.z.string().optional(),
    campaignId: zod_1.z.string().optional(),
    outputFormats: zod_1.z
        .array(zod_1.z.enum(['square', 'story', 'landscape']))
        .min(1, 'At least one output format is required')
        .max(3, 'Maximum 3 output formats allowed'),
    platforms: zod_1.z.object({
        square: zod_1.z.array(zod_1.z.enum(['instagram', 'facebook', 'linkedin'])).optional(),
        story: zod_1.z.array(zod_1.z.enum(['instagram', 'facebook', 'tiktok'])).optional(),
        landscape: zod_1.z.array(zod_1.z.enum(['youtube', 'facebook', 'linkedin'])).optional(),
    }).optional(),
    styleReferences: zod_1.z.array(zod_1.z.string()).optional(),
    synthesisMode: zod_1.z.enum(['dominant', 'balanced', 'creative', 'conservative']).optional(),
});
var multiFormatOutputIdSchema = zod_1.z.object({
    outputId: zod_1.z.string().min(1, 'Multi-format output ID is required'),
});
var workspaceIdSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().min(1, 'Workspace ID is required'),
});
// In-memory storage for v2 (in production, use database)
var multiFormatOutputs = new Map();
/**
 * POST /api/multi-format/generate
 * Generate multi-format outputs for a source asset
 */
router.post('/generate', requireAuth, (0, validateRequest_1.default)(generateMultiFormatSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestData_1, workspace, asset, captionVariation, brandKit, campaign, campaignWorkspace, result, multiFormatWithMetadata, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                requestData_1 = req.validatedData;
                workspace = auth_1.AuthModel.getWorkspaceById(requestData_1.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                asset = auth_1.AuthModel.getAssetById(requestData_1.sourceAssetId);
                if (!asset || asset.workspaceId !== requestData_1.workspaceId) {
                    return [2 /*return*/, res.status(404).json({ error: 'Source asset not found' })];
                }
                captionVariation = void 0;
                if (requestData_1.captionVariationId) {
                    captionVariation = Array.from(multiFormatOutputs.values()).find(function (output) { return output.id === requestData_1.captionVariationId; });
                    if (!captionVariation) {
                        return [2 /*return*/, res.status(404).json({ error: 'Caption variation not found' })];
                    }
                }
                brandKit = void 0;
                if (requestData_1.brandKitId) {
                    brandKit = auth_1.AuthModel.getBrandKitById(requestData_1.brandKitId);
                    if (!brandKit || brandKit.workspaceId !== requestData_1.workspaceId) {
                        return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
                    }
                }
                campaign = void 0;
                if (requestData_1.campaignId) {
                    campaign = auth_1.AuthModel.getCampaignById(requestData_1.campaignId);
                    if (!campaign) {
                        return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
                    }
                    campaignWorkspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                    if (!campaignWorkspace || campaignWorkspace.agencyId !== req.agency.id) {
                        return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                    }
                }
                logger_1.log.info({
                    sourceAssetId: requestData_1.sourceAssetId,
                    outputFormats: requestData_1.outputFormats,
                    platforms: requestData_1.platforms,
                    requestId: req.requestId,
                }, "Generating multi-format outputs for ".concat(requestData_1.outputFormats.length, " formats"));
                return [4 /*yield*/, multiFormatService.generateMultiFormatOutputs(requestData_1, asset, brandKit, campaign, captionVariation)
                    // Store generated outputs
                ];
            case 1:
                result = _a.sent();
                multiFormatWithMetadata = {
                    id: "multi-format-".concat(Date.now()),
                    request: requestData_1,
                    outputs: result.outputs,
                    qualityMetrics: result.qualityMetrics,
                    recommendations: result.recommendations,
                    processingTime: result.processingTime,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                multiFormatOutputs.set(multiFormatWithMetadata.id, multiFormatWithMetadata);
                logger_1.log.info({
                    multiFormatId: multiFormatWithMetadata.id,
                    outputsCount: result.outputs.length,
                    avgQualityScore: result.qualityMetrics.overallScore,
                    processingTime: result.processingTime,
                    requestId: req.requestId,
                }, "Multi-format generation completed");
                res.json({
                    success: true,
                    result: {
                        multiFormatId: multiFormatWithMetadata.id,
                        outputs: result.outputs,
                        qualityMetrics: result.qualityMetrics,
                        recommendations: result.recommendations,
                        processingTime: result.processingTime,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_1.log.error({ err: error_1, requestId: req.requestId }, 'Multi-format generation error');
                if (error_1 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_1.message })];
                }
                res.status(500).json({ error: 'Failed to generate multi-format outputs' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/multi-format
 * List all multi-format generations for the agency
 */
router.get('/', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, workspaceId_1, format_1, status_1, _b, page, _c, limit, agencyWorkspaces, workspaceIds_1, filteredOutputs, startIndex, endIndex, paginatedOutputs;
    return __generator(this, function (_d) {
        try {
            _a = req.query, workspaceId_1 = _a.workspaceId, format_1 = _a.format, status_1 = _a.status, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 20 : _c;
            agencyWorkspaces = auth_1.AuthModel.getAllWorkspaces().filter(function (workspace) {
                return workspace.agencyId === req.agency.id;
            });
            workspaceIds_1 = agencyWorkspaces.map(function (w) { return w.id; });
            filteredOutputs = Array.from(multiFormatOutputs.values()).filter(function (output) {
                var matches = true;
                if (workspaceId_1) {
                    matches = matches && output.request.workspaceId === workspaceId_1;
                }
                if (format_1) {
                    matches = matches && output.request.outputFormats.includes(format_1);
                }
                if (status_1) {
                    // For v2, all outputs are 'completed'
                    matches = matches && status_1 === 'completed';
                }
                matches = matches && workspaceIds_1.includes(output.request.workspaceId);
                return matches;
            });
            // Sort by creation date (newest first)
            filteredOutputs.sort(function (a, b) { return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(); });
            startIndex = (Number(page) - 1) * Number(limit);
            endIndex = startIndex + Number(limit);
            paginatedOutputs = filteredOutputs.slice(startIndex, endIndex);
            res.json({
                success: true,
                multiFormats: paginatedOutputs,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: filteredOutputs.length,
                    totalPages: Math.ceil(filteredOutputs.length / Number(limit)),
                },
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'List multi-formats error');
            res.status(500).json({ error: 'Failed to list multi-format outputs' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/multi-format/:multiFormatId
 * Get specific multi-format output by ID
 */
router.get('/:multiFormatId', requireAuth, (0, validateRequest_1.default)(multiFormatOutputIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var multiFormatId, multiFormat, workspace;
    return __generator(this, function (_a) {
        try {
            multiFormatId = req.validatedData.multiFormatId;
            multiFormat = multiFormatOutputs.get(multiFormatId);
            if (!multiFormat) {
                return [2 /*return*/, res.status(404).json({ error: 'Multi-format output not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(multiFormat.request.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            res.json({
                success: true,
                multiFormat: multiFormat,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Get multi-format error');
            res.status(500).json({ error: 'Failed to get multi-format output' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * POST /api/multi-format/:multiFormatId/duplicate
 * Duplicate multi-format output with different settings
 */
router.post('/:multiFormatId/duplicate', requireAuth, (0, validateRequest_1.default)(multiFormatOutputIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var multiFormatId, _a, outputFormats, platforms, synthesisMode, existingMultiFormat, workspace, duplicateRequest, result, duplicate, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                multiFormatId = req.validatedData.multiFormatId;
                _a = req.body, outputFormats = _a.outputFormats, platforms = _a.platforms, synthesisMode = _a.synthesisMode;
                existingMultiFormat = multiFormatOutputs.get(multiFormatId);
                if (!existingMultiFormat) {
                    return [2 /*return*/, res.status(404).json({ error: 'Multi-format output not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(existingMultiFormat.request.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                duplicateRequest = __assign(__assign({}, existingMultiFormat.request), { outputFormats: outputFormats || existingMultiFormat.request.outputFormats, platforms: platforms || existingMultiFormat.request.platforms, synthesisMode: synthesisMode || existingMultiFormat.request.synthesisMode });
                logger_1.log.info({ originalId: multiFormatId, requestId: req.requestId }, "Duplicating multi-format output");
                return [4 /*yield*/, multiFormatService.generateMultiFormatOutputs(duplicateRequest)
                    // Store duplicate
                ];
            case 1:
                result = _b.sent();
                duplicate = __assign(__assign({}, existingMultiFormat), { id: "multi-format-".concat(Date.now()), request: duplicateRequest, outputs: result.outputs, qualityMetrics: result.qualityMetrics, recommendations: result.recommendations, processingTime: result.processingTime, createdAt: new Date(), updatedAt: new Date(), name: "".concat(existingMultiFormat.name || 'Multi-Format', " (Duplicate)") });
                multiFormatOutputs.set(duplicate.id, duplicate);
                logger_1.log.info({ multiFormatId: duplicate.id, originalId: multiFormatId }, "Multi-format output duplicated");
                res.json({
                    success: true,
                    multiFormat: duplicate,
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                logger_1.log.error({ err: error_2, requestId: req.requestId }, 'Duplicate multi-format error');
                res.status(500).json({ error: 'Failed to duplicate multi-format output' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * DELETE /api/multi-format/:multiFormatId
 * Delete multi-format output
 */
router.delete('/:multiFormatId', requireAuth, (0, validateRequest_1.default)(multiFormatOutputIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var multiFormatId, existingMultiFormat, workspace;
    return __generator(this, function (_a) {
        try {
            multiFormatId = req.validatedData.multiFormatId;
            existingMultiFormat = multiFormatOutputs.get(multiFormatId);
            if (!existingMultiFormat) {
                return [2 /*return*/, res.status(404).json({ error: 'Multi-format output not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(existingMultiFormat.request.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            multiFormatOutputs.delete(multiFormatId);
            logger_1.log.info({ multiFormatId: multiFormatId }, "Multi-format output deleted");
            res.json({
                success: true,
                message: 'Multi-format output deleted successfully',
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Delete multi-format error');
            res.status(500).json({ error: 'Failed to delete multi-format output' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/multi-format/workspace/:workspaceId/stats
 * Get statistics for multi-format outputs in a workspace
 */
router.get('/workspace/:workspaceId/stats', requireAuth, (0, validateRequest_1.default)(workspaceIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var workspaceId, workspace, stats;
    return __generator(this, function (_a) {
        try {
            workspaceId = req.validatedData.workspaceId;
            workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            stats = multiFormatService.getMultiFormatStats(workspaceId);
            res.json({
                success: true,
                stats: stats,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Get multi-format stats error');
            res.status(500).json({ error: 'Failed to get multi-format statistics' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/multi-format/health
 * Health check endpoint
 */
router.get('/health', function (req, res) {
    res.json({
        status: 'ok',
        service: 'multi-format-service',
        timestamp: new Date().toISOString(),
        multiFormatCount: multiFormatOutputs.size,
        capabilities: [
            'multi-format-generation',
            'square-format (1:1)',
            'story-format (9:16)',
            'landscape-format (16:9)',
            'platform-optimization',
            'campaign-aware-generation',
            'style-synthesis-ready',
            'quality-metrics',
        ],
    });
});
exports.default = router;
