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
exports.ImageRenderer = void 0;
var canvas_1 = require("canvas");
var sharp_1 = __importDefault(require("sharp"));
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var crypto_1 = require("crypto");
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var maskingService_1 = require("./maskingService");
var CacheService_1 = require("./CacheService");
var ImageRenderer = /** @class */ (function () {
    function ImageRenderer() {
    }
    ImageRenderer.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Ensure output directory exists
                if (!fs_1.default.existsSync(this.OUTPUT_DIR)) {
                    fs_1.default.mkdirSync(this.OUTPUT_DIR, { recursive: true });
                }
                // Register fonts (you may need to provide actual font files)
                // For now, we'll use system fonts
                try {
                    // Attempt to register common fonts
                    (0, canvas_1.registerFont)(path_1.default.join(process.cwd(), 'fonts', 'Inter-Bold.ttf'), {
                        family: 'Inter Bold',
                    });
                    (0, canvas_1.registerFont)(path_1.default.join(process.cwd(), 'fonts', 'Inter-Regular.ttf'), {
                        family: 'Inter Regular',
                    });
                }
                catch (error) {
                    logger_1.log.warn('Custom fonts not found, using system fonts');
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Remove background from image using configurable masking service
     */
    ImageRenderer.removeBackground = function (imagePath, workspaceId) {
        return __awaiter(this, void 0, void 0, function () {
            var brandKit, maskingModel, maskingResult, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        brandKit = auth_1.AuthModel.getBrandKitByWorkspace(workspaceId);
                        maskingModel = (brandKit === null || brandKit === void 0 ? void 0 : brandKit.maskingModel) || maskingService_1.MaskingService.getDefaultModel();
                        return [4 /*yield*/, maskingService_1.MaskingService.applyMasking({
                                imagePath: imagePath,
                                model: maskingModel,
                            })
                            // Read the processed image
                        ];
                    case 1:
                        maskingResult = _a.sent();
                        // Read the processed image
                        return [2 /*return*/, fs_1.default.readFileSync(maskingResult.maskPath)];
                    case 2:
                        error_1 = _a.sent();
                        logger_1.log.error({ err: error_1 }, 'Background removal failed');
                        // Fallback: return original image
                        return [2 /*return*/, fs_1.default.readFileSync(imagePath)];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Apply mask to isolate subject
     */
    ImageRenderer.applyMask = function (imagePath, workspaceId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.removeBackground(imagePath, workspaceId)];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    /**
     * Generate a color palette from brand colors
     */
    ImageRenderer.generateColorPalette = function (brandKit) {
        return {
            primary: brandKit.colors.primary,
            secondary: brandKit.colors.secondary,
            tertiary: brandKit.colors.tertiary,
            text: this.getContrastColor(brandKit.colors.primary),
            background: this.lightenColor(brandKit.colors.primary, 95),
        };
    };
    /**
     * Get contrasting text color
     */
    ImageRenderer.getContrastColor = function (hexColor) {
        var r = parseInt(hexColor.slice(1, 3), 16);
        var g = parseInt(hexColor.slice(3, 5), 16);
        var b = parseInt(hexColor.slice(5, 7), 16);
        var luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        return luminance > 0.5 ? '#000000' : '#FFFFFF';
    };
    /**
     * Lighten a color
     */
    ImageRenderer.lightenColor = function (hexColor, percent) {
        var num = parseInt(hexColor.slice(1), 16);
        var amt = Math.round(2.55 * percent);
        var R = (num >> 16) + amt;
        var G = ((num >> 8) & 0x00ff) + amt;
        var B = (num & 0x0000ff) + amt;
        return ('#' +
            (0x1000000 +
                (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
                (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
                (B < 255 ? (B < 1 ? 0 : B) : 255))
                .toString(16)
                .slice(1));
    };
    /**
     * Wrap text to fit within specified width
     */
    ImageRenderer.wrapText = function (text, maxWidth) {
        var words = text.split(' ');
        var lines = [];
        var currentLine = '';
        for (var _i = 0, words_1 = words; _i < words_1.length; _i++) {
            var word = words_1[_i];
            var testLine = currentLine + (currentLine ? ' ' : '') + word;
            if (testLine.length > maxWidth) {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                }
                else {
                    lines.push(word);
                }
            }
            else {
                currentLine = testLine;
            }
        }
        if (currentLine) {
            lines.push(currentLine);
        }
        return lines;
    };
    /**
     * Render the main image with text and branding
     */
    ImageRenderer.renderImage = function (sourceImagePath, options) {
        return __awaiter(this, void 0, void 0, function () {
            var hashSource, cacheKey, cacheService, cachedResult, format, layout, caption, brandKit, watermark, _a, quality, dimensions, colors, canvas, ctx, maskedImageBuffer, maskedImage, subjectX, subjectY, subjectWidth, subjectHeight, maxCharsPerLine, lines, textY_1, fontSize_1, timestamp, random, baseFilename, mainFilename, mainPath, buffer, thumbnailFilename, thumbnailPath, result, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.initialize()
                        // Create cache key based on image path and render options
                    ];
                    case 1:
                        _b.sent();
                        hashSource = "".concat(sourceImagePath, "_").concat(options.format, "_").concat(options.layout, "_").concat(options.caption, "_").concat(options.watermark, "_").concat(JSON.stringify(options.brandKit));
                        cacheKey = "render_".concat((0, crypto_1.createHash)('md5').update(hashSource).digest('hex'));
                        cacheService = CacheService_1.CacheService.getInstance();
                        return [4 /*yield*/, cacheService.get(cacheKey)];
                    case 2:
                        cachedResult = _b.sent();
                        if (cachedResult) {
                            logger_1.log.info({ cacheKey: cacheKey }, 'Image rendered from cache');
                            return [2 /*return*/, cachedResult];
                        }
                        format = options.format, layout = options.layout, caption = options.caption, brandKit = options.brandKit, watermark = options.watermark, _a = options.quality, quality = _a === void 0 ? 90 : _a;
                        dimensions = this.DIMENSIONS[format];
                        colors = this.generateColorPalette(brandKit);
                        canvas = (0, canvas_1.createCanvas)(dimensions.width, dimensions.height);
                        ctx = canvas.getContext('2d');
                        // Fill background
                        ctx.fillStyle = colors.background;
                        ctx.fillRect(0, 0, dimensions.width, dimensions.height);
                        _b.label = 3;
                    case 3:
                        _b.trys.push([3, 8, , 9]);
                        return [4 /*yield*/, this.applyMask(sourceImagePath, options.workspaceId)];
                    case 4:
                        maskedImageBuffer = _b.sent();
                        return [4 /*yield*/, (0, canvas_1.loadImage)(maskedImageBuffer)
                            // Calculate subject dimensions and position based on layout
                        ];
                    case 5:
                        maskedImage = _b.sent();
                        subjectX = void 0, subjectY = void 0, subjectWidth = void 0, subjectHeight = void 0;
                        switch (layout) {
                            case 'center-focus':
                                subjectWidth = dimensions.width * 0.8;
                                subjectHeight = dimensions.height * 0.6;
                                subjectX = (dimensions.width - subjectWidth) / 2;
                                subjectY = (dimensions.height - subjectHeight) / 2;
                                break;
                            case 'bottom-text':
                                subjectWidth = dimensions.width * 0.9;
                                subjectHeight = dimensions.height * 0.7;
                                subjectX = (dimensions.width - subjectWidth) / 2;
                                subjectY = dimensions.height * 0.1;
                                break;
                            case 'top-text':
                                subjectWidth = dimensions.width * 0.9;
                                subjectHeight = dimensions.height * 0.7;
                                subjectX = (dimensions.width - subjectWidth) / 2;
                                subjectY = dimensions.height * 0.2;
                                break;
                            default:
                                subjectWidth = dimensions.width * 0.8;
                                subjectHeight = dimensions.height * 0.6;
                                subjectX = (dimensions.width - subjectWidth) / 2;
                                subjectY = (dimensions.height - subjectHeight) / 2;
                        }
                        // Draw the masked subject
                        ctx.drawImage(maskedImage, subjectX, subjectY, subjectWidth, subjectHeight);
                        // Add caption text
                        if (caption) {
                            maxCharsPerLine = Math.floor(dimensions.width / 20) // Approximate character width
                            ;
                            lines = this.wrapText(caption, maxCharsPerLine);
                            fontSize_1 = Math.max(24, Math.floor(dimensions.width / 30));
                            ctx.font = "bold ".concat(fontSize_1, "px \"").concat(brandKit.fonts.heading, "\"");
                            ctx.fillStyle = colors.text;
                            ctx.textAlign = 'center';
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
                            ctx.shadowBlur = 4;
                            ctx.shadowOffsetX = 2;
                            ctx.shadowOffsetY = 2;
                            switch (layout) {
                                case 'bottom-text':
                                    textY_1 = dimensions.height * 0.85;
                                    break;
                                case 'top-text':
                                    textY_1 = dimensions.height * 0.1 + lines.length * fontSize_1 * 1.2;
                                    break;
                                case 'center-focus':
                                default:
                                    textY_1 = dimensions.height * 0.9;
                                    break;
                            }
                            lines.forEach(function (line, index) {
                                var lineY = textY_1 + index * fontSize_1 * 1.2;
                                ctx.fillText(line, dimensions.width / 2, lineY);
                            });
                        }
                        // Add watermark for free users
                        if (watermark) {
                            ctx.font = '14px Arial';
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                            ctx.textAlign = 'right';
                            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
                            ctx.shadowBlur = 2;
                            ctx.fillText('caption-art.app', dimensions.width - 10, dimensions.height - 10);
                        }
                        // Add brand color accent
                        ctx.fillStyle = colors.primary;
                        ctx.fillRect(0, 0, dimensions.width, 8); // Top border
                        ctx.fillRect(0, dimensions.height - 8, dimensions.width, 8); // Bottom border
                        timestamp = Date.now();
                        random = Math.random().toString(36).substr(2, 9);
                        baseFilename = "render_".concat(timestamp, "_").concat(random);
                        mainFilename = "".concat(baseFilename, ".jpg");
                        mainPath = path_1.default.join(this.OUTPUT_DIR, mainFilename);
                        buffer = canvas.toBuffer('image/jpeg', { quality: quality });
                        fs_1.default.writeFileSync(mainPath, buffer);
                        thumbnailFilename = "".concat(baseFilename, "_thumb.jpg");
                        thumbnailPath = path_1.default.join(this.OUTPUT_DIR, thumbnailFilename);
                        return [4 /*yield*/, (0, sharp_1.default)(buffer)
                                .resize(this.THUMBNAIL_SIZE, this.THUMBNAIL_SIZE, { fit: 'inside' })
                                .jpeg({ quality: 80 })
                                .toFile(thumbnailPath)];
                    case 6:
                        _b.sent();
                        result = {
                            imageUrl: "/generated/".concat(mainFilename),
                            thumbnailUrl: "/generated/".concat(thumbnailFilename),
                            width: dimensions.width,
                            height: dimensions.height,
                        };
                        // Cache the result for faster retrieval next time
                        return [4 /*yield*/, cacheService.set(cacheKey, result, 24 * 60 * 60 * 1000)]; // Cache for 24 hours
                    case 7:
                        // Cache the result for faster retrieval next time
                        _b.sent(); // Cache for 24 hours
                        return [2 /*return*/, result];
                    case 8:
                        error_2 = _b.sent();
                        logger_1.log.error({ err: error_2 }, 'Image rendering failed');
                        throw new Error("Failed to render image: ".concat(error_2 instanceof Error ? error_2.message : 'Unknown error'));
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Render multiple images for different formats
     */
    ImageRenderer.renderMultipleFormats = function (sourceImagePath, caption, brandKit, agency, workspaceId) {
        return __awaiter(this, void 0, void 0, function () {
            var watermark, results, _i, _a, layout, result, error_3, result, error_4;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        watermark = agency.planType === 'free';
                        results = [];
                        _i = 0, _a = ['center-focus', 'bottom-text'];
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        layout = _a[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.renderImage(sourceImagePath, {
                                format: 'instagram-square',
                                layout: layout,
                                caption: caption,
                                brandKit: brandKit,
                                watermark: watermark,
                                workspaceId: workspaceId,
                            })];
                    case 3:
                        result = _b.sent();
                        results.push(__assign({ format: 'instagram-square', layout: layout }, result));
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _b.sent();
                        logger_1.log.error({ err: error_3, layout: layout }, "Failed to render ".concat(layout));
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6:
                        _b.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, this.renderImage(sourceImagePath, {
                                format: 'instagram-story',
                                layout: 'center-focus',
                                caption: caption,
                                brandKit: brandKit,
                                watermark: watermark,
                                workspaceId: workspaceId,
                            })];
                    case 7:
                        result = _b.sent();
                        results.push(__assign({ format: 'instagram-story', layout: 'center-focus' }, result));
                        return [3 /*break*/, 9];
                    case 8:
                        error_4 = _b.sent();
                        logger_1.log.error({ err: error_4 }, 'Failed to render story');
                        return [3 /*break*/, 9];
                    case 9: return [2 /*return*/, results];
                }
            });
        });
    };
    /**
     * Clean up old generated files
     */
    ImageRenderer.cleanupOldFiles = function () {
        return __awaiter(this, arguments, void 0, function (olderThanHours) {
            var files, cutoffTime, deletedCount, _i, files_1, file, filePath, stats;
            if (olderThanHours === void 0) { olderThanHours = 24; }
            return __generator(this, function (_a) {
                if (!fs_1.default.existsSync(this.OUTPUT_DIR)) {
                    return [2 /*return*/, 0];
                }
                files = fs_1.default.readdirSync(this.OUTPUT_DIR);
                cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;
                deletedCount = 0;
                for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                    file = files_1[_i];
                    filePath = path_1.default.join(this.OUTPUT_DIR, file);
                    stats = fs_1.default.statSync(filePath);
                    if (stats.mtime.getTime() < cutoffTime) {
                        try {
                            fs_1.default.unlinkSync(filePath);
                            deletedCount++;
                        }
                        catch (error) {
                            logger_1.log.error({ err: error, file: file }, "Error deleting old generated file ".concat(file));
                        }
                    }
                }
                return [2 /*return*/, deletedCount];
            });
        });
    };
    ImageRenderer.OUTPUT_DIR = path_1.default.join(process.cwd(), 'generated');
    ImageRenderer.THUMBNAIL_SIZE = 300;
    // Format dimensions
    ImageRenderer.DIMENSIONS = {
        'instagram-square': { width: 1080, height: 1080 },
        'instagram-story': { width: 1080, height: 1920 },
    };
    return ImageRenderer;
}());
exports.ImageRenderer = ImageRenderer;
