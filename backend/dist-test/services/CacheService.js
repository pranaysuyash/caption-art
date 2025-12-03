"use strict";
/**
 * Cache Service for images, captions, and masks
 * Implements a multi-layer cache with in-memory and file-based storage
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
var logger_1 = require("../middleware/logger");
var promises_1 = __importDefault(require("fs/promises"));
var path_1 = __importDefault(require("path"));
var crypto_1 = require("crypto");
var MetricsService_1 = require("./MetricsService");
var CacheService = /** @class */ (function () {
    function CacheService(config) {
        if (config === void 0) { config = {}; }
        this.cache = new Map();
        this.stats = {
            hits: 0,
            misses: 0,
            entries: 0,
            memorySize: 0,
            hitRate: 0
        };
        this.config = {
            maxSize: config.maxSize || 50 * 1024 * 1024, // 50MB default
            maxEntries: config.maxEntries || 1000,
            defaultTTL: config.defaultTTL || 60 * 60 * 1000, // 1 hour default
            autoEvict: config.autoEvict !== undefined ? config.autoEvict : true
        };
        // Set up file cache directory
        this.fileCacheDir = path_1.default.join(process.cwd(), 'cache');
        this.ensureCacheDir();
        logger_1.log.info({
            maxSize: this.config.maxSize,
            maxEntries: this.config.maxEntries,
            defaultTTL: this.config.defaultTTL
        }, 'Cache service initialized');
    }
    CacheService.getInstance = function (config) {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService(config);
        }
        return CacheService.instance;
    };
    CacheService.prototype.ensureCacheDir = function () {
        try {
            promises_1.default.mkdir(this.fileCacheDir, { recursive: true });
        }
        catch (err) {
            logger_1.log.error({ err: err }, 'Failed to create cache directory');
        }
    };
    /**
     * Get an item from cache
     */
    CacheService.prototype.get = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var now, entry, fileKey, fileExists, fileContent, parsed, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        now = Date.now();
                        entry = this.cache.get(key);
                        if (!entry) return [3 /*break*/, 3];
                        if (!(now - entry.timestamp > entry.ttl)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.delete(key)];
                    case 1:
                        _a.sent();
                        this.stats.misses++;
                        MetricsService_1.MetricsService.trackCacheOperation('memory', false); // Cache miss
                        return [2 /*return*/, null];
                    case 2:
                        // Update hits and access time
                        entry.hits++;
                        this.stats.hits++;
                        this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
                        logger_1.log.debug({ key: key, hits: entry.hits }, 'Cache hit');
                        MetricsService_1.MetricsService.trackCacheOperation('memory', true); // Cache hit
                        return [2 /*return*/, entry.data];
                    case 3:
                        fileKey = this.getFileKey(key);
                        _a.label = 4;
                    case 4:
                        _a.trys.push([4, 10, , 11]);
                        return [4 /*yield*/, this.fileExists(fileKey)];
                    case 5:
                        fileExists = _a.sent();
                        if (!fileExists) return [3 /*break*/, 9];
                        return [4 /*yield*/, promises_1.default.readFile(fileKey, 'utf-8')];
                    case 6:
                        fileContent = _a.sent();
                        parsed = JSON.parse(fileContent);
                        if (!(now - parsed.timestamp > parsed.ttl)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.deleteFile(fileKey)];
                    case 7:
                        _a.sent();
                        this.stats.misses++;
                        MetricsService_1.MetricsService.trackCacheOperation('file', false); // Cache miss
                        return [2 /*return*/, null];
                    case 8:
                        // Add to memory cache for faster access next time
                        this.cache.set(key, parsed);
                        this.stats.hits++;
                        this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses);
                        logger_1.log.debug({ key: key }, 'Cache hit from file');
                        MetricsService_1.MetricsService.trackCacheOperation('file', true); // Cache hit
                        return [2 /*return*/, parsed.data];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        err_1 = _a.sent();
                        logger_1.log.warn({ err: err_1, key: key }, 'Error reading from file cache');
                        return [3 /*break*/, 11];
                    case 11:
                        this.stats.misses++;
                        logger_1.log.debug({ key: key }, 'Cache miss');
                        MetricsService_1.MetricsService.trackCacheOperation('combined', false); // Cache miss
                        return [2 /*return*/, null];
                }
            });
        });
    };
    /**
     * Set an item in cache
     */
    CacheService.prototype.set = function (key, data, ttl) {
        return __awaiter(this, void 0, void 0, function () {
            var resolvedTTL, entry, dataSize;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        resolvedTTL = ttl || this.config.defaultTTL;
                        entry = {
                            data: data,
                            timestamp: Date.now(),
                            ttl: resolvedTTL,
                            hits: 0
                        };
                        dataSize = JSON.stringify(data).length;
                        entry.size = dataSize;
                        // Add to memory cache
                        this.cache.set(key, entry);
                        this.stats.entries = this.cache.size;
                        this.stats.memorySize += dataSize;
                        if (!this.config.autoEvict) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.evictIfNeeded()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        logger_1.log.debug({ key: key, ttl: resolvedTTL, dataSize: dataSize }, 'Cache set');
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Delete an item from cache
     */
    CacheService.prototype.delete = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var entry, fileKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        entry = this.cache.get(key);
                        if (entry) {
                            this.stats.memorySize -= entry.size || 0;
                            this.cache.delete(key);
                            this.stats.entries = this.cache.size;
                        }
                        fileKey = this.getFileKey(key);
                        return [4 /*yield*/, this.deleteFile(fileKey)];
                    case 1:
                        _a.sent();
                        logger_1.log.debug({ key: key }, 'Cache delete');
                        return [2 /*return*/, true];
                }
            });
        });
    };
    /**
     * Check if key exists in cache (without retrieving)
     */
    CacheService.prototype.has = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var entry, now, fileKey, fileExists, content, parsed, now, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        entry = this.cache.get(key);
                        if (!entry) return [3 /*break*/, 3];
                        now = Date.now();
                        if (!(now - entry.timestamp > entry.ttl)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.delete(key)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, false];
                    case 2: return [2 /*return*/, true];
                    case 3:
                        fileKey = this.getFileKey(key);
                        return [4 /*yield*/, this.fileExists(fileKey)];
                    case 4:
                        fileExists = _b.sent();
                        if (!fileExists) return [3 /*break*/, 10];
                        _b.label = 5;
                    case 5:
                        _b.trys.push([5, 9, , 10]);
                        return [4 /*yield*/, promises_1.default.readFile(fileKey, 'utf-8')];
                    case 6:
                        content = _b.sent();
                        parsed = JSON.parse(content);
                        now = Date.now();
                        if (!(now - parsed.timestamp > parsed.ttl)) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.deleteFile(fileKey)];
                    case 7:
                        _b.sent();
                        return [2 /*return*/, false];
                    case 8: return [2 /*return*/, true];
                    case 9:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 10: return [2 /*return*/, false];
                }
            });
        });
    };
    /**
     * Clear all cache entries
     */
    CacheService.prototype.clear = function () {
        return __awaiter(this, void 0, void 0, function () {
            var files, _i, files_1, file, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.cache.clear();
                        this.stats = {
                            hits: 0,
                            misses: 0,
                            entries: 0,
                            memorySize: 0,
                            hitRate: 0
                        };
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, promises_1.default.readdir(this.fileCacheDir)];
                    case 2:
                        files = _a.sent();
                        _i = 0, files_1 = files;
                        _a.label = 3;
                    case 3:
                        if (!(_i < files_1.length)) return [3 /*break*/, 6];
                        file = files_1[_i];
                        return [4 /*yield*/, promises_1.default.unlink(path_1.default.join(this.fileCacheDir, file))];
                    case 4:
                        _a.sent();
                        _a.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 3];
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        err_2 = _a.sent();
                        logger_1.log.error({ err: err_2 }, 'Error clearing file cache');
                        return [3 /*break*/, 8];
                    case 8:
                        logger_1.log.info('Cache cleared');
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get cache statistics
     */
    CacheService.prototype.getStats = function () {
        return __assign({}, this.stats);
    };
    /**
     * Evict entries if limits are exceeded
     */
    CacheService.prototype.evictIfNeeded = function () {
        return __awaiter(this, void 0, void 0, function () {
            var oldestKey, oldestKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.config.maxEntries && this.cache.size > this.config.maxEntries)) return [3 /*break*/, 2];
                        oldestKey = this.getOldestEntry();
                        if (!oldestKey) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.delete(oldestKey)];
                    case 1:
                        _a.sent();
                        logger_1.log.info({
                            reason: 'max_entries',
                            max: this.config.maxEntries,
                            current: this.cache.size
                        }, 'Cache eviction triggered');
                        _a.label = 2;
                    case 2:
                        if (!(this.config.maxSize && this.stats.memorySize > this.config.maxSize)) return [3 /*break*/, 7];
                        _a.label = 3;
                    case 3:
                        if (!(this.stats.memorySize > this.config.maxSize && this.cache.size > 0)) return [3 /*break*/, 7];
                        oldestKey = this.getOldestEntry();
                        if (!oldestKey) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.delete(oldestKey)];
                    case 4:
                        _a.sent();
                        logger_1.log.info({
                            reason: 'max_size',
                            maxSize: this.config.maxSize,
                            currentSize: this.stats.memorySize
                        }, 'Cache eviction triggered');
                        return [3 /*break*/, 6];
                    case 5: return [3 /*break*/, 7]; // Safety break if no entries to evict
                    case 6: return [3 /*break*/, 3];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get the oldest cache entry (LRU)
     */
    CacheService.prototype.getOldestEntry = function () {
        var oldestKey = null;
        var oldestTime = Number.MAX_SAFE_INTEGER;
        for (var _i = 0, _a = this.cache.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], entry = _b[1];
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }
        return oldestKey;
    };
    /**
     * Generate file key for file-based caching
     */
    CacheService.prototype.getFileKey = function (key) {
        // Create a safe filename by hashing the key
        var hash = (0, crypto_1.createHash)('sha256').update(key).digest('hex');
        return path_1.default.join(this.fileCacheDir, "".concat(hash, ".json"));
    };
    /**
     * Check if file exists
     */
    CacheService.prototype.fileExists = function (filepath) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, promises_1.default.access(filepath)];
                    case 1:
                        _b.sent();
                        return [2 /*return*/, true];
                    case 2:
                        _a = _b.sent();
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Delete file
     */
    CacheService.prototype.deleteFile = function (filepath) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, promises_1.default.unlink(filepath)];
                    case 1:
                        _b.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        _a = _b.sent();
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Cache specific operations for different data types
     */
    // Caption specific methods
    CacheService.prototype.getCaption = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get("caption:".concat(key))];
            });
        });
    };
    CacheService.prototype.setCaption = function (key, caption, ttl) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.set("caption:".concat(key), caption, ttl)];
            });
        });
    };
    // Image specific methods  
    CacheService.prototype.getImage = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var base64;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.get("image:".concat(key))];
                    case 1:
                        base64 = _a.sent();
                        return [2 /*return*/, base64 ? Buffer.from(base64, 'base64') : null];
                }
            });
        });
    };
    CacheService.prototype.setImage = function (key, imageBuffer, ttl) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.set("image:".concat(key), imageBuffer.toString('base64'), ttl)];
            });
        });
    };
    // Mask specific methods
    CacheService.prototype.getMask = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var base64;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.get("mask:".concat(key))];
                    case 1:
                        base64 = _a.sent();
                        return [2 /*return*/, base64 ? Buffer.from(base64, 'base64') : null];
                }
            });
        });
    };
    CacheService.prototype.setMask = function (key, maskBuffer, ttl) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.set("mask:".concat(key), maskBuffer.toString('base64'), ttl)];
            });
        });
    };
    // Caption generation result (with variations)
    CacheService.prototype.getCaptionVariations = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.get("variations:".concat(key))];
            });
        });
    };
    CacheService.prototype.setCaptionVariations = function (key, variations, ttl) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.set("variations:".concat(key), variations, ttl)];
            });
        });
    };
    return CacheService;
}());
exports.CacheService = CacheService;
