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
var express_1 = require("express");
var zod_1 = require("zod");
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var auth_2 = require("../routes/auth");
var validateRequest_1 = __importDefault(require("../middleware/validateRequest"));
var styleLearningService_1 = require("../services/styleLearningService");
var templateMatchingService_1 = require("../services/templateMatchingService");
var consistencyScoringService_1 = require("../services/consistencyScoringService");
var router = (0, express_1.Router)();
var requireAuth = (0, auth_2.createAuthMiddleware)();
// Validation schemas
var styleLearningRequestSchema = zod_1.z.object({
    brandKitId: zod_1.z.string().min(1, 'Brand Kit ID is required'),
    agencyId: zod_1.z.string().min(1, 'Agency ID is required'),
    dataSources: zod_1.z.object({
        referenceCreatives: zod_1.z.array(zod_1.z.string()).optional(),
        pastCampaigns: zod_1.z.array(zod_1.z.string()).optional(),
        topPerformingAds: zod_1.z.array(zod_1.z.string()).optional(),
        brandAssets: zod_1.z.array(zod_1.z.string()).optional(),
        websiteContent: zod_1.z.string().optional(),
        competitorAnalysis: zod_1.z.array(zod_1.z.string()).optional(),
    }),
    learningParameters: zod_1.z
        .object({
        sampleSize: zod_1.z.number().min(10).optional(),
        minConfidence: zod_1.z.number().min(0).max(100).optional(),
        includeIndustryBenchmarks: zod_1.z.boolean().optional(),
        updateExistingProfile: zod_1.z.boolean().optional(),
    })
        .optional(),
});
var templateMatchingRequestSchema = zod_1.z.object({
    styleProfileId: zod_1.z.string().min(1, 'Style Profile ID is required'),
    campaignBrief: zod_1.z.object({
        objective: zod_1.z.string(),
        funnelStage: zod_1.z.string(),
        targetAudience: zod_1.z.string(),
        keyMessage: zod_1.z.string(),
        industry: zod_1.z.string(),
    }),
    platform: zod_1.z.enum(['instagram', 'facebook', 'linkedin', 'twitter', 'tiktok']),
    constraints: zod_1.z
        .object({
        budget: zod_1.z.enum(['low', 'medium', 'high']).optional(),
        timeline: zod_1.z.enum(['urgent', 'normal', 'flexible']).optional(),
        resources: zod_1.z.array(zod_1.z.string()).optional(),
    })
        .optional(),
    preferences: zod_1.z
        .object({
        templates: zod_1.z.array(zod_1.z.string()).optional(),
        excludeCategories: zod_1.z.array(zod_1.z.string()).optional(),
        minPerformance: zod_1.z.number().optional(),
    })
        .optional(),
});
var consistencyScoreRequestSchema = zod_1.z.object({
    creativeId: zod_1.z.string().min(1, 'Creative ID is required'),
    styleProfileId: zod_1.z.string().min(1, 'Style Profile ID is required'),
    platform: zod_1.z.string().optional(),
    analysisDepth: zod_1.z
        .enum(['quick', 'standard', 'comprehensive'])
        .optional()
        .default('standard'),
});
var styleProfileIdSchema = zod_1.z.object({
    profileId: zod_1.z.string().min(1, 'Style Profile ID is required'),
});
var templateIdSchema = zod_1.z.object({
    templateId: zod_1.z.string().min(1, 'Template ID is required'),
});
// In-memory storage for v1 (in production, use database)
var styleProfiles = new Map();
var templates = new Map();
// Service instances
var styleLearningService = new styleLearningService_1.StyleLearningService();
var templateMatchingService = new templateMatchingService_1.TemplateMatchingService();
var consistencyScoringService = new consistencyScoringService_1.ConsistencyScoringService();
/**
 * POST /api/style-memory/learn
 * Learn and update style profile from brand data
 */
