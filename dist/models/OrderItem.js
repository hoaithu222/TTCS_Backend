"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderItemSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.orderItemSchema = new mongoose_1.default.Schema({
    orderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Order",
        required: false, // Will be set after order creation
    },
    productId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    variantId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "ProductVariant",
        required: false, // Not all products have variants
    },
    quantity: {
        type: Number,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    totalPrice: {
        type: Number,
        required: true,
    },
    discount: {
        type: Number,
        required: true,
    },
    tax: {
        type: Number,
        required: true,
    },
    isReviewed: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
const OrderItemModel = mongoose_1.default.model("OrderItem", exports.orderItemSchema);
exports.default = OrderItemModel;
