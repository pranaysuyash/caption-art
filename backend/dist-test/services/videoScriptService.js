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
exports.VideoScriptService = void 0;
var openai_1 = __importDefault(require("openai"));
var campaignAwareService_1 = require("./campaignAwareService");
var logger_1 = require("../middleware/logger");
var VideoScriptService = /** @class */ (function () {
    function VideoScriptService() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
        this.campaignAwareService = new campaignAwareService_1.CampaignAwareService();
    }
    /**
     * Generate video script with optional storyboard
     */
    VideoScriptService.prototype.generateVideoScript = function (request, campaign, brandKit) {
        return __awaiter(this, void 0, void 0, function () {
            var videoScript, videoStoryboard, qualityScore, recommendations, estimatedPerformance, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        logger_1.log.info({
                            videoLength: request.videoLength,
                            platforms: request.platforms,
                            includeStoryboard: request.includeStoryboard,
                            productName: request.product.name,
                        }, "Generating video script for ".concat(request.product.name));
                        return [4 /*yield*/, this.generateScript(request, campaign, brandKit)
                            // Generate storyboard if requested
                        ];
                    case 1:
                        videoScript = _a.sent();
                        videoStoryboard = void 0;
                        if (!request.includeStoryboard) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.generateStoryboard(videoScript, request, campaign, brandKit)];
                    case 2:
                        videoStoryboard = _a.sent();
                        _a.label = 3;
                    case 3:
                        qualityScore = this.calculateQualityScore(videoScript, request);
                        recommendations = this.generateRecommendations(videoScript, request);
                        estimatedPerformance = this.estimatePerformance(videoScript, request);
                        logger_1.log.info({
                            videoLength: videoScript.totalDuration,
                            sceneCount: videoScript.scenes.length,
                            qualityScore: qualityScore,
                            hasStoryboard: !!videoStoryboard,
                        }, "Video script generated successfully");
                        return [2 /*return*/, {
                                videoScript: videoScript,
                                videoStoryboard: videoStoryboard,
                                qualityScore: qualityScore,
                                recommendations: recommendations,
                                estimatedPerformance: estimatedPerformance,
                            }];
                    case 4:
                        error_1 = _a.sent();
                        logger_1.log.error({ err: error_1 }, 'Video script generation error');
                        throw new Error("Failed to generate video script: ".concat(error_1 instanceof Error ? error_1.message : 'Unknown error'));
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate the video script content
     */
    VideoScriptService.prototype.generateScript = function (request, campaign, brandKit) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, completion, response;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        prompt = this.buildVideoScriptPrompt(request, campaign, brandKit);
                        return [4 /*yield*/, this.openai.chat.completions.create({
                                model: 'gpt-4',
                                messages: [
                                    {
                                        role: 'system',
                                        content: 'You are an expert video script writer specializing in short-form social media content. Create compelling, engaging video scripts that drive action.',
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
                            throw new Error('Failed to generate video script content');
                        }
                        return [2 /*return*/, this.parseVideoScriptResponse(response, request)];
                }
            });
        });
    };
    /**
     * Build comprehensive prompt for video script generation
     */
    VideoScriptService.prototype.buildVideoScriptPrompt = function (request, campaign, brandKit) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        // Use campaign-aware prompting if we have context
        if (campaign && brandKit) {
            var campaignContext = this.campaignAwareService.buildCampaignContext(campaign, brandKit);
            var assetContext = {
                description: request.assetDescription,
                category: 'video-script',
                features: request.product.features,
                benefits: request.product.benefits,
                useCases: request.product.useCases,
            };
            var basePrompt = this.campaignAwareService.generateCampaignAwarePrompt(campaignContext, assetContext, 'main', // variation type not as relevant for video
            request.platforms, 'video-script');
            // Add video-specific requirements to the campaign-aware prompt
            return "".concat(basePrompt, "\n\nVIDEO-SPECIFIC REQUIREMENTS:\nVideo Length: ").concat(request.videoLength, " seconds\nProduct: ").concat(request.product.name, " (").concat(request.product.category, ")\nScene Structure: 5 scenes (Hook \u2192 Problem \u2192 Benefit \u2192 Demo \u2192 CTA)\nPlatform: ").concat(request.platforms.join(', '), "\n\nSCENE BREAKDOWN:\n- Scene 1 (Hook): 2-4 seconds - Grab attention immediately\n- Scene 2 (Problem): 3-5 seconds - Identify audience pain point\n- Scene 3 (Benefit): 3-5 seconds - Show the solution/benefit\n- Scene 4 (Demo): 4-7 seconds - Quick demonstration or proof\n- Scene 5 (CTA): 2-3 seconds - Clear call to action\n\nVIDEO SCRIPT OUTPUT FORMAT:\n{\n  \"scenes\": [\n    {\n      \"sceneNumber\": 1,\n      \"type\": \"hook\",\n      \"duration\": 3,\n      \"script\": \"Compelling opening that grabs attention\",\n      \"visualNotes\": \"Visual description of what happens on screen\"\n    },\n    {\n      \"sceneNumber\": 2,\n      \"type\": \"problem\",\n      \"duration\": 4,\n      \"script\": \"Problem statement that resonates with audience\",\n      \"visualNotes\": \"Visual showing the problem\"\n    },\n    {\n      \"sceneNumber\": 3,\n      \"type\": \"benefit\",\n      \"duration\": 4,\n      \"script\": \"Benefit statement showing the solution\",\n      \"visualNotes\": \"Visual showing the positive outcome\"\n    },\n    {\n      \"sceneNumber\": 4,\n      \"type\": \"demo\",\n      \"duration\": 5,\n      \"script\": \"Quick demonstration or proof\",\n      \"visualNotes\": \"Visual of product in action\"\n    },\n    {\n      \"sceneNumber\": 5,\n      \"type\": \"cta\",\n      \"duration\": 2,\n      \"script\": \"Clear call to action\",\n      \"visualNotes\": \"Visual reinforcing the CTA\"\n    }\n  ],\n  \"totalDuration\": 18,\n  \"cta\": \"Strong call to action text\",\n  \"platform\": \"").concat(request.platforms[0], "\"\n}\n\nVIDEO SCRIPT GUIDELINES:\n- Total script must be exactly ").concat(request.videoLength, " seconds\n- Each scene should flow naturally into the next\n- Use conversational, engaging language\n- Include visual directions for each scene\n- End with a strong, clear call to action\n- Adapt tone for ").concat(request.platforms.join(' and '), " audience\n- Focus on ").concat(request.objective, " objective\n- Use these tones: ").concat(request.tone.join(', '), "\n\nGenerate a compelling ").concat(request.videoLength, "-second video script for ").concat(request.product.name, ".\n      ").trim();
        }
        // Fallback to basic prompting without campaign context
        return "\nGenerate a ".concat(request.videoLength, "-second video script for ").concat(request.product.name, ".\n\nPRODUCT DETAILS:\nName: ").concat(request.product.name, "\nCategory: ").concat(request.product.category, "\nFeatures: ").concat(((_a = request.product.features) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'Not specified', "\nBenefits: ").concat(((_b = request.product.benefits) === null || _b === void 0 ? void 0 : _b.join(', ')) || 'Not specified', "\nUse Cases: ").concat(((_c = request.product.useCases) === null || _c === void 0 ? void 0 : _c.join(', ')) || 'Not specified', "\n\nASSET DESCRIPTION:\n").concat(request.assetDescription, "\n\nVIDEO REQUIREMENTS:\nLength: ").concat(request.videoLength, " seconds\nPlatforms: ").concat(request.platforms.join(', '), "\nObjective: ").concat(request.objective, "\nTone: ").concat(request.tone.join(', '), "\n\nTARGET AUDIENCE:\n").concat(request.targetAudience ? "\n- Demographics: ".concat(request.targetAudience.demographics, "\n- Psychographics: ").concat(request.targetAudience.psychographics, "\n- Pain Points: ").concat((_d = request.targetAudience.painPoints) === null || _d === void 0 ? void 0 : _d.join(', '), "\n") : 'General audience', "\n\nCAMPAIGN CONTEXT:\n").concat(campaign ? "\n- Campaign Name: ".concat(campaign.name, "\n- Key Message: ").concat(((_e = campaign.brief) === null || _e === void 0 ? void 0 : _e.keyMessage) || 'Not specified', "\n- Primary Audience: ").concat(((_g = (_f = campaign.brief) === null || _f === void 0 ? void 0 : _f.primaryAudience) === null || _g === void 0 ? void 0 : _g.demographics) || 'Not specified', "\n") : 'No specific campaign context provided', "\n\nBRAND CONTEXT:\n").concat(brandKit ? "\n- Brand Personality: ".concat(brandKit.brandPersonality || 'Professional', "\n- Value Proposition: ").concat(brandKit.valueProposition || 'Quality products', "\n- Brand Colors: ").concat(((_h = brandKit.colors) === null || _h === void 0 ? void 0 : _h.primary) || 'Not specified', ", ").concat(((_j = brandKit.colors) === null || _j === void 0 ? void 0 : _j.secondary) || 'Not specified', "\n") : 'No specific brand context provided', "\n\n5-SCENE STRUCTURE:\n1. Hook (2-4s): Grab attention immediately\n2. Problem (3-5s): Identify audience pain point\n3. Benefit (3-5s): Show the solution/benefit\n4. Demo (4-7s): Quick demonstration or proof\n5. CTA (2-3s): Clear call to action\n\nOUTPUT FORMAT:\n{\n  \"scenes\": [\n    {\n      \"sceneNumber\": 1,\n      \"type\": \"hook\",\n      \"duration\": 3,\n      \"script\": \"Opening hook\",\n      \"visualNotes\": \"Visual description\"\n    },\n    {\n      \"sceneNumber\": 2,\n      \"type\": \"problem\",\n      \"duration\": 4,\n      \"script\": \"Problem statement\",\n      \"visualNotes\": \"Visual showing problem\"\n    },\n    {\n      \"sceneNumber\": 3,\n      \"type\": \"benefit\",\n      \"duration\": 4,\n      \"script\": \"Benefit statement\",\n      \"visualNotes\": \"Visual showing benefit\"\n    },\n    {\n      \"sceneNumber\": 4,\n      \"type\": \"demo\",\n      \"duration\": 5,\n      \"script\": \"Demonstration\",\n      \"visualNotes\": \"Visual of product in action\"\n    },\n    {\n      \"sceneNumber\": 5,\n      \"type\": \"cta\",\n      \"duration\": 2,\n      \"script\": \"Call to action\",\n      \"visualNotes\": \"Visual reinforcing CTA\"\n    }\n  ],\n  \"totalDuration\": 18,\n  \"cta\": \"Strong call to action\",\n  \"platform\": \"primary platform\"\n}\n\nGenerate an engaging, conversion-focused video script.\n    ").trim();
    };
    /**
     * Parse AI response into VideoScript
     */
    VideoScriptService.prototype.parseVideoScriptResponse = function (response, request) {
        try {
            // Extract JSON from response
            var jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }
            var scriptData_1 = JSON.parse(jsonMatch[0]);
            // Validate scene structure
            if (!scriptData_1.scenes || !Array.isArray(scriptData_1.scenes)) {
                throw new Error('Invalid scene structure in response');
            }
            // Ensure we have all 5 required scene types
            var requiredSceneTypes = ['hook', 'problem', 'benefit', 'demo', 'cta'];
            var sceneTypes_1 = scriptData_1.scenes.map(function (scene) { return scene.type; });
            // Add missing scenes if needed
            requiredSceneTypes.forEach(function (type, index) {
                if (!sceneTypes_1.includes(type)) {
                    scriptData_1.scenes.splice(index, 0, {
                        sceneNumber: index + 1,
                        type: type,
                        duration: 3,
                        script: "Default ".concat(type, " content for ").concat(request.product.name),
                        visualNotes: "Visual showing ".concat(type),
                    });
                }
            });
            // Recalculate durations to match requested total
            var actualDuration = scriptData_1.scenes.reduce(function (sum, scene) { return sum + scene.duration; }, 0);
            var durationRatio_1 = request.videoLength / actualDuration;
            scriptData_1.scenes.forEach(function (scene) {
                scene.duration = Math.round(scene.duration * durationRatio_1);
            });
            scriptData_1.totalDuration = scriptData_1.scenes.reduce(function (sum, scene) { return sum + scene.duration; }, 0);
            scriptData_1.platform = request.platforms[0];
            return scriptData_1;
        }
        catch (error) {
            logger_1.log.error({ err: error }, 'Error parsing video script response');
            // Fallback structure
            var baseScene = {
                script: "Default content for ".concat(request.product.name),
                visualNotes: 'Default visual description',
            };
            return {
                scenes: [
                    __assign({ sceneNumber: 1, type: 'hook', duration: 3 }, baseScene),
                    __assign({ sceneNumber: 2, type: 'problem', duration: 4 }, baseScene),
                    __assign({ sceneNumber: 3, type: 'benefit', duration: 4 }, baseScene),
                    __assign({ sceneNumber: 4, type: 'demo', duration: 5 }, baseScene),
                    __assign({ sceneNumber: 5, type: 'cta', duration: 2 }, baseScene),
                ],
                totalDuration: 18,
                cta: 'Learn more about our product',
                platform: request.platforms[0],
            };
        }
    };
    /**
     * Generate storyboard for video script
     */
    VideoScriptService.prototype.generateStoryboard = function (videoScript, request, campaign, brandKit) {
        return __awaiter(this, void 0, void 0, function () {
            var storyboardFrames;
            return __generator(this, function (_a) {
                try {
                    logger_1.log.info({ sceneCount: videoScript.scenes.length }, "Generating storyboard frames for video script");
                    storyboardFrames = videoScript.scenes.map(function (scene) { return ({
                        sceneNumber: scene.sceneNumber,
                        type: scene.type,
                        duration: scene.duration,
                        script: scene.script,
                        imageUrl: "https://via.placeholder.com/1080x1920/000000/FFFFFF?text=".concat(encodeURIComponent("Scene ".concat(scene.sceneNumber, ": ").concat(scene.type.toUpperCase()))),
                        thumbnailUrl: "https://via.placeholder.com/320x568/000000/FFFFFF?text=".concat(encodeURIComponent("".concat(scene.sceneNumber))),
                    }); });
                    return [2 /*return*/, {
                            videoScriptId: "storyboard-".concat(Date.now()),
                            scenes: storyboardFrames,
                            totalDuration: videoScript.totalDuration,
                        }];
                }
                catch (error) {
                    logger_1.log.error({ err: error }, 'Error generating storyboard');
                    throw new Error('Failed to generate storyboard');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Calculate quality score for video script
     */
    VideoScriptService.prototype.calculateQualityScore = function (videoScript, request) {
        var score = 0;
        var maxScore = 100;
        // Check scene completeness (25 points)
        var requiredSceneTypes = ['hook', 'problem', 'benefit', 'demo', 'cta'];
        var hasAllScenes = requiredSceneTypes.every(function (type) {
            return videoScript.scenes.some(function (scene) { return scene.type === type; });
        });
        if (hasAllScenes)
            score += 25;
        // Check duration accuracy (20 points)
        var durationDiff = Math.abs(videoScript.totalDuration - request.videoLength);
        if (durationDiff <= 2)
            score += 20;
        else if (durationDiff <= 5)
            score += 10;
        // Check scene flow (20 points)
        var scenesOrdered = videoScript.scenes.every(function (scene, index) {
            return scene.sceneNumber === index + 1;
        });
        if (scenesOrdered)
            score += 20;
        // Check content quality (20 points)
        var avgScriptLength = videoScript.scenes.reduce(function (sum, scene) {
            return sum + scene.script.length;
        }, 0) / videoScript.scenes.length;
        if (avgScriptLength >= 20 && avgScriptLength <= 200)
            score += 10;
        if (avgScriptLength > 50)
            score += 10;
        // Check CTA strength (15 points)
        var ctaScene = videoScript.scenes.find(function (scene) { return scene.type === 'cta'; });
        if (ctaScene) {
            if (ctaScene.script.toLowerCase().includes('shop'))
                score += 5;
            if (ctaScene.script.toLowerCase().includes('now'))
                score += 5;
            if (ctaScene.script.toLowerCase().includes('get'))
                score += 5;
        }
        return Math.min(score, maxScore);
    };
    /**
     * Generate recommendations for video script
     */
    VideoScriptService.prototype.generateRecommendations = function (videoScript, request) {
        var recommendations = [];
        // Check duration
        if (Math.abs(videoScript.totalDuration - request.videoLength) > 2) {
            recommendations.push("Adjust scene durations to match target length of ".concat(request.videoLength, " seconds"));
        }
        // Check scene flow
        var scenesOrdered = videoScript.scenes.every(function (scene, index) {
            return scene.sceneNumber === index + 1;
        });
        if (!scenesOrdered) {
            recommendations.push('Ensure scenes are properly numbered and ordered');
        }
        // Check content length
        videoScript.scenes.forEach(function (scene) {
            if (scene.script.length < 10) {
                recommendations.push("Add more detail to Scene ".concat(scene.sceneNumber, " (").concat(scene.type, ")"));
            }
            if (scene.script.length > 150) {
                recommendations.push("Shorten Scene ".concat(scene.sceneNumber, " (").concat(scene.type, ") for better engagement"));
            }
        });
        // Check visual notes
        videoScript.scenes.forEach(function (scene) {
            if (!scene.visualNotes || scene.visualNotes.length < 5) {
                recommendations.push("Add more detailed visual notes for Scene ".concat(scene.sceneNumber));
            }
        });
        // Check CTA
        var ctaScene = videoScript.scenes.find(function (scene) { return scene.type === 'cta'; });
        if (!ctaScene) {
            recommendations.push('Ensure a strong call-to-action scene is included');
        }
        else if (!ctaScene.script.match(/\b(shop|buy|get|now|start|try|learn)\b/i)) {
            recommendations.push('Strengthen the call-to-action with more action-oriented language');
        }
        return recommendations;
    };
    /**
     * Estimate video performance metrics
     */
    VideoScriptService.prototype.estimatePerformance = function (videoScript, request) {
        // Base metrics by objective
        var baseMetrics = {
            awareness: { engagementRate: 0.045, completionRate: 0.65, shareability: 0.025 },
            consideration: { engagementRate: 0.055, completionRate: 0.70, shareability: 0.030 },
            conversion: { engagementRate: 0.040, completionRate: 0.75, shareability: 0.015 },
            retention: { engagementRate: 0.060, completionRate: 0.60, shareability: 0.020 },
        };
        var base = baseMetrics[request.objective];
        // Platform adjustments
        var platformMultipliers = {
            instagram: 1.1,
            facebook: 1.0,
            linkedin: 0.8,
            tiktok: 1.3,
        };
        var platformMultiplier = 1.0;
        request.platforms.forEach(function (platform) {
            platformMultiplier = Math.max(platformMultiplier, platformMultipliers[platform] || 1.0);
        });
        // Duration adjustments (shorter videos generally perform better)
        var durationMultiplier = 1.0;
        if (videoScript.totalDuration <= 15)
            durationMultiplier = 1.2;
        else if (videoScript.totalDuration <= 30)
            durationMultiplier = 1.0;
        else if (videoScript.totalDuration <= 60)
            durationMultiplier = 0.9;
        else
            durationMultiplier = 0.7;
        return {
            engagementRate: base.engagementRate * platformMultiplier * durationMultiplier,
            completionRate: base.completionRate * platformMultiplier * durationMultiplier,
            shareability: base.shareability * platformMultiplier * durationMultiplier,
        };
    };
    return VideoScriptService;
}());
exports.VideoScriptService = VideoScriptService;
