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
exports.CampaignBriefGenerator = void 0;
var openai_1 = __importDefault(require("openai"));
var logger_1 = require("../middleware/logger");
var openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
var CampaignBriefGenerator = /** @class */ (function () {
    function CampaignBriefGenerator() {
    }
    /**
     * Generate creative requirements from campaign brief
     */
    CampaignBriefGenerator.generateCreativeRequirements = function (campaign, brandKit) {
        return __awaiter(this, void 0, void 0, function () {
            var brief, brandContext, prompt_1, completion, requirements, parsedRequirements, error_1;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 2, , 3]);
                        brief = campaign.brief;
                        brandContext = {
                            brandPersonality: brandKit.brandPersonality,
                            targetAudience: brandKit.targetAudience,
                            valueProposition: brandKit.valueProposition,
                            toneStyle: brandKit.toneStyle,
                            colors: brandKit.colors,
                        };
                        prompt_1 = this.buildCreativeRequirementsPrompt(campaign, brandContext);
                        return [4 /*yield*/, openai.chat.completions.create({
                                model: 'gpt-4',
                                messages: [
                                    {
                                        role: 'system',
                                        content: "You are a senior creative strategist and AI creative director. Your role is to translate client campaign briefs into precise creative requirements that will guide AI-generated advertising creative.\n\nAnalyze the campaign brief and brand context to generate detailed creative specifications. Focus on:\n1. Visual style guidance (mood, colors, composition, typography)\n2. Messaging strategy (tone, focus areas, key messages, emotional drivers)\n3. Content structure (headline approach, body format, CTA placement)\n4. Platform-specific adaptations for Instagram, Facebook, and LinkedIn\n\nReturn your analysis as a JSON object following this exact structure:\n{\n  \"visualStyle\": {\n    \"mood\": [\"mood1\", \"mood2\"],\n    \"colorScheme\": [\"#color1\", \"#color2\", \"#color3\"],\n    \"composition\": \"composition-type\",\n    \"typography\": \"typography-style\"\n  },\n  \"messaging\": {\n    \"tone\": [\"tone1\", \"tone2\"],\n    \"focusAreas\": [\"area1\", \"area2\"],\n    \"keyMessages\": [\"message1\", \"message2\"],\n    \"emotionalDrivers\": [\"driver1\", \"driver2\"]\n  },\n  \"structure\": {\n    \"headlineStyle\": \"headline-type\",\n    \"bodyFormat\": [\"format1\", \"format2\"],\n    \"ctaPlacement\": \"placement-type\",\n    \"contentDensity\": \"minimal|moderate|detailed\"\n  },\n  \"platformSpecific\": {\n    \"instagram\": {\n      \"visualPriority\": \"lifestyle|product|user-generated\",\n      \"captionLength\": \"short|medium|long\",\n      \"hashtagStrategy\": \"broad|niche|branded\",\n      \"storyElements\": [\"element1\", \"element2\"]\n    },\n    \"facebook\": {\n      \"contentFocus\": \"informational|entertaining|promotional\",\n      \"engagementType\": \"discussion|sharing|conversion\",\n      \"adFormat\": \"image|video|carousel\"\n    },\n    \"linkedin\": {\n      \"professionalAngle\": \"innovation|leadership|corporate-responsibility\",\n      \"contentDepth\": \"high-level|detailed-analysis\",\n      \"networkStrategy\": \"employee-advocacy|thought-leadership\"\n    }\n  }\n}\n\nBe specific and strategic in your recommendations. Consider the campaign objective, target audience, competitive positioning, and brand personality.",
                                    },
                                    {
                                        role: 'user',
                                        content: prompt_1,
                                    },
                                ],
                                max_tokens: 1500,
                                temperature: 0.4,
                                response_format: { type: 'json_object' },
                            })];
                    case 1:
                        completion = _d.sent();
                        requirements = (_c = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
                        if (!requirements) {
                            throw new Error('Failed to generate creative requirements');
                        }
                        parsedRequirements = JSON.parse(requirements);
                        return [2 /*return*/, this.validateAndNormalizeRequirements(parsedRequirements, campaign, brandKit)];
                    case 2:
                        error_1 = _d.sent();
                        logger_1.log.error({ err: error_1, campaignId: campaign.id }, 'Error generating creative requirements');
                        return [2 /*return*/, this.getFallbackRequirements(campaign, brandKit)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Build the prompt for creative requirements generation
     */
    CampaignBriefGenerator.buildCreativeRequirementsPrompt = function (campaign, brandContext) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
        var brief = campaign.brief;
        return "\nCAMPAIGN BRIEF ANALYSIS\n\nCampaign: ".concat(campaign.name, "\nObjective: ").concat(campaign.objective, "\nFunnel Stage: ").concat(campaign.funnelStage, "\nLaunch Type: ").concat(campaign.launchType, "\n\nCLIENT CONTEXT:\n").concat((brief === null || brief === void 0 ? void 0 : brief.clientOverview) || 'Not specified', "\nCampaign Purpose: ").concat((brief === null || brief === void 0 ? void 0 : brief.campaignPurpose) || 'Not specified', "\n\nBUSINESS GOALS:\nPrimary KPI: ").concat((brief === null || brief === void 0 ? void 0 : brief.primaryKPI) || 'Not specified', "\nSecondary KPIs: ").concat(((_a = brief === null || brief === void 0 ? void 0 : brief.secondaryKPIs) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'Not specified', "\n\nCOMPETITIVE LANDSCAPE:\nCompetitor Insights: ").concat(((_b = brief === null || brief === void 0 ? void 0 : brief.competitorInsights) === null || _b === void 0 ? void 0 : _b.join('; ')) || 'Not specified', "\nDifferentiators: ").concat(((_c = brief === null || brief === void 0 ? void 0 : brief.differentiators) === null || _c === void 0 ? void 0 : _c.join(', ')) || 'Not specified', "\n\nTARGET AUDIENCE:\n").concat(((_d = brief === null || brief === void 0 ? void 0 : brief.primaryAudience) === null || _d === void 0 ? void 0 : _d.demographics) || 'Not specified', "\nPsychographics: ").concat(((_e = brief === null || brief === void 0 ? void 0 : brief.primaryAudience) === null || _e === void 0 ? void 0 : _e.psychographics) || 'Not specified', "\nPain Points: ").concat(((_g = (_f = brief === null || brief === void 0 ? void 0 : brief.primaryAudience) === null || _f === void 0 ? void 0 : _f.painPoints) === null || _g === void 0 ? void 0 : _g.join(', ')) || 'Not specified', "\nMotivations: ").concat(((_j = (_h = brief === null || brief === void 0 ? void 0 : brief.primaryAudience) === null || _h === void 0 ? void 0 : _h.motivations) === null || _j === void 0 ? void 0 : _j.join(', ')) || 'Not specified', "\n\nMESSAGE STRATEGY:\nKey Message: ").concat((brief === null || brief === void 0 ? void 0 : brief.keyMessage) || 'Not specified', "\nSupporting Points: ").concat(((_k = brief === null || brief === void 0 ? void 0 : brief.supportingPoints) === null || _k === void 0 ? void 0 : _k.join(', ')) || 'Not specified', "\nEmotional Appeal: ").concat((brief === null || brief === void 0 ? void 0 : brief.emotionalAppeal) || 'Not specified', "\n\nMANDATORIES & CONSTRAINTS:\nMust Include: ").concat(((_l = brief === null || brief === void 0 ? void 0 : brief.mandatoryInclusions) === null || _l === void 0 ? void 0 : _l.join(', ')) || 'Not specified', "\nMust Exclude: ").concat(((_m = brief === null || brief === void 0 ? void 0 : brief.mandatoryExclusions) === null || _m === void 0 ? void 0 : _m.join(', ')) || 'Not specified', "\n\nPLATFORM STRATEGY:\n").concat(campaign.placements.join(', '), "\nInstagram Focus: ").concat(((_o = brief === null || brief === void 0 ? void 0 : brief.platformSpecific) === null || _o === void 0 ? void 0 : _o.instagram) || 'Not specified', "\nFacebook Focus: ").concat(((_p = brief === null || brief === void 0 ? void 0 : brief.platformSpecific) === null || _p === void 0 ? void 0 : _p.facebook) || 'Not specified', "\nLinkedIn Focus: ").concat(((_q = brief === null || brief === void 0 ? void 0 : brief.platformSpecific) === null || _q === void 0 ? void 0 : _q.linkedin) || 'Not specified', "\n\nTIMING & URGENCY:\nDuration: ").concat((brief === null || brief === void 0 ? void 0 : brief.campaignDuration) || 'Not specified', "\nSeasonality: ").concat((brief === null || brief === void 0 ? void 0 : brief.seasonality) || 'Not specified', "\nUrgency: ").concat((brief === null || brief === void 0 ? void 0 : brief.urgency) || 'Not specified', "\n\nBRAND CONTEXT:\nBrand Personality: ").concat(brandContext.brandPersonality || 'Not specified', "\nTarget Audience: ").concat(brandContext.targetAudience || 'Not specified', "\nValue Proposition: ").concat(brandContext.valueProposition || 'Not specified', "\nTone Style: ").concat(brandContext.toneStyle || 'Not specified', "\n\nOFFER & CTA:\nPrimary Offer: ").concat(campaign.primaryOffer || 'Not specified', "\nPrimary CTA: ").concat(campaign.primaryCTA || 'Not specified', "\nSecondary CTA: ").concat(campaign.secondaryCTA || 'Not specified', "\n\nBased on this comprehensive brief, generate detailed creative requirements that will guide effective creative development.\n");
    };
    /**
     * Validate and normalize the generated requirements
     */
    CampaignBriefGenerator.validateAndNormalizeRequirements = function (requirements, campaign, brandKit) {
        // Ensure all required fields exist
        return {
            visualStyle: {
                mood: requirements.visualStyle.mood || [],
                colorScheme: requirements.visualStyle.colorScheme || [
                    brandKit.colors.primary,
                    brandKit.colors.secondary,
                    brandKit.colors.tertiary,
                ],
                composition: requirements.visualStyle.composition || 'hero-product',
                typography: requirements.visualStyle.typography || 'clean-sans',
            },
            messaging: {
                tone: requirements.messaging.tone || [],
                focusAreas: requirements.messaging.focusAreas || [],
                keyMessages: requirements.messaging.keyMessages || [],
                emotionalDrivers: requirements.messaging.emotionalDrivers || [],
            },
            structure: {
                headlineStyle: requirements.structure.headlineStyle || 'benefit-driven',
                bodyFormat: requirements.structure.bodyFormat || ['bullet-points'],
                ctaPlacement: requirements.structure.ctaPlacement || 'primary-bottom',
                contentDensity: requirements.structure.contentDensity || 'moderate',
            },
            platformSpecific: {
                instagram: {
                    visualPriority: requirements.platformSpecific.instagram.visualPriority ||
                        'lifestyle',
                    captionLength: requirements.platformSpecific.instagram.captionLength || 'medium',
                    hashtagStrategy: requirements.platformSpecific.instagram.hashtagStrategy || 'niche',
                    storyElements: requirements.platformSpecific.instagram.storyElements || [],
                },
                facebook: {
                    contentFocus: requirements.platformSpecific.facebook.contentFocus ||
                        'promotional',
                    engagementType: requirements.platformSpecific.facebook.engagementType ||
                        'conversion',
                    adFormat: requirements.platformSpecific.facebook.adFormat || 'image',
                },
                linkedin: {
                    professionalAngle: requirements.platformSpecific.linkedin.professionalAngle ||
                        'innovation',
                    contentDepth: requirements.platformSpecific.linkedin.contentDepth || 'high-level',
                    networkStrategy: requirements.platformSpecific.linkedin.networkStrategy ||
                        'thought-leadership',
                },
            },
        };
    };
    /**
     * Get fallback requirements when AI generation fails
     */
    CampaignBriefGenerator.getFallbackRequirements = function (campaign, brandKit) {
        var objectiveMapping = {
            awareness: ['educational', 'inspiring', 'memorable'],
            traffic: ['engaging', 'curious', 'clear'],
            conversion: ['trustworthy', 'urgent', 'persuasive'],
            engagement: ['entertaining', 'relatable', 'shareable'],
        };
        return {
            visualStyle: {
                mood: objectiveMapping[campaign.objective] || ['professional'],
                colorScheme: [brandKit.colors.primary, brandKit.colors.secondary],
                composition: 'hero-product',
                typography: 'clean-sans',
            },
            messaging: {
                tone: ['confident', 'professional'],
                focusAreas: ['product-benefits'],
                keyMessages: [campaign.primaryOffer || 'Quality products'],
                emotionalDrivers: ['security', 'aspiration'],
            },
            structure: {
                headlineStyle: 'benefit-driven',
                bodyFormat: ['bullet-points'],
                ctaPlacement: 'primary-bottom',
                contentDensity: 'moderate',
            },
            platformSpecific: {
                instagram: {
                    visualPriority: 'product',
                    captionLength: 'medium',
                    hashtagStrategy: 'branded',
                    storyElements: ['swipe-up'],
                },
                facebook: {
                    contentFocus: 'promotional',
                    engagementType: 'conversion',
                    adFormat: 'image',
                },
                linkedin: {
                    professionalAngle: 'innovation',
                    contentDepth: 'high-level',
                    networkStrategy: 'thought-leadership',
                },
            },
        };
    };
    /**
     * Convert creative requirements to AI prompt instructions
     */
    CampaignBriefGenerator.creativeRequirementsToPrompt = function (requirements) {
        var instructions = [];
        // Visual style instructions
        instructions.push("Visual Style:");
        instructions.push("- Mood: ".concat(requirements.visualStyle.mood.join(', ')));
        instructions.push("- Color scheme: ".concat(requirements.visualStyle.colorScheme.join(', ')));
        instructions.push("- Composition: ".concat(requirements.visualStyle.composition));
        instructions.push("- Typography: ".concat(requirements.visualStyle.typography));
        // Messaging instructions
        instructions.push("\nMessaging:");
        instructions.push("- Tone: ".concat(requirements.messaging.tone.join(', ')));
        instructions.push("- Focus areas: ".concat(requirements.messaging.focusAreas.join(', ')));
        instructions.push("- Key messages: ".concat(requirements.messaging.keyMessages.join(', ')));
        instructions.push("- Emotional drivers: ".concat(requirements.messaging.emotionalDrivers.join(', ')));
        // Structure instructions
        instructions.push("\nStructure:");
        instructions.push("- Headline style: ".concat(requirements.structure.headlineStyle));
        instructions.push("- Body format: ".concat(requirements.structure.bodyFormat.join(', ')));
        instructions.push("- CTA placement: ".concat(requirements.structure.ctaPlacement));
        instructions.push("- Content density: ".concat(requirements.structure.contentDensity));
        // Platform-specific instructions
        instructions.push("\nPlatform Adaptations:");
        instructions.push("- Instagram: ".concat(requirements.platformSpecific.instagram.visualPriority, " focus, ").concat(requirements.platformSpecific.instagram.captionLength, " captions"));
        instructions.push("- Facebook: ".concat(requirements.platformSpecific.facebook.contentFocus, " content, ").concat(requirements.platformSpecific.facebook.engagementType, " focus"));
        instructions.push("- LinkedIn: ".concat(requirements.platformSpecific.linkedin.professionalAngle, " angle, ").concat(requirements.platformSpecific.linkedin.contentDepth, " content"));
        return instructions.join('\n');
    };
    return CampaignBriefGenerator;
}());
exports.CampaignBriefGenerator = CampaignBriefGenerator;
