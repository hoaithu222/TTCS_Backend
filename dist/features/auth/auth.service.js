"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODE = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserModal_1 = __importDefault(require("../../models/UserModal"));
const env_config_1 = require("../../shared/config/env.config");
const jwt_1 = __importDefault(require("../../shared/utils/jwt"));
const mailer_1 = require("../../shared/utils/mailer");
exports.ERROR_CODE = {
    EMAIL_EXISTS: -2,
    EMAIL_NOT_EXISTS: -3,
    EMAIL_NOT_VERIFIED: -4,
    EMAIL_ALREADY_VERIFIED: -5,
};
class AuthService {
    static async registerUser(payload) {
        const { name, email, password } = payload;
        if (!name || !email || !password) {
            return {
                ok: false,
                status: 400,
                message: "Tên, email và mật khẩu là bắt buộc",
            };
        }
        if (!email.includes("@")) {
            return {
                ok: false,
                status: 400,
                message: "Email không hợp lệ",
                code: exports.ERROR_CODE.EMAIL_NOT_EXISTS,
            };
        }
        const existingUser = await UserModal_1.default.findOne({ email });
        if (existingUser && !existingUser.verifyToken) {
            return {
                ok: false,
                status: 400,
                message: "Email đã tồn tại và chưa xác thực",
                code: exports.ERROR_CODE.EMAIL_NOT_VERIFIED,
            };
        }
        if (existingUser && existingUser.verifyToken) {
            return {
                ok: false,
                status: 400,
                message: "Email đã tồn tại",
                code: exports.ERROR_CODE.EMAIL_ALREADY_VERIFIED,
            };
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        const user = await UserModal_1.default.create({
            name,
            email,
            password: hashedPassword,
        });
        const savedUser = await user.save();
        const verifyEmailUrl = `${env_config_1.env.CORS_ORIGIN}/verify-email?token=${savedUser.verifyToken}`;
        await (0, mailer_1.sendEmail)(email, verifyEmailUrl, "Verify your email");
        return {
            ok: true,
            user: savedUser,
            message: "Tạo tài khoản thành công",
        };
    }
    static async verifyEmail(token) {
        if (!token) {
            return { ok: false, status: 400, message: "Thiếu mã xác thực" };
        }
        const user = await UserModal_1.default.findOne({ verifyToken: token });
        if (!user) {
            return {
                ok: false,
                status: 400,
                message: "Email không tồn tại",
            };
        }
        user.verifyToken = undefined;
        user.verifyTokenExpiresAt = undefined;
        await user.save();
        return { ok: true, message: "Email đã được xác thực" };
    }
    static async resendVerifyEmail(email) {
        if (!email) {
            return { ok: false, status: 400, message: "Email không hợp lệ" };
        }
        const user = await UserModal_1.default.findOne({ email });
        if (!user) {
            return {
                ok: false,
                status: 400,
                message: "Email không tồn tại",
            };
        }
        const verifyEmailUrl = `${env_config_1.env.CORS_ORIGIN}/verify-email?token=${user.verifyToken}`;
        await (0, mailer_1.sendEmail)(email, verifyEmailUrl, "Verify your email");
        return { ok: true, message: "Email đã được gửi lại" };
    }
    static async login(payload) {
        const { email, password } = payload;
        const user = await UserModal_1.default.findOne({ email });
        if (!user) {
            return {
                ok: false,
                status: 400,
                message: "Email không tồn tại",
            };
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return {
                ok: false,
                status: 400,
                message: "Mật khẩu không hợp lệ",
            };
        }
        if (user.verifyToken) {
            return {
                ok: false,
                status: 400,
                message: "Email chưa xác thực",
                code: exports.ERROR_CODE.EMAIL_NOT_VERIFIED,
            };
        }
        const accessToken = jwt_1.default.generateAccessToken({
            userId: user.id.toString(),
            email,
        });
        const refreshToken = jwt_1.default.generateRefreshToken();
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();
        return { ok: true, user, message: "Đăng nhập thành công" };
    }
    static async forgotPassword(email) {
        if (!email) {
            return { ok: false, status: 400, message: "Email không hợp lệ" };
        }
        const user = await UserModal_1.default.findOne({ email });
        if (!user) {
            return {
                ok: false,
                status: 400,
                message: "Email không tồn tại",
            };
        }
        const forgotPasswordToken = jwt_1.default.generateRefreshToken();
        user.forgotPasswordToken = forgotPasswordToken;
        user.forgotPasswordTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
        await user.save();
        const forgotPasswordUrl = `${env_config_1.env.CORS_ORIGIN}/reset-password?token=${forgotPasswordToken}`;
        await (0, mailer_1.sendEmail)(email, forgotPasswordUrl, "Reset your password");
        return { ok: true, message: "Email đã được gửi lại" };
    }
}
exports.default = AuthService;
