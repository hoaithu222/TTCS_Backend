import bcryptjs from "bcryptjs";
import UserModel, { OtpMethod } from "../../models/UserModel";

import { env } from "../../shared/config/env.config";
import Jwt, { JwtAccessPayload } from "../../shared/utils/jwt";
import { sendEmail } from "../../shared/utils/mailer";
import {
  LoginRequest,
  RegisterUserRequest,
  ResetPasswordRequest,
} from "./types";
import OtpModel from "../../models/OtpModel";

export const ERROR_CODE = {
  EMAIL_EXISTS: -2,
  EMAIL_NOT_EXISTS: -3,
  EMAIL_NOT_VERIFIED: -4,
  EMAIL_ALREADY_VERIFIED: -5,
} as const;

// OTP-related implementations are not used; keeping service focused on password flows

export default class AuthService {
  static async registerUser(payload: RegisterUserRequest) {
    const { name, email, password, otpMethod } = payload;
    if (!name || !email || !password) {
      return {
        ok: false as const,
        status: 400,
        message: "Tên, email và mật khẩu là bắt buộc",
      };
    }
    if (!email.includes("@")) {
      return {
        ok: false as const,
        status: 400,
        message: "Email không hợp lệ",
        code: ERROR_CODE.EMAIL_NOT_EXISTS,
      };
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser && !existingUser.verifyToken) {
      return {
        ok: false as const,
        status: 400,
        message: "Email đã tồn tại và chưa xác thực",
        code: ERROR_CODE.EMAIL_NOT_VERIFIED,
      };
    }
    if (existingUser && existingUser.verifyToken) {
      return {
        ok: false as const,
        status: 400,
        message: "Email đã tồn tại",
        code: ERROR_CODE.EMAIL_ALREADY_VERIFIED,
      };
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      otpMethod: otpMethod ?? OtpMethod.EMAIL,
    });
    const savedUser = await user.save();

    const verifyEmailUrl = `${env.CORS_ORIGIN}/verify-email?token=${savedUser.verifyToken}`;
    await sendEmail(email, verifyEmailUrl, "Verify your email");

