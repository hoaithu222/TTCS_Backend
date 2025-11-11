"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartItemSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.cartItemSchema = new mongoose_1.default.Schema({
    cartId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Cart",
        required: true,
    },
    productId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    variantId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "ProductVariant",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
    },
    priceAtTime: {
        type: Number,
        required: true,
    },
    shopId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
    },
});
const CartItemModel = mongoose_1.default.model("CartItem", exports.cartItemSchema);
exports.default = CartItemModel;
