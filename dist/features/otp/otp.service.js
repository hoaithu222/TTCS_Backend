"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const OtpModel_1 = __importDefault(require("../../models/OtpModel"));
const utils_1 = __importDefault(require("../auth/utils"));
class OtpService {
    static async requestOtp(identifier, channel = "email", purpose = "generic") {
        if (!identifier) {
            return { ok: false, status: 400, message: "Thiếu identifier" };
        }
        const code = String((0, utils_1.default)());
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        await OtpModel_1.default.findOneAndUpdate({ identifier, purpose, used: false }, { code, expiresAt, attempts: 0, channel }, { upsert: true, new: true });
        // TODO: integrate mail/SMS provider here
        return { ok: true, message: "OTP đã được tạo" };
    }
    static async verifyOtp(identifier, code, purpose = "generic") {
        if (!identifier || !code) {
            return {
                ok: false,
                status: 400,
                message: "Thiếu identifier hoặc code",
            };
        }
        const record = await OtpModel_1.default.findOne({ identifier, purpose, used: false });
        if (!record) {
            return { ok: false, status: 400, message: "OTP không tồn tại" };
        }
        if (record.expiresAt < new Date()) {
            return { ok: false, status: 400, message: "OTP đã hết hạn" };
        }
        if (record.attempts >= record.maxAttempts) {
            return {
                ok: false,
                status: 429,
                message: "Vượt quá số lần thử",
            };
        }
        if (record.code !== code) {
            record.attempts += 1;
            await record.save();
            return { ok: false, status: 400, message: "OTP không hợp lệ" };
        }
        record.used = true;
        await record.save();
        return { ok: true, message: "Xác minh OTP thành công" };
    }
}
exports.default = OtpService;
