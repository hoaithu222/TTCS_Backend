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
const OtpModel_1 = __importDefault(require("../../models/OtpModel"));
const utils_1 = __importDefault(require("../auth/utils"));
const mailer_1 = require("../../shared/utils/mailer");
const emailTemplates_1 = require("../../utils/emailTemplates");
const UserModel_1 = __importStar(require("../../models/UserModel"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
class OtpService {
    /**
     * Generate Smart OTP code từ password (sử dụng TOTP algorithm)
     * @param password - Password Smart OTP (plain text)
     * @returns Mã OTP 6 số
     */
    static generateSmartOtpCode(password) {
        // Sử dụng TOTP (Time-based One-Time Password)
        // Lấy timestamp hiện tại, chia cho 30 giây để có time step
        const timeStep = Math.floor(Date.now() / 1000 / 30);
        // Tạo HMAC từ password và time step
        const hmac = crypto_1.default
            .createHmac("sha256", password)
            .update(String(timeStep))
            .digest("hex");
        // Lấy 6 số từ HMAC
        const offset = parseInt(hmac.slice(-1), 16) % (hmac.length - 6);
        const binary = parseInt(hmac.slice(offset, offset + 8), 16);
        const otp = (binary % 1000000).toString().padStart(6, "0");
        return otp;
    }
    /**
     * Request OTP và gửi qua email hoặc SMS
     * @param identifier - Email hoặc số điện thoại
     * @param channel - Kênh gửi: "email" hoặc "phone"
     * @param purpose - Mục đích sử dụng OTP (ví dụ: "verify_setting_change", "setup_smart_otp", etc.)
     * @returns Kết quả request OTP
     */
    static async requestOtp(identifier, channel = "email", purpose = "generic", options) {
        if (!identifier) {
            return { ok: false, status: 400, message: "Thiếu identifier" };
        }
        const code = String((0, utils_1.default)());
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
        await OtpModel_1.default.findOneAndUpdate({ identifier, purpose, used: false }, { code, expiresAt, attempts: 0, channel }, { upsert: true, new: true });
        // Gửi OTP qua email nếu channel là email
        if (channel === "email") {
            try {
                // Lấy tên user từ database nếu có
                const user = await UserModel_1.default.findOne({ email: identifier });
                const userName = user?.name || identifier;
                const defaultTemplate = (0, emailTemplates_1.getOtpEmailTemplateConfig)(purpose, {
                    userName,
                    otpCode: code,
                    appName: options?.appName,
                });
                const subject = options?.emailSubject || defaultTemplate.subject;
                const emailHtml = options?.emailTemplate
                    ? options.emailTemplate({
                        userName,
                        otpCode: code,
                        appName: options?.appName,
                    })
                    : defaultTemplate.html;
                const emailResult = await (0, mailer_1.sendEmail)(identifier, emailHtml, subject);
                if (!emailResult.success) {
                    console.error("[OTP Service] Lỗi khi gửi email OTP:", emailResult.error);
                    // Vẫn trả về success vì OTP đã được tạo, chỉ là không gửi được email
                    // User có thể yêu cầu gửi lại OTP
                }
            }
            catch (error) {
                console.error("[OTP Service] Unexpected error when sending email OTP:", error);
                // Vẫn trả về success vì OTP đã được tạo
            }
        }
        else if (channel === "phone") {
            // TODO: Tích hợp SMS provider ở đây
            console.log(`[OTP Service] SMS OTP: ${code} gửi đến ${identifier}`);
        }
        return { ok: true, message: "OTP đã được tạo và gửi" };
    }
    /**
     * Verify OTP code - Hỗ trợ cả Email OTP và Smart OTP
     * @param identifier - Email hoặc số điện thoại
     * @param code - Mã OTP cần verify (hoặc password Smart OTP nếu dùng Smart OTP)
     * @param purpose - Mục đích sử dụng OTP (phải khớp với purpose khi request)
     * @param smartOtpPassword - Password Smart OTP (chỉ cần khi user dùng Smart OTP, nếu không có thì code sẽ được coi là password)
     * @returns Kết quả verify OTP
     */
    static async verifyOtp(identifier, code, purpose = "generic", smartOtpPassword) {
        if (!identifier || !code) {
            return {
                ok: false,
                status: 400,
                message: "Thiếu identifier hoặc code",
            };
        }
        // Lấy thông tin user để check loại OTP method
        const user = await UserModel_1.default.findOne({ email: identifier });
        // Nếu user đang dùng Smart OTP và có smartOtpPassword được truyền vào
        if (user?.otpMethod === UserModel_1.OtpMethod.SMART_OTP && smartOtpPassword) {
            if (!user.smartOtpSecret) {
                return {
                    ok: false,
                    status: 400,
                    message: "Chưa thiết lập Smart OTP",
                };
            }
            // Verify password Smart OTP bằng cách so sánh với hash đã lưu
            const isPasswordValid = await bcryptjs_1.default.compare(smartOtpPassword, user.smartOtpSecret);
            if (!isPasswordValid) {
                return {
                    ok: false,
                    status: 400,
                    message: "Mật khẩu Smart OTP không đúng",
                };
            }
            // Nếu có smartOtpPassword và code riêng, thì code là mã OTP được tạo từ password
            if (code !== smartOtpPassword) {
                // Generate OTP code từ password và so sánh với code user nhập
                const generatedCode = this.generateSmartOtpCode(smartOtpPassword);
                // Cho phép verify trong khoảng ±1 time step (30 giây) để tránh lệch thời gian
                const timeStep = Math.floor(Date.now() / 1000 / 30);
                const prevTimeStep = timeStep - 1;
                const nextTimeStep = timeStep + 1;
                const prevCode = this.generateSmartOtpCodeFromTimeStep(smartOtpPassword, prevTimeStep);
                const nextCode = this.generateSmartOtpCodeFromTimeStep(smartOtpPassword, nextTimeStep);
                if (code === generatedCode || code === prevCode || code === nextCode) {
                    return { ok: true, message: "Xác minh Smart OTP thành công" };
                }
                else {
                    return {
                        ok: false,
                        status: 400,
                        message: "Mã Smart OTP không hợp lệ",
                    };
                }
            }
            // Chỉ verify password
            return { ok: true, message: "Xác minh Smart OTP thành công" };
        }
        // Nếu user đang dùng Smart OTP nhưng không có smartOtpPassword, fallback về Email OTP
        // Hoặc nếu user đang dùng Email OTP, verify từ database
        const record = await OtpModel_1.default.findOne({ identifier, purpose, used: false }).sort({
            createdAt: -1,
        });
        if (!record) {
            return {
                ok: false,
                status: 404,
                message: "Không tìm thấy mã OTP. Vui lòng yêu cầu mã OTP mới.",
            };
        }
        if (record.expiresAt < new Date()) {
            return {
                ok: false,
                status: 400,
                message: "Mã OTP đã hết hạn. Vui lòng yêu cầu mã OTP mới.",
            };
        }
        if (record.attempts >= record.maxAttempts) {
            return {
                ok: false,
                status: 429,
                message: "Bạn đã nhập sai mã OTP quá nhiều lần. Vui lòng yêu cầu mã OTP mới.",
            };
        }
        if (record.code !== code) {
            record.attempts += 1;
            await record.save();
            const remainingAttempts = record.maxAttempts - record.attempts;
            if (remainingAttempts <= 0) {
                return {
                    ok: false,
                    status: 429,
                    message: "Bạn đã nhập sai mã OTP quá nhiều lần. Vui lòng yêu cầu mã OTP mới.",
                };
            }
            return {
                ok: false,
                status: 400,
                message: `Mã OTP không đúng. Bạn còn ${remainingAttempts} lần thử.`,
            };
        }
        // Đánh dấu OTP đã được sử dụng
        record.used = true;
        await record.save();
        return { ok: true, message: "Xác minh OTP thành công" };
    }
    /**
     * Helper để generate Smart OTP từ time step cụ thể
     */
    static generateSmartOtpCodeFromTimeStep(password, timeStep) {
        const hmac = crypto_1.default
            .createHmac("sha256", password)
            .update(String(timeStep))
            .digest("hex");
        const offset = parseInt(hmac.slice(-1), 16) % (hmac.length - 6);
        const binary = parseInt(hmac.slice(offset, offset + 8), 16);
        const otp = (binary % 1000000).toString().padStart(6, "0");
        return otp;
    }
    /**
     * Helper function để verify OTP trước khi thực hiện các thay đổi quan trọng
     * Sử dụng trong các service khác khi cần verify OTP
     * Tự động detect loại OTP (Email hoặc Smart OTP) dựa vào user's otpMethod
     * @param identifier - Email hoặc số điện thoại
     * @param code - Mã OTP
     * @param purpose - Mục đích sử dụng
     * @param smartOtpPassword - Password Smart OTP (chỉ cần khi user dùng Smart OTP)
     * @returns Kết quả verify
     */
    static async verifyOtpBeforeAction(identifier, code, purpose, smartOtpPassword) {
        return await OtpService.verifyOtp(identifier, code, purpose, smartOtpPassword);
    }
}
exports.default = OtpService;
