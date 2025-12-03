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
var maskingService_1 = require("../services/maskingService");
var router = (0, express_1.Router)();
var requireAuth = (0, auth_2.createAuthMiddleware)();
// Validation schemas
var createBrandKitSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().min(1),
    colors: zod_1.z.object({
        primary: zod_1.z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
        secondary: zod_1.z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
        tertiary: zod_1.z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
    }),
    fonts: zod_1.z.object({
        heading: zod_1.z.string().min(1),
        body: zod_1.z.string().min(1),
    }),
    logo: zod_1.z
        .object({
        url: zod_1.z.string().url(),
        position: zod_1.z.enum([
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
        ]),
    })
        .optional(),
    voicePrompt: zod_1.z.string().min(1).max(500),
});
var updateBrandKitSchema = zod_1.z.object({
    colors: zod_1.z
        .object({
        primary: zod_1.z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
        secondary: zod_1.z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
        tertiary: zod_1.z
            .string()
            .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
    })
        .optional(),
    fonts: zod_1.z
        .object({
        heading: zod_1.z.string().min(1),
        body: zod_1.z.string().min(1),
    })
        .optional(),
    logo: zod_1.z
        .object({
        url: zod_1.z.string().url(),
        position: zod_1.z.enum([
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
        ]),
    })
        .optional(),
    voicePrompt: zod_1.z.string().min(1).max(500).optional(),
});
// POST /api/brand-kits - Create new brand kit
router.post('/', requireAuth, (0, validateRequest_1.default)(createBrandKitSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, brandKitData, sanitizeText, workspace, brandKit, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                authenticatedReq = req;
                brandKitData = req.validatedData;
                if (!brandKitData.voicePrompt) return [3 /*break*/, 2];
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../utils/sanitizers')); })];
            case 1:
                sanitizeText = (_a.sent()).sanitizeText;
                brandKitData = __assign(__assign({}, brandKitData), { voicePrompt: sanitizeText(brandKitData.voicePrompt, 500) });
                _a.label = 2;
            case 2:
                workspace = auth_1.AuthModel.getWorkspaceById(brandKitData.workspaceId);
                if (!workspace) {
                    return [2 /*return*/, res.status(404).json({ error: 'Workspace not found' })];
                }
                if (workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                return [4 /*yield*/, auth_1.AuthModel.createBrandKit({
                        workspaceId: brandKitData.workspaceId,
                        colors: brandKitData.colors,
                        fonts: brandKitData.fonts,
                        logo: brandKitData.logo,
                        voicePrompt: brandKitData.voicePrompt,
                    })];
            case 3:
                brandKit = _a.sent();
                res.status(201).json({ brandKit: brandKit });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: 'Invalid input', details: error_1.issues })];
                }
                if (error_1 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({ error: error_1.message })];
                }
                logger_1.log.error({ err: error_1 }, 'Create brand kit error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); });
// GET /api/brand-kits/:id - Get specific brand kit
router.get('/:id', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, brandKit, workspace;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            id = req.params.id;
            brandKit = auth_1.AuthModel.getBrandKitById(id);
            if (!brandKit) {
                return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(brandKit.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            res.json({ brandKit: brandKit });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get brand kit error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// PUT /api/brand-kits/:id - Update brand kit
router.put('/:id', requireAuth, (0, validateRequest_1.default)(updateBrandKitSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, updates, sanitizeText, brandKit, workspace, updatedBrandKit, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                authenticatedReq = req;
                id = req.params.id;
                updates = req.validatedData;
                if (!updates.voicePrompt) return [3 /*break*/, 2];
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../utils/sanitizers')); })];
            case 1:
                sanitizeText = (_a.sent()).sanitizeText;
                updates = __assign(__assign({}, updates), { voicePrompt: sanitizeText(updates.voicePrompt, 500) });
                _a.label = 2;
            case 2:
                brandKit = auth_1.AuthModel.getBrandKitById(id);
                if (!brandKit) {
                    return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
                }
                workspace = auth_1.AuthModel.getWorkspaceById(brandKit.workspaceId);
                if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                    return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
                }
                updatedBrandKit = auth_1.AuthModel.updateBrandKit(id, updates);
                if (!updatedBrandKit) {
                    return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
                }
                res.json({ brandKit: updatedBrandKit });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _a.sent();
                if (error_2 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: 'Invalid input', details: error_2.issues })];
                }
                logger_1.log.error({ err: error_2 }, 'Update brand kit error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// DELETE /api/brand-kits/:id - Delete brand kit
router.delete('/:id', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, brandKit, workspace, deleted;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            id = req.params.id;
            brandKit = auth_1.AuthModel.getBrandKitById(id);
            if (!brandKit) {
                return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(brandKit.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            deleted = auth_1.AuthModel.deleteBrandKit(id);
            if (!deleted) {
                return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
            }
            res.json({ message: 'Brand kit deleted successfully' });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Delete brand kit error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/brand-kits/workspace/:workspaceId - Get brand kit by workspace
router.get('/workspace/:workspaceId', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, workspaceId, workspace, brandKit;
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
            brandKit = auth_1.AuthModel.getBrandKitByWorkspace(workspaceId);
            if (!brandKit) {
                return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
            }
            res.json({ brandKit: brandKit });
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Get brand kit by workspace error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
// GET /api/brand-kits/masking-models - Get available masking models
router.get('/masking-models', function (req, res) {
    try {
        var models = maskingService_1.MaskingService.getAvailableModels();
        var defaultModel = maskingService_1.MaskingService.getDefaultModel();
        res.json({
            models: models,
            defaultModel: defaultModel,
            count: Object.keys(models).length,
        });
    }
    catch (error) {
        logger_1.log.error({ err: error }, 'Get masking models error');
        res.status(500).json({ error: 'Internal server error' });
    }
});
// PUT /api/brand-kits/:id/masking-model - Update brand kit masking model
router.put('/:id/masking-model', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, id, updateSchema, maskingModel, brandKit, workspace, updatedBrandKit;
    return __generator(this, function (_a) {
        try {
            authenticatedReq = req;
            id = req.params.id;
            updateSchema = zod_1.z.object({
                maskingModel: zod_1.z.enum([
                    'rembg-replicate',
                    'sam3',
                    'rf-detr',
                    'roboflow',
                    'hf-model-id',
                ]),
            });
            maskingModel = req.validatedData.maskingModel;
            brandKit = auth_1.AuthModel.getBrandKitById(id);
            if (!brandKit) {
                return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
            }
            workspace = auth_1.AuthModel.getWorkspaceById(brandKit.workspaceId);
            if (!workspace || workspace.agencyId !== authenticatedReq.agency.id) {
                return [2 /*return*/, res.status(403).json({ error: 'Access denied' })];
            }
            updatedBrandKit = auth_1.AuthModel.updateBrandKit(id, {
                maskingModel: maskingModel,
            });
            if (!updatedBrandKit) {
                return [2 /*return*/, res.status(404).json({ error: 'Brand kit not found' })];
            }
            res.json({
                message: 'Masking model updated successfully',
                brandKit: updatedBrandKit,
            });
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return [2 /*return*/, res
                        .status(400)
                        .json({ error: 'Invalid input', details: error.issues })];
            }
            logger_1.log.error({ err: error }, 'Update masking model error');
            res.status(500).json({ error: 'Internal server error' });
        }
        return [2 /*return*/];
    });
}); });
exports.default = router;
