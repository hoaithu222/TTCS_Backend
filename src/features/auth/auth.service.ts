import bcryptjs from "bcryptjs";
import UserModel, { OtpMethod, UserStatus } from "../../models/UserModel";

import Jwt, { JwtAccessPayload } from "../../shared/utils/jwt";
import { sendEmail } from "../../shared/utils/mailer";
import {
  LoginRequest,
  RegisterUserRequest,
  ResetPasswordRequest,
} from "./types";
import generatedOtp from "./utils";
import forgotPasswordOtpEmailTemplate from "../../utils/forgotPasswordOtpEmailTemplate";
import { buildVerifyAccountEmail } from "../../utils/emailTemplates";
import OtpService from "../otp/otp.service";

const VERIFY_EMAIL_EXPIRES_IN_MS = 10 * 60 * 1000; // 10 minutes
const VERIFY_EMAIL_SUBJECT = "Xác minh email của bạn";

export const ERROR_CODE = {
  EMAIL_EXISTS: -2,
  EMAIL_NOT_EXISTS: -3,
  EMAIL_NOT_VERIFIED: -4,
  EMAIL_ALREADY_VERIFIED: -5,
  VERIFY_TOKEN_EXPIRED: -6,
} as const;

// OTP-related implementations are not used; keeping service focused on password flows

export default class AuthService {
  private static generateVerifyToken() {
    return String(generatedOtp());
  }

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
    const verifyToken = AuthService.generateVerifyToken();
    const verifyTokenExpiresAt = new Date(Date.now() + VERIFY_EMAIL_EXPIRES_IN_MS);
    const user = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      otpMethod: otpMethod ?? OtpMethod.EMAIL,
      verifyToken,
      verifyTokenExpiresAt,
      status: UserStatus.INACTIVE,
    });
    const savedUser = await user.save();

    const verifyEmail = buildVerifyAccountEmail({
      userName: name,
      otpCode: verifyToken,
    });
    await sendEmail(email, verifyEmail.html, verifyEmail.subject);

    return {
      ok: true as const,
      user: savedUser,
      message: "Tạo tài khoản thành công",
    };
  }

  static async verifyEmail(token?: string) {
    if (!token) {
      return {
        ok: false as const,
        status: 400,
        message: "Thiếu mã xác thực. Vui lòng kiểm tra lại email và thử lại.",
        code: ERROR_CODE.VERIFY_TOKEN_EXPIRED,
      };
    }
    
    // Kiểm tra format token (phải là 6 số)
    if (!/^\d{6}$/.test(token)) {
      return {
        ok: false as const,
        status: 400,
        message: "Mã xác thực không đúng định dạng. Mã OTP phải là 6 chữ số.",
        code: ERROR_CODE.VERIFY_TOKEN_EXPIRED,
      };
    }
    
    const user = await UserModel.findOne({ verifyToken: token });
    if (!user) {
      return {
        ok: false as const,
        status: 400,
        message: "Mã xác thực không hợp lệ hoặc đã được sử dụng. Vui lòng kiểm tra lại email hoặc yêu cầu mã mới.",
        code: ERROR_CODE.VERIFY_TOKEN_EXPIRED,
      };
    }
    
    if (
      !user.verifyTokenExpiresAt ||
      user.verifyTokenExpiresAt.getTime() < Date.now()
    ) {
      return {
        ok: false as const,
        status: 400,
        message: "Mã xác thực đã hết hạn. Vui lòng yêu cầu mã OTP mới.",
        code: ERROR_CODE.VERIFY_TOKEN_EXPIRED,
      };
    }
    user.verifyToken = undefined;
    user.verifyTokenExpiresAt = undefined;
    user.status = UserStatus.ACTIVE;
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
    const verifyToken = AuthService.generateVerifyToken();
    user.verifyToken = verifyToken;
    user.verifyTokenExpiresAt = new Date(Date.now() + VERIFY_EMAIL_EXPIRES_IN_MS);
    await user.save();

    const verifyEmail = buildVerifyAccountEmail({
      userName: user.name || email,
      otpCode: verifyToken,
    });
    await sendEmail(email, verifyEmail.html, verifyEmail.subject);
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

    const otpResult = await OtpService.requestOtp(
      email,
      "email",
      "forgot_password",
      {
        emailSubject: "SHOPONLINE - Yêu cầu đặt lại mật khẩu",
        emailTemplate: forgotPasswordOtpEmailTemplate,
        appName: "SHOPONLINE",
      }
    );

    if (!otpResult.ok) {
      return {
        ok: false as const,
        status: otpResult.status ?? 400,
        message: otpResult.message ?? "Không thể gửi OTP",
      };
    }

    return { ok: true as const, message: "Đã gửi mã OTP đặt lại mật khẩu" };
  }

  static async resetPassword(payload: ResetPasswordRequest) {
    const { password, confirmPassword, identifier, otp } = payload;
    if (!identifier || !otp) {
      return {
        ok: false as const,
        status: 400,
        message: "Thiếu OTP hoặc email",
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
    const otpVerifyResult = await OtpService.verifyOtpBeforeAction(
      identifier,
      otp,
      "forgot_password"
    );

    if (!otpVerifyResult.ok) {
      return {
        ok: false as const,
        status: otpVerifyResult.status ?? 400,
        message: otpVerifyResult.message || "OTP không hợp lệ",
      };
    }

    const user = await UserModel.findOne({ email: identifier });
    if (!user) {
      return {
        ok: false as const,
        status: 400,
        message: "Tài khoản không tồn tại",
      };
    }

    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);
    user.password = hashedPassword;
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
