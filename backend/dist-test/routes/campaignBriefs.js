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
var campaignBriefGenerator_1 = require("../services/campaignBriefGenerator");
var router = (0, express_1.Router)();
var requireAuth = (0, auth_2.createAuthMiddleware)();
// Validation schemas
var updateCampaignBriefSchema = zod_1.z.object({
    brief: zod_1.z
        .object({
        clientOverview: zod_1.z.string().optional(),
        campaignPurpose: zod_1.z.string().optional(),
        primaryKPI: zod_1.z.string().optional(),
        secondaryKPIs: zod_1.z.array(zod_1.z.string()).optional(),
        targetMetrics: zod_1.z
            .object({
            impressions: zod_1.z.number().optional(),
            reach: zod_1.z.number().optional(),
            engagement: zod_1.z.number().optional(),
            conversions: zod_1.z.number().optional(),
            roi: zod_1.z.number().optional(),
        })
            .optional(),
        competitorInsights: zod_1.z.array(zod_1.z.string()).optional(),
        differentiators: zod_1.z.array(zod_1.z.string()).optional(),
        primaryAudience: zod_1.z
            .object({
            demographics: zod_1.z.string().optional(),
            psychographics: zod_1.z.string().optional(),
            painPoints: zod_1.z.array(zod_1.z.string()).optional(),
            motivations: zod_1.z.array(zod_1.z.string()).optional(),
        })
            .optional(),
        keyMessage: zod_1.z.string().optional(),
        supportingPoints: zod_1.z.array(zod_1.z.string()).optional(),
        emotionalAppeal: zod_1.z.string().optional(),
        mandatoryInclusions: zod_1.z.array(zod_1.z.string()).optional(),
        mandatoryExclusions: zod_1.z.array(zod_1.z.string()).optional(),
        legalRequirements: zod_1.z.array(zod_1.z.string()).optional(),
        platformSpecific: zod_1.z
            .object({
            instagram: zod_1.z.string().optional(),
            facebook: zod_1.z.string().optional(),
            linkedin: zod_1.z.string().optional(),
        })
            .optional(),
        campaignDuration: zod_1.z.string().optional(),
        seasonality: zod_1.z.string().optional(),
        urgency: zod_1.z.string().optional(),
    })
        .optional(),
});
var generateRequirementsSchema = zod_1.z.object({
    campaignId: zod_1.z.string().min(1, 'Campaign ID is required'),
});
/**
 * PUT /api/campaign-briefs/:campaignId
 * Update campaign brief
 */
