"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestIdMiddleware = requestIdMiddleware;
var uuid_1 = require("uuid");
function requestIdMiddleware(req, res, next) {
    var headerId = req.headers['x-request-id'] || '';
    var id = headerId || (0, uuid_1.v4)();
    res.setHeader('X-Request-Id', id);
    req.requestId = id;
    next();
}
exports.default = requestIdMiddleware;
