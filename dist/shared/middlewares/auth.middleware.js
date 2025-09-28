"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.authenticateToken = void 0;
const jwt_1 = __importDefault(require("../utils/jwt"));
const UserModal_1 = __importDefault(require("../../models/UserModal"));
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access token required",
            });
        }
        const decoded = jwt_1.default.verifyAccessToken(token);
        // Load full user from DB once to attach richer context
        const user = await UserModal_1.default.findById(decoded.userId).select("_id email name role status avatar");
        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: "User not found" });
        }
        req.user = { userId: user.id.toString(), email: user.email };
        // Attach full user object for downstream handlers
        req.currentUser = user;
        next();
    }
    catch (error) {
        return res.status(403).json({
            success: false,
            message: "Invalid or expired token",
        });
    }
};
exports.authenticateToken = authenticateToken;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(" ")[1];
        if (token) {
            const decoded = jwt_1.default.verifyAccessToken(token);
            const user = await UserModal_1.default.findById(decoded.userId).select("_id email name role status avatar");
            if (user) {
                req.user = { userId: user.id.toString(), email: user.email };
                req.currentUser = user;
            }
        }
        next();
    }
    catch (error) {
        // Continue without authentication
        next();
    }
};
exports.optionalAuth = optionalAuth;
