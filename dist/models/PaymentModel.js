"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentSchema = exports.PaymentMethod = exports.PaymentStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "pending";
    PaymentStatus["PROCESSING"] = "processing";
    PaymentStatus["COMPLETED"] = "completed";
    PaymentStatus["FAILED"] = "failed";
    PaymentStatus["CANCELLED"] = "cancelled";
    PaymentStatus["REFUNDED"] = "refunded";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["COD"] = "cod";
    PaymentMethod["BANK_TRANSFER"] = "bank_transfer";
    PaymentMethod["CREDIT_CARD"] = "credit_card";
    PaymentMethod["PAYPAL"] = "paypal";
    PaymentMethod["VNPAY"] = "vnpay";
    PaymentMethod["MOMO"] = "momo";
    PaymentMethod["ZALOPAY"] = "zalopay";
    PaymentMethod["TEST"] = "test";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
exports.paymentSchema = new mongoose_1.default.Schema({
    orderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.default.Schema.Types.Mixed,
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
}, { timestamps: true });
// Indexes for better query performance
exports.paymentSchema.index({ orderId: 1 });
exports.paymentSchema.index({ userId: 1, createdAt: -1 });
exports.paymentSchema.index({ status: 1, createdAt: -1 });
exports.paymentSchema.index({ transactionId: 1 });
const PaymentModel = mongoose_1.default.model("Payment", exports.paymentSchema);
exports.default = PaymentModel;
