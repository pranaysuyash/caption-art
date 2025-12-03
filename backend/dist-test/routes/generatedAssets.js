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
var logger_1 = require("../middleware/logger");
var auth_2 = require("../routes/auth");
var validateRequest_1 = __importDefault(require("../middleware/validateRequest"));
var router = (0, express_1.Router)();
var requireAuth = (0, auth_2.createAuthMiddleware)();
// Validation schemas
var approveRejectSchema = zod_1.z.object({
    reason: zod_1.z.string().optional(),
});
var batchApproveRejectSchema = zod_1.z.object({
    assetIds: zod_1.z.array(zod_1.z.string().min(1)),
    reason: zod_1.z.string().optional(),
});
// GET /api/generated-assets/workspace/:workspaceId - Get all generated assets for workspace
router.get('/workspace/:workspaceId', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, generatedAssets, enrichedAssets;
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
            generatedAssets = auth_1.AuthModel.getGeneratedAssetsByWorkspace(workspaceId);
            enrichedAssets = generatedAssets.map(function (asset) {
                var sourceAsset = auth_1.AuthModel.getAssetById(asset.sourceAssetId);
                var caption = auth_1.AuthModel.getCaptionById(asset.captionId);
                return __assign(__assign({}, asset), { sourceAsset: sourceAsset
                        ? {
                            id: sourceAsset.id,
                            originalName: sourceAsset.originalName,
                            mimeType: sourceAsset.mimeType,
                            url: sourceAsset.url,
                        }
                        : null, caption: caption
                        ? {
                            id: caption.id,
                            text: caption.text,
                            status: caption.status,
                            approvalStatus: caption.approvalStatus,
                            approved: caption.approvalStatus === 'approved',
                        }
                        : null });
            });
            res.json({ generatedAssets: enrichedAssets });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get generated assets error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/generated-assets/job/:jobId - Get generated assets for a batch job
router.get('/job/:jobId', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, jobId, job, workspace, generatedAssets, enrichedAssets;
    return __generator(this, function (_a) {
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
            generatedAssets = auth_1.AuthModel.getGeneratedAssetsByJob(jobId);
            enrichedAssets = generatedAssets.map(function (asset) {
                var sourceAsset = auth_1.AuthModel.getAssetById(asset.sourceAssetId);
                var caption = auth_1.AuthModel.getCaptionById(asset.captionId);
                return __assign(__assign({}, asset), { approved: asset.approvalStatus === 'approved', sourceAsset: sourceAsset
                        ? {
                            id: sourceAsset.id,
                            originalName: sourceAsset.originalName,
                            mimeType: sourceAsset.mimeType,
                            url: sourceAsset.url,
                        }
                        : null, caption: caption
                        ? {
                            id: caption.id,
                            text: caption.text,
                            status: caption.status,
                            approvalStatus: caption.approvalStatus,
                            approved: caption.approvalStatus === 'approved',
                        }
                        : null });
            });
            res.json({ generatedAssets: enrichedAssets });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get generated assets by job error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/generated-assets/workspace/:workspaceId/approved - Get only approved generated assets
router.get('/workspace/:workspaceId/approved', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, approvedAssets, enrichedAssets;
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
            approvedAssets = auth_1.AuthModel.getApprovedGeneratedAssets(workspaceId);
            enrichedAssets = approvedAssets.map(function (asset) {
                var sourceAsset = auth_1.AuthModel.getAssetById(asset.sourceAssetId);
                return __assign(__assign({}, asset), { approved: asset.approvalStatus === 'approved', sourceAsset: sourceAsset
                        ? {
                            id: sourceAsset.id,
                            originalName: sourceAsset.originalName,
                            mimeType: sourceAsset.mimeType,
                            url: sourceAsset.url,
                        }
                        : null });
            });
            res.json({ generatedAssets: enrichedAssets });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get approved generated assets error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// PUT /api/generated-assets/:assetId/approve - Approve a generated asset
router.put('/:assetId/approve', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, assetId, generatedAsset, workspace, approvedAsset;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            assetId = req.params.assetId;
            generatedAsset = auth_1.AuthModel.getGeneratedAssetById(assetId);
            if (!generatedAsset) {
                return [2 /*return*/, res.status(404).json({ error: 'Generated asset not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(generatedAsset.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            approvedAsset = auth_1.AuthModel.approveGeneratedAsset(assetId);
            if (!approvedAsset) {
                return [2 /*return*/, res.status(404).json({ error: 'Generated asset not found' })];
            }
            res.json({
                message: 'Generated asset approved successfully',
                generatedAsset: __assign(__assign({}, approvedAsset), { approved: approvedAsset.approvalStatus === 'approved' }),
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Approve generated asset error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// PUT /api/generated-assets/:assetId/reject - Reject a generated asset
router.put('/:assetId/reject', requireAuth, (0, validateRequest_1.default)(approveRejectSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, assetId, reason, generatedAsset, workspace, rejectedAsset;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            assetId = req.params.assetId;
            reason = req.validatedData.reason;
            generatedAsset = auth_1.AuthModel.getGeneratedAssetById(assetId);
            if (!generatedAsset) {
                return [2 /*return*/, res.status(404).json({ error: 'Generated asset not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(generatedAsset.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            rejectedAsset = auth_1.AuthModel.rejectGeneratedAsset(assetId);
            if (!rejectedAsset) {
                return [2 /*return*/, res.status(404).json({ error: 'Generated asset not found' })];
            }
            res.json({
                message: 'Generated asset rejected successfully',
                generatedAsset: __assign(__assign({}, rejectedAsset), { approved: rejectedAsset.approvalStatus === 'approved' }),
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return [2 /*return*/, res
                        .status(400)
                        .json({ error: 'Invalid input', details: error.issues })];
            }
            logger_1.log.error({ err: error }, 'Reject generated asset error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// POST /api/generated-assets/batch-approve - Approve multiple generated assets
router.post('/batch-approve', requireAuth, (0, validateRequest_1.default)(batchApproveRejectSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, assetIds, _i, assetIds_1, assetId, generatedAsset, workspace, result;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            assetIds = req.validatedData.assetIds;
            // Verify all assets belong to current agency
            for (_i = 0, assetIds_1 = assetIds; _i < assetIds_1.length; _i++) {
                assetId = assetIds_1[_i];
                generatedAsset = auth_1.AuthModel.getGeneratedAssetById(assetId);
                if (!generatedAsset) {
                    return [2 /*return*/, res
                            .status(404)
                            .json({ error: "Generated asset ".concat(assetId, " not found") })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(generatedAsset.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res
                            .status(403)
                            .json({ error: 'Access denied for generated asset ${assetId}' })];
                }
            }
            result = auth_1.AuthModel.batchApproveGeneratedAssets(assetIds);
            res.json(__assign({ message: "Successfully approved ".concat(result.approved, " generated assets") }, result));
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return [2 /*return*/, res
                        .status(400)
                        .json({ error: 'Invalid input', details: error.issues })];
            }
            logger_1.log.error({ err: error }, 'Batch approve generated assets error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// POST /api/generated-assets/batch-reject - Reject multiple generated assets
router.post('/batch-reject', requireAuth, (0, validateRequest_1.default)(batchApproveRejectSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, _a, assetIds, reason, _i, assetIds_2, assetId, generatedAsset, workspace, result;
    return __generator(this, function (_b) {
        try {
            authenticatedReq = req;
            _a = req.validatedData, assetIds = _a.assetIds, reason = _a.reason;
            // Verify all assets belong to current agency
            for (_i = 0, assetIds_2 = assetIds; _i < assetIds_2.length; _i++) {
                assetId = assetIds_2[_i];
                generatedAsset = auth_1.AuthModel.getGeneratedAssetById(assetId);
                if (!generatedAsset) {
                    return [2 /*return*/, res
                            .status(404)
                            .json({ error: "Generated asset ".concat(assetId, " not found") })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(generatedAsset.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res
                            .status(403)
                            .json({ error: 'Access denied for generated asset ${assetId}' })];
                }
            }
            result = auth_1.AuthModel.batchRejectGeneratedAssets(assetIds);
            res.json(__assign({ message: "Successfully rejected ".concat(result.rejected, " generated assets") }, result));
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return [2 /*return*/, res
                        .status(400)
                        .json({ error: 'Invalid input', details: error.issues })];
            }
            logger_1.log.error({ err: error }, 'Batch reject generated assets error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/generated-assets/workspace/:workspaceId/stats - Get approval statistics
router.get('/workspace/:workspaceId/stats', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, allGeneratedAssets, stats;
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
            allGeneratedAssets = auth_1.AuthModel.getGeneratedAssetsByWorkspace(workspaceId);
            stats = {
                total: allGeneratedAssets.length,
                pending: allGeneratedAssets.filter(function (a) { return a.approvalStatus === 'pending'; })
                    .length,
                approved: allGeneratedAssets.filter(function (a) { return a.approvalStatus === 'approved'; }).length,
                rejected: allGeneratedAssets.filter(function (a) { return a.approvalStatus === 'rejected'; }).length,
                byFormat: {
                    'instagram-square': allGeneratedAssets.filter(function (a) { return a.format === 'instagram-square'; }).length,
                    'instagram-story': allGeneratedAssets.filter(function (a) { return a.format === 'instagram-story'; }).length,
                },
                byLayout: {
                    'center-focus': allGeneratedAssets.filter(function (a) { return a.layout === 'center-focus'; }).length,
                    'bottom-text': allGeneratedAssets.filter(function (a) { return a.layout === 'bottom-text'; }).length,
                    'top-text': allGeneratedAssets.filter(function (a) { return a.layout === 'top-text'; })
                        .length,
                },
            };
            res.json({ stats: stats });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get generated assets stats error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// DELETE /api/generated-assets/:assetId - Delete a generated asset
router.delete('/:assetId', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, assetId, generatedAsset, workspace, deleted;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            assetId = req.params.assetId;
            generatedAsset = auth_1.AuthModel.getGeneratedAssetById(assetId);
            if (!generatedAsset) {
                return [2 /*return*/, res.status(404).json({ error: 'Generated asset not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(generatedAsset.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            deleted = auth_1.AuthModel.deleteGeneratedAsset(assetId);
            if (!deleted) {
                return [2 /*return*/, res.status(404).json({ error: 'Generated asset not found' })];
            }
            res.json({ message: 'Generated asset deleted successfully' });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Delete generated asset error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
