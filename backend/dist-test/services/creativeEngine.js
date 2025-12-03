"use strict";
/**
 * Creative Engine - Core Automated Creative Production System
 *
 * This is the competitive moat - the engine that transforms:
 * - reference creatives → style learning
 * - brand kits → visual identity
 * - campaign briefs → creative direction
 * - client assets → production input
 *
 * Into finished, platform-specific creatives in minutes.
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreativeEngine = void 0;
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var imageRenderer_1 = require("./imageRenderer");
var captionGenerator_1 = require("./captionGenerator");
var CaptionScorer_1 = require("./CaptionScorer");
var sanitizers_1 = require("../utils/sanitizers");
var CreativeEngine = /** @class */ (function () {
    function CreativeEngine() {
    }
    CreativeEngine.getInstance = function () {
        if (!CreativeEngine.instance) {
            CreativeEngine.instance = new CreativeEngine();
        }
        return CreativeEngine.instance;
    };
    /**
     * Main engine method - transforms inputs into finished creatives
     */
    CreativeEngine.prototype.generateCreatives = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, context, styleProfile, adCreatives, summary, insights, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        startTime = Date.now();
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.analyzeInputs(input)
                            // 2. Build style profile from brand kit + references
                        ];
                    case 2:
                        context = _a.sent();
                        return [4 /*yield*/, this.buildStyleProfile(context)
                            // 3. Generate creative variations
                        ];
                    case 3:
                        styleProfile = _a.sent();
                        return [4 /*yield*/, this.produceCreatives(input, context, styleProfile)
                            // 4. Analyze results and provide insights
                        ];
                    case 4:
                        adCreatives = _a.sent();
                        summary = this.generateSummary(adCreatives, input, Date.now() - startTime);
                        return [4 /*yield*/, this.generateInsights(adCreatives, styleProfile)];
                    case 5:
                        insights = _a.sent();
                        return [2 /*return*/, {
                                adCreatives: adCreatives,
                                summary: summary,
                                insights: insights,
                            }];
                    case 6:
                        error_1 = _a.sent();
                        logger_1.log.error({ err: error_1 }, 'Creative Engine generation failed');
                        throw new Error("Creative generation failed: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Analyze and validate all input data
     */
    CreativeEngine.prototype.analyzeInputs = function (input) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, sanitizeKeywords, sanitizeText, brandKit, campaign, referenceCreatives, allRefs, sourceAssets, _loop_1, _i, _b, assetUrl, styleConstraints;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../utils/sanitizers')); })];
                    case 1:
                        _a = _c.sent(), sanitizeKeywords = _a.sanitizeKeywords, sanitizeText = _a.sanitizeText;
                        if (input.styleTags)
                            input.styleTags = sanitizeKeywords(input.styleTags);
                        if (input.referenceCreatives)
                            input.referenceCreatives = input.referenceCreatives.map(function (rc) { return sanitizeText(rc, 500) || rc; });
                        brandKit = auth_1.AuthModel.getBrandKitById(input.brandKitId);
                        if (!brandKit) {
                            throw new Error('Brand kit not found');
                        }
                        if (input.campaignId) {
                            campaign = auth_1.AuthModel.getCampaignById(input.campaignId);
                            if (!campaign) {
                                throw new Error('Campaign not found');
                            }
                        }
                        referenceCreatives = [];
                        if (input.referenceCreatives && input.referenceCreatives.length > 0) {
                            allRefs = auth_1.AuthModel.getReferenceCreativesByWorkspace(input.workspaceId);
                            referenceCreatives.push.apply(referenceCreatives, allRefs.filter(function (ref) {
                                return input.referenceCreatives.includes(ref.imageUrl);
                            }));
                        }
                        sourceAssets = [];
                        _loop_1 = function (assetUrl) {
                            // For now, assume assets are already uploaded and find by URL pattern
                            // In production, you'd have proper asset management
                            var allAssets = auth_1.AuthModel.getAssetsByWorkspace(input.workspaceId);
                            var asset = allAssets.find(function (a) { return a.url === assetUrl; });
                            if (asset) {
                                sourceAssets.push(asset);
                            }
                        };
                        for (_i = 0, _b = input.sourceAssets; _i < _b.length; _i++) {
                            assetUrl = _b[_i];
                            _loop_1(assetUrl);
                        }
                        if (sourceAssets.length === 0) {
                            throw new Error('No valid source assets found');
                        }
                        styleConstraints = {
                            objectives: input.objectives || [(campaign === null || campaign === void 0 ? void 0 : campaign.objective) || 'awareness'],
                            platforms: input.platforms || (campaign === null || campaign === void 0 ? void 0 : campaign.placements) || ['ig-feed'],
                            mustInclude: (0, sanitizers_1.sanitizePhrases)(input.mustIncludePhrases || (campaign === null || campaign === void 0 ? void 0 : campaign.mustIncludePhrases)) || [],
                            mustExclude: (0, sanitizers_1.sanitizePhrases)(input.mustExcludePhrases || (campaign === null || campaign === void 0 ? void 0 : campaign.mustExcludePhrases)) || [],
                            brandPersonality: brandKit.brandPersonality,
                            targetAudience: (campaign === null || campaign === void 0 ? void 0 : campaign.targetAudience) || brandKit.targetAudience,
                            valueProposition: brandKit.valueProposition,
                            toneStyle: brandKit.toneStyle,
                            // Reference caption style
                            referenceCaptions: campaign === null || campaign === void 0 ? void 0 : campaign.referenceCaptions,
                            learnedStyleProfile: (campaign === null || campaign === void 0 ? void 0 : campaign.learnedStyleProfile)
                                ? JSON.parse(campaign.learnedStyleProfile)
                                : undefined,
                        };
                        return [2 /*return*/, {
                                brandKit: brandKit,
                                campaign: campaign,
                                referenceCreatives: referenceCreatives,
                                sourceAssets: sourceAssets,
                                styleConstraints: styleConstraints,
                            }];
                }
            });
        });
    };
    /**
     * Build comprehensive style profile from brand kit + reference creatives
     */
    CreativeEngine.prototype.buildStyleProfile = function (context) {
        return __awaiter(this, void 0, void 0, function () {
            var brandKit, referenceCreatives, colors, typography, layout, tone;
            return __generator(this, function (_a) {
                brandKit = context.brandKit, referenceCreatives = context.referenceCreatives;
                colors = this.extractColors(brandKit, referenceCreatives);
                typography = this.analyzeTypography(brandKit, referenceCreatives);
                layout = this.analyzeLayout(referenceCreatives);
                tone = this.analyzeTone(brandKit, context.styleConstraints);
                return [2 /*return*/, {
                        colors: colors,
                        typography: typography,
                        layout: layout,
                        tone: tone,
                    }];
            });
        });
    };
    /**
     * Produce the actual creative variations
     */
    CreativeEngine.prototype.produceCreatives = function (input, context, styleProfile) {
        return __awaiter(this, void 0, void 0, function () {
            var adCreatives, formats, platforms, variationsPerAsset, creativeIndex, _i, _a, sourceAsset, generationRequest, angles, i, angle, platform, format, headline, bodyText, ctaText, caption, adCopy, fullCaption, lines, renderResult, captionScore, adCreative, error_2, error_3;
            var _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        adCreatives = [];
                        formats = ['instagram-square', 'instagram-story'];
                        platforms = context.styleConstraints.platforms;
                        variationsPerAsset = input.outputCount || 3;
                        creativeIndex = 0;
                        _i = 0, _a = context.sourceAssets;
                        _f.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 16];
                        sourceAsset = _a[_i];
                        generationRequest = {
                            assetId: sourceAsset.id,
                            workspaceId: sourceAsset.workspaceId,
                            brandVoicePrompt: context.styleConstraints.toneStyle || 'Professional and engaging',
                            template: 'descriptive',
                            campaignObjective: (_b = context.styleConstraints.objectives) === null || _b === void 0 ? void 0 : _b[0],
                            funnelStage: context.styleConstraints.funnelStage || 'awareness',
                            targetAudience: context.styleConstraints.targetAudience,
                            brandPersonality: context.styleConstraints.brandPersonality,
                            valueProposition: context.styleConstraints.valueProposition,
                            mustIncludePhrases: context.styleConstraints.mustInclude,
                            mustExcludePhrases: context.styleConstraints.mustExclude,
                            platform: platforms[0],
                            referenceCaptions: context.styleConstraints.referenceCaptions,
                            learnedStyleProfile: context.styleConstraints.learnedStyleProfile,
                        };
                        _f.label = 2;
                    case 2:
                        _f.trys.push([2, 14, , 15]);
                        angles = [
                            'emotional',
                            'data-driven',
                            'question-based',
                            'cta-focused',
                            'educational',
                        ];
                        i = 0;
                        _f.label = 3;
                    case 3:
                        if (!(i < variationsPerAsset)) return [3 /*break*/, 13];
                        angle = angles[i % angles.length];
                        platform = platforms[i % platforms.length];
                        format = formats[i % formats.length];
                        headline = void 0;
                        bodyText = void 0;
                        ctaText = void 0;
                        caption = void 0;
                        if (!(input.mode === 'ad-copy')) return [3 /*break*/, 5];
                        return [4 /*yield*/, captionGenerator_1.CaptionGenerator.generateAdCopy(generationRequest, angle)];
                    case 4:
                        adCopy = _f.sent();
                        headline = adCopy.headline;
                        bodyText = adCopy.bodyText;
                        ctaText = adCopy.ctaText;
                        caption = "".concat(headline, "\n\n").concat(bodyText, "\n\n").concat(ctaText);
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, captionGenerator_1.CaptionGenerator.generateCaption(__assign(__assign({}, generationRequest), { angle: angle }))
                        // Parse caption into components
                    ];
                    case 6:
                        fullCaption = _f.sent();
                        lines = fullCaption
                            .split('.')
                            .map(function (l) { return l.trim(); })
                            .filter(function (l) { return l.length > 0; });
                        headline = lines[0] || 'Discover Something Amazing';
                        bodyText = lines.slice(1).join('. ') || fullCaption;
                        ctaText = this.selectCTA(context.styleConstraints);
                        caption = fullCaption;
                        _f.label = 7;
                    case 7:
                        _f.trys.push([7, 11, , 12]);
                        return [4 /*yield*/, imageRenderer_1.ImageRenderer.renderImage(sourceAsset.url, {
                                format: format,
                                layout: styleProfile.layout.commonPatterns[0] || 'center-focus',
                                caption: bodyText,
                                brandKit: context.brandKit,
                                watermark: false, // Agency plan
                                workspaceId: input.workspaceId,
                            })
                            // Score the caption quality
                        ];
                    case 8:
                        renderResult = _f.sent();
                        captionScore = CaptionScorer_1.CaptionScorer.scoreCaption(caption, {
                            campaignObjective: (_c = context.styleConstraints.objectives) === null || _c === void 0 ? void 0 : _c[0],
                            platform: platform,
                            mustIncludePhrases: context.styleConstraints.mustInclude,
                            mustExcludePhrases: context.styleConstraints.mustExclude,
                        });
                        adCreative = {
                            id: "ad_".concat(Date.now(), "_").concat(creativeIndex),
                            jobId: "engine_".concat(Date.now()),
                            sourceAssetId: sourceAsset.id,
                            workspaceId: input.workspaceId,
                            captionId: "caption_".concat(creativeIndex),
                            campaignId: input.campaignId,
                            placement: platform,
                            // Ad structure
                            headline: headline,
                            subheadline: (_d = context.campaign) === null || _d === void 0 ? void 0 : _d.primaryOffer,
                            bodyText: bodyText,
                            ctaText: ctaText,
                            objective: context.styleConstraints.objectives[0],
                            offerText: ((_e = context.campaign) === null || _e === void 0 ? void 0 : _e.primaryOffer) || undefined,
                            // Generated assets
                            approvalStatus: 'pending',
                            format: format,
                            layout: styleProfile.layout.commonPatterns[0] || 'center-focus',
                            caption: caption,
                            imageUrl: renderResult.imageUrl,
                            thumbnailUrl: renderResult.thumbnailUrl,
                            watermark: false,
                            qualityScore: captionScore.totalScore,
                            scoreBreakdown: captionScore.breakdown,
                            createdAt: new Date(),
                        };
                        adCreatives.push(adCreative);
                        creativeIndex++;
                        if (!(i < variationsPerAsset - 1)) return [3 /*break*/, 10];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 9:
                        _f.sent();
                        _f.label = 10;
                    case 10: return [3 /*break*/, 12];
                    case 11:
                        error_2 = _f.sent();
                        logger_1.log.error({ err: error_2, sourceAssetId: sourceAsset.id }, 'Failed to render creative');
                        return [3 /*break*/, 12];
                    case 12:
                        i++;
                        return [3 /*break*/, 3];
                    case 13: return [3 /*break*/, 15];
                    case 14:
                        error_3 = _f.sent();
                        logger_1.log.error({ err: error_3, sourceAssetId: sourceAsset.id }, "Failed to generate variations for asset");
                        return [3 /*break*/, 15];
                    case 15:
                        _i++;
                        return [3 /*break*/, 1];
                    case 16: return [2 /*return*/, adCreatives];
                }
            });
        });
    };
    /**
     * Generate ad copy based on style profile and context
     */
    CreativeEngine.prototype.generateAdCopy = function (sourceAsset, styleProfile, constraints, format) {
        return __awaiter(this, void 0, void 0, function () {
            var fullCaption, lines, headline, bodyText, ctaText, error_4;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, captionGenerator_1.CaptionGenerator.generateCaption({
                                assetId: sourceAsset.id,
                                workspaceId: sourceAsset.workspaceId,
                                brandVoicePrompt: constraints.toneStyle || 'Professional and engaging',
                                template: 'descriptive',
                                // Campaign context for quality
                                campaignObjective: (_a = constraints.objectives) === null || _a === void 0 ? void 0 : _a[0],
                                funnelStage: constraints.funnelStage || 'awareness',
                                targetAudience: constraints.targetAudience,
                                brandPersonality: constraints.brandPersonality,
                                valueProposition: constraints.valueProposition,
                                mustIncludePhrases: constraints.mustInclude,
                                mustExcludePhrases: constraints.mustExclude,
                                platform: (_b = constraints.platforms) === null || _b === void 0 ? void 0 : _b[0],
                                // Reference style injection
                                referenceCaptions: constraints.referenceCaptions,
                                learnedStyleProfile: constraints.learnedStyleProfile,
                            })
                            // Parse AI-generated caption into structured ad copy
                        ];
                    case 1:
                        fullCaption = _d.sent();
                        lines = fullCaption
                            .split('.')
                            .map(function (l) { return l.trim(); })
                            .filter(function (l) { return l.length > 0; });
                        headline = lines[0] || 'Discover Something Amazing';
                        bodyText = lines.slice(1).join('. ') || fullCaption;
                        ctaText = this.selectCTA(constraints);
                        return [2 /*return*/, {
                                headline: headline.slice(0, 60), // Limit headline length
                                subheadline: (_c = constraints.campaign) === null || _c === void 0 ? void 0 : _c.primaryOffer,
                                bodyText: bodyText.slice(0, 125), // Limit body length for ads
                                ctaText: ctaText,
                            }];
                    case 2:
                        error_4 = _d.sent();
                        logger_1.log.error({ err: error_4 }, 'AI caption generation failed, using fallback');
                        // Fallback to template-based approach
                        return [2 /*return*/, this.generateFallbackCopy(constraints)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Select appropriate CTA based on constraints
     */
    CreativeEngine.prototype.selectCTA = function (constraints) {
        var _a;
        var objective = (_a = constraints.objectives) === null || _a === void 0 ? void 0 : _a[0];
        if (constraints.mustExclude &&
            constraints.mustExclude.some(function (p) {
                return p.toLowerCase().includes('buy') || p.toLowerCase().includes('shop');
            })) {
            return 'Learn More';
        }
        var ctaMap = {
            conversion: ['Shop Now', 'Buy Now', 'Get Started', 'Sign Up'],
            traffic: ['Learn More', 'Discover More', 'Explore Now', 'Read More'],
            engagement: ['Join Us', 'Get Involved', 'Share Your Story', 'Tell Us'],
            awareness: ['Discover', 'Explore', 'Learn More', 'Find Out'],
        };
        var options = ctaMap[objective] || ctaMap['awareness'];
        return options[Math.floor(Math.random() * options.length)];
    };
    /**
     * Generate fallback copy when AI generation fails
     */
    CreativeEngine.prototype.generateFallbackCopy = function (constraints) {
        var _a;
        var headlines = [
            "".concat(constraints.brandPersonality || 'Elevate', " Your Style"),
            "Discover ".concat(constraints.valueProposition || 'Something Amazing'),
            "Transform Your ".concat(constraints.targetAudience || 'Daily', " Routine"),
            "Premium Quality, Unmatched Results",
        ];
        var bodyTexts = [
            "Experience the difference with our carefully crafted ".concat(constraints.targetAudience || 'solutions', "."),
            "Join thousands of satisfied customers who have transformed their lives.",
            "Designed for those who appreciate quality and attention to detail.",
        ];
        return {
            headline: headlines[Math.floor(Math.random() * headlines.length)],
            subheadline: ((_a = constraints.campaign) === null || _a === void 0 ? void 0 : _a.primaryOffer) || undefined,
            bodyText: bodyTexts[Math.floor(Math.random() * bodyTexts.length)],
            ctaText: this.selectCTA(constraints),
        };
    };
    /**
     * Extract colors from brand kit and reference creatives
     */
    CreativeEngine.prototype.extractColors = function (brandKit, referenceCreatives) {
        var colors = {
            primary: [brandKit.colors.primary],
            secondary: [brandKit.colors.secondary],
            accent: [brandKit.colors.tertiary],
        };
        // Add colors from reference creatives
        referenceCreatives.forEach(function (ref) {
            var _a;
            if (ref.extractedColors) {
                (_a = colors.secondary).push.apply(_a, ref.extractedColors.slice(0, 3)); // Limit to prevent too many colors
            }
        });
        // Remove duplicates and limit
        colors.primary = __spreadArray([], new Set(colors.primary), true).slice(0, 1);
        colors.secondary = __spreadArray([], new Set(colors.secondary), true).slice(0, 3);
        colors.accent = __spreadArray([], new Set(colors.accent), true).slice(0, 2);
        return colors;
    };
    /**
     * Analyze typography preferences
     */
    CreativeEngine.prototype.analyzeTypography = function (brandKit, referenceCreatives) {
        return {
            headingFonts: [brandKit.fonts.heading],
            bodyFonts: [brandKit.fonts.body],
        };
    };
    /**
     * Learn layout patterns from reference creatives
     */
    CreativeEngine.prototype.analyzeLayout = function (referenceCreatives) {
        if (referenceCreatives.length === 0) {
            return {
                commonPatterns: ['center-focus'],
                textDensity: 'moderate',
                visualHierarchy: 'balanced',
            };
        }
        // Analyze patterns from references
        var layoutCounts = {
            'center-focus': 0,
            'bottom-text': 0,
            'top-text': 0,
        };
        var totalDensity = 0;
        referenceCreatives.forEach(function (ref) {
            if (ref.detectedLayout) {
                layoutCounts[ref.detectedLayout]++;
            }
            if (ref.textDensity) {
                totalDensity +=
                    ref.textDensity === 'minimal'
                        ? 1
                        : ref.textDensity === 'moderate'
                            ? 2
                            : 3;
            }
        });
        // Find most common layout
        var mostCommonLayout = Object.entries(layoutCounts).sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        })[0][0];
        var avgDensity = totalDensity / referenceCreatives.length;
        var textDensity = avgDensity < 1.5 ? 'minimal' : avgDensity < 2.5 ? 'moderate' : 'heavy';
        return {
            commonPatterns: [mostCommonLayout],
            textDensity: textDensity,
            visualHierarchy: textDensity === 'heavy'
                ? 'bold'
                : textDensity === 'minimal'
                    ? 'subtle'
                    : 'balanced',
        };
    };
    /**
     * Analyze tone and voice
     */
    CreativeEngine.prototype.analyzeTone = function (brandKit, constraints) {
        var _a, _b;
        return {
            voice: [brandKit.voicePrompt || 'Professional'],
            messaging: ((_a = constraints.objectives) === null || _a === void 0 ? void 0 : _a.includes('conversion'))
                ? 'direct'
                : 'inspirational',
            ctaStyle: ((_b = constraints.objectives) === null || _b === void 0 ? void 0 : _b.includes('awareness'))
                ? 'gentle'
                : 'urgent',
        };
    };
    /**
     * Check if format is compatible with platform
     */
    CreativeEngine.prototype.isFormatCompatible = function (format, platform) {
        // Instagram story works best with vertical formats
        if (platform === 'ig-story' && format !== 'instagram-story') {
            return false;
        }
        // Square formats work on most platforms
        return true;
    };
    /**
     * Generate summary of the creative generation
     */
    CreativeEngine.prototype.generateSummary = function (adCreatives, input, processingTime) {
        var platformsCovered = __spreadArray([], new Set(adCreatives.map(function (ac) { return ac.placement; })), true);
        return {
            totalGenerated: adCreatives.length,
            platformsCovered: platformsCovered,
            styleConsistency: 85, // Placeholder - would analyze consistency
            brandAlignment: 90, // Placeholder - would analyze brand alignment
            processingTime: processingTime,
        };
    };
    /**
     * Generate insights about the creative set
     */
    CreativeEngine.prototype.generateInsights = function (adCreatives, styleProfile) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        dominantColors: styleProfile.colors.primary.concat(styleProfile.colors.secondary),
                        textDensity: styleProfile.layout.textDensity,
                        visualStyle: styleProfile.layout.commonPatterns,
                        suggestedImprovements: [
                            'Consider adding more visual variety in next batch',
                            'Test different CTA language for improved conversion',
                            'Review copy length for mobile readability',
                        ],
                    }];
            });
        });
    };
    return CreativeEngine;
}());
exports.CreativeEngine = CreativeEngine;
exports.default = CreativeEngine;
