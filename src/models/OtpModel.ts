import mongoose from "mongoose";

export type OtpChannel = "email" | "phone";

const otpSchema = new mongoose.Schema({
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

const OtpModel = mongoose.model("Otp", otpSchema);

export default OtpModel;
