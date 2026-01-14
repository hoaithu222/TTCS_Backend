import { Request, Response, NextFunction, RequestHandler } from "express";
import { UserStatus } from "../../models/UserModel";

/**
 * Middleware to check if user is active (not suspended or inactive)
 * Must be used AFTER authenticateToken middleware
 */
export const requireActiveUser: RequestHandler = (req, res, next) => {
    const currentUser = (req as any).currentUser;

    if (!currentUser) {
        return res.status(401).json({
            success: false,
            message: "Unauthorized",
        });
    }

    if (currentUser.status === UserStatus.SUSPENDED) {
        return res.status(403).json({
            success: false,
            message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.",
            code: "ACCOUNT_SUSPENDED",
        });
    }

    if (currentUser.status === UserStatus.INACTIVE) {
        return res.status(403).json({
            success: false,
            message: "Vui lòng xác thực email để tiếp tục sử dụng dịch vụ.",
            code: "ACCOUNT_INACTIVE",
        });
    }

    next();
};
