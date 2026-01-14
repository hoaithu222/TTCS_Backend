"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireActiveUser = void 0;
const UserModel_1 = require("../../models/UserModel");
/**
 * Middleware to check if user is active (not suspended or inactive)
 * Must be used AFTER authenticateToken middleware
 */
const requireActiveUser = (req, res, next) => {
    const currentUser = req.currentUser;
    if (!currentUser) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }
    if (currentUser.status === UserModel_1.UserStatus.SUSPENDED) {
        return res.status(403).json({
            success: false,
            message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.",
            code: "ACCOUNT_SUSPENDED",
        });
    }
    if (currentUser.status === UserModel_1.UserStatus.INACTIVE) {
        return res.status(403).json({
            success: false,
            message: "Vui lòng xác thực email để tiếp tục sử dụng dịch vụ.",
            code: "ACCOUNT_INACTIVE",
        });
    }
    next();
};
exports.requireActiveUser = requireActiveUser;
