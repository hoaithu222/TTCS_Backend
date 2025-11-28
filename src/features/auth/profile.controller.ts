import { Request, Response } from "express";
import bcryptjs from "bcryptjs";
import { ResponseUtil } from "../../shared/utils/response.util";
import UserModel, { OtpMethod } from "../../models/UserModel";
import ShopService from "../shop/shop.service";
import OtpService from "../otp/otp.service";

export const getProfileController = async (req: Request, res: Response) => {
  const currentUser = (req as any).currentUser;
  if (!currentUser) return ResponseUtil.unauthorized(res);
  
  // Convert Mongoose document to plain object
  const userData = currentUser.toObject ? currentUser.toObject() : currentUser;
  
  // Lấy shop status của user
  const shopStatusResult = await ShopService.getShopStatusByUserId(currentUser._id || currentUser.id);
  if (shopStatusResult.ok) {
    return ResponseUtil.success(res, {
      ...userData,
      shopStatus: shopStatusResult.shopStatus,
      shop: shopStatusResult.shop,
    });
  }
  
  return ResponseUtil.success(res, {
    ...userData,
    shopStatus: "not_registered",
    shop: null,
  });
};

export const changePasswordController = async (req: Request, res: Response) => {
  const currentUser = (req as any).currentUser as { _id: string; email: string } | undefined;
  if (!currentUser) return ResponseUtil.unauthorized(res);

  const {
    currentPassword,
    newPassword,
    confirmPassword,
    otp,
    otpPurpose = "change_password",
  } = req.body as {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
    otp?: string;
    otpPurpose?: string;
  };

  if (!currentPassword || !newPassword || !confirmPassword) {
    return ResponseUtil.badRequest(res, "Thiếu thông tin bắt buộc");
  }

  if (newPassword !== confirmPassword) {
    return ResponseUtil.badRequest(res, "Mật khẩu xác nhận không khớp");
  }

  if (newPassword.length < 6) {
    return ResponseUtil.badRequest(res, "Mật khẩu mới phải có ít nhất 6 ký tự");
  }

  // Lấy user từ database
  const user = await UserModel.findById(currentUser._id);
  if (!user) {
    return ResponseUtil.badRequest(res, "User không tồn tại");
  }

  // Verify current password
  const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, user.password);
  if (!isCurrentPasswordValid) {
    return ResponseUtil.badRequest(res, "Mật khẩu hiện tại không đúng");
  }

  // Verify OTP - bắt buộc để đổi mật khẩu
  if (!otp || !otpPurpose) {
    return ResponseUtil.badRequest(
      res,
      "Cần mã OTP để xác minh trước khi đổi mật khẩu"
    );
  }

  let smartOtpPassword: string | undefined;
  if (user.otpMethod === OtpMethod.SMART_OTP) {
    smartOtpPassword = req.body.smartOtpPassword;
    // Không bắt buộc smartOtpPassword, cho phép dùng Email OTP để verify
  }

  const otpVerifyResult = await OtpService.verifyOtpBeforeAction(
    currentUser.email,
    otp,
    otpPurpose,
    smartOtpPassword
  );

  if (!otpVerifyResult.ok) {
    return ResponseUtil.error(
      res,
      otpVerifyResult.message || "OTP không hợp lệ",
      otpVerifyResult.status || 400
    );
  }

  // Hash new password
  const salt = await bcryptjs.genSalt(10);
  const hashedPassword = await bcryptjs.hash(newPassword, salt);

  try {
    user.password = hashedPassword;
    await user.save();
    return ResponseUtil.success(res, { message: "Đổi mật khẩu thành công" });
  } catch (e) {
    return ResponseUtil.error(res, (e as Error).message, 400);
  }
};

