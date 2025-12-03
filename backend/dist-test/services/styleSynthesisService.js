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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StyleSynthesisService = void 0;
var openai_1 = __importDefault(require("openai"));
var logger_1 = require("../middleware/logger");
var StyleSynthesisService = /** @class */ (function () {
    function StyleSynthesisService() {
        this.styleAnalyses = new Map();
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    /**
     * Analyze a style reference to extract key visual attributes
     */
    StyleSynthesisService.prototype.analyzeStyleReference = function (reference) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt_1, mockAnalysis, result;
            var _a;
            return __generator(this, function (_b) {
                try {
                    logger_1.log.info({ referenceId: reference.id, type: reference.type }, 'Analyzing style reference');
                    prompt_1 = "\nAnalyze this visual style reference and extract key design attributes.\n\nREFERENCE DETAILS:\nName: ".concat(reference.name, "\nDescription: ").concat(reference.description, "\nType: ").concat(reference.type, "\nURL: ").concat(reference.url, "\nTags: ").concat(((_a = reference.tags) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'none', "\n\nANALYSIS REQUIREMENTS:\nProvide a comprehensive analysis covering:\n\n1. COLOR PALETTE: Extract dominant colors (hex codes if possible)\n2. TYPOGRAPHY: Describe font styles, weights, and hierarchy\n3. COMPOSITION: Describe layout, spacing, and visual flow\n4. MOOD/FEELING: Identify emotional tone and atmosphere\n5. VISUAL STYLE: Describe overall aesthetic (minimalist, bold, vintage, etc.)\n6. KEY ELEMENTS: List distinctive visual elements or patterns\n\nReturn the analysis as JSON with this structure:\n{\n  \"colorPalette\": [\"#hex1\", \"#hex2\", \"...\"],\n  \"typography\": [\"font style descriptions\"],\n  \"composition\": [\"layout descriptions\"],\n  \"mood\": [\"emotional descriptors\"],\n  \"visualStyle\": [\"aesthetic descriptors\"],\n  \"keyElements\": [\"distinctive elements\"]\n}\n      ").trim();
                    mockAnalysis = this.generateMockAnalysis(reference);
                    result = {
                        id: "style-analysis-".concat(Date.now()),
                        referenceId: reference.id,
                        analysis: mockAnalysis,
                        confidence: 0.85 + Math.random() * 0.1,
                        processedAt: new Date(),
                    };
                    this.styleAnalyses.set(reference.id, result);
                    logger_1.log.info({ referenceId: reference.id, confidence: result.confidence }, 'Style reference analysis completed');
                    return [2 /*return*/, result];
                }
                catch (error) {
                    logger_1.log.error({ err: error, referenceId: reference.id }, 'Style analysis failed');
                    throw new Error("Failed to analyze style reference: ".concat(error instanceof Error ? error.message : 'Unknown error'));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Synthesize multiple style references into a unified style
     */
    StyleSynthesisService.prototype.synthesizeStyles = function (request, brandKit, campaign) {
        return __awaiter(this, void 0, void 0, function () {
            var analyses, synthesizedStyle, styleGuidance, synthesizedOutput, qualityMetrics, recommendations, result, error_1;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger_1.log.info({
                            referenceCount: request.styleReferences.length,
                            synthesisMode: request.synthesisMode,
                            targetFormat: request.targetFormat,
                        }, 'Starting style synthesis');
                        return [4 /*yield*/, Promise.all(request.styleReferences.map(function (refId) { return __awaiter(_this, void 0, void 0, function () {
                                var analysis, mockRef;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            analysis = this.styleAnalyses.get(refId);
                                            if (!!analysis) return [3 /*break*/, 2];
                                            mockRef = {
                                                id: refId,
                                                name: "Style Reference ".concat(refId),
                                                description: 'Mock style reference for synthesis',
                                                url: "https://example.com/style/".concat(refId),
                                                type: 'image',
                                                tags: ['mock'],
                                                workspaceId: request.workspaceId,
                                                createdAt: new Date(),
                                            };
                                            return [4 /*yield*/, this.analyzeStyleReference(mockRef)];
                                        case 1:
                                            analysis = _a.sent();
                                            _a.label = 2;
                                        case 2: return [2 /*return*/, analysis];
                                    }
                                });
                            }); }))
                            // Synthesize based on mode
                        ];
                    case 1:
                        analyses = _a.sent();
                        synthesizedStyle = this.performStyleSynthesis(analyses, request.synthesisMode);
                        styleGuidance = this.generateStyleGuidance(synthesizedStyle, request.targetFormat);
                        synthesizedOutput = this.generateMockSynthesizedOutput(request, synthesizedStyle, brandKit, campaign);
                        qualityMetrics = this.calculateSynthesisQuality(analyses, synthesizedStyle);
                        recommendations = this.generateSynthesisRecommendations(analyses, synthesizedStyle, qualityMetrics);
                        result = {
                            id: "style-synthesis-".concat(Date.now()),
                            request: request,
                            analyses: analyses.map(function (a) { return ({
                                referenceId: a.referenceId,
                                confidence: a.confidence,
                                keyAttributes: Object.values(a.analysis).flat(),
                            }); }),
                            synthesizedStyle: synthesizedStyle,
                            styleGuidance: styleGuidance,
                            synthesizedOutput: synthesizedOutput,
                            qualityMetrics: qualityMetrics,
                            recommendations: recommendations,
                            processingTime: 1500 + Math.random() * 1000,
                            createdAt: new Date(),
                        };
                        logger_1.log.info({
                            synthesisId: result.id,
                            avgConfidence: analyses.reduce(function (sum, a) { return sum + a.confidence; }, 0) / analyses.length,
                            qualityScore: qualityMetrics.overallScore,
                        }, 'Style synthesis completed');
                        return [2 /*return*/, result];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.log.error({ err: error_1, requestId: request.workspaceId }, 'Style synthesis failed');
                        throw new Error("Failed to synthesize styles: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Find style references that match a given aesthetic
     */
    StyleSynthesisService.prototype.findMatchingStyles = function (query_1, workspaceId_1) {
        return __awaiter(this, arguments, void 0, function (query, workspaceId, limit) {
            var mockMatches, i, similarityScore;
            if (limit === void 0) { limit = 10; }
            return __generator(this, function (_a) {
                try {
                    logger_1.log.info({ query: query, workspaceId: workspaceId, limit: limit }, 'Searching for matching styles');
                    mockMatches = [];
                    for (i = 0; i < Math.min(limit, 5); i++) {
                        similarityScore = 0.6 + Math.random() * 0.4;
                        mockMatches.push({
                            referenceId: "style-ref-".concat(i + 1),
                            similarityScore: similarityScore,
                            matchingAttributes: [
                                'color harmony',
                                'minimalist composition',
                                'clean typography',
                                'balanced layout',
                            ].slice(0, Math.floor(Math.random() * 4) + 2),
                            conflictingAttributes: similarityScore < 0.8 ? [
                                'slight mood variation',
                                'different temperature tones',
                            ].slice(0, Math.floor(Math.random() * 2)) : [],
                            recommendation: similarityScore > 0.85
                                ? 'Excellent match for your aesthetic'
                                : similarityScore > 0.75
                                    ? 'Good match with minor adjustments needed'
                                    : 'Consider blending with complementary styles',
                        });
                    }
                    // Sort by similarity score
                    mockMatches.sort(function (a, b) { return b.similarityScore - a.similarityScore; });
                    return [2 /*return*/, mockMatches];
                }
                catch (error) {
                    logger_1.log.error({ err: error, query: query, workspaceId: workspaceId }, 'Style matching failed');
                    throw new Error("Failed to find matching styles: ".concat(error instanceof Error ? error.message : 'Unknown error'));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Generate mock analysis based on reference description
     */
    StyleSynthesisService.prototype.generateMockAnalysis = function (reference) {
        var styles = [
            {
                colorPalette: ['#2C3E50', '#34495E', '#E74C3C', '#ECF0F1', '#FFFFFF'],
                typography: ['Modern sans-serif', 'Clean geometric forms', 'Medium weight', 'Excellent readability'],
                composition: ['Centered layout', 'Balanced asymmetry', 'Generous whitespace', 'Clear visual hierarchy'],
                mood: ['Professional', 'Trustworthy', 'Modern', 'Approachable'],
                visualStyle: ['Minimalist', 'Corporate', 'Clean', 'Sophisticated'],
                keyElements: ['Bold typography', 'Subtle gradients', 'Geometric shapes', 'Monochromatic accents'],
            },
            {
                colorPalette: ['#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#FFFFFF'],
                typography: ['Bold display fonts', 'Playful scripts', 'Varied weights', 'Dynamic hierarchy'],
                composition: ['Dynamic grid', 'Overlapping elements', 'Energetic flow', 'Surprising contrasts'],
                mood: ['Creative', 'Youthful', 'Energetic', 'Bold'],
                visualStyle: ['Contemporary', 'Artistic', 'Expressive', 'Vibrant'],
                keyElements: ['Gradient backgrounds', 'Bold color blocks', 'Experimental typography', 'Artistic textures'],
            },
            {
                colorPalette: ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FFFFFF'],
                typography: ['Friendly rounded fonts', 'Handwritten elements', 'Light weights', 'Organic feel'],
                composition: ['Organic layout', 'Natural flow', 'Soft corners', 'Harmonious spacing'],
                mood: ['Natural', 'Friendly', 'Approachable', 'Calm'],
                visualStyle: ['Organic', 'Eco-friendly', 'Soft', 'Natural'],
                keyElements: ['Natural textures', 'Organic shapes', 'Earthy tones', 'Green accents'],
            },
        ];
        return styles[Math.floor(Math.random() * styles.length)];
    };
    /**
     * Perform style synthesis based on mode
     */
    StyleSynthesisService.prototype.performStyleSynthesis = function (analyses, mode) {
        var allColors = analyses.flatMap(function (a) { return a.analysis.colorPalette; });
        var allTypography = analyses.flatMap(function (a) { return a.analysis.typography; });
        var allComposition = analyses.flatMap(function (a) { return a.analysis.composition; });
        var allMood = analyses.flatMap(function (a) { return a.analysis.mood; });
        var allVisualStyle = analyses.flatMap(function (a) { return a.analysis.visualStyle; });
        var allKeyElements = analyses.flatMap(function (a) { return a.analysis.keyElements; });
        var selectedColors;
        var selectedTypography;
        var selectedComposition;
        var selectedMood;
        var selectedVisualStyle;
        var selectedKeyElements;
        switch (mode) {
            case 'dominant':
                // Take most common elements
                selectedColors = this.getMostCommon(allColors, 3);
                selectedTypography = this.getMostCommon(allTypography, 2);
                selectedComposition = this.getMostCommon(allComposition, 2);
                selectedMood = this.getMostCommon(allMood, 2);
                selectedVisualStyle = this.getMostCommon(allVisualStyle, 1);
                selectedKeyElements = this.getMostCommon(allKeyElements, 3);
                break;
            case 'balanced':
                // Mix elements evenly
                selectedColors = this.getBalancedSelection(allColors, 5);
                selectedTypography = this.getBalancedSelection(allTypography, 3);
                selectedComposition = this.getBalancedSelection(allComposition, 3);
                selectedMood = this.getBalancedSelection(allMood, 2);
                selectedVisualStyle = this.getBalancedSelection(allVisualStyle, 2);
                selectedKeyElements = this.getBalancedSelection(allKeyElements, 4);
                break;
            case 'creative':
                // Combine contrasting elements
                selectedColors = this.getCreativeSelection(allColors, 6);
                selectedTypography = this.getCreativeSelection(allTypography, 4);
                selectedComposition = this.getCreativeSelection(allComposition, 3);
                selectedMood = this.getCreativeSelection(allMood, 3);
                selectedVisualStyle = this.getCreativeSelection(allVisualStyle, 3);
                selectedKeyElements = this.getCreativeSelection(allKeyElements, 5);
                break;
            case 'conservative':
                // Select safest, most compatible elements
                selectedColors = this.getConservativeSelection(allColors, 3);
                selectedTypography = this.getConservativeSelection(allTypography, 2);
                selectedComposition = this.getConservativeSelection(allComposition, 2);
                selectedMood = this.getConservativeSelection(allMood, 2);
                selectedVisualStyle = this.getConservativeSelection(allVisualStyle, 1);
                selectedKeyElements = this.getConservativeSelection(allKeyElements, 2);
                break;
            default:
                throw new Error("Unknown synthesis mode: ".concat(mode));
        }
        return {
            colorPalette: selectedColors,
            typography: selectedTypography,
            composition: selectedComposition,
            mood: selectedMood,
            visualStyle: selectedVisualStyle,
            keyElements: selectedKeyElements,
            synthesisMode: mode,
            confidence: 0.75 + Math.random() * 0.2,
        };
    };
    /**
     * Helper methods for selection strategies
     */
    StyleSynthesisService.prototype.getMostCommon = function (items, count) {
        var counts = new Map();
        items.forEach(function (item) { return counts.set(item, (counts.get(item) || 0) + 1); });
        return Array.from(counts.entries())
            .sort(function (a, b) { return b[1] - a[1]; })
            .slice(0, count)
            .map(function (entry) { return entry[0]; });
    };
    StyleSynthesisService.prototype.getBalancedSelection = function (items, count) {
        var shuffled = __spreadArray([], items, true).sort(function () { return Math.random() - 0.5; });
        return __spreadArray([], new Set(shuffled), true).slice(0, count);
    };
    StyleSynthesisService.prototype.getCreativeSelection = function (items, count) {
        // Select diverse elements
        var unique = __spreadArray([], new Set(items), true);
        var selected = [];
        for (var i = 0; i < count && unique.length > 0; i++) {
            var index = Math.floor(Math.random() * unique.length);
            selected.push(unique[index]);
            unique.splice(index, 1);
        }
        return selected;
    };
    StyleSynthesisService.prototype.getConservativeSelection = function (items, count) {
        // Select most common, safe elements
        return this.getMostCommon(items, Math.min(count, 3));
    };
    /**
     * Generate style guidance for target format
     */
    StyleSynthesisService.prototype.generateStyleGuidance = function (synthesizedStyle, targetFormat) {
        var guidance = [
            "Apply the ".concat(synthesizedStyle.visualStyle.join(', '), " aesthetic consistently"),
            "Use the color palette: ".concat(synthesizedStyle.colorPalette.slice(0, 3).join(', ')),
            "Implement ".concat(synthesizedStyle.typography[0], " for primary elements"),
            "Follow ".concat(synthesizedStyle.composition[0], " principles"),
            "Maintain a ".concat(synthesizedStyle.mood.join(' and '), " mood"),
        ];
        if (targetFormat) {
            guidance.push("Optimize for ".concat(targetFormat, " specifications"));
            if (targetFormat.includes('story')) {
                guidance.push('Design for vertical scrolling and safe zones');
            }
            else if (targetFormat.includes('square')) {
                guidance.push('Create centered, balanced compositions');
            }
            else if (targetFormat.includes('landscape')) {
                guidance.push('Use horizontal flow and wide compositions');
            }
        }
        return guidance;
    };
    /**
     * Generate mock synthesized output
     */
    StyleSynthesisService.prototype.generateMockSynthesizedOutput = function (request, synthesizedStyle, brandKit, campaign) {
        var _a, _b, _c, _d, _e, _f;
        var dimensions = ((_a = request.targetFormat) === null || _a === void 0 ? void 0 : _a.includes('story'))
            ? { width: 1080, height: 1920 }
            : ((_b = request.targetFormat) === null || _b === void 0 ? void 0 : _b.includes('landscape'))
                ? { width: 1920, height: 1080 }
                : { width: 1080, height: 1080 };
        return {
            url: "https://via.placeholder.com/".concat(dimensions.width, "x").concat(dimensions.height, "/").concat(((_c = synthesizedStyle.colorPalette[0]) === null || _c === void 0 ? void 0 : _c.replace('#', '')) || '4A90E2', "/").concat(((_d = synthesizedStyle.colorPalette[1]) === null || _d === void 0 ? void 0 : _d.replace('#', '')) || 'FFFFFF', "?text=SYNTHESIZED"),
            thumbnailUrl: "https://via.placeholder.com/320x".concat(Math.round(320 * dimensions.height / dimensions.width), "/").concat(((_e = synthesizedStyle.colorPalette[0]) === null || _e === void 0 ? void 0 : _e.replace('#', '')) || '4A90E2', "/").concat(((_f = synthesizedStyle.colorPalette[1]) === null || _f === void 0 ? void 0 : _f.replace('#', '')) || 'FFFFFF', "?text=STYLE"),
            dimensions: dimensions,
            format: request.targetFormat || 'square',
            styleScore: synthesizedStyle.confidence * 100,
            brandAlignment: brandKit ? 85 + Math.random() * 10 : 70 + Math.random() * 15,
            campaignAlignment: campaign ? 80 + Math.random() * 15 : 75 + Math.random() * 10,
        };
    };
    /**
     * Calculate synthesis quality metrics
     */
    StyleSynthesisService.prototype.calculateSynthesisQuality = function (analyses, synthesizedStyle) {
        var avgConfidence = analyses.reduce(function (sum, a) { return sum + a.confidence; }, 0) / analyses.length;
        var styleDiversity = new Set(analyses.flatMap(function (a) { return Object.values(a.analysis); })).size;
        var synthesisComplexity = synthesizedStyle.colorPalette.length +
            synthesizedStyle.typography.length +
            synthesizedStyle.keyElements.length;
        return {
            coherence: Math.round(avgConfidence * 100),
            diversity: Math.round((styleDiversity / 50) * 100),
            innovation: synthesizedStyle.synthesisMode === 'creative' ? 85 : 70,
            brandConsistency: 85 + Math.random() * 10,
            overallScore: Math.round((avgConfidence * 40 + (styleDiversity / 50) * 30 + (synthesisComplexity / 20) * 30)),
        };
    };
    /**
     * Generate synthesis recommendations
     */
    StyleSynthesisService.prototype.generateSynthesisRecommendations = function (analyses, synthesizedStyle, qualityMetrics) {
        var recommendations = [];
        if (qualityMetrics.coherence < 80) {
            recommendations.push('Consider selecting more compatible style references');
        }
        if (qualityMetrics.diversity < 60) {
            recommendations.push('Try adding more diverse style references for richer synthesis');
        }
        if (synthesizedStyle.synthesisMode === 'conservative' && qualityMetrics.innovation < 70) {
            recommendations.push('Consider using balanced or creative mode for more distinctive results');
        }
        if (synthesizedStyle.colorPalette.length > 6) {
            recommendations.push('Simplify the color palette for better brand consistency');
        }
        if (qualityMetrics.overallScore < 85) {
            recommendations.push('Refine style selections to improve overall synthesis quality');
        }
        if (recommendations.length === 0) {
            recommendations.push('Excellent style synthesis! Consider exploring creative mode for more variety');
        }
        return recommendations;
    };
    return StyleSynthesisService;
}());
exports.StyleSynthesisService = StyleSynthesisService;
