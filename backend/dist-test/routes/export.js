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
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var auth_2 = require("../routes/auth");
var exportService_1 = require("../services/exportService");
var path_1 = __importDefault(require("path"));
var router = (0, express_1.Router)();
logger_1.log.info('Initializing export router');
var requireAuth = (0, auth_2.createAuthMiddleware)();
// Debug: log every request into export router
router.use(function (req, res, next) {
    logger_1.log.info({ requestId: req.requestId, method: req.method, path: req.path }, 'EXPORT ROUTER REQ');
    next();
});
// Debug: generic catch-all on export router
router.use(function (req, res, next) {
    logger_1.log.info({ requestId: req.requestId, method: req.method, path: req.path }, 'EXPORT ROUTER CATCHALL');
    next();
});
// POST /api/export/workspace/:workspaceId/start - Start export job
router.post('/workspace/:workspaceId/start', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, approvedCaptions, result, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logger_1.log.info({ requestId: req.requestId, workspaceId: req.params.workspaceId }, 'Incoming POST /workspace/:workspaceId/start');
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
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
                if (approvedCaptions.length === 0) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: 'No approved captions found for export' })];
                }
                return [4 /*yield*/, exportService_1.ExportService.startExport(workspaceId)];
            case 2:
                result = _a.sent();
                res.status(201).json(result);
                return [3 /*break*/, 4];
            case 3:
                error_1 = _a.sent();
                if (error_1 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_1.message })];
                }
                logger_1.log.error({ requestId: req.requestId, err: error_1 }, 'Start export error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// GET /api/export/jobs/:jobId - Get export job status
router.get('/jobs/:jobId', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, jobId, job, workspace;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            jobId = req.params.jobId;
            job = auth_1.AuthModel.getExportJobById(jobId);
            if (!job) {
                return [2 /*return*/, res.status(404).json({ error: 'Export job not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(job.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            res.json({ job: job });
        }
        catch (error) {
            logger_1.log.error({ requestId: req.requestId, err: error }, 'Get export job error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/export/workspace/:workspaceId/jobs - Get export jobs for workspace
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
            jobs = auth_1.AuthModel.getExportJobsByWorkspace(workspaceId);
            res.json({ jobs: jobs });
        }
        catch (error) {
            logger_1.log.error({ requestId: req.requestId, err: error }, 'Get export jobs error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/export/jobs/:jobId/download - Download completed export
router.get('/jobs/:jobId/download', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, jobId, job, workspace, fileName;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            jobId = req.params.jobId;
            job = auth_1.AuthModel.getExportJobById(jobId);
            if (!job) {
                return [2 /*return*/, res.status(404).json({ error: 'Export job not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(job.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            if (job.status !== 'completed' || !job.zipFilePath) {
                return [2 /*return*/, res.status(400).json({ error: 'Export not ready for download' })];
            }
            fileName = path_1.default.basename(job.zipFilePath);
            res.download(job.zipFilePath, fileName, function (err) {
                if (err) {
                    logger_1.log.error({ err: err }, 'Download error');
                    if (!res.headersSent) {
                        res.status(500).json({ error: 'Download failed' });
                    }
                }
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Download export error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/export/workspace/:workspaceId/summary - Get export summary for workspace
router.get('/workspace/:workspaceId/summary', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, approvedCaptions, assets, estimatedBytes, _loop_1, _i, approvedCaptions_1, caption, formatSize;
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
            assets = auth_1.AuthModel.getAssetsByWorkspace(workspaceId);
            estimatedBytes = 1024 // ~1KB for metadata
            ;
            estimatedBytes += approvedCaptions.length * 500; // ~500 bytes per caption
            _loop_1 = function (caption) {
                var asset = assets.find(function (a) { return a.id === caption.assetId; });
                if (asset) {
                    estimatedBytes += asset.size || 0;
                }
            };
            for (_i = 0, approvedCaptions_1 = approvedCaptions; _i < approvedCaptions_1.length; _i++) {
                caption = approvedCaptions_1[_i];
                _loop_1(caption);
            }
            formatSize = function (bytes) {
                if (bytes < 1024 * 1024) {
                    return "".concat((bytes / 1024).toFixed(1), " KB");
                }
                else {
                    return "".concat((bytes / (1024 * 1024)).toFixed(1), " MB");
                }
            };
            res.json({
                workspace: {
                    id: workspace.id,
                    clientName: workspace.clientName,
                },
                readyForExport: approvedCaptions.length > 0,
                totalApproved: approvedCaptions.length,
                totalAssets: assets.length,
                estimatedSize: formatSize(estimatedBytes),
                recentExports: auth_1.AuthModel.getExportJobsByWorkspace(workspaceId)
                    .sort(function (a, b) {
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                })
                    .slice(0, 5),
            });
        }
        catch (error) {
            logger_1.log.error({ requestId: req.requestId, err: error }, 'Get export summary error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// DELETE /api/export/jobs/:jobId - Delete export job and files
router.delete('/jobs/:jobId', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, jobId, job, workspace, deleted;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            jobId = req.params.jobId;
            job = auth_1.AuthModel.getExportJobById(jobId);
            if (!job) {
                return [2 /*return*/, res.status(404).json({ error: 'Export job not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(job.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            deleted = auth_1.AuthModel.deleteExportJob(jobId);
            if (!deleted) {
                return [2 /*return*/, res.status(404).json({ error: 'Export job not found' })];
            }
            res.json({ message: 'Export job deleted successfully' });
        }
        catch (error) {
            logger_1.log.error({ requestId: req.requestId, err: error }, 'Delete export job error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// POST /api/export/cleanup - Clean up old exports (admin only)
router.post('/cleanup', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, olderThanHours, deletedCount, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body.olderThanHours, olderThanHours = _a === void 0 ? 24 : _a;
                return [4 /*yield*/, exportService_1.ExportService.cleanupOldExports(olderThanHours)];
            case 1:
                deletedCount = _b.sent();
                res.json({
                    message: "Cleaned up ".concat(deletedCount, " old export files"),
                    deletedCount: deletedCount,
                    olderThanHours: olderThanHours,
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                logger_1.log.error({ requestId: req.requestId, err: error_2 }, 'Cleanup exports error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/export/workspace/:workspaceId/history - Get export history
router.get('/workspace/:workspaceId/history', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, limit, workspace, history_1;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            workspaceId = req.params.workspaceId;
            limit = parseInt(req.query.limit) || 10;
            workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
            if (!workspace) {
                return [2 /*return*/, res.status(404).json({ error: 'Workspace not found' })];
            }
            if (workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            history_1 = auth_1.AuthModel.getExportHistory(workspaceId, limit);
            res.json(__assign({ workspaceId: workspaceId }, history_1));
        }
        catch (error) {
            logger_1.log.error({ requestId: req.requestId, err: error }, 'Get export history error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/export/workspace/:workspaceId/statistics - Get export statistics
router.get('/workspace/:workspaceId/statistics', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, statistics;
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
            statistics = auth_1.AuthModel.getExportStatistics(workspaceId);
            res.json(__assign({ workspaceId: workspaceId }, statistics));
        }
        catch (error) {
            logger_1.log.error({ requestId: req.requestId, err: error }, 'Get export statistics error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/export/workspace/:workspaceId/jobs - List all export jobs
router.get('/workspace/:workspaceId/jobs', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, status_1, limit, workspace, jobs;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            workspaceId = req.params.workspaceId;
            status_1 = req.query.status;
            limit = parseInt(req.query.limit) || 20;
            workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
            if (!workspace) {
                return [2 /*return*/, res.status(404).json({ error: 'Workspace not found' })];
            }
            if (workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            jobs = auth_1.AuthModel.getExportJobsByWorkspace(workspaceId);
            // Filter by status if provided
            if (status_1) {
                jobs = jobs.filter(function (job) { return job.status === status_1; });
            }
            // Sort by creation date (most recent first)
            jobs.sort(function (a, b) {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });
            // Apply limit
            jobs = jobs.slice(0, limit);
            res.json({
                workspaceId: workspaceId,
                jobs: jobs,
                count: jobs.length,
                filters: {
                    status: status_1 || 'all',
                    limit: limit,
                },
            });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get export jobs error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
