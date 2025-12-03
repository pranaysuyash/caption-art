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
exports.ExportService = void 0;
var archiver_1 = __importDefault(require("archiver"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var MetricsService_1 = require("./MetricsService");
var ExportService = /** @class */ (function () {
    function ExportService() {
    }
    /**
     * Create a zip export of approved captions and assets
     */
    ExportService.createExport = function (workspaceId_1) {
        return __awaiter(this, arguments, void 0, function (workspaceId, options) {
            var workspace, approvedCaptions, approvedGeneratedAssets, exportId, fileName, zipFilePath, exportsDir;
            if (options === void 0) { options = {
                includeAssets: false,
                includeCaptions: true,
                includeGeneratedImages: true,
                format: 'zip',
            }; }
            return __generator(this, function (_a) {
                workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
                if (!workspace) {
                    throw new Error('Workspace not found');
                }
                approvedCaptions = auth_1.AuthModel.getApprovedCaptionsByWorkspace(workspaceId);
                approvedGeneratedAssets = auth_1.AuthModel.getApprovedGeneratedAssets(workspaceId);
                if (approvedCaptions.length === 0 && approvedGeneratedAssets.length === 0) {
                    throw new Error('No approved content found for export');
                }
                exportId = "export_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                fileName = "".concat(workspace.clientName.replace(/[^a-zA-Z0-9]/g, '_'), "_export_").concat(exportId, ".zip");
                zipFilePath = path_1.default.join(process.cwd(), 'exports', fileName);
                exportsDir = path_1.default.dirname(zipFilePath);
                if (!fs_1.default.existsSync(exportsDir)) {
                    fs_1.default.mkdirSync(exportsDir, { recursive: true });
                }
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var output = fs_1.default.createWriteStream(zipFilePath);
                        var archive = (0, archiver_1.default)('zip', { zlib: { level: 9 } });
                        output.on('close', function () {
                            resolve({ zipFilePath: zipFilePath, fileName: fileName });
                        });
                        archive.on('error', function (err) {
                            reject(err);
                        });
                        archive.pipe(output);
                        try {
                            // Add metadata
                            var metadata = {
                                exportDate: new Date().toISOString(),
                                workspace: {
                                    id: workspace.id,
                                    clientName: workspace.clientName,
                                },
                                counts: {
                                    captions: approvedCaptions.length,
                                    generatedImages: approvedGeneratedAssets.length,
                                    assets: options.includeAssets ? approvedCaptions.length : 0,
                                },
                                brandKit: auth_1.AuthModel.getBrandKitByWorkspace(workspaceId),
                            };
                            archive.append(JSON.stringify(metadata, null, 2), {
                                name: 'metadata.json',
                            });
                            if (options.includeCaptions) {
                                // Add captions as text file
                                var captionsText = approvedCaptions
                                    .map(function (caption, index) {
                                    var _a, _b;
                                    var asset = auth_1.AuthModel.getAssetById(caption.assetId);
                                    return ("=== Caption ".concat(index + 1, " ===\n") +
                                        "Asset: ".concat((asset === null || asset === void 0 ? void 0 : asset.originalName) || 'Unknown', "\n") +
                                        "Caption: ".concat(caption.text, "\n") +
                                        "Generated: ".concat(((_a = caption.generatedAt) === null || _a === void 0 ? void 0 : _a.toISOString()) || 'Unknown', "\n") +
                                        "Approved: ".concat(((_b = caption.approvedAt) === null || _b === void 0 ? void 0 : _b.toISOString()) || 'Unknown', "\n\n"));
                                })
                                    .join('');
                                archive.append(captionsText, { name: 'captions.txt' });
                                // Add captions as JSON
                                var enrichedCaptions = approvedCaptions.map(function (caption) {
                                    var asset = auth_1.AuthModel.getAssetById(caption.assetId);
                                    return __assign(__assign({}, caption), { approved: caption.approvalStatus === 'approved', asset: asset
                                            ? {
                                                id: asset.id,
                                                originalName: asset.originalName,
                                                mimeType: asset.mimeType,
                                            }
                                            : null });
                                });
                                archive.append(JSON.stringify(enrichedCaptions, null, 2), {
                                    name: 'captions.json',
                                });
                                // Add ad copy if any captions have it
                                var captionsWithAdCopy = approvedCaptions.filter(function (caption) {
                                    return caption.variations.some(function (v) { return v.adCopy; });
                                });
                                if (captionsWithAdCopy.length > 0) {
                                    var adCopyData = captionsWithAdCopy.map(function (caption) {
                                        var asset = auth_1.AuthModel.getAssetById(caption.assetId);
                                        return {
                                            assetId: caption.assetId,
                                            assetName: (asset === null || asset === void 0 ? void 0 : asset.originalName) || 'Unknown',
                                            variations: caption.variations
                                                .map(function (variation) { return ({
                                                id: variation.id,
                                                text: variation.text,
                                                adCopy: variation.adCopy,
                                                qualityScore: variation.qualityScore,
                                                scoreBreakdown: variation.scoreBreakdown,
                                            }); })
                                                .filter(function (variation) { return variation.adCopy; }), // Only include variations that have ad copy
                                        };
                                    });
                                    archive.append(JSON.stringify(adCopyData, null, 2), {
                                        name: 'ad-copy.json',
                                    });
                                    // Also create individual ad copy files per asset
                                    for (var _i = 0, captionsWithAdCopy_1 = captionsWithAdCopy; _i < captionsWithAdCopy_1.length; _i++) {
                                        var caption = captionsWithAdCopy_1[_i];
                                        var asset = auth_1.AuthModel.getAssetById(caption.assetId);
                                        var fileName_1 = (asset === null || asset === void 0 ? void 0 : asset.originalName.replace(/\.[^/.]+$/, '')) || caption.assetId;
                                        var assetAdCopy = caption.variations
                                            .filter(function (v) { return v.adCopy; })
                                            .map(function (v) {
                                            var _a, _b, _c, _d;
                                            return ({
                                                variationId: v.id,
                                                caption: v.text,
                                                headline: (_a = v.adCopy) === null || _a === void 0 ? void 0 : _a.headline,
                                                subheadline: (_b = v.adCopy) === null || _b === void 0 ? void 0 : _b.subheadline,
                                                bodyText: (_c = v.adCopy) === null || _c === void 0 ? void 0 : _c.bodyText,
                                                ctaText: (_d = v.adCopy) === null || _d === void 0 ? void 0 : _d.ctaText,
                                                qualityScore: v.qualityScore,
                                                scoreBreakdown: v.scoreBreakdown,
                                            });
                                        });
                                        if (assetAdCopy.length > 0) {
                                            archive.append(JSON.stringify(assetAdCopy, null, 2), {
                                                name: "ad-copy/".concat(fileName_1, ".json"),
                                            });
                                        }
                                    }
                                }
                            }
                            if (options.includeAssets) {
                                // Create assets directory and add original files
                                for (var _a = 0, approvedCaptions_1 = approvedCaptions; _a < approvedCaptions_1.length; _a++) {
                                    var caption = approvedCaptions_1[_a];
                                    var asset = auth_1.AuthModel.getAssetById(caption.assetId);
                                    if (asset && fs_1.default.existsSync(path_1.default.join(process.cwd(), asset.url))) {
                                        var assetFilePath = path_1.default.join(process.cwd(), asset.url);
                                        var zipAssetPath = path_1.default.join('assets', 'originals', asset.originalName);
                                        archive.file(assetFilePath, { name: zipAssetPath });
                                    }
                                }
                            }
                            if (options.includeGeneratedImages) {
                                // Create generated-images directory and add rendered images
                                for (var _b = 0, approvedGeneratedAssets_1 = approvedGeneratedAssets; _b < approvedGeneratedAssets_1.length; _b++) {
                                    var generatedAsset = approvedGeneratedAssets_1[_b];
                                    if (fs_1.default.existsSync(path_1.default.join(process.cwd(), generatedAsset.imageUrl))) {
                                        var imageFilePath = path_1.default.join(process.cwd(), generatedAsset.imageUrl);
                                        var zipImagePath = path_1.default.join('generated-images', "".concat(generatedAsset.format), generatedAsset.layout, "".concat(path_1.default.basename(generatedAsset.imageUrl)));
                                        archive.file(imageFilePath, { name: zipImagePath });
                                    }
                                }
                            }
                            // Add README
                            var readme = "# ".concat(workspace.clientName, " Export\n\nThis export contains approved captions and assets from the caption-art system.\n\n## Contents:\n- metadata.json: Export information and counts\n- captions.txt: Human-readable captions with asset names\n- captions.json: Machine-readable caption data\n").concat(options.includeAssets ? '- assets/originals/: Original asset files' : '', "\n").concat(options.includeGeneratedImages ? '- generated-images/: Rendered social media posts' : '', "\n\n## Generated:\n").concat(new Date().toISOString(), "\n\n## Counts:\n- Approved Captions: ").concat(approvedCaptions.length, "\n").concat(approvedGeneratedAssets.length > 0 ? "- Generated Images: ".concat(approvedGeneratedAssets.length) : '', "\n").concat(options.includeAssets ? "- Original Assets: ".concat(approvedCaptions.length) : '', "\n\nThank you for using caption-art!\n");
                            archive.append(readme, { name: 'README.md' });
                            archive.finalize();
                        }
                        catch (error) {
                            reject(error);
                        }
                    })];
            });
        });
    };
    /**
     * Process an export job asynchronously
     */
    ExportService.processExportJob = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, job, durationBeforeExport, zipFilePath, exportDurationSec, error_1, exportDurationSec, job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        job = auth_1.AuthModel.getExportJobById(jobId);
                        if (!job) {
                            throw new Error("Export job ".concat(jobId, " not found"));
                        }
                        // Update job status to processing
                        auth_1.AuthModel.updateExportJob(jobId, {
                            status: 'processing',
                        });
                        durationBeforeExport = (Date.now() - startTime) / 1000;
                        return [4 /*yield*/, this.createExport(job.workspaceId, {
                                includeAssets: false, // Don't include original assets by default
                                includeCaptions: true,
                                includeGeneratedImages: true,
                                format: 'zip',
                            })
                            // Calculate total export duration including preparation time
                        ];
                    case 2:
                        zipFilePath = (_a.sent()).zipFilePath;
                        exportDurationSec = (Date.now() - startTime) / 1000;
                        // Update job with completed status
                        auth_1.AuthModel.updateExportJob(jobId, {
                            status: 'completed',
                            zipFilePath: zipFilePath,
                            completedAt: new Date(),
                        });
                        // Track export metrics
                        MetricsService_1.MetricsService.trackExportJob(job.workspaceId, 'completed');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        exportDurationSec = (Date.now() - startTime) / 1000;
                        logger_1.log.error({ err: error_1, jobId: jobId }, "Error processing export job");
                        // Mark job as failed
                        auth_1.AuthModel.updateExportJob(jobId, {
                            status: 'failed',
                            completedAt: new Date(),
                            errorMessage: error_1 instanceof Error ? error_1.message : 'Unknown error',
                        });
                        job = auth_1.AuthModel.getExportJobById(jobId);
                        if (job) {
                            MetricsService_1.MetricsService.trackExportJob(job.workspaceId, 'failed');
                        }
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Start a new export job for approved captions and generated assets
     */
    ExportService.startExport = function (workspaceId) {
        return __awaiter(this, void 0, void 0, function () {
            var approvedCaptions, approvedGeneratedAssets, job, totalContent;
            return __generator(this, function (_a) {
                approvedCaptions = auth_1.AuthModel.getApprovedCaptionsByWorkspace(workspaceId);
                approvedGeneratedAssets = auth_1.AuthModel.getApprovedGeneratedAssets(workspaceId);
                if (approvedCaptions.length === 0 && approvedGeneratedAssets.length === 0) {
                    throw new Error('No approved content found for export');
                }
                job = auth_1.AuthModel.createExportJob(workspaceId, approvedCaptions.length + approvedGeneratedAssets.length, approvedCaptions.length, approvedGeneratedAssets.length);
                // Start processing in background
                this.processExportJob(job.id).catch(function (error) {
                    logger_1.log.error({ err: error, jobId: job.id }, "Background export processing failed for job");
                });
                totalContent = approvedCaptions.length + approvedGeneratedAssets.length;
                return [2 /*return*/, {
                        jobId: job.id,
                        message: "Export started for ".concat(totalContent, " approved items (").concat(approvedCaptions.length, " captions, ").concat(approvedGeneratedAssets.length, " generated images)"),
                    }];
            });
        });
    };
    /**
     * Clean up old export files
     */
    ExportService.cleanupOldExports = function () {
        return __awaiter(this, arguments, void 0, function (olderThanHours) {
            var exportsDir, files, cutoffTime, deletedCount, _i, files_1, file, filePath, stats;
            if (olderThanHours === void 0) { olderThanHours = 24; }
            return __generator(this, function (_a) {
                exportsDir = path_1.default.join(process.cwd(), 'exports');
                if (!fs_1.default.existsSync(exportsDir)) {
                    return [2 /*return*/, 0];
                }
                files = fs_1.default.readdirSync(exportsDir);
                cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
                deletedCount = 0;
                for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                    file = files_1[_i];
                    filePath = path_1.default.join(exportsDir, file);
                    stats = fs_1.default.statSync(filePath);
                    if (stats.mtime.getTime() < cutoffTime) {
                        try {
                            fs_1.default.unlinkSync(filePath);
                            deletedCount++;
                        }
                        catch (error) {
                            logger_1.log.error({ err: error, file: file }, "Error deleting old export file ".concat(file));
                        }
                    }
                }
                return [2 /*return*/, deletedCount];
            });
        });
    };
    return ExportService;
}());
exports.ExportService = ExportService;
