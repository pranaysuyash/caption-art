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
exports.AdCreativeGenerator = void 0;
var openai_1 = __importDefault(require("openai"));
var adCreative_1 = require("../types/adCreative");
var logger_1 = require("../middleware/logger");
var AdCreativeGenerator = /** @class */ (function () {
    function AdCreativeGenerator() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    /**
     * Generate complete ad creative with slot-based structure
     */
    AdCreativeGenerator.prototype.generateAdCreative = function (request, campaign, brandKit) {
        return __awaiter(this, void 0, void 0, function () {
            var generatedSlots, platformVersions, adCreative, qualityScore, recommendations, estimatedPerformance, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        logger_1.log.info({ campaignId: request.campaignId }, "Generating ad creative for campaign");
                        return [4 /*yield*/, this.generateSlots(request, campaign, brandKit)
                            // Create platform-specific adaptations
                        ];
                    case 1:
                        generatedSlots = _a.sent();
                        return [4 /*yield*/, this.generatePlatformVersions(generatedSlots, request.platforms, brandKit)
                            // Create main ad creative
                        ];
                    case 2:
                        platformVersions = _a.sent();
                        adCreative = {
                            id: "ad-creative-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)),
                            campaignId: request.campaignId,
                            brandKitId: request.brandKitId,
                            name: "".concat(campaign.name, " - ").concat(request.objective, " - ").concat(request.funnelStage),
                            objective: request.objective,
                            funnelStage: request.funnelStage,
                            primaryPlatform: request.platforms.length === 1 ? request.platforms[0] : 'multi',
                            status: 'draft',
                            slots: generatedSlots,
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            version: 1,
                        };
                        return [4 /*yield*/, this.calculateQualityScore(adCreative, request, brandKit)
                            // Generate recommendations
                        ];
                    case 3:
                        qualityScore = _a.sent();
                        return [4 /*yield*/, this.generateRecommendations(adCreative, request)
                            // Estimate performance
                        ];
                    case 4:
                        recommendations = _a.sent();
                        return [4 /*yield*/, this.estimatePerformance(adCreative, request)];
                    case 5:
                        estimatedPerformance = _a.sent();
                        logger_1.log.info({ adCreativeId: adCreative.id }, "Ad creative generated");
                        return [2 /*return*/, {
                                adCreative: adCreative,
                                generatedSlots: generatedSlots,
                                platformVersions: platformVersions,
                                qualityScore: qualityScore,
                                recommendations: recommendations,
                                estimatedPerformance: estimatedPerformance,
                            }];
                    case 6:
                        error_1 = _a.sent();
                        logger_1.log.error({ err: error_1 }, 'Ad creative generation error');
                        throw new Error('Failed to generate ad creative');
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate individual slots based on campaign and brand requirements
     */
    AdCreativeGenerator.prototype.generateSlots = function (request, campaign, brandKit) {
        return __awaiter(this, void 0, void 0, function () {
            var strategy, prompt, completion, response;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        strategy = adCreative_1.FUNNEL_STAGE_STRATEGIES[request.funnelStage];
                        prompt = this.buildSlotGenerationPrompt(request, campaign, brandKit, strategy);
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: 'gpt-4',
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an expert copywriter specializing in digital advertising. Generate compelling, conversion-focused ad copy that follows best practices for each platform and funnel stage.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt,
                                    },
                                ],
                                temperature: 0.7,
                                max_tokens: 2000,
                            })];
                    case 1:
                        completion = _c.sent();
                        response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!response) {
                            throw new Error('Failed to generate slot content');
                        }
                        return [2 /*return*/, this.parseSlotResponse(response, request)];
                }
            });
        });
    };
    /**
     * Build comprehensive prompt for slot generation
     */
    AdCreativeGenerator.prototype.buildSlotGenerationPrompt = function (request, campaign, brandKit, strategy) {
        var _a, _b;
        var brief = campaign.brief;
        var brandPersonality = brandKit.brandPersonality || 'Professional and trustworthy';
        var colors = brandKit.colors || {};
        return "\nGenerate ".concat(request.variations, " variations of ad creative content for the following campaign:\n\nCAMPAIGN DETAILS:\n- Campaign Name: ").concat(campaign.name, "\n- Objective: ").concat(request.objective, "\n- Funnel Stage: ").concat(request.funnelStage, " (").concat(strategy.focus, ")\n- Primary Platform: ").concat(request.platforms.join(', '), "\n- Key Message: ").concat(request.keyMessage, "\n- Target CTA: ").concat(request.cta, "\n\nTARGET AUDIENCE:\n- Demographics: ").concat(request.targetAudience.demographics, "\n- Psychographics: ").concat(request.targetAudience.psychographics, "\n- Pain Points: ").concat(((_a = request.targetAudience.painPoints) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'Not specified', "\n\nBRAND IDENTITY:\n- Brand Personality: ").concat(brandPersonality, "\n- Brand Colors: ").concat(colors.primary || 'Not specified', ", ").concat(colors.secondary || 'Not specified', "\n- Target Audience: ").concat(brandKit.targetAudience || 'Not specified', "\n- Value Proposition: ").concat(brandKit.valueProposition || 'Not specified', "\n\nCAMPAIGN BRIEF:\n").concat(brief
            ? "\n- Primary KPI: ".concat(brief.primaryKPI || 'Not specified', "\n- Key Message: ").concat(brief.keyMessage || 'Not specified', "\n- Emotional Appeal: ").concat(brief.emotionalAppeal || 'Not specified', "\n- Primary Audience: ").concat(((_b = brief.primaryAudience) === null || _b === void 0 ? void 0 : _b.demographics) || 'Not specified', "\n")
            : 'No detailed brief provided', "\n\nFUNNEL STAGE STRATEGY:\nFocus: ").concat(strategy.focus, "\nKey Elements: ").concat(strategy.keyElements.join(', '), "\nRecommended Tone: ").concat(strategy.tone.join(', '), "\nCTA Types: ").concat(strategy.ctaTypes.join(', '), "\n\nREQUIRED OUTPUT:\nGenerate content in this JSON format:\n{\n  \"headline\": {\n    \"content\": \"Main headline\",\n    \"variations\": [\"Variation 1\", \"Variation 2\", \"Variation 3\"],\n    \"metadata\": {\n      \"tone\": [\"confident\", \"action-oriented\"],\n      \"emotionalImpact\": [\"urgent\", \"empowering\"],\n      \"targetKPI\": \"clicks\"\n    }\n  },\n  \"subheadline\": {\n    \"content\": \"Supporting subheadline\",\n    \"variations\": [\"Variation 1\", \"Variation 2\"],\n    \"metadata\": {\n      \"tone\": [\"informative\", \"benefit-focused\"]\n    }\n  },\n  \"body\": {\n    \"content\": \"Main body text\",\n    \"variations\": [\"Variation 1\", \"Variation 2\"],\n    \"metadata\": {\n      \"tone\": [\"persuasive\", \"trust-building\"],\n      \"emotionalImpact\": [\"reassuring\", \"motivating\"]\n    }\n  },\n  \"cta\": {\n    \"content\": \"Call to action\",\n    \"variations\": [\"Variation 1\", \"Variation 2\"],\n    \"metadata\": {\n      \"tone\": [\"urgent\", \"action-oriented\"]\n    }\n  },\n  \"primaryText\": {\n    \"content\": \"Extended primary text for social media\",\n    \"variations\": [\"Variation 1\", \"Variation 2\"],\n    \"metadata\": {\n      \"tone\": [\"engaging\", \"conversational\"]\n    }\n  }\n}\n\nGUIDELINES:\n- Headlines: Max ").concat(adCreative_1.SLOT_CONFIGS.headline.maxLength.instagram, " chars (Instagram), ").concat(adCreative_1.SLOT_CONFIGS.headline.maxLength.facebook, " chars (Facebook), ").concat(adCreative_1.SLOT_CONFIGS.headline.maxLength.linkedin, " chars (LinkedIn)\n- Body: Max ").concat(adCreative_1.SLOT_CONFIGS.body.maxLength.instagram, " chars (Instagram), ").concat(adCreative_1.SLOT_CONFIGS.body.maxLength.facebook, " chars (Facebook), ").concat(adCreative_1.SLOT_CONFIGS.body.maxLength.linkedin, " chars (LinkedIn)\n- CTA: Max ").concat(adCreative_1.SLOT_CONFIGS.cta.maxLength.instagram, " chars (Instagram), ").concat(adCreative_1.SLOT_CONFIGS.cta.maxLength.facebook, " chars (Facebook), ").concat(adCreative_1.SLOT_CONFIGS.cta.maxLength.linkedin, " chars (LinkedIn)\n- Primary Text: Max ").concat(adCreative_1.SLOT_CONFIGS.primaryText.maxLength.instagram, " chars (Instagram), ").concat(adCreative_1.SLOT_CONFIGS.primaryText.maxLength.facebook, " chars (Facebook), ").concat(adCreative_1.SLOT_CONFIGS.primaryText.maxLength.linkedin, " chars (LinkedIn)\n\n").concat(adCreative_1.PLATFORM_GUIDELINES.instagram.bestPractices
            .slice(0, 3)
            .map(function (b) { return "- Instagram: ".concat(b); })
            .join('\n'), "\n").concat(adCreative_1.PLATFORM_GUIDELINES.facebook.bestPractices
            .slice(0, 3)
            .map(function (b) { return "- Facebook: ".concat(b); })
            .join('\n'), "\n").concat(adCreative_1.PLATFORM_GUIDELINES.linkedin.bestPractices
            .slice(0, 3)
            .map(function (b) { return "- LinkedIn: ".concat(b); })
            .join('\n'), "\n\nMake sure to:\n1. Create compelling, action-oriented copy\n2. Include ").concat(request.tone.join(', '), " tones\n3. Address the target audience pain points\n4. Highlight unique value propositions\n5. Follow platform character limits\n6. Generate ").concat(request.variations, " variations for each slot\n7. Align with ").concat(request.objective, " objective and ").concat(request.funnelStage, " funnel stage\n");
    };
    /**
     * Parse AI response into structured slots
     */
    AdCreativeGenerator.prototype.parseSlotResponse = function (response, request) {
        var _a, _b;
        try {
            // Extract JSON from response
            var jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            var slotData = JSON.parse(jsonMatch[0]);
            var slots = [];
            // Create slot objects from parsed data
            var slotTypes = [
                'headline',
                'subheadline',
                'body',
                'cta',
                'primaryText',
            ];
            var _loop_1 = function (slotType) {
                if (slotData[slotType]) {
                    var slot_1 = {
                        id: "".concat(slotType, "-").concat(Date.now()),
                        type: slotType,
                        content: slotData[slotType].content || '',
                        variations: slotData[slotType].variations || [],
                        maxLength: ((_b = (_a = adCreative_1.SLOT_CONFIGS[slotType]) === null || _a === void 0 ? void 0 : _a.maxLength) === null || _b === void 0 ? void 0 : _b.instagram) || undefined,
                        metadata: slotData[slotType].metadata || {},
                    };
                    // Add platform-specific adaptations
                    slot_1.platformSpecific = {};
                    request.platforms.forEach(function (platform) {
                        var _a, _b;
                        var maxLength = (_b = (_a = adCreative_1.SLOT_CONFIGS[slotType]) === null || _a === void 0 ? void 0 : _a.maxLength) === null || _b === void 0 ? void 0 : _b[platform];
                        if (maxLength && slot_1.content.length > maxLength) {
                            // Truncate content for platform if needed
                            slot_1.platformSpecific[platform] =
                                slot_1.content.substring(0, maxLength - 3) + '...';
                        }
                    });
                    slots.push(slot_1);
                }
            };
            for (var _i = 0, slotTypes_1 = slotTypes; _i < slotTypes_1.length; _i++) {
                var slotType = slotTypes_1[_i];
                _loop_1(slotType);
            }
            return slots;
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Error parsing slot response');
            throw new Error('Failed to parse generated slots');
        }
    };
    /**
     * Generate platform-specific versions
     */
    AdCreativeGenerator.prototype.generatePlatformVersions = function (slots, platforms, brandKit) {
        return __awaiter(this, void 0, void 0, function () {
            var versions, _loop_2, _i, platforms_1, platform;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                versions = {};
                _loop_2 = function (platform) {
                    var adaptedSlots = slots.map(function (slot) {
                        var _a;
                        return (__assign(__assign({}, slot), { platformSpecific: __assign(__assign({}, slot.platformSpecific), (_a = {}, _a[platform] = _this.adaptContentForPlatform(slot.content, platform), _a)) }));
                    });
                    versions[platform] = {
                        id: "ad-creative-".concat(Date.now(), "-").concat(platform),
                        campaignId: ((_a = slots[0]) === null || _a === void 0 ? void 0 : _a.id) || '',
                        brandKitId: '',
                        name: "Platform-specific: ".concat(platform),
                        objective: 'consideration',
                        funnelStage: 'middle',
                        primaryPlatform: platform,
                        status: 'draft',
                        slots: adaptedSlots,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        version: 1,
                    };
                };
                for (_i = 0, platforms_1 = platforms; _i < platforms_1.length; _i++) {
                    platform = platforms_1[_i];
                    _loop_2(platform);
                }
                return [2 /*return*/, versions];
            });
        });
    };
    /**
     * Adapt content for specific platform requirements
     */
    AdCreativeGenerator.prototype.adaptContentForPlatform = function (content, platform) {
        var guidelines = adCreative_1.PLATFORM_GUIDELINES[platform];
        if (!guidelines)
            return content;
        // Platform-specific adaptations
        switch (platform) {
            case 'instagram':
                // Add emojis if not present
                if (!/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(content)) {
                    content = "\u2728 ".concat(content);
                }
                break;
            case 'linkedin':
                // Make more professional
                content = content.replace(/!/g, '.').replace(/\s+/g, ' ');
                break;
            case 'facebook':
                // Add engagement elements
                if (!content.includes('?') && !content.includes('!')) {
                    content = "".concat(content, " \uD83D\uDD25");
                }
                break;
        }
        return content;
    };
    /**
     * Calculate quality score for generated creative
     */
    AdCreativeGenerator.prototype.calculateQualityScore = function (adCreative, request, brandKit) {
        return __awaiter(this, void 0, void 0, function () {
            var score, maxScore, requiredSlots, hasRequiredSlots, primaryPlatform, withinLimits, hasVariations, brief, hasAudienceAlignment, brandToneMatches, objectiveMatch;
            return __generator(this, function (_a) {
                score = 0;
                maxScore = 100;
                requiredSlots = ['headline', 'body', 'cta'];
                hasRequiredSlots = requiredSlots.every(function (slotType) {
                    return adCreative.slots.some(function (slot) { return slot.type === slotType && slot.content; });
                });
                if (hasRequiredSlots)
                    score += 30;
                primaryPlatform = adCreative.primaryPlatform;
                withinLimits = 0;
                adCreative.slots.forEach(function (slot) {
                    var _a, _b;
                    var maxLength = (_b = (_a = adCreative_1.SLOT_CONFIGS[slot.type]) === null || _a === void 0 ? void 0 : _a.maxLength) === null || _b === void 0 ? void 0 : _b[primaryPlatform];
                    if (maxLength && slot.content.length <= maxLength) {
                        withinLimits++;
                    }
                });
                if (withinLimits === adCreative.slots.length)
                    score += 20;
                hasVariations = adCreative.slots.every(function (slot) { return slot.variations && slot.variations.length > 0; });
                if (hasVariations)
                    score += 15;
                brief = request.targetAudience;
                hasAudienceAlignment = brief.demographics && brief.psychographics;
                if (hasAudienceAlignment)
                    score += 15;
                brandToneMatches = request.tone.some(function (tone) { var _a; return (_a = brandKit.brandPersonality) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(tone.toLowerCase()); });
                if (brandToneMatches)
                    score += 10;
                objectiveMatch = adCreative.objective === request.objective;
                if (objectiveMatch)
                    score += 10;
                return [2 /*return*/, Math.min(score, maxScore)];
            });
        });
    };
    /**
     * Generate improvement recommendations
     */
    AdCreativeGenerator.prototype.generateRecommendations = function (adCreative, request) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendations, requiredSlots, missingSlots, ctaSlot, hasEmotionalWords;
            return __generator(this, function (_a) {
                recommendations = [];
                requiredSlots = ['headline', 'body', 'cta'];
                missingSlots = requiredSlots.filter(function (slotType) {
                    return !adCreative.slots.some(function (slot) { return slot.type === slotType && slot.content; });
                });
                if (missingSlots.length > 0) {
                    recommendations.push("Add missing slots: ".concat(missingSlots.join(', ')));
                }
                // Check character limits
                adCreative.slots.forEach(function (slot) {
                    var _a, _b;
                    var maxLength = (_b = (_a = adCreative_1.SLOT_CONFIGS[slot.type]) === null || _a === void 0 ? void 0 : _a.maxLength) === null || _b === void 0 ? void 0 : _b.instagram;
                    if (maxLength && slot.content.length > maxLength) {
                        recommendations.push("Shorten ".concat(slot.type, " to ").concat(maxLength, " characters or less"));
                    }
                });
                // Check variations
                adCreative.slots.forEach(function (slot) {
                    if (!slot.variations || slot.variations.length === 0) {
                        recommendations.push("Add variations for ".concat(slot.type, " to enable A/B testing"));
                    }
                });
                // Check platform optimization
                if (!adCreative.primaryPlatform || adCreative.primaryPlatform === 'multi') {
                    recommendations.push('Consider creating platform-specific versions for better performance');
                }
                ctaSlot = adCreative.slots.find(function (slot) { return slot.type === 'cta'; });
                if (ctaSlot &&
                    !ctaSlot.content.match(/\b(shop|buy|get|start|try|learn|discover|sign|register)\b/i)) {
                    recommendations.push('Strengthen CTA with more action-oriented language');
                }
                hasEmotionalWords = adCreative.slots.some(function (slot) {
                    return slot.content.match(/\b(amazing|incredible|transform|revolutionary|breakthrough|powerful|unforgettable)\b/i);
                });
                if (!hasEmotionalWords) {
                    recommendations.push('Add more emotionally resonant language to increase engagement');
                }
                return [2 /*return*/, recommendations];
            });
        });
    };
    /**
     * Estimate performance metrics
     */
    AdCreativeGenerator.prototype.estimatePerformance = function (adCreative, request) {
        return __awaiter(this, void 0, void 0, function () {
            var baseMetrics, base, qualityMultiplier, platformMultipliers, platformMultiplier;
            return __generator(this, function (_a) {
                baseMetrics = {
                    awareness: { ctr: 0.015, conversionRate: 0.002, engagementRate: 0.035 },
                    consideration: {
                        ctr: 0.025,
                        conversionRate: 0.008,
                        engagementRate: 0.045,
                    },
                    conversion: { ctr: 0.035, conversionRate: 0.025, engagementRate: 0.04 },
                    retention: { ctr: 0.02, conversionRate: 0.015, engagementRate: 0.06 },
                };
                base = baseMetrics[request.objective];
                qualityMultiplier = 1.0;
                platformMultipliers = {
                    instagram: 1.1,
                    facebook: 1.0,
                    linkedin: 0.9,
                };
                platformMultiplier = 1.0;
                request.platforms.forEach(function (platform) {
                    platformMultiplier = Math.max(platformMultiplier, platformMultipliers[platform] || 1.0);
                });
                return [2 /*return*/, {
                        ctr: base.ctr * qualityMultiplier * platformMultiplier,
                        conversionRate: base.conversionRate * qualityMultiplier * platformMultiplier,
                        engagementRate: base.engagementRate * qualityMultiplier * platformMultiplier,
                    }];
            });
        });
    };
    return AdCreativeGenerator;
}());
exports.AdCreativeGenerator = AdCreativeGenerator;
