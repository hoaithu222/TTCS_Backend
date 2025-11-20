import mongoose from "mongoose";

export enum WalletTransactionType {
  DEPOSIT = "deposit", // Nạp tiền
  WITHDRAW = "withdraw", // Rút tiền
  PAYMENT = "payment", // Thanh toán (user trả tiền)
  REFUND = "refund", // Hoàn tiền
  TRANSFER = "transfer", // Chuyển tiền
  REVENUE = "revenue", // Doanh thu (shop nhận tiền từ đơn hàng)
}

export enum WalletTransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

// Wallet Transaction Schema
export const walletTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional - for shop transactions
      index: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: false, // Optional - for user transactions
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(WalletTransactionType),
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(WalletTransactionStatus),
      required: true,
      default: WalletTransactionStatus.PENDING,
    },
    description: {
      type: String,
    },
    // For deposit - bank transfer info
    bankAccount: {
      bankName: String,
      accountNumber: String,
      accountHolder: String,
    },
    qrCode: {
      type: String, // QR code URL for deposit
    },
    transactionId: {
      type: String, // External transaction ID from bank
      index: true,
    },
    // For payment/revenue
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
walletTransactionSchema.index({ userId: 1, createdAt: -1 });
walletTransactionSchema.index({ shopId: 1, createdAt: -1 });
walletTransactionSchema.index({ status: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1, createdAt: -1 });
walletTransactionSchema.index({ orderId: 1 });

const WalletTransactionModel = mongoose.model(
  "WalletTransaction",
  walletTransactionSchema
);

// Wallet Balance Schema (denormalized for quick access)
export const walletBalanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional - for shop wallets
      unique: true,
      sparse: true, // Allow multiple nulls
      index: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: false, // Optional - for user wallets
      unique: true,
      sparse: true, // Allow multiple nulls
      index: true,
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    lastTransactionAt: {
      type: Date,
    },
    // Bank information for withdrawal
    bankInfo: {
      bankName: {
        type: String,
      },
      accountNumber: {
        type: String,
      },
      accountHolder: {
        type: String,
      },
    },
    // Wallet verification status
    isVerified: {
      type: Boolean,
      default: false, // true if bank info is registered
    },
    verifiedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Compound index to ensure one wallet per user or shop
walletBalanceSchema.index(
  { userId: 1, shopId: 1 },
  { unique: true, sparse: true }
);

const WalletBalanceModel = mongoose.model("WalletBalance", walletBalanceSchema);

export { WalletTransactionModel, WalletBalanceModel };
export default WalletTransactionModel;

