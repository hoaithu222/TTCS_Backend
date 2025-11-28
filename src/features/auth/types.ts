import { OtpMethod } from "../../models/UserModel";

export interface RegisterUserRequest {
  name: string;
  email: string;
  password: string;
  otpMethod?: OtpMethod; // preferred OTP method: smart_otp | sms | email
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  identifier: string;
  otp: string;
  password: string;
  confirmPassword: string;
}

export interface LogoutRequest {
  token?: string; // optional token from request body, can also use Authorization header
}