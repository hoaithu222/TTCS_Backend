import mongoose from "mongoose";

export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
  REFUNDED = "refunded",
}

export enum PaymentMethod {
  COD = "cod",
  BANK_TRANSFER = "bank_transfer",
  CREDIT_CARD = "credit_card",
  PAYPAL = "paypal",
  VNPAY = "vnpay",
  MOMO = "momo",
  ZALOPAY = "zalopay",
  WALLET = "wallet", // Thanh toán bằng ví
  TEST = "test", // Test payment method for development
}

export const paymentSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: "VND",
    },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      required: true,
      default: PaymentStatus.PENDING,
    },
    transactionId: {
      type: String,
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    paidAt: {
      type: Date,
    },
    returnUrl: {
      type: String,
    },
    cancelUrl: {
      type: String,
    },
    qrCode: {
      type: String,
    },
    instructions: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes for better query performance
paymentSchema.index({ orderId: 1 });
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });

const PaymentModel = mongoose.model("Payment", paymentSchema);
export default PaymentModel;

