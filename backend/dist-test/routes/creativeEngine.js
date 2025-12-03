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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
var auth_1 = require("../routes/auth");
var validateRequest_1 = __importDefault(require("../middleware/validateRequest"));
var auth_2 = require("../models/auth");
var creativeEngine_1 = __importDefault(require("../services/creativeEngine"));
var logger_1 = require("../middleware/logger");
var router = (0, express_1.Router)();
logger_1.log.info('Initializing creative engine router');
var requireAuth = (0, auth_1.createAuthMiddleware)();
var engine = creativeEngine_1.default.getInstance();
// Schema validation
var generateCreativesSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().min(1, 'Workspace ID is required'),
    campaignId: zod_1.z.string().optional(),
    brandKitId: zod_1.z.string().min(1, 'Brand Kit ID is required'),
    sourceAssets: zod_1.z
        .array(zod_1.z.string())
        .min(1, 'At least one source asset is required'),
    referenceCreatives: zod_1.z.array(zod_1.z.string()).optional(),
    objectives: zod_1.z
        .array(zod_1.z.enum(['awareness', 'traffic', 'conversion', 'engagement']))
        .optional(),
    platforms: zod_1.z
        .array(zod_1.z.enum(['ig-feed', 'ig-story', 'fb-feed', 'fb-story', 'li-feed']))
        .optional(),
    outputCount: zod_1.z.number().min(1).max(50).optional(),
    mode: zod_1.z.enum(['caption', 'ad-copy']).optional(),
    mustIncludePhrases: zod_1.z.array(zod_1.z.string()).optional(),
    mustExcludePhrases: zod_1.z.array(zod_1.z.string()).optional(),
    styleTags: zod_1.z.array(zod_1.z.string()).optional(),
});
// Debug middleware - still useful in dev mode to get request-level context
router.use(function (req, res, next) {
    logger_1.log.info({ requestId: req.requestId, method: req.method, path: req.path }, 'CREATIVE ENGINE ROUTER REQ');
    next();
});
/**
 * POST /api/creative-engine/generate - Generate finished creatives from inputs
 *
 * This is the core endpoint that transforms:
 * - reference creatives → style learning
 * - brand kits → visual identity
 * - campaign briefs → creative direction
 * - client assets → production input
 *
 * Into finished, platform-specific creatives in minutes.
 */
