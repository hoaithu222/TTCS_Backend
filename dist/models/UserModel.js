"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserStatus = exports.OtpMethod = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var OtpMethod;
(function (OtpMethod) {
    OtpMethod["SMART_OTP"] = "smart_otp";
    OtpMethod["SMS"] = "sms";
    OtpMethod["EMAIL"] = "email";
})(OtpMethod || (exports.OtpMethod = OtpMethod = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "active";
    UserStatus["INACTIVE"] = "inactive";
    UserStatus["SUSPENDED"] = "suspended";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
const userSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // nên thêm unique cho email
    },
    password: {
        type: String,
        required: true,
    },
    fullName: {
        type: String,
    },
    phone: {
        type: String,
    },
    avatar: {
        type: String,
    },
    address: {
        type: String,
    },
    status: {
        type: String,
        enum: Object.values(UserStatus), // 👈 bắt buộc phải là 1 trong 2 giá trị enum
        required: true,
        default: UserStatus.INACTIVE,
    },
    // xác thực 2FA
    twoFactorAuth: {
        type: Boolean,
        default: false,
    },
    twoFactorAuthSecret: {
        type: String,
    },
    // verify account
    verifyToken: {
        type: String,
    },
    verifyTokenExpiresAt: {
        type: Date,
    },
    // forgot password
    forgotPasswordToken: {
        type: String,
    },
    forgotPasswordTokenExpiresAt: {
        type: Date,
    },
    // role
    role: {
        type: String,
        required: true,
        default: "user",
    },
    // token
    accessToken: {
        type: String,
    },
    refreshToken: {
        type: String,
    },
    // preferred otp delivery method
    otpMethod: {
        type: String,
        enum: Object.values(OtpMethod),
        default: OtpMethod.EMAIL,
        required: true,
    },
    // mã smart otp
    smartOtpSecret: {
        type: String,
    },
    // login lần đầu tiên
    isFirstLogin: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true }); // 👈 tự động thêm createdAt & updatedAt
const UserModel = mongoose_1.default.model("User", userSchema);
exports.default = UserModel;
