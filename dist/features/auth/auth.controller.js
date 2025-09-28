"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPasswordController = exports.loginController = exports.resendVerifyEmailController = exports.verifyEmailController = exports.registerUserController = void 0;
const response_util_1 = require("../../shared/utils/response.util");
const auth_service_1 = __importDefault(require("./auth.service"));
// định nghĩa code error
// ERROR_CODE imported from service for a single source of truth
// đắng kí
const registerUserController = async (req, res) => {
    const result = await auth_service_1.default.registerUser(req.body);
    if (!result.ok) {
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method, result.code);
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
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method);
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
        return response_util_1.ResponseUtil.error(res, result.message, result.status, undefined, req.path, req.method, result.code);
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
