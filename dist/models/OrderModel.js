"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderSchema = exports.OrderStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "pending";
    OrderStatus["PROCESSING"] = "processing";
    OrderStatus["SHIPPED"] = "shipped";
    OrderStatus["DELIVERED"] = "delivered";
    OrderStatus["CANCELLED"] = "cancelled";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
exports.orderSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    shopId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    shippingFee: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(OrderStatus),
        required: true,
        default: OrderStatus.PENDING,
    },
    addressId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "UserAddress",
        required: true,
    },
    paymentMethod: {
        type: String,
        required: true,
    },
    trackingNumber: {
        type: String,
    },
    courierName: {
        type: String,
    },
    notes: {
        type: String,
    },
    voucherId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "ShopVoucher",
    },
    isPay: {
        type: Boolean,
        required: true,
    },
    discountAmount: {
        type: Number,
        required: true,
    },
    cancellationReason: {
        type: String,
    },
    isReview: {
        type: Boolean,
        required: true,
        default: false,
    },
    orderItems: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: "OrderItem",
        required: true,
    },
    orderHistory: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: "OrderHistory",
    },
    shopVoucher: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "ShopVoucher",
    },
    review: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Review",
    },
}, { timestamps: true });
// Helpful indexes for analytics
exports.orderSchema.index({ shopId: 1, status: 1, createdAt: -1 });
exports.orderSchema.index({ userId: 1, createdAt: -1 });
const OrderModel = mongoose_1.default.model("Order", exports.orderSchema);
exports.default = OrderModel;
