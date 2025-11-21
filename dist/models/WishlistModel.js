"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.wishlistSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
        index: true,
    },
    items: [
        {
            productId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
                ref: "Product",
                required: true,
            },
            addedAt: {
                type: Date,
                default: Date.now,
            },
        },
    ],
}, { timestamps: true });
// Compound index to prevent duplicate products in wishlist
exports.wishlistSchema.index({ userId: 1, "items.productId": 1 }, { unique: true });
const WishlistModel = mongoose_1.default.model("Wishlist", exports.wishlistSchema);
exports.default = WishlistModel;
