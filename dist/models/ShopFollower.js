"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopFollowerSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.shopFollowerSchema = new mongoose_1.default.Schema({
    shopId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
    },
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
// Prevent duplicate follow per user per shop
exports.shopFollowerSchema.index({ shopId: 1, userId: 1 }, { unique: true });
const ShopFollowerModel = mongoose_1.default.model("ShopFollower", exports.shopFollowerSchema);
exports.default = ShopFollowerModel;