    return {
      ok: true as const,
      user: savedUser,
      message: "Tạo tài khoản thành công",
    };
  }

  static async verifyEmail(token?: string) {
    if (!token) {
      return { ok: false as const, status: 400, message: "Thiếu mã xác thực" };
    }
    const user = await UserModel.findOne({ verifyToken: token });
    if (!user) {
      return {
        ok: false as const,
        status: 400,
        message: "Email không tồn tại",
      };
    }
    user.verifyToken = undefined;
    user.verifyTokenExpiresAt = undefined;
    await user.save();
    return { ok: true as const, message: "Email đã được xác thực" };
  }

  static async resendVerifyEmail(email?: string) {
    if (!email) {
      return { ok: false as const, status: 400, message: "Email không hợp lệ" };
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return {
        ok: false as const,
        status: 400,
        message: "Email không tồn tại",
      };
    }
    const verifyEmailUrl = `${env.CORS_ORIGIN}/verify-email?token=${user.verifyToken}`;
    await sendEmail(email, verifyEmailUrl, "Verify your email");
    return { ok: true as const, message: "Email đã được gửi lại" };
  }

  static async login(payload: LoginRequest) {
    const { email, password } = payload;
    const user = await UserModel.findOne({ email });
    if (!user) {
      return {
        ok: false as const,
        status: 400,
        message: "Email không tồn tại",
      };
    }
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return {
        ok: false as const,
        status: 400,
        message: "Mật khẩu không hợp lệ",
      };
    }
    if (user.verifyToken) {
      return {
        ok: false as const,
        status: 400,
        message: "Email chưa xác thực",
        code: ERROR_CODE.EMAIL_NOT_VERIFIED,
      };
    }

    const accessToken = Jwt.generateAccessToken({
      userId: user.id.toString(),
      email,
    });
    const refreshToken = Jwt.generateRefreshToken();
    user.accessToken = accessToken as unknown as string;
    user.refreshToken = refreshToken as unknown as string;
    await user.save();
    return { ok: true as const, user, message: "Đăng nhập thành công" };
  }

  static async forgotPassword(email?: string) {
    if (!email) {
      return { ok: false as const, status: 400, message: "Email không hợp lệ" };
    }
    const user = await UserModel.findOne({ email });
    if (!user) {
      return {
        ok: false as const,
        status: 400,
        message: "Email không tồn tại",
      };
    }
    const forgotPasswordToken = Jwt.generateRefreshToken() as unknown as string;
    user.forgotPasswordToken = forgotPasswordToken;
    user.forgotPasswordTokenExpiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24
    );
    await user.save();
    const forgotPasswordUrl = `${env.CORS_ORIGIN}/reset-password?token=${forgotPasswordToken}`;
    await sendEmail(email, forgotPasswordUrl, "Reset your password");
    return { ok: true as const, message: "Email đã được gửi lại" };
  }

  static async resetPassword(payload: ResetPasswordRequest) {
    const { token, password, confirmPassword, identifier, otp } = payload;
    if (!token) {
      return { ok: false as const, status: 400, message: "Thiếu mã xác thực" };
    }
    if (!identifier || !otp) {
      return {
        ok: false as const,
        status: 400,
        message: "Thiếu OTP hoặc identifier",
      };
    }
    if (!password || !confirmPassword) {
      return {
        ok: false as const,
        status: 400,
        message: "Mật khẩu là bắt buộc",
      };
    }
    if (password !== confirmPassword) {
      return {
        ok: false as const,
        status: 400,
        message: "Mật khẩu không khớp",
      };
    }
    // Verify OTP first
    const otpRecord = await OtpModel.findOne({ identifier, used: false }).sort({
      createdAt: -1,
    });
    if (!otpRecord) {
      return { ok: false as const, status: 400, message: "OTP không tồn tại" };
    }
    if (otpRecord.expiresAt < new Date()) {
      return { ok: false as const, status: 400, message: "OTP đã hết hạn" };
    }
    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return {
        ok: false as const,
        status: 429,
        message: "Vượt quá số lần thử OTP",
      };
    }
    if (otpRecord.code !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return { ok: false as const, status: 400, message: "OTP không hợp lệ" };
    }
    otpRecord.used = true;
    await otpRecord.save();
    const user = await UserModel.findOne({ forgotPasswordToken: token });
    if (!user) {
      return { ok: false as const, status: 400, message: "Token không hợp lệ" };
    }
    if (
      user.forgotPasswordTokenExpiresAt &&
      user.forgotPasswordTokenExpiresAt < new Date()
    ) {
      return { ok: false as const, status: 400, message: "Token đã hết hạn" };
    }
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    user.password = hashedPassword;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordTokenExpiresAt = undefined;
    await user.save();
    return { ok: true as const, message: "Đặt lại mật khẩu thành công" };
  }
  // refesh token

  static async refreshToken(token: string) {
    const decoded = Jwt.verifyAccessToken<JwtAccessPayload>(token);
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return { ok: false as const, status: 400, message: "User không tồn tại" };
    }
    const accessToken = Jwt.generateAccessToken({
      userId: user.id.toString(),
      email: user.email,
    });
    const refreshToken = Jwt.generateRefreshToken();
    user.accessToken = accessToken as unknown as string;
    user.refreshToken = refreshToken as unknown as string;
    await user.save();
    return { ok: true as const, user, message: "Refresh token thành công" };
  }
  // logout
  static async logout(token: string) {
    const decoded = Jwt.verifyAccessToken<JwtAccessPayload>(token);
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return { ok: false as const, status: 400, message: "User không tồn tại" };
    }
    user.accessToken = undefined;
    user.refreshToken = undefined;
    await user.save();
    return { ok: true as const, message: "Đăng xuất thành công" };
  }
}
