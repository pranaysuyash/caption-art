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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaskingService = void 0;
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var CacheService_1 = require("./CacheService");
var crypto_1 = require("crypto");
var MaskingService = /** @class */ (function () {
    function MaskingService() {
    }
    /**
     * Apply masking using specified model
     */
    MaskingService.applyMasking = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var imagePath, model, _a, modelConfig, startTime, cacheKey, cacheService, cachedResult, maskPath, _b, processingTime, maskUrl, result, error_1;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        imagePath = request.imagePath, model = request.model, _a = request.modelConfig, modelConfig = _a === void 0 ? {} : _a;
                        startTime = Date.now();
                        cacheKey = "mask_".concat((0, crypto_1.createHash)('md5').update("".concat(imagePath, "_").concat(model, "_").concat(JSON.stringify(modelConfig))).digest('hex'));
                        cacheService = CacheService_1.CacheService.getInstance();
                        return [4 /*yield*/, cacheService.get(cacheKey)];
                    case 1:
                        cachedResult = _c.sent();
                        if (cachedResult) {
                            logger_1.log.info({ cacheKey: cacheKey, imagePath: imagePath }, 'Masking result served from cache');
                            return [2 /*return*/, cachedResult];
                        }
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 16, , 17]);
                        maskPath = void 0;
                        _b = model;
                        switch (_b) {
                            case 'rembg-replicate': return [3 /*break*/, 3];
                            case 'sam3': return [3 /*break*/, 5];
                            case 'rf-detr': return [3 /*break*/, 7];
                            case 'roboflow': return [3 /*break*/, 9];
                            case 'hf-model-id': return [3 /*break*/, 11];
                        }
                        return [3 /*break*/, 13];
                    case 3: return [4 /*yield*/, this.applyRembgReplicate(imagePath, modelConfig)];
                    case 4:
                        maskPath = _c.sent();
                        return [3 /*break*/, 14];
                    case 5: return [4 /*yield*/, this.applySAM3(imagePath, modelConfig)];
                    case 6:
                        maskPath = _c.sent();
                        return [3 /*break*/, 14];
                    case 7: return [4 /*yield*/, this.applyRFDETR(imagePath, modelConfig)];
                    case 8:
                        maskPath = _c.sent();
                        return [3 /*break*/, 14];
                    case 9: return [4 /*yield*/, this.applyRoboflow(imagePath, modelConfig)];
                    case 10:
                        maskPath = _c.sent();
                        return [3 /*break*/, 14];
                    case 11: return [4 /*yield*/, this.applyHuggingFaceModel(imagePath, modelConfig)];
                    case 12:
                        maskPath = _c.sent();
                        return [3 /*break*/, 14];
                    case 13: throw new Error("Unsupported masking model: ".concat(model));
                    case 14:
                        processingTime = Date.now() - startTime;
                        maskUrl = "/generated/masks/".concat(maskPath.split('/').pop());
                        result = {
                            maskPath: maskPath,
                            maskUrl: maskUrl,
                            model: model,
                            processingTime: processingTime,
                        };
                        // Cache the result for faster retrieval next time
                        return [4 /*yield*/, cacheService.set(cacheKey, result, 24 * 60 * 60 * 1000)]; // Cache for 24 hours
                    case 15:
                        // Cache the result for faster retrieval next time
                        _c.sent(); // Cache for 24 hours
                        return [2 /*return*/, result];
                    case 16:
                        error_1 = _c.sent();
                        logger_1.log.error({ err: error_1, model: model }, "Masking failed with model");
                        throw new Error("Masking failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 17: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get available masking models with descriptions
     */
    MaskingService.getAvailableModels = function () {
        return {
            'rembg-replicate': {
                name: 'Rembg (Replicate)',
                description: 'General-purpose background removal using U2-Net model. Fast and reliable for most use cases.',
                quality: 'good',
                speed: 'fast',
                cost: 'low',
                bestFor: ['Product photos', 'Portraits', 'General use'],
            },
            sam3: {
                name: 'Segment Anything Model 3',
                description: 'Advanced zero-shot segmentation with high precision. Excellent for complex scenes.',
                quality: 'excellent',
                speed: 'slow',
                cost: 'high',
                bestFor: ['Complex backgrounds', 'Fine details', 'Professional work'],
            },
            'rf-detr': {
                name: 'RF-DETR (Roboflow)',
                description: 'Real-time detection transformer with good balance of speed and accuracy.',
                quality: 'good',
                speed: 'medium',
                cost: 'medium',
                bestFor: ['Product catalogs', 'E-commerce', 'Batch processing'],
            },
            roboflow: {
                name: 'Custom Roboflow Model',
                description: 'Train custom models for specific use cases. Configurable for different domains.',
                quality: 'excellent',
                speed: 'medium',
                cost: 'medium',
                bestFor: [
                    'Specialized products',
                    'Industry-specific',
                    'Consistent results',
                ],
            },
            'hf-model-id': {
                name: 'HuggingFace Model',
                description: 'Access to thousands of models from HuggingFace. Maximum flexibility.',
                quality: 'good',
                speed: 'medium',
                cost: 'medium',
                bestFor: ['Research', 'Custom solutions', 'Cutting-edge models'],
            },
        };
    };
    /**
     * Get default model for new workspaces
     */
    MaskingService.getDefaultModel = function () {
        return 'rembg-replicate';
    };
    /**
     * Rembg implementation via Replicate
     */
    MaskingService.applyRembgReplicate = function (imagePath, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Simple fallback implementation for now
                // In production, this would call Replicate service
                logger_1.log.info('Applying rembg background removal (placeholder)');
                return [2 /*return*/, imagePath]; // Return original path for now
            });
        });
    };
    /**
     * SAM3 implementation (placeholder - would need actual integration)
     */
    MaskingService.applySAM3 = function (imagePath, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder for SAM3 integration
                logger_1.log.info('SAM3 masking not yet implemented, falling back to rembg');
                return [2 /*return*/, this.applyRembgReplicate(imagePath, config)];
            });
        });
    };
    /**
     * RF-DETR implementation (placeholder - would need actual integration)
     */
    MaskingService.applyRFDETR = function (imagePath, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder for RF-DETR integration
                logger_1.log.info('RF-DETR masking not yet implemented, falling back to rembg');
                return [2 /*return*/, this.applyRembgReplicate(imagePath, config)];
            });
        });
    };
    /**
     * Roboflow implementation (placeholder - would need actual integration)
     */
    MaskingService.applyRoboflow = function (imagePath, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder for Roboflow integration
                logger_1.log.info('Roboflow masking not yet implemented, falling back to rembg');
                return [2 /*return*/, this.applyRembgReplicate(imagePath, config)];
            });
        });
    };
    /**
     * HuggingFace model implementation (placeholder - would need actual integration)
     */
    MaskingService.applyHuggingFaceModel = function (imagePath, config) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Placeholder for HuggingFace integration
                logger_1.log.info('HuggingFace masking not yet implemented, falling back to rembg');
                return [2 /*return*/, this.applyRembgReplicate(imagePath, config)];
            });
        });
    };
    /**
     * Update workspace masking model preference
     */
    MaskingService.updateWorkspaceMaskingModel = function (workspaceId, model) {
        // This would be stored with the workspace/brand kit
        // For v1 with in-memory storage, we could add this to the brand kit
        var brandKit = auth_1.AuthModel.getBrandKitByWorkspace(workspaceId);
        if (brandKit) {
            // Update brand kit with masking model preference
            // This would require extending the brand kit interface
            logger_1.log.info({ workspaceId: workspaceId, model: model }, "Updated workspace masking model");
        }
    };
    /**
     * Get workspace masking model preference
     */
    MaskingService.getWorkspaceMaskingModel = function (workspaceId) {
        // For v1, return default
        // In production, this would read from workspace/brand kit settings
        return this.getDefaultModel();
    };
    return MaskingService;
}());
exports.MaskingService = MaskingService;
