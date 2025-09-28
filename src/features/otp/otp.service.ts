import OtpModel from "../../models/OtpModel";
import generatedOtp from "../auth/utils";

export default class OtpService {
  static async requestOtp(
    identifier?: string,
    channel: "email" | "phone" = "email",
    purpose: string = "generic"
  ) {
    if (!identifier) {
      return { ok: false as const, status: 400, message: "Thiếu identifier" };
    }
    const code = String(generatedOtp());
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await OtpModel.findOneAndUpdate(
      { identifier, purpose, used: false },
      { code, expiresAt, attempts: 0, channel },
      { upsert: true, new: true }
    );
    // TODO: integrate mail/SMS provider here
    return { ok: true as const, message: "OTP đã được tạo" };
  }

  static async verifyOtp(
    identifier?: string,
    code?: string,
    purpose: string = "generic"
  ) {
    if (!identifier || !code) {
      return {
        ok: false as const,
        status: 400,
        message: "Thiếu identifier hoặc code",
      };
    }
    const record = await OtpModel.findOne({ identifier, purpose, used: false });
    if (!record) {
      return { ok: false as const, status: 400, message: "OTP không tồn tại" };
    }
    if (record.expiresAt < new Date()) {
      return { ok: false as const, status: 400, message: "OTP đã hết hạn" };
    }
    if (record.attempts >= record.maxAttempts) {
      return {
        ok: false as const,
        status: 429,
        message: "Vượt quá số lần thử",
      };
    }
    if (record.code !== code) {
      record.attempts += 1;
      await record.save();
      return { ok: false as const, status: 400, message: "OTP không hợp lệ" };
    }
    record.used = true;
    await record.save();
    return { ok: true as const, message: "Xác minh OTP thành công" };
  }
}