router.put('/:campaignId', requireAuth, (0, validateRequest_1.default)(updateCampaignBriefSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var campaignId, brief, campaign, workspace, updatedCampaign;
    return __generator(this, function (_a) {
        try {
            campaignId = req.params.campaignId;
            brief = req.validatedData.brief;
            campaign = auth_1.AuthModel.getCampaignById(campaignId);
            if (!campaign) {
                return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            updatedCampaign = auth_1.AuthModel.updateCampaign(campaignId, {
                brief: brief,
            });
            logger_1.log.info({ campaignId: campaignId }, 'Campaign brief updated');
            res.json({
                success: true,
                campaign: updatedCampaign,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Campaign brief update error');
            if (error instanceof Error) {
                return [2 /*return*/, res.status(400).json({ error: error.message })];
            }
            res.status(500).json({ error: 'Failed to update campaign brief' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * POST /api/campaign-briefs/:campaignId/generate-requirements
 * Generate creative requirements from campaign brief
 */
router.post('/:campaignId/generate-requirements', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var campaignId, campaign, workspace, brandKit, requirements, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                campaignId = req.params.campaignId;
                campaign = auth_1.AuthModel.getCampaignById(campaignId);
                if (!campaign) {
                    return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                if (!workspace || workspace.agencyId !== req.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                brandKit = auth_1.AuthModel.getBrandKitById(campaign.brandKitId);
                if (!brandKit) {
                    return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
                }
                logger_1.log.info({ campaignId: campaignId }, 'Generating creative requirements for campaign');
                return [4 /*yield*/, campaignBriefGenerator_1.CampaignBriefGenerator.generateCreativeRequirements(campaign, brandKit)];
            case 1:
                requirements = _a.sent();
                logger_1.log.info({ campaignId: campaignId }, 'Creative requirements generated for campaign');
                res.json({
                    success: true,
                    requirements: requirements,
                    campaignId: campaignId,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_1.log.error({ err: error_1 }, 'Creative requirements generation error');
                if (error_1 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_1.message })];
                }
                res
                    .status(500)
                    .json({ error: 'Failed to generate creative requirements' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/campaign-briefs/:campaignId
 * Get campaign brief
 */
router.get('/:campaignId', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var campaignId, campaign, workspace;
    return __generator(this, function (_a) {
        try {
            campaignId = req.params.campaignId;
            campaign = auth_1.AuthModel.getCampaignById(campaignId);
            if (!campaign) {
                return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            res.json({
                success: true,
                campaign: {
                    id: campaign.id,
                    name: campaign.name,
                    brief: campaign.brief,
                    objective: campaign.objective,
                    launchType: campaign.launchType,
                    funnelStage: campaign.funnelStage,
                    primaryOffer: campaign.primaryOffer,
                    primaryCTA: campaign.primaryCTA,
                    secondaryCTA: campaign.secondaryCTA,
                    targetAudience: campaign.targetAudience,
                    placements: campaign.placements,
                },
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get campaign brief error');
            if (error instanceof Error) {
                return [2 /*return*/, res.status(400).json({ error: error.message })];
            }
            res.status(500).json({ error: 'Failed to get campaign brief' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * DELETE /api/campaign-briefs/:campaignId
 * Clear campaign brief
 */
router.delete('/:campaignId', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var campaignId, campaign, workspace, updatedCampaign;
    return __generator(this, function (_a) {
        try {
            campaignId = req.params.campaignId;
            campaign = auth_1.AuthModel.getCampaignById(campaignId);
            if (!campaign) {
                return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            updatedCampaign = auth_1.AuthModel.updateCampaign(campaignId, {
                brief: undefined,
            });
            logger_1.log.info({ campaignId: campaignId }, 'Campaign brief cleared');
            res.json({
                success: true,
                campaign: updatedCampaign,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Clear campaign brief error');
            if (error instanceof Error) {
                return [2 /*return*/, res.status(400).json({ error: error.message })];
            }
            res.status(500).json({ error: 'Failed to clear campaign brief' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * POST /api/campaign-briefs/:campaignId/validate
 * Validate campaign brief completeness
 */
router.post('/:campaignId/validate', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var campaignId, campaign, workspace, brief, validation;
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    return __generator(this, function (_l) {
        try {
            campaignId = req.params.campaignId;
            campaign = auth_1.AuthModel.getCampaignById(campaignId);
            if (!campaign) {
                return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
            if (!workspace || workspace.agencyId !== req.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            brief = campaign.brief;
            validation = {
                isValid: true,
                score: 0,
                missingFields: [],
                recommendations: [],
                completeness: {
                    clientContext: 0,
                    businessGoals: 0,
                    competitiveAnalysis: 0,
                    targetAudience: 0,
                    messaging: 0,
                    constraints: 0,
                    platformStrategy: 0,
                    timeline: 0,
                },
            };
            // Validate each section
            if (brief) {
                // Client Context (25 points)
                if (brief.clientOverview)
                    validation.completeness.clientContext += 15;
                if (brief.campaignPurpose)
                    validation.completeness.clientContext += 10;
                if (!brief.clientOverview || !brief.campaignPurpose) {
                    validation.missingFields.push('Client context (overview and purpose)');
                }
                // Business Goals (20 points)
                if (brief.primaryKPI)
                    validation.completeness.businessGoals += 10;
                if (brief.secondaryKPIs && brief.secondaryKPIs.length > 0)
                    validation.completeness.businessGoals += 10;
                if (!brief.primaryKPI || !((_a = brief.secondaryKPIs) === null || _a === void 0 ? void 0 : _a.length)) {
                    validation.missingFields.push('Business goals (KPIs)');
                }
                // Competitive Analysis (15 points)
                if (brief.competitorInsights && brief.competitorInsights.length > 0)
                    validation.completeness.competitiveAnalysis += 10;
                if (brief.differentiators && brief.differentiators.length > 0)
                    validation.completeness.competitiveAnalysis += 5;
                if (!((_b = brief.competitorInsights) === null || _b === void 0 ? void 0 : _b.length)) {
                    validation.missingFields.push('Competitive analysis');
                }
                // Target Audience (20 points)
                if ((_c = brief.primaryAudience) === null || _c === void 0 ? void 0 : _c.demographics)
                    validation.completeness.targetAudience += 8;
                if ((_d = brief.primaryAudience) === null || _d === void 0 ? void 0 : _d.psychographics)
                    validation.completeness.targetAudience += 7;
                if (((_e = brief.primaryAudience) === null || _e === void 0 ? void 0 : _e.painPoints) &&
                    brief.primaryAudience.painPoints.length > 0)
                    validation.completeness.targetAudience += 5;
                if (!((_f = brief.primaryAudience) === null || _f === void 0 ? void 0 : _f.demographics) ||
                    !((_g = brief.primaryAudience) === null || _g === void 0 ? void 0 : _g.psychographics)) {
                    validation.missingFields.push('Target audience details');
                }
                // Messaging Strategy (10 points)
                if (brief.keyMessage)
                    validation.completeness.messaging += 6;
                if (brief.supportingPoints && brief.supportingPoints.length > 0)
                    validation.completeness.messaging += 4;
                if (!brief.keyMessage) {
                    validation.missingFields.push('Key messaging strategy');
                }
                // Mandatories (5 points)
                if (brief.mandatoryInclusions || brief.mandatoryExclusions)
                    validation.completeness.constraints += 5;
                // Platform Strategy (5 points)
                if (((_h = brief.platformSpecific) === null || _h === void 0 ? void 0 : _h.instagram) ||
                    ((_j = brief.platformSpecific) === null || _j === void 0 ? void 0 : _j.facebook) ||
                    ((_k = brief.platformSpecific) === null || _k === void 0 ? void 0 : _k.linkedin)) {
                    validation.completeness.platformStrategy += 5;
                }
                // Timeline (5 points)
                if (brief.campaignDuration || brief.seasonality)
                    validation.completeness.timeline += 5;
                // Calculate total score
                validation.score = Object.values(validation.completeness).reduce(function (sum, score) { return sum + score; }, 0);
                // Determine if valid (requires at least 70 points)
                validation.isValid = validation.score >= 70;
                // Generate recommendations
                if (validation.score < 85) {
                    validation.recommendations.push('Add more detail to strengthen the brief');
                }
                if (!brief.targetMetrics) {
                    validation.recommendations.push('Specify target metrics for better measurement');
                }
                if (!brief.emotionalAppeal) {
                    validation.recommendations.push('Define emotional appeal for stronger connection');
                }
            }
            else {
                validation.isValid = false;
                validation.missingFields.push('Campaign brief not created');
                validation.recommendations.push('Create a comprehensive campaign brief');
            }
            res.json({
                success: true,
                validation: validation,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Validate campaign brief error');
            if (error instanceof Error) {
                return [2 /*return*/, res.status(400).json({ error: error.message })];
            }
            res.status(500).json({ error: 'Failed to validate campaign brief' });
        }
        return [2 /*return*/];
    });
}); });
/**
 * GET /api/campaign-briefs/health
 * Health check endpoint
 */
router.get('/health', function (req, res) {
    res.json({
        status: 'ok',
        service: 'campaign-brief-service',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
