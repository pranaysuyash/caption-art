"use strict";
/**
 * Caption Scorer - Quality scoring engine for generated captions
 *
 * Scores captions 1-10 based on:
 * - Brand voice match
 * - Campaign objective alignment
 * - Character limit compliance
 * - Forbidden phrase absence
 * - Must-include phrase presence
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CaptionScorer = void 0;
var captionGenerator_1 = require("./captionGenerator");
var CaptionScorer = /** @class */ (function () {
    function CaptionScorer() {
    }
    /**
     * Score a caption based on multiple criteria
     */
    CaptionScorer.scoreCaption = function (caption, criteria) {
        var breakdown = {
            brandVoiceMatch: 0,
            objectiveAlignment: 0,
            lengthCompliance: 0,
            constraintCompliance: 0,
        };
        var issues = [];
        var strengths = [];
        // 1. Brand Voice Match (0-3 points)
        if (criteria.brandVoiceKeywords && criteria.brandVoiceKeywords.length > 0) {
            var captionLower_1 = caption.toLowerCase();
            var matchCount = criteria.brandVoiceKeywords.filter(function (keyword) {
                return captionLower_1.includes(keyword.toLowerCase());
            }).length;
            var matchRatio = matchCount / criteria.brandVoiceKeywords.length;
            if (matchRatio >= 0.5) {
                breakdown.brandVoiceMatch = 3;
                strengths.push('Strong brand voice alignment');
            }
            else if (matchRatio >= 0.25) {
                breakdown.brandVoiceMatch = 2;
                strengths.push('Good brand voice match');
            }
            else if (matchRatio > 0) {
                breakdown.brandVoiceMatch = 1;
                issues.push('Limited brand voice keywords');
            }
            else {
                breakdown.brandVoiceMatch = 0;
                issues.push('Missing brand voice elements');
            }
        }
        else {
            // No brand voice criteria - give default score
            breakdown.brandVoiceMatch = 2;
        }
        // 2. Campaign Objective Alignment (0-2 points)
        if (criteria.campaignObjective) {
            var objectiveScore = this.scoreObjectiveAlignment(caption, criteria.campaignObjective);
            breakdown.objectiveAlignment = objectiveScore;
            if (objectiveScore === 2) {
                strengths.push('Excellent objective alignment');
            }
            else if (objectiveScore === 1) {
                strengths.push('Moderate objective alignment');
            }
            else {
                issues.push('Weak campaign objective alignment');
            }
        }
        else {
            breakdown.objectiveAlignment = 1;
        }
        // 3. Length Compliance (0-2 points)
        var lengthScore = this.scoreLengthCompliance(caption, criteria);
        breakdown.lengthCompliance = lengthScore.score;
        if (lengthScore.score === 2) {
            strengths.push('Optimal length for platform');
        }
        else if (lengthScore.score === 1) {
            issues.push(lengthScore.issue || 'Length slightly off target');
        }
        else {
            issues.push(lengthScore.issue || 'Length significantly off target');
        }
        // 4. Constraint Compliance (0-3 points) - CRITICAL
        var constraintScore = this.scoreConstraintCompliance(caption, criteria);
        breakdown.constraintCompliance = constraintScore.score;
        if (constraintScore.criticalViolation) {
            issues.push("CRITICAL: ".concat(constraintScore.issue));
        }
        else if (constraintScore.score === 3) {
            strengths.push('All constraints met');
        }
        else if (constraintScore.score > 0) {
            if (constraintScore.issue) {
                issues.push(constraintScore.issue);
            }
        }
        // Calculate total score (1-10)
        var rawScore = breakdown.brandVoiceMatch +
            breakdown.objectiveAlignment +
            breakdown.lengthCompliance +
            breakdown.constraintCompliance;
        // Map 0-10 raw score to 1-10 scale
        var totalScore = Math.max(1, Math.min(10, Math.round(rawScore)));
        return {
            totalScore: totalScore,
            breakdown: breakdown,
            issues: issues,
            strengths: strengths,
        };
    };
    /**
     * Score how well caption aligns with campaign objective
     */
    CaptionScorer.scoreObjectiveAlignment = function (caption, objective) {
        var captionLower = caption.toLowerCase();
        var objectiveIndicators = {
            awareness: [
                'discover',
                'explore',
                'learn',
                'introducing',
                'check out',
                'new',
                'meet',
            ],
            traffic: [
                'learn more',
                'read more',
                'click',
                'visit',
                'explore',
                'discover more',
                'find out',
            ],
            conversion: [
                'buy',
                'shop',
                'get',
                'order',
                'purchase',
                'subscribe',
                'sign up',
                'join',
                'start',
            ],
            engagement: [
                'comment',
                'share',
                'tag',
                'tell us',
                'what do you',
                'your thoughts',
                'let us know',
            ],
        };
        var indicators = objectiveIndicators[objective] || [];
        var matchCount = indicators.filter(function (indicator) {
            return captionLower.includes(indicator);
        }).length;
        if (matchCount >= 2)
            return 2;
        if (matchCount === 1)
            return 1;
        return 0;
    };
    /**
     * Score caption length compliance
     */
    CaptionScorer.scoreLengthCompliance = function (caption, criteria) {
        var length = caption.length;
        // Get platform-specific length guidelines
        var idealLength = criteria.targetLength || 125;
        var maxLength = 2200;
        if (criteria.platform) {
            var preset = captionGenerator_1.PLATFORM_PRESETS[criteria.platform];
            if (preset) {
                idealLength = preset.idealLength;
                maxLength = preset.maxLength;
            }
        }
        // Check if over max (serious issue)
        if (length > maxLength) {
            return {
                score: 0,
                issue: "Over ".concat(maxLength, " char limit (").concat(length, " chars)"),
            };
        }
        // Check if close to ideal
        var deviation = Math.abs(length - idealLength);
        var deviationPercent = deviation / idealLength;
        if (deviationPercent <= 0.2) {
            // Within 20% of ideal
            return { score: 2 };
        }
        else if (deviationPercent <= 0.5) {
            // Within 50% of ideal
            return {
                score: 1,
                issue: "".concat(length, " chars (target ~").concat(idealLength, ")"),
            };
        }
        else {
            // More than 50% off
            return {
                score: 0,
                issue: "".concat(length, " chars (target ~").concat(idealLength, ")"),
            };
        }
    };
    /**
     * Score constraint compliance (must include/exclude phrases)
     */
    CaptionScorer.scoreConstraintCompliance = function (caption, criteria) {
        var captionLower = caption.toLowerCase();
        var score = 3;
        var issues = [];
        // Check must-exclude phrases (critical)
        if (criteria.mustExcludePhrases && criteria.mustExcludePhrases.length > 0) {
            var violations = criteria.mustExcludePhrases.filter(function (phrase) {
                return captionLower.includes(phrase.toLowerCase());
            });
            if (violations.length > 0) {
                return {
                    score: 0,
                    issue: "Contains forbidden: \"".concat(violations[0], "\""),
                    criticalViolation: true,
                };
            }
        }
        // Check must-include phrases
        if (criteria.mustIncludePhrases && criteria.mustIncludePhrases.length > 0) {
            var missing = criteria.mustIncludePhrases.filter(function (phrase) { return !captionLower.includes(phrase.toLowerCase()); });
            if (missing.length > 0) {
                score = Math.max(0, score - missing.length);
                issues.push("Missing required: \"".concat(missing[0], "\""));
            }
        }
        return {
            score: score,
            issue: issues.length > 0 ? issues[0] : undefined,
        };
    };
    /**
     * Batch score multiple captions
     */
    CaptionScorer.batchScore = function (captions, criteria) {
        var _this = this;
        return captions.map(function (caption) { return ({
            id: caption.id,
            score: _this.scoreCaption(caption.text, criteria),
        }); });
    };
    /**
     * Get top N captions by score
     */
    CaptionScorer.getTopCaptions = function (captions, criteria, topN) {
        var _this = this;
        if (topN === void 0) { topN = 3; }
        var scored = captions.map(function (caption) { return (__assign(__assign({}, caption), { score: _this.scoreCaption(caption.text, criteria) })); });
        return scored
            .sort(function (a, b) { return b.score.totalScore - a.score.totalScore; })
            .slice(0, topN);
    };
    /**
     * Score a caption variation using the 4-rubric system mentioned in the feedback
     */
    CaptionScorer.scoreCaptionVariation = function (text, brandVoicePrompt, campaignContext) {
        // Note: In a real implementation, you would use AI to analyze the caption
        // For now, we'll use heuristics based on content analysis
        // Simulate clarity score (1-10)
        // Longer, more descriptive captions with clear subject matter score higher
        var clarity = this.calculateClarityScore(text);
        // Simulate originality score (1-10)
        // Vary based on unique word usage and sentence structure
        var originality = this.calculateOriginalityScore(text);
        // Simulate brand consistency score (1-10)
        // Based on alignment with brand voice and personality
        var brandConsistency = this.calculateBrandConsistencyScore(text, brandVoicePrompt);
        // Simulate platform relevance score (1-10)
        // Based on caption structure and length being appropriate for the target platform
        var platformRelevance = this.calculatePlatformRelevanceScore(text);
        var totalScore = Math.round((clarity + originality + brandConsistency + platformRelevance) / 4);
        return {
            clarity: clarity,
            originality: originality,
            brandConsistency: brandConsistency,
            platformRelevance: platformRelevance,
            totalScore: totalScore,
        };
    };
    CaptionScorer.calculateClarityScore = function (text) {
        // Longer text with complete sentences scores higher
        // Clear action words and specific nouns also help
        var wordCount = text.split(/\s+/).filter(function (w) { return w.length > 0; }).length;
        var hasCallToAction = /buy|get|try|learn|discover|explore|click|share|comment|visit|shop|order|sign up|join/i.test(text);
        var hasSpecificNouns = /product|feature|thing|tool|service|app|platform|device|item|solution|way|method/i.test(text.toLowerCase());
        var score = 5; // base score
        if (wordCount >= 10 && wordCount <= 50)
            score += 2;
        else if (wordCount > 50)
            score += 1;
        if (hasCallToAction)
            score += 2;
        if (hasSpecificNouns)
            score += 1;
        return Math.min(10, Math.max(1, score));
    };
    CaptionScorer.calculateOriginalityScore = function (text) {
        // Check against common phrases, calculate uniqueness
        var commonPhrases = [
            'check this out',
            'amazing',
            'incredible',
            'best',
            'top',
            'awesome',
        ];
        var lowerText = text.toLowerCase();
        var matches = 0;
        for (var _i = 0, commonPhrases_1 = commonPhrases; _i < commonPhrases_1.length; _i++) {
            var phrase = commonPhrases_1[_i];
            if (lowerText.includes(phrase))
                matches++;
        }
        var score = 10 - matches * 2; // -2 points per common phrase
        // Bonus for unique length or structure
        var uniqueElements = /#|#\w+|@\w+|emoji|smiley|:|;|-|_|,|\.|!|\?/.test(text)
            ? 1
            : 0;
        score += uniqueElements;
        return Math.min(10, Math.max(1, score));
    };
    CaptionScorer.calculateBrandConsistencyScore = function (text, brandVoice) {
        // Simulate checking alignment with brand voice
        var brandLower = brandVoice.toLowerCase();
        var textLower = text.toLowerCase();
        var score = 3; // base score
        // Check for alignment with brand personality keywords
        var personalityKeywords = [
            'professional',
            'fun',
            'innovative',
            'premium',
            'approachable',
            'bold',
            'minimal',
        ];
        for (var _i = 0, personalityKeywords_1 = personalityKeywords; _i < personalityKeywords_1.length; _i++) {
            var keyword = personalityKeywords_1[_i];
            if (brandLower.includes(keyword)) {
                if (textLower.includes(keyword) ||
                    (keyword === 'professional' &&
                        /expert|reliable|quality|trusted/.test(textLower)) ||
                    (keyword === 'fun' &&
                        /fun|exciting|enjoy|party|celebrate/.test(textLower)) ||
                    (keyword === 'innovative' &&
                        /new|revolutionary|cutting edge|first/.test(textLower))) {
                    score += 2;
                }
            }
        }
        return Math.min(10, Math.max(1, score));
    };
    CaptionScorer.calculatePlatformRelevanceScore = function (text) {
        // Score based on typical platform-specific patterns
        var hasHashtag = text.includes('#');
        var isShort = text.length < 100;
        var isMedium = text.length >= 100 && text.length <= 300;
        var hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(text);
        var score = 5; // base score
        // Instagram/Facebook: hashtags, emojis, medium length
        if (hasHashtag)
            score += 2;
        if (hasEmojis)
            score += 1;
        if (isMedium)
            score += 1;
        else if (isShort)
            score += 0.5;
        return Math.min(10, Math.max(1, score));
    };
    return CaptionScorer;
}());
exports.CaptionScorer = CaptionScorer;
