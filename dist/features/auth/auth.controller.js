"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutController = exports.refreshTokenController = exports.resetPasswordController = exports.forgotPasswordController = exports.loginController = exports.resendVerifyEmailController = exports.verifyEmailController = exports.registerUserController = void 0;
const response_util_1 = require("../../shared/utils/response.util");
const auth_service_1 = __importDefault(require("./auth.service"));
// định nghĩa code error
// ERROR_CODE imported from service for a single source of truth
// đắng kí
const registerUserController = async (req, res) => {
    const result = await auth_service_1.default.registerUser(req.body);
    if (!result.ok) {
        // Skip toast for registration errors - they should be handled in UI
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method, result.code, true // skipToast = true for registration errors
        );
    }
    return response_util_1.ResponseUtil.success(res, {
        message: result.message,
        user: result.user,
    });
};
exports.registerUserController = registerUserController;
const verifyEmailController = async (req, res) => {
    const { token } = req.query;
    const result = await auth_service_1.default.verifyEmail(token);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method, result.code // Pass error code to response
        );
    }
    return response_util_1.ResponseUtil.success(res, { message: result.message });
};
exports.verifyEmailController = verifyEmailController;
// resend verify email
const resendVerifyEmailController = async (req, res) => {
    const { email } = req.body;
    const result = await auth_service_1.default.resendVerifyEmail(email);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method);
    }
    return response_util_1.ResponseUtil.success(res, { message: result.message });
};
exports.resendVerifyEmailController = resendVerifyEmailController;
// login
const loginController = async (req, res) => {
    const result = await auth_service_1.default.login(req.body);
    if (!result.ok) {
        // Skip toast for login errors - they should be handled in UI
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method, result.code, true // skipToast = true for login errors
        );
    }
    return response_util_1.ResponseUtil.success(res, {
        message: result.message,
        user: result.user,
    });
};
exports.loginController = loginController;
// quên mật khẩu
const forgotPasswordController = async (req, res) => {
    const { email } = req.body;
    const result = await auth_service_1.default.forgotPassword(email);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method);
    }
    return response_util_1.ResponseUtil.success(res, { message: result.message });
};
exports.forgotPasswordController = forgotPasswordController;
// reset password quên mật khẩu
const resetPasswordController = async (req, res) => {
    const result = await auth_service_1.default.resetPassword(req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method);
    }
    return response_util_1.ResponseUtil.success(res, { message: result.message });
};
exports.resetPasswordController = resetPasswordController;
const refreshTokenController = async (req, res) => {
    const { token } = req.body;
    const result = await auth_service_1.default.refreshToken(token);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method);
    }
    return response_util_1.ResponseUtil.success(res, { message: result.message });
};
exports.refreshTokenController = refreshTokenController;
// logout
const logoutController = async (req, res) => {
    // Try to get token from request body, then from Authorization header
    const body = req.body;
    const tokenFromBody = body?.token;
    const authHeader = req.headers.authorization;
    const tokenFromHeader = authHeader && authHeader.split(" ")[1];
    // Ưu tiên token từ Authorization header để tránh trường hợp frontend gửi refresh token trong body
    const token = tokenFromHeader || tokenFromBody;
    if (!token) {
        return response_util_1.ResponseUtil.error(res, "Token không được cung cấp", 400, undefined, req.path, req.method, undefined, // code
        true // skipToast
        );
    }
    const result = await auth_service_1.default.logout(token);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method, undefined, // code
        true // skipToast - logout errors shouldn't show toast
        );
    }
    return response_util_1.ResponseUtil.success(res, { message: result.message });
};
exports.logoutController = logoutController;
