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
var videoScriptService_1 = require("../services/videoScriptService");
var logger_1 = require("../middleware/logger");
var router = (0, express_1.Router)();
var requireAuth = (0, auth_2.createAuthMiddleware)();
// Validation schemas
var generateVideoScriptSchema = zod_1.z.object({
    campaignId: zod_1.z.string().optional(),
    brandKitId: zod_1.z.string().optional(),
    assetDescription: zod_1.z.string().min(1, 'Asset description is required'),
    product: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Product name is required'),
        category: zod_1.z.string().min(1, 'Product category is required'),
        features: zod_1.z.array(zod_1.z.string()).optional(),
        benefits: zod_1.z.array(zod_1.z.string()).optional(),
        useCases: zod_1.z.array(zod_1.z.string()).optional(),
    }),
    videoLength: zod_1.z.number().min(5).max(180),
    platforms: zod_1.z
        .array(zod_1.z.enum(['instagram', 'facebook', 'linkedin', 'tiktok']))
        .min(1, 'At least one platform is required'),
    tone: zod_1.z.array(zod_1.z.string()).min(1, 'At least one tone is required'),
    objective: zod_1.z.enum(['awareness', 'consideration', 'conversion', 'retention']),
    targetAudience: zod_1.z
        .object({
        demographics: zod_1.z.string().optional(),
        psychographics: zod_1.z.string().optional(),
        painPoints: zod_1.z.array(zod_1.z.string()).optional(),
    })
        .optional(),
    includeStoryboard: zod_1.z.boolean().optional().default(false),
    visualStyle: zod_1.z.string().optional(),
});
var videoScriptIdSchema = zod_1.z.object({
    videoScriptId: zod_1.z.string().min(1, 'Video Script ID is required'),
});
// In-memory storage for v1 (in production, use database)
var videoScripts = new Map();
var videoScriptService = new videoScriptService_1.VideoScriptService();
/**
 * POST /api/video-scripts/generate
 * Generate video script with optional storyboard
 */
