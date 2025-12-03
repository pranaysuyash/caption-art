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
exports.ConsistencyScoringService = void 0;
var openai_1 = __importDefault(require("openai"));
var styleMemory_1 = require("../types/styleMemory");
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var ConsistencyScoringService = /** @class */ (function () {
    function ConsistencyScoringService() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    /**
     * Analyze creative consistency with brand style profile
     */
    ConsistencyScoringService.prototype.scoreConsistency = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var creative, styleProfile, brandKit, analysis, recommendations, overallScore, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        logger_1.log.info({ creativeId: request.creativeId }, "Scoring consistency for creative");
                        return [4 /*yield*/, this.getCreative(request.creativeId)];
                    case 1:
                        creative = _a.sent();
                        if (!creative) {
                            throw new Error('Creative not found');
                        }
                        return [4 /*yield*/, this.getStyleProfile(request.styleProfileId)];
                    case 2:
                        styleProfile = _a.sent();
                        if (!styleProfile) {
                            throw new Error('Style profile not found');
                        }
                        brandKit = auth_1.AuthModel.getBrandKitById(creative.brandKitId);
                        if (!brandKit) {
                            throw new Error('Brand kit not found');
                        }
                        return [4 /*yield*/, this.performAnalysis(creative, styleProfile, brandKit, request)
                            // Generate recommendations
                        ];
                    case 3:
                        analysis = _a.sent();
                        return [4 /*yield*/, this.generateRecommendations(analysis, styleProfile)
                            // Calculate overall score
                        ];
                    case 4:
                        recommendations = _a.sent();
                        overallScore = this.calculateOverallScore(analysis);
                        logger_1.log.info({ overallScore: overallScore, creativeId: request.creativeId }, "Consistency score calculated");
                        return [2 /*return*/, {
                                overallScore: overallScore,
                                breakdown: analysis,
                                recommendations: recommendations,
                                confidence: this.calculateConfidence(analysis, styleProfile),
                                analyzedAt: new Date(),
                            }];
                    case 5:
                        error_1 = _a.sent();
                        logger_1.log.error({ err: error_1 }, 'Consistency scoring error');
                        throw new Error('Failed to score consistency');
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Perform detailed consistency analysis
     */
    ConsistencyScoringService.prototype.performAnalysis = function (creative, styleProfile, brandKit, request) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = request.analysisDepth;
                        switch (_a) {
                            case 'comprehensive': return [3 /*break*/, 1];
                            case 'standard': return [3 /*break*/, 3];
                            case 'quick': return [3 /*break*/, 5];
                        }
                        return [3 /*break*/, 5];
                    case 1: return [4 /*yield*/, this.performComprehensiveAnalysis(creative, styleProfile, brandKit)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.performStandardAnalysis(creative, styleProfile, brandKit)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [4 /*yield*/, this.performQuickAnalysis(creative, styleProfile, brandKit)];
                    case 6: return [2 /*return*/, _b.sent()];
                }
            });
        });
    };
    /**
     * Perform quick analysis (basic checks)
     */
    ConsistencyScoringService.prototype.performQuickAnalysis = function (creative, styleProfile, brandKit) {
        return __awaiter(this, void 0, void 0, function () {
            var visualScore, contentScore, platformScore;
            return __generator(this, function (_a) {
                visualScore = this.quickVisualCheck(creative, styleProfile, brandKit);
                contentScore = this.quickContentCheck(creative, styleProfile);
                platformScore = this.quickPlatformCheck(creative);
                return [2 /*return*/, {
                        visualConsistency: {
                            score: visualScore,
                            colorAlignment: this.checkColorAlignment(creative, styleProfile, brandKit),
                            fontAlignment: 75, // Basic check
                            layoutAlignment: 80, // Basic check
                            imageryAlignment: 70, // Basic check
                        },
                        contentConsistency: {
                            score: contentScore,
                            toneAlignment: this.checkToneAlignment(creative, styleProfile),
                            messagingAlignment: 75, // Basic check
                            brandVoiceAlignment: contentScore,
                            ctaAlignment: 80, // Basic check
                        },
                        platformAlignment: {
                            score: platformScore,
                            characterLimitCompliance: this.checkCharacterLimits(creative),
                            bestPracticeAdherence: 75, // Basic check
                            audienceFit: 80, // Basic check
                        },
                    }];
            });
        });
    };
    /**
     * Perform standard analysis (medium depth)
     */
    ConsistencyScoringService.prototype.performStandardAnalysis = function (creative, styleProfile, brandKit) {
        return __awaiter(this, void 0, void 0, function () {
            var visualScore, contentScore, platformScore;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.analyzeVisualConsistency(creative, styleProfile, brandKit)];
                    case 1:
                        visualScore = _a.sent();
                        return [4 /*yield*/, this.analyzeContentConsistency(creative, styleProfile)];
                    case 2:
                        contentScore = _a.sent();
                        return [4 /*yield*/, this.analyzePlatformConsistency(creative, styleProfile)];
                    case 3:
                        platformScore = _a.sent();
                        return [2 /*return*/, {
                                visualConsistency: visualScore,
                                contentConsistency: contentScore,
                                platformAlignment: platformScore,
                            }];
                }
            });
        });
    };
    /**
     * Perform comprehensive analysis (deep AI analysis)
     */
    ConsistencyScoringService.prototype.performComprehensiveAnalysis = function (creative, styleProfile, brandKit) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, completion, response;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        prompt = this.buildComprehensiveAnalysisPrompt(creative, styleProfile, brandKit);
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: 'gpt-4',
                                messages: [
                                    {
                                        role: 'system',
                                        content: "You are an expert brand analyst specializing in creative consistency evaluation. Analyze how well an ad creative aligns with a brand's established style profile.",
                                    },
                                    {
                                        role: 'user',
                                        content: prompt,
                                    },
                                ],
                                temperature: 0.2,
                                max_tokens: 2000,
                            })];
                    case 1:
                        completion = _c.sent();
                        response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!response) {
                            throw new Error('Failed to analyze consistency');
                        }
                        return [2 /*return*/, this.parseComprehensiveAnalysis(response, creative, styleProfile)];
                }
            });
        });
    };
    /**
     * Analyze visual consistency using AI
     */
    ConsistencyScoringService.prototype.analyzeVisualConsistency = function (creative, styleProfile, brandKit) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, completion, response, scoreMatch;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        prompt = this.buildVisualAnalysisPrompt(creative, styleProfile, brandKit);
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: 'gpt-4',
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'Analyze visual brand consistency focusing on colors, typography, and layout.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt,
                                    },
                                ],
                                temperature: 0.3,
                                max_tokens: 1000,
                            })];
                    case 1:
                        completion = _c.sent();
                        response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        scoreMatch = response === null || response === void 0 ? void 0 : response.match(/(\d+)/);
                        return [2 /*return*/, {
                                score: scoreMatch ? parseInt(scoreMatch[1]) : 75,
                                colorAlignment: this.checkColorAlignment(creative, styleProfile, brandKit),
                                fontAlignment: 80,
                                layoutAlignment: 75,
                                imageryAlignment: 70,
                            }];
                }
            });
        });
    };
    /**
     * Analyze content consistency using AI
     */
    ConsistencyScoringService.prototype.analyzeContentConsistency = function (creative, styleProfile) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, completion, response, scoreMatch;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        prompt = this.buildContentAnalysisPrompt(creative, styleProfile);
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: 'gpt-4',
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'Analyze content consistency focusing on tone, messaging, and brand voice.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt,
                                    },
                                ],
                                temperature: 0.3,
                                max_tokens: 1000,
                            })];
                    case 1:
                        completion = _c.sent();
                        response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        scoreMatch = response === null || response === void 0 ? void 0 : response.match(/(\d+)/);
                        return [2 /*return*/, {
                                score: scoreMatch ? parseInt(scoreMatch[1]) : 75,
                                toneAlignment: this.checkToneAlignment(creative, styleProfile),
                                messagingAlignment: 80,
                                brandVoiceAlignment: 75,
                                ctaAlignment: 85,
                            }];
                }
            });
        });
    };
    /**
     * Analyze platform alignment using AI
     */
    ConsistencyScoringService.prototype.analyzePlatformConsistency = function (creative, styleProfile) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, completion, response, scoreMatch;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        prompt = this.buildPlatformAnalysisPrompt(creative, styleProfile);
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: 'gpt-4',
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'Analyze platform-specific optimization and best practice adherence.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt,
                                    },
                                ],
                                temperature: 0.3,
                                max_tokens: 1000,
                            })];
                    case 1:
                        completion = _c.sent();
                        response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        scoreMatch = response === null || response === void 0 ? void 0 : response.match(/(\d+)/);
                        return [2 /*return*/, {
                                score: scoreMatch ? parseInt(scoreMatch[1]) : 75,
                                characterLimitCompliance: this.checkCharacterLimits(creative),
                                bestPracticeAdherence: 80,
                                audienceFit: 70,
                            }];
                }
            });
        });
    };
    /**
     * Generate improvement recommendations
     */
    ConsistencyScoringService.prototype.generateRecommendations = function (analysis, styleProfile) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendations;
            return __generator(this, function (_a) {
                recommendations = [];
                // Visual recommendations
                if (analysis.visualConsistency.score <
                    styleMemory_1.LEARNING_CONFIG.consistencyScoring.thresholds.good) {
                    if (analysis.visualConsistency.colorAlignment < 80) {
                        recommendations.push({
                            category: 'visual',
                            severity: 'warning',
                            issue: 'Color alignment could be improved',
                            recommendation: "Use brand primary colors: ".concat(styleProfile.visualStyle.colorPalette.primary.slice(0, 3).join(', ')),
                            impact: 15,
                        });
                    }
                    if (analysis.visualConsistency.fontAlignment < 80) {
                        recommendations.push({
                            category: 'visual',
                            severity: 'suggestion',
                            issue: 'Font consistency check needed',
                            recommendation: 'Use consistent brand typography across all elements',
                            impact: 10,
                        });
                    }
                }
                // Content recommendations
                if (analysis.contentConsistency.score <
                    styleMemory_1.LEARNING_CONFIG.consistencyScoring.thresholds.good) {
                    if (analysis.contentConsistency.toneAlignment < 80) {
                        recommendations.push({
                            category: 'content',
                            severity: 'warning',
                            issue: 'Tone could better match brand voice',
                            recommendation: "Maintain ".concat(styleProfile.contentStyle.tone.primary.join(', '), " tone throughout"),
                            impact: 20,
                        });
                    }
                    if (analysis.contentConsistency.ctaAlignment < 70) {
                        recommendations.push({
                            category: 'content',
                            severity: 'critical',
                            issue: 'Call-to-action needs improvement',
                            recommendation: 'Use stronger, more specific action language',
                            impact: 25,
                        });
                    }
                }
                // Platform recommendations
                if (analysis.platformAlignment.score <
                    styleMemory_1.LEARNING_CONFIG.consistencyScoring.thresholds.fair) {
                    if (analysis.platformAlignment.characterLimitCompliance < 90) {
                        recommendations.push({
                            category: 'platform',
                            severity: 'critical',
                            issue: 'Character limits exceeded',
                            recommendation: 'Shorten content to meet platform requirements',
                            impact: 30,
                        });
                    }
                }
                return [2 /*return*/, recommendations];
            });
        });
    };
    /**
     * Quick visual check
     */
    ConsistencyScoringService.prototype.quickVisualCheck = function (creative, styleProfile, brandKit) {
        var score = 80; // Base score
        // Check brand colors
        var brandColors = brandKit.colors;
        if ((brandColors === null || brandColors === void 0 ? void 0 : brandColors.primary) && brandColors.primary.length > 0) {
            score += 10; // Has brand colors defined
        }
        // Check for visual consistency in slots
        var hasConsistentVisuals = creative.slots.some(function (slot) { var _a, _b; return ((_b = (_a = slot.metadata) === null || _a === void 0 ? void 0 : _a.emotionalImpact) === null || _b === void 0 ? void 0 : _b.length) > 0; });
        if (hasConsistentVisuals) {
            score += 10;
        }
        return Math.min(100, score);
    };
    /**
     * Quick content check
     */
    ConsistencyScoringService.prototype.quickContentCheck = function (creative, styleProfile) {
        var score = 75; // Base score
        // Check CTA presence and quality
        var ctaSlot = creative.slots.find(function (slot) { return slot.type === 'cta'; });
        if (ctaSlot && ctaSlot.content) {
            score += 10;
            if (ctaSlot.content.match(/\b(shop|buy|get|start|try|learn|discover|sign|register)\b/i)) {
                score += 10;
            }
        }
        // Check content length consistency
        var bodySlot = creative.slots.find(function (slot) { return slot.type === 'body'; });
        if (bodySlot && bodySlot.content.length > 20) {
            score += 5;
        }
        return Math.min(100, score);
    };
    /**
     * Quick platform check
     */
    ConsistencyScoringService.prototype.quickPlatformCheck = function (creative) {
        var score = 80; // Base score
        // Check character limits for primary platform
        var platformCompliance = this.checkCharacterLimits(creative);
        if (platformCompliance === 100) {
            score += 15;
        }
        else if (platformCompliance > 80) {
            score += 5;
        }
        // Check for platform-specific adaptations
        var hasAdaptations = creative.slots.some(function (slot) {
            return slot.platformSpecific && Object.keys(slot.platformSpecific).length > 0;
        });
        if (hasAdaptations) {
            score += 5;
        }
        return Math.min(100, score);
    };
    /**
     * Check color alignment
     */
    ConsistencyScoringService.prototype.checkColorAlignment = function (creative, styleProfile, brandKit) {
        if (!styleProfile.visualStyle.colorPalette.confidence) {
            return 50; // No style data available
        }
        // In production, would analyze actual creative colors
        // For now, using style profile confidence
        return styleProfile.visualStyle.colorPalette.confidence;
    };
    /**
     * Check tone alignment
     */
    ConsistencyScoringService.prototype.checkToneAlignment = function (creative, styleProfile) {
        if (!styleProfile.contentStyle.tone.confidence) {
            return 50; // No style data available
        }
        // Analyze creative content tone
        var headlineSlot = creative.slots.find(function (slot) { return slot.type === 'headline'; });
        var bodySlot = creative.slots.find(function (slot) { return slot.type === 'body'; });
        var alignmentScore = styleProfile.contentStyle.tone.confidence;
        // Bonus for tone keywords in content
        var allText = [headlineSlot === null || headlineSlot === void 0 ? void 0 : headlineSlot.content, bodySlot === null || bodySlot === void 0 ? void 0 : bodySlot.content]
            .filter(Boolean)
            .join(' ');
        var toneKeywords = styleProfile.contentStyle.tone.primary.concat(styleProfile.contentStyle.tone.secondary || []);
        var foundToneWords = toneKeywords.filter(function (tone) {
            return allText.toLowerCase().includes(tone.toLowerCase());
        }).length;
        if (foundToneWords > 0) {
            alignmentScore = Math.min(100, alignmentScore + foundToneWords * 5);
        }
        return alignmentScore;
    };
    /**
     * Check character limits compliance
     */
    ConsistencyScoringService.prototype.checkCharacterLimits = function (creative) {
        var _this = this;
        if (!creative.primaryPlatform || creative.primaryPlatform === 'multi') {
            return 70; // Can't check specific platform limits
        }
        var complianceScore = 100;
        var platform = creative.primaryPlatform;
        creative.slots.forEach(function (slot) {
            var slotConfig = _this.getSlotCharacterLimit(slot.type, platform);
            if (slotConfig && slot.content.length > slotConfig) {
                complianceScore -= 20;
            }
        });
        return Math.max(0, complianceScore);
    };
    /**
     * Get character limit for slot type on platform
     */
    ConsistencyScoringService.prototype.getSlotCharacterLimit = function (slotType, platform) {
        var _a;
        var limits = {
            instagram: {
                headline: 30,
                subheadline: 20,
                body: 125,
                cta: 20,
                primaryText: 2200,
            },
            facebook: {
                headline: 50,
                subheadline: 30,
                body: 300,
                cta: 25,
                primaryText: 50000,
            },
            linkedin: {
                headline: 60,
                subheadline: 40,
                body: 500,
                cta: 30,
                primaryText: 1300,
            },
        };
        return (((_a = limits[platform]) === null || _a === void 0 ? void 0 : _a[slotType]) || null);
    };
    /**
     * Calculate overall consistency score
     */
    ConsistencyScoringService.prototype.calculateOverallScore = function (analysis) {
        var weights = styleMemory_1.LEARNING_CONFIG.consistencyScoring.weights;
        var visualScore = analysis.visualConsistency.score;
        var contentScore = analysis.contentConsistency.score;
        var platformScore = analysis.platformAlignment.score;
        return Math.round(visualScore * weights.visual +
            contentScore * weights.content +
            platformScore * weights.platform);
    };
    /**
     * Calculate confidence in the analysis
     */
    ConsistencyScoringService.prototype.calculateConfidence = function (analysis, styleProfile) {
        var confidence = 75; // Base confidence
        // Higher confidence if style profile is well-established
        if (styleProfile.learning.confidence > 80) {
            confidence += 10;
        }
        // Higher confidence if analysis is consistent across dimensions
        var scores = [
            analysis.visualConsistency.score,
            analysis.contentConsistency.score,
            analysis.platformAlignment.score,
        ];
        var scoreVariance = Math.max.apply(Math, scores) - Math.min.apply(Math, scores);
        if (scoreVariance < 20) {
            confidence += 10;
        }
        return Math.min(95, confidence);
    };
    /**
     * Build comprehensive analysis prompt
     */
    ConsistencyScoringService.prototype.buildComprehensiveAnalysisPrompt = function (creative, styleProfile, brandKit) {
        return "\nAnalyze the brand consistency of this ad creative:\n\nCREATIVE DATA:\n".concat(JSON.stringify(creative.slots, null, 2), "\n\nBRAND STYLE PROFILE:\n").concat(JSON.stringify(styleProfile, null, 2), "\n\nBRAND KIT:\n").concat(JSON.stringify(brandKit, null, 2), "\n\nAnalyze and rate (0-100):\n1. Visual Consistency (colors, typography, layout, imagery)\n2. Content Consistency (tone, messaging, brand voice, CTA)\n3. Platform Alignment (character limits, best practices, audience fit)\n\nRespond with JSON structure:\n{\n  \"visualConsistency\": {\n    \"score\": 85,\n    \"colorAlignment\": 90,\n    \"fontAlignment\": 80,\n    \"layoutAlignment\": 85,\n    \"imageryAlignment\": 75\n  },\n  \"contentConsistency\": {\n    \"score\": 80,\n    \"toneAlignment\": 85,\n    \"messagingAlignment\": 75,\n    \"brandVoiceAlignment\": 80,\n    \"ctaAlignment\": 80\n  },\n  \"platformAlignment\": {\n    \"score\": 90,\n    \"characterLimitCompliance\": 100,\n    \"bestPracticeAdherence\": 85,\n    \"audienceFit\": 85\n  }\n}\n");
    };
    /**
     * Build visual analysis prompt
     */
    ConsistencyScoringService.prototype.buildVisualAnalysisPrompt = function (creative, styleProfile, brandKit) {
        return "\nAnalyze visual brand consistency:\nCreative: ".concat(JSON.stringify(creative.slots.filter(function (s) {
            return ['headline', 'subheadline'].includes(s.type);
        }), null, 2), "\nStyle Profile: ").concat(JSON.stringify(styleProfile.visualStyle, null, 2), "\n\nRate visual consistency (0-100) and provide brief analysis.\n");
    };
    /**
     * Build content analysis prompt
     */
    ConsistencyScoringService.prototype.buildContentAnalysisPrompt = function (creative, styleProfile) {
        return "\nAnalyze content brand consistency:\nCreative: ".concat(JSON.stringify(creative.slots, null, 2), "\nStyle Profile: ").concat(JSON.stringify(styleProfile.contentStyle, null, 2), "\n\nRate content consistency (0-100) and provide brief analysis.\n");
    };
    /**
     * Build platform analysis prompt
     */
    ConsistencyScoringService.prototype.buildPlatformAnalysisPrompt = function (creative, styleProfile) {
        return "\nAnalyze platform optimization:\nCreative: ".concat(JSON.stringify(creative, null, 2), "\nPlatform: ").concat(creative.primaryPlatform, "\n\nRate platform alignment (0-100) and provide brief analysis.\n");
    };
    /**
     * Parse comprehensive analysis response
     */
    ConsistencyScoringService.prototype.parseComprehensiveAnalysis = function (response, creative, styleProfile) {
        try {
            var jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in analysis response');
            }
            return JSON.parse(jsonMatch[0]);
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Error parsing comprehensive analysis');
            // Return standard analysis as fallback
            return this.performStandardAnalysis(creative, styleProfile, {});
        }
    };
    // Helper methods (mock implementations)
    ConsistencyScoringService.prototype.getCreative = function (creativeId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In production, would fetch from database
                return [2 /*return*/, null];
            });
        });
    };
    ConsistencyScoringService.prototype.getStyleProfile = function (profileId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In production, would fetch from database
                return [2 /*return*/, null];
            });
        });
    };
    return ConsistencyScoringService;
}());
exports.ConsistencyScoringService = ConsistencyScoringService;
