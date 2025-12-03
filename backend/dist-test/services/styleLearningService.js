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
exports.StyleLearningService = void 0;
var openai_1 = __importDefault(require("openai"));
var styleMemory_1 = require("../types/styleMemory");
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var StyleLearningService = /** @class */ (function () {
    function StyleLearningService() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    /**
     * Learn and update style profile from brand data
     */
    StyleLearningService.prototype.learnStyleProfile = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var learningData, visualStyle, contentStyle, performance_1, recommendations, templateSuggestions, styleProfile, insights, performancePredictions, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 7, , 8]);
                        logger_1.log.info({ brandKitId: request.brandKitId }, 'Learning style profile for brand kit');
                        return [4 /*yield*/, this.collectLearningData(request)
                            // Extract visual patterns
                        ];
                    case 1:
                        learningData = _a.sent();
                        return [4 /*yield*/, this.extractVisualStyle(learningData)
                            // Analyze content patterns
                        ];
                    case 2:
                        visualStyle = _a.sent();
                        return [4 /*yield*/, this.analyzeContentStyle(learningData)
                            // Calculate performance insights
                        ];
                    case 3:
                        contentStyle = _a.sent();
                        return [4 /*yield*/, this.calculatePerformanceInsights(learningData)
                            // Generate recommendations
                        ];
                    case 4:
                        performance_1 = _a.sent();
                        return [4 /*yield*/, this.generateRecommendations(visualStyle, contentStyle, performance_1)
                            // Suggest templates
                        ];
                    case 5:
                        recommendations = _a.sent();
                        return [4 /*yield*/, this.suggestTemplates(visualStyle, contentStyle)
                            // Create style profile
                        ];
                    case 6:
                        templateSuggestions = _a.sent();
                        styleProfile = {
                            id: "style-profile-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)),
                            brandKitId: request.brandKitId,
                            agencyId: request.agencyId,
                            name: "Style Profile v".concat(this.getNextVersion(request.brandKitId)),
                            version: this.getNextVersion(request.brandKitId),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            visualStyle: visualStyle,
                            contentStyle: contentStyle,
                            performance: performance_1,
                            learning: {
                                sampleSize: learningData.totalSamples,
                                lastTrained: new Date(),
                                accuracyScore: this.calculateAccuracy(visualStyle, contentStyle),
                                confidence: this.calculateConfidence(learningData),
                                dataSources: Object.keys(learningData),
                                versionHistory: [
                                    {
                                        version: 1,
                                        changes: ['Initial profile creation'],
                                        performance: performance_1.averageCtr,
                                        timestamp: new Date(),
                                    },
                                ],
                            },
                        };
                        insights = {
                            visualConsistency: this.calculateVisualConsistency(visualStyle),
                            brandVoiceStrength: this.calculateBrandVoiceStrength(contentStyle),
                            competitiveDifferentiation: this.calculateCompetitiveDifferentiation(visualStyle, contentStyle),
                            recommendationConfidence: styleProfile.learning.confidence,
                        };
                        performancePredictions = {
                            expectedCtr: this.predictCTR(visualStyle, contentStyle, performance_1),
                            expectedEngagementRate: this.predictEngagementRate(visualStyle, contentStyle, performance_1),
                            expectedConversionRate: this.predictConversionRate(visualStyle, contentStyle, performance_1),
                            confidence: styleProfile.learning.confidence,
                        };
                        logger_1.log.info({ styleProfileId: styleProfile.id }, 'Style profile learned');
                        return [2 /*return*/, {
                                styleProfile: styleProfile,
                                insights: insights,
                                recommendations: recommendations,
                                templateSuggestions: templateSuggestions,
                                performancePredictions: performancePredictions,
                            }];
                    case 7:
                        error_1 = _a.sent();
                        logger_1.log.error({ err: error_1 }, 'Style learning error');
                        throw new Error('Failed to learn style profile');
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Collect learning data from various sources
     */
    StyleLearningService.prototype.collectLearningData = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var data, _i, _a, creativeId, creative, _b, _c, campaignId, campaign;
            var _d, _e, _f;
            return __generator(this, function (_g) {
                data = {
                    referenceCreatives: [],
                    campaigns: [],
                    topPerformers: [],
                    brandAssets: [],
                    totalSamples: 0,
                };
                // Collect reference creatives
                if (((_d = request.dataSources.referenceCreatives) === null || _d === void 0 ? void 0 : _d.length) > 0) {
                    for (_i = 0, _a = request.dataSources.referenceCreatives; _i < _a.length; _i++) {
                        creativeId = _a[_i];
                        creative = auth_1.AuthModel.getReferenceCreativeById(creativeId);
                        if (creative) {
                            data.referenceCreatives.push(creative);
                        }
                    }
                }
                // Collect campaign data
                if (((_e = request.dataSources.pastCampaigns) === null || _e === void 0 ? void 0 : _e.length) > 0) {
                    for (_b = 0, _c = request.dataSources.pastCampaigns; _b < _c.length; _b++) {
                        campaignId = _c[_b];
                        campaign = auth_1.AuthModel.getCampaignById(campaignId);
                        if (campaign) {
                            data.campaigns.push(campaign);
                        }
                    }
                }
                // Collect brand assets (mock for now - in production would integrate with asset management)
                if (((_f = request.dataSources.brandAssets) === null || _f === void 0 ? void 0 : _f.length) > 0) {
                    data.brandAssets = request.dataSources.brandAssets;
                }
                data.totalSamples = data.referenceCreatives.length + data.campaigns.length;
                return [2 /*return*/, data];
            });
        });
    };
    /**
     * Extract visual style patterns using AI
     */
    StyleLearningService.prototype.extractVisualStyle = function (learningData) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, completion, response;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        prompt = this.buildVisualStylePrompt(learningData);
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: 'gpt-4',
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an expert visual brand analyst specializing in digital advertising. Extract and analyze visual style patterns from brand assets and creatives.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt,
                                    },
                                ],
                                temperature: 0.3,
                                max_tokens: 2000,
                            })];
                    case 1:
                        completion = _c.sent();
                        response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!response) {
                            throw new Error('Failed to extract visual style');
                        }
                        return [2 /*return*/, this.parseVisualStyle(response, learningData)];
                }
            });
        });
    };
    /**
     * Analyze content style patterns using AI
     */
    StyleLearningService.prototype.analyzeContentStyle = function (learningData) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, completion, response;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        prompt = this.buildContentStylePrompt(learningData);
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: 'gpt-4',
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an expert content strategist specializing in brand voice and messaging analysis. Extract and analyze content style patterns from marketing materials.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt,
                                    },
                                ],
                                temperature: 0.3,
                                max_tokens: 2000,
                            })];
                    case 1:
                        completion = _c.sent();
                        response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!response) {
                            throw new Error('Failed to analyze content style');
                        }
                        return [2 /*return*/, this.parseContentStyle(response, learningData)];
                }
            });
        });
    };
    /**
     * Calculate performance insights from historical data
     */
    StyleLearningService.prototype.calculatePerformanceInsights = function (learningData) {
        return __awaiter(this, void 0, void 0, function () {
            var baseMetrics, topPerformingElements, underperformingElements;
            return __generator(this, function (_a) {
                baseMetrics = {
                    averageCtr: 0.025,
                    averageEngagementRate: 0.045,
                    averageConversionRate: 0.012,
                };
                topPerformingElements = this.analyzeTopPerformers(learningData);
                underperformingElements = this.identifyUnderperformers(learningData);
                return [2 /*return*/, __assign(__assign({}, baseMetrics), { topPerformingElements: topPerformingElements, underperformingElements: underperformingElements })];
            });
        });
    };
    /**
     * Generate improvement recommendations
     */
    StyleLearningService.prototype.generateRecommendations = function (visualStyle, contentStyle, performance) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendations;
            return __generator(this, function (_a) {
                recommendations = [];
                // Visual consistency recommendations
                if (visualStyle.colorPalette.confidence < 80) {
                    recommendations.push({
                        category: 'colors',
                        priority: 'high',
                        recommendation: 'Strengthen color palette consistency across all creatives',
                        reasoning: 'Current color usage shows variability that may dilute brand recognition',
                        expectedImpact: 15,
                    });
                }
                // Typography recommendations
                if (visualStyle.typography.personality === 'mixed') {
                    recommendations.push({
                        category: 'typography',
                        priority: 'medium',
                        recommendation: 'Establish a consistent typography hierarchy',
                        reasoning: 'Mixed font personalities can create brand confusion',
                        expectedImpact: 10,
                    });
                }
                // Content recommendations
                if (contentStyle.tone.confidence < 70) {
                    recommendations.push({
                        category: 'messaging',
                        priority: 'high',
                        recommendation: 'Develop a more consistent brand voice',
                        reasoning: 'Inconsistent tone affects brand perception and engagement',
                        expectedImpact: 20,
                    });
                }
                // Performance-based recommendations
                if (performance.averageCtr < 0.02) {
                    recommendations.push({
                        category: 'performance',
                        priority: 'high',
                        recommendation: 'Optimize headline and visual combinations for better CTR',
                        reasoning: 'Current CTR is below industry averages',
                        expectedImpact: 25,
                    });
                }
                return [2 /*return*/, recommendations];
            });
        });
    };
    /**
     * Suggest relevant templates based on learned style
     */
    StyleLearningService.prototype.suggestTemplates = function (visualStyle, contentStyle) {
        return __awaiter(this, void 0, void 0, function () {
            var templates;
            return __generator(this, function (_a) {
                templates = [
                    {
                        id: 'template-modern-minimal',
                        name: 'Modern Minimal',
                        category: 'generic',
                        description: 'Clean, minimalist template perfect for modern brands',
                        tags: ['minimal', 'clean', 'modern', 'professional'],
                        configuration: {
                            objectives: ['awareness', 'consideration'],
                            funnelStages: ['top', 'middle'],
                            platforms: ['instagram', 'facebook', 'linkedin'],
                            industries: ['saas', 'technology', 'professional-services'],
                        },
                        slots: {
                            headline: {
                                template: '{brand}: {keyMessage}',
                                maxLength: 50,
                                variations: ['{keyMessage} by {brand}', 'Discover {keyMessage}'],
                                placeholders: [
                                    {
                                        name: 'brand',
                                        type: 'brand',
                                        description: 'Brand name',
                                        required: true,
                                    },
                                    {
                                        name: 'keyMessage',
                                        type: 'text',
                                        description: 'Key value proposition',
                                        required: true,
                                    },
                                ],
                            },
                            body: {
                                template: '{painpoint}?\n\n{solution}\n\n{cta}',
                                maxLength: 300,
                                variations: [],
                                paragraphs: 3,
                                placeholders: [
                                    {
                                        name: 'painpoint',
                                        type: 'painpoint',
                                        description: 'Customer pain point',
                                        required: true,
                                    },
                                    {
                                        name: 'solution',
                                        type: 'text',
                                        description: 'Your solution',
                                        required: true,
                                    },
                                    {
                                        name: 'cta',
                                        type: 'text',
                                        description: 'Call to action',
                                        required: true,
                                    },
                                ],
                            },
                            cta: {
                                template: 'Learn More',
                                maxLength: 25,
                                variations: ['Get Started', 'Discover More'],
                                urgencyOptions: ['Limited Time', 'Today Only', 'Now'],
                            },
                        },
                        platformAdaptations: {
                            instagram: {
                                adjustments: { body: 'Keep first line engaging' },
                                characterLimits: { headline: 30, body: 125, cta: 20 },
                                bestPractices: [
                                    'Use emojis strategically',
                                    'Include relevant hashtags',
                                ],
                            },
                            facebook: {
                                adjustments: {},
                                characterLimits: { headline: 50, body: 300, cta: 25 },
                                bestPractices: [
                                    'Use link preview effectively',
                                    'Include social proof',
                                ],
                            },
                            linkedin: {
                                adjustments: { tone: 'Professional' },
                                characterLimits: { headline: 60, body: 500, cta: 30 },
                                bestPractices: ['Lead with insights', 'Use professional tone'],
                            },
                        },
                        styleGuidelines: {
                            visual: {
                                colorUsage: 'limited',
                                imageryStyle: ['professional', 'clean'],
                                layoutRequirements: ['minimal', 'white-space'],
                            },
                            tone: ['professional', 'confident'],
                            forbiddenWords: ['amazing', 'incredible'],
                            requiredElements: ['brand logo', 'clear cta'],
                        },
                        performance: {
                            usageCount: 0,
                            averagePerformance: {
                                ctr: 0.028,
                                engagementRate: 0.042,
                                conversionRate: 0.015,
                            },
                            bestPerformingVariations: {},
                            industryBenchmarks: {
                                ctr: 0.025,
                                engagementRate: 0.04,
                                conversionRate: 0.012,
                            },
                        },
                        metadata: {
                            createdBy: 'system',
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            version: 1,
                            isPublic: true,
                            rating: 4.5,
                            reviews: [],
                        },
                    },
                ];
                return [2 /*return*/, templates];
            });
        });
    };
    /**
     * Build visual style analysis prompt
     */
    StyleLearningService.prototype.buildVisualStylePrompt = function (learningData) {
        return "\nAnalyze the visual style patterns from the following brand materials:\n\nREFERENCE CREATIVES: ".concat(JSON.stringify(learningData.referenceCreatives.slice(0, 3), null, 2), "\nCAMPAIGNS: ").concat(JSON.stringify(learningData.campaigns.slice(0, 2), null, 2), "\n\nExtract and analyze:\n1. Color Palette (primary, secondary, accent colors with confidence scores)\n2. Typography patterns (headline/body fonts with usage frequency)\n3. Composition preferences (layouts, spacing, hierarchy)\n4. Imagery style (photography, illustration, filters)\n5. Visual personality (modern, classic, playful, minimal, bold)\n\nRespond with JSON structure:\n{\n  \"colorPalette\": {\n    \"primary\": [\"#color1\", \"#color2\"],\n    \"secondary\": [\"#color3\", \"#color4\"],\n    \"accent\": [\"#color5\"],\n    \"confidence\": 85\n  },\n  \"typography\": {\n    \"headlineFonts\": [{\"family\": \"Font Name\", \"weight\": 700, \"usage\": 60, \"confidence\": 90}],\n    \"bodyFonts\": [{\"family\": \"Font Name\", \"weight\": 400, \"usage\": 80, \"confidence\": 85}],\n    \"personality\": \"modern\"\n  },\n  \"composition\": {\n    \"layouts\": [{\"type\": \"centered\", \"usage\": 40, \"confidence\": 75}],\n    \"spacing\": {\"tight\": 20, \"normal\": 60, \"loose\": 20},\n    \"visualHierarchy\": \"strong\"\n  },\n  \"imagery\": {\n    \"photographyStyle\": \"professional\",\n    \"illustrationStyle\": \"minimal\",\n    \"filterPatterns\": [{\"type\": \"brightness\", \"intensity\": 1.2, \"frequency\": 30}]\n  }\n}\n");
    };
    /**
     * Build content style analysis prompt
     */
    StyleLearningService.prototype.buildContentStylePrompt = function (learningData) {
        return "\nAnalyze the content style and messaging patterns from the following materials:\n\nBRAND BRIEFS: ".concat(JSON.stringify(learningData.campaigns.map(function (c) { return c.brief; }).filter(Boolean), null, 2), "\nCAMPAIGN DATA: ").concat(JSON.stringify(learningData.campaigns.slice(0, 2), null, 2), "\n\nExtract and analyze:\n1. Brand tone and voice (primary/secondary tones with confidence)\n2. Language patterns (complexity, formality, sentiment)\n3. Messaging strategies (value propositions, CTAs, emotional appeals)\n4. Hashtag usage patterns\n5. Content effectiveness indicators\n\nRespond with JSON structure:\n{\n  \"tone\": {\n    \"primary\": [\"professional\", \"confident\"],\n    \"secondary\": [\"friendly\", \"approachable\"],\n    \"confidence\": 80\n  },\n  \"language\": {\n    \"complexity\": \"moderate\",\n    \"formality\": \"professional\",\n    \"sentiment\": \"positive\"\n  },\n  \"messaging\": {\n    \"valuePropositions\": [{\"statement\": \"Quality results\", \"frequency\": 45, \"effectiveness\": 8}],\n    \"callToActions\": [{\"text\": \"Learn More\", \"conversionRate\": 0.025, \"usage\": 60}],\n    \"emotionalAppeals\": [{\"type\": \"trust\", \"effectiveness\": 7.5, \"usage\": 35}]\n  },\n  \"hashtags\": {\n    \"brandHashtags\": [\"#brandname\"],\n    \"campaignHashtags\": [\"#campaign2024\"],\n    \"industryHashtags\": [\"#industry\"],\n    \"effectiveness\": {\"#brandname\": 0.8}\n  }\n}\n");
    };
    /**
     * Parse visual style AI response
     */
    StyleLearningService.prototype.parseVisualStyle = function (response, learningData) {
        try {
            var jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in visual style response');
            }
            var visualData = JSON.parse(jsonMatch[0]);
            return visualData;
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Error parsing visual style');
            // Return default structure
            return {
                colorPalette: {
                    primary: ['#000000'],
                    secondary: ['#666666'],
                    accent: ['#0066cc'],
                    neutrals: ['#f5f5f5'],
                    confidence: 50,
                },
                typography: {
                    headlineFonts: [
                        { family: 'Arial', weight: 700, usage: 50, confidence: 50 },
                    ],
                    bodyFonts: [
                        { family: 'Arial', weight: 400, usage: 50, confidence: 50 },
                    ],
                    personality: 'modern',
                },
                composition: {
                    layouts: [
                        {
                            type: 'centered',
                            usage: 50,
                            platforms: ['instagram'],
                            confidence: 50,
                        },
                    ],
                    spacing: { tight: 30, normal: 40, loose: 30 },
                    visualHierarchy: 'moderate',
                },
                imagery: {
                    photographyStyle: 'professional',
                    illustrationStyle: null,
                    filterPatterns: [],
                },
            };
        }
    };
    /**
     * Parse content style AI response
     */
    StyleLearningService.prototype.parseContentStyle = function (response, learningData) {
        try {
            var jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in content style response');
            }
            var contentData = JSON.parse(jsonMatch[0]);
            return contentData;
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Error parsing content style');
            // Return default structure
            return {
                tone: {
                    primary: ['professional'],
                    secondary: ['friendly'],
                    confidence: 50,
                },
                language: {
                    complexity: 'moderate',
                    formality: 'professional',
                    sentiment: 'positive',
                },
                messaging: {
                    valuePropositions: [],
                    callToActions: [],
                    emotionalAppeals: [],
                },
                hashtags: {
                    brandHashtags: [],
                    campaignHashtags: [],
                    industryHashtags: [],
                    effectiveness: {},
                },
            };
        }
    };
    // Helper methods for calculations
    StyleLearningService.prototype.getNextVersion = function (brandKitId) {
        // In production, would check existing versions
        return 1;
    };
    StyleLearningService.prototype.calculateAccuracy = function (visualStyle, contentStyle) {
        return ((visualStyle.colorPalette.confidence + contentStyle.tone.confidence) / 2);
    };
    StyleLearningService.prototype.calculateConfidence = function (learningData) {
        if (learningData.totalSamples < styleMemory_1.LEARNING_CONFIG.minSampleSize) {
            return 50;
        }
        return Math.min(95, 60 + (learningData.totalSamples / 100) * 10);
    };
    StyleLearningService.prototype.calculateVisualConsistency = function (visualStyle) {
        return visualStyle.colorPalette.confidence;
    };
    StyleLearningService.prototype.calculateBrandVoiceStrength = function (contentStyle) {
        return contentStyle.tone.confidence;
    };
    StyleLearningService.prototype.calculateCompetitiveDifferentiation = function (visualStyle, contentStyle) {
        // Would analyze against competitor data
        return 75;
    };
    StyleLearningService.prototype.predictCTR = function (visualStyle, contentStyle, performance) {
        var baseCtr = performance.averageCtr;
        var visualBoost = visualStyle.colorPalette.confidence > 80 ? 1.1 : 1.0;
        var contentBoost = contentStyle.tone.confidence > 80 ? 1.1 : 1.0;
        return baseCtr * visualBoost * contentBoost;
    };
    StyleLearningService.prototype.predictEngagementRate = function (visualStyle, contentStyle, performance) {
        return (performance.averageEngagementRate * (contentStyle.tone.confidence / 100));
    };
    StyleLearningService.prototype.predictConversionRate = function (visualStyle, contentStyle, performance) {
        var baseRate = performance.averageConversionRate;
        var ctaBoost = contentStyle.messaging.callToActions.length > 0 ? 1.15 : 1.0;
        return baseRate * ctaBoost;
    };
    StyleLearningService.prototype.analyzeTopPerformers = function (learningData) {
        // Mock analysis - would use actual performance data
        return [
            {
                type: 'color',
                element: '#0066cc',
                performance: 8.5,
                confidence: 85,
            },
        ];
    };
    StyleLearningService.prototype.identifyUnderperformers = function (learningData) {
        // Mock analysis - would use actual performance data
        return [
            {
                type: 'messaging',
                element: 'Generic CTA',
                performance: 3.2,
                recommendations: [
                    'Use more specific action language',
                    'Add urgency elements',
                ],
            },
        ];
    };
    return StyleLearningService;
}());
exports.StyleLearningService = StyleLearningService;
