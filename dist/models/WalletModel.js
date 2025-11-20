"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletBalanceModel = exports.WalletTransactionModel = exports.walletBalanceSchema = exports.walletTransactionSchema = exports.WalletTransactionStatus = exports.WalletTransactionType = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var WalletTransactionType;
(function (WalletTransactionType) {
    WalletTransactionType["DEPOSIT"] = "deposit";
    WalletTransactionType["WITHDRAW"] = "withdraw";
    WalletTransactionType["PAYMENT"] = "payment";
    WalletTransactionType["REFUND"] = "refund";
    WalletTransactionType["TRANSFER"] = "transfer";
    WalletTransactionType["REVENUE"] = "revenue";
})(WalletTransactionType || (exports.WalletTransactionType = WalletTransactionType = {}));
var WalletTransactionStatus;
(function (WalletTransactionStatus) {
    WalletTransactionStatus["PENDING"] = "pending";
    WalletTransactionStatus["COMPLETED"] = "completed";
    WalletTransactionStatus["FAILED"] = "failed";
    WalletTransactionStatus["CANCELLED"] = "cancelled";
})(WalletTransactionStatus || (exports.WalletTransactionStatus = WalletTransactionStatus = {}));
// Wallet Transaction Schema
exports.walletTransactionSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: false, // Optional - for shop transactions
        index: true,
    },
    shopId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Order",
    },
    paymentId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Payment",
    },
    // Metadata
    metadata: {
        type: mongoose_1.default.Schema.Types.Mixed,
    },
    completedAt: {
        type: Date,
    },
}, { timestamps: true });
// Indexes
exports.walletTransactionSchema.index({ userId: 1, createdAt: -1 });
exports.walletTransactionSchema.index({ shopId: 1, createdAt: -1 });
exports.walletTransactionSchema.index({ status: 1, createdAt: -1 });
exports.walletTransactionSchema.index({ type: 1, createdAt: -1 });
exports.walletTransactionSchema.index({ orderId: 1 });
const WalletTransactionModel = mongoose_1.default.model("WalletTransaction", exports.walletTransactionSchema);
exports.WalletTransactionModel = WalletTransactionModel;
// Wallet Balance Schema (denormalized for quick access)
exports.walletBalanceSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: false, // Optional - for shop wallets
        unique: true,
        sparse: true, // Allow multiple nulls
        index: true,
    },
    shopId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
}, { timestamps: true });
// Compound index to ensure one wallet per user or shop
exports.walletBalanceSchema.index({ userId: 1, shopId: 1 }, { unique: true, sparse: true });
const WalletBalanceModel = mongoose_1.default.model("WalletBalance", exports.walletBalanceSchema);
exports.WalletBalanceModel = WalletBalanceModel;
exports.default = WalletTransactionModel;
