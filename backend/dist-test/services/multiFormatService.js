"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiFormatService = void 0;
var openai_1 = __importDefault(require("openai"));
var logger_1 = require("../middleware/logger");
var campaignAwareService_1 = require("./campaignAwareService");
var MultiFormatService = /** @class */ (function () {
    function MultiFormatService() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.campaignAwareService = new campaignAwareService_1.CampaignAwareService();
    }
    /**
     * Generate multi-format outputs for a single source asset
     */
    MultiFormatService.prototype.generateMultiFormatOutputs = function (request, asset, brandKit, campaign, captionVariation, styleReferences) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, formatSpecs_1, formatPrompts, outputs, qualityMetrics, recommendations, processingTime, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        logger_1.log.info({
                            sourceAssetId: request.sourceAssetId,
                            workspaceId: request.workspaceId,
                            outputFormats: request.outputFormats,
                            platforms: request.platforms,
                            requestId: "multi-format-".concat(Date.now()),
                        }, "Generating multi-format outputs for ".concat(request.outputFormats.length, " formats"));
                        formatSpecs_1 = this.getFormatSpecifications(request);
                        return [4 /*yield*/, Promise.all(formatSpecs_1.map(function (spec) {
                                return _this.generateFormatPrompt(spec, request, asset, brandKit, campaign, captionVariation, styleReferences);
                            }))
                            // Mock image generation (in production, this would call actual image generation service)
                        ];
                    case 2:
                        formatPrompts = _a.sent();
                        return [4 /*yield*/, Promise.all(formatPrompts.map(function (prompt, index) {
                                return _this.mockGenerateFormatOutput(formatSpecs_1[index], prompt, request);
                            }))
                            // Calculate quality metrics
                        ];
                    case 3:
                        outputs = _a.sent();
                        qualityMetrics = this.calculateQualityMetrics(outputs, brandKit, styleReferences);
                        recommendations = this.generateRecommendations(outputs, qualityMetrics);
                        processingTime = Date.now() - startTime;
                        logger_1.log.info({
                            outputsCount: outputs.length,
                            avgQualityScore: qualityMetrics.overallScore,
                            processingTime: processingTime,
                            requestId: "multi-format-".concat(Date.now()),
                        }, "Multi-format generation completed successfully");
                        return [2 /*return*/, {
                                outputs: outputs,
                                qualityMetrics: qualityMetrics,
                                recommendations: recommendations,
                                processingTime: processingTime,
                            }];
                    case 4:
                        error_1 = _a.sent();
                        logger_1.log.error({ err: error_1, requestId: "multi-format-".concat(Date.now()) }, 'Multi-format generation error');
                        throw new Error("Failed to generate multi-format outputs: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get format specifications for all requested formats
     */
    MultiFormatService.prototype.getFormatSpecifications = function (request) {
        var _a, _b, _c, _d, _e, _f;
        var specs = [];
        if (request.outputFormats.includes('square')) {
            specs.push({
                type: 'square',
                dimensions: { width: 1080, height: 1080 },
                platform: ((_b = (_a = request.platforms) === null || _a === void 0 ? void 0 : _a.square) === null || _b === void 0 ? void 0 : _b[0]) || 'instagram',
                aspectRatio: '1:1',
                promptModifiers: [
                    'optimized for square feed posts',
                    'center-focused composition',
                    'readable on mobile feeds',
                    'brand colors visible'
                ]
            });
        }
        if (request.outputFormats.includes('story')) {
            specs.push({
                type: 'story',
                dimensions: { width: 1080, height: 1920 },
                platform: ((_d = (_c = request.platforms) === null || _c === void 0 ? void 0 : _c.story) === null || _d === void 0 ? void 0 : _d[0]) || 'instagram',
                aspectRatio: '9:16',
                promptModifiers: [
                    'vertical story format',
                    'full-screen immersive',
                    'text at top or bottom',
                    'clear call-to-action visible',
                    'designed for quick scrolling'
                ]
            });
        }
        if (request.outputFormats.includes('landscape')) {
            specs.push({
                type: 'landscape',
                dimensions: { width: 1920, height: 1080 },
                platform: ((_f = (_e = request.platforms) === null || _e === void 0 ? void 0 : _e.landscape) === null || _f === void 0 ? void 0 : _f[0]) || 'youtube',
                aspectRatio: '16:9',
                promptModifiers: [
                    'horizontal landscape format',
                    'ideal for video thumbnails',
                    'left-to-right reading flow',
                    'wide composition',
                    'professional appearance'
                ]
            });
        }
        return specs;
    };
    /**
     * Generate AI prompt for specific format
     */
    MultiFormatService.prototype.generateFormatPrompt = function (formatSpec, request, asset, brandKit, campaign, captionVariation, styleReferences) {
        return __awaiter(this, void 0, void 0, function () {
            var basePrompt, campaignContext, assetContext, formatSpecifics, styleGuidance;
            var _a;
            return __generator(this, function (_b) {
                basePrompt = '';
                // Use campaign-aware prompting if we have context
                if (campaign && brandKit) {
                    campaignContext = this.campaignAwareService.buildCampaignContext(campaign, brandKit);
                    assetContext = {
                        description: "Multi-format ".concat(formatSpec.aspectRatio, " creative for ").concat(((_a = request.platforms) === null || _a === void 0 ? void 0 : _a[formatSpec.type]) || formatSpec.platform),
                        category: 'multi-format',
                        features: [],
                        benefits: [],
                        useCases: [],
                    };
                    basePrompt = this.campaignAwareService.generateCampaignAwarePrompt(campaignContext, assetContext, formatSpec.platform, [formatSpec.platform], 'multi-format');
                }
                formatSpecifics = "\nFORMAT-SPECIFIC REQUIREMENTS:\nFormat: ".concat(formatSpec.type.toUpperCase(), " (").concat(formatSpec.aspectRatio, ")\nDimensions: ").concat(formatSpec.dimensions.width, "x").concat(formatSpec.dimensions.height, "\nPlatform: ").concat(formatSpec.platform, "\nModifiers: ").concat(formatSpec.promptModifiers.join(', '), "\n\nCOMPOSITION GUIDELINES:\n- ").concat(formatSpec.type === 'square' ? 'Center the main subject with balanced negative space' : '', "\n- ").concat(formatSpec.type === 'story' ? 'Place key elements in top and bottom thirds for safe zones' : '', "\n- ").concat(formatSpec.type === 'landscape' ? 'Use horizontal flow with clear visual hierarchy' : '', "\n\nTEXT PLACEMENT:\n- ").concat(formatSpec.type === 'square' ? 'Text overlays should be prominent but not overwhelming' : '', "\n- ").concat(formatSpec.type === 'story' ? 'Text should fit in safe zones (avoid center 30%)' : '', "\n- ").concat(formatSpec.type === 'landscape' ? 'Text can span full width for better readability' : '', "\n\nVISUAL STYLE:\n- High contrast and clear visibility\n- Brand colors incorporated naturally\n- Professional photography quality\n- Platform-appropriate aesthetics\n\nCAPTION INTEGRATION:\n").concat(captionVariation ? "Caption to integrate: \"".concat(captionVariation.text, "\"") : 'Create engaging caption overlay', "\n- ").concat(formatSpec.type === 'story' ? 'Include subtle animated text effects' : '', "\n- ").concat(formatSpec.type === 'landscape' ? 'Use clean, professional typography' : '', "\n\nGenerate a detailed image prompt for a ").concat(formatSpec.aspectRatio, " ").concat(formatSpec.platform, " creative that incorporates these elements.\n    ").trim();
                // Add style synthesis if style references are provided
                if (styleReferences && styleReferences.length > 0) {
                    styleGuidance = styleReferences.map(function (ref) {
                        return "Style: ".concat(ref.name, " - ").concat(ref.description);
                    }).join('\n');
                    basePrompt += "\n\nSTYLE SYNTHESIS:\n".concat(styleGuidance, "\nSynthesis Mode: ").concat(request.synthesisMode || 'balanced', "\nBlend the above styles while maintaining brand consistency.\n    ");
                }
                return [2 /*return*/, basePrompt];
            });
        });
    };
    /**
     * Mock format output generation (replace with actual image generation service)
     */
    MultiFormatService.prototype.mockGenerateFormatOutput = function (formatSpec, prompt, request) {
        return __awaiter(this, void 0, void 0, function () {
            var mockImageUrl, https;
            return __generator(this, function (_a) {
                mockImageUrl = "https://via.placeholder.com/".concat(formatSpec.dimensions.width, "x").concat(formatSpec.dimensions.height, "/").concat(formatSpec.type === 'square' ? '4A90E2' : formatSpec.type === 'story' ? 'E91E63' : 'FF9800', "/FFFFFF?text=").concat(encodeURIComponent("".concat(formatSpec.platform.toUpperCase(), " ").concat(formatSpec.aspectRatio.toUpperCase()))(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n\n    const mockThumbnailUrl = "], ["\n\n    const mockThumbnailUrl = "]))));
                (320 * (formatSpec.dimensions.height / formatSpec.dimensions.width));
                return [2 /*return*/];
            });
        });
    };
    return MultiFormatService;
}());
exports.MultiFormatService = MultiFormatService;
/${;
formatSpec.type === 'square' ? '4A90E2' : formatSpec.type === 'story' ? 'E91E63' : 'FF9800';
/FFFFFF?text=${encodeURIComponent(formatSpec.type)}`;
return {
    id: "multi-format-".concat(formatSpec.type, "-").concat(Date.now()),
    sourceAssetId: request.sourceAssetId,
    workspaceId: request.workspaceId,
    formats: (_a = {},
        _a[formatSpec.type] = {
            url: mockImageUrl,
            thumbnailUrl: mockThumbnailUrl,
            dimensions: formatSpec.dimensions,
            platform: formatSpec.type === 'square'
                ? (formatSpec.platform === 'instagram' ? 'instagram-feed' :
                    formatSpec.platform === 'facebook' ? 'facebook-feed' : 'linkedin')
                : formatSpec.type === 'story'
                    ? (formatSpec.platform === 'instagram' ? 'instagram-story' :
                        formatSpec.platform === 'facebook' ? 'facebook-story' : 'tiktok')
                    : (formatSpec.platform === 'youtube' ? 'youtube-thumbnail' :
                        formatSpec.platform === 'facebook' ? 'facebook-banner' : 'linkedin-banner')
        },
        _a),
    captionVariationId: request.captionVariationId,
    qualityMetrics: {
        brandConsistency: 85 + Math.random() * 10,
        visualAppeal: 80 + Math.random() * 15,
        textReadability: 90 + Math.random() * 10,
        overallScore: 0,
    },
    generatedAt: new Date(),
};
calculateQualityMetrics(outputs, auth_1.MultiFormatOutput[], brandKit ?  : auth_1.BrandKit, styleReferences ?  : auth_1.StyleReference[]);
MultiFormatGenerationResult['qualityMetrics'];
{
    var metrics = outputs.map(function (output) { return output.qualityMetrics; });
    var avgBrandConsistency = metrics.reduce(function (sum, m) { return sum + m.brandConsistency; }, 0) / metrics.length;
    var avgVisualAppeal = metrics.reduce(function (sum, m) { return sum + m.visualAppeal; }, 0) / metrics.length;
    var avgTextReadability = metrics.reduce(function (sum, m) { return sum + m.textReadability; }, 0) / metrics.length;
    var overallScore = (avgBrandConsistency + avgVisualAppeal + avgTextReadability) / 3;
    return {
        avgBrandConsistency: Math.round(avgBrandConsistency),
        avgVisualAppeal: Math.round(avgVisualAppeal),
        avgTextReadability: Math.round(avgTextReadability),
        overallScore: Math.round(overallScore),
    };
}
generateRecommendations(outputs, auth_1.MultiFormatOutput[], metrics, MultiFormatGenerationResult['qualityMetrics']);
string[];
{
    var recommendations = [];
    if (metrics.avgBrandConsistency < 80) {
        recommendations.push('Consider strengthening brand color usage for better consistency');
    }
    if (metrics.avgVisualAppeal < 85) {
        recommendations.push('Enhance visual elements for better engagement');
    }
    if (metrics.avgTextReadability < 90) {
        recommendations.push('Improve text contrast and sizing for better readability');
    }
    if (outputs.length === 1) {
        recommendations.push('Generate multiple formats to maximize reach across platforms');
    }
    if (metrics.overallScore < 85) {
        recommendations.push('Review composition and try alternative layouts');
    }
    return recommendations;
}
/**
 * Get multi-format generation statistics
 */
getMultiFormatStats(workspaceId, string);
{
    totalOutputs: number;
    outputsByFormat: {
        [key, string];
        number;
    }
    avgQualityScore: number;
    processingTime: number;
}
{
    // In production, this would query actual database
    // For now, return mock stats
    return {
        totalOutputs: 0,
        outputsByFormat: { square: 0, story: 0, landscape: 0 },
        avgQualityScore: 0,
        processingTime: 0,
    };
}
var templateObject_1;
