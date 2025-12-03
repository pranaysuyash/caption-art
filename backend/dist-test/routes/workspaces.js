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
var express_1 = require("express");
var zod_1 = require("zod");
var auth_1 = require("../models/auth");
var logger_1 = require("../middleware/logger");
var auth_2 = require("../routes/auth");
var validateRequest_1 = __importDefault(require("../middleware/validateRequest"));
var router = (0, express_1.Router)();
var requireAuth = (0, auth_2.createAuthMiddleware)();
// Validation schemas
var createWorkspaceSchema = zod_1.z.object({
    clientName: zod_1.z.string().min(1).max(100),
});
var updateWorkspaceSchema = zod_1.z.object({
    clientName: zod_1.z.string().min(1).max(100).optional(),
    brandKitId: zod_1.z.string().optional(),
});
// GET /api/workspaces - List all workspaces for the authenticated agency
router.get('/', requireAuth, function (req, res) {
    var authenticatedReq = req;
    var workspaces = auth_1.AuthModel.getWorkspacesByAgency(authenticatedReq.agency.id);
    res.json({ workspaces: workspaces });
});
// POST /api/workspaces - Create new workspace
router.post('/', requireAuth, (0, validateRequest_1.default)(createWorkspaceSchema), function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authenticatedReq, clientName, workspace, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                authenticatedReq = req;
                clientName = req.validatedData.clientName;
                return [4 /*yield*/, auth_1.AuthModel.createWorkspace(authenticatedReq.agency.id, clientName)
                    // DEV DEBUG: log the created workspace object to check serialization issues
                ];
            case 1:
                workspace = _a.sent();
                // DEV DEBUG: log the created workspace object to check serialization issues
                if (process.env.NODE_ENV !== 'production') {
                    logger_1.log.info({ workspace: workspace }, 'Created workspace (debug)');
                }
                res.status(201).json({ workspace: workspace });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                if (error_1 instanceof zod_1.z.ZodError) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: 'Invalid input', details: error_1.issues })];
                }
                logger_1.log.error({ err: error_1 }, 'Create workspace error');
                res.status(500).json({ error: 'Internal server error' });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// GET /api/workspaces/:id - Get specific workspace
router.get('/:id', requireAuth, function (req, res) {
    var authenticatedReq = req;
    var id = req.params.id;
    var workspace = auth_1.AuthModel.getWorkspaceById(id);
    if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
    }
    if (workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' });
    }
    res.json({ workspace: workspace });
});
// PUT /api/workspaces/:id - Update workspace
router.put('/:id', requireAuth, (0, validateRequest_1.default)(updateWorkspaceSchema), function (req, res) {
    try {
        var authenticatedReq = req;
        var id = req.params.id;
        var updates = req.validatedData;
        var workspace = auth_1.AuthModel.getWorkspaceById(id);
        if (!workspace) {
            return res.status(404).json({ error: 'Workspace not found' });
        }
        if (workspace.agencyId !== authenticatedReq.agency.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        auth_1.AuthModel.updateWorkspace(id, updates);
        var updatedWorkspace = auth_1.AuthModel.getWorkspaceById(id);
        res.json({ workspace: updatedWorkspace });
    }
    catch (error) {
        if (error instanceof zod_1.z.ZodError) {
            return res
                .status(400)
                .json({ error: 'Invalid input', details: error.issues });
        }
        logger_1.log.error({ err: error }, 'Update workspace error');
        res.status(500).json({ error: 'Internal server error' });
    }
});
// DELETE /api/workspaces/:id - Archive workspace (soft delete)
router.delete('/:id', requireAuth, function (req, res) {
    var authenticatedReq = req;
    var id = req.params.id;
    var workspace = auth_1.AuthModel.getWorkspaceById(id);
    if (!workspace) {
        return res.status(404).json({ error: 'Workspace not found' });
    }
    if (workspace.agencyId !== authenticatedReq.agency.id) {
        return res.status(403).json({ error: 'Access denied' });
    }
    // For v1, we'll just mark it as archived in memory
    // In a real database, you'd do a soft delete
    auth_1.AuthModel.updateWorkspace(id, {
        clientName: "[ARCHIVED] ".concat(workspace.clientName),
        brandKitId: '',
    });
    res.json({ message: 'Workspace archived successfully' });
});
exports.default = router;
