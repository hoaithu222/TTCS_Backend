"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.reviewSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    orderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    orderItemId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "OrderItem",
        required: true,
    },
    shopId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
    },
    productId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    rating: {
        type: Number,
        required: true,
    },
    comment: {
        type: String,
    },
    images: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: "Image",
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    helpfulCount: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });
const ReviewModel = mongoose_1.default.model("Review", exports.reviewSchema);
exports.default = ReviewModel;
