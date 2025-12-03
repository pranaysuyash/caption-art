"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
/**
 * Middleware to validate request bodies using Zod schemas.
 * Attaches a parsed `validatedData` object to the request for handlers to use.
 */
function validateRequest(schema) {
    return function (req, res, next) {
        try {
            var parsed = schema.parse(req.body);
            req.validatedData = parsed;
            next();
        }
        catch (err) {
            next(err);
        }
    };
}
exports.default = validateRequest;
