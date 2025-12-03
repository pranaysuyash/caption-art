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
var adCreativeGenerator_1 = require("../services/adCreativeGenerator");
var adCopyService_1 = require("../services/adCopyService");
var campaignAwareService_1 = require("../services/campaignAwareService");
var logger_1 = require("../middleware/logger");
var router = (0, express_1.Router)();
var requireAuth = (0, auth_2.createAuthMiddleware)();
// Validation schemas
var generateAdCreativeSchema = zod_1.z.object({
    campaignId: zod_1.z.string().min(1, 'Campaign ID is required'),
    brandKitId: zod_1.z.string().min(1, 'Brand Kit ID is required'),
    objective: zod_1.z.enum(['awareness', 'consideration', 'conversion', 'retention']),
    funnelStage: zod_1.z.enum(['top', 'middle', 'bottom']),
    platforms: zod_1.z
        .array(zod_1.z.enum(['instagram', 'facebook', 'linkedin']))
        .min(1, 'At least one platform is required'),
    targetAudience: zod_1.z
        .object({
        demographics: zod_1.z.string().optional(),
        psychographics: zod_1.z.string().optional(),
        painPoints: zod_1.z.array(zod_1.z.string()).optional(),
    })
        .optional(),
    keyMessage: zod_1.z.string().min(1, 'Key message is required'),
    cta: zod_1.z.string().min(1, 'CTA is required'),
    tone: zod_1.z.array(zod_1.z.string()).optional(),
    variations: zod_1.z.number().min(1).max(5).optional().default(3),
    includeVisuals: zod_1.z.boolean().optional().default(false),
});
var updateAdCreativeSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    status: zod_1.z
        .enum(['draft', 'review', 'approved', 'active', 'paused'])
        .optional(),
    slots: zod_1.z
        .array(zod_1.z.object({
        id: zod_1.z.string().optional(),
        type: zod_1.z.enum([
            'headline',
            'subheadline',
            'body',
            'cta',
            'primaryText',
            'description',
        ]),
        content: zod_1.z.string(),
        variations: zod_1.z.array(zod_1.z.string()).optional(),
        maxLength: zod_1.z.number().optional(),
        platformSpecific: zod_1.z.record(zod_1.z.string()).optional(),
        metadata: zod_1.z.record(zod_1.z.any()).optional(),
    }))
        .optional(),
    abTestSettings: zod_1.z
        .object({
        enabled: zod_1.z.boolean(),
        variants: zod_1.z.array(zod_1.z.string()),
        testDuration: zod_1.z.number(),
        successMetrics: zod_1.z.array(zod_1.z.string()),
    })
        .optional(),
});
var adCreativeIdSchema = zod_1.z.object({
    adCreativeId: zod_1.z.string().min(1, 'Ad Creative ID is required'),
});
// Phase 1.2: Ad-Copy Mode validation schemas
var generateAdCopySchema = zod_1.z.object({
    campaignId: zod_1.z.string().optional(),
    brandKitId: zod_1.z.string().optional(),
    assetDescription: zod_1.z.string().min(1, 'Asset description is required'),
    platforms: zod_1.z
        .array(zod_1.z.enum(['instagram', 'facebook', 'linkedin']))
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
    variationType: zod_1.z.enum(['main', 'alt1', 'alt2', 'alt3', 'punchy', 'short', 'story']),
});
var generateMultipleAdCopySchema = zod_1.z.object({
    campaignId: zod_1.z.string().optional(),
    brandKitId: zod_1.z.string().optional(),
    assetDescription: zod_1.z.string().min(1, 'Asset description is required'),
    platforms: zod_1.z
        .array(zod_1.z.enum(['instagram', 'facebook', 'linkedin']))
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
    variationTypes: zod_1.z
        .array(zod_1.z.enum(['main', 'alt1', 'alt2', 'alt3', 'punchy', 'short', 'story']))
        .min(1, 'At least one variation type is required'),
});
// Phase 1.3: Campaign-Aware Prompting validation schema
var analyzeCampaignContextSchema = zod_1.z.object({
    campaignId: zod_1.z.string().min(1, 'Campaign ID is required'),
    brandKitId: zod_1.z.string().min(1, 'Brand Kit ID is required'),
});
// In-memory storage for v1 (in production, use database)
var adCreatives = new Map();
var adCopyService = new adCopyService_1.AdCopyService();
var campaignAwareService = new campaignAwareService_1.CampaignAwareService();
/**
 * POST /api/ad-creatives/generate
 * Generate new ad creative using AI
 */
