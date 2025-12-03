"use strict";
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
var logger_1 = require("../middleware/logger");
var router = (0, express_1.Router)();
logger_1.log.info('Initializing reference creatives router');
var requireAuth = (0, auth_2.createAuthMiddleware)();
// Schema validation
var createReferenceCreativeSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, 'Name is required'),
    campaignId: zod_1.z.string().optional(),
    notes: zod_1.z.string().optional(),
    workspaceId: zod_1.z.string().min(1, 'Workspace ID is required'),
});
// Debug middleware
router.use(function (req, res, next) {
    logger_1.log.info({ requestId: req.requestId, method: req.method, path: req.path }, 'REFERENCE CREATIVES ROUTER REQ');
    next();
});
// POST /api/reference-creatives/upload - Upload reference creative
router.post('/upload', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, _a, rawName, campaignId, rawNotes, workspaceId, imageUrl, sanitizeText, name_1, notes, workspace, campaign, thumbnailUrl, styleAnalysis, referenceCreative, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                logger_1.log.info({ requestId: req.requestId, name: rawName, workspaceId: workspaceId }, 'Uploading reference creative');
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                authenticatedReq = req;
                _a = req.body, rawName = _a.name, campaignId = _a.campaignId, rawNotes = _a.notes, workspaceId = _a.workspaceId, imageUrl = _a.imageUrl;
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../utils/sanitizers')); })];
            case 2:
                sanitizeText = (_b.sent()).sanitizeText;
                name_1 = sanitizeText(rawName, 200) || rawName;
                notes = sanitizeText(rawNotes, 1000) || rawNotes;
                // Validate required fields
                if (!name_1 || !workspaceId || !imageUrl) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: 'Name, workspaceId, and imageUrl are required' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                // Verify campaign exists and belongs to workspace if provided
                if (campaignId) {
                    campaign = auth_1.AuthModel.getCampaignById(campaignId);
                    if (!campaign || campaign.workspaceId !== workspaceId) {
                        return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
                    }
                }
                thumbnailUrl = imageUrl;
                return [4 /*yield*/, extractStyleFromImage(imageUrl)];
            case 3:
                styleAnalysis = _b.sent();
                return [4 /*yield*/, auth_1.AuthModel.createReferenceCreative({
                        name: name_1,
                        campaignId: campaignId,
                        notes: notes,
                        workspaceId: workspaceId,
                        imageUrl: imageUrl,
                        thumbnailUrl: thumbnailUrl,
                        extractedColors: styleAnalysis.colors,
                        detectedLayout: styleAnalysis.layout,
                        textDensity: styleAnalysis.textDensity,
                        styleTags: styleAnalysis.tags,
                    })];
            case 4:
                referenceCreative = _b.sent();
                res.status(201).json({ referenceCreative: referenceCreative });
                return [3 /*break*/, 6];
            case 5:
                error_1 = _b.sent();
                logger_1.log.error({ err: error_1 }, 'Upload reference creative error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// GET /api/reference-creatives - List reference creatives
router.get('/', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq_1, workspaceId, campaignId, referenceCreatives, workspace, agencyWorkspaces, workspaceIds, _i, workspaceIds_1, wsId;
    return __generator(this, function (_a) {
        try {
            authenticatedReq_1 = req;
            workspaceId = req.query.workspaceId;
            campaignId = req.query.campaignId;
            referenceCreatives = [];
            if (campaignId) {
                // Get creatives for specific campaign
                referenceCreatives = auth_1.AuthModel.getReferenceCreativesByCampaign(campaignId);
            }
            else if (workspaceId) {
                workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq_1.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                referenceCreatives =
                    auth_1.AuthModel.getReferenceCreativesByWorkspace(workspaceId);
            }
            else {
                agencyWorkspaces = Array.from(auth_1.AuthModel.getAllWorkspaces()).filter(function (w) { return w.agencyId === authenticatedReq_1.agency.id; });
                workspaceIds = agencyWorkspaces.map(function (w) { return w.id; });
                for (_i = 0, workspaceIds_1 = workspaceIds; _i < workspaceIds_1.length; _i++) {
                    wsId = workspaceIds_1[_i];
                    referenceCreatives.push.apply(referenceCreatives, auth_1.AuthModel.getReferenceCreativesByWorkspace(wsId));
                }
            }
            res.json({ referenceCreatives: referenceCreatives });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'List reference creatives error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/reference-creatives/:id - Get specific reference creative
router.get('/:id', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, referenceCreative, workspace, campaign;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            id = req.params.id;
            referenceCreative = auth_1.AuthModel.getReferenceCreativeById(id);
            if (!referenceCreative) {
                return [2 /*return*/, res.status(404).json({ error: 'Reference creative not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(referenceCreative.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            campaign = null;
            if (referenceCreative.campaignId) {
                campaign = auth_1.AuthModel.getCampaignById(referenceCreative.campaignId);
            }
            res.json({ referenceCreative: referenceCreative, campaign: campaign });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get reference creative error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// PUT /api/reference-creatives/:id - Update reference creative
router.put('/:id', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, _a, rawName, rawNotes, campaignId, sanitizeText, name_2, notes, referenceCreative, workspace, campaign, updatedReferenceCreative, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                authenticatedReq = req;
                id = req.params.id;
                _a = req.body, rawName = _a.name, rawNotes = _a.notes, campaignId = _a.campaignId;
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../utils/sanitizers')); })];
            case 1:
                sanitizeText = (_b.sent()).sanitizeText;
                name_2 = sanitizeText(rawName, 200) || rawName;
                notes = sanitizeText(rawNotes, 500) || rawNotes;
                referenceCreative = auth_1.AuthModel.getReferenceCreativeById(id);
                if (!referenceCreative) {
                    return [2 /*return*/, res.status(404).json({ error: 'Reference creative not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(referenceCreative.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                // Verify campaign if provided
                if (campaignId && campaignId !== referenceCreative.campaignId) {
                    campaign = auth_1.AuthModel.getCampaignById(campaignId);
                    if (!campaign || campaign.workspaceId !== referenceCreative.workspaceId) {
                        return [2 /*return*/, res.status(404).json({ error: 'Campaign not found' })];
                    }
                }
                return [4 /*yield*/, auth_1.AuthModel.updateReferenceCreative(id, {
                        name: name_2,
                        notes: notes,
                        campaignId: campaignId,
                    })];
            case 2:
                updatedReferenceCreative = _b.sent();
                res.json({ referenceCreative: updatedReferenceCreative });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                logger_1.log.error({ err: error_2 }, 'Update reference creative error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// DELETE /api/reference-creatives/:id - Delete reference creative
router.delete('/:id', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, referenceCreative, workspace, deleted;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            id = req.params.id;
            referenceCreative = auth_1.AuthModel.getReferenceCreativeById(id);
            if (!referenceCreative) {
                return [2 /*return*/, res.status(404).json({ error: 'Reference creative not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(referenceCreative.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            deleted = auth_1.AuthModel.deleteReferenceCreative(id);
            if (!deleted) {
                return [2 /*return*/, res.status(404).json({ error: 'Reference creative not found' })];
            }
            res.json({ message: 'Reference creative deleted successfully' });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Delete reference creative error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// POST /api/reference-creatives/:id/analyze - Re-analyze style from image
router.post('/:id/analyze', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, referenceCreative, workspace, styleAnalysis, updatedReferenceCreative, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                authenticatedReq = req;
                id = req.params.id;
                referenceCreative = auth_1.AuthModel.getReferenceCreativeById(id);
                if (!referenceCreative) {
                    return [2 /*return*/, res.status(404).json({ error: 'Reference creative not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(referenceCreative.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                return [4 /*yield*/, extractStyleFromImage(referenceCreative.imageUrl)];
            case 1:
                styleAnalysis = _a.sent();
                return [4 /*yield*/, auth_1.AuthModel.updateReferenceCreative(id, {
                        extractedColors: styleAnalysis.colors,
                        detectedLayout: styleAnalysis.layout,
                        textDensity: styleAnalysis.textDensity,
                        styleTags: styleAnalysis.tags,
                    })];
            case 2:
                updatedReferenceCreative = _a.sent();
                res.json({
                    referenceCreative: updatedReferenceCreative,
                    analysis: styleAnalysis,
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                logger_1.log.error({ err: error_3 }, 'Analyze reference creative error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
/**
 * Extract style information from image URL
 * This is a placeholder implementation - in production you'd use image processing libraries
 */
function extractStyleFromImage(imageUrl) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            try {
                // Placeholder implementation - in production you'd:
                // 1. Download/load the image
                // 2. Use color-thief or similar to extract dominant colors
                // 3. Use OCR to detect text regions and density
                // 4. Analyze layout patterns
                // 5. Classify style attributes
                // For now, return mock data
                return [2 /*return*/, {
                        colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
                        layout: 'center-focus',
                        textDensity: 'moderate',
                        tags: [
                            'high-contrast',
                            'bold-typography',
                            'vibrant-colors',
                            'centered-layout',
                        ],
                    }];
            }
            catch (error) {
                logger_1.log.error({ err: error }, 'Style extraction failed');
                // Return safe defaults
                return [2 /*return*/, {
                        colors: ['#000000', '#FFFFFF'],
                        layout: 'center-focus',
                        textDensity: 'minimal',
                        tags: ['unknown'],
                    }];
            }
            return [2 /*return*/];
        });
    });
}
exports.default = router;
