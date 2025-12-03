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
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var zod_1 = require("zod");
var auth_1 = require("../models/auth");
var auth_2 = require("../routes/auth");
var validation_1 = require("../middleware/validation");
var validation_2 = require("../schemas/validation");
var logger_1 = require("../middleware/logger");
var router = (0, express_1.Router)();
var requireAuth = (0, auth_2.createAuthMiddleware)();
// GET /api/approval/workspace/:workspaceId/grid - Get approval grid data
router.get('/workspace/:workspaceId/grid', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, assets, captions, gridData, stats;
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
            assets = auth_1.AuthModel.getAssetsByWorkspace(workspaceId);
            captions = auth_1.AuthModel.getCaptionsByWorkspace(workspaceId);
            gridData = assets.map(function (asset) {
                var _a;
                var assetCaptions = auth_1.AuthModel.getCaptionsByAsset(asset.id);
                var caption = assetCaptions[0] || null;
                return {
                    asset: {
                        id: asset.id,
                        originalName: asset.originalName,
                        mimeType: asset.mimeType,
                        url: asset.url,
                        uploadedAt: asset.uploadedAt,
                    },
                    caption: caption
                        ? {
                            id: caption.id,
                            text: caption.variations.length > 0
                                ? ((_a = caption.variations[0]) === null || _a === void 0 ? void 0 : _a.text) || ''
                                : '',
                            variations: caption.variations.map(function (v) { return (__assign(__assign({}, v), { approved: v.approvalStatus === 'approved' })); }),
                            primaryVariation: caption.primaryVariationId
                                ? caption.variations.find(function (v) { return v.id === caption.primaryVariationId; })
                                : caption.variations[0] || null,
                            status: caption.status,
                            approvalStatus: caption.approvalStatus,
                            approved: caption.approvalStatus === 'approved',
                            generatedAt: caption.generatedAt,
                            approvedAt: caption.approvedAt,
                            rejectedAt: caption.rejectedAt,
                            errorMessage: caption.errorMessage,
                        }
                        : null,
                };
            });
            stats = {
                total: captions.length,
                pending: captions.filter(function (c) { return c.approvalStatus === 'pending'; }).length,
                approved: captions.filter(function (c) { return c.approvalStatus === 'approved'; }).length,
                rejected: captions.filter(function (c) { return c.approvalStatus === 'rejected'; }).length,
            };
            res.json({
                workspace: {
                    id: workspace.id,
                    clientName: workspace.clientName,
                },
                grid: gridData,
                stats: stats,
            });
        }
        catch (error) {
            logger_1.log.error({ error: error }, 'Get approval grid error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// PUT /api/approval/captions/:captionId/approve - Approve a caption
router.put('/captions/:captionId/approve', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, captionId, caption, workspace, approvedCaption_1;
    var _a;
    return __generator(this, function (_b) {
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
            approvedCaption_1 = auth_1.AuthModel.approveCaption(captionId);
            if (!approvedCaption_1) {
                return [2 /*return*/, res.status(404).json({ error: 'Caption not found' })];
            }
            res.json({
                message: 'Caption approved successfully',
                caption: __assign(__assign({}, approvedCaption_1), { text: approvedCaption_1.variations.length > 0
                        ? ((_a = approvedCaption_1.variations[0]) === null || _a === void 0 ? void 0 : _a.text) || ''
                        : '', approved: approvedCaption_1.approvalStatus === 'approved', variations: approvedCaption_1.variations.map(function (v) { return (__assign(__assign({}, v), { approved: v.approvalStatus === 'approved' })); }), primaryVariation: approvedCaption_1.primaryVariationId
                        ? approvedCaption_1.variations.find(function (v) { return v.id === approvedCaption_1.primaryVariationId; })
                        : approvedCaption_1.variations[0] || null }),
            });
        }
        catch (error) {
            logger_1.log.error({ error: error }, 'Approve caption error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// PUT /api/approval/captions/:captionId/reject - Reject a caption
router.put('/captions/:captionId/reject', requireAuth, (0, validation_1.validateRequest)({
    params: zod_1.z.object({ captionId: zod_1.z.string().min(1) }),
    body: validation_2.ApproveRejectSchema,
}), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, captionId, reason, caption, workspace, rejectedCaption_1;
    var _a;
    return __generator(this, function (_b) {
        try {
            authenticatedReq = req;
            captionId = req.params.captionId;
            reason = req.body.reason;
            caption = auth_1.AuthModel.getCaptionById(captionId);
            if (!caption) {
                return [2 /*return*/, res.status(404).json({ error: 'Caption not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(caption.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            rejectedCaption_1 = auth_1.AuthModel.rejectCaption(captionId, reason);
            if (!rejectedCaption_1) {
                return [2 /*return*/, res.status(404).json({ error: 'Caption not found' })];
            }
            res.json({
                message: 'Caption rejected successfully',
                caption: __assign(__assign({}, rejectedCaption_1), { text: rejectedCaption_1.variations.length > 0
                        ? ((_a = rejectedCaption_1.variations[0]) === null || _a === void 0 ? void 0 : _a.text) || ''
                        : '', approved: rejectedCaption_1.approvalStatus === 'approved', variations: rejectedCaption_1.variations.map(function (v) { return (__assign(__assign({}, v), { approved: v.approvalStatus === 'approved' })); }), primaryVariation: rejectedCaption_1.primaryVariationId
                        ? rejectedCaption_1.variations.find(function (v) { return v.id === rejectedCaption_1.primaryVariationId; })
                        : rejectedCaption_1.variations[0] || null }),
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return [2 /*return*/, res
                        .status(400)
                        .json({ error: 'Invalid input', details: error.issues })];
            }
            logger_1.log.error({ error: error }, 'Reject caption error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// POST /api/approval/batch-approve - Approve multiple captions
router.post('/batch-approve', requireAuth, (0, validation_1.validateRequest)({ body: validation_2.BatchApproveRejectSchema }), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, captionIds, _i, captionIds_1, captionId, caption, workspace, result;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            captionIds = req.body.captionIds;
            // Verify all captions belong to current agency
            for (_i = 0, captionIds_1 = captionIds; _i < captionIds_1.length; _i++) {
                captionId = captionIds_1[_i];
                caption = auth_1.AuthModel.getCaptionById(captionId);
                if (!caption) {
                    return [2 /*return*/, res
                            .status(404)
                            .json({ error: "Caption ".concat(captionId, " not found") })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(caption.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res
                            .status(403)
                            .json({ error: 'Access denied for caption ${captionId}' })];
                }
            }
            result = auth_1.AuthModel.batchApproveCaptions(captionIds);
            res.json(__assign({ message: "Successfully approved ".concat(result.approved, " captions") }, result));
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return [2 /*return*/, res
                        .status(400)
                        .json({ error: 'Invalid input', details: error.issues })];
            }
            logger_1.log.error({ error: error }, 'Batch approve error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// POST /api/approval/batch-reject - Reject multiple captions
router.post('/batch-reject', requireAuth, (0, validation_1.validateRequest)({ body: validation_2.BatchApproveRejectSchema }), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, _a, captionIds, reason, _i, captionIds_2, captionId, caption, workspace, result;
    return __generator(this, function (_b) {
        try {
            authenticatedReq = req;
            _a = req.body, captionIds = _a.captionIds, reason = _a.reason;
            // Verify all captions belong to current agency
            for (_i = 0, captionIds_2 = captionIds; _i < captionIds_2.length; _i++) {
                captionId = captionIds_2[_i];
                caption = auth_1.AuthModel.getCaptionById(captionId);
                if (!caption) {
                    return [2 /*return*/, res
                            .status(404)
                            .json({ error: "Caption ".concat(captionId, " not found") })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(caption.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res
                            .status(403)
                            .json({ error: 'Access denied for caption ${captionId}' })];
                }
            }
            result = auth_1.AuthModel.batchRejectCaptions(captionIds, reason);
            res.json(__assign({ message: "Successfully rejected ".concat(result.rejected, " captions") }, result));
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return [2 /*return*/, res
                        .status(400)
                        .json({ error: 'Invalid input', details: error.issues })];
            }
            logger_1.log.error({ error: error }, 'Batch reject error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/approval/workspace/:workspaceId/approved - Get approved captions only
router.get('/workspace/:workspaceId/approved', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, approvedCaptions, enrichedCaptions;
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
            approvedCaptions = auth_1.AuthModel.getApprovedCaptionsByWorkspace(workspaceId);
            enrichedCaptions = approvedCaptions.map(function (caption) {
                var asset = auth_1.AuthModel.getAssetById(caption.assetId);
                return __assign(__assign({}, caption), { approved: caption.approvalStatus === 'approved', asset: asset
                        ? {
                            id: asset.id,
                            originalName: asset.originalName,
                            mimeType: asset.mimeType,
                            url: asset.url,
                        }
                        : null });
            });
            res.json({
                captions: enrichedCaptions,
                count: enrichedCaptions.length,
            });
        }
        catch (error) {
            logger_1.log.error({ error: error }, 'Get approved captions error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// POST /api/approval/auto-approve-best - Auto-approve the highest scoring caption per asset
router.post('/auto-approve-best', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, captions, approvedCount, _i, captions_1, caption, bestVariation, highestScore, _a, _b, variation, score, result;
    return __generator(this, function (_c) {
        try {
            authenticatedReq = req;
            workspaceId = req.body.workspaceId;
            if (!workspaceId) {
                return [2 /*return*/, res.status(400).json({ error: 'workspaceId is required' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
            if (!workspace) {
                return [2 /*return*/, res.status(404).json({ error: 'Workspace not found' })];
            }
            if (workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            captions = auth_1.AuthModel.getCaptionsByWorkspace(workspaceId);
            approvedCount = 0;
            // For each caption, find the highest scoring variation and approve it
            for (_i = 0, captions_1 = captions; _i < captions_1.length; _i++) {
                caption = captions_1[_i];
                if (caption.variations.length > 0) {
                    bestVariation = caption.variations[0];
                    highestScore = bestVariation.qualityScore || 0;
                    for (_a = 0, _b = caption.variations; _a < _b.length; _a++) {
                        variation = _b[_a];
                        score = variation.qualityScore || 0;
                        if (score > highestScore) {
                            highestScore = score;
                            bestVariation = variation;
                        }
                    }
                    result = auth_1.AuthModel.approveCaptionVariation(caption.id, bestVariation.id);
                    if (result) {
                        approvedCount++;
                    }
                }
            }
            res.json({
                message: "Auto-approved best variations for ".concat(approvedCount, " captions"),
                approvedCount: approvedCount,
            });
        }
        catch (error) {
            logger_1.log.error({ error: error }, 'Auto-approve best error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
