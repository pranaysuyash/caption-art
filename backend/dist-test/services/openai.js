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
exports.TONE_PROMPTS = void 0;
exports.rewriteCaption = rewriteCaption;
exports.generateNextScenePrompt = generateNextScenePrompt;
var openai_1 = __importDefault(require("openai"));
var config_1 = require("../config");
var replicate_1 = require("./replicate");
exports.TONE_PROMPTS = {
    default: 'You are a creative copywriter for image captions. Given a base caption, produce 5 concise, catchy variants for social posts. Keep 4-10 words each. Avoid hashtags, avoid quotes.',
    witty: 'You are a witty and sarcastic copywriter. Given a base caption, produce 5 short, punchy, and funny variants for social posts. Use irony and humor. Keep it under 10 words. No hashtags.',
    inspirational: 'You are an inspirational and uplifting copywriter. Given a base caption, produce 5 moving and motivational variants. Use powerful words. Keep it concise. No hashtags.',
    formal: 'You are a professional and formal copywriter for a business or news outlet. Given a base caption, produce 5 clear, objective, and descriptive variants. Avoid slang and exclamation points.',
};
/**
 * Rewrites a base caption into multiple creative variants using OpenAI
 * @param baseCaption - The base caption to rewrite
 * @param keywords - Optional keywords to incorporate into variants
 * @param tone - The desired tone of voice for the captions
 * @returns Array of caption variants
 */
function rewriteCaption(baseCaption_1) {
    return __awaiter(this, arguments, void 0, function (baseCaption, keywords, tone) {
        var _this = this;
        if (keywords === void 0) { keywords = []; }
        if (tone === void 0) { tone = 'default'; }
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, replicate_1.withRetry)(function () { return __awaiter(_this, void 0, void 0, function () {
                    var openai, keywordText, basePrompt, prompt, response, text, variants;
                    var _a, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                openai = new openai_1.default({ apiKey: config_1.config.openai.apiKey });
                                keywordText = keywords.length > 0 ? "Keywords: ".concat(keywords.join(', ')) : '';
                                basePrompt = exports.TONE_PROMPTS[tone] || exports.TONE_PROMPTS.default;
                                prompt = "".concat(basePrompt, " ").concat(keywordText ? 'If keywords are provided, weave 1-2 in naturally.' : '', " Base: \"").concat(baseCaption, "\". ").concat(keywordText);
                                return [4 /*yield*/, openai.chat.completions.create({
                                        model: config_1.config.openai.model,
                                        messages: [{ role: 'user', content: prompt }],
                                        temperature: config_1.config.openai.temperature,
                                    })];
                            case 1:
                                response = _c.sent();
                                text = ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || '';
                                variants = text
                                    .split(/\n|\r/)
                                    .map(function (s) { return s.replace(/^[-*\d.\s]+/, '').trim(); })
                                    .filter(Boolean)
                                    .slice(0, 5);
                                return [2 /*return*/, variants];
                        }
                    });
                }); }, {
                    maxRetries: 2, // Retry twice for OpenAI
                    initialDelay: 1000,
                    timeout: 30000,
                })];
        });
    });
}
/**
 * Generates a prompt for the next scene in a story using OpenAI
 * @param currentCaption - The caption of the current scene
 * @param styleContext - The style description to maintain consistency
 * @returns A prompt for the next scene
 */
function generateNextScenePrompt(currentCaption, styleContext) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, (0, replicate_1.withRetry)(function () { return __awaiter(_this, void 0, void 0, function () {
                    var openai, prompt, response;
                    var _a, _b;
                    return __generator(this, function (_c) {
                        switch (_c.label) {
                            case 0:
                                openai = new openai_1.default({ apiKey: config_1.config.openai.apiKey });
                                prompt = "You are a visual storyteller. Given the current scene: \"".concat(currentCaption, "\", write a concise visual description (prompt) for the NEXT scene in the story.\n      \n      Constraints:\n      1. Keep the style consistent with: \"").concat(styleContext, "\".\n      2. Focus on visual details (lighting, composition, subject action).\n      3. Keep it under 40 words.\n      4. Do not include \"Next scene:\" or similar prefixes. Just the visual description.");
                                return [4 /*yield*/, openai.chat.completions.create({
                                        model: config_1.config.openai.model,
                                        messages: [{ role: 'user', content: prompt }],
                                        temperature: 0.7,
                                    })];
                            case 1:
                                response = _c.sent();
                                return [2 /*return*/, ((_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) || ''];
                        }
                    });
                }); }, {
                    maxRetries: 2,
                    initialDelay: 1000,
                    timeout: 30000,
                })];
        });
    });
}
