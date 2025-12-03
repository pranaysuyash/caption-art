"use strict";
/**
 * Template Integration Service
 * Connects the template memory system with the creative engine
 */
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateIntegrationService = void 0;
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var TemplateMemoryService_1 = require("./TemplateMemoryService");
var TemplateIntegrationService = /** @class */ (function () {
    function TemplateIntegrationService() {
    }
    /**
     * Automatically learn from newly approved content and create templates
     */
    TemplateIntegrationService.learnFromApproval = function (captionId, workspaceId, campaignId) {
        return __awaiter(this, void 0, void 0, function () {
            var caption, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger_1.log.info({ captionId: captionId, workspaceId: workspaceId, campaignId: campaignId }, 'Learning from newly approved content');
                        caption = auth_1.AuthModel.getCaptionById(captionId);
                        if (!caption) {
                            throw new Error("Caption ".concat(captionId, " not found"));
                        }
                        // Only learn from approved content
                        if (caption.approvalStatus !== 'approved') {
                            logger_1.log.debug({ captionId: captionId, approvalStatus: caption.approvalStatus }, 'Caption not approved, skipping learning');
                            return [2 /*return*/];
                        }
                        // Learn from this approved work to create templates
                        return [4 /*yield*/, TemplateMemoryService_1.TemplateMemoryService.learnFromApprovedWork(workspaceId, campaignId)];
                    case 1:
                        // Learn from this approved work to create templates
                        _a.sent();
                        logger_1.log.info({ captionId: captionId, workspaceId: workspaceId, campaignId: campaignId }, 'Template learning completed from approval');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.log.error({ err: error_1, captionId: captionId, workspaceId: workspaceId, campaignId: campaignId }, 'Template learning from approval failed');
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Apply learned templates to new content generation
     */
    TemplateIntegrationService.applyBestTemplate = function (workspaceId, context) {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        logger_1.log.info({ workspaceId: workspaceId, campaignId: context.campaignId }, 'Applying best template to new content');
                        return [4 /*yield*/, TemplateMemoryService_1.TemplateMemoryService.autoApplyBestTemplate(workspaceId, {
                                brandKit: auth_1.AuthModel.getBrandKitById(context.brandKitId),
                                campaign: context.campaignId ? auth_1.AuthModel.getCampaignById(context.campaignId) : undefined,
                                sourceText: context.sourceText,
                                targetLength: context.targetLength
                            })];
                    case 1:
                        result = _a.sent();
                        if (result) {
                            logger_1.log.info({
                                workspaceId: workspaceId,
                                templateId: result.templateId,
                                confidence: result.confidence
                            }, 'Best template applied successfully');
                        }
                        else {
                            logger_1.log.debug({ workspaceId: workspaceId }, 'No suitable template found for application');
                        }
                        return [2 /*return*/, result];
                    case 2:
                        error_2 = _a.sent();
                        logger_1.log.error({ err: error_2, workspaceId: workspaceId, campaignId: context.campaignId }, 'Template application failed');
                        return [2 /*return*/, null];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if templates exist for a workspace/campaign and get recommendations
     */
    TemplateIntegrationService.getTemplateRecommendations = function (workspaceId_1, campaignId_1) {
        return __awaiter(this, arguments, void 0, function (workspaceId, campaignId, limit) {
            var templates, error_3;
            if (limit === void 0) { limit = 5; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, TemplateMemoryService_1.TemplateMemoryService.getRecommendedTemplates(workspaceId, campaignId, limit)];
                    case 1:
                        templates = _a.sent();
                        return [2 /*return*/, templates.map(function (t) { return ({
                                id: t.id,
                                name: t.name,
                                confidence: t.performanceMetrics.approvalRate * (t.performanceMetrics.averageScore / 10) * (t.performanceMetrics.reuseCount / 10 + 0.1)
                            }); })];
                    case 2:
                        error_3 = _a.sent();
                        logger_1.log.error({ err: error_3, workspaceId: workspaceId, campaignId: campaignId }, 'Getting template recommendations failed');
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Auto-select the best performing templates for new campaigns
     */
    TemplateIntegrationService.autoSelectTemplatesForNewCampaign = function (workspaceId, newCampaignId) {
        return __awaiter(this, void 0, void 0, function () {
            var allTemplates, topTemplates, templateIds, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, TemplateMemoryService_1.TemplateMemoryService.getRecommendedTemplates(workspaceId, undefined, 10)
                            // Filter for the most successful templates (high approval rate, high scores, frequently reused)
                        ];
                    case 1:
                        allTemplates = _a.sent();
                        topTemplates = allTemplates
                            .filter(function (t) { return t.performanceMetrics.approvalRate >= 0.8 && t.performanceMetrics.averageScore >= 7; })
                            .sort(function (a, b) {
                            var scoreA = a.performanceMetrics.approvalRate * a.performanceMetrics.averageScore * a.performanceMetrics.reuseCount;
                            var scoreB = b.performanceMetrics.approvalRate * b.performanceMetrics.averageScore * b.performanceMetrics.reuseCount;
                            return scoreB - scoreA; // Descending order
                        })
                            .slice(0, 3) // Top 3 templates
                        ;
                        templateIds = topTemplates.map(function (t) { return t.id; });
                        logger_1.log.info({
                            workspaceId: workspaceId,
                            newCampaignId: newCampaignId,
                            selectedTemplateCount: templateIds.length
                        }, 'Auto-selected templates for new campaign');
                        return [2 /*return*/, templateIds];
                    case 2:
                        error_4 = _a.sent();
                        logger_1.log.error({ err: error_4, workspaceId: workspaceId, newCampaignId: newCampaignId }, 'Auto-selecting templates for new campaign failed');
                        return [2 /*return*/, []];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return TemplateIntegrationService;
}());
exports.TemplateIntegrationService = TemplateIntegrationService;
