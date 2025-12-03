"use strict";
/**
 * Template Memory System
 * Learns from approved work and creates reusable templates
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
exports.TemplateMemoryService = void 0;
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var MetricsService_1 = require("./MetricsService");
var TemplateMemoryService = /** @class */ (function () {
    function TemplateMemoryService() {
    }
    /**
     * Learn from approved work to create reusable templates
     */
    TemplateMemoryService.learnFromApprovedWork = function (workspaceId, campaignId) {
        return __awaiter(this, void 0, void 0, function () {
            var approvedCaptions, approvedAssets, templates, styles, insights, _i, templates_1, template, _a, styles_1, style, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 9, , 10]);
                        logger_1.log.info({ workspaceId: workspaceId, campaignId: campaignId }, 'Starting template learning from approved work');
                        approvedCaptions = campaignId
                            ? auth_1.AuthModel.getCaptionsByCampaignAndStatus(campaignId, 'approved')
                            : auth_1.AuthModel.getApprovedCaptionsByWorkspace(workspaceId);
                        approvedAssets = campaignId
                            ? auth_1.AuthModel.getApprovedGeneratedAssetsByCampaign(campaignId)
                            : auth_1.AuthModel.getApprovedGeneratedAssets(workspaceId);
                        if (approvedCaptions.length === 0 && approvedAssets.length === 0) {
                            logger_1.log.info({ workspaceId: workspaceId }, 'No approved content found for template learning');
                            return [2 /*return*/, {
                                    templates: [],
                                    styles: [],
                                    insights: ['No approved content found to learn from']
                                }];
                        }
                        templates = this.extractTemplatesFromCaptions(approvedCaptions, workspaceId, campaignId);
                        styles = this.extractStylesFromAssets(approvedAssets, workspaceId, campaignId);
                        insights = this.generateInsights(approvedCaptions, approvedAssets);
                        logger_1.log.info({
                            workspaceId: workspaceId,
                            campaignId: campaignId,
                            templateCount: templates.length,
                            styleCount: styles.length,
                            insightCount: insights.length
                        }, 'Template learning completed');
                        _i = 0, templates_1 = templates;
                        _b.label = 1;
                    case 1:
                        if (!(_i < templates_1.length)) return [3 /*break*/, 4];
                        template = templates_1[_i];
                        return [4 /*yield*/, auth_1.AuthModel.createTemplate(template)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        _a = 0, styles_1 = styles;
                        _b.label = 5;
                    case 5:
                        if (!(_a < styles_1.length)) return [3 /*break*/, 8];
                        style = styles_1[_a];
                        return [4 /*yield*/, auth_1.AuthModel.createStyleProfile(style)];
                    case 6:
                        _b.sent();
                        _b.label = 7;
                    case 7:
                        _a++;
                        return [3 /*break*/, 5];
                    case 8:
                        // Track template learning events
                        MetricsService_1.MetricsService.trackTemplateLearning(workspaceId, templates.length);
                        MetricsService_1.MetricsService.trackStyleProfileCreation(workspaceId, styles.length);
                        return [2 /*return*/, {
                                templates: templates,
                                styles: styles,
                                insights: insights
                            }];
                    case 9:
                        error_1 = _b.sent();
                        logger_1.log.error({ error: error_1, workspaceId: workspaceId, campaignId: campaignId }, 'Template learning failed');
                        throw error_1;
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Extract templates from approved captions
     */
    TemplateMemoryService.extractTemplatesFromCaptions = function (captions, workspaceId, campaignId) {
        if (captions.length === 0)
            return [];
        // Group captions by similarity to identify common patterns
        var groupedCaptions = this.groupSimilarCaptions(captions);
        var templates = [];
        for (var _i = 0, _a = groupedCaptions.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], groupId = _b[0], groupCaptions = _b[1];
            if (groupCaptions.length < 2)
                continue; // Need at least 2 similar captions to form a template
            // Analyze the group to extract template characteristics
            var template = this.analyzeCaptionGroup(groupCaptions, workspaceId, campaignId);
            templates.push(template);
        }
        return templates;
    };
    /**
     * Group similar captions to identify reusable templates
     */
    TemplateMemoryService.groupSimilarCaptions = function (captions) {
        var groups = [];
        var usedIndices = new Set();
        for (var i = 0; i < captions.length; i++) {
            if (usedIndices.has(i))
                continue;
            var currentGroup = [captions[i]];
            usedIndices.add(i);
            // Look for similar captions in the remaining ones
            for (var j = i + 1; j < captions.length; j++) {
                if (usedIndices.has(j))
                    continue;
                if (this.isCaptionSimilar(captions[i], captions[j])) {
                    currentGroup.push(captions[j]);
                    usedIndices.add(j);
                }
            }
            groups.push(currentGroup);
        }
        return groups;
    };
    /**
     * Check if two captions are similar enough to form a template
     */
    TemplateMemoryService.isCaptionSimilar = function (caption1, caption2) {
        // Compare basic characteristics
        if (!caption1.text || !caption2.text)
            return false;
        // Calculate similarity based on various factors
        var textSimilarity = this.calculateTextSimilarity(caption1.text, caption2.text);
        var lengthSimilarity = Math.abs(caption1.text.length - caption2.text.length) / Math.max(caption1.text.length, caption2.text.length);
        // Consider them similar if text similarity is high and length is comparable
        return textSimilarity > 0.7 && lengthSimilarity < 0.3;
    };
    /**
     * Calculate text similarity using simple string comparison
     */
    TemplateMemoryService.calculateTextSimilarity = function (text1, text2) {
        var words1 = text1.toLowerCase().split(/\s+/);
        var words2 = text2.toLowerCase().split(/\s+/);
        var intersection = words1.filter(function (word) { return words2.includes(word); });
        var union = __spreadArray([], new Set(__spreadArray(__spreadArray([], words1, true), words2, true)), true);
        return union.length > 0 ? intersection.length / union.length : 0;
    };
    /**
     * Analyze a group of similar captions to extract template characteristics
     */
    TemplateMemoryService.analyzeCaptionGroup = function (captions, workspaceId, campaignId) {
        // Calculate common characteristics from the group
        var lengths = captions.map(function (c) { return c.text.length; });
        var avgLength = lengths.reduce(function (sum, len) { return sum + len; }, 0) / lengths.length;
        var minLength = Math.min.apply(Math, lengths);
        var maxLength = Math.max.apply(Math, lengths);
        // Extract common word patterns
        var allWords = captions.flatMap(function (c) {
            return c.text.toLowerCase().split(/\s+/).filter(function (w) { return w.length > 3; });
        });
        var wordFrequency = new Map();
        allWords.forEach(function (word) {
            wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
        });
        // Get top recurring words as patterns
        var sortedWords = Array.from(wordFrequency.entries())
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, 10)
            .map(function (_a) {
            var word = _a[0];
            return word;
        });
        // Calculate average scores for performance metrics
        var scores = captions.map(function (c) { return c.qualityScore || 0; });
        var avgScore = scores.reduce(function (sum, score) { return sum + score; }, 0) / scores.length;
        return {
            id: "tmpl_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
            name: "Template from ".concat(captions.length, " similar captions"),
            workspaceId: workspaceId,
            campaignId: campaignId,
            brandKitId: captions[0].workspaceId, // Assuming all captions in group are from same workspace
            captionStructure: {
                toneStyle: 'mixed', // Would analyze this more deeply in practice
                lengthPreferences: {
                    min: minLength,
                    max: maxLength,
                    ideal: Math.round(avgLength)
                },
                wordChoicePatterns: sortedWords,
                emotionalAppeal: 'mixed' // Would analyze this more deeply
            },
            layoutPreferences: {
                format: ['instagram-square', 'instagram-story'], // Default for now
                layout: ['center-focus'], // Default assumption
                textPositioning: 'center' // Default assumption
            },
            performanceMetrics: {
                approvalRate: 1, // All in group are approved
                reuseCount: 0, // New template
                averageScore: parseFloat(avgScore.toFixed(2))
            },
            createdAt: new Date()
        };
    };
    /**
     * Extract style profiles from approved assets
     */
    TemplateMemoryService.extractStylesFromAssets = function (assets, workspaceId, campaignId) {
        if (assets.length === 0)
            return [];
        // For now, we'll create a basic style profile from available data
        // In a real implementation, this would analyze the actual image files
        var styles = [];
        // Group by visual characteristics if possible
        for (var _i = 0, assets_1 = assets; _i < assets_1.length; _i++) {
            var asset = assets_1[_i];
            // In a real implementation, we'd analyze the actual image
            // For now, we'll create a placeholder with available metadata
            var style = {
                id: "style_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9)),
                name: "Style from asset ".concat(asset.id.substring(0, 8)),
                workspaceId: workspaceId,
                campaignId: campaignId,
                learnedFromCreativeId: asset.id,
                colors: {
                    primaryPalette: ['#333333', '#666666'], // Placeholder - would extract from image
                    secondaryPalette: ['#999999', '#CCCCCC'],
                    accentColors: ['#0066CC', '#FF6B35'], // Common accent colors
                    contrastPreferences: 'high'
                },
                typography: {
                    fontHierarchy: {
                        headings: ['Inter Bold', 'Helvetica Neue Bold'], // Common fonts
                        body: ['Inter Regular', 'Helvetica Neue'],
                        accents: ['Inter Medium', 'Helvetica Neue Medium']
                    },
                    spacingPreferences: {
                        lineSpacing: 1.5,
                        paragraphSpacing: 2,
                        marginPaddingRatios: 0.5
                    }
                },
                layout: {
                    compositionStyle: 'balanced',
                    elementHierarchy: 'text-over-image',
                    whiteSpaceUsage: 'balanced'
                },
                brandAlignment: {
                    personalityMatch: 0.85,
                    valuePropositionIncorporation: 0.9,
                    targetAudienceResonance: 0.88
                },
                createdAt: new Date()
            };
            styles.push(style);
        }
        return styles;
    };
    /**
     * Generate insights from approved content analysis
     */
    TemplateMemoryService.generateInsights = function (approvedCaptions, approvedAssets) {
        var insights = [];
        if (approvedCaptions.length > 0) {
            // Calculate average caption length
            var avgLength = approvedCaptions.reduce(function (sum, cap) { var _a; return sum + (((_a = cap.text) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0) / approvedCaptions.length;
            insights.push("Average approved caption length: ".concat(Math.round(avgLength), " characters"));
            // Identify common themes/keywords
            var allText = approvedCaptions.map(function (c) { return c.text; }).join(' ').toLowerCase();
            var commonWords = this.getMostCommonWords(allText, 5);
            insights.push("Common themes: ".concat(commonWords.join(', ')));
            // Calculate average score if available
            var scores = approvedCaptions.map(function (c) { return c.qualityScore || 0; }).filter(function (score) { return score > 0; });
            if (scores.length > 0) {
                var avgScore = scores.reduce(function (sum, score) { return sum + score; }, 0) / scores.length;
                insights.push("Average caption quality score: ".concat(avgScore.toFixed(2), "/10"));
            }
        }
        if (approvedAssets.length > 0) {
            insights.push("Total approved assets: ".concat(approvedAssets.length));
            // Format distribution
            var formatCounts = approvedAssets.reduce(function (acc, asset) {
                acc[asset.format] = (acc[asset.format] || 0) + 1;
                return acc;
            }, {});
            var formatDistribution = Object.entries(formatCounts)
                .map(function (_a) {
                var format = _a[0], count = _a[1];
                return "".concat(format, ": ").concat(count);
            })
                .join(', ');
            insights.push("Format distribution: ".concat(formatDistribution));
        }
        if (approvedCaptions.length > 0 && approvedAssets.length > 0) {
            insights.push("Combined content analysis complete: ".concat(approvedCaptions.length, " captions, ").concat(approvedAssets.length, " assets"));
        }
        return insights;
    };
    /**
     * Get most common words from text
     */
    TemplateMemoryService.getMostCommonWords = function (text, count) {
        var stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did'
        ]);
        var words = text
            .split(/\s+/)
            .map(function (w) { return w.replace(/[^\w]/g, '').toLowerCase(); })
            .filter(function (w) { return w.length > 2 && !stopWords.has(w); });
        var frequencyMap = new Map();
        words.forEach(function (word) {
            frequencyMap.set(word, (frequencyMap.get(word) || 0) + 1);
        });
        return Array.from(frequencyMap.entries())
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, count)
            .map(function (_a) {
            var word = _a[0];
            return word;
        });
    };
    /**
     * Apply a learned template to generate new content
     */
    TemplateMemoryService.applyTemplate = function (templateId, context) {
        return __awaiter(this, void 0, void 0, function () {
            var template, resultText, appliedRules, confidence, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        template = auth_1.AuthModel.getTemplateById(templateId);
                        if (!template) {
                            throw new Error("Template ".concat(templateId, " not found"));
                        }
                        logger_1.log.info({ templateId: templateId, sourceText: context.sourceText.substring(0, 50) }, 'Applying template to generate content');
                        resultText = context.sourceText;
                        // Apply length preferences if specified
                        if (context.targetLength) {
                            resultText = this.adaptTextLength(resultText, context.targetLength);
                        }
                        else if (template.captionStructure.lengthPreferences.ideal) {
                            resultText = this.adaptTextLength(resultText, template.captionStructure.lengthPreferences.ideal);
                        }
                        // Apply word choice patterns - inject common patterns if missing
                        resultText = this.applyWordChoicePatterns(resultText, template.captionStructure.wordChoicePatterns);
                        appliedRules = [];
                        if (context.targetLength || template.captionStructure.lengthPreferences.ideal)
                            appliedRules.push('length_adaptation');
                        if (template.captionStructure.wordChoicePatterns.length > 0)
                            appliedRules.push('word_patterns');
                        confidence = appliedRules.length / 5;
                        // Update template usage statistics
                        return [4 /*yield*/, this.incrementTemplateUsage(templateId)];
                    case 1:
                        // Update template usage statistics
                        _a.sent();
                        return [2 /*return*/, {
                                caption: resultText,
                                confidence: Math.min(confidence, 1),
                                appliedRules: appliedRules
                            }];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.log.error({ error: error_2, templateId: templateId }, 'Template application failed');
                        throw error_2;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Adapt text to target length
     */
    TemplateMemoryService.adaptTextLength = function (text, targetLength) {
        if (text.length <= targetLength) {
            return text; // Already under target, keep as is
        }
        // For now, simply truncate - in real implementation, would preserve meaning
        var result = text.substring(0, targetLength).trim();
        // Try to break at word boundary
        var lastSpace = result.lastIndexOf(' ');
        if (lastSpace > 0 && result.length > targetLength * 0.9) { // Only if we trimmed significantly
            result = result.substring(0, lastSpace).trim();
        }
        return result;
    };
    /**
     * Apply word choice patterns to text
     */
    TemplateMemoryService.applyWordChoicePatterns = function (text, patterns) {
        // For now, just ensure certain patterns are present
        // In real implementation, would incorporate patterns more intelligently
        var result = text;
        for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
            var pattern = patterns_1[_i];
            if (!result.toLowerCase().includes(pattern.toLowerCase())) {
                // Simple approach: append common patterns if not present
                result += " #".concat(pattern);
            }
        }
        return result;
    };
    /**
     * Increment template usage counter
     */
    TemplateMemoryService.incrementTemplateUsage = function (templateId) {
        return __awaiter(this, void 0, void 0, function () {
            var template, updatedTemplate;
            return __generator(this, function (_a) {
                template = auth_1.AuthModel.getTemplateById(templateId);
                if (!template)
                    return [2 /*return*/];
                updatedTemplate = __assign(__assign({}, template), { performanceMetrics: __assign(__assign({}, template.performanceMetrics), { reuseCount: (template.performanceMetrics.reuseCount || 0) + 1 }), lastUsedAt: new Date() });
                return [2 /*return*/];
            });
        });
    };
    /**
     * Get recommended templates for a workspace or campaign
     */
    TemplateMemoryService.getRecommendedTemplates = function (workspaceId_1, campaignId_1) {
        return __awaiter(this, arguments, void 0, function (workspaceId, campaignId, limit) {
            var templates;
            if (limit === void 0) { limit = 5; }
            return __generator(this, function (_a) {
                try {
                    templates = auth_1.AuthModel.getTemplatesByWorkspace(workspaceId);
                    // Filter by campaign if specified
                    if (campaignId) {
                        templates = templates.filter(function (t) { return t.campaignId === campaignId; });
                    }
                    // Sort by performance metrics (prefer templates with high approval rate, high scores, recent usage)
                    templates.sort(function (a, b) {
                        var scoreA = (a.performanceMetrics.averageScore || 0) * (a.performanceMetrics.approvalRate || 0) * (a.performanceMetrics.reuseCount + 1);
                        var scoreB = (b.performanceMetrics.averageScore || 0) * (b.performanceMetrics.approvalRate || 0) * (b.performanceMetrics.reuseCount + 1);
                        // Prefer more recently used templates
                        var timeA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : new Date(a.createdAt).getTime();
                        var timeB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : new Date(b.createdAt).getTime();
                        // Combine score and recency (recently used templates get a boost)
                        var combinedA = scoreA * (1 + (timeA / Date.now()));
                        var combinedB = scoreB * (1 + (timeB / Date.now()));
                        return combinedB - combinedA; // Higher scores first
                    });
                    return [2 /*return*/, templates.slice(0, limit)];
                }
                catch (error) {
                    logger_1.log.error({ error: error, workspaceId: workspaceId, campaignId: campaignId }, 'Failed to get recommended templates');
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Auto-apply best templates based on content context
     */
    TemplateMemoryService.autoApplyBestTemplate = function (workspaceId, context) {
        return __awaiter(this, void 0, void 0, function () {
            var recommendedTemplates, results, successfulResults, bestResult, error_3;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, this.getRecommendedTemplates(workspaceId, (_a = context.campaign) === null || _a === void 0 ? void 0 : _a.id, 10)];
                    case 1:
                        recommendedTemplates = _b.sent();
                        if (recommendedTemplates.length === 0) {
                            logger_1.log.info({ workspaceId: workspaceId }, 'No templates available for auto-application');
                            return [2 /*return*/, null];
                        }
                        return [4 /*yield*/, Promise.all(recommendedTemplates.map(function (template) { return __awaiter(_this, void 0, void 0, function () {
                                var result, err_1;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            _a.trys.push([0, 2, , 3]);
                                            return [4 /*yield*/, this.applyTemplate(template.id, context)];
                                        case 1:
                                            result = _a.sent();
                                            return [2 /*return*/, __assign(__assign({}, result), { templateId: template.id, templateAverageScore: template.performanceMetrics.averageScore || 0 })];
                                        case 2:
                                            err_1 = _a.sent();
                                            logger_1.log.warn({ err: err_1, templateId: template.id }, 'Failed to apply template');
                                            return [2 /*return*/, null];
                                        case 3: return [2 /*return*/];
                                    }
                                });
                            }); }))];
                    case 2:
                        results = _b.sent();
                        successfulResults = results.filter(function (r) { return r !== null; });
                        if (successfulResults.length === 0) {
                            return [2 /*return*/, null];
                        }
                        bestResult = successfulResults.reduce(function (best, current) {
                            // Calculate composite score combining application confidence with template's historical performance
                            var currentScore = (current.confidence || 0) * 0.6 + (current.templateAverageScore / 10) * 0.4;
                            var bestScore = (best.confidence || 0) * 0.6 + (best.templateAverageScore / 10) * 0.4;
                            return currentScore > bestScore ? current : best;
                        });
                        logger_1.log.info({
                            workspaceId: workspaceId,
                            bestTemplateId: bestResult.templateId,
                            confidence: bestResult.confidence
                        }, 'Best template auto-applied');
                        return [2 /*return*/, {
                                caption: bestResult.caption,
                                templateId: bestResult.templateId,
                                confidence: bestResult.confidence
                            }];
                    case 3:
                        error_3 = _b.sent();
                        logger_1.log.error({ error: error_3, workspaceId: workspaceId }, 'Auto-template application failed');
                        throw error_3;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return TemplateMemoryService;
}());
exports.TemplateMemoryService = TemplateMemoryService;
