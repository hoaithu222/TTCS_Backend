"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ERROR_CODE = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const UserModel_1 = __importStar(require("../../models/UserModel"));
const env_config_1 = require("../../shared/config/env.config");
const jwt_1 = __importDefault(require("../../shared/utils/jwt"));
const mailer_1 = require("../../shared/utils/mailer");
const OtpModel_1 = __importDefault(require("../../models/OtpModel"));
exports.ERROR_CODE = {
    EMAIL_EXISTS: -2,
    EMAIL_NOT_EXISTS: -3,
    EMAIL_NOT_VERIFIED: -4,
    EMAIL_ALREADY_VERIFIED: -5,
};
// OTP-related implementations are not used; keeping service focused on password flows
class AuthService {
    static async registerUser(payload) {
        const { name, email, password, otpMethod } = payload;
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
        const existingUser = await UserModel_1.default.findOne({ email });
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
        const user = await UserModel_1.default.create({
            name,
            email,
            password: hashedPassword,
            otpMethod: otpMethod ?? UserModel_1.OtpMethod.EMAIL,
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
        const user = await UserModel_1.default.findOne({ verifyToken: token });
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
        const user = await UserModel_1.default.findOne({ email });
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
        const user = await UserModel_1.default.findOne({ email });
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
        const user = await UserModel_1.default.findOne({ email });
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
    static async resetPassword(payload) {
        const { token, password, confirmPassword, identifier, otp } = payload;
        if (!token) {
            return { ok: false, status: 400, message: "Thiếu mã xác thực" };
        }
        if (!identifier || !otp) {
            return {
                ok: false,
                status: 400,
                message: "Thiếu OTP hoặc identifier",
            };
        }
        if (!password || !confirmPassword) {
            return {
                ok: false,
                status: 400,
                message: "Mật khẩu là bắt buộc",
            };
        }
        if (password !== confirmPassword) {
            return {
                ok: false,
                status: 400,
                message: "Mật khẩu không khớp",
            };
        }
        // Verify OTP first
        const otpRecord = await OtpModel_1.default.findOne({ identifier, used: false }).sort({
            createdAt: -1,
        });
        if (!otpRecord) {
            return { ok: false, status: 400, message: "OTP không tồn tại" };
        }
        if (otpRecord.expiresAt < new Date()) {
            return { ok: false, status: 400, message: "OTP đã hết hạn" };
        }
        if (otpRecord.attempts >= otpRecord.maxAttempts) {
            return {
                ok: false,
                status: 429,
                message: "Vượt quá số lần thử OTP",
            };
        }
        if (otpRecord.code !== otp) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return { ok: false, status: 400, message: "OTP không hợp lệ" };
        }
        otpRecord.used = true;
        await otpRecord.save();
        const user = await UserModel_1.default.findOne({ forgotPasswordToken: token });
        if (!user) {
            return { ok: false, status: 400, message: "Token không hợp lệ" };
        }
        if (user.forgotPasswordTokenExpiresAt &&
            user.forgotPasswordTokenExpiresAt < new Date()) {
            return { ok: false, status: 400, message: "Token đã hết hạn" };
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        user.password = hashedPassword;
        user.forgotPasswordToken = undefined;
        user.forgotPasswordTokenExpiresAt = undefined;
        await user.save();
        return { ok: true, message: "Đặt lại mật khẩu thành công" };
    }
    // refesh token
    static async refreshToken(token) {
        const decoded = jwt_1.default.verifyAccessToken(token);
        const user = await UserModel_1.default.findById(decoded.userId);
        if (!user) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        const accessToken = jwt_1.default.generateAccessToken({
            userId: user.id.toString(),
            email: user.email,
        });
        const refreshToken = jwt_1.default.generateRefreshToken();
        user.accessToken = accessToken;
        user.refreshToken = refreshToken;
        await user.save();
        return { ok: true, user, message: "Refresh token thành công" };
    }
    // logout
    static async logout(token) {
        const decoded = jwt_1.default.verifyAccessToken(token);
        const user = await UserModel_1.default.findById(decoded.userId);
        if (!user) {
            return { ok: false, status: 400, message: "User không tồn tại" };
        }
        user.accessToken = undefined;
        user.refreshToken = undefined;
        await user.save();
        return { ok: true, message: "Đăng xuất thành công" };
    }
}
exports.default = AuthService;
