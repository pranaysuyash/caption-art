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
exports.CaptionGenerator = exports.PLATFORM_PRESETS = exports.CAPTION_ANGLES = exports.CAPTION_TEMPLATES = void 0;
var openai_1 = __importDefault(require("openai"));
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var imageRenderer_1 = require("./imageRenderer");
var styleAnalyzer_1 = require("./styleAnalyzer");
var CacheService_1 = require("./CacheService");
var MetricsService_1 = require("./MetricsService");
var path_1 = __importDefault(require("path"));
var openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
exports.CAPTION_TEMPLATES = {
    punchy: {
        name: 'Punchy & Bold',
        prompt: 'Create short, punchy captions that grab attention immediately. Use strong action words, minimal text, and powerful statements. Perfect for bold brands.',
        length: '1-2 sentences',
        style: 'Bold, confident, attention-grabbing',
    },
    descriptive: {
        name: 'Descriptive & Detailed',
        prompt: 'Create detailed, descriptive captions that tell the full story behind the image. Include context, details, and comprehensive information.',
        length: '3-5 sentences',
        style: 'Informative, thorough, educational',
    },
    'hashtag-heavy': {
        name: 'Hashtag-Heavy',
        prompt: 'Create engaging captions with extensive hashtag strategy. Include 10-15 relevant hashtags, mix of broad and niche tags, and industry-specific keywords.',
        length: '2-3 sentences + hashtags',
        style: 'Discoverable, trending, community-focused',
    },
    storytelling: {
        name: 'Storytelling',
        prompt: 'Create narrative-driven captions that tell a compelling story. Use emotional language, personal anecdotes, and engaging storytelling techniques.',
        length: '3-4 sentences',
        style: 'Personal, emotional, engaging',
    },
    question: {
        name: 'Question-Based',
        prompt: 'Create captions that ask engaging questions to drive comments and interaction. Use open-ended questions, polls, and conversation starters.',
        length: '2-3 sentences',
        style: 'Interactive, conversational, engaging',
    },
};
exports.CAPTION_ANGLES = {
    emotional: {
        name: 'Emotional',
        prompt: 'Appeal to emotions, desires, and aspirations. Use evocative language, sensory words, and emotional triggers. Connect on a personal level.',
        focus: 'Feelings, dreams, personal connection',
    },
    'data-driven': {
        name: 'Data-Driven',
        prompt: 'Lead with facts, statistics, or specific benefits. Use numbers, percentages, and concrete evidence. Build credibility through data.',
        focus: 'Numbers, facts, measurable results',
    },
    'question-based': {
        name: 'Question-Based',
        prompt: 'Start with a compelling question that engages the audience. Create curiosity and encourage responses. Make it thought-provoking.',
        focus: 'Curiosity, engagement, conversation',
    },
    'cta-focused': {
        name: 'CTA-Focused',
        prompt: 'Drive immediate action with clear, urgent calls-to-action. Use imperative verbs and action-oriented language. Create urgency.',
        focus: 'Action, urgency, conversion',
    },
    educational: {
        name: 'Educational',
        prompt: 'Teach something valuable. Share tips, insights, or how-to information. Position as helpful expert. Provide actionable value.',
        focus: 'Knowledge, tips, value delivery',
    },
};
exports.PLATFORM_PRESETS = {
    'ig-feed': {
        name: 'Instagram Feed',
        maxLength: 2200,
        idealLength: 125,
        tone: 'casual and visual-first',
        hashtagStrategy: 'Include 5-10 relevant hashtags',
        emojiUsage: 'Use emojis liberally to add personality',
        style: 'Short paragraphs, conversational, story-driven',
        guidelines: [
            'First line is critical (shown in preview)',
            'Use line breaks for readability',
            'Include call-to-action or question',
            'Hashtags at end or integrated naturally',
        ],
    },
    'ig-story': {
        name: 'Instagram Story',
        maxLength: 500,
        idealLength: 60,
        tone: 'urgent and direct',
        hashtagStrategy: '1-3 hashtags max',
        emojiUsage: 'Minimal emojis for emphasis',
        style: 'Very short, punchy, immediate',
        guidelines: [
            'Grab attention in 2-3 seconds',
            'Swipe-up or action-focused',
            'Time-sensitive language',
        ],
    },
    'fb-feed': {
        name: 'Facebook Feed',
        maxLength: 63206,
        idealLength: 200,
        tone: 'community-focused and conversational',
        hashtagStrategy: 'Use 1-3 hashtags sparingly',
        emojiUsage: 'Moderate emoji use',
        style: 'Longer-form storytelling, personal',
        guidelines: [
            'Tell a complete story',
            'Ask questions to drive comments',
            'Tag relevant people/pages',
            'Use natural language',
        ],
    },
    'fb-story': {
        name: 'Facebook Story',
        maxLength: 500,
        idealLength: 50,
        tone: 'casual and immediate',
        hashtagStrategy: 'No hashtags needed',
        emojiUsage: 'Minimal emojis',
        style: 'Very brief, action-oriented',
        guidelines: ['Quick consumption', 'Clear single message'],
    },
    'li-feed': {
        name: 'LinkedIn Feed',
        maxLength: 3000,
        idealLength: 150,
        tone: 'professional and value-driven',
        hashtagStrategy: '3-5 professional hashtags',
        emojiUsage: 'Minimal or no emojis',
        style: 'Professional, insights-focused, educational',
        guidelines: [
            'Lead with value proposition',
            'Industry insights or expertise',
            'Professional call-to-action',
            'Avoid overly casual language',
            'Data and credibility matter',
        ],
    },
};
var CaptionGenerator = /** @class */ (function () {
    function CaptionGenerator() {
    }
    /**
     * Generate a caption for a single asset using AI
     */
    CaptionGenerator.generateCaption = function (request) {
        return __awaiter(this, void 0, void 0, function () {
            var assetId, workspaceId, brandVoicePrompt, assetDescription, _a, template, asset, cacheKey, cacheService, cachedCaption, assetTypeDescription, templateConfig, angleConfig, angleContext, campaignContext, constraintsContext, platformPreset, platformContext, referenceStyleContext, systemPrompt, userPrompt, completion, caption, error_1;
            var _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        assetId = request.assetId, workspaceId = request.workspaceId, brandVoicePrompt = request.brandVoicePrompt, assetDescription = request.assetDescription, _a = request.template, template = _a === void 0 ? 'descriptive' : _a;
                        asset = auth_1.AuthModel.getAssetById(assetId);
                        if (!asset) {
                            throw new Error("Asset ".concat(assetId, " not found"));
                        }
                        cacheKey = "caption_".concat(assetId, "_").concat(template, "_").concat(request.angle || 'none', "_").concat(request.platform || 'none');
                        cacheService = CacheService_1.CacheService.getInstance();
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, cacheService.get(cacheKey)];
                    case 2:
                        cachedCaption = _e.sent();
                        if (cachedCaption) {
                            logger_1.log.info({ assetId: assetId, cacheKey: cacheKey }, 'Caption served from cache');
                            return [2 /*return*/, cachedCaption];
                        }
                        assetTypeDescription = '';
                        if (asset.mimeType.startsWith('image/')) {
                            assetTypeDescription = "image named \"".concat(asset.originalName, "\"");
                        }
                        else if (asset.mimeType.startsWith('video/')) {
                            assetTypeDescription = "video named \"".concat(asset.originalName, "\"");
                        }
                        else {
                            assetTypeDescription = "media file named \"".concat(asset.originalName, "\"");
                        }
                        templateConfig = exports.CAPTION_TEMPLATES[template];
                        angleConfig = request.angle ? exports.CAPTION_ANGLES[request.angle] : null;
                        angleContext = angleConfig
                            ? "\n\nCaption Angle: ".concat(angleConfig.name, "\n").concat(angleConfig.prompt, "\nFocus: ").concat(angleConfig.focus)
                            : '';
                        campaignContext = request.campaignObjective
                            ? "\n\nCampaign Context:\n- Primary Objective: ".concat(request.campaignObjective, " (optimize caption for this goal)\n- Funnel Stage: ").concat(request.funnelStage || 'awareness', " (adjust messaging depth accordingly)\n- Target Audience: ").concat(request.targetAudience || 'general audience', "\n- Brand Personality: ").concat(request.brandPersonality || 'professional', "\n- Value Proposition: ").concat(request.valueProposition || 'quality and innovation')
                            : '';
                        constraintsContext = request.mustIncludePhrases || request.mustExcludePhrases
                            ? "\n\nRequired Constraints:\n".concat(request.mustIncludePhrases && request.mustIncludePhrases.length > 0 ? "- MUST include these phrases: ".concat(request.mustIncludePhrases.join(', ')) : '', "\n").concat(request.mustExcludePhrases && request.mustExcludePhrases.length > 0 ? "- MUST NOT include these phrases: ".concat(request.mustExcludePhrases.join(', ')) : '')
                            : '';
                        platformPreset = request.platform
                            ? exports.PLATFORM_PRESETS[request.platform]
                            : null;
                        platformContext = platformPreset
                            ? "\n\nPlatform: ".concat(platformPreset.name, "\n- Tone: ").concat(platformPreset.tone, "\n- Ideal Length: ~").concat(platformPreset.idealLength, " characters (max ").concat(platformPreset.maxLength, ")\n- Hashtag Strategy: ").concat(platformPreset.hashtagStrategy, "\n- Emoji Usage: ").concat(platformPreset.emojiUsage, "\n- Style: ").concat(platformPreset.style, "\n- Guidelines: ").concat(platformPreset.guidelines.join('; '))
                            : request.platform
                                ? "\n\nPlatform: ".concat(request.platform, "\n").concat(request.platform === 'ig-feed' || request.platform === 'ig-story' ? '- Use casual, visual-first language with emojis' : '', "\n").concat(request.platform === 'fb-feed' || request.platform === 'fb-story' ? '- Use community-focused, conversational tone' : '', "\n").concat(request.platform === 'li-feed' ? '- Use professional, value-driven language, minimal emojis' : '')
                                : '';
                        referenceStyleContext = request.learnedStyleProfile
                            ? "\n\nReference Style (MATCH THIS CLOSELY):\n".concat(styleAnalyzer_1.StyleAnalyzer.styleProfileToPrompt(request.learnedStyleProfile), "\n\nStyle Examples:\n").concat(request.referenceCaptions
                                ? request.referenceCaptions
                                    .slice(0, 3)
                                    .map(function (ref, idx) { return "Example ".concat(idx + 1, ": \"").concat(ref, "\""); })
                                    .join('\n')
                                : '', "\n\nImportant: Maintain the same tone, vocabulary, structure, and style patterns as the examples above.")
                            : '';
                        systemPrompt = "You are a professional social media caption writer. Your task is to create engaging, on-brand captions for visual content.\n\nBrand Voice Instructions:\n".concat(brandVoicePrompt).concat(campaignContext).concat(constraintsContext).concat(platformContext).concat(referenceStyleContext).concat(angleContext, "\n\nTemplate Style: ").concat(templateConfig.name, "\n").concat(templateConfig.prompt, "\nTarget Length: ").concat(templateConfig.length, "\nStyle Guide: ").concat(templateConfig.style, "\n\nGuidelines:\n- Follow the template style exactly\n- Match the brand voice consistently").concat(referenceStyleContext ? '\n- CRITICAL: Match the reference style patterns closely' : '', "\n- Align with campaign objective and funnel stage").concat(angleConfig ? "\n- Use the ".concat(angleConfig.name, " angle to differentiate this variation") : '', "\n- Focus on the visual content's story or message\n- Write compelling content that drives engagement\n- Respect all required constraints (must include/exclude phrases)");
                        userPrompt = "Write a social media caption for this ".concat(assetTypeDescription, ". ").concat(assetDescription ? "Additional context: ".concat(assetDescription) : '', "\n\nCreate a caption that aligns with the brand voice and would work well for social media platforms.");
                        return [4 /*yield*/, openai.chat.completions.create({
                                model: 'gpt-3.5-turbo',
                                messages: [
                                    {
                                        role: 'system',
                                        content: systemPrompt,
                                    },
                                    {
                                        role: 'user',
                                        content: userPrompt,
                                    },
                                ],
                                max_tokens: 200,
                                temperature: 0.7,
                            })];
                    case 3:
                        completion = _e.sent();
                        caption = (_d = (_c = (_b = completion.choices[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) === null || _d === void 0 ? void 0 : _d.trim();
                        if (!caption) {
                            throw new Error('Failed to generate caption: No content returned from AI');
                        }
                        // Cache the generated caption for future requests
                        return [4 /*yield*/, cacheService.set(cacheKey, caption, 24 * 60 * 60 * 1000)]; // Cache for 24 hours
                    case 4:
                        // Cache the generated caption for future requests
                        _e.sent(); // Cache for 24 hours
                        return [2 /*return*/, caption];
                    case 5:
                        error_1 = _e.sent();
                        logger_1.log.error({ err: error_1, assetId: assetId }, "Error generating caption for asset");
                        if (error_1 instanceof Error) {
                            // Return a fallback caption if AI generation fails
                            return [2 /*return*/, "Check out this ".concat((asset === null || asset === void 0 ? void 0 : asset.originalName) || 'content', "! \uD83C\uDFA8 #creative #inspiration")];
                        }
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate structured ad copy (headline, body, CTA)
     */
    CaptionGenerator.generateAdCopy = function (request, angle) {
        return __awaiter(this, void 0, void 0, function () {
            var assetId, workspaceId, brandVoicePrompt, asset, cacheKey, cacheService, cachedAdCopy, assetTypeDescription, angleConfig, angleContext, campaignContext, constraintsContext, platformPreset, platformContext, systemPrompt, userPrompt, completion, content, headlineMatch, bodyMatch, ctaMatch, headline, bodyText, ctaText, result, error_2;
            var _a, _b, _c, _d, _e, _f;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        assetId = request.assetId, workspaceId = request.workspaceId, brandVoicePrompt = request.brandVoicePrompt;
                        asset = auth_1.AuthModel.getAssetById(assetId);
                        if (!asset) {
                            throw new Error("Asset ".concat(assetId, " not found"));
                        }
                        cacheKey = "adcopy_".concat(assetId, "_").concat(angle || 'none', "_").concat(request.platform || 'none');
                        cacheService = CacheService_1.CacheService.getInstance();
                        _g.label = 1;
                    case 1:
                        _g.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, cacheService.get(cacheKey)];
                    case 2:
                        cachedAdCopy = _g.sent();
                        if (cachedAdCopy) {
                            logger_1.log.info({ assetId: assetId, cacheKey: cacheKey }, 'Ad copy served from cache');
                            return [2 /*return*/, cachedAdCopy];
                        }
                        assetTypeDescription = '';
                        if (asset.mimeType.startsWith('image/')) {
                            assetTypeDescription = "image named \"".concat(asset.originalName, "\"");
                        }
                        else if (asset.mimeType.startsWith('video/')) {
                            assetTypeDescription = "video named \"".concat(asset.originalName, "\"");
                        }
                        else {
                            assetTypeDescription = "media file named \"".concat(asset.originalName, "\"");
                        }
                        angleConfig = angle ? exports.CAPTION_ANGLES[angle] : null;
                        angleContext = angleConfig
                            ? "\n\nCaption Angle: ".concat(angleConfig.name, "\n").concat(angleConfig.prompt, "\nFocus: ").concat(angleConfig.focus)
                            : '';
                        campaignContext = request.campaignObjective
                            ? "\n\nCampaign Context:\n- Primary Objective: ".concat(request.campaignObjective, "\n- Funnel Stage: ").concat(request.funnelStage || 'awareness', "\n- Target Audience: ").concat(request.targetAudience || 'general audience', "\n- Brand Personality: ").concat(request.brandPersonality || 'professional', "\n- Value Proposition: ").concat(request.valueProposition || 'quality and innovation')
                            : '';
                        constraintsContext = request.mustIncludePhrases || request.mustExcludePhrases
                            ? "\n\nRequired Constraints:\n".concat(request.mustIncludePhrases && request.mustIncludePhrases.length > 0 ? "- MUST include: ".concat(request.mustIncludePhrases.join(', ')) : '', "\n").concat(request.mustExcludePhrases && request.mustExcludePhrases.length > 0 ? "- MUST NOT include: ".concat(request.mustExcludePhrases.join(', ')) : '')
                            : '';
                        platformPreset = request.platform
                            ? exports.PLATFORM_PRESETS[request.platform]
                            : null;
                        platformContext = platformPreset
                            ? "\n\nPlatform: ".concat(platformPreset.name, "\n- Tone: ").concat(platformPreset.tone, "\n- Style: ").concat(platformPreset.style, "\n- Emoji Usage: ").concat(platformPreset.emojiUsage)
                            : request.platform
                                ? "\n\nPlatform: ".concat(request.platform, "\n").concat(request.platform === 'ig-feed' || request.platform === 'ig-story' ? '- Casual, visual-first with emojis' : '', "\n").concat(request.platform === 'fb-feed' || request.platform === 'fb-story' ? '- Community-focused, conversational' : '', "\n").concat(request.platform === 'li-feed' ? '- Professional, value-driven, minimal emojis' : '')
                                : '';
                        systemPrompt = "You are a professional ad copywriter specializing in social media advertising.\n\nBrand Voice Instructions:\n".concat(brandVoicePrompt).concat(campaignContext).concat(constraintsContext).concat(platformContext).concat(angleContext, "\n\nYour task is to create structured ad copy with three distinct components:\n\n1. HEADLINE (5-10 words):\n   - Attention-grabbing and benefit-focused\n   - Clear value proposition\n   - Strong emotional hook or compelling question\n\n2. BODY TEXT (50-125 characters):\n   - Expand on the headline\n   - Include key benefit or feature\n   - Create desire or urgency\n   - Must be concise and punchy\n\n3. CALL-TO-ACTION (2-4 words):\n   - Action-oriented and clear\n   - Aligned with campaign objective\n   - Creates urgency when appropriate\n\nGuidelines:\n- Match brand voice consistently across all components\n- Align with campaign objective").concat(angleConfig ? " and ".concat(angleConfig.name, " angle") : '', "\n- Respect all required constraints\n- Keep each component within character limits\n- Make it suitable for paid social media ads\n\nReturn ONLY in this exact format:\nHEADLINE: [your headline here]\nBODY: [your body text here]\nCTA: [your call-to-action here]");
                        userPrompt = "Create structured ad copy for this ".concat(assetTypeDescription, ".");
                        return [4 /*yield*/, openai.chat.completions.create({
                                model: 'gpt-3.5-turbo',
                                messages: [
                                    {
                                        role: 'system',
                                        content: systemPrompt,
                                    },
                                    {
                                        role: 'user',
                                        content: userPrompt,
                                    },
                                ],
                                max_tokens: 200,
                                temperature: 0.7,
                            })];
                    case 3:
                        completion = _g.sent();
                        content = (_c = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
                        if (!content) {
                            throw new Error('No content returned from AI');
                        }
                        headlineMatch = content.match(/HEADLINE:\s*(.+?)(?:\n|$)/i);
                        bodyMatch = content.match(/BODY:\s*(.+?)(?:\n|$)/i);
                        ctaMatch = content.match(/CTA:\s*(.+?)(?:\n|$)/i);
                        headline = ((_d = headlineMatch === null || headlineMatch === void 0 ? void 0 : headlineMatch[1]) === null || _d === void 0 ? void 0 : _d.trim()) || 'Discover Something Amazing';
                        bodyText = ((_e = bodyMatch === null || bodyMatch === void 0 ? void 0 : bodyMatch[1]) === null || _e === void 0 ? void 0 : _e.trim()) ||
                            'Transform your experience with quality you can trust.';
                        ctaText = ((_f = ctaMatch === null || ctaMatch === void 0 ? void 0 : ctaMatch[1]) === null || _f === void 0 ? void 0 : _f.trim()) || 'Learn More';
                        result = {
                            headline: headline.slice(0, 60),
                            bodyText: bodyText.slice(0, 125),
                            ctaText: ctaText.slice(0, 20),
                        };
                        // Cache the generated ad copy for future requests
                        return [4 /*yield*/, cacheService.set(cacheKey, result, 24 * 60 * 60 * 1000)]; // Cache for 24 hours
                    case 4:
                        // Cache the generated ad copy for future requests
                        _g.sent(); // Cache for 24 hours
                        return [2 /*return*/, result];
                    case 5:
                        error_2 = _g.sent();
                        logger_1.log.error({ err: error_2, assetId: assetId }, "Error generating ad copy for asset");
                        // Return fallback ad copy
                        return [2 /*return*/, {
                                headline: 'Discover Something Amazing',
                                bodyText: 'Experience quality and innovation designed for you.',
                                ctaText: 'Learn More',
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate multiple caption variations for a single asset
     */
    CaptionGenerator.generateVariations = function (request, count, captionId) {
        return __awaiter(this, void 0, void 0, function () {
            var angles, variations, i, angle, caption, captionRecord, assetId, scores, asset, brandKit, adCopy, generateAdCopy, adCopyResult, error_3;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        angles = [
                            'emotional',
                            'data-driven',
                            'question-based',
                            'cta-focused',
                            'educational',
                        ];
                        variations = [];
                        i = 0;
                        _b.label = 1;
                    case 1:
                        if (!(i < count)) return [3 /*break*/, 12];
                        angle = angles[i % angles.length];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 10, , 11]);
                        return [4 /*yield*/, this.generateCaption(__assign(__assign({}, request), { angle: angle }))];
                    case 3:
                        caption = _b.sent();
                        variations.push(caption);
                        if (!captionId) return [3 /*break*/, 7];
                        captionRecord = auth_1.AuthModel.getCaptionById(captionId);
                        assetId = captionRecord === null || captionRecord === void 0 ? void 0 : captionRecord.assetId;
                        scores = void 0;
                        if (assetId) {
                            asset = auth_1.AuthModel.getAssetById(assetId);
                            brandKit = asset
                                ? auth_1.AuthModel.getBrandKitByWorkspace(asset.workspaceId)
                                : null;
                            if (brandKit) {
                                scores = CaptionScorer.scoreCaptionVariation(caption, brandKit.voicePrompt, {
                                    objective: request.campaignObjective,
                                    targetAudience: request.targetAudience || brandKit.targetAudience,
                                    brandPersonality: brandKit.brandPersonality,
                                });
                            }
                        }
                        adCopy = undefined;
                        generateAdCopy = ((_a = request.platform) === null || _a === void 0 ? void 0 : _a.includes('ad')) || false // Check if ad copy mode is requested
                        ;
                        if (!generateAdCopy) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.generateAdCopy(__assign(__assign({}, request), { assetId: (captionRecord === null || captionRecord === void 0 ? void 0 : captionRecord.assetId) || '' }), request.angle)];
                    case 4:
                        adCopyResult = _b.sent();
                        adCopy = adCopyResult;
                        _b.label = 5;
                    case 5: return [4 /*yield*/, auth_1.AuthModel.addCaptionVariation(captionId, {
                            text: caption,
                            status: 'completed',
                            approvalStatus: 'pending',
                            qualityScore: scores === null || scores === void 0 ? void 0 : scores.totalScore,
                            scoreBreakdown: scores
                                ? {
                                    clarity: scores.clarity,
                                    originality: scores.originality,
                                    brandConsistency: scores.brandConsistency,
                                    platformRelevance: scores.platformRelevance,
                                }
                                : undefined,
                            adCopy: adCopy,
                            generatedAt: new Date(),
                        })];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7:
                        if (!(i < count - 1)) return [3 /*break*/, 9];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 500); })];
                    case 8:
                        _b.sent();
                        _b.label = 9;
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        error_3 = _b.sent();
                        logger_1.log.error({ err: error_3, variationIndex: i + 1 }, "Failed to generate variation");
                        return [3 /*break*/, 11];
                    case 11:
                        i++;
                        return [3 /*break*/, 1];
                    case 12: return [2 /*return*/, variations];
                }
            });
        });
    };
    /**
     * Process a batch job - generate captions and render images for all assets
     * This runs in a single thread (sequentially) as per v1 requirements
     */
    CaptionGenerator.processBatchJob = function (jobId) {
        return __awaiter(this, void 0, void 0, function () {
            var job, brandKit, workspace, agency, processedCount, _i, _a, assetId, asset, caption, campaign, generationRequest, captionText, startCaptionGenTime, variationsCount, isAdCopyMode, adCopyGenerationRequest, durationSec, assetPath, renderedFormats, _b, renderedFormats_1, rendered, error_4, caption, error_5;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 12, , 13]);
                        job = auth_1.AuthModel.getBatchJobById(jobId);
                        if (!job) {
                            throw new Error("Batch job ".concat(jobId, " not found"));
                        }
                        if (job.status !== 'pending') {
                            throw new Error("Batch job ".concat(jobId, " is not in pending status"));
                        }
                        // Update job status to processing
                        auth_1.AuthModel.updateBatchJob(jobId, {
                            status: 'processing',
                            startedAt: new Date(),
                        });
                        brandKit = auth_1.AuthModel.getBrandKitByWorkspace(job.workspaceId);
                        if (!brandKit) {
                            throw new Error("No brand kit found for workspace ".concat(job.workspaceId));
                        }
                        workspace = auth_1.AuthModel.getWorkspaceById(job.workspaceId);
                        agency = workspace
                            ? auth_1.AuthModel.getAgencyById(workspace.agencyId)
                            : null;
                        processedCount = 0;
                        _i = 0, _a = job.assetIds;
                        _d.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 11];
                        assetId = _a[_i];
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 7, , 8]);
                        asset = auth_1.AuthModel.getAssetById(assetId);
                        if (!asset) {
                            throw new Error("Asset ".concat(assetId, " not found"));
                        }
                        caption = auth_1.AuthModel.getCaptionsByAsset(assetId)[0];
                        if (!caption) {
                            caption = auth_1.AuthModel.createCaption(assetId, job.workspaceId, job.campaignId);
                        }
                        // Update caption status to generating
                        auth_1.AuthModel.updateCaption(caption.id, {
                            status: 'generating',
                        });
                        campaign = job.campaignId
                            ? auth_1.AuthModel.getCampaignById(job.campaignId)
                            : null;
                        generationRequest = {
                            assetId: assetId,
                            workspaceId: job.workspaceId,
                            brandVoicePrompt: brandKit.voicePrompt,
                            template: job.template || 'descriptive',
                            // Campaign context for quality
                            campaignObjective: campaign === null || campaign === void 0 ? void 0 : campaign.objective,
                            funnelStage: campaign === null || campaign === void 0 ? void 0 : campaign.funnelStage,
                            targetAudience: (campaign === null || campaign === void 0 ? void 0 : campaign.targetAudience) || brandKit.targetAudience,
                            brandPersonality: brandKit.brandPersonality,
                            valueProposition: brandKit.valueProposition,
                            mustIncludePhrases: campaign === null || campaign === void 0 ? void 0 : campaign.mustIncludePhrases,
                            mustExcludePhrases: campaign === null || campaign === void 0 ? void 0 : campaign.mustExcludePhrases,
                            platform: (_c = campaign === null || campaign === void 0 ? void 0 : campaign.placements) === null || _c === void 0 ? void 0 : _c[0],
                        };
                        return [4 /*yield*/, this.generateCaption(generationRequest)];
                    case 3:
                        captionText = _d.sent();
                        startCaptionGenTime = Date.now();
                        // Add the primary generated caption as a variation
                        auth_1.AuthModel.addCaptionVariation(caption.id, {
                            text: captionText,
                            status: 'completed',
                            approvalStatus: 'pending',
                            generatedAt: new Date(),
                        });
                        variationsCount = 3 // Default to 3 variations including the primary
                        ;
                        isAdCopyMode = job.generateAdCopy === true;
                        adCopyGenerationRequest = isAdCopyMode
                            ? __assign(__assign({}, generationRequest), { platform: generationRequest.platform
                                    ? "".concat(generationRequest.platform, "_ad")
                                    : 'ig-feed_ad' }) : generationRequest;
                        return [4 /*yield*/, this.generateVariations(adCopyGenerationRequest, variationsCount - 1, caption.id)
                            // Track caption generation metrics
                        ];
                    case 4:
                        _d.sent();
                        durationSec = (Date.now() - startCaptionGenTime) / 1000;
                        MetricsService_1.MetricsService.trackCaptionGeneration(job.workspaceId, job.campaignId, durationSec);
                        if (!agency) return [3 /*break*/, 6];
                        assetPath = path_1.default.join(process.cwd(), asset.url);
                        return [4 /*yield*/, imageRenderer_1.ImageRenderer.renderMultipleFormats(assetPath, captionText, brandKit, agency, job.workspaceId)
                            // Create generated asset records for each rendered format
                        ];
                    case 5:
                        renderedFormats = _d.sent();
                        // Create generated asset records for each rendered format
                        for (_b = 0, renderedFormats_1 = renderedFormats; _b < renderedFormats_1.length; _b++) {
                            rendered = renderedFormats_1[_b];
                            auth_1.AuthModel.createGeneratedAsset({
                                jobId: jobId,
                                sourceAssetId: assetId,
                                workspaceId: job.workspaceId,
                                campaignId: job.campaignId, // Pass campaign ID to connect the asset to the campaign
                                captionId: caption.id,
                                approvalStatus: 'pending',
                                format: rendered.format,
                                layout: rendered.layout,
                                caption: captionText,
                                imageUrl: rendered.imageUrl,
                                thumbnailUrl: rendered.thumbnailUrl,
                                watermark: agency.planType === 'free',
                            });
                        }
                        _d.label = 6;
                    case 6:
                        processedCount++;
                        return [3 /*break*/, 8];
                    case 7:
                        error_4 = _d.sent();
                        logger_1.log.error({ err: error_4, assetId: assetId }, "Error processing asset");
                        caption = auth_1.AuthModel.getCaptionsByAsset(assetId)[0];
                        if (caption) {
                            auth_1.AuthModel.updateCaption(caption.id, {
                                status: 'failed',
                                errorMessage: error_4 instanceof Error ? error_4.message : 'Unknown error',
                            });
                        }
                        return [3 /*break*/, 8];
                    case 8:
                        // Update job progress
                        auth_1.AuthModel.updateBatchJob(jobId, {
                            processedCount: processedCount,
                        });
                        // Longer delay between requests when rendering images
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 2000); })];
                    case 9:
                        // Longer delay between requests when rendering images
                        _d.sent();
                        _d.label = 10;
                    case 10:
                        _i++;
                        return [3 /*break*/, 1];
                    case 11:
                        // Mark job as completed
                        auth_1.AuthModel.updateBatchJob(jobId, {
                            status: 'completed',
                            completedAt: new Date(),
                        });
                        return [3 /*break*/, 13];
                    case 12:
                        error_5 = _d.sent();
                        logger_1.log.error({ err: error_5, jobId: jobId }, "Error processing batch job");
                        // Mark job as failed
                        auth_1.AuthModel.updateBatchJob(jobId, {
                            status: 'failed',
                            completedAt: new Date(),
                            errorMessage: error_5 instanceof Error ? error_5.message : 'Unknown error',
                        });
                        return [3 /*break*/, 13];
                    case 13: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Start batch generation for a list of assets
     */
    CaptionGenerator.startBatchGeneration = function (workspaceId, assetIds) {
        return __awaiter(this, void 0, void 0, function () {
            var workspace, brandKit, _i, assetIds_1, assetId, asset, job;
            return __generator(this, function (_a) {
                workspace = auth_1.AuthModel.getWorkspaceById(workspaceId);
                if (!workspace) {
                    throw new Error('Workspace not found');
                }
                brandKit = auth_1.AuthModel.getBrandKitByWorkspace(workspaceId);
                if (!brandKit) {
                    throw new Error('No brand kit found for this workspace. Please create a brand kit first.');
                }
                // Validate assets
                if (assetIds.length === 0) {
                    throw new Error('No assets provided for generation');
                }
                if (assetIds.length > 30) {
                    throw new Error('Maximum 30 assets allowed per batch');
                }
                // Verify all assets exist and belong to workspace
                for (_i = 0, assetIds_1 = assetIds; _i < assetIds_1.length; _i++) {
                    assetId = assetIds_1[_i];
                    asset = auth_1.AuthModel.getAssetById(assetId);
                    if (!asset) {
                        throw new Error("Asset ".concat(assetId, " not found"));
                    }
                    if (asset.workspaceId !== workspaceId) {
                        throw new Error("Asset ".concat(assetId, " does not belong to this workspace"));
                    }
                }
                job = auth_1.AuthModel.createBatchJob(workspaceId, assetIds);
                // Start processing in background
                this.processBatchJob(job.id).catch(function (error) {
                    logger_1.log.error({ err: error, jobId: job.id }, "Background processing failed for job");
                });
                return [2 /*return*/, {
                        jobId: job.id,
                        message: "Started batch generation for ".concat(assetIds.length, " assets"),
                    }];
            });
        });
    };
    return CaptionGenerator;
}());
exports.CaptionGenerator = CaptionGenerator;
