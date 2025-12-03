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
exports.VisualStyleAnalyzer = void 0;
var openai_1 = __importDefault(require("openai"));
var logger_1 = require("../middleware/logger");
var openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY,
});
var VisualStyleAnalyzer = /** @class */ (function () {
    function VisualStyleAnalyzer() {
    }
    /**
     * Analyze a reference creative image to extract visual style characteristics
     */
    VisualStyleAnalyzer.analyzeVisualStyle = function (imageUrl) {
        return __awaiter(this, void 0, void 0, function () {
            var systemPrompt, completion, analysis, visualAnalysis, error_1;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _e.trys.push([0, 2, , 3]);
                        systemPrompt = "You are a visual design analysis expert. Analyze the provided image and extract detailed style characteristics.\n\nYour analysis should identify:\n1. Color palette - extract the main 5-7 colors visible in the image (hex codes if possible)\n2. Layout pattern - determine the primary layout structure\n3. Text density - assess how much text is present\n4. Style characteristics - identify key design style attributes\n5. Composition - describe the overall visual composition\n6. Typography - assess font styles and text treatment\n7. Visual elements - identify notable design elements\n\nReturn your analysis as a JSON object with this structure:\n{\n  \"extractedColors\": [\"#color1\", \"#color2\", \"#color3\"],\n  \"detectedLayout\": \"center-focus\" | \"bottom-text\" | \"top-text\" | \"split\",\n  \"textDensity\": \"minimal\" | \"moderate\" | \"heavy\",\n  \"styleTags\": [\"high-contrast\", \"bold-typography\", \"minimal\", \"vibrant\", \"monochrome\"],\n  \"dominantColors\": [\"#color1\", \"#color2\"],\n  \"colorPalette\": [\"#color1\", \"#color2\", \"#color3\", \"#color4\", \"#color5\"],\n  \"composition\": \"description of overall composition\",\n  \"typography\": \"description of typography style\",\n  \"visualElements\": [\"element1\", \"element2\", \"element3\"]\n}\n\nLayout patterns:\n- center-focus: Main subject/element centered in frame\n- bottom-text: Text positioned at bottom of image\n- top-text: Text positioned at top of image\n- split: Image divided into sections (left/right, top/bottom)\n\nText density:\n- minimal: Very little text, just logo or short headline\n- moderate: Noticeable text but not overwhelming\n- heavy: Text is a dominant element in the design";
                        return [4 /*yield*/, openai.chat.completions.create({
                                model: 'gpt-4-vision-preview',
                                messages: [
                                    {
                                        role: 'system',
                                        content: systemPrompt,
                                    },
                                    {
                                        role: 'user',
                                        content: [
                                            {
                                                type: 'text',
                                                text: 'Analyze this image and extract the visual style characteristics:',
                                            },
                                            {
                                                type: 'image_url',
                                                image_url: {
                                                    url: imageUrl,
                                                },
                                            },
                                        ],
                                    },
                                ],
                                max_tokens: 1000,
                                temperature: 0.2, // Lower temperature for consistent analysis
                                response_format: { type: 'json_object' },
                            })];
                    case 1:
                        completion = _e.sent();
                        analysis = (_c = (_b = (_a = completion.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
                        if (!analysis) {
                            throw new Error('Failed to analyze visual style: No content returned from AI');
                        }
                        visualAnalysis = JSON.parse(analysis);
                        // Validate and normalize the response
                        return [2 /*return*/, {
                                extractedColors: visualAnalysis.extractedColors || [],
                                detectedLayout: this.normalizeLayout(visualAnalysis.detectedLayout),
                                textDensity: this.normalizeTextDensity(visualAnalysis.textDensity),
                                styleTags: this.normalizeStyleTags(visualAnalysis.styleTags || []),
                                dominantColors: visualAnalysis.dominantColors ||
                                    ((_d = visualAnalysis.extractedColors) === null || _d === void 0 ? void 0 : _d.slice(0, 2)) ||
                                    [],
                                colorPalette: visualAnalysis.colorPalette || visualAnalysis.extractedColors || [],
                                composition: visualAnalysis.composition || 'Visual composition analysis',
                                typography: visualAnalysis.typography || 'Typography style analysis',
                                visualElements: visualAnalysis.visualElements || [],
                            }];
                    case 2:
                        error_1 = _e.sent();
                        logger_1.log.error({ err: error_1 }, 'Error analyzing visual style');
                        // Fallback to basic analysis if AI fails
                        return [2 /*return*/, this.getFallbackAnalysis(imageUrl)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Normalize layout value to allowed types
     */
    VisualStyleAnalyzer.normalizeLayout = function (layout) {
        var validLayouts = ['center-focus', 'bottom-text', 'top-text', 'split'];
        return validLayouts.includes(layout) ? layout : 'center-focus';
    };
    /**
     * Normalize text density value to allowed types
     */
    VisualStyleAnalyzer.normalizeTextDensity = function (density) {
        var validDensities = ['minimal', 'moderate', 'heavy'];
        return validDensities.includes(density) ? density : 'moderate';
    };
    /**
     * Normalize and limit style tags
     */
    VisualStyleAnalyzer.normalizeStyleTags = function (tags) {
        var allStyleTags = [
            'high-contrast',
            'bold-typography',
            'minimal',
            'vibrant',
            'monochrome',
            'gradient',
            'geometric',
            'organic',
            'retro',
            'modern',
            'classic',
            'playful',
            'professional',
            'elegant',
            'edgy',
            'clean',
        ];
        return tags
            .filter(function (tag) { return allStyleTags.includes(tag.toLowerCase()); })
            .slice(0, 5); // Limit to 5 most relevant tags
    };
    /**
     * Fallback analysis for when AI analysis fails
     */
    VisualStyleAnalyzer.getFallbackAnalysis = function (imageUrl) {
        return {
            extractedColors: ['#000000', '#FFFFFF', '#3B82F6', '#10B981', '#F59E0B'],
            detectedLayout: 'center-focus',
            textDensity: 'moderate',
            styleTags: ['clean', 'professional'],
            dominantColors: ['#000000', '#FFFFFF'],
            colorPalette: ['#000000', '#FFFFFF', '#3B82F6', '#10B981', '#F59E0B'],
            composition: 'Balanced visual composition with central focus',
            typography: 'Clean, readable typography',
            visualElements: ['Central imagery', 'Text overlay', 'Brand elements'],
        };
    };
    /**
     * Convert visual style analysis into prompt instructions for creative generation
     */
    VisualStyleAnalyzer.visualStyleToPrompt = function (analysis) {
        var instructions = [];
        if (analysis.styleTags && analysis.styleTags.length > 0) {
            instructions.push("Style: Create a ".concat(analysis.styleTags.join(', '), " design"));
        }
        if (analysis.detectedLayout) {
            instructions.push("Layout: Use a ".concat(analysis.detectedLayout.replace('-', ' '), " layout"));
        }
        if (analysis.colorPalette && analysis.colorPalette.length > 0) {
            instructions.push("Colors: Use a color palette similar to ".concat(analysis.colorPalette.join(', ')));
        }
        if (analysis.textDensity) {
            instructions.push("Text: Use ".concat(analysis.textDensity, " text placement"));
        }
        if (analysis.composition) {
            instructions.push("Composition: ".concat(analysis.composition));
        }
        if (analysis.typography) {
            instructions.push("Typography: ".concat(analysis.typography));
        }
        return instructions.join('\n- ');
    };
    return VisualStyleAnalyzer;
}());
exports.VisualStyleAnalyzer = VisualStyleAnalyzer;
