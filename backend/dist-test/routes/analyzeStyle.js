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
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var visualStyleAnalyzer_1 = require("../services/visualStyleAnalyzer");
var auth_1 = require("./auth");
var logger_1 = require("../middleware/logger");
var router = (0, express_1.Router)();
var requireAuth = (0, auth_1.createAuthMiddleware)();
/**
 * POST /api/analyze-style
 * Analyze visual style characteristics of an image
 */
router.post('/', requireAuth, function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var imageUrl, analysis, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                imageUrl = req.body.imageUrl;
                if (!imageUrl) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'imageUrl is required',
                        })];
                }
                // Validate imageUrl format
                try {
                    new URL(imageUrl);
                }
                catch (_b) {
                    return [2 /*return*/, res.status(400).json({
                            error: 'imageUrl must be a valid URL',
                        })];
                }
                logger_1.log.info({ imageUrl: imageUrl, requestId: req.requestId }, "Analyzing visual style for image");
                return [4 /*yield*/, visualStyleAnalyzer_1.VisualStyleAnalyzer.analyzeVisualStyle(imageUrl)];
            case 1:
                analysis = _a.sent();
                logger_1.log.info({ imageUrl: imageUrl, requestId: req.requestId }, "Visual style analysis completed");
                res.json({
                    success: true,
                    analysis: analysis,
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                logger_1.log.error({ err: error_1, imageUrl: imageUrl, requestId: req.requestId }, 'Visual style analysis error');
                if (error_1 instanceof Error) {
                    return [2 /*return*/, res.status(400).json({
                            error: error_1.message,
                        })];
                }
                res.status(500).json({
                    error: 'Failed to analyze visual style',
                });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
/**
 * GET /api/analyze-style/health
 * Health check endpoint for style analysis service
 */
router.get('/health', function (req, res) {
    res.json({
        status: 'ok',
        service: 'visual-style-analyzer',
        timestamp: new Date().toISOString(),
    });
});
exports.default = router;
