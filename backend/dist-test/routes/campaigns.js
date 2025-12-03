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
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var zod_1 = require("zod");
var auth_1 = require("../models/auth");
var auth_2 = require("../routes/auth");
var validation_1 = require("../middleware/validation");
var validation_2 = require("../schemas/validation");
var logger_1 = require("../middleware/logger");
var router = (0, express_1.Router)();
logger_1.log.info('Initializing campaigns router');
var requireAuth = (0, auth_2.createAuthMiddleware)();
// Schema validation
var createCampaignSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Campaign name is required'),
    description: zod_1.z.string().optional(),
    brandKitId: zod_1.z.string().min(1, 'Brand kit ID is required'),
    objective: zod_1.z.enum(['awareness', 'traffic', 'conversion', 'engagement']),
    launchType: zod_1.z.enum(['new-launch', 'evergreen', 'seasonal', 'sale', 'event']),
    funnelStage: zod_1.z.enum(['cold', 'warm', 'hot']),
    primaryOffer: zod_1.z.string().optional(),
    primaryCTA: zod_1.z.string().optional(),
    secondaryCTA: zod_1.z.string().optional(),
    targetAudience: zod_1.z.string().optional(),
    placements: zod_1.z.array(zod_1.z.enum(['ig-feed', 'ig-story', 'fb-feed', 'fb-story', 'li-feed'])),
    referenceCaptions: zod_1.z.array(zod_1.z.string()).optional(),
    headlineMaxLength: zod_1.z.number().optional(),
    bodyMaxLength: zod_1.z.number().optional(),
    mustIncludePhrases: zod_1.z.array(zod_1.z.string()).optional(),
    mustExcludePhrases: zod_1.z.array(zod_1.z.string()).optional(),
});
var updateCampaignSchema = createCampaignSchema.partial();
// Debug middleware
router.use(function (req, res, next) {
    logger_1.log.debug({ method: req.method, path: req.path }, 'CAMPAIGNS ROUTER REQ');
    next();
});
// POST /api/campaigns - Create new campaign
router.post('/', requireAuth, (0, validation_1.validateRequest)({ body: validation_2.CreateCampaignSchema }), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, validatedData, sanitizeText, brandKit, workspace, campaign, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_1.log.info('Creating campaign');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                authenticatedReq = req;
                validatedData = req.body;
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../utils/sanitizers')); })];
            case 2:
                sanitizeText = (_a.sent()).sanitizeText;
                validatedData = __assign(__assign({}, validatedData), { name: sanitizeText(validatedData.name, 200) || validatedData.name, description: sanitizeText(validatedData.description, 1000) ||
                        validatedData.description, primaryCTA: sanitizeText(validatedData.primaryCTA, 50) ||
                        validatedData.primaryCTA, secondaryCTA: sanitizeText(validatedData.secondaryCTA, 50) ||
                        validatedData.secondaryCTA });
                brandKit = auth_1.AuthModel.getBrandKitById(validatedData.brandKitId);
                if (!brandKit) {
                    return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(brandKit.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                return [4 /*yield*/, auth_1.AuthModel.createCampaign({
                        workspaceId: brandKit.workspaceId,
                        brandKitId: validatedData.brandKitId,
                        name: validatedData.name,
                        description: validatedData.description,
                        objective: validatedData.objective,
                        launchType: validatedData.launchType,
                        funnelStage: validatedData.funnelStage,
                        primaryOffer: validatedData.primaryOffer,
                        primaryCTA: validatedData.primaryCTA,
                        secondaryCTA: validatedData.secondaryCTA,
                        targetAudience: validatedData.targetAudience,
                        placements: validatedData.placements,
                        headlineMaxLength: validatedData.headlineMaxLength,
                        bodyMaxLength: validatedData.bodyMaxLength,
                        mustIncludePhrases: validatedData.mustIncludePhrases,
                        mustExcludePhrases: validatedData.mustExcludePhrases,
                    })];
            case 3:
                campaign = _a.sent();
                res.status(201).json({ campaign: campaign });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: 'Validation error', details: error_1.issues })];
                }
                logger_1.log.error({ error: error_1 }, 'Create campaign error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// GET /api/campaigns - List campaigns for agency
router.get('/', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, campaigns, campaigns;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            workspaceId = req.query.workspaceId;
            if (workspaceId) {
                workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                campaigns = auth_1.AuthModel.getCampaignsByWorkspace(workspaceId);
                res.json({ campaigns: campaigns });
            }
            else {
                campaigns = auth_1.AuthModel.getCampaignsByAgency(authenticatedReq.agency.id);
                res.json({ campaigns: campaigns });
            }
        }
        catch (error) {
            logger_1.log.error({ error: error }, 'List campaigns error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/campaigns/:id - Get specific campaign
router.get('/:id', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, campaign, workspace, brandKit, referenceCreatives;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            id = req.params.id;
            campaign = auth_1.AuthModel.getCampaignById(id);
            if (!campaign) {
                return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            brandKit = auth_1.AuthModel.getBrandKitById(campaign.brandKitId);
            referenceCreatives = auth_1.AuthModel.getReferenceCreativesByCampaign(id);
            res.json({
                campaign: campaign,
                brandKit: brandKit,
                referenceCreatives: referenceCreatives,
            });
        }
        catch (error) {
            logger_1.log.error({ error: error }, 'Get campaign error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// PUT /api/campaigns/:id - Update campaign
router.put('/:id', requireAuth, (0, validation_1.validateRequest)({
    params: zod_1.z.object({ id: zod_1.z.string().min(1) }),
    body: validation_2.CreateCampaignSchema.partial(),
}), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, validatedData, sanitizeText, campaign, workspace, updatedCampaign, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                authenticatedReq = req;
                id = req.params.id;
                validatedData = req.body;
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../utils/sanitizers')); })];
            case 1:
                sanitizeText = (_a.sent()).sanitizeText;
                validatedData = __assign(__assign({}, validatedData), { name: sanitizeText(validatedData.name, 200) || validatedData.name, description: sanitizeText(validatedData.description, 1000) ||
                        validatedData.description, primaryCTA: sanitizeText(validatedData.primaryCTA, 50) ||
                        validatedData.primaryCTA, secondaryCTA: sanitizeText(validatedData.secondaryCTA, 50) ||
                        validatedData.secondaryCTA });
                campaign = auth_1.AuthModel.getCampaignById(id);
                if (!campaign) {
                    return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                return [4 /*yield*/, auth_1.AuthModel.updateCampaign(id, validatedData)];
            case 2:
                updatedCampaign = _a.sent();
                res.json({ campaign: updatedCampaign });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                if (error_2 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: 'Validation error', details: error_2.issues })];
                }
                logger_1.log.error({ error: error_2 }, 'Update campaign error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// DELETE /api/campaigns/:id - Delete campaign
router.delete('/:id', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, campaign, workspace, deleted;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            id = req.params.id;
            campaign = auth_1.AuthModel.getCampaignById(id);
            if (!campaign) {
                return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            deleted = auth_1.AuthModel.deleteCampaign(id);
            if (!deleted) {
                return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
            }
            res.json({ message: 'Campaign deleted successfully' });
        }
        catch (error) {
            logger_1.log.error({ error: error }, 'Delete campaign error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// POST /api/campaigns/:id/launch - Launch campaign (set status to active)
router.post('/:id/launch', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, campaign, workspace, launchedCampaign, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                authenticatedReq = req;
                id = req.params.id;
                campaign = auth_1.AuthModel.getCampaignById(id);
                if (!campaign) {
                    return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                return [4 /*yield*/, auth_1.AuthModel.updateCampaign(id, {
                        status: 'active',
                    })];
            case 1:
                launchedCampaign = _a.sent();
                res.json({ campaign: launchedCampaign });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                logger_1.log.error({ error: error_3 }, 'Launch campaign error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/campaigns/:id/pause - Pause campaign
router.post('/:id/pause', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, campaign, workspace, pausedCampaign, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                authenticatedReq = req;
                id = req.params.id;
                campaign = auth_1.AuthModel.getCampaignById(id);
                if (!campaign) {
                    return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(campaign.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                return [4 /*yield*/, auth_1.AuthModel.updateCampaign(id, {
                        status: 'paused',
                    })];
            case 1:
                pausedCampaign = _a.sent();
                res.json({ campaign: pausedCampaign });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                logger_1.log.error({ error: error_4 }, 'Pause campaign error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
