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
exports.StyleAnalyzer = void 0;
var openai_1 = __importDefault(require("openai"));
var logger_1 = require("../middleware/logger");
var openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
var StyleAnalyzer = /** @class */ (function () {
    function StyleAnalyzer() {
    }
    /**
     * Analyze a collection of reference captions to extract style patterns
     */
    StyleAnalyzer.analyzeStyle = function (references) {
        return __awaiter(this, void 0, void 0, function () {
            var referencesText, systemPrompt, completion, analysis, styleProfile, error_1;
            var _a, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        if (references.length === 0) {
                            throw new Error('At least one reference caption is required');
                        }
                        _d.label = 1;
                    case 1:
                        _d.trys.push([1, 3, , 4]);
                        referencesText = references
                            .map(function (ref, idx) { return "Example ".concat(idx + 1, ":\n").concat(ref.text); })
                            .join('\n\n');
                        systemPrompt = "You are a style analysis expert. Analyze the provided caption examples and extract detailed style patterns.\n\nYour analysis should identify:\n1. Tone (e.g., professional, casual, playful, inspirational)\n2. Common vocabulary and word choices\n3. Sentence structure patterns (short/long, simple/complex)\n4. Punctuation style (heavy, minimal, specific patterns)\n5. Emoji usage (frequency, placement, types)\n6. Hashtag patterns (quantity, placement, style)\n7. Average caption length\n8. Unique stylistic patterns or signatures\n\nReturn your analysis as a JSON object with this structure:\n{\n  \"tone\": [\"tone1\", \"tone2\"],\n  \"vocabulary\": [\"word1\", \"word2\", \"phrase1\"],\n  \"sentenceStructure\": \"description\",\n  \"punctuationStyle\": \"description\",\n  \"emojiUsage\": \"description\",\n  \"hashtagPattern\": \"description\",\n  \"averageLength\": number,\n  \"uniquePatterns\": [\"pattern1\", \"pattern2\"]\n}";
                        return [4 /*yield*/, openai.chat.completions.create({
                                model: 'gpt-3.5-turbo',
                                messages: [
                                    {
                                        role: 'system',
                                        content: systemPrompt,
                                    },
                                    {
                                        role: 'user',
                                        content: "Analyze these caption examples and extract the style profile:\n\n".concat(referencesText),
                                    },
                                ],
                                max_tokens: 500,
                                temperature: 0.3, // Lower temperature for more consistent analysis
                                response_format: { type: 'json_object' },
                            })];
                    case 2:
                        completion = _d.sent();
                        analysis = (_c = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
                        if (!analysis) {
                            throw new Error('Failed to analyze style: No content returned from AI');
                        }
                        styleProfile = JSON.parse(analysis);
                        return [2 /*return*/, styleProfile];
                    case 3:
                        error_1 = _d.sent();
                        logger_1.log.error({ err: error_1 }, 'Error analyzing caption style');
                        throw new Error('Failed to analyze caption style');
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Convert a style profile into prompt instructions for caption generation
     */
    StyleAnalyzer.styleProfileToPrompt = function (profile) {
        var instructions = [];
        if (profile.tone && profile.tone.length > 0) {
            instructions.push("Tone: Maintain a ".concat(profile.tone.join(', '), " tone"));
        }
        if (profile.vocabulary && profile.vocabulary.length > 0) {
            instructions.push("Vocabulary: Use similar words and phrases like: ".concat(profile.vocabulary.slice(0, 10).join(', ')));
        }
        if (profile.sentenceStructure) {
            instructions.push("Sentence Structure: ".concat(profile.sentenceStructure));
        }
        if (profile.punctuationStyle) {
            instructions.push("Punctuation: ".concat(profile.punctuationStyle));
        }
        if (profile.emojiUsage) {
            instructions.push("Emojis: ".concat(profile.emojiUsage));
        }
        if (profile.hashtagPattern) {
            instructions.push("Hashtags: ".concat(profile.hashtagPattern));
        }
        if (profile.averageLength) {
            instructions.push("Length: Target approximately ".concat(profile.averageLength, " characters"));
        }
        if (profile.uniquePatterns && profile.uniquePatterns.length > 0) {
            instructions.push("Unique Style Elements: ".concat(profile.uniquePatterns.join('; ')));
        }
        return instructions.join('\n- ');
    };
    /**
     * Quick validation to ensure reference captions are suitable for analysis
     */
    StyleAnalyzer.validateReferences = function (references) {
        var issues = [];
        if (references.length === 0) {
            issues.push('No reference captions provided');
            return { valid: false, issues: issues };
        }
        if (references.length < 2) {
            issues.push('At least 2 reference captions recommended for accurate style analysis');
        }
        var emptyRefs = references.filter(function (ref) { return !ref.text || ref.text.trim().length === 0; });
        if (emptyRefs.length > 0) {
            issues.push("".concat(emptyRefs.length, " empty reference caption(s) found"));
        }
        var tooShortRefs = references.filter(function (ref) { return ref.text.trim().length < 10; });
        if (tooShortRefs.length > 0) {
            issues.push("".concat(tooShortRefs.length, " reference caption(s) are very short (< 10 characters)"));
        }
        return {
            valid: issues.length === 0,
            issues: issues,
        };
    };
    return StyleAnalyzer;
}());
exports.StyleAnalyzer = StyleAnalyzer;
