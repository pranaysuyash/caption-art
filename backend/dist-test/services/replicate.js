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
exports.withRetry = withRetry;
exports.generateBaseCaption = generateBaseCaption;
exports.generateMask = generateMask;
exports.generateImage = generateImage;
var replicate_1 = __importDefault(require("replicate"));
var config_1 = require("../config");
// Retry configuration
var MAX_RETRIES = 3;
var INITIAL_RETRY_DELAY = 1000; // 1 second
var TIMEOUT_MS = 30000; // 30 seconds
/**
 * Executes a function with exponential backoff retry logic
 * Exported for testing purposes
 */
function withRetry(fn_1) {
    return __awaiter(this, arguments, void 0, function (fn, options) {
        var lastError, _loop_1, attempt, state_1;
        if (options === void 0) { options = {
            maxRetries: MAX_RETRIES,
            initialDelay: INITIAL_RETRY_DELAY,
            timeout: TIMEOUT_MS,
        }; }
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _loop_1 = function (attempt) {
                        var timeoutPromise, result, error_1, delay_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 5]);
                                    timeoutPromise = new Promise(function (_, reject) {
                                        setTimeout(function () {
                                            reject(new Error("Operation timed out after ".concat(options.timeout, "ms")));
                                        }, options.timeout);
                                    });
                                    return [4 /*yield*/, Promise.race([fn(), timeoutPromise])];
                                case 1:
                                    result = _b.sent();
                                    return [2 /*return*/, { value: result }];
                                case 2:
                                    error_1 = _b.sent();
                                    lastError = error_1 instanceof Error ? error_1 : new Error(String(error_1));
                                    if (!(attempt < options.maxRetries)) return [3 /*break*/, 4];
                                    delay_1 = options.initialDelay * Math.pow(2, attempt);
                                    return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, delay_1); })];
                                case 3:
                                    _b.sent();
                                    _b.label = 4;
                                case 4: return [3 /*break*/, 5];
                                case 5: return [2 /*return*/];
                            }
                        });
                    };
                    attempt = 0;
                    _a.label = 1;
                case 1:
                    if (!(attempt <= options.maxRetries)) return [3 /*break*/, 4];
                    return [5 /*yield**/, _loop_1(attempt)];
                case 2:
                    state_1 = _a.sent();
                    if (typeof state_1 === "object")
                        return [2 /*return*/, state_1.value];
                    _a.label = 3;
                case 3:
                    attempt++;
                    return [3 /*break*/, 1];
                case 4: throw lastError || new Error('Operation failed after retries');
            }
        });
    });
}
/**
 * Generates a base caption for an image using Replicate's BLIP model
 * @param imageUrl - Direct URL to the image (can be http/https URL or base64 data URI)
 * @returns Base caption string
 */
function generateBaseCaption(imageUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                    var replicate, output, caption;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                replicate = new replicate_1.default({ auth: config_1.config.replicate.apiToken });
                                return [4 /*yield*/, replicate.run(config_1.config.replicate.blipModel, {
                                        input: {
                                            image: imageUrl,
                                        },
                                    })
                                    // BLIP returns a string
                                ];
                            case 1:
                                output = _a.sent();
                                caption = typeof output === 'string' ? output : String(output);
                                return [2 /*return*/, caption.trim()];
                        }
                    });
                }); })];
        });
    });
}
/**
 * Generates a subject mask for an image using Replicate's rembg model
 * @param imageUrl - Direct URL to the image (can be http/https URL or base64 data URI)
 * @returns URL to the generated mask image
 */
function generateMask(imageUrl) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                    var replicate, output, maskUrl;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                replicate = new replicate_1.default({ auth: config_1.config.replicate.apiToken });
                                return [4 /*yield*/, replicate.run(config_1.config.replicate.rembgModel, {
                                        input: {
                                            image: imageUrl,
                                        },
                                    })
                                    // rembg returns a URL to the mask image
                                ];
                            case 1:
                                output = _a.sent();
                                maskUrl = typeof output === 'string' ? output : String(output);
                                return [2 /*return*/, maskUrl];
                        }
                    });
                }); })];
        });
    });
}
/**
 * Generates an image from a text prompt using Replicate's SDXL model
 * @param prompt - The text prompt for image generation
 * @returns URL to the generated image
 */
function generateImage(prompt) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        return __generator(this, function (_a) {
            return [2 /*return*/, withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                    var replicate, model, output, imageUrl;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                replicate = new replicate_1.default({ auth: config_1.config.replicate.apiToken });
                                model = 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b7159d72228b194';
                                return [4 /*yield*/, replicate.run(model, {
                                        input: {
                                            prompt: prompt,
                                            width: 1024,
                                            height: 1024,
                                            refine: 'expert_ensemble_refiner',
                                            apply_watermark: false,
                                            num_inference_steps: 25,
                                        },
                                    })
                                    // SDXL returns an array of strings (URLs)
                                ];
                            case 1:
                                output = _a.sent();
                                imageUrl = Array.isArray(output) ? output[0] : String(output);
                                return [2 /*return*/, imageUrl];
                        }
                    });
                }); })];
        });
    });
}