router.post('/generate', requireAuth, (0, validateRequest_1.default)(generateVideoScriptSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestData, campaign, workspace, brandKit, workspace, result, videoScriptWithMetadata, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                requestData = req.validatedData;
                campaign = void 0;
                if (requestData.campaignId) {
                    campaign = auth_1.AuthModel.getCampaignById(requestData.campaignId);
                    if (!campaign) {
                        return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
                    }
                    workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                    if (!workspace || workspace.agencyId !== req.agency.id) {
                        return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                    }
                }
                brandKit = void 0;
                if (requestData.brandKitId) {
                    brandKit = auth_1.AuthModel.getBrandKitById(requestData.brandKitId);
                    if (!brandKit) {
                        return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
                    }
                    workspace = auth_1.AuthModel.getWorkspaceById(brandKit.workspaceId);
                    if (!workspace || workspace.agencyId !== req.agency.id) {
                        return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                    }
                }
                logger_1.log.info({
                    productName: requestData.product.name,
                    videoLength: requestData.videoLength,
                    platforms: requestData.platforms,
                    includeStoryboard: requestData.includeStoryboard,
                    requestId: req.requestId,
                }, "Generating video script for ".concat(requestData.product.name));
                return [4 /*yield*/, videoScriptService.generateVideoScript(requestData, campaign, brandKit)
                    // Store generated video script
                ];
            case 1:
                result = _a.sent();
                videoScriptWithMetadata = __assign(__assign({}, result.videoScript), { id: "video-script-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)), campaignId: requestData.campaignId, brandKitId: requestData.brandKitId, request: requestData, qualityScore: result.qualityScore, recommendations: result.recommendations, estimatedPerformance: result.estimatedPerformance, createdAt: new Date(), updatedAt: new Date() });
                videoScripts.set(videoScriptWithMetadata.id, videoScriptWithMetadata);
                logger_1.log.info({
                    videoScriptId: videoScriptWithMetadata.id,
                    qualityScore: result.qualityScore,
                    totalDuration: result.videoScript.totalDuration,
                    requestId: req.requestId,
                }, "Video script generated successfully");
                res.json({
                    success: true,
                    result: {
                        videoScript: result.videoScript,
                        videoStoryboard: result.videoStoryboard,
                        metadata: {
                            id: videoScriptWithMetadata.id,
                            qualityScore: result.qualityScore,
                            recommendations: result.recommendations,
                            estimatedPerformance: result.estimatedPerformance,
                        },
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_1.log.error({ err: error_1, requestId: req.requestId }, 'Video script generation error');
                if (error_1 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_1.message })];
                }
                res.status(500).json({ error: 'Failed to generate video script' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/video-scripts
 * List all video scripts for the agency
 */
router.get('/', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, campaignId_1, platform_1, status_1, _b, page, _c, limit, agencyCampaigns, campaignIds_1, filteredScripts, startIndex, endIndex, paginatedScripts;
    return __generator(this, function (_d) {
        try {
            _a = req.query, campaignId_1 = _a.campaignId, platform_1 = _a.platform, status_1 = _a.status, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 20 : _c;
            agencyCampaigns = auth_1.AuthModel.getAllCampaigns().filter(function (campaign) {
                var workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                return (workspace === null || workspace === void 0 ? void 0 : workspace.agencyId) === req.agency.id;
            });
            campaignIds_1 = agencyCampaigns.map(function (c) { return c.id; });
            filteredScripts = Array.from(videoScripts.values()).filter(function (script) {
                var matches = true;
                if (campaignId_1) {
                    matches = matches && script.campaignId === campaignId_1;
                }
                if (platform_1) {
                    matches = matches && script.request.platforms.includes(platform_1);
                }
                if (status_1) {
                    matches = matches && script.status === status_1;
                }
                matches = matches && (!script.campaignId || campaignIds_1.includes(script.campaignId));
                return matches;
            });
            // Sort by creation date (newest first)
            filteredScripts.sort(function (a, b) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            startIndex = (Number(page) - 1) * Number(limit);
            endIndex = startIndex + Number(limit);
            paginatedScripts = filteredScripts.slice(startIndex, endIndex);
            res.json({
                success: true,
                videoScripts: paginatedScripts,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: filteredScripts.length,
                    totalPages: Math.ceil(filteredScripts.length / Number(limit)),
                },
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'List video scripts error');
            res.status(500).json({ error: 'Failed to list video scripts' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/video-scripts/:videoScriptId
 * Get specific video script by ID
 */
router.get('/:videoScriptId', requireAuth, (0, validateRequest_1.default)(videoScriptIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var videoScriptId, videoScript, campaign, workspace;
    return __generator(this, function (_a) {
        try {
            videoScriptId = req.validatedData.videoScriptId;
            videoScript = videoScripts.get(videoScriptId);
            if (!videoScript) {
                return [2 /*return*/, res.status(404).json({ error: 'Video script not found' })];
            }
            // Verify user has access to the campaign
            if (videoScript.campaignId) {
                campaign = auth_1.AuthModel.getCampaignById(videoScript.campaignId);
                if (!campaign) {
                    return [2 /*return*/, res.status(404).json({ error: 'Associated campaign not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
            }
            res.json({
                success: true,
                videoScript: videoScript,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Get video script error');
            res.status(500).json({ error: 'Failed to get video script' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * POST /api/video-scripts/:videoScriptId/duplicate
 * Duplicate video script
 */
router.post('/:videoScriptId/duplicate', requireAuth, (0, validateRequest_1.default)(videoScriptIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var videoScriptId, existingScript, campaign, workspace, duplicate;
    return __generator(this, function (_a) {
        try {
            videoScriptId = req.validatedData.videoScriptId;
            existingScript = videoScripts.get(videoScriptId);
            if (!existingScript) {
                return [2 /*return*/, res.status(404).json({ error: 'Video script not found' })];
            }
            // Verify user has access to the campaign
            if (existingScript.campaignId) {
                campaign = auth_1.AuthModel.getCampaignById(existingScript.campaignId);
                if (!campaign) {
                    return [2 /*return*/, res.status(404).json({ error: 'Associated campaign not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
            }
            duplicate = __assign(__assign({}, existingScript), { id: "video-script-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)), name: "".concat(existingScript.request.product.name, " Video Script (Copy)"), createdAt: new Date(), updatedAt: new Date() });
            videoScripts.set(duplicate.id, duplicate);
            logger_1.log.info({ videoScriptId: duplicate.id, originalId: videoScriptId }, "Video script duplicated");
            res.json({
                success: true,
                videoScript: duplicate,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Duplicate video script error');
            res.status(500).json({ error: 'Failed to duplicate video script' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * DELETE /api/video-scripts/:videoScriptId
 * Delete video script
 */
router.delete('/:videoScriptId', requireAuth, (0, validateRequest_1.default)(videoScriptIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var videoScriptId, existingScript, campaign, workspace;
    return __generator(this, function (_a) {
        try {
            videoScriptId = req.validatedData.videoScriptId;
            existingScript = videoScripts.get(videoScriptId);
            if (!existingScript) {
                return [2 /*return*/, res.status(404).json({ error: 'Video script not found' })];
            }
            // Verify user has access to the campaign
            if (existingScript.campaignId) {
                campaign = auth_1.AuthModel.getCampaignById(existingScript.campaignId);
                if (!campaign) {
                    return [2 /*return*/, res.status(404).json({ error: 'Associated campaign not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
            }
            videoScripts.delete(videoScriptId);
            logger_1.log.info({ videoScriptId: videoScriptId }, "Video script deleted");
            res.json({
                success: true,
                message: 'Video script deleted successfully',
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Delete video script error');
            res.status(500).json({ error: 'Failed to delete video script' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/video-scripts/health
 * Health check endpoint
 */
router.get('/health', function (req, res) {
    res.json({
        status: 'ok',
        service: 'video-script-service',
        timestamp: new Date().toISOString(),
        videoScriptsCount: videoScripts.size,
        capabilities: [
            'video-script-generation',
            '5-scene-structure',
            'campaign-aware-scripting',
            'storyboard-generation',
            'quality-scoring',
            'performance-estimation',
            'multi-platform-support',
        ],
    });
});
exports.default = router;
