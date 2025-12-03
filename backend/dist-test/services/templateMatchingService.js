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
exports.TemplateMatchingService = void 0;
var openai_1 = __importDefault(require("openai"));
var styleMemory_1 = require("../types/styleMemory");
var logger_1 = require("../middleware/logger");
var TemplateMatchingService = /** @class */ (function () {
    function TemplateMatchingService() {
        this.templateDatabase = new Map();
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.initializeTemplateDatabase();
    }
    /**
     * Initialize template database with built-in templates
     */
    TemplateMatchingService.prototype.initializeTemplateDatabase = function () {
        return __awaiter(this, void 0, void 0, function () {
            var builtinTemplates;
            var _this = this;
            return __generator(this, function (_a) {
                builtinTemplates = this.getBuiltinTemplates();
                builtinTemplates.forEach(function (template) {
                    _this.templateDatabase.set(template.id, template);
                });
                return [2 /*return*/];
            });
        });
    };
    /**
     * Find best matching templates for a campaign
     */
    TemplateMatchingService.prototype.findMatchingTemplates = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var styleProfile, eligibleTemplates, scoredTemplates, matches, alternativeSuggestions, styleAlignment, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        logger_1.log.info({ styleProfileId: request.styleProfileId }, "Finding templates for style profile");
                        return [4 /*yield*/, this.getStyleProfile(request.styleProfileId)];
                    case 1:
                        styleProfile = _a.sent();
                        if (!styleProfile) {
                            throw new Error('Style profile not found');
                        }
                        eligibleTemplates = this.getEligibleTemplates(request);
                        return [4 /*yield*/, this.scoreTemplates(eligibleTemplates, styleProfile, request)
                            // Sort by compatibility score
                        ];
                    case 2:
                        scoredTemplates = _a.sent();
                        matches = scoredTemplates
                            .filter(function (scored) {
                            return scored.compatibilityScore >=
                                styleMemory_1.LEARNING_CONFIG.templateMatching.minCompatibilityScore;
                        })
                            .slice(0, styleMemory_1.LEARNING_CONFIG.templateMatching.maxResults);
                        return [4 /*yield*/, this.generateAlternatives(matches, styleProfile, request)
                            // Calculate style alignment metrics
                        ];
                    case 3:
                        alternativeSuggestions = _a.sent();
                        styleAlignment = this.calculateStyleAlignment(matches[0], styleProfile, request);
                        logger_1.log.info({ count: matches.length, styleProfileId: request.styleProfileId }, "Found matching templates");
                        return [2 /*return*/, {
                                matches: matches,
                                alternativeSuggestions: alternativeSuggestions,
                                styleAlignment: styleAlignment,
                            }];
                    case 4:
                        error_1 = _a.sent();
                        logger_1.log.error({ err: error_1 }, 'Template matching error');
                        throw new Error('Failed to match templates');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Score templates against style profile and campaign requirements
     */
    TemplateMatchingService.prototype.scoreTemplates = function (templates, styleProfile, request) {
        return __awaiter(this, void 0, void 0, function () {
            var scoredTemplates, _i, templates_1, template, score, adaptations, reasoning;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        scoredTemplates = [];
                        _i = 0, templates_1 = templates;
                        _a.label = 1;
                    case 1:
                        if (!(_i < templates_1.length)) return [3 /*break*/, 6];
                        template = templates_1[_i];
                        return [4 /*yield*/, this.calculateCompatibilityScore(template, styleProfile, request)];
                    case 2:
                        score = _a.sent();
                        return [4 /*yield*/, this.generateAdaptations(template, styleProfile, request)];
                    case 3:
                        adaptations = _a.sent();
                        return [4 /*yield*/, this.generateReasoning(template, styleProfile, request, score)];
                    case 4:
                        reasoning = _a.sent();
                        scoredTemplates.push({
                            template: template,
                            compatibilityScore: score,
                            expectedPerformance: this.predictPerformance(template, styleProfile, request),
                            adaptations: adaptations,
                            reasoning: reasoning,
                        });
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/, scoredTemplates.sort(function (a, b) { return b.compatibilityScore - a.compatibilityScore; })];
                }
            });
        });
    };
    /**
     * Calculate compatibility score between template and style profile
     */
    TemplateMatchingService.prototype.calculateCompatibilityScore = function (template, styleProfile, request) {
        return __awaiter(this, void 0, void 0, function () {
            var score, objectiveMatch, funnelMatch, platformMatch, styleScore, industryMatch;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        score = 0;
                        objectiveMatch = template.configuration.objectives.includes(request.campaignBrief.objective);
                        score += objectiveMatch ? 25 : 0;
                        funnelMatch = template.configuration.funnelStages.includes(request.campaignBrief.funnelStage);
                        score += funnelMatch ? 20 : 0;
                        platformMatch = template.configuration.platforms.includes(request.platform);
                        score += platformMatch ? 15 : 0;
                        return [4 /*yield*/, this.calculateStyleAlignmentScore(template, styleProfile)];
                    case 1:
                        styleScore = _a.sent();
                        score += styleScore * 0.25;
                        industryMatch = template.configuration.industries.includes(request.campaignBrief.industry) || template.configuration.industries.includes('generic');
                        score += industryMatch ? 15 : 0;
                        return [2 /*return*/, Math.min(100, score)];
                }
            });
        });
    };
    /**
     * Calculate style alignment score using AI
     */
    TemplateMatchingService.prototype.calculateStyleAlignmentScore = function (template, styleProfile) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, completion, response, scoreMatch;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        prompt = this.buildStyleAlignmentPrompt(template, styleProfile);
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: 'gpt-4',
                                messages: [
                                    {
                                        role: 'system',
                                        content: "You are an expert in brand consistency and template matching. Rate how well a template matches a brand's established style profile.",
                                    },
                                    {
                                        role: 'user',
                                        content: prompt,
                                    },
                                ],
                                temperature: 0.2,
                                max_tokens: 500,
                            })];
                    case 1:
                        completion = _c.sent();
                        response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!response) {
                            return [2 /*return*/, 50]; // Default score
                        }
                        scoreMatch = response.match(/(\d+)/);
                        return [2 /*return*/, scoreMatch ? parseInt(scoreMatch[1]) : 50];
                }
            });
        });
    };
    /**
     * Generate template adaptations based on style profile
     */
    TemplateMatchingService.prototype.generateAdaptations = function (template, styleProfile, request) {
        return __awaiter(this, void 0, void 0, function () {
            var adaptations, primaryFont, platformAdaptations;
            return __generator(this, function (_a) {
                adaptations = [];
                // Color adaptations
                if (styleProfile.visualStyle.colorPalette.confidence > 80) {
                    adaptations.push({
                        element: 'color',
                        recommendation: "Use brand primary colors: ".concat(styleProfile.visualStyle.colorPalette.primary.join(', ')),
                        confidence: styleProfile.visualStyle.colorPalette.confidence,
                    });
                }
                // Typography adaptations
                if (styleProfile.visualStyle.typography.headlineFonts.length > 0) {
                    primaryFont = styleProfile.visualStyle.typography.headlineFonts[0];
                    adaptations.push({
                        element: 'typography',
                        recommendation: "Use ".concat(primaryFont.family, " for headlines"),
                        confidence: primaryFont.confidence,
                    });
                }
                // Tone adaptations
                if (styleProfile.contentStyle.tone.primary.length > 0) {
                    adaptations.push({
                        element: 'tone',
                        recommendation: "Maintain ".concat(styleProfile.contentStyle.tone.primary.join(', '), " tone"),
                        confidence: styleProfile.contentStyle.tone.confidence,
                    });
                }
                platformAdaptations = template.platformAdaptations[request.platform];
                if (platformAdaptations) {
                    adaptations.push({
                        element: 'platform',
                        recommendation: "Follow ".concat(request.platform, " best practices: ").concat(platformAdaptations.bestPractices.slice(0, 2).join(', ')),
                        confidence: 90,
                    });
                }
                return [2 /*return*/, adaptations];
            });
        });
    };
    /**
     * Generate reasoning for template recommendation
     */
    TemplateMatchingService.prototype.generateReasoning = function (template, styleProfile, request, score) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, "This template matches ".concat(score.toFixed(1), "% with your brand style. Key alignments: ").concat(template.configuration.objectives.join(', '), " objectives, ").concat(template.configuration.funnelStages.join(', '), " funnel stages, and compatible visual style for ").concat(request.platform, ".")];
            });
        });
    };
    /**
     * Predict template performance
     */
    TemplateMatchingService.prototype.predictPerformance = function (template, styleProfile, request) {
        var basePerformance = template.performance.averagePerformance;
        // Adjust based on style alignment
        var styleMultiplier = styleProfile.learning.confidence / 100;
        // Adjust based on historical template performance
        var templateMultiplier = template.performance.averagePerformance.ctr / 0.025; // Industry average
        return {
            ctr: basePerformance.ctr * styleMultiplier * templateMultiplier,
            engagementRate: basePerformance.engagementRate * styleMultiplier,
            conversionRate: basePerformance.conversionRate * styleMultiplier,
        };
    };
    /**
     * Calculate detailed style alignment metrics
     */
    TemplateMatchingService.prototype.calculateStyleAlignment = function (match, styleProfile, request) {
        return {
            visualAlignment: styleProfile.visualStyle.colorPalette.confidence,
            toneAlignment: styleProfile.contentStyle.tone.confidence,
            audienceAlignment: 85, // Would calculate based on target audience matching
            platformAlignment: match.template.configuration.platforms.includes(request.platform)
                ? 90
                : 50,
        };
    };
    /**
     * Generate alternative template suggestions
     */
    TemplateMatchingService.prototype.generateAlternatives = function (matches, styleProfile, request) {
        return __awaiter(this, void 0, void 0, function () {
            var alternatives, genericTemplates, _i, genericTemplates_1, template, adjacentIndustry, adjacentTemplates, _a, adjacentTemplates_1, template;
            return __generator(this, function (_b) {
                alternatives = [];
                // If top match is category-specific, suggest generic alternatives
                if (matches.length > 0 && matches[0].template.category !== 'generic') {
                    genericTemplates = Array.from(this.templateDatabase.values())
                        .filter(function (t) { return t.category === 'generic'; })
                        .slice(0, 2);
                    for (_i = 0, genericTemplates_1 = genericTemplates; _i < genericTemplates_1.length; _i++) {
                        template = genericTemplates_1[_i];
                        alternatives.push({
                            template: template,
                            reason: 'Generic template that can be customized to your brand style',
                        });
                    }
                }
                adjacentIndustry = this.getAdjacentIndustry(request.campaignBrief.industry);
                if (adjacentIndustry) {
                    adjacentTemplates = Array.from(this.templateDatabase.values())
                        .filter(function (t) { return t.configuration.industries.includes(adjacentIndustry); })
                        .slice(0, 1);
                    for (_a = 0, adjacentTemplates_1 = adjacentTemplates; _a < adjacentTemplates_1.length; _a++) {
                        template = adjacentTemplates_1[_a];
                        alternatives.push({
                            template: template,
                            reason: "Successful template from ".concat(adjacentIndustry, " industry that can be adapted"),
                        });
                    }
                }
                return [2 /*return*/, alternatives];
            });
        });
    };
    /**
     * Get eligible templates based on campaign requirements
     */
    TemplateMatchingService.prototype.getEligibleTemplates = function (request) {
        var _a, _b;
        var templates = Array.from(this.templateDatabase.values());
        // Filter by preferences
        if (((_a = request.preferences.templates) === null || _a === void 0 ? void 0 : _a.length) > 0) {
            templates = templates.filter(function (t) {
                return request.preferences.templates.includes(t.id);
            });
        }
        if (((_b = request.preferences.excludeCategories) === null || _b === void 0 ? void 0 : _b.length) > 0) {
            templates = templates.filter(function (t) { return !request.preferences.excludeCategories.includes(t.category); });
        }
        if (request.preferences.minPerformance) {
            templates = templates.filter(function (t) {
                return t.performance.averagePerformance.ctr >=
                    request.preferences.minPerformance;
            });
        }
        return templates;
    };
    /**
     * Get style profile by ID (mock implementation)
     */
    TemplateMatchingService.prototype.getStyleProfile = function (profileId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In production, would fetch from database
                // For now, returning null to indicate no profile found
                return [2 /*return*/, null];
            });
        });
    };
    /**
     * Get built-in templates
     */
    TemplateMatchingService.prototype.getBuiltinTemplates = function () {
        return [
            {
                id: 'template-ecommerce-urgent',
                name: 'Ecommerce Urgency',
                category: 'ecommerce',
                description: 'High-conversion template with urgency elements for ecommerce',
                tags: ['ecommerce', 'urgency', 'conversion', 'scarcity'],
                configuration: {
                    objectives: ['conversion'],
                    funnelStages: ['bottom'],
                    platforms: ['instagram', 'facebook'],
                    industries: ['ecommerce', 'retail'],
                },
                slots: {
                    headline: {
                        template: '⚡ {offer} - Only {time} Left!',
                        maxLength: 50,
                        variations: ['Last Chance: {offer}', '{offer} Ends {time}'],
                        placeholders: [
                            {
                                name: 'offer',
                                type: 'offer',
                                description: 'Special offer details',
                                required: true,
                            },
                            {
                                name: 'time',
                                type: 'text',
                                description: 'Time limit',
                                required: true,
                            },
                        ],
                    },
                    body: {
                        template: "🔥 {productBenefits}\n\n⏰ Limited stock available\n\n👇 Shop now before it's gone!",
                        maxLength: 300,
                        variations: [],
                        paragraphs: 3,
                        placeholders: [
                            {
                                name: 'productBenefits',
                                type: 'text',
                                description: 'Key product benefits',
                                required: true,
                            },
                        ],
                    },
                    cta: {
                        template: 'Shop Now',
                        maxLength: 20,
                        variations: ['Buy Now', 'Get Yours'],
                        urgencyOptions: [
                            'Limited Time',
                            'Today Only',
                            'Now',
                            'While Stocks Last',
                        ],
                    },
                },
                platformAdaptations: {
                    instagram: {
                        adjustments: {
                            emojis: 'Use fire, clock, and arrow emojis strategically',
                        },
                        characterLimits: { headline: 30, body: 125, cta: 20 },
                        bestPractices: [
                            'Lead with urgency',
                            'Use countdown stickers',
                            'Tag relevant accounts',
                        ],
                    },
                    facebook: {
                        adjustments: {},
                        characterLimits: { headline: 50, body: 300, cta: 25 },
                        bestPractices: [
                            'Use scarcity indicators',
                            'Include social proof',
                            'Clear urgency',
                        ],
                    },
                    linkedin: {
                        adjustments: { tone: 'Professional urgency' },
                        characterLimits: { headline: 60, body: 500, cta: 30 },
                        bestPractices: [
                            'B2B urgency approach',
                            'Professional benefits focus',
                        ],
                    },
                },
                styleGuidelines: {
                    visual: {
                        colorUsage: 'full',
                        imageryStyle: ['product-focused', 'lifestyle'],
                        layoutRequirements: ['clear cta', 'urgency indicators'],
                    },
                    tone: ['urgent', 'exciting', 'persuasive'],
                    forbiddenWords: [],
                    requiredElements: ['urgency indicator', 'clear cta', 'offer details'],
                },
                performance: {
                    usageCount: 0,
                    averagePerformance: {
                        ctr: 0.035,
                        engagementRate: 0.055,
                        conversionRate: 0.028,
                    },
                    bestPerformingVariations: {},
                    industryBenchmarks: {
                        ctr: 0.03,
                        engagementRate: 0.045,
                        conversionRate: 0.02,
                    },
                },
                metadata: {
                    createdBy: 'system',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    version: 1,
                    isPublic: true,
                    rating: 4.2,
                    reviews: [],
                },
            },
            {
                id: 'template-saas-demo',
                name: 'SaaS Demo Request',
                category: 'saas',
                description: 'Professional template optimized for SaaS demo and trial requests',
                tags: ['saas', 'demo', 'trial', 'b2b', 'professional'],
                configuration: {
                    objectives: ['consideration', 'conversion'],
                    funnelStages: ['middle', 'bottom'],
                    platforms: ['linkedin', 'facebook'],
                    industries: ['saas', 'technology', 'software'],
                },
                slots: {
                    headline: {
                        template: 'See How {brand} Solves {problem}',
                        maxLength: 60,
                        variations: [
                            'Transform Your {process} with {brand}',
                            '{solution} for {industry}',
                        ],
                        placeholders: [
                            {
                                name: 'brand',
                                type: 'brand',
                                description: 'Your brand name',
                                required: true,
                            },
                            {
                                name: 'problem',
                                type: 'painpoint',
                                description: 'Problem you solve',
                                required: true,
                            },
                            {
                                name: 'process',
                                type: 'text',
                                description: 'Business process',
                                required: true,
                            },
                            {
                                name: 'solution',
                                type: 'text',
                                description: 'Your solution',
                                required: true,
                            },
                            {
                                name: 'industry',
                                type: 'text',
                                description: 'Target industry',
                                required: true,
                            },
                        ],
                    },
                    subheadline: {
                        template: '{keyBenefit} in just {timeframe}',
                        maxLength: 40,
                        variations: [
                            '{result} Guaranteed',
                            'Trusted by {number}+ {companies}',
                        ],
                        placeholders: [
                            {
                                name: 'keyBenefit',
                                type: 'text',
                                description: 'Main benefit',
                                required: true,
                            },
                            {
                                name: 'timeframe',
                                type: 'text',
                                description: 'Time to see results',
                                required: true,
                            },
                            {
                                name: 'result',
                                type: 'text',
                                description: 'Guaranteed result',
                                required: true,
                            },
                            {
                                name: 'number',
                                type: 'text',
                                description: 'Customer count',
                                required: true,
                            },
                            {
                                name: 'companies',
                                type: 'text',
                                description: 'Customer type',
                                required: true,
                            },
                        ],
                    },
                    body: {
                        template: '{painpoint}?\n\n✅ {solution1}\n✅ {solution2}\n✅ {solution3}\n\n📅 Book your free {demoLength} demo today!',
                        maxLength: 500,
                        variations: [],
                        paragraphs: 4,
                        placeholders: [
                            {
                                name: 'painpoint',
                                type: 'painpoint',
                                description: 'Customer pain point',
                                required: true,
                            },
                            {
                                name: 'solution1',
                                type: 'text',
                                description: 'Solution point 1',
                                required: true,
                            },
                            {
                                name: 'solution2',
                                type: 'text',
                                description: 'Solution point 2',
                                required: true,
                            },
                            {
                                name: 'solution3',
                                type: 'text',
                                description: 'Solution point 3',
                                required: true,
                            },
                            {
                                name: 'demoLength',
                                type: 'text',
                                description: 'Demo duration',
                                required: true,
                            },
                        ],
                    },
                    cta: {
                        template: 'Book Free Demo',
                        maxLength: 30,
                        variations: ['Start Free Trial', 'Get Started'],
                        urgencyOptions: ['Limited Spots', 'This Week', 'Today'],
                    },
                    primaryText: {
                        template: '{extendedPitch}\n\n#SaaS #B2B #Software #{industry}',
                        maxLength: 1300,
                        hashtags: ['#SaaS', '#B2B', '#Software'],
                        mentions: [],
                    },
                },
                platformAdaptations: {
                    instagram: {
                        adjustments: { focus: 'Mobile-friendly demo booking' },
                        characterLimits: {
                            headline: 30,
                            body: 125,
                            cta: 20,
                            primaryText: 2200,
                        },
                        bestPractices: [
                            'Use checkmarks for benefits',
                            'Clear demo CTA',
                            'Professional emojis',
                        ],
                    },
                    facebook: {
                        adjustments: {},
                        characterLimits: {
                            headline: 50,
                            body: 300,
                            cta: 25,
                            primaryText: 50000,
                        },
                        bestPractices: [
                            'Use carousels for features',
                            'Include customer logos',
                            'Demo video integration',
                        ],
                    },
                    linkedin: {
                        adjustments: { tone: 'Professional B2B', addSocialProof: true },
                        characterLimits: {
                            headline: 60,
                            body: 500,
                            cta: 30,
                            primaryText: 1300,
                        },
                        bestPractices: [
                            'Tag decision makers',
                            'Include ROI stats',
                            'Professional success metrics',
                        ],
                    },
                },
                styleGuidelines: {
                    visual: {
                        colorUsage: 'limited',
                        imageryStyle: ['professional', 'technology', 'screenshots'],
                        layoutRequirements: [
                            'clear value proposition',
                            'trust indicators',
                            'demo CTA',
                        ],
                    },
                    tone: ['professional', 'confident', 'value-focused'],
                    forbiddenWords: ['cheap', 'free', 'discount'],
                    requiredElements: [
                        'social proof',
                        'clear benefits',
                        'professional branding',
                    ],
                },
                performance: {
                    usageCount: 0,
                    averagePerformance: {
                        ctr: 0.028,
                        engagementRate: 0.042,
                        conversionRate: 0.018,
                    },
                    bestPerformingVariations: {},
                    industryBenchmarks: {
                        ctr: 0.025,
                        engagementRate: 0.04,
                        conversionRate: 0.015,
                    },
                },
                metadata: {
                    createdBy: 'system',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    version: 1,
                    isPublic: true,
                    rating: 4.6,
                    reviews: [],
                },
            },
        ];
    };
    /**
     * Get adjacent industry for template suggestions
     */
    TemplateMatchingService.prototype.getAdjacentIndustry = function (industry) {
        var adjacencyMap = {
            ecommerce: ['retail', 'fashion', 'consumer-goods'],
            saas: ['technology', 'software', 'b2b'],
            healthcare: ['wellness', 'medical', 'fitness'],
            finance: ['banking', 'insurance', 'investment'],
            education: ['training', 'learning', 'development'],
        };
        for (var _i = 0, _a = Object.entries(adjacencyMap); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], values = _b[1];
            if (values.includes(industry)) {
                return key;
            }
        }
        return null;
    };
    /**
     * Build style alignment prompt for AI
     */
    TemplateMatchingService.prototype.buildStyleAlignmentPrompt = function (template, styleProfile) {
        return "\nRate how well this template matches the brand style profile on a scale of 0-100.\n\nTEMPLATE: ".concat(template.name, "\nCategory: ").concat(template.category, "\nObjectives: ").concat(template.configuration.objectives.join(', '), "\nStyle Guidelines: ").concat(template.styleGuidelines.tone.join(', '), "\n\nBRAND STYLE PROFILE:\nVisual Personality: ").concat(styleProfile.visualStyle.typography.personality, "\nPrimary Tone: ").concat(styleProfile.contentStyle.tone.primary.join(', '), "\nColor Confidence: ").concat(styleProfile.visualStyle.colorPalette.confidence, "%\n\nConsider:\n1. Tone compatibility\n2. Visual style alignment\n3. Industry appropriateness\n4. Platform suitability\n\nRespond with just the score (0-100).\n");
    };
    return TemplateMatchingService;
}());
exports.TemplateMatchingService = TemplateMatchingService;
