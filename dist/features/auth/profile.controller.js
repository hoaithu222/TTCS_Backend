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
exports.updateProfileController = exports.changePasswordController = exports.getProfileController = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const response_util_1 = require("../../shared/utils/response.util");
const UserModel_1 = __importStar(require("../../models/UserModel"));
const shop_service_1 = __importDefault(require("../shop/shop.service"));
const otp_service_1 = __importDefault(require("../otp/otp.service"));
const getProfileController = async (req, res) => {
    const currentUser = req.currentUser;
    if (!currentUser)
        return response_util_1.ResponseUtil.unauthorized(res);
    // Convert Mongoose document to plain object
    const userData = currentUser.toObject ? currentUser.toObject() : currentUser;
    // Lấy shop status của user
    const shopStatusResult = await shop_service_1.default.getShopStatusByUserId(currentUser._id || currentUser.id);
    if (shopStatusResult.ok) {
        return response_util_1.ResponseUtil.success(res, {
            ...userData,
            shopStatus: shopStatusResult.shopStatus,
            shop: shopStatusResult.shop,
        });
    }
    return response_util_1.ResponseUtil.success(res, {
        ...userData,
        shopStatus: "not_registered",
        shop: null,
    });
};
exports.getProfileController = getProfileController;
const changePasswordController = async (req, res) => {
    const currentUser = req.currentUser;
    if (!currentUser)
        return response_util_1.ResponseUtil.unauthorized(res);
    const { currentPassword, newPassword, confirmPassword, otp, otpPurpose = "change_password", } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
        return response_util_1.ResponseUtil.badRequest(res, "Thiếu thông tin bắt buộc");
    }
    if (newPassword !== confirmPassword) {
        return response_util_1.ResponseUtil.badRequest(res, "Mật khẩu xác nhận không khớp");
    }
    if (newPassword.length < 6) {
        return response_util_1.ResponseUtil.badRequest(res, "Mật khẩu mới phải có ít nhất 6 ký tự");
    }
    // Lấy user từ database
    const user = await UserModel_1.default.findById(currentUser._id);
    if (!user) {
        return response_util_1.ResponseUtil.badRequest(res, "User không tồn tại");
    }
    // Verify current password
    const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
        return response_util_1.ResponseUtil.badRequest(res, "Mật khẩu hiện tại không đúng");
    }
    // Verify OTP - bắt buộc để đổi mật khẩu
    if (!otp || !otpPurpose) {
        return response_util_1.ResponseUtil.badRequest(res, "Cần mã OTP để xác minh trước khi đổi mật khẩu");
    }
    let smartOtpPassword;
    if (user.otpMethod === UserModel_1.OtpMethod.SMART_OTP) {
        smartOtpPassword = req.body.smartOtpPassword;
        // Không bắt buộc smartOtpPassword, cho phép dùng Email OTP để verify
    }
    const otpVerifyResult = await otp_service_1.default.verifyOtpBeforeAction(currentUser.email, otp, otpPurpose, smartOtpPassword);
    if (!otpVerifyResult.ok) {
        return response_util_1.ResponseUtil.error(res, otpVerifyResult.message || "OTP không hợp lệ", otpVerifyResult.status || 400);
    }
    // Hash new password
    const salt = await bcryptjs_1.default.genSalt(10);
    const hashedPassword = await bcryptjs_1.default.hash(newPassword, salt);
    try {
        user.password = hashedPassword;
        await user.save();
        return response_util_1.ResponseUtil.success(res, { message: "Đổi mật khẩu thành công" });
    }
    catch (e) {
        return response_util_1.ResponseUtil.error(res, e.message, 400);
    }
};
exports.changePasswordController = changePasswordController;
const updateProfileController = async (req, res) => {
    const currentUser = req.currentUser;
    if (!currentUser)
        return response_util_1.ResponseUtil.unauthorized(res);
    const { name, fullName, phone, avatar, otpMethod, twoFactorAuth, isFirstLogin, twoFactorAuthSecret, smartOtpSecret, otp, // OTP để verify trước khi thay đổi setting quan trọng
    otpPurpose, // Purpose của OTP (verify_setting_change, setup_smart_otp, change_smart_otp_password)
     } = req.body;
    // Kiểm tra xem có thay đổi setting quan trọng không
    const isChangingImportantSetting = typeof twoFactorAuth === "boolean" ||
        typeof otpMethod !== "undefined" ||
        typeof smartOtpSecret === "string";
    // Nếu thay đổi setting quan trọng, cần verify OTP
    if (isChangingImportantSetting) {
        if (!otp || !otpPurpose) {
            return response_util_1.ResponseUtil.badRequest(res, "Cần mã OTP để xác minh trước khi thay đổi cài đặt bảo mật");
        }
        // Lấy thông tin user để check loại OTP method
        const user = await UserModel_1.default.findById(currentUser._id);
        if (!user) {
            return response_util_1.ResponseUtil.badRequest(res, "User không tồn tại");
        }
        // Nếu user đang dùng Smart OTP, cần password Smart OTP để verify
        // Nhưng cho phép fallback về Email OTP nếu không có smartOtpPassword
        let smartOtpPassword;
        if (user.otpMethod === UserModel_1.OtpMethod.SMART_OTP) {
            // Lấy smartOtpPassword từ request body (nếu có)
            smartOtpPassword = req.body.smartOtpPassword;
            // Không bắt buộc smartOtpPassword, cho phép dùng Email OTP để verify
            // (user có thể tạm thời dùng Email OTP để thay đổi setting)
        }
        // Verify OTP trước khi tiếp tục
        const otpVerifyResult = await otp_service_1.default.verifyOtpBeforeAction(currentUser.email, otp, otpPurpose, smartOtpPassword);
        if (!otpVerifyResult.ok) {
            return response_util_1.ResponseUtil.error(res, otpVerifyResult.message || "OTP không hợp lệ", otpVerifyResult.status || 400);
        }
    }
    const updateData = {};
    if (typeof name === "string")
        updateData.name = name;
    if (typeof fullName === "string")
        updateData.fullName = fullName;
    if (typeof phone === "string")
        updateData.phone = phone;
    if (typeof avatar === "string")
        updateData.avatar = avatar;
    if (typeof twoFactorAuth === "boolean")
        updateData.twoFactorAuth = twoFactorAuth;
    if (typeof isFirstLogin === "boolean")
        updateData.isFirstLogin = isFirstLogin;
    if (typeof twoFactorAuthSecret === "string") {
        updateData.twoFactorAuthSecret = twoFactorAuthSecret;
    }
    if (typeof smartOtpSecret === "string") {
        // Hash SmartOTP secret trước khi lưu
        const salt = await bcryptjs_1.default.genSalt(10);
        updateData.smartOtpSecret = await bcryptjs_1.default.hash(smartOtpSecret, salt);
    }
    if (typeof otpMethod !== "undefined") {
        if (!Object.values(UserModel_1.OtpMethod).includes(otpMethod)) {
            return response_util_1.ResponseUtil.badRequest(res, "Phương thức OTP không hợp lệ");
        }
        updateData.otpMethod = otpMethod;
    }
    try {
        const updated = await UserModel_1.default.findByIdAndUpdate(currentUser._id, updateData, {
            new: true,
        });
        if (!updated)
            return response_util_1.ResponseUtil.badRequest(res, "User không tồn tại");
        return response_util_1.ResponseUtil.success(res, updated, "Cập nhật hồ sơ thành công");
    }
    catch (e) {
        return response_util_1.ResponseUtil.error(res, e.message, 400);
    }
};
exports.updateProfileController = updateProfileController;
