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
exports.AdCopyService = void 0;
var openai_1 = __importDefault(require("openai"));
var campaignAwareService_1 = require("./campaignAwareService");
var logger_1 = require("../middleware/logger");
var AdCopyService = /** @class */ (function () {
    function AdCopyService() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.campaignAwareService = new campaignAwareService_1.CampaignAwareService();
    }
    /**
     * Generate ad copy content for a single variation
     */
    AdCopyService.prototype.generateAdCopy = function (request, campaign, brandKit) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt_1, completion, response, adCopy, variation, qualityScore, recommendations, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 2, , 3]);
                        logger_1.log.info({
                            variationType: request.variationType,
                            platforms: request.platforms,
                            assetDescription: request.assetDescription.substring(0, 100)
                        }, "Generating ad copy for variation: ".concat(request.variationType));
                        prompt_1 = this.buildAdCopyPrompt(request, campaign, brandKit);
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: 'gpt-4',
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an expert copywriter specializing in digital advertising. Generate compelling, conversion-focused ad copy that follows best practices for each platform and variation type.',
                                    },
                                    {
                                        role: 'user',
                                        content: prompt_1,
                                    },
                                ],
                                temperature: 0.7,
                                max_tokens: 1500,
                            })];
                    case 1:
                        completion = _c.sent();
                        response = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content;
                        if (!response) {
                            throw new Error('Failed to generate ad copy content');
                        }
                        adCopy = this.parseAdCopyResponse(response, request);
                        variation = this.createVariationFromAdCopy(adCopy, request.variationType);
                        qualityScore = this.calculateQualityScore(adCopy, request);
                        recommendations = this.generateRecommendations(adCopy, request);
                        logger_1.log.info({
                            variationType: request.variationType,
                            qualityScore: qualityScore,
                            headlineLength: adCopy.headline.length
                        }, "Ad copy generated successfully");
                        return [2 /*return*/, {
                                variation: variation,
                                adCopy: adCopy,
                                qualityScore: qualityScore,
                                recommendations: recommendations,
                            }];
                    case 2:
                        error_1 = _c.sent();
                        logger_1.log.error({ err: error_1, variationType: request.variationType }, 'Ad copy generation error');
                        throw new Error("Failed to generate ad copy: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Build comprehensive prompt for ad copy generation using campaign-aware service
     */
    AdCopyService.prototype.buildAdCopyPrompt = function (request, campaign, brandKit) {
        var _a, _b, _c, _d, _e, _f;
        // If we have both campaign and brand kit, use campaign-aware prompting
        if (campaign && brandKit) {
            var campaignContext = this.campaignAwareService.buildCampaignContext(campaign, brandKit);
            var assetContext = {
                description: request.assetDescription,
                category: 'ad-copy',
                features: (_a = request.targetAudience) === null || _a === void 0 ? void 0 : _a.painPoints,
                benefits: [((_b = campaign.brief) === null || _b === void 0 ? void 0 : _b.keyMessage) || brandKit.valueProposition || 'High quality products'],
                useCases: ["Drive ".concat(request.objective, " through compelling advertising")],
            };
            return this.campaignAwareService.generateCampaignAwarePrompt(campaignContext, assetContext, request.variationType, request.platforms, 'adcopy');
        }
        // Fallback to original prompting if no campaign/brand context
        var brandPersonality = (brandKit === null || brandKit === void 0 ? void 0 : brandKit.brandPersonality) || 'Professional and trustworthy';
        var brandColors = (brandKit === null || brandKit === void 0 ? void 0 : brandKit.colors) || {};
        var valueProposition = (brandKit === null || brandKit === void 0 ? void 0 : brandKit.valueProposition) || 'High quality products and services';
        var variationInstructions = this.getVariationInstructions(request.variationType);
        var platformGuidelines = this.getPlatformGuidelines(request.platforms);
        return "\nGenerate ".concat(request.variationType, " ad copy for the following:\n\nASSET DESCRIPTION:\n").concat(request.assetDescription, "\n\nCAMPAIGN CONTEXT:\n").concat(campaign ? "\n- Campaign Name: ".concat(campaign.name, "\n- Objective: ").concat(request.objective, "\n- Key Message: ").concat(((_c = campaign.brief) === null || _c === void 0 ? void 0 : _c.keyMessage) || 'Not specified', "\n- Primary Audience: ").concat(((_e = (_d = campaign.brief) === null || _d === void 0 ? void 0 : _d.primaryAudience) === null || _e === void 0 ? void 0 : _e.demographics) || 'Not specified', "\n") : 'No specific campaign context provided', "\n\nBRAND IDENTITY:\n- Brand Personality: ").concat(brandPersonality, "\n- Value Proposition: ").concat(valueProposition, "\n- Brand Colors: ").concat(brandColors.primary || 'Not specified', ", ").concat(brandColors.secondary || 'Not specified', "\n\nTARGET AUDIENCE:\n").concat(request.targetAudience ? "\n- Demographics: ".concat(request.targetAudience.demographics || 'Not specified', "\n- Psychographics: ").concat(request.targetAudience.psychographics || 'Not specified', "\n- Pain Points: ").concat(((_f = request.targetAudience.painPoints) === null || _f === void 0 ? void 0 : _f.join(', ')) || 'Not specified', "\n") : 'General audience', "\n\nVARIATION TYPE: ").concat(request.variationType, "\n").concat(variationInstructions, "\n\nPLATFORMS: ").concat(request.platforms.join(', '), "\n").concat(platformGuidelines, "\n\nTONE: ").concat(request.tone.join(', '), "\n\nREQUIRED OUTPUT:\nGenerate ad copy in this JSON format:\n{\n  \"headline\": \"Compelling headline that grabs attention\",\n  \"subheadline\": \"Supporting subheadline that reinforces the main message\",\n  \"primaryText\": \"Main body text that provides details and benefits (2-4 sentences)\",\n  \"ctaText\": \"Clear call-to-action that drives engagement\",\n  \"platformSpecific\": {\n    \"instagram\": {\n      \"headline\": \"Instagram-optimized headline\",\n      \"primaryText\": \"Instagram-optimized body with emojis and hashtags\",\n      \"ctaText\": \"Instagram-optimized CTA\"\n    },\n    \"facebook\": {\n      \"headline\": \"Facebook-optimized headline\",\n      \"primaryText\": \"Facebook-optimized body with more detail\",\n      \"ctaText\": \"Facebook-optimized CTA\"\n    },\n    \"linkedin\": {\n      \"headline\": \"LinkedIn-optimized professional headline\",\n      \"primaryText\": \"LinkedIn-optimized professional body\",\n      \"ctaText\": \"LinkedIn-optimized professional CTA\"\n    }\n  }\n}\n\nGUIDELINES:\n- Headlines: Max 40 characters for mobile, 60 for desktop\n- Primary Text: 125 characters for Instagram, 255 for Facebook, 300 for LinkedIn\n- CTA: Action-oriented and urgent\n- Include relevant emojis for Instagram and Facebook\n- Use professional tone for LinkedIn\n- Focus on benefits, not just features\n- Include social proof when relevant\n- Create urgency without being pushy\n\nGenerate compelling, conversion-focused ad copy that aligns with the ").concat(request.variationType, " variation type.\n    ").trim();
    };
    /**
     * Get specific instructions for each variation type
     */
    AdCopyService.prototype.getVariationInstructions = function (variationType) {
        var instructions = {
            main: 'Main variation: Balanced, professional, and comprehensive. Best all-around performer.',
            alt1: 'Alternative 1: More casual and conversational tone. Uses questions and personal language.',
            alt2: 'Alternative 2: Benefit-focused with strong value propositions. Uses numbers and statistics.',
            alt3: 'Alternative 3: Urgent and direct. Uses scarcity and time-limited language.',
            punchy: 'Punchy: Short, bold, and attention-grabbing. Uses strong words and minimal text.',
            short: 'Short: Concise and to-the-point. Focuses on essential information only.',
            story: 'Story: Narrative-driven with emotional appeal. Uses storytelling techniques and testimonials.',
        };
        return instructions[variationType] || instructions.main;
    };
    /**
     * Get platform-specific guidelines
     */
    AdCopyService.prototype.getPlatformGuidelines = function (platforms) {
        var guidelines = {
            instagram: 'Visual-first, use emojis, hashtags, and casual tone. Max 125 characters for primary text.',
            facebook: 'Community-focused, use detailed descriptions and questions. Max 255 characters for primary text.',
            linkedin: 'Professional, use industry terminology and business value. Max 300 characters for primary text.',
        };
        return platforms
            .map(function (platform) { return "- ".concat(platform.charAt(0).toUpperCase() + platform.slice(1), ": ").concat(guidelines[platform]); })
            .join('\n');
    };
    /**
     * Parse AI response into structured ad copy
     */
    AdCopyService.prototype.parseAdCopyResponse = function (response, request) {
        try {
            // Extract JSON from response
            var jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            var adCopyData = JSON.parse(jsonMatch[0]);
            return {
                headline: adCopyData.headline || '',
                subheadline: adCopyData.subheadline || '',
                primaryText: adCopyData.primaryText || '',
                ctaText: adCopyData.ctaText || '',
                platformSpecific: adCopyData.platformSpecific || {},
            };
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Error parsing ad copy response');
            // Fallback structure
            return {
                headline: 'Transform Your Business Today',
                subheadline: 'Professional solutions for modern challenges',
                primaryText: 'Discover how our innovative approach can help you achieve your goals with proven results.',
                ctaText: 'Learn More',
                platformSpecific: {},
            };
        }
    };
    /**
     * Create CaptionVariation from AdCopyContent
     */
    AdCopyService.prototype.createVariationFromAdCopy = function (adCopy, variationType) {
        return {
            id: "variation-".concat(Date.now(), "-").concat(Math.random().toString(36).substr(2, 9)),
            label: variationType,
            text: "".concat(adCopy.headline, "\n\n").concat(adCopy.subheadline ? adCopy.subheadline + '\n\n' : '').concat(adCopy.primaryText, "\n\n").concat(adCopy.ctaText),
            status: 'completed',
            approvalStatus: 'pending',
            approved: false,
            qualityScore: 0, // Will be calculated separately
            metadata: {
                readingGrade: 8, // Estimated
                toneClassification: ['professional', 'persuasive'],
                platform: ['instagram', 'facebook', 'linkedin'],
            },
            adCopy: adCopy,
            createdAt: new Date(),
        };
    };
    /**
     * Calculate quality score for generated ad copy
     */
    AdCopyService.prototype.calculateQualityScore = function (adCopy, request) {
        var score = 0;
        var maxScore = 100;
        // Headline quality (30 points)
        if (adCopy.headline.length >= 10 && adCopy.headline.length <= 60)
            score += 15;
        if (/\b(Amazing|Incredible|Transform|Revolutionary|Powerful|Ultimate|Guaranteed)\b/i.test(adCopy.headline))
            score += 15;
        // Body content quality (25 points)
        if (adCopy.primaryText.length >= 50 && adCopy.primaryText.length <= 300)
            score += 10;
        if (/\b(benefit|advantage|result|outcome|solution)\b/i.test(adCopy.primaryText))
            score += 15;
        // CTA quality (20 points)
        if (adCopy.ctaText.length >= 3 && adCopy.ctaText.length <= 20)
            score += 10;
        if (/\b(Shop|Buy|Get|Start|Try|Learn|Discover|Sign|Register|Now|Today)\b/i.test(adCopy.ctaText))
            score += 10;
        // Platform optimization (15 points)
        if (adCopy.platformSpecific && Object.keys(adCopy.platformSpecific).length > 0)
            score += 15;
        // Brand alignment (10 points)
        if (request.tone.some(function (tone) { return adCopy.headline.toLowerCase().includes(tone.toLowerCase()); }))
            score += 5;
        if (request.tone.some(function (tone) { return adCopy.primaryText.toLowerCase().includes(tone.toLowerCase()); }))
            score += 5;
        return Math.min(score, maxScore);
    };
    /**
     * Generate improvement recommendations
     */
    AdCopyService.prototype.generateRecommendations = function (adCopy, request) {
        var recommendations = [];
        // Check headline
        if (adCopy.headline.length > 60) {
            recommendations.push('Shorten headline to under 60 characters for better mobile performance');
        }
        if (!/\b(Amazing|Incredible|Transform|Revolutionary|Powerful|Ultimate|Guaranteed)\b/i.test(adCopy.headline)) {
            recommendations.push('Add more powerful words to headline for better attention');
        }
        // Check body text
        if (adCopy.primaryText.length > 300) {
            recommendations.push('Consider shortening primary text for better readability');
        }
        if (!/\b(benefit|advantage|result|outcome|solution)\b/i.test(adCopy.primaryText)) {
            recommendations.push('Focus more on benefits rather than features');
        }
        // Check CTA
        if (!/\b(Shop|Buy|Get|Start|Try|Learn|Discover|Sign|Register|Now|Today)\b/i.test(adCopy.ctaText)) {
            recommendations.push('Strengthen CTA with more action-oriented language');
        }
        // Check platform optimization
        if (!adCopy.platformSpecific || Object.keys(adCopy.platformSpecific).length === 0) {
            recommendations.push('Add platform-specific variations for better performance');
        }
        return recommendations;
    };
    return AdCopyService;
}());
exports.AdCopyService = AdCopyService;
