"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeKeyword = sanitizeKeyword;
exports.sanitizeKeywords = sanitizeKeywords;
exports.sanitizeText = sanitizeText;
exports.sanitizePhrases = sanitizePhrases;
/**
 * Simple sanitizers and transformers for user-provided data to reduce prompt injection and unsafe input.
 */
function sanitizeKeyword(keyword) {
    if (!keyword)
        return '';
    // Remove html tags
    var s = keyword.replace(/<[^>]*>/g, '');
    // Remove common injection patterns and control characters
    s = s.replace(/["'`\;\|\$\(\)\{\}\[\]\^<>]/g, '');
    // Collapse whitespace
    s = s.replace(/\s+/g, ' ').trim();
    // Truncate to safe length
    if (s.length > 50)
        s = s.slice(0, 50);
    return s;
}
function sanitizeKeywords(keywords) {
    if (!keywords || !Array.isArray(keywords))
        return undefined;
    var cleaned = keywords
        .map(function (k) { return sanitizeKeyword(k); })
        .filter(Boolean)
        .slice(0, 10); // limit number of keywords
    return cleaned.length > 0 ? cleaned : undefined;
}
function sanitizeText(text, maxLen) {
    if (maxLen === void 0) { maxLen = 500; }
    if (!text || typeof text !== 'string')
        return undefined;
    // Remove HTML tags
    var s = text.replace(/<[^>]*>/g, '');
    // Replace control characters and excessive whitespace
    s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    if (s.length > maxLen)
        s = s.slice(0, maxLen);
    return s;
}
function sanitizePhrases(phrases) {
    if (!phrases || !Array.isArray(phrases))
        return undefined;
    var cleaned = phrases
        .map(function (p) {
        var s = p
            .replace(/<[^>]*>/g, '')
            .replace(/["'`\;\|\$\(\)\{\}\[\]\^<>]/g, '')
            .trim();
        return s.length > 0 ? s.slice(0, 200) : '';
    })
        .filter(Boolean)
        .slice(0, 20);
    return cleaned.length > 0 ? cleaned : undefined;
}
exports.default = { sanitizeKeyword: sanitizeKeyword, sanitizeKeywords: sanitizeKeywords, sanitizePhrases: sanitizePhrases };
