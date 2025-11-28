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
const jwt_1 = __importDefault(require("../../shared/utils/jwt"));
const mailer_1 = require("../../shared/utils/mailer");
const utils_1 = __importDefault(require("./utils"));
const forgotPasswordOtpEmailTemplate_1 = __importDefault(require("../../utils/forgotPasswordOtpEmailTemplate"));
const emailTemplates_1 = require("../../utils/emailTemplates");
const otp_service_1 = __importDefault(require("../otp/otp.service"));
const VERIFY_EMAIL_EXPIRES_IN_MS = 10 * 60 * 1000; // 10 minutes
const VERIFY_EMAIL_SUBJECT = "Xác minh email của bạn";
exports.ERROR_CODE = {
    EMAIL_EXISTS: -2,
    EMAIL_NOT_EXISTS: -3,
    EMAIL_NOT_VERIFIED: -4,
    EMAIL_ALREADY_VERIFIED: -5,
    VERIFY_TOKEN_EXPIRED: -6,
};
// OTP-related implementations are not used; keeping service focused on password flows
class AuthService {
    static generateVerifyToken() {
        return String((0, utils_1.default)());
    }
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
        const verifyToken = AuthService.generateVerifyToken();
        const verifyTokenExpiresAt = new Date(Date.now() + VERIFY_EMAIL_EXPIRES_IN_MS);
        const user = await UserModel_1.default.create({
            name,
            email,
            password: hashedPassword,
            otpMethod: otpMethod ?? UserModel_1.OtpMethod.EMAIL,
            verifyToken,
            verifyTokenExpiresAt,
            status: UserModel_1.UserStatus.INACTIVE,
        });
        const savedUser = await user.save();
        const verifyEmail = (0, emailTemplates_1.buildVerifyAccountEmail)({
            userName: name,
            otpCode: verifyToken,
        });
        await (0, mailer_1.sendEmail)(email, verifyEmail.html, verifyEmail.subject);
        return {
            ok: true,
            user: savedUser,
            message: "Tạo tài khoản thành công",
        };
    }
    static async verifyEmail(token) {
        if (!token) {
            return {
                ok: false,
                status: 400,
                message: "Thiếu mã xác thực. Vui lòng kiểm tra lại email và thử lại.",
                code: exports.ERROR_CODE.VERIFY_TOKEN_EXPIRED,
            };
        }
        // Kiểm tra format token (phải là 6 số)
        if (!/^\d{6}$/.test(token)) {
            return {
                ok: false,
                status: 400,
                message: "Mã xác thực không đúng định dạng. Mã OTP phải là 6 chữ số.",
                code: exports.ERROR_CODE.VERIFY_TOKEN_EXPIRED,
            };
        }
        const user = await UserModel_1.default.findOne({ verifyToken: token });
        if (!user) {
            return {
                ok: false,
                status: 400,
                message: "Mã xác thực không hợp lệ hoặc đã được sử dụng. Vui lòng kiểm tra lại email hoặc yêu cầu mã mới.",
                code: exports.ERROR_CODE.VERIFY_TOKEN_EXPIRED,
            };
        }
        if (!user.verifyTokenExpiresAt ||
            user.verifyTokenExpiresAt.getTime() < Date.now()) {
            return {
                ok: false,
                status: 400,
                message: "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã OTP mới.",
                code: exports.ERROR_CODE.VERIFY_TOKEN_EXPIRED,
            };
        }
        user.verifyToken = undefined;
        user.verifyTokenExpiresAt = undefined;
        user.status = UserModel_1.UserStatus.ACTIVE;
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
        const verifyToken = AuthService.generateVerifyToken();
        user.verifyToken = verifyToken;
        user.verifyTokenExpiresAt = new Date(Date.now() + VERIFY_EMAIL_EXPIRES_IN_MS);
        await user.save();
        const verifyEmail = (0, emailTemplates_1.buildVerifyAccountEmail)({
            userName: user.name || email,
            otpCode: verifyToken,
        });
        await (0, mailer_1.sendEmail)(email, verifyEmail.html, verifyEmail.subject);
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
        const otpResult = await otp_service_1.default.requestOtp(email, "email", "forgot_password", {
            emailSubject: "SHOPONLINE - Yêu cầu đặt lại mật khẩu",
            emailTemplate: forgotPasswordOtpEmailTemplate_1.default,
            appName: "SHOPONLINE",
        });
        if (!otpResult.ok) {
            return {
                ok: false,
                status: otpResult.status ?? 400,
                message: otpResult.message ?? "Không thể gửi OTP",
            };
        }
        return { ok: true, message: "Đã gửi mã OTP đặt lại mật khẩu" };
    }
    static async resetPassword(payload) {
        const { password, confirmPassword, identifier, otp } = payload;
        if (!identifier || !otp) {
            return {
                ok: false,
                status: 400,
                message: "Thiếu OTP hoặc email",
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
        const otpVerifyResult = await otp_service_1.default.verifyOtpBeforeAction(identifier, otp, "forgot_password");
        if (!otpVerifyResult.ok) {
            return {
                ok: false,
                status: otpVerifyResult.status ?? 400,
                message: otpVerifyResult.message || "OTP không hợp lệ",
            };
        }
        const user = await UserModel_1.default.findOne({ email: identifier });
        if (!user) {
            return {
                ok: false,
                status: 400,
                message: "Tài khoản không tồn tại",
            };
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const hashedPassword = await bcryptjs_1.default.hash(password, salt);
        user.password = hashedPassword;
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
