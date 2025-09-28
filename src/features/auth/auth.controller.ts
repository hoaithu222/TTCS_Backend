import { ResponseUtil } from "../../shared/utils/response.util";
import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
} from "express";
import AuthService, { ERROR_CODE } from "./auth.service";
import {
  LoginRequest,
  RegisterUserRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from "./types";

// định nghĩa code error
// ERROR_CODE imported from service for a single source of truth
// đắng kí
export const registerUserController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const result = await AuthService.registerUser(
    req.body as RegisterUserRequest
  );
  if (!result.ok) {
    return ResponseUtil.error(
      res,
      result.message,
      result.status,
      undefined,
      req.path,
      req.method,
      result.code
    );
  }
  return ResponseUtil.success(res, {
    message: result.message,
    user: result.user,
  });
};

export const verifyEmailController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const { token } = req.query as { token?: string };
  const result = await AuthService.verifyEmail(token);
  if (!result.ok) {
    return ResponseUtil.error(
      res,
      result.message,
      result.status,
      undefined,
      req.path,
      req.method
    );
  }
  return ResponseUtil.success(res, { message: result.message });
};
// resend verify email
export const resendVerifyEmailController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const { email } = req.body as { email?: string };
  const result = await AuthService.resendVerifyEmail(email);
  if (!result.ok) {
    return ResponseUtil.error(
      res,
      result.message,
      result.status,
      undefined,
      req.path,
      req.method
    );
  }
  return ResponseUtil.success(res, { message: result.message });
};

// login

export const loginController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const result = await AuthService.login(req.body as LoginRequest);
  if (!result.ok) {
    return ResponseUtil.error(
      res,
      result.message,
      result.status,
      undefined,
      req.path,
      req.method,
      result.code
    );
  }
  return ResponseUtil.success(res, {
    message: result.message,
    user: result.user,
  });
};
// quên mật khẩu
export const forgotPasswordController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const { email } = req.body as ForgotPasswordRequest;
  const result = await AuthService.forgotPassword(email);
  if (!result.ok) {
    return ResponseUtil.error(
      res,
      result.message,
      result.status,
      undefined,
      req.path,
      req.method
    );
  }
  return ResponseUtil.success(res, { message: result.message });
};
// reset password quên mật khẩu
export const resetPasswordController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const result = await AuthService.resetPassword(
    req.body as ResetPasswordRequest
  );
  if (!result.ok) {
    return ResponseUtil.error(
      res,
      result.message,
      result.status,
      undefined,
      req.path,
      req.method
    );
  }
  return ResponseUtil.success(res, { message: result.message });
};

export const refreshTokenController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const { token } = req.body as { token?: string };
  const result = await AuthService.refreshToken(token as string);
  if (!result.ok) {
    return ResponseUtil.error(
      res,
      result.message,
      result.status,
      undefined,
      req.path,
      req.method
    );
  }
  return ResponseUtil.success(res, { message: result.message });
};
// logout
export const logoutController = async (
  req: ExpressRequest,
  res: ExpressResponse
) => {
  const { token } = req.body as { token?: string };
  const result = await AuthService.logout(token as string);
  if (!result.ok) {
    return ResponseUtil.error(
      res,
      result.message,
      result.status,
      undefined,
      req.path,
      req.method
    );
  }
  return ResponseUtil.success(res, { message: result.message });
};
