"use strict";
/**
 * Unified validation middleware
 * Provides centralized request validation using Zod schemas
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
exports.validateData = validateData;
exports.safeValidateData = safeValidateData;
var zod_1 = require("zod");
/**
 * Creates a validation middleware for a specific route
 */
function validateRequest(options) {
    return function (req, res, next) {
        try {
            // Validate body if schema provided
            if (options.body) {
                var parsedBody = options.body.parse(req.body);
                req.body = parsedBody;
            }
            // Validate params if schema provided  
            if (options.params) {
                var parsedParams = options.params.parse(req.params);
                req.params = parsedParams;
            }
            // Validate query if schema provided
            if (options.query) {
                var parsedQuery = options.query.parse(req.query);
                req.query = parsedQuery;
            }
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                // Format validation errors for response
                var errors = error.issues.map(function (issue) { return ({
                    field: issue.path.join('.'),
                    message: issue.message,
                    value: issue.input
                }); });
                return res.status(400).json({
                    error: 'Validation error',
                    details: errors
                });
            }
            // Handle other errors
            return res.status(500).json({
                error: 'Internal server error during validation'
            });
        }
    };
}
/**
 * Generic validation function that can be used in route handlers directly
 */
function validateData(data, schema) {
    return schema.parse(data);
}
/**
 * Safe validation function that returns result or error
 */
function safeValidateData(data, schema) {
    try {
        var parsedData = schema.parse(data);
        return { success: true, data: parsedData };
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return { success: false, error: error };
        }
        throw error;
    }
}