router.post('/generate', requireAuth, (0, validateRequest_1.default)(generateAdCreativeSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestData, campaign, workspace, brandKit, generator, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                requestData = req
                    .validatedData;
                campaign = auth_1.AuthModel.getCampaignById(requestData.campaignId);
                if (!campaign) {
                    return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                brandKit = auth_1.AuthModel.getBrandKitById(requestData.brandKitId);
                if (!brandKit) {
                    return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
                }
                logger_1.log.info({
                    campaignId: requestData.campaignId,
                    requestId: req.requestId,
                }, "Generating ad creative for campaign");
                generator = new adCreativeGenerator_1.AdCreativeGenerator();
                return [4 /*yield*/, generator.generateAdCreative(requestData, campaign, brandKit)
                    // Store generated creative
                ];
            case 1:
                result = _a.sent();
                // Store generated creative
                adCreatives.set(result.adCreative.id, result.adCreative);
                // Store platform versions
                Object.values(result.platformVersions).forEach(function (version) {
                    adCreatives.set(version.id, version);
                });
                logger_1.log.info({
                    adCreativeId: result.adCreative.id,
                    requestId: req.requestId,
                }, 'Ad creative generated');
                res.json({
                    success: true,
                    result: {
                        adCreative: result.adCreative,
                        platformVersions: result.platformVersions,
                        qualityScore: result.qualityScore,
                        recommendations: result.recommendations,
                        estimatedPerformance: result.estimatedPerformance,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_1.log.error({ err: error_1, requestId: req.requestId }, 'Ad creative generation error');
                if (error_1 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_1.message })];
                }
                res.status(500).json({ error: 'Failed to generate ad creative' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/ad-creatives
 * List all ad creatives for the agency
 */
router.get('/', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, campaignId_1, status_1, platform_1, _b, page, _c, limit, agencyCampaigns, campaignIds_1, filteredCreatives, startIndex, endIndex, paginatedCreatives;
    return __generator(this, function (_d) {
        try {
            _a = req.query, campaignId_1 = _a.campaignId, status_1 = _a.status, platform_1 = _a.platform, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 20 : _c;
            agencyCampaigns = auth_1.AuthModel.getAllCampaigns().filter(function (campaign) {
                var workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                return (workspace === null || workspace === void 0 ? void 0 : workspace.agencyId) === req.agency.id;
            });
            campaignIds_1 = agencyCampaigns.map(function (c) { return c.id; });
            filteredCreatives = Array.from(adCreatives.values()).filter(function (creative) {
                var matches = true;
                if (campaignId_1) {
                    matches = matches && creative.campaignId === campaignId_1;
                }
                if (status_1) {
                    matches = matches && creative.status === status_1;
                }
                if (platform_1) {
                    matches = matches && creative.primaryPlatform === platform_1;
                }
                matches = matches && campaignIds_1.includes(creative.campaignId);
                return matches;
            });
            // Sort by creation date (newest first)
            filteredCreatives.sort(function (a, b) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            startIndex = (Number(page) - 1) * Number(limit);
            endIndex = startIndex + Number(limit);
            paginatedCreatives = filteredCreatives.slice(startIndex, endIndex);
            res.json({
                success: true,
                adCreatives: paginatedCreatives,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: filteredCreatives.length,
                    totalPages: Math.ceil(filteredCreatives.length / Number(limit)),
                },
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'List ad creatives error');
            res.status(500).json({ error: 'Failed to list ad creatives' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/ad-creatives/:adCreativeId
 * Get specific ad creative by ID
 */
router.get('/:adCreativeId', requireAuth, (0, validateRequest_1.default)(adCreativeIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var adCreativeId, adCreative, campaign, workspace;
    return __generator(this, function (_a) {
        try {
            adCreativeId = req.validatedData.adCreativeId;
            adCreative = adCreatives.get(adCreativeId);
            if (!adCreative) {
                return [2 /*return*/, res.status(404).json({ error: 'Ad creative not found' })];
            }
            campaign = auth_1.AuthModel.getCampaignById(adCreative.campaignId);
            if (!campaign) {
                return [2 /*return*/, res.status(404).json({ error: 'Associated campaign not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            res.json({
                success: true,
                adCreative: adCreative,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Get ad creative error');
            res.status(500).json({ error: 'Failed to get ad creative' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * PUT /api/ad-creatives/:adCreativeId
 * Update ad creative
 */
router.put('/:adCreativeId', requireAuth, (0, validateRequest_1.default)(updateAdCreativeSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var adCreativeId, updateData, existingCreative_1, campaign, workspace, updatedCreative;
    return __generator(this, function (_a) {
        try {
            adCreativeId = req.params.adCreativeId;
            updateData = req.validatedData;
            existingCreative_1 = adCreatives.get(adCreativeId);
            if (!existingCreative_1) {
                return [2 /*return*/, res.status(404).json({ error: 'Ad creative not found' })];
            }
            campaign = auth_1.AuthModel.getCampaignById(existingCreative_1.campaignId);
            if (!campaign) {
                return [2 /*return*/, res.status(404).json({ error: 'Associated campaign not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            updatedCreative = __assign(__assign(__assign({}, existingCreative_1), updateData), { updatedAt: new Date(), version: existingCreative_1.version + 1 });
            // Handle slot updates
            if (updateData.slots) {
                updatedCreative.slots = updateData.slots.map(function (slotUpdate) {
                    if (slotUpdate.id) {
                        // Update existing slot
                        var existingSlot = existingCreative_1.slots.find(function (s) { return s.id === slotUpdate.id; });
                        return existingSlot
                            ? __assign(__assign({}, existingSlot), slotUpdate) : slotUpdate;
                    }
                    else {
                        // Add new slot
                        return __assign(__assign({}, slotUpdate), { id: "slot-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)) });
                    }
                });
            }
            adCreatives.set(adCreativeId, updatedCreative);
            logger_1.log.info({ adCreativeId: adCreativeId, requestId: req.requestId }, "Ad creative updated");
            res.json({
                success: true,
                adCreative: updatedCreative,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Update ad creative error');
            if (error instanceof Error) {
                return [2 /*return*/, res.status(400).json({ error: error.message })];
            }
            res.status(500).json({ error: 'Failed to update ad creative' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * DELETE /api/ad-creatives/:adCreativeId
 * Delete ad creative
 */
router.delete('/:adCreativeId', requireAuth, (0, validateRequest_1.default)(adCreativeIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var adCreativeId, existingCreative, campaign, workspace;
    return __generator(this, function (_a) {
        try {
            adCreativeId = req.validatedData.adCreativeId;
            existingCreative = adCreatives.get(adCreativeId);
            if (!existingCreative) {
                return [2 /*return*/, res.status(404).json({ error: 'Ad creative not found' })];
            }
            campaign = auth_1.AuthModel.getCampaignById(existingCreative.campaignId);
            if (!campaign) {
                return [2 /*return*/, res.status(404).json({ error: 'Associated campaign not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            adCreatives.delete(adCreativeId);
            logger_1.log.info({ adCreativeId: adCreativeId, requestId: req.requestId }, "Ad creative deleted");
            res.json({
                success: true,
                message: 'Ad creative deleted successfully',
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Delete ad creative error');
            res.status(500).json({ error: 'Failed to delete ad creative' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * POST /api/ad-creatives/:adCreativeId/duplicate
 * Duplicate ad creative
 */
router.post('/:adCreativeId/duplicate', requireAuth, (0, validateRequest_1.default)(adCreativeIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var adCreativeId, existingCreative, campaign, workspace, duplicate;
    return __generator(this, function (_a) {
        try {
            adCreativeId = req.validatedData.adCreativeId;
            existingCreative = adCreatives.get(adCreativeId);
            if (!existingCreative) {
                return [2 /*return*/, res.status(404).json({ error: 'Ad creative not found' })];
            }
            campaign = auth_1.AuthModel.getCampaignById(existingCreative.campaignId);
            if (!campaign) {
                return [2 /*return*/, res.status(404).json({ error: 'Associated campaign not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            duplicate = __assign(__assign({}, existingCreative), { id: "ad-creative-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)), name: "".concat(existingCreative.name, " (Copy)"), status: 'draft', slots: existingCreative.slots.map(function (slot) { return (__assign(__assign({}, slot), { id: "".concat(slot.type, "-").concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)) })); }), createdAt: new Date(), updatedAt: new Date(), version: 1, performance: undefined });
            adCreatives.set(duplicate.id, duplicate);
            logger_1.log.info({ adCreativeId: duplicate.id, requestId: req.requestId }, "Ad creative duplicated");
            res.json({
                success: true,
                adCreative: duplicate,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Duplicate ad creative error');
            res.status(500).json({ error: 'Failed to duplicate ad creative' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * POST /api/ad-creatives/:adCreativeId/analyze
 * Analyze ad creative performance and quality
 */
router.post('/:adCreativeId/analyze', requireAuth, (0, validateRequest_1.default)(adCreativeIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var adCreativeId, adCreative, campaign, workspace, generator, analysisRequest, brandKit, qualityScore, recommendations, estimatedPerformance, error_2;
    var _a, _b, _c, _d, _e, _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                _h.trys.push([0, 4, , 5]);
                adCreativeId = req.validatedData.adCreativeId;
                adCreative = adCreatives.get(adCreativeId);
                if (!adCreative) {
                    return [2 /*return*/, res.status(404).json({ error: 'Ad creative not found' })];
                }
                campaign = auth_1.AuthModel.getCampaignById(adCreative.campaignId);
                if (!campaign) {
                    return [2 /*return*/, res.status(404).json({ error: 'Associated campaign not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                generator = new adCreativeGenerator_1.AdCreativeGenerator();
                analysisRequest = {
                    campaignId: adCreative.campaignId,
                    brandKitId: adCreative.brandKitId,
                    objective: adCreative.objective,
                    funnelStage: adCreative.funnelStage,
                    platforms: [adCreative.primaryPlatform],
                    targetAudience: {
                        demographics: ((_b = (_a = campaign.brief) === null || _a === void 0 ? void 0 : _a.primaryAudience) === null || _b === void 0 ? void 0 : _b.demographics) || '',
                        psychographics: ((_d = (_c = campaign.brief) === null || _c === void 0 ? void 0 : _c.primaryAudience) === null || _d === void 0 ? void 0 : _d.psychographics) || '',
                        painPoints: ((_f = (_e = campaign.brief) === null || _e === void 0 ? void 0 : _e.primaryAudience) === null || _f === void 0 ? void 0 : _f.painPoints) || [],
                    },
                    keyMessage: ((_g = campaign.brief) === null || _g === void 0 ? void 0 : _g.keyMessage) || '',
                    cta: campaign.primaryCTA || '',
                    tone: ['professional'],
                    variations: 3,
                    includeVisuals: false,
                };
                brandKit = auth_1.AuthModel.getBrandKitById(adCreative.brandKitId);
                if (!brandKit) {
                    return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
                }
                return [4 /*yield*/, generator['calculateQualityScore'](adCreative, analysisRequest, brandKit)];
            case 1:
                qualityScore = _h.sent();
                return [4 /*yield*/, generator['generateRecommendations'](adCreative, analysisRequest)];
            case 2:
                recommendations = _h.sent();
                return [4 /*yield*/, generator['estimatePerformance'](adCreative, analysisRequest)];
            case 3:
                estimatedPerformance = _h.sent();
                res.json({
                    success: true,
                    analysis: {
                        qualityScore: qualityScore,
                        recommendations: recommendations,
                        estimatedPerformance: estimatedPerformance,
                        slotAnalysis: adCreative.slots.map(function (slot) { return ({
                            type: slot.type,
                            contentLength: slot.content.length,
                            variationCount: slot.variations.length,
                            hasPlatformSpecific: !!slot.platformSpecific,
                        }); }),
                    },
                });
                return [3 /*break*/, 5];
            case 4:
                error_2 = _h.sent();
                logger_1.log.error({ err: error_2, requestId: req.requestId }, 'Analyze ad creative error');
                res.status(500).json({ error: 'Failed to analyze ad creative' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// Phase 1.2: Ad-Copy Mode Endpoints
/**
 * POST /api/ad-creatives/adcopy/generate
 * Generate ad copy content for a single variation
 */
router.post('/adcopy/generate', requireAuth, (0, validateRequest_1.default)(generateAdCopySchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestData, campaign, workspace, brandKit, workspace, result, error_3;
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
                    variationType: requestData.variationType,
                    platforms: requestData.platforms,
                    requestId: req.requestId,
                }, "Generating ad copy content");
                return [4 /*yield*/, adCopyService.generateAdCopy(requestData, campaign, brandKit)];
            case 1:
                result = _a.sent();
                logger_1.log.info({
                    variationType: requestData.variationType,
                    qualityScore: result.qualityScore,
                    requestId: req.requestId,
                }, "Ad copy generated successfully");
                res.json({
                    success: true,
                    result: {
                        variation: result.variation,
                        adCopy: result.adCopy,
                        qualityScore: result.qualityScore,
                        recommendations: result.recommendations,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                logger_1.log.error({ err: error_3, requestId: req.requestId }, 'Ad copy generation error');
                if (error_3 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_3.message })];
                }
                res.status(500).json({ error: 'Failed to generate ad copy' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/ad-creatives/adcopy/generate-multiple
 * Generate ad copy content for multiple variations
 */
router.post('/adcopy/generate-multiple', requireAuth, (0, validateRequest_1.default)(generateMultipleAdCopySchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestData, campaign, workspace, brandKit, workspace, results, _i, _a, variationType, variationRequest, result, averageQualityScore, allRecommendations, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
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
                    variationTypes: requestData.variationTypes,
                    platforms: requestData.platforms,
                    requestId: req.requestId,
                }, "Generating multiple ad copy variations");
                results = [];
                _i = 0, _a = requestData.variationTypes;
                _b.label = 1;
            case 1:
                if (!(_i < _a.length)) return [3 /*break*/, 4];
                variationType = _a[_i];
                variationRequest = __assign(__assign({}, requestData), { variationType: variationType });
                return [4 /*yield*/, adCopyService.generateAdCopy(variationRequest, campaign, brandKit)];
            case 2:
                result = _b.sent();
                results.push(result);
                _b.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4:
                averageQualityScore = results.reduce(function (sum, r) { return sum + r.qualityScore; }, 0) / results.length;
                allRecommendations = results.flatMap(function (r) { return r.recommendations; });
                logger_1.log.info({
                    variationCount: results.length,
                    averageQualityScore: averageQualityScore,
                    requestId: req.requestId,
                }, "Multiple ad copy variations generated successfully");
                res.json({
                    success: true,
                    results: {
                        variations: results.map(function (r) { return ({
                            variation: r.variation,
                            adCopy: r.adCopy,
                            qualityScore: r.qualityScore,
                            recommendations: r.recommendations,
                        }); }),
                        statistics: {
                            totalVariations: results.length,
                            averageQualityScore: averageQualityScore,
                            allRecommendations: allRecommendations,
                        },
                    },
                });
                return [3 /*break*/, 6];
            case 5:
                error_4 = _b.sent();
                logger_1.log.error({ err: error_4, requestId: req.requestId }, 'Multiple ad copy generation error');
                if (error_4 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_4.message })];
                }
                res.status(500).json({ error: 'Failed to generate multiple ad copy variations' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/ad-creatives/adcopy/health
 * Health check endpoint for ad copy service
 */
router.get('/adcopy/health', function (req, res) {
    res.json({
        status: 'ok',
        service: 'ad-copy-service',
        timestamp: new Date().toISOString(),
        capabilities: [
            'single-variation-generation',
            'multiple-variation-generation',
            'platform-specific-optimization',
            'quality-scoring',
            'recommendations',
        ],
    });
});
// Phase 1.3: Campaign-Aware Prompting Endpoints
/**
 * POST /api/ad-creatives/campaign-context/analyze
 * Analyze campaign context and provide recommendations
 */
router.post('/campaign-context/analyze', requireAuth, (0, validateRequest_1.default)(analyzeCampaignContextSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, campaignId, brandKitId, campaign, workspace, brandKit, brandWorkspace, campaignContext, analysis;
    return __generator(this, function (_b) {
        try {
            _a = req.validatedData, campaignId = _a.campaignId, brandKitId = _a.brandKitId;
            campaign = auth_1.AuthModel.getCampaignById(campaignId);
            if (!campaign) {
                return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            brandKit = auth_1.AuthModel.getBrandKitById(brandKitId);
            if (!brandKit) {
                return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
            }
            brandWorkspace = auth_1.AuthModel.getWorkspaceById(brandKit.workspaceId);
            if (!brandWorkspace || brandWorkspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied to brand kit' })];
            }
            logger_1.log.info({
                campaignId: campaignId,
                brandKitId: brandKitId,
                requestId: req.requestId,
            }, "Analyzing campaign context");
            campaignContext = campaignAwareService.buildCampaignContext(campaign, brandKit);
            analysis = campaignAwareService.analyzeCampaignContext(campaignContext);
            logger_1.log.info({
                campaignId: campaignId,
                contextScore: analysis.score,
                gapCount: analysis.gaps.length,
                requestId: req.requestId,
            }, "Campaign context analyzed successfully");
            res.json({
                success: true,
                result: {
                    campaignContext: campaignContext,
                    analysis: analysis,
                    recommendations: {
                        immediate: analysis.recommendations.filter(function (r) { return r.includes('Missing'); }),
                        strategic: analysis.recommendations.filter(function (r) { return !r.includes('Missing'); }),
                    },
                },
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Campaign context analysis error');
            if (error instanceof Error) {
                return [2 /*return*/, res.status(400).json({ error: error.message })];
            }
            res.status(500).json({ error: 'Failed to analyze campaign context' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * POST /api/ad-creatives/campaign-context/generate-prompt
 * Generate campaign-aware prompt for testing
 */
router.post('/campaign-context/generate-prompt', requireAuth, (0, validateRequest_1.default)(analyzeCampaignContextSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, campaignId, brandKitId, _b, assetDescription, variationType, platforms, contentType, campaign, workspace, brandKit, brandWorkspace, campaignContext, assetContext, prompt_1;
    var _c;
    return __generator(this, function (_d) {
        try {
            _a = req.validatedData, campaignId = _a.campaignId, brandKitId = _a.brandKitId;
            _b = req.body, assetDescription = _b.assetDescription, variationType = _b.variationType, platforms = _b.platforms, contentType = _b.contentType;
            campaign = auth_1.AuthModel.getCampaignById(campaignId);
            if (!campaign) {
                return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            brandKit = auth_1.AuthModel.getBrandKitById(brandKitId);
            if (!brandKit) {
                return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
            }
            brandWorkspace = auth_1.AuthModel.getWorkspaceById(brandKit.workspaceId);
            if (!brandWorkspace || brandWorkspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied to brand kit' })];
            }
            logger_1.log.info({
                campaignId: campaignId,
                brandKitId: brandKitId,
                contentType: contentType || 'adcopy',
                requestId: req.requestId,
            }, "Generating campaign-aware prompt");
            campaignContext = campaignAwareService.buildCampaignContext(campaign, brandKit);
            assetContext = {
                description: assetDescription || 'Sample product or service description',
                category: contentType || 'ad-copy',
                features: [],
                benefits: [((_c = campaign.brief) === null || _c === void 0 ? void 0 : _c.keyMessage) || brandKit.valueProposition || 'High quality products'],
                useCases: ["Drive ".concat(campaign.objective, " through compelling content")],
            };
            prompt_1 = campaignAwareService.generateCampaignAwarePrompt(campaignContext, assetContext, variationType || 'main', platforms || ['instagram', 'facebook'], contentType || 'adcopy');
            logger_1.log.info({
                campaignId: campaignId,
                promptLength: prompt_1.length,
                requestId: req.requestId,
            }, "Campaign-aware prompt generated successfully");
            res.json({
                success: true,
                result: {
                    prompt: prompt_1,
                    contextSummary: {
                        campaignName: campaign.name,
                        brandName: brandKit.name,
                        objective: campaign.objective,
                        targetAudience: campaignContext.targetAudience.demographics,
                        tone: campaignContext.contentGuidelines.tone,
                        keywords: campaignContext.contentGuidelines.keywords,
                    },
                },
            });
        }
        catch (error) {
            logger_1.log.error({ err: error, requestId: req.requestId }, 'Campaign-aware prompt generation error');
            if (error instanceof Error) {
                return [2 /*return*/, res.status(400).json({ error: error.message })];
            }
            res.status(500).json({ error: 'Failed to generate campaign-aware prompt' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/ad-creatives/campaign-context/health
 * Health check endpoint for campaign-aware service
 */
router.get('/campaign-context/health', function (req, res) {
    res.json({
        status: 'ok',
        service: 'campaign-aware-service',
        timestamp: new Date().toISOString(),
        capabilities: [
            'campaign-context-building',
            'context-quality-analysis',
            'campaign-aware-prompting',
            'brand-integration',
            'audience-analysis',
            'messaging-strategy',
        ],
    });
});
/**
 * GET /api/ad-creatives/health
 * Health check endpoint
 */
router.get('/health', function (req, res) {
    res.json({
        status: 'ok',
        service: 'ad-creative-service',
        timestamp: new Date().toISOString(),
        adCreativesCount: adCreatives.size,
    });
});
exports.default = router;
