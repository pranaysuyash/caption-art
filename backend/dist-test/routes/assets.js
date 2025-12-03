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
var multer_1 = __importDefault(require("multer"));
var path_1 = __importDefault(require("path"));
var fs_1 = __importDefault(require("fs"));
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var auth_2 = require("../routes/auth");
var validation_1 = require("../schemas/validation");
var validation_2 = require("../middleware/validation");
var router = (0, express_1.Router)();
var requireAuth = (0, auth_2.createAuthMiddleware)();
// Configure multer for file uploads
var storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        var uploadDir = path_1.default.join(process.cwd(), 'uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        var uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        var ext = path_1.default.extname(file.originalname);
        cb(null, "".concat(file.fieldname, "-").concat(uniqueSuffix).concat(ext));
    },
});
var fileFilter = function (req, file, cb) {
    // Allow common image and video formats
    var allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'video/mp4',
        'video/quicktime',
        'video/x-msvideo',
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new Error("File type ".concat(file.mimetype, " is not allowed")), false);
    }
};
var upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max file size
        files: 20, // Max 20 files
    },
});
// POST /api/assets/upload - Upload multiple assets
router.post('/upload', requireAuth, upload.array('files', 10), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, validation, workspaceId, workspace, files, existingAssets, uploadedAssets, _i, files_1, file, asset, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                authenticatedReq = req;
                validation = (0, validation_2.safeValidateData)({ workspaceId: req.body.workspaceId }, validation_1.UploadAssetsSchema.pick({ workspaceId: true }));
                if (!validation.success) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'Validation error',
                            details: validation.error.issues.map(function (issue) { return ({
                                field: issue.path.join('.'),
                                message: issue.message,
                            }); }),
                        })];
                }
                workspaceId = validation.data.workspaceId;
                workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
                if (!workspace) {
                    return [2 /*return*/, res.status(404).json({ error: 'Workspace not found' })];
                }
                if (workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                files = req.files;
                if (!files || files.length === 0) {
                    return [2 /*return*/, res.status(400).json({ error: 'No files uploaded' })];
                }
                existingAssets = auth_1.AuthModel.getAssetsByWorkspace(workspaceId);
                if (existingAssets.length + files.length > 20) {
                    return [2 /*return*/, res.status(400).json({
                            error: "Cannot upload ".concat(files.length, " files. Maximum 20 assets allowed per workspace. Currently have ").concat(existingAssets.length, "."),
                        })];
                }
                uploadedAssets = [];
                _i = 0, files_1 = files;
                _a.label = 1;
            case 1:
                if (!(_i < files_1.length)) return [3 /*break*/, 4];
                file = files_1[_i];
                return [4 /*yield*/, auth_1.AuthModel.createAsset({
                        workspaceId: workspaceId,
                        filename: file.filename,
                        originalName: file.originalname,
                        mimeType: file.mimetype,
                        size: file.size,
                        url: "/uploads/".concat(file.filename),
                    })];
            case 2:
                asset = _a.sent();
                uploadedAssets.push(asset);
                _a.label = 3;
            case 3:
                _i++;
                return [3 /*break*/, 1];
            case 4:
                res.status(201).json({
                    message: "Successfully uploaded ".concat(uploadedAssets.length, " assets"),
                    assets: uploadedAssets,
                });
                return [3 /*break*/, 6];
            case 5:
                error_1 = _a.sent();
                if (error_1 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_1.message })];
                }
                logger_1.log.error({ err: error_1 }, 'Upload assets error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// GET /api/assets/workspace/:workspaceId - Get all assets for a workspace
router.get('/workspace/:workspaceId', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, assets;
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
            res.json({ assets: assets });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get assets by workspace error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/assets/:id - Get specific asset
router.get('/:id', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, asset, workspace;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            id = req.params.id;
            asset = auth_1.AuthModel.getAssetById(id);
            if (!asset) {
                return [2 /*return*/, res.status(404).json({ error: 'Asset not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(asset.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            res.json({ asset: asset });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get asset error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// DELETE /api/assets/:id - Delete asset
router.delete('/:id', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, asset, workspace, filePath, deleted;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            id = req.params.id;
            asset = auth_1.AuthModel.getAssetById(id);
            if (!asset) {
                return [2 /*return*/, res.status(404).json({ error: 'Asset not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(asset.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            filePath = path_1.default.join(process.cwd(), 'uploads', asset.filename);
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
            deleted = auth_1.AuthModel.deleteAsset(id);
            if (!deleted) {
                return [2 /*return*/, res.status(404).json({ error: 'Asset not found' })];
            }
            res.json({ message: 'Asset deleted successfully' });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Delete asset error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
