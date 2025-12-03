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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModel = void 0;
var bcrypt_1 = __importDefault(require("bcrypt"));
var logger_1 = require("../middleware/logger");
// In-memory storage for v1 (replace with database later)
var users = new Map();
var agencies = new Map();
var workspaces = new Map();
var brandKits = new Map();
var assets = new Map();
var captions = new Map();
var batchJobs = new Map();
var generatedAssets = new Map();
var exportJobs = new Map();
// Campaign Management v2 storage
var campaigns = new Map();
var referenceCreatives = new Map();
var adCreatives = new Map();
// Template Memory & Style Learning System (Stage 4)
var templates = new Map();
var styleProfiles = new Map();
var AuthModel = /** @class */ (function () {
    function AuthModel() {
    }
    AuthModel.hashPassword = function (password) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, bcrypt_1.default.hash(password, this.saltRounds)];
            });
        });
    };
    AuthModel.verifyPassword = function (password, hashedPassword) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, bcrypt_1.default.compare(password, hashedPassword)];
            });
        });
    };
    AuthModel.createUser = function (email, password, agencyName) {
        return __awaiter(this, void 0, void 0, function () {
            var userId, agencyId, user, agency;
            return __generator(this, function (_a) {
                userId = "user_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                agencyId = "agency_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                user = {
                    id: userId,
                    email: email,
                    agencyId: agencyId,
                    createdAt: new Date(),
                    lastLoginAt: new Date(),
                };
                agency = {
                    id: agencyId,
                    billingActive: false, // Free tier initially
                    planType: 'free',
                    createdAt: new Date(),
                };
                users.set(userId, user);
                agencies.set(agencyId, agency);
                return [2 /*return*/, { user: user, agency: agency }];
            });
        });
    };
    AuthModel.findUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, user;
            return __generator(this, function (_b) {
                for (_i = 0, _a = users.values(); _i < _a.length; _i++) {
                    user = _a[_i];
                    if (user.email === email) {
                        return [2 /*return*/, user];
                    }
                }
                return [2 /*return*/, null];
            });
        });
    };
    AuthModel.getUserById = function (id) {
        return users.get(id) || null;
    };
    AuthModel.getAgencyById = function (id) {
        return agencies.get(id) || null;
    };
    AuthModel.updateUserLastLogin = function (userId) {
        var user = users.get(userId);
        if (user) {
            user.lastLoginAt = new Date();
        }
    };
    AuthModel.createWorkspace = function (agencyId, clientName) {
        return __awaiter(this, void 0, void 0, function () {
            var workspaceId, workspace;
            return __generator(this, function (_a) {
                workspaceId = "workspace_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                workspace = {
                    id: workspaceId,
                    agencyId: agencyId,
                    clientName: clientName,
                    brandKitId: '', // Will be set when brand kit is created
                    createdAt: new Date(),
                };
                workspaces.set(workspaceId, workspace);
                return [2 /*return*/, workspace];
            });
        });
    };
    AuthModel.getWorkspacesByAgency = function (agencyId) {
        return Array.from(workspaces.values()).filter(function (w) { return w.agencyId === agencyId; });
    };
    AuthModel.getWorkspaceById = function (id) {
        return workspaces.get(id) || null;
    };
    AuthModel.updateWorkspace = function (workspaceId, updates) {
        var workspace = workspaces.get(workspaceId);
        if (workspace) {
            Object.assign(workspace, updates);
        }
    };
    // Brand Kit methods
    AuthModel.createBrandKit = function (brandKitData) {
        return __awaiter(this, void 0, void 0, function () {
            var workspaceId, workspace, existingBrandKits, brandKitId, brandKit;
            return __generator(this, function (_a) {
                workspaceId = brandKitData.workspaceId;
                workspace = workspaces.get(workspaceId);
                if (!workspace) {
                    throw new Error('Workspace not found');
                }
                existingBrandKits = Array.from(brandKits.values()).filter(function (bk) { return bk.workspaceId === workspaceId; });
                if (existingBrandKits.length > 0) {
                    throw new Error('Workspace already has a brand kit');
                }
                brandKitId = "brandkit_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                brandKit = {
                    id: brandKitId,
                    workspaceId: workspaceId,
                    colors: brandKitData.colors,
                    fonts: brandKitData.fonts,
                    logo: brandKitData.logo,
                    voicePrompt: brandKitData.voicePrompt,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
                brandKits.set(brandKitId, brandKit);
                // Update workspace with brand kit ID
                workspace.brandKitId = brandKitId;
                return [2 /*return*/, brandKit];
            });
        });
    };
    AuthModel.getBrandKitById = function (id) {
        return brandKits.get(id) || null;
    };
    AuthModel.getBrandKitByWorkspace = function (workspaceId) {
        for (var _i = 0, _a = brandKits.values(); _i < _a.length; _i++) {
            var brandKit = _a[_i];
            if (brandKit.workspaceId === workspaceId) {
                return brandKit;
            }
        }
        return null;
    };
    AuthModel.updateBrandKit = function (id, updates) {
        var brandKit = brandKits.get(id);
        if (!brandKit) {
            return null;
        }
        var updatedBrandKit = __assign(__assign(__assign({}, brandKit), updates), { updatedAt: new Date() });
        brandKits.set(id, updatedBrandKit);
        return updatedBrandKit;
    };
    AuthModel.deleteBrandKit = function (id) {
        var brandKit = brandKits.get(id);
        if (!brandKit) {
            return false;
        }
        // Clear brand kit reference from workspace
        var workspace = workspaces.get(brandKit.workspaceId);
        if (workspace) {
            workspace.brandKitId = '';
        }
        brandKits.delete(id);
        return true;
    };
    AuthModel.getAllBrandKits = function () {
        return Array.from(brandKits.values());
    };
    // Admin methods
    AuthModel.getAllUsers = function () {
        return Array.from(users.values());
    };
    AuthModel.getAllAgencies = function () {
        return Array.from(agencies.values());
    };
    AuthModel.getAllWorkspaces = function () {
        return Array.from(workspaces.values());
    };
    // Asset methods
    AuthModel.createAsset = function (assetData) {
        return __awaiter(this, void 0, void 0, function () {
            var workspaceId, workspace, existingAssets, assetId, asset;
            return __generator(this, function (_a) {
                workspaceId = assetData.workspaceId;
                workspace = workspaces.get(workspaceId);
                if (!workspace) {
                    throw new Error('Workspace not found');
                }
                existingAssets = Array.from(assets.values()).filter(function (a) { return a.workspaceId === workspaceId; });
                if (existingAssets.length >= 20) {
                    throw new Error('Maximum 20 assets allowed per workspace');
                }
                assetId = "asset_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                asset = {
                    id: assetId,
                    workspaceId: workspaceId,
                    filename: assetData.filename,
                    originalName: assetData.originalName,
                    mimeType: assetData.mimeType,
                    size: assetData.size,
                    url: assetData.url,
                    uploadedAt: new Date(),
                };
                assets.set(assetId, asset);
                return [2 /*return*/, asset];
            });
        });
    };
    AuthModel.getAssetById = function (id) {
        return assets.get(id) || null;
    };
    AuthModel.getAssetsByWorkspace = function (workspaceId) {
        return Array.from(assets.values()).filter(function (a) { return a.workspaceId === workspaceId; });
    };
    AuthModel.deleteAsset = function (id) {
        var asset = assets.get(id);
        if (!asset) {
            return false;
        }
        assets.delete(id);
        return true;
    };
    AuthModel.deleteAssetsByWorkspace = function (workspaceId) {
        var workspaceAssets = Array.from(assets.values()).filter(function (a) { return a.workspaceId === workspaceId; });
        var deletedCount = 0;
        for (var _i = 0, workspaceAssets_1 = workspaceAssets; _i < workspaceAssets_1.length; _i++) {
            var asset = workspaceAssets_1[_i];
            if (assets.delete(asset.id)) {
                deletedCount++;
            }
        }
        return deletedCount;
    };
    AuthModel.getAllAssets = function () {
        return Array.from(assets.values());
    };
    // Batch job methods
    AuthModel.createBatchJob = function (workspaceId, assetIds) {
        var jobId = "batch_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        var batchJob = {
            id: jobId,
            workspaceId: workspaceId,
            assetIds: assetIds,
            status: 'pending',
            processedCount: 0,
            totalCount: assetIds.length,
            createdAt: new Date(),
        };
        batchJobs.set(jobId, batchJob);
        return batchJob;
    };
    AuthModel.getBatchJobById = function (id) {
        return batchJobs.get(id) || null;
    };
    AuthModel.getBatchJobsByWorkspace = function (workspaceId) {
        return Array.from(batchJobs.values()).filter(function (job) { return job.workspaceId === workspaceId; });
    };
    AuthModel.updateBatchJob = function (id, updates) {
        var job = batchJobs.get(id);
        if (!job) {
            return null;
        }
        var updatedJob = __assign(__assign({}, job), updates);
        batchJobs.set(id, updatedJob);
        return updatedJob;
    };
    // Caption methods
    AuthModel.createCaption = function (assetId, workspaceId, campaignId) {
        var captionId = "caption_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        var caption = {
            id: captionId,
            assetId: assetId,
            workspaceId: workspaceId,
            campaignId: campaignId, // Add campaignId if provided
            variations: [],
            status: 'pending',
            approvalStatus: 'pending',
            createdAt: new Date(),
        };
        captions.set(captionId, caption);
        return caption;
    };
    AuthModel.getCaptionById = function (id) {
        return captions.get(id) || null;
    };
    AuthModel.getCaptionsByWorkspace = function (workspaceId) {
        return Array.from(captions.values()).filter(function (c) { return c.workspaceId === workspaceId; });
    };
    AuthModel.getCaptionsByAsset = function (assetId) {
        return Array.from(captions.values()).filter(function (c) { return c.assetId === assetId; });
    };
    AuthModel.updateCaption = function (id, updates) {
        var caption = captions.get(id);
        if (!caption) {
            return null;
        }
        var updatedCaption = __assign(__assign({}, caption), updates);
        captions.set(id, updatedCaption);
        return updatedCaption;
    };
    AuthModel.addCaptionVariation = function (captionId, variation) {
        var caption = captions.get(captionId);
        if (!caption) {
            return null;
        }
        var variationId = "var_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        var newVariation = __assign(__assign({}, variation), { id: variationId, createdAt: new Date(), status: variation.status || 'completed', approvalStatus: variation.approvalStatus || 'pending' });
        var updatedCaption = __assign(__assign({}, caption), { variations: __spreadArray(__spreadArray([], caption.variations, true), [newVariation], false) });
        // If this is the first variation, set it as primary
        if (caption.variations.length === 0) {
            updatedCaption.primaryVariationId = variationId;
        }
        captions.set(captionId, updatedCaption);
        return updatedCaption;
    };
    AuthModel.updateCaptionVariation = function (captionId, variationId, updates) {
        var caption = captions.get(captionId);
        if (!caption) {
            return null;
        }
        var variationIndex = caption.variations.findIndex(function (v) { return v.id === variationId; });
        if (variationIndex === -1) {
            return null;
        }
        var updatedVariations = __spreadArray([], caption.variations, true);
        updatedVariations[variationIndex] = __assign(__assign({}, updatedVariations[variationIndex]), updates);
        var updatedCaption = __assign(__assign({}, caption), { variations: updatedVariations });
        captions.set(captionId, updatedCaption);
        return updatedCaption;
    };
    AuthModel.setPrimaryCaptionVariation = function (captionId, variationId) {
        var caption = captions.get(captionId);
        if (!caption) {
            return null;
        }
        // Verify the variation exists
        var variationExists = caption.variations.some(function (v) { return v.id === variationId; });
        if (!variationExists) {
            return null;
        }
        var updatedCaption = __assign(__assign({}, caption), { primaryVariationId: variationId });
        captions.set(captionId, updatedCaption);
        return updatedCaption;
    };
    AuthModel.getPrimaryCaptionVariation = function (captionId) {
        var caption = captions.get(captionId);
        if (!caption || !caption.primaryVariationId) {
            return null;
        }
        var variation = caption.variations.find(function (v) { return v.id === caption.primaryVariationId; });
        return variation || null;
    };
    AuthModel.deleteCaption = function (id) {
        return captions.delete(id);
    };
    AuthModel.deleteCaptionsByWorkspace = function (workspaceId) {
        var workspaceCaptions = Array.from(captions.values()).filter(function (c) { return c.workspaceId === workspaceId; });
        var deletedCount = 0;
        for (var _i = 0, workspaceCaptions_1 = workspaceCaptions; _i < workspaceCaptions_1.length; _i++) {
            var caption = workspaceCaptions_1[_i];
            if (captions.delete(caption.id)) {
                deletedCount++;
            }
        }
        return deletedCount;
    };
    AuthModel.getAllBatchJobs = function () {
        return Array.from(batchJobs.values());
    };
    AuthModel.getAllCaptions = function () {
        return Array.from(captions.values());
    };
    // Approval methods
    AuthModel.approveCaption = function (captionId, variationId) {
        var caption = captions.get(captionId);
        if (!caption) {
            return null;
        }
        // If no variation ID is specified, approve the primary variation or the first one
        if (!variationId) {
            if (caption.primaryVariationId) {
                return this.approveCaptionVariation(captionId, caption.primaryVariationId);
            }
            else if (caption.variations.length > 0) {
                return this.approveCaptionVariation(captionId, caption.variations[0].id);
            }
            else {
                // If no variations exist, approve the caption at the main level
                var approvedCaption = __assign(__assign({}, caption), { approvalStatus: 'approved', approvedAt: new Date() });
                captions.set(captionId, approvedCaption);
                return approvedCaption;
            }
        }
        else {
            return this.approveCaptionVariation(captionId, variationId);
        }
    };
    AuthModel.approveCaptionVariation = function (captionId, variationId) {
        var caption = captions.get(captionId);
        if (!caption) {
            return null;
        }
        var variationIndex = caption.variations.findIndex(function (v) { return v.id === variationId; });
        if (variationIndex === -1) {
            return null;
        }
        // Update the specific variation to approved
        var updatedVariations = __spreadArray([], caption.variations, true);
        updatedVariations[variationIndex] = __assign(__assign({}, updatedVariations[variationIndex]), { approvalStatus: 'approved', approvedAt: new Date() });
        // Update the main caption approval status based on variations
        var hasApprovedVariation = updatedVariations.some(function (v) { return v.approvalStatus === 'approved'; });
        var allVariationsRejected = updatedVariations.every(function (v) { return v.approvalStatus === 'rejected'; });
        var newApprovalStatus = 'pending';
        if (hasApprovedVariation) {
            newApprovalStatus = 'approved';
        }
        else if (allVariationsRejected) {
            newApprovalStatus = 'rejected';
        }
        var approvedCaption = __assign(__assign({}, caption), { variations: updatedVariations, approvalStatus: newApprovalStatus, approvedAt: newApprovalStatus === 'approved' ? new Date() : caption.approvedAt });
        // Set this variation as the primary one when approved
        approvedCaption.primaryVariationId = variationId;
        captions.set(captionId, approvedCaption);
        // Trigger template learning from this approved variation
        try {
            // Dynamically import to avoid circular dependencies
            Promise.resolve().then(function () { return __importStar(require('../services/TemplateIntegrationService')); }).then(function (_a) {
                var TemplateIntegrationService = _a.TemplateIntegrationService;
                TemplateIntegrationService.learnFromApproval(captionId, caption.workspaceId, caption.campaignId)
                    .catch(function (err) { return logger_1.log.error({ err: err, captionId: captionId }, 'Failed to learn from approved caption'); });
            })
                .catch(function (err) { return logger_1.log.error({ err: err, captionId: captionId }, 'Failed to import TemplateIntegrationService for learning'); });
        }
        catch (err) {
            logger_1.log.error({ err: err, captionId: captionId }, 'Error triggering template learning from approval');
        }
        return approvedCaption;
    };
    AuthModel.rejectCaption = function (captionId, reason, variationId) {
        var caption = captions.get(captionId);
        if (!caption) {
            return null;
        }
        // If no variation ID is specified, reject the primary variation or the first one
        if (!variationId) {
            if (caption.primaryVariationId) {
                return this.rejectCaptionVariation(captionId, reason, caption.primaryVariationId);
            }
            else if (caption.variations.length > 0) {
                return this.rejectCaptionVariation(captionId, reason, caption.variations[0].id);
            }
            else {
                // If no variations exist, reject the caption at the main level
                var rejectedCaption = __assign(__assign({}, caption), { approvalStatus: 'rejected', rejectedAt: new Date(), errorMessage: reason || 'Rejected by user' });
                captions.set(captionId, rejectedCaption);
                return rejectedCaption;
            }
        }
        else {
            return this.rejectCaptionVariation(captionId, reason, variationId);
        }
    };
    AuthModel.rejectCaptionVariation = function (captionId, reason, variationId) {
        var caption = captions.get(captionId);
        if (!caption) {
            return null;
        }
        var variationIndex = caption.variations.findIndex(function (v) { return v.id === variationId; });
        if (variationIndex === -1) {
            return null;
        }
        // Update the specific variation to rejected
        var updatedVariations = __spreadArray([], caption.variations, true);
        updatedVariations[variationIndex] = __assign(__assign({}, updatedVariations[variationIndex]), { approvalStatus: 'rejected', rejectedAt: new Date(), errorMessage: reason });
        // Update the main caption approval status based on variations
        var hasApprovedVariation = updatedVariations.some(function (v) { return v.approvalStatus === 'approved'; });
        var allVariationsRejected = updatedVariations.every(function (v) { return v.approvalStatus === 'rejected'; });
        var newApprovalStatus = 'pending';
        if (hasApprovedVariation) {
            newApprovalStatus = 'approved';
        }
        else if (allVariationsRejected) {
            newApprovalStatus = 'rejected';
        }
        var rejectedCaption = __assign(__assign({}, caption), { variations: updatedVariations, approvalStatus: newApprovalStatus, rejectedAt: newApprovalStatus === 'rejected' ? new Date() : caption.rejectedAt });
        captions.set(captionId, rejectedCaption);
        return rejectedCaption;
    };
    AuthModel.batchApproveCaptions = function (captionIds) {
        var approved = 0;
        var failed = 0;
        for (var _i = 0, captionIds_1 = captionIds; _i < captionIds_1.length; _i++) {
            var captionId = captionIds_1[_i];
            if (this.approveCaption(captionId)) {
                approved++;
            }
            else {
                failed++;
            }
        }
        return { approved: approved, failed: failed };
    };
    AuthModel.batchRejectCaptions = function (captionIds, reason) {
        var rejected = 0;
        var failed = 0;
        for (var _i = 0, captionIds_2 = captionIds; _i < captionIds_2.length; _i++) {
            var captionId = captionIds_2[_i];
            if (this.rejectCaption(captionId, reason)) {
                rejected++;
            }
            else {
                failed++;
            }
        }
        return { rejected: rejected, failed: failed };
    };
    AuthModel.getApprovedCaptionsByWorkspace = function (workspaceId) {
        return Array.from(captions.values()).filter(function (c) { return c.workspaceId === workspaceId && c.approvalStatus === 'approved'; });
    };
    // Export job methods
    AuthModel.createExportJob = function (workspaceId, assetCount, captionCount, generatedAssetCount) {
        if (generatedAssetCount === void 0) { generatedAssetCount = 0; }
        var exportId = "export_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        var exportJob = {
            id: exportId,
            workspaceId: workspaceId,
            status: 'pending',
            assetCount: assetCount,
            captionCount: captionCount,
            generatedAssetCount: generatedAssetCount,
            createdAt: new Date(),
        };
        exportJobs.set(exportId, exportJob);
        return exportJob;
    };
    AuthModel.getExportJobById = function (id) {
        return exportJobs.get(id) || null;
    };
    // Export jobs retrieval remains implemented once above
    AuthModel.updateExportJob = function (id, updates) {
        var job = exportJobs.get(id);
        if (!job) {
            return null;
        }
        var updatedJob = __assign(__assign({}, job), updates);
        exportJobs.set(id, updatedJob);
        return updatedJob;
    };
    AuthModel.deleteExportJob = function (id) {
        var job = exportJobs.get(id);
        if (!job) {
            return false;
        }
        // Delete zip file if it exists
        if (job.zipFilePath) {
            try {
                var fs = require('fs');
                if (fs.existsSync(job.zipFilePath)) {
                    fs.unlinkSync(job.zipFilePath);
                }
            }
            catch (error) {
                logger_1.log.error({ err: error, zipFilePath: job.zipFilePath }, 'Error deleting zip file');
            }
        }
        exportJobs.delete(id);
        return true;
    };
    AuthModel.getAllExportJobs = function () {
        return Array.from(exportJobs.values());
    };
    AuthModel.getExportJobsByWorkspace = function (workspaceId) {
        return Array.from(exportJobs.values()).filter(function (job) { return job.workspaceId === workspaceId; });
    };
    AuthModel.getExportHistory = function (workspaceId, limit) {
        if (limit === void 0) { limit = 10; }
        var workspaceExports = this.getExportJobsByWorkspace(workspaceId);
        // Sort by creation date (most recent first)
        var sortedExports = workspaceExports.sort(function (a, b) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        // Group by date for activity summary
        var activityMap = new Map();
        sortedExports.forEach(function (exp) {
            var dateKey = exp.createdAt.toISOString().split('T')[0];
            var existing = activityMap.get(dateKey) || {
                count: 0,
                status: 'completed',
            };
            activityMap.set(dateKey, {
                count: existing.count + 1,
                status: exp.status === 'completed' ? 'completed' : existing.status,
            });
        });
        var recentActivity = Array.from(activityMap.entries())
            .slice(0, 7) // Last 7 days
            .map(function (_a) {
            var date = _a[0], data = _a[1];
            return (__assign({ date: date }, data));
        });
        return {
            total: workspaceExports.length,
            exports: sortedExports.slice(0, limit),
            recentActivity: recentActivity,
        };
    };
    AuthModel.getExportStatistics = function (workspaceId) {
        var workspaceExports = this.getExportJobsByWorkspace(workspaceId);
        var completed = workspaceExports.filter(function (job) { return job.status === 'completed'; });
        var failed = workspaceExports.filter(function (job) { return job.status === 'failed'; });
        // Calculate average processing time for completed exports
        var processingTimes = completed
            .filter(function (job) { return job.completedAt && job.createdAt; })
            .map(function (job) {
            var start = new Date(job.createdAt).getTime();
            var end = new Date(job.completedAt).getTime();
            return (end - start) / 1000; // Convert to seconds
        });
        var averageTime = processingTimes.length > 0
            ? processingTimes.reduce(function (sum, time) { return sum + time; }, 0) /
                processingTimes.length
            : 0;
        var totalAssets = workspaceExports.reduce(function (sum, job) { return sum + job.assetCount; }, 0);
        var totalGeneratedAssets = workspaceExports.reduce(function (sum, job) { return sum + (job.generatedAssetCount || 0); }, 0);
        return {
            totalExports: workspaceExports.length,
            completedExports: completed.length,
            failedExports: failed.length,
            averageProcessingTime: Math.round(averageTime),
            totalAssetsExported: totalAssets,
            totalGeneratedAssetsExported: totalGeneratedAssets,
            successRate: workspaceExports.length > 0
                ? (completed.length / workspaceExports.length) * 100
                : 0,
        };
    };
    // GeneratedAsset methods
    AuthModel.createGeneratedAsset = function (data) {
        var assetId = "generated_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
        var generatedAsset = __assign(__assign({ id: assetId }, data), { createdAt: new Date() });
        generatedAssets.set(assetId, generatedAsset);
        return generatedAsset;
    };
    AuthModel.getGeneratedAssetById = function (id) {
        return generatedAssets.get(id) || null;
    };
    AuthModel.getGeneratedAssetsByJob = function (jobId) {
        return Array.from(generatedAssets.values()).filter(function (asset) { return asset.jobId === jobId; });
    };
    AuthModel.getGeneratedAssetsByWorkspace = function (workspaceId) {
        return Array.from(generatedAssets.values()).filter(function (asset) { return asset.workspaceId === workspaceId; });
    };
    AuthModel.getApprovedGeneratedAssets = function (workspaceId) {
        return Array.from(generatedAssets.values()).filter(function (asset) {
            return asset.workspaceId === workspaceId && asset.approvalStatus === 'approved';
        });
    };
    AuthModel.getApprovedGeneratedAssetsByCampaign = function (campaignId) {
        return Array.from(generatedAssets.values()).filter(function (asset) {
            return asset.campaignId === campaignId && asset.approvalStatus === 'approved';
        });
    };
    AuthModel.updateGeneratedAsset = function (id, updates) {
        var asset = generatedAssets.get(id);
        if (!asset) {
            return null;
        }
        var updatedAsset = __assign(__assign({}, asset), updates);
        generatedAssets.set(id, updatedAsset);
        return updatedAsset;
    };
    AuthModel.approveGeneratedAsset = function (id) {
        return this.updateGeneratedAsset(id, {
            approvalStatus: 'approved',
            approvedAt: new Date(),
        });
    };
    AuthModel.rejectGeneratedAsset = function (id) {
        return this.updateGeneratedAsset(id, {
            approvalStatus: 'rejected',
            rejectedAt: new Date(),
        });
    };
    AuthModel.batchApproveGeneratedAssets = function (assetIds) {
        var approved = 0;
        var failed = 0;
        for (var _i = 0, assetIds_1 = assetIds; _i < assetIds_1.length; _i++) {
            var assetId = assetIds_1[_i];
            if (this.approveGeneratedAsset(assetId)) {
                approved++;
            }
            else {
                failed++;
            }
        }
        return { approved: approved, failed: failed };
    };
    AuthModel.batchRejectGeneratedAssets = function (assetIds) {
        var rejected = 0;
        var failed = 0;
        for (var _i = 0, assetIds_2 = assetIds; _i < assetIds_2.length; _i++) {
            var assetId = assetIds_2[_i];
            if (this.rejectGeneratedAsset(assetId)) {
                rejected++;
            }
            else {
                failed++;
            }
        }
        return { rejected: rejected, failed: failed };
    };
    AuthModel.deleteGeneratedAsset = function (id) {
        var asset = generatedAssets.get(id);
        if (!asset) {
            return false;
        }
        // Delete files if they exist
        try {
            var fs = require('fs');
            if (fs.existsSync(asset.imageUrl)) {
                fs.unlinkSync(asset.imageUrl);
            }
            if (fs.existsSync(asset.thumbnailUrl)) {
                fs.unlinkSync(asset.thumbnailUrl);
            }
        }
        catch (error) {
            logger_1.log.error({ err: error, assetId: id }, 'Error deleting generated asset files');
        }
        generatedAssets.delete(id);
        return true;
    };
    AuthModel.deleteGeneratedAssetsByJob = function (jobId) {
        var jobAssets = this.getGeneratedAssetsByJob(jobId);
        var deletedCount = 0;
        for (var _i = 0, jobAssets_1 = jobAssets; _i < jobAssets_1.length; _i++) {
            var asset = jobAssets_1[_i];
            if (this.deleteGeneratedAsset(asset.id)) {
                deletedCount++;
            }
        }
        return deletedCount;
    };
    AuthModel.deleteGeneratedAssetsByWorkspace = function (workspaceId) {
        var workspaceAssets = this.getGeneratedAssetsByWorkspace(workspaceId);
        var deletedCount = 0;
        for (var _i = 0, workspaceAssets_2 = workspaceAssets; _i < workspaceAssets_2.length; _i++) {
            var asset = workspaceAssets_2[_i];
            if (this.deleteGeneratedAsset(asset.id)) {
                deletedCount++;
            }
        }
        return deletedCount;
    };
    AuthModel.getAllGeneratedAssets = function () {
        return Array.from(generatedAssets.values());
    };
    // Campaign Management v2 Methods
    AuthModel.createCampaign = function (campaignData) {
        return __awaiter(this, void 0, void 0, function () {
            var id, now, campaign;
            return __generator(this, function (_a) {
                id = "campaign_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                now = new Date();
                campaign = __assign(__assign({}, campaignData), { id: id, status: 'draft', createdAt: now, updatedAt: now });
                campaigns.set(id, campaign);
                return [2 /*return*/, campaign];
            });
        });
    };
    AuthModel.getCampaignById = function (id) {
        return campaigns.get(id) || null;
    };
    AuthModel.getCampaignsByWorkspace = function (workspaceId) {
        return Array.from(campaigns.values()).filter(function (c) { return c.workspaceId === workspaceId; });
    };
    AuthModel.getCampaignsByAgency = function (agencyId) {
        var agencyWorkspaces = Array.from(workspaces.values()).filter(function (w) { return w.agencyId === agencyId; });
        var workspaceIds = agencyWorkspaces.map(function (w) { return w.id; });
        return Array.from(campaigns.values()).filter(function (c) {
            return workspaceIds.includes(c.workspaceId);
        });
    };
    AuthModel.updateCampaign = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var campaign, updatedCampaign;
            return __generator(this, function (_a) {
                campaign = campaigns.get(id);
                if (!campaign) {
                    throw new Error('Campaign not found');
                }
                updatedCampaign = __assign(__assign(__assign({}, campaign), updates), { updatedAt: new Date() });
                campaigns.set(id, updatedCampaign);
                return [2 /*return*/, updatedCampaign];
            });
        });
    };
    AuthModel.deleteCampaign = function (id) {
        return campaigns.delete(id);
    };
    // Reference Creative Methods
    AuthModel.createReferenceCreative = function (referenceData) {
        return __awaiter(this, void 0, void 0, function () {
            var id, now, referenceCreative;
            return __generator(this, function (_a) {
                id = "ref_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                now = new Date();
                referenceCreative = __assign(__assign({}, referenceData), { id: id, createdAt: now });
                referenceCreatives.set(id, referenceCreative);
                return [2 /*return*/, referenceCreative];
            });
        });
    };
    AuthModel.getReferenceCreativeById = function (id) {
        return referenceCreatives.get(id) || null;
    };
    AuthModel.getReferenceCreativesByWorkspace = function (workspaceId) {
        return Array.from(referenceCreatives.values()).filter(function (r) { return r.workspaceId === workspaceId; });
    };
    AuthModel.getReferenceCreativesByCampaign = function (campaignId) {
        return Array.from(referenceCreatives.values()).filter(function (r) { return r.campaignId === campaignId; });
    };
    AuthModel.updateReferenceCreative = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var referenceCreative, updatedReferenceCreative;
            return __generator(this, function (_a) {
                referenceCreative = referenceCreatives.get(id);
                if (!referenceCreative) {
                    throw new Error('Reference creative not found');
                }
                updatedReferenceCreative = __assign(__assign({}, referenceCreative), updates);
                referenceCreatives.set(id, updatedReferenceCreative);
                return [2 /*return*/, updatedReferenceCreative];
            });
        });
    };
    AuthModel.deleteReferenceCreative = function (id) {
        var referenceCreative = referenceCreatives.get(id);
        if (!referenceCreative) {
            return false;
        }
        // Delete files if they exist
        try {
            var fs = require('fs');
            if (fs.existsSync(referenceCreative.imageUrl)) {
                fs.unlinkSync(referenceCreative.imageUrl);
            }
            if (fs.existsSync(referenceCreative.thumbnailUrl)) {
                fs.unlinkSync(referenceCreative.thumbnailUrl);
            }
        }
        catch (error) {
            logger_1.log.error({ err: error, referenceId: id }, 'Error deleting reference creative files');
        }
        return referenceCreatives.delete(id);
    };
    // Ad Creative Methods
    AuthModel.createAdCreative = function (adCreativeData) {
        return __awaiter(this, void 0, void 0, function () {
            var id, adCreative;
            return __generator(this, function (_a) {
                id = "ad_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                adCreative = __assign(__assign({}, adCreativeData), { id: id });
                adCreatives.set(id, adCreative);
                return [2 /*return*/, adCreative];
            });
        });
    };
    AuthModel.getAdCreativeById = function (id) {
        return adCreatives.get(id) || null;
    };
    AuthModel.getAdCreativesByCampaign = function (campaignId) {
        return Array.from(adCreatives.values()).filter(function (ad) { return ad.campaignId === campaignId; });
    };
    AuthModel.getAdCreativesByWorkspace = function (workspaceId) {
        return Array.from(adCreatives.values()).filter(function (ad) { return ad.workspaceId === workspaceId; });
    };
    AuthModel.updateAdCreative = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var adCreative, updatedAdCreative;
            return __generator(this, function (_a) {
                adCreative = adCreatives.get(id);
                if (!adCreative) {
                    throw new Error('Ad creative not found');
                }
                updatedAdCreative = __assign(__assign({}, adCreative), updates);
                adCreatives.set(id, updatedAdCreative);
                return [2 /*return*/, updatedAdCreative];
            });
        });
    };
    AuthModel.deleteAdCreative = function (id) {
        var adCreative = adCreatives.get(id);
        if (!adCreative) {
            return false;
        }
        // Delete files if they exist
        try {
            var fs = require('fs');
            if (fs.existsSync(adCreative.imageUrl)) {
                fs.unlinkSync(adCreative.imageUrl);
            }
            if (fs.existsSync(adCreative.thumbnailUrl)) {
                fs.unlinkSync(adCreative.thumbnailUrl);
            }
        }
        catch (error) {
            logger_1.log.error({ err: error, adCreativeId: id }, 'Error deleting ad creative files');
        }
        return adCreatives.delete(id);
    };
    AuthModel.getAllCampaigns = function () {
        return Array.from(campaigns.values());
    };
    AuthModel.getAllReferenceCreatives = function () {
        return Array.from(referenceCreatives.values());
    };
    AuthModel.getAllAdCreatives = function () {
        return Array.from(adCreatives.values());
    };
    // Template Memory System (added for Stage 4 - Template Memory & Style Learning)
    AuthModel.getTemplateById = function (id) {
        return templates.get(id) || null;
    };
    AuthModel.getTemplatesByWorkspace = function (workspaceId) {
        return Array.from(templates.values()).filter(function (t) { return t.workspaceId === workspaceId; });
    };
    AuthModel.createTemplate = function (template) {
        return __awaiter(this, void 0, void 0, function () {
            var id, newTemplate;
            return __generator(this, function (_a) {
                id = "tmpl_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                newTemplate = __assign(__assign({}, template), { id: id, createdAt: new Date() });
                templates.set(id, newTemplate);
                return [2 /*return*/, newTemplate];
            });
        });
    };
    AuthModel.updateTemplate = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var template, updatedTemplate;
            return __generator(this, function (_a) {
                template = templates.get(id);
                if (!template) {
                    throw new Error('Template not found');
                }
                updatedTemplate = __assign(__assign({}, template), updates);
                templates.set(id, updatedTemplate);
                return [2 /*return*/, updatedTemplate];
            });
        });
    };
    AuthModel.deleteTemplate = function (id) {
        return templates.delete(id);
    };
    AuthModel.getAllTemplates = function () {
        return Array.from(templates.values());
    };
    // Style Profile System (added for Stage 4 - Template Memory & Style Learning)
    AuthModel.getStyleProfileById = function (id) {
        return styleProfiles.get(id) || null;
    };
    AuthModel.getStyleProfilesByWorkspace = function (workspaceId) {
        return Array.from(styleProfiles.values()).filter(function (s) { return s.workspaceId === workspaceId; });
    };
    AuthModel.createStyleProfile = function (styleProfile) {
        return __awaiter(this, void 0, void 0, function () {
            var id, newStyleProfile;
            return __generator(this, function (_a) {
                id = "style_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                newStyleProfile = __assign(__assign({}, styleProfile), { id: id, createdAt: new Date() });
                styleProfiles.set(id, newStyleProfile);
                return [2 /*return*/, newStyleProfile];
            });
        });
    };
    AuthModel.updateStyleProfile = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var styleProfile, updatedStyleProfile;
            return __generator(this, function (_a) {
                styleProfile = styleProfiles.get(id);
                if (!styleProfile) {
                    throw new Error('Style profile not found');
                }
                updatedStyleProfile = __assign(__assign({}, styleProfile), updates);
                styleProfiles.set(id, updatedStyleProfile);
                return [2 /*return*/, updatedStyleProfile];
            });
        });
    };
    AuthModel.deleteStyleProfile = function (id) {
        return styleProfiles.delete(id);
    };
    AuthModel.getAllStyleProfiles = function () {
        return Array.from(styleProfiles.values());
    };
    // Additional methods needed for TemplateMemoryService
    AuthModel.getCaptionsByCampaignAndStatus = function (campaignId, status) {
        return Array.from(captions.values()).filter(function (c) { return c.campaignId === campaignId && (status ? c.approvalStatus === status : true); });
    };
    AuthModel.getGeneratedAssetsByCampaignAndStatus = function (campaignId, status) {
        return Array.from(generatedAssets.values()).filter(function (ga) { return ga.campaignId === campaignId && (status ? ga.approvalStatus === status : true); });
    };
    AuthModel.saltRounds = 12;
    return AuthModel;
}());
exports.AuthModel = AuthModel;
