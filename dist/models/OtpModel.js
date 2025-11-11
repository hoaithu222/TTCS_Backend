"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const otpSchema = new mongoose_1.default.Schema({
    identifier: { type: String, required: true }, // email or phone
    channel: { type: String, enum: ["email", "phone"], required: true },
    purpose: { type: String, default: "generic" },
    code: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 5 },
    used: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
});
otpSchema.index({ identifier: 1, purpose: 1, used: 1, expiresAt: 1 });
const OtpModel = mongoose_1.default.model("Otp", otpSchema);
exports.default = OtpModel;
