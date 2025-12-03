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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAuthMiddleware = createAuthMiddleware;
var express_1 = require("express");
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var validation_1 = require("../middleware/validation");
var validation_2 = require("../schemas/validation");
var router = (0, express_1.Router)();
// In-memory session store for v1
var sessions = new Map();
// POST /api/auth/signup
router.post('/signup', (0, validation_1.validateRequest)({ body: validation_2.SignupSchema }), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, agencyName, existingUser, _b, user, agency, sessionId, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                _a = req.body, email = _a.email, password = _a.password, agencyName = _a.agencyName;
                return [4 /*yield*/, auth_1.AuthModel.findUserByEmail(email)];
            case 1:
                existingUser = _c.sent();
                if (existingUser) {
                    return [2 /*return*/, res.status(409).json({ error: 'User already exists' })];
                }
                return [4 /*yield*/, auth_1.AuthModel.createUser(email, password, agencyName)
                    // Create session
                ];
            case 2:
                _b = _c.sent(), user = _b.user, agency = _b.agency;
                sessionId = "session_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                sessions.set(sessionId, { userId: user.id, agencyId: agency.id });
                // Set session cookie
                res.cookie('sessionId', sessionId, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 24 * 60 * 60 * 1000, // 24 hours
                    sameSite: 'lax',
                });
                res.json({
                    user: {
                        id: user.id,
                        email: user.email,
                        agencyId: user.agencyId,
                    },
                    agency: {
                        id: agency.id,
                        planType: agency.planType,
                        billingActive: agency.billingActive,
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _c.sent();
                logger_1.log.error({ err: error_1 }, 'Signup error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// POST /api/auth/login
router.post('/login', (0, validation_1.validateRequest)({ body: validation_2.LoginSchema }), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, user, agency, sessionId, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, email = _a.email, password = _a.password;
                return [4 /*yield*/, auth_1.AuthModel.findUserByEmail(email)];
            case 1:
                user = _b.sent();
                if (!user) {
                    return [2 /*return*/, res.status(401).json({ error: 'Invalid credentials' })];
                }
                agency = auth_1.AuthModel.getAgencyById(user.agencyId);
                if (!agency) {
                    return [2 /*return*/, res.status(401).json({ error: 'Invalid credentials' })];
                }
                // Update last login
                auth_1.AuthModel.updateUserLastLogin(user.id);
                sessionId = "session_".concat(Date.now(), "_").concat(Math.random().toString(36).substr(2, 9));
                sessions.set(sessionId, { userId: user.id, agencyId: agency.id });
                // Set session cookie
                res.cookie('sessionId', sessionId, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    maxAge: 24 * 60 * 60 * 1000, // 24 hours
                    sameSite: 'lax',
                });
                res.json({
                    user: {
                        id: user.id,
                        email: user.email,
                        agencyId: user.agencyId,
                    },
                    agency: {
                        id: agency.id,
                        planType: agency.planType,
                        billingActive: agency.billingActive,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                logger_1.log.error({ err: error_2 }, 'Login error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /api/auth/logout
router.post('/logout', function (req, res) {
    var sessionId = req.cookies.sessionId;
    if (sessionId && sessions.has(sessionId)) {
        sessions.delete(sessionId);
    }
    res.clearCookie('sessionId');
    res.json({ message: 'Logged out successfully' });
});
// GET /api/auth/me
router.get('/me', function (req, res) {
    var sessionId = req.cookies.sessionId;
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    var session = sessions.get(sessionId);
    var user = auth_1.AuthModel.getUserById(session.userId);
    var agency = auth_1.AuthModel.getAgencyById(session.agencyId);
    if (!user || !agency) {
        // Session references invalid user/agency, clean it up
        sessions.delete(sessionId);
        res.clearCookie('sessionId');
        return res.status(401).json({ error: 'Invalid session' });
    }
    res.json({
        user: {
            id: user.id,
            email: user.email,
            agencyId: user.agencyId,
        },
        agency: {
            id: agency.id,
            planType: agency.planType,
            billingActive: agency.billingActive,
        },
    });
});
// Helper middleware function
function createAuthMiddleware() {
    return function (req, res, next) {
        var sessionId = req.cookies.sessionId;
        if (!sessionId || !sessions.has(sessionId)) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        var session = sessions.get(sessionId);
        var user = auth_1.AuthModel.getUserById(session.userId);
        var agency = auth_1.AuthModel.getAgencyById(session.agencyId);
        if (!user || !agency) {
            sessions.delete(sessionId);
            res.clearCookie('sessionId');
            return res.status(401).json({ error: 'Invalid session' });
        }
        req.user = user;
        req.agency = agency;
        next();
    };
}
exports.default = router;
