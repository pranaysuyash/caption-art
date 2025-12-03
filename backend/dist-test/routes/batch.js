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
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var auth_2 = require("../routes/auth");
var validation_1 = require("../middleware/validation");
var captionGenerator_1 = require("../services/captionGenerator");
var validation_2 = require("../schemas/validation");
var router = (0, express_1.Router)();
var requireAuth = (0, auth_2.createAuthMiddleware)();
// POST /api/batch/generate - Start batch caption generation
router.post('/generate', requireAuth, (0, validation_1.validateRequest)({ body: validation_2.StartBatchSchema }), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, _a, workspaceId, assetIds, workspace, result, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                authenticatedReq = req;
                _a = req.body, workspaceId = _a.workspaceId, assetIds = _a.assetIds;
                workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
                if (!workspace) {
                    return [2 /*return*/, res.status(404).json({ error: 'Workspace not found' })];
                }
                if (workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                return [4 /*yield*/, captionGenerator_1.CaptionGenerator.startBatchGeneration(workspaceId, assetIds)];
            case 1:
                result = _b.sent();
                res.status(201).json(result);
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                if (error_1 instanceof z.ZodError) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: 'Invalid input', details: error_1.issues })];
                }
                if (error_1 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_1.message })];
                }
                logger_1.log.error({ err: error_1 }, 'Start batch generation error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/batch/jobs/:jobId - Get specific batch job status
router.get('/jobs/:jobId', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, jobId, job, workspace, jobCaptions, _i, _a, assetId, captions, asset;
    return __generator(this, function (_b) {
        try {
            authenticatedReq = req;
            jobId = req.params.jobId;
            job = auth_1.AuthModel.getBatchJobById(jobId);
            if (!job) {
                return [2 /*return*/, res.status(404).json({ error: 'Batch job not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(job.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            jobCaptions = [];
            for (_i = 0, _a = job.assetIds; _i < _a.length; _i++) {
                assetId = _a[_i];
                captions = auth_1.AuthModel.getCaptionsByAsset(assetId);
                if (captions.length > 0) {
                    asset = auth_1.AuthModel.getAssetById(assetId);
                    jobCaptions.push({
                        assetId: assetId,
                        assetName: (asset === null || asset === void 0 ? void 0 : asset.originalName) || 'Unknown',
                        caption: __assign(__assign({}, captions[0]), { approved: captions[0].approvalStatus === 'approved' }),
                    });
                }
            }
            res.json({
                job: job,
                captions: jobCaptions,
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get batch job error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/batch/workspace/:workspaceId/jobs - Get all batch jobs for a workspace
router.get('/workspace/:workspaceId/jobs', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, jobs;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            workspaceId = req.params.workspaceId;
            workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
            if (!workspace) {
                return [2 /*return*/, res.status(404).json({ error: 'Workspace not found' })];
            }
            if (workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            jobs = auth_1.AuthModel.getBatchJobsByWorkspace(workspaceId);
            res.json({ jobs: jobs });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get batch jobs error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/batch/workspace/:workspaceId/captions - Get all captions for a workspace
router.get('/workspace/:workspaceId/captions', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, captions, enrichedCaptions;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            workspaceId = req.params.workspaceId;
            workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
            if (!workspace) {
                return [2 /*return*/, res.status(404).json({ error: 'Workspace not found' })];
            }
            if (workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            captions = auth_1.AuthModel.getCaptionsByWorkspace(workspaceId);
            enrichedCaptions = captions.map(function (caption) {
                var _a;
                var asset = auth_1.AuthModel.getAssetById(caption.assetId);
                return __assign(__assign({}, caption), { text: caption.variations.length > 0
                        ? ((_a = caption.variations[0]) === null || _a === void 0 ? void 0 : _a.text) || ''
                        : '', approved: caption.approvalStatus === 'approved', variations: caption.variations.map(function (v) { return (__assign(__assign({}, v), { approved: v.approvalStatus === 'approved' })); }), primaryVariation: caption.primaryVariationId
                        ? caption.variations.find(function (v) { return v.id === caption.primaryVariationId; })
                        : caption.variations[0] || null, asset: asset
                        ? {
                            id: asset.id,
                            originalName: asset.originalName,
                            mimeType: asset.mimeType,
                            url: asset.url,
                        }
                        : null });
            });
            res.json({ captions: enrichedCaptions });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get captions error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// PUT /api/batch/captions/:captionId - Update caption text (manual editing)
router.put('/captions/:captionId', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, captionId, sanitizeText, text, safeText, caption, workspace, updatedCaption_1, latestVariation, refreshedCaption, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                authenticatedReq = req;
                captionId = req.params.captionId;
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../utils/sanitizers')); })];
            case 1:
                sanitizeText = (_a.sent()).sanitizeText;
                text = req.body.text;
                safeText = sanitizeText(text, 2200);
                if (typeof text !== 'string') {
                    return [2 /*return*/, res.status(400).json({ error: 'Caption text is required' })];
                }
                caption = auth_1.AuthModel.getCaptionById(captionId);
                if (!caption) {
                    return [2 /*return*/, res.status(404).json({ error: 'Caption not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(caption.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                updatedCaption_1 = auth_1.AuthModel.addCaptionVariation(captionId, {
                    text: (safeText || text || '').trim(),
                    status: 'completed',
                    approvalStatus: 'pending',
                    createdAt: new Date(),
                });
                if (!updatedCaption_1) {
                    return [2 /*return*/, res.status(404).json({ error: 'Caption not found' })];
                }
                latestVariation = updatedCaption_1.variations[updatedCaption_1.variations.length - 1];
                if (latestVariation) {
                    auth_1.AuthModel.setPrimaryCaptionVariation(captionId, latestVariation.id);
                    refreshedCaption = auth_1.AuthModel.getCaptionById(captionId);
                    if (refreshedCaption) {
                        updatedCaption_1.primaryVariationId = refreshedCaption.primaryVariationId;
                    }
                }
                res.json({
                    caption: __assign(__assign({}, updatedCaption_1), { text: (latestVariation === null || latestVariation === void 0 ? void 0 : latestVariation.text) || '', approved: updatedCaption_1.approvalStatus === 'approved', variations: updatedCaption_1.variations.map(function (v) { return (__assign(__assign({}, v), { approved: v.approvalStatus === 'approved' })); }), primaryVariation: updatedCaption_1.primaryVariationId
                            ? updatedCaption_1.variations.find(function (v) { return v.id === updatedCaption_1.primaryVariationId; })
                            : updatedCaption_1.variations[0] || null }),
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_1.log.error({ err: error_2 }, 'Update caption error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// DELETE /api/batch/captions/:captionId - Delete caption
router.delete('/captions/:captionId', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, captionId, caption, workspace, deleted;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            captionId = req.params.captionId;
            caption = auth_1.AuthModel.getCaptionById(captionId);
            if (!caption) {
                return [2 /*return*/, res.status(404).json({ error: 'Caption not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(caption.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            deleted = auth_1.AuthModel.deleteCaption(captionId);
            if (!deleted) {
                return [2 /*return*/, res.status(404).json({ error: 'Caption not found' })];
            }
            res.json({ message: 'Caption deleted successfully' });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Delete caption error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