router.post('/learn', requireAuth, (0, validateRequest_1.default)(styleLearningRequestSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestData, brandKit, workspace, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                requestData = req.validatedData;
                brandKit = auth_1.AuthModel.getBrandKitById(requestData.brandKitId);
                if (!brandKit) {
                    return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(brandKit.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                logger_1.log.info({ brandKitId: requestData.brandKitId }, 'Starting style learning for brand kit');
                return [4 /*yield*/, styleLearningService.learnStyleProfile(requestData)
                    // Store the style profile
                ];
            case 1:
                result = _a.sent();
                // Store the style profile
                styleProfiles.set(result.styleProfile.id, result.styleProfile);
                logger_1.log.info({ styleProfileId: result.styleProfile.id }, 'Style profile learned');
                res.json({
                    success: true,
                    result: {
                        styleProfile: result.styleProfile,
                        insights: result.insights,
                        recommendations: result.recommendations,
                        templateSuggestions: result.templateSuggestions,
                        performancePredictions: result.performancePredictions,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_1.log.error({ err: error_1 }, 'Style learning error');
                if (error_1 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_1.message })];
                }
                res.status(500).json({ error: 'Failed to learn style profile' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/style-memory/profiles
 * List all style profiles for the agency
 */
router.get('/profiles', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, brandKitId_1, _b, page, _c, limit, agencyBrandKits, brandKitIds_1, filteredProfiles, startIndex, endIndex, paginatedProfiles;
    return __generator(this, function (_d) {
        try {
            _a = req.query, brandKitId_1 = _a.brandKitId, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 20 : _c;
            agencyBrandKits = auth_1.AuthModel.getAllBrandKits().filter(function (brandKit) {
                var workspace = auth_1.AuthModel.getWorkspaceById(brandKit.workspaceId);
                return (workspace === null || workspace === void 0 ? void 0 : workspace.agencyId) === req.agency.id;
            });
            brandKitIds_1 = agencyBrandKits.map(function (bk) { return bk.id; });
            filteredProfiles = Array.from(styleProfiles.values()).filter(function (profile) {
                var matches = true;
                if (brandKitId_1) {
                    matches = matches && profile.brandKitId === brandKitId_1;
                }
                matches = matches && brandKitIds_1.includes(profile.brandKitId);
                return matches;
            });
            // Sort by creation date (newest first)
            filteredProfiles.sort(function (a, b) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            startIndex = (Number(page) - 1) * Number(limit);
            endIndex = startIndex + Number(limit);
            paginatedProfiles = filteredProfiles.slice(startIndex, endIndex);
            res.json({
                success: true,
                styleProfiles: paginatedProfiles,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: filteredProfiles.length,
                    totalPages: Math.ceil(filteredProfiles.length / Number(limit)),
                },
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'List style profiles error');
            res.status(500).json({ error: 'Failed to list style profiles' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/style-memory/profiles/:profileId
 * Get specific style profile
 */
router.get('/profiles/:profileId', requireAuth, (0, validateRequest_1.default)(styleProfileIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var profileId, styleProfile, brandKit, workspace;
    return __generator(this, function (_a) {
        try {
            profileId = req.validatedData.profileId;
            styleProfile = styleProfiles.get(profileId);
            if (!styleProfile) {
                return [2 /*return*/, res.status(404).json({ error: 'Style profile not found' })];
            }
            brandKit = auth_1.AuthModel.getBrandKitById(styleProfile.brandKitId);
            if (!brandKit) {
                return [2 /*return*/, res.status(404).json({ error: 'Associated brand kit not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(brandKit.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            res.json({
                success: true,
                styleProfile: styleProfile,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get style profile error');
            res.status(500).json({ error: 'Failed to get style profile' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * POST /api/style-memory/templates/match
 * Find best matching templates
 */
router.post('/templates/match', requireAuth, (0, validateRequest_1.default)(templateMatchingRequestSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestData, styleProfile, brandKit, workspace, result, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                requestData = req.validatedData;
                styleProfile = styleProfiles.get(requestData.styleProfileId);
                if (!styleProfile) {
                    return [2 /*return*/, res.status(404).json({ error: 'Style profile not found' })];
                }
                brandKit = auth_1.AuthModel.getBrandKitById(styleProfile.brandKitId);
                if (!brandKit) {
                    return [2 /*return*/, res.status(404).json({ error: 'Associated brand kit not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(brandKit.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                logger_1.log.info({ styleProfileId: requestData.styleProfileId }, 'Finding template matches for style profile');
                return [4 /*yield*/, templateMatchingService.findMatchingTemplates(requestData)];
            case 1:
                result = _a.sent();
                logger_1.log.info({
                    matches: result.matches.length,
                    styleProfileId: requestData.styleProfileId,
                }, 'Found matching templates');
                res.json({
                    success: true,
                    result: result,
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_1.log.error({ err: error_2 }, 'Template matching error');
                if (error_2 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_2.message })];
                }
                res.status(500).json({ error: 'Failed to match templates' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/style-memory/templates
 * List all available templates
 */
router.get('/templates', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, category_1, industry_1, _b, page, _c, limit, search, filteredTemplates, searchTerm_1, startIndex, endIndex, paginatedTemplates;
    return __generator(this, function (_d) {
        try {
            _a = req.query, category_1 = _a.category, industry_1 = _a.industry, _b = _a.page, page = _b === void 0 ? 1 : _b, _c = _a.limit, limit = _c === void 0 ? 20 : _c, search = _a.search;
            filteredTemplates = Array.from(templates.values());
            // Apply filters
            if (category_1) {
                filteredTemplates = filteredTemplates.filter(function (t) { return t.category === category_1; });
            }
            if (industry_1) {
                filteredTemplates = filteredTemplates.filter(function (t) {
                    return t.configuration.industries.includes(industry_1) ||
                        t.configuration.industries.includes('generic');
                });
            }
            if (search) {
                searchTerm_1 = search.toLowerCase();
                filteredTemplates = filteredTemplates.filter(function (t) {
                    return t.name.toLowerCase().includes(searchTerm_1) ||
                        t.description.toLowerCase().includes(searchTerm_1) ||
                        t.tags.some(function (tag) { return tag.toLowerCase().includes(searchTerm_1); });
                });
            }
            // Sort by rating and usage
            filteredTemplates.sort(function (a, b) {
                var scoreA = a.metadata.rating * (1 + a.performance.usageCount * 0.1);
                var scoreB = b.metadata.rating * (1 + b.performance.usageCount * 0.1);
                return scoreB - scoreA;
            });
            startIndex = (Number(page) - 1) * Number(limit);
            endIndex = startIndex + Number(limit);
            paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);
            res.json({
                success: true,
                templates: paginatedTemplates,
                pagination: {
                    page: Number(page),
                    limit: Number(limit),
                    total: filteredTemplates.length,
                    totalPages: Math.ceil(filteredTemplates.length / Number(limit)),
                },
                categories: [
                    'ecommerce',
                    'saas',
                    'service',
                    'b2b',
                    'lifestyle',
                    'education',
                    'healthcare',
                    'generic',
                ],
                industries: [
                    'ecommerce',
                    'saas',
                    'healthcare',
                    'finance',
                    'education',
                    'retail',
                    'technology',
                ],
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'List templates error');
            res.status(500).json({ error: 'Failed to list templates' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/style-memory/templates/:templateId
 * Get specific template
 */
router.get('/templates/:templateId', requireAuth, (0, validateRequest_1.default)(templateIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var templateId, template;
    return __generator(this, function (_a) {
        try {
            templateId = req.validatedData.templateId;
            template = templates.get(templateId);
            if (!template) {
                return [2 /*return*/, res.status(404).json({ error: 'Template not found' })];
            }
            res.json({
                success: true,
                template: template,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get template error');
            res.status(500).json({ error: 'Failed to get template' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * POST /api/style-memory/consistency/score
 * Score creative consistency
 */
router.post('/consistency/score', requireAuth, (0, validateRequest_1.default)(consistencyScoreRequestSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var requestData, styleProfile, brandKit, workspace, result, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                requestData = req.validatedData;
                styleProfile = styleProfiles.get(requestData.styleProfileId);
                if (!styleProfile) {
                    return [2 /*return*/, res.status(404).json({ error: 'Style profile not found' })];
                }
                brandKit = auth_1.AuthModel.getBrandKitById(styleProfile.brandKitId);
                if (!brandKit) {
                    return [2 /*return*/, res.status(404).json({ error: 'Associated brand kit not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(brandKit.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                logger_1.log.info({ creativeId: requestData.creativeId }, 'Scoring consistency for creative');
                return [4 /*yield*/, consistencyScoringService.scoreConsistency(requestData)];
            case 1:
                result = _a.sent();
                logger_1.log.info({
                    overallScore: result.overallScore,
                    creativeId: requestData.creativeId,
                }, 'Consistency score calculated');
                res.json({
                    success: true,
                    result: result,
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                logger_1.log.error({ err: error_3 }, 'Consistency scoring error');
                if (error_3 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_3.message })];
                }
                res.status(500).json({ error: 'Failed to score consistency' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * POST /api/style-memory/templates/:templateId/use
 * Record template usage for learning
 */
router.post('/templates/:templateId/use', requireAuth, (0, validateRequest_1.default)(templateIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var templateId, template;
    return __generator(this, function (_a) {
        try {
            templateId = req.validatedData.templateId;
            template = templates.get(templateId);
            if (!template) {
                return [2 /*return*/, res.status(404).json({ error: 'Template not found' })];
            }
            // Update usage statistics
            template.performance.usageCount++;
            template.metadata.updatedAt = new Date();
            logger_1.log.info({ templateId: templateId }, 'Template usage recorded');
            res.json({
                success: true,
                template: template,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Record template usage error');
            res.status(500).json({ error: 'Failed to record template usage' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * POST /api/style-memory/templates/:templateId/review
 * Add template review
 */
router.post('/templates/:templateId/review', requireAuth, (0, validateRequest_1.default)(templateIdSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var templateId, _a, rating, comment, template, review, totalRating;
    return __generator(this, function (_b) {
        try {
            templateId = req.validatedData.templateId;
            _a = req.body, rating = _a.rating, comment = _a.comment;
            if (!rating || rating < 1 || rating > 5) {
                return [2 /*return*/, res.status(400).json({ error: 'Rating must be between 1 and 5' })];
            }
            template = templates.get(templateId);
            if (!template) {
                return [2 /*return*/, res.status(404).json({ error: 'Template not found' })];
            }
            review = {
                userId: req.user.id,
                rating: rating,
                comment: comment,
                timestamp: new Date(),
            };
            template.metadata.reviews.push(review);
            totalRating = template.metadata.reviews.reduce(function (sum, r) { return sum + r.rating; }, 0);
            template.metadata.rating = totalRating / template.metadata.reviews.length;
            template.metadata.updatedAt = new Date();
            logger_1.log.info({ templateId: templateId, rating: rating }, 'Template review added');
            res.json({
                success: true,
                template: template,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Add template review error');
            res.status(500).json({ error: 'Failed to add template review' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/style-memory/health
 * Health check endpoint
 */
router.get('/health', function (req, res) {
    res.json({
        status: 'ok',
        service: 'style-memory-service',
        timestamp: new Date().toISOString(),
        statistics: {
            styleProfilesCount: styleProfiles.size,
            templatesCount: templates.size,
        },
    });
});
exports.default = router;