router.post('/generate', requireAuth, (0, validateRequest_1.default)(generateCreativesSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var startTime, authenticatedReq, validatedData, _a, sanitizeKeywords, sanitizeText_1, sanitizePhrases, workspace, brandKit, campaign, result, savedCreatives, _i, _b, creative, savedCreative, processingTime, enhancedResult, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                logger_1.log.info({ requestId: req.requestId }, 'Creative Engine: Starting creative generation');
                startTime = Date.now();
                _c.label = 1;
            case 1:
                _c.trys.push([1, 8, , 9]);
                authenticatedReq = req;
                validatedData = req.validatedData;
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../utils/sanitizers')); })];
            case 2:
                _a = _c.sent(), sanitizeKeywords = _a.sanitizeKeywords, sanitizeText_1 = _a.sanitizeText, sanitizePhrases = _a.sanitizePhrases;
                if (validatedData.styleTags)
                    validatedData.styleTags = sanitizeKeywords(validatedData.styleTags);
                if (validatedData.referenceCreatives)
                    validatedData.referenceCreatives = validatedData.referenceCreatives.map(function (rc) { return sanitizeText_1(rc, 500) || rc; });
                if (validatedData.mustIncludePhrases)
                    validatedData.mustIncludePhrases = sanitizePhrases(validatedData.mustIncludePhrases);
                if (validatedData.mustExcludePhrases)
                    validatedData.mustExcludePhrases = sanitizePhrases(validatedData.mustExcludePhrases);
                workspace = auth_2.AuthModel.getWorkspaceById(validatedData.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                brandKit = auth_2.AuthModel.getBrandKitById(validatedData.brandKitId);
                if (!brandKit || brandKit.workspaceId !== validatedData.workspaceId) {
                    return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
                }
                // Verify campaign exists and belongs to workspace if specified
                if (validatedData.campaignId) {
                    campaign = auth_2.AuthModel.getCampaignById(validatedData.campaignId);
                    if (!campaign || campaign.workspaceId !== validatedData.workspaceId) {
                        return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
                    }
                }
                logger_1.log.info({
                    requestId: req.requestId,
                    assets: validatedData.sourceAssets.length,
                }, "Creative Engine: Processing ".concat(validatedData.sourceAssets.length, " source assets"));
                logger_1.log.info({
                    requestId: req.requestId,
                    primaryColor: brandKit.colors.primary,
                    headingFont: brandKit.fonts.heading,
                }, 'Brand Kit context');
                logger_1.log.info({
                    requestId: req.requestId,
                    campaignId: validatedData.campaignId || 'General',
                }, 'Campaign context');
                return [4 /*yield*/, engine.generateCreatives({
                        workspaceId: validatedData.workspaceId,
                        campaignId: validatedData.campaignId,
                        brandKitId: validatedData.brandKitId,
                        sourceAssets: validatedData.sourceAssets,
                        referenceCreatives: validatedData.referenceCreatives,
                        objectives: validatedData.objectives,
                        platforms: validatedData.platforms,
                        outputCount: validatedData.outputCount || 5,
                        mustIncludePhrases: validatedData.mustIncludePhrases,
                        mustExcludePhrases: validatedData.mustExcludePhrases,
                        styleTags: validatedData.styleTags,
                    })
                    // Save generated creatives to the database
                ];
            case 3:
                result = _c.sent();
                savedCreatives = [];
                _i = 0, _b = result.adCreatives;
                _c.label = 4;
            case 4:
                if (!(_i < _b.length)) return [3 /*break*/, 7];
                creative = _b[_i];
                return [4 /*yield*/, auth_2.AuthModel.createAdCreative(creative)];
            case 5:
                savedCreative = _c.sent();
                savedCreatives.push(savedCreative);
                _c.label = 6;
            case 6:
                _i++;
                return [3 /*break*/, 4];
            case 7:
                processingTime = Date.now() - startTime;
                enhancedResult = __assign(__assign({}, result), { adCreatives: savedCreatives, summary: __assign(__assign({}, result.summary), { processingTime: processingTime, performance: "".concat(processingTime, "ms") }) });
                logger_1.log.info({
                    requestId: req.requestId,
                    created: savedCreatives.length,
                    processingTime: processingTime,
                }, "Creative Engine: Generated ".concat(savedCreatives.length, " creatives"));
                logger_1.log.info({
                    requestId: req.requestId,
                    platforms: enhancedResult.summary.platformsCovered,
                }, 'Coverage');
                logger_1.log.info({
                    requestId: req.requestId,
                    styleConsistency: enhancedResult.summary.styleConsistency,
                    brandAlignment: enhancedResult.summary.brandAlignment,
                }, 'Style consistency and brand alignment');
                res.status(201).json({
                    success: true,
                    result: enhancedResult,
                    message: "Generated ".concat(savedCreatives.length, " creative variations"),
                });
                return [3 /*break*/, 9];
            case 8:
                error_1 = _c.sent();
                logger_1.log.error({ requestId: req.requestId, err: error_1 }, 'Creative Engine generation failed');
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Validation error',
                            details: error_1.issues,
                        })];
                }
                res.status(500).json({
                    error: 'Creative generation failed',
                    message: error_1 instanceof Error ? error_1.message : 'Unknown error',
                });
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/creative-engine/repurpose - Create multi-platform variants from existing creative
 *
 * Transform one creative into all platform formats automatically
 */