export const updateProfileController = async (req: Request, res: Response) => {
  const currentUser = (req as any).currentUser as { _id: string; email: string } | undefined;
  if (!currentUser) return ResponseUtil.unauthorized(res);

  const {
    name,
    fullName,
    phone,
    avatar,
    otpMethod,
    twoFactorAuth,
    isFirstLogin,
    twoFactorAuthSecret,
    smartOtpSecret,
    otp, // OTP để verify trước khi thay đổi setting quan trọng
    otpPurpose, // Purpose của OTP (verify_setting_change, setup_smart_otp, change_smart_otp_password)
  } = req.body as {
    name?: string;
    fullName?: string;
    phone?: string;
    avatar?: string;
    otpMethod?: OtpMethod;
    twoFactorAuth?: boolean;
    isFirstLogin?: boolean;
    twoFactorAuthSecret?: string;
    smartOtpSecret?: string;
    otp?: string;
    otpPurpose?: string;
  };

  // Kiểm tra xem có thay đổi setting quan trọng không
  const isChangingImportantSetting = 
    typeof twoFactorAuth === "boolean" ||
    typeof otpMethod !== "undefined" ||
    typeof smartOtpSecret === "string";

  // Nếu thay đổi setting quan trọng, cần verify OTP
  if (isChangingImportantSetting) {
    if (!otp || !otpPurpose) {
      return ResponseUtil.badRequest(
        res,
        "Cần mã OTP để xác minh trước khi thay đổi cài đặt bảo mật"
      );
    }

    // Lấy thông tin user để check loại OTP method
    const user = await UserModel.findById(currentUser._id);
    if (!user) {
      return ResponseUtil.badRequest(res, "User không tồn tại");
    }

    // Nếu user đang dùng Smart OTP, cần password Smart OTP để verify
    // Nhưng cho phép fallback về Email OTP nếu không có smartOtpPassword
    let smartOtpPassword: string | undefined;
    if (user.otpMethod === OtpMethod.SMART_OTP) {
      // Lấy smartOtpPassword từ request body (nếu có)
      smartOtpPassword = req.body.smartOtpPassword;
      // Không bắt buộc smartOtpPassword, cho phép dùng Email OTP để verify
      // (user có thể tạm thời dùng Email OTP để thay đổi setting)
    }

    // Verify OTP trước khi tiếp tục
    const otpVerifyResult = await OtpService.verifyOtpBeforeAction(
      currentUser.email,
      otp,
      otpPurpose,
      smartOtpPassword
    );

    if (!otpVerifyResult.ok) {
      return ResponseUtil.error(
        res,
        otpVerifyResult.message || "OTP không hợp lệ",
        otpVerifyResult.status || 400
      );
    }
  }

  const updateData: Record<string, unknown> = {};
  if (typeof name === "string") updateData.name = name;
  if (typeof fullName === "string") updateData.fullName = fullName;
  if (typeof phone === "string") updateData.phone = phone;
  if (typeof avatar === "string") updateData.avatar = avatar;
  if (typeof twoFactorAuth === "boolean") updateData.twoFactorAuth = twoFactorAuth;
  if (typeof isFirstLogin === "boolean") updateData.isFirstLogin = isFirstLogin;
  if (typeof twoFactorAuthSecret === "string") {
    updateData.twoFactorAuthSecret = twoFactorAuthSecret;
  }
  if (typeof smartOtpSecret === "string") {
    // Hash SmartOTP secret trước khi lưu
    const salt = await bcryptjs.genSalt(10);
    updateData.smartOtpSecret = await bcryptjs.hash(smartOtpSecret, salt);
  }

  if (typeof otpMethod !== "undefined") {
    if (!Object.values(OtpMethod).includes(otpMethod)) {
      return ResponseUtil.badRequest(res, "Phương thức OTP không hợp lệ");
    }
    updateData.otpMethod = otpMethod;
  }

  try {
    const updated = await UserModel.findByIdAndUpdate(
      currentUser._id,
      updateData,
      {
        new: true,
      }
    );
    if (!updated) return ResponseUtil.badRequest(res, "User không tồn tại");
    return ResponseUtil.success(res, updated, "Cập nhật hồ sơ thành công");
  } catch (e) {
    return ResponseUtil.error(res, (e as Error).message, 400);
  }
};
