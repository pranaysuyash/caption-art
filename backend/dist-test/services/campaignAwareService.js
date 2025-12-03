"use strict";
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
exports.CampaignAwareService = void 0;
var CampaignAwareService = /** @class */ (function () {
    function CampaignAwareService() {
    }
    /**
     * Build comprehensive campaign context from campaign and brand kit
     */
    CampaignAwareService.prototype.buildCampaignContext = function (campaign, brandKit) {
        var _a, _b, _c, _d, _e;
        var brief = campaign.brief;
        // Extract and structure target audience information
        var targetAudience = {
            demographics: ((_a = brief === null || brief === void 0 ? void 0 : brief.primaryAudience) === null || _a === void 0 ? void 0 : _a.demographics) || brandKit.targetAudience || '',
            psychographics: ((_b = brief === null || brief === void 0 ? void 0 : brief.primaryAudience) === null || _b === void 0 ? void 0 : _b.psychographics) || '',
            painPoints: ((_c = brief === null || brief === void 0 ? void 0 : brief.primaryAudience) === null || _c === void 0 ? void 0 : _c.painPoints) || [],
            motivations: ((_d = brief === null || brief === void 0 ? void 0 : brief.primaryAudience) === null || _d === void 0 ? void 0 : _d.motivations) || [],
            challenges: ((_e = brief === null || brief === void 0 ? void 0 : brief.primaryAudience) === null || _e === void 0 ? void 0 : _e.challenges) || [],
        };
        // Build messaging strategy from campaign and brand data
        var messagingStrategy = {
            primaryValueProp: (brief === null || brief === void 0 ? void 0 : brief.keyMessage) || brandKit.valueProposition || 'High quality products and services',
            emotionalAppeal: (brief === null || brief === void 0 ? void 0 : brief.emotionalAppeal) || 'Trust and reliability',
            differentiators: __spreadArray([
                brandKit.uniqueValue || 'Quality and innovation'
            ], ((brief === null || brief === void 0 ? void 0 : brief.differentiators) || []), true),
            trustSignals: __spreadArray([
                brandKit.brandPersonality || 'Professional and trustworthy'
            ], ((brief === null || brief === void 0 ? void 0 : brief.socialProof) || []), true),
        };
        // Determine content guidelines
        var contentGuidelines = {
            tone: this.extractToneGuidelines(campaign, brandKit),
            style: this.extractStyleGuidelines(campaign, brandKit),
            keywords: this.extractKeywords(campaign, brandKit),
            avoidWords: (brief === null || brief === void 0 ? void 0 : brief.avoidWords) || [],
        };
        return {
            campaign: campaign,
            brandKit: brandKit,
            targetAudience: targetAudience,
            messagingStrategy: messagingStrategy,
            contentGuidelines: contentGuidelines,
        };
    };
    /**
     * Generate campaign-aware prompt for AI generation
     */
    CampaignAwareService.prototype.generateCampaignAwarePrompt = function (campaignContext, assetContext, variationType, platforms, contentType) {
        var campaign = campaignContext.campaign, brandKit = campaignContext.brandKit, targetAudience = campaignContext.targetAudience, messagingStrategy = campaignContext.messagingStrategy, contentGuidelines = campaignContext.contentGuidelines;
        var audienceSection = this.buildAudienceSection(targetAudience);
        var brandSection = this.buildBrandSection(brandKit);
        var campaignSection = this.buildCampaignSection(campaign);
        var messagingSection = this.buildMessagingSection(messagingStrategy);
        var guidelinesSection = this.buildGuidelinesSection(contentGuidelines);
        var assetSection = this.buildAssetSection(assetContext);
        var platformSection = this.buildPlatformSection(platforms);
        var variationSection = this.buildVariationSection(variationType);
        var contentTypeInstructions = this.getContentTypeInstructions(contentType);
        return "\nCAMPAIGN-AWARE CONTENT GENERATION\n\n".concat(campaignSection, "\n\n").concat(brandSection, "\n\n").concat(audienceSection, "\n\n").concat(messagingSection, "\n\n").concat(assetSection, "\n\nCONTENT TYPE: ").concat(contentType.toUpperCase(), "\n").concat(contentTypeInstructions, "\n\nPLATFORMS: ").concat(platforms.join(', '), "\n").concat(platformSection, "\n\nVARIATION TYPE: ").concat(variationType, "\n").concat(variationSection, "\n\nCONTENT GUIDELINES:\n").concat(guidelinesSection, "\n\nOUTPUT REQUIREMENTS:\nGenerate ").concat(contentType, " that deeply integrates the campaign context, brand identity, and audience needs. The content should:\n\n1. Reflect the campaign's primary objective: ").concat(campaign.objective, "\n2. Speak directly to the target audience's pain points and motivations\n3. Use the brand's unique voice and personality\n4. Incorporate the primary value proposition: ").concat(messagingStrategy.primaryValueProp, "\n5. Align with the emotional appeal: ").concat(messagingStrategy.emotionalAppeal, "\n6. Highlight key differentiators: ").concat(messagingStrategy.differentiators.join(', '), "\n7. Include trust signals: ").concat(messagingStrategy.trustSignals.join(', '), "\n8. Use specified tone: ").concat(contentGuidelines.tone.join(', '), "\n9. Incorporate keywords: ").concat(contentGuidelines.keywords.join(', '), "\n10. Avoid restricted words: ").concat(contentGuidelines.avoidWords.join(', ') || 'None specified', "\n\n").concat(this.getSpecificOutputFormat(contentType), "\n\nCAMPAIGN-AWARE BEST PRACTICES:\n- Reference specific campaign goals and metrics where relevant\n- Use campaign-specific terminology and concepts\n- Maintain consistency with previous campaign messaging\n- Address audience segments identified in the campaign\n- Reinforce the campaign's core message and value proposition\n- Use emotional triggers relevant to the campaign's psychological approach\n- Ensure content drives toward campaign conversion goals\n- Align with campaign stage (awareness, consideration, conversion, retention)\n\nGenerate compelling, campaign-aware ").concat(contentType, " that feels authentic to the brand and resonates with the target audience.\n    ").trim();
    };
    /**
     * Extract tone guidelines from campaign and brand
     */
    CampaignAwareService.prototype.extractToneGuidelines = function (campaign, brandKit) {
        var _a;
        var tones = new Set();
        // Brand personality tones
        if (brandKit.brandPersonality) {
            var personality = brandKit.brandPersonality.toLowerCase();
            if (personality.includes('professional'))
                tones.add('professional');
            if (personality.includes('friendly'))
                tones.add('friendly');
            if (personality.includes('casual'))
                tones.add('casual');
            if (personality.includes('urgent'))
                tones.add('urgent');
            if (personality.includes('luxury'))
                tones.add('luxury');
            if (personality.includes('innovative'))
                tones.add('innovative');
            if (personality.includes('trustworthy'))
                tones.add('trustworthy');
        }
        // Campaign-specific tones
        var brief = campaign.brief;
        if (brief === null || brief === void 0 ? void 0 : brief.tone) {
            brief.tone.forEach(function (tone) { return tones.add(tone); });
        }
        // Default tones based on campaign objective
        var objectiveTones = {
            awareness: ['informative', 'engaging', 'curious'],
            consideration: ['persuasive', 'helpful', 'educational'],
            conversion: ['urgent', 'compelling', 'action-oriented'],
            retention: ['appreciative', 'valuable', 'community-focused'],
        };
        (_a = objectiveTones[campaign.objective]) === null || _a === void 0 ? void 0 : _a.forEach(function (tone) {
            return tones.add(tone);
        });
        return Array.from(tones).slice(0, 5); // Limit to 5 most relevant tones
    };
    /**
     * Extract style guidelines from campaign and brand
     */
    CampaignAwareService.prototype.extractStyleGuidelines = function (campaign, brandKit) {
        var _a, _b;
        var styles = [];
        // Brand colors and visual style
        if ((_a = brandKit.colors) === null || _a === void 0 ? void 0 : _a.primary) {
            styles.push("Primary brand color: ".concat(brandKit.colors.primary));
        }
        if ((_b = brandKit.colors) === null || _b === void 0 ? void 0 : _b.secondary) {
            styles.push("Secondary brand color: ".concat(brandKit.colors.secondary));
        }
        // Campaign style preferences
        var brief = campaign.brief;
        if (brief === null || brief === void 0 ? void 0 : brief.style) {
            brief.style.forEach(function (style) { return styles.push(style); });
        }
        // Default style guidelines
        styles.push('Consistent brand voice throughout');
        styles.push('Clear and concise messaging');
        styles.push('Mobile-first approach for social media');
        return styles;
    };
    /**
     * Extract keywords from campaign and brand
     */
    CampaignAwareService.prototype.extractKeywords = function (campaign, brandKit) {
        var keywords = new Set();
        // Brand keywords
        if (brandKit.keywords) {
            brandKit.keywords.forEach(function (keyword) { return keywords.add(keyword); });
        }
        // Campaign keywords
        var brief = campaign.brief;
        if (brief === null || brief === void 0 ? void 0 : brief.keywords) {
            brief.keywords.forEach(function (keyword) { return keywords.add(keyword); });
        }
        // Extract keywords from campaign name and key message
        if (campaign.name) {
            campaign.name.split(/\s+/).forEach(function (word) {
                if (word.length > 3)
                    keywords.add(word.toLowerCase());
            });
        }
        if (brief === null || brief === void 0 ? void 0 : brief.keyMessage) {
            brief.keyMessage.split(/\s+/).forEach(function (word) {
                if (word.length > 3)
                    keywords.add(word.toLowerCase());
            });
        }
        return Array.from(keywords).slice(0, 10); // Limit to 10 most relevant keywords
    };
    /**
     * Build audience section of prompt
     */
    CampaignAwareService.prototype.buildAudienceSection = function (targetAudience) {
        var _a, _b, _c;
        return "\nTARGET AUDIENCE:\nDemographics: ".concat(targetAudience.demographics || 'General audience', "\nPsychographics: ").concat(targetAudience.psychographics || 'Standard consumer behavior', "\nPain Points: ").concat(((_a = targetAudience.painPoints) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'Not specified', "\nMotivations: ").concat(((_b = targetAudience.motivations) === null || _b === void 0 ? void 0 : _b.join(', ')) || 'Not specified', "\nChallenges: ").concat(((_c = targetAudience.challenges) === null || _c === void 0 ? void 0 : _c.join(', ')) || 'Not specified', "\n    ").trim();
    };
    /**
     * Build brand section of prompt
     */
    CampaignAwareService.prototype.buildBrandSection = function (brandKit) {
        var _a, _b, _c;
        return "\nBRAND IDENTITY:\nBrand Name: ".concat(brandKit.name || 'Not specified', "\nBrand Personality: ").concat(brandKit.brandPersonality || 'Professional and trustworthy', "\nValue Proposition: ").concat(brandKit.valueProposition || 'High quality products and services', "\nUnique Value: ").concat(brandKit.uniqueValue || 'Quality and innovation', "\nTarget Audience: ").concat(brandKit.targetAudience || 'General consumers', "\nBrand Colors: ").concat(((_a = brandKit.colors) === null || _a === void 0 ? void 0 : _a.primary) || 'Not specified', ", ").concat(((_b = brandKit.colors) === null || _b === void 0 ? void 0 : _b.secondary) || 'Not specified', "\nKeywords: ").concat(((_c = brandKit.keywords) === null || _c === void 0 ? void 0 : _c.join(', ')) || 'Not specified', "\n    ").trim();
    };
    /**
     * Build campaign section of prompt
     */
    CampaignAwareService.prototype.buildCampaignSection = function (campaign) {
        var _a, _b, _c;
        var brief = campaign.brief;
        return "\nCAMPAIGN DETAILS:\nCampaign Name: ".concat(campaign.name, "\nObjective: ").concat(campaign.objective, "\nPrimary CTA: ").concat(campaign.primaryCTA || 'Learn more', "\nKey Message: ").concat((brief === null || brief === void 0 ? void 0 : brief.keyMessage) || 'Not specified', "\nEmotional Appeal: ").concat((brief === null || brief === void 0 ? void 0 : brief.emotionalAppeal) || 'Trust and reliability', "\nPrimary Audience: ").concat(((_a = brief === null || brief === void 0 ? void 0 : brief.primaryAudience) === null || _a === void 0 ? void 0 : _a.demographics) || 'Not specified', "\nDifferentiators: ").concat(((_b = brief === null || brief === void 0 ? void 0 : brief.differentiators) === null || _b === void 0 ? void 0 : _b.join(', ')) || 'Not specified', "\nSocial Proof: ").concat(((_c = brief === null || brief === void 0 ? void 0 : brief.socialProof) === null || _c === void 0 ? void 0 : _c.join(', ')) || 'Not specified', "\nCampaign Stage: ").concat(campaign.objective, " (funnel stage: ").concat(campaign.funnelStage || 'middle', ")\n    ").trim();
    };
    /**
     * Build messaging section of prompt
     */
    CampaignAwareService.prototype.buildMessagingSection = function (messagingStrategy) {
        return "\nMESSAGING STRATEGY:\nPrimary Value Proposition: ".concat(messagingStrategy.primaryValueProp, "\nEmotional Appeal: ").concat(messagingStrategy.emotionalAppeal, "\nKey Differentiators: ").concat(messagingStrategy.differentiators.join(', '), "\nTrust Signals: ").concat(messagingStrategy.trustSignals.join(', '), "\n    ").trim();
    };
    /**
     * Build guidelines section of prompt
     */
    CampaignAwareService.prototype.buildGuidelinesSection = function (contentGuidelines) {
        return "\nCONTENT GUIDELINES:\nTone: ".concat(contentGuidelines.tone.join(', '), "\nStyle: ").concat(contentGuidelines.style.join(', '), "\nKeywords to Include: ").concat(contentGuidelines.keywords.join(', '), "\nWords to Avoid: ").concat(contentGuidelines.avoidWords.join(', ') || 'None specified', "\n    ").trim();
    };
    /**
     * Build asset section of prompt
     */
    CampaignAwareService.prototype.buildAssetSection = function (assetContext) {
        var _a, _b, _c;
        return "\nASSET DETAILS:\nDescription: ".concat(assetContext.description, "\nCategory: ").concat(assetContext.category || 'General', "\nKey Features: ").concat(((_a = assetContext.features) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'Not specified', "\nBenefits: ").concat(((_b = assetContext.benefits) === null || _b === void 0 ? void 0 : _b.join(', ')) || 'Not specified', "\nUse Cases: ").concat(((_c = assetContext.useCases) === null || _c === void 0 ? void 0 : _c.join(', ')) || 'Not specified', "\n    ").trim();
    };
    /**
     * Build platform section of prompt
     */
    CampaignAwareService.prototype.buildPlatformSection = function (platforms) {
        var platformGuidelines = {
            instagram: 'Visual-first, emojis, hashtags, casual tone, stories format',
            facebook: 'Community-focused, detailed descriptions, questions, longer posts',
            linkedin: 'Professional, industry terminology, business value, articles',
        };
        return platforms
            .map(function (platform) { return "- ".concat(platform.charAt(0).toUpperCase() + platform.slice(1), ": ").concat(platformGuidelines[platform]); })
            .join('\n');
    };
    /**
     * Build variation section of prompt
     */
    CampaignAwareService.prototype.buildVariationSection = function (variationType) {
        var variationInstructions = {
            main: 'Main variation: Balanced, professional, and comprehensive. Best all-around performer.',
            alt1: 'Alternative 1: More casual and conversational tone. Uses questions and personal language.',
            alt2: 'Alternative 2: Benefit-focused with strong value propositions. Uses numbers and statistics.',
            alt3: 'Alternative 3: Urgent and direct. Uses scarcity and time-limited language.',
            punchy: 'Punchy: Short, bold, and attention-grabbing. Uses strong words and minimal text.',
            short: 'Short: Concise and to-the-point. Focuses on essential information only.',
            story: 'Story: Narrative-driven with emotional appeal. Uses storytelling techniques.',
        };
        return variationInstructions[variationType] || variationInstructions.main;
    };
    /**
     * Get content type specific instructions
     */
    CampaignAwareService.prototype.getContentTypeInstructions = function (contentType) {
        var instructions = {
            caption: 'Generate engaging social media captions that encourage interaction and sharing.',
            adcopy: 'Generate conversion-focused advertising copy with clear CTAs and value propositions.',
            'video-script': 'Generate compelling video scripts that tell a story and drive action.',
        };
        return instructions[contentType] || instructions.caption;
    };
    /**
     * Get specific output format for each content type
     */
    CampaignAwareService.prototype.getSpecificOutputFormat = function (contentType) {
        var formats = {
            caption: "\nOUTPUT FORMAT:\n{\n  \"caption\": \"Engaging caption text\",\n  \"hashtags\": [\"relevant\", \"hashtags\"],\n  \"emojiPlacement\": \"strategic emoji usage\",\n  \"callToAction\": \"clear engagement prompt\",\n  \"platformSpecific\": {\n    \"instagram\": \"instagram-optimized version\",\n    \"facebook\": \"facebook-optimized version\",\n    \"linkedin\": \"linkedin-optimized version\"\n  }\n}\n      ",
            adcopy: "\nOUTPUT FORMAT:\n{\n  \"headline\": \"Attention-grabbing headline\",\n  \"subheadline\": \"Supporting subheadline\",\n  \"primaryText\": \"Compelling body text\",\n  \"ctaText\": \"Clear call-to-action\",\n  \"platformSpecific\": {\n    \"instagram\": \"instagram-optimized ad copy\",\n    \"facebook\": \"facebook-optimized ad copy\",\n    \"linkedin\": \"linkedin-optimized ad copy\"\n  }\n}\n      ",
            'video-script': "\nOUTPUT FORMAT:\n{\n  \"scenes\": [\n    {\n      \"sceneNumber\": 1,\n      \"type\": \"hook\",\n      \"duration\": 3,\n      \"script\": \"Opening hook\",\n      \"visualNotes\": \"Visual description\"\n    }\n  ],\n  \"totalDuration\": 15,\n  \"cta\": \"Strong call-to-action\",\n  \"platform\": \"primary platform\"\n}\n      ",
        };
        return formats[contentType] || formats.caption;
    };
    /**
     * Analyze campaign context quality and provide recommendations
     */
    CampaignAwareService.prototype.analyzeCampaignContext = function (campaignContext) {
        var score = 0;
        var gaps = [];
        var recommendations = [];
        // Check target audience completeness (25 points)
        if (campaignContext.targetAudience.demographics)
            score += 8;
        else
            gaps.push('Missing target audience demographics');
        if (campaignContext.targetAudience.painPoints && campaignContext.targetAudience.painPoints.length > 0)
            score += 9;
        else
            gaps.push('Missing audience pain points');
        if (campaignContext.targetAudience.motivations && campaignContext.targetAudience.motivations.length > 0)
            score += 8;
        else
            gaps.push('Missing audience motivations');
        // Check messaging strategy (25 points)
        if (campaignContext.messagingStrategy.primaryValueProp)
            score += 10;
        else
            gaps.push('Missing primary value proposition');
        if (campaignContext.messagingStrategy.differentiators.length > 0)
            score += 8;
        else
            gaps.push('Missing brand differentiators');
        if (campaignContext.messagingStrategy.trustSignals.length > 0)
            score += 7;
        else
            gaps.push('Missing trust signals');
        // Check content guidelines (25 points)
        if (campaignContext.contentGuidelines.tone.length > 0)
            score += 10;
        else
            gaps.push('Missing tone guidelines');
        if (campaignContext.contentGuidelines.keywords.length > 0)
            score += 8;
        else
            gaps.push('Missing keywords');
        if (campaignContext.contentGuidelines.avoidWords.length > 0)
            score += 7;
        else
            gaps.push('Missing word restrictions');
        // Check brand completeness (25 points)
        if (campaignContext.brandKit.brandPersonality)
            score += 10;
        else
            gaps.push('Missing brand personality');
        if (campaignContext.brandKit.valueProposition)
            score += 8;
        else
            gaps.push('Missing value proposition');
        if (campaignContext.brandKit.uniqueValue)
            score += 7;
        else
            gaps.push('Missing unique value proposition');
        // Generate recommendations based on gaps
        if (gaps.includes('Missing audience pain points')) {
            recommendations.push('Add specific audience pain points to improve resonance');
        }
        if (gaps.includes('Missing brand differentiators')) {
            recommendations.push('Define what makes your brand unique compared to competitors');
        }
        if (gaps.includes('Missing keywords')) {
            recommendations.push('Add campaign-specific keywords for better SEO and relevance');
        }
        if (gaps.includes('Missing tone guidelines')) {
            recommendations.push('Define specific tone guidelines for consistent brand voice');
        }
        return {
            score: Math.min(score, 100),
            gaps: gaps,
            recommendations: recommendations,
        };
    };
    return CampaignAwareService;
}());
exports.CampaignAwareService = CampaignAwareService;