router.post('/repurpose', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, _a, creativeId, targetPlatforms, originalCreative, workspace, variants, _i, targetPlatforms_1, platform, variant, enhancedVariant, savedVariant, error_2, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                logger_1.log.info({ requestId: req.requestId }, 'Creative Engine: Starting creative repurposing');
                _b.label = 1;
            case 1:
                _b.trys.push([1, 10, , 11]);
                authenticatedReq = req;
                _a = req.body, creativeId = _a.creativeId, targetPlatforms = _a.targetPlatforms;
                // Validate required fields
                if (!creativeId) {
                    return [2 /*return*/, res.status(400).json({ error: 'Creative ID is required' })];
                }
                if (!targetPlatforms || !Array.isArray(targetPlatforms)) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: 'Target platforms array is required' })];
                }
                originalCreative = auth_2.AuthModel.getAdCreativeById(creativeId);
                if (!originalCreative) {
                    return [2 /*return*/, res.status(404).json({ error: 'Creative not found' })];
                }
                workspace = auth_2.AuthModel.getWorkspaceById(originalCreative.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                logger_1.log.info({
                    requestId: req.requestId,
                    creativeId: creativeId,
                    platforms: targetPlatforms,
                }, "Repurposing creative ".concat(creativeId, " for platforms"));
                variants = [];
                _i = 0, targetPlatforms_1 = targetPlatforms;
                _b.label = 2;
            case 2:
                if (!(_i < targetPlatforms_1.length)) return [3 /*break*/, 9];
                platform = targetPlatforms_1[_i];
                _b.label = 3;
            case 3:
                _b.trys.push([3, 7, , 8]);
                // Skip if original is already for this platform
                if (originalCreative.placement === platform) {
                    return [3 /*break*/, 8];
                }
                return [4 /*yield*/, engine.generateCreatives({
                        workspaceId: originalCreative.workspaceId,
                        campaignId: originalCreative.campaignId,
                        brandKitId: '', // Would need to get from workspace
                        sourceAssets: [], // Would need original source asset
                        platforms: [platform],
                        outputCount: 1,
                        objectives: [originalCreative.objective || 'awareness'],
                    })];
            case 4:
                variant = _b.sent();
                if (!(variant.adCreatives.length > 0)) return [3 /*break*/, 6];
                enhancedVariant = __assign(__assign({}, variant.adCreatives[0]), { originalCreativeId: creativeId, repurposedFrom: originalCreative.placement });
                return [4 /*yield*/, auth_2.AuthModel.createAdCreative(enhancedVariant)];
            case 5:
                savedVariant = _b.sent();
                variants.push(savedVariant);
                _b.label = 6;
            case 6: return [3 /*break*/, 8];
            case 7:
                error_2 = _b.sent();
                logger_1.log.error({ requestId: req.requestId, err: error_2, platform: platform }, "Failed to create ".concat(platform, " variant"));
                return [3 /*break*/, 8];
            case 8:
                _i++;
                return [3 /*break*/, 2];
            case 9:
                logger_1.log.info({ requestId: req.requestId, created: variants.length }, "Repurposing complete: Created ".concat(variants.length, " variants"));
                res.status(201).json({
                    success: true,
                    originalCreative: originalCreative,
                    variants: variants,
                    summary: {
                        totalVariants: variants.length,
                        platformsAdded: variants.map(function (v) { return v.placement; }),
                        processingTime: 'repurposing',
                    },
                });
                return [3 /*break*/, 11];
            case 10:
                error_3 = _b.sent();
                logger_1.log.error({ requestId: req.requestId, err: error_3 }, 'Creative repurposing failed');
                res.status(500).json({
                    error: 'Creative repurposing failed',
                    message: error_3 instanceof Error ? error_3.message : 'Unknown error',
                });
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/creative-engine/insights/:workspaceId - Get style insights and recommendations
 */
router.get('/insights/:workspaceId', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, creatives, referenceCreatives, platforms, formats, layouts, insights;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            workspaceId = req.params.workspaceId;
            workspace = auth_2.AuthModel.getWorkspaceById(workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            creatives = auth_2.AuthModel.getAdCreativesByWorkspace(workspaceId);
            referenceCreatives = auth_2.AuthModel.getReferenceCreativesByWorkspace(workspaceId);
            if (creatives.length === 0) {
                return [2 /*return*/, res.json({
                        insights: {
                            hasData: false,
                            message: 'No creatives found for analysis',
                        },
                    })];
            }
            platforms = __spreadArray([], new Set(creatives.map(function (c) { return c.placement; })), true);
            formats = __spreadArray([], new Set(creatives.map(function (c) { return c.format; })), true);
            layouts = __spreadArray([], new Set(creatives.map(function (c) { return c.layout; })), true);
            insights = {
                hasData: true,
                workspaceAnalytics: {
                    totalCreatives: creatives.length,
                    referenceCreatives: referenceCreatives.length,
                    platformsCovered: platforms,
                    formatsUsed: formats,
                    commonLayouts: layouts,
                    averageApprovalRate: (creatives.filter(function (c) { return c.approvalStatus === 'approved'; }).length /
                        creatives.length) *
                        100,
                },
                stylePatterns: {
                    dominantPlatforms: platforms.slice(0, 3),
                    preferredFormats: formats.slice(0, 2),
                    layoutPreferences: layouts,
                    visualStyle: referenceCreatives.length > 0
                        ? 'Learning from references'
                        : 'Default brand kit',
                },
                recommendations: [
                    referenceCreatives.length === 0
                        ? 'Upload reference creatives to improve style consistency'
                        : null,
                    'Test different CTA variations for improved performance',
                    'Consider A/B testing different platforms with the same creative',
                    'Add more diverse source assets for greater creative variety',
                    'Review and optimize the most successful creative patterns',
                ].filter(Boolean),
            };
            res.json(insights);
        }
        catch (error) {
            logger_1.log.error({ requestId: req.requestId, err: error }, 'Get insights error');
            res.status(500).json({ error: 'Failed to generate insights' });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
