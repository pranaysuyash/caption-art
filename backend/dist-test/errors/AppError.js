"use strict";
/**
 * Custom error classes for better error handling
 * Distinguishes between operational errors (user errors) and programming errors
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceUnavailableError = exports.UnauthorizedError = exports.PromptInjectionError = exports.InternalServerError = exports.NotFoundError = exports.RateLimitError = exports.ExternalAPIError = exports.ValidationError = exports.AppError = void 0;
/**
 * Base application error class
 */
var AppError = /** @class */ (function (_super) {
    __extends(AppError, _super);
    function AppError(statusCode, message, isOperational, errorCode, metadata) {
        if (isOperational === void 0) { isOperational = true; }
        var _this = _super.call(this, message) || this;
        _this.statusCode = statusCode;
        _this.isOperational = isOperational;
        _this.errorCode = errorCode;
        _this.metadata = metadata;
        // Maintains proper stack trace for where error was thrown
        Error.captureStackTrace(_this, _this.constructor);
        return _this;
    }
    return AppError;
}(Error));
exports.AppError = AppError;
/**
 * Validation error (400 Bad Request)
 * Used for invalid user input
 */
var ValidationError = /** @class */ (function (_super) {
    __extends(ValidationError, _super);
    function ValidationError(message, metadata) {
        return _super.call(this, 400, message, true, 'VALIDATION_ERROR', metadata) || this;
    }
    return ValidationError;
}(AppError));
exports.ValidationError = ValidationError;
/**
 * External API error (502 Bad Gateway)
 * Used when external services (Replicate, OpenAI) fail
 */
var ExternalAPIError = /** @class */ (function (_super) {
    __extends(ExternalAPIError, _super);
    function ExternalAPIError(message, service, metadata) {
        var _this = this;
        // Create metadata with service information
        var enhancedMetadata = __assign(__assign({}, metadata), { service: service, retryable: true });
        // Keep the message concise for API responses; expose service separately when needed
        _this = _super.call(this, 502, message, true, 'EXTERNAL_API_ERROR', enhancedMetadata) || this;
        _this.service = service;
        return _this;
    }
    return ExternalAPIError;
}(AppError));
exports.ExternalAPIError = ExternalAPIError;
/**
 * Rate limit error (429 Too Many Requests)
 * Used when rate limits are exceeded
 */
var RateLimitError = /** @class */ (function (_super) {
    __extends(RateLimitError, _super);
    function RateLimitError(message, metadata) {
        if (message === void 0) { message = 'Too many requests, please try again later'; }
        return _super.call(this, 429, message, true, 'RATE_LIMIT_ERROR', metadata) || this;
    }
    return RateLimitError;
}(AppError));
exports.RateLimitError = RateLimitError;
/**
 * Not found error (404 Not Found)
 * Used when requested resource doesn't exist
 */
var NotFoundError = /** @class */ (function (_super) {
    __extends(NotFoundError, _super);
    function NotFoundError(message, metadata) {
        if (message === void 0) { message = 'Resource not found'; }
        return _super.call(this, 404, message, true, 'NOT_FOUND_ERROR', metadata) || this;
    }
    return NotFoundError;
}(AppError));
exports.NotFoundError = NotFoundError;
/**
 * Internal server error (500 Internal Server Error)
 * Used for unexpected programming errors
 */
var InternalServerError = /** @class */ (function (_super) {
    __extends(InternalServerError, _super);
    function InternalServerError(message, metadata) {
        if (message === void 0) { message = 'Internal server error'; }
        return _super.call(this, 500, message, false, 'INTERNAL_SERVER_ERROR', metadata) || this;
    }
    return InternalServerError;
}(AppError));
exports.InternalServerError = InternalServerError;
/**
 * Prompt injection error (400 Bad Request)
 * Used when prompts contain malicious content
 */
var PromptInjectionError = /** @class */ (function (_super) {
    __extends(PromptInjectionError, _super);
    function PromptInjectionError(message, metadata) {
        if (message === void 0) { message = 'Prompt rejected for security reasons'; }
        return _super.call(this, 400, message, true, 'PROMPT_INJECTION_ERROR', metadata) || this;
    }
    return PromptInjectionError;
}(AppError));
exports.PromptInjectionError = PromptInjectionError;
/**
 * Unauthorized access error (403 Forbidden)
 * Used when user doesn't have permission
 */
var UnauthorizedError = /** @class */ (function (_super) {
    __extends(UnauthorizedError, _super);
    function UnauthorizedError(message, metadata) {
        if (message === void 0) { message = 'Access denied'; }
        return _super.call(this, 403, message, true, 'UNAUTHORIZED_ERROR', metadata) || this;
    }
    return UnauthorizedError;
}(AppError));
exports.UnauthorizedError = UnauthorizedError;
/**
 * Service unavailable error (503 Service Unavailable)
 * Used when service is temporarily down
 */
var ServiceUnavailableError = /** @class */ (function (_super) {
    __extends(ServiceUnavailableError, _super);
    function ServiceUnavailableError(message, metadata) {
        if (message === void 0) { message = 'Service temporarily unavailable'; }
        return _super.call(this, 503, message, true, 'SERVICE_UNAVAILABLE_ERROR', __assign(__assign({}, metadata), { retryable: true })) || this;
    }
    return ServiceUnavailableError;
}(AppError));
exports.ServiceUnavailableError = ServiceUnavailableError;
