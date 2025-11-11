"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.shopSchema = exports.ShopStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Trạng thái của shop chờ duyệt, đang hoạt động, bị khóa
var ShopStatus;
(function (ShopStatus) {
    ShopStatus["PENDING"] = "pending";
    ShopStatus["ACTIVE"] = "active";
    ShopStatus["BLOCKED"] = "blocked";
})(ShopStatus || (exports.ShopStatus = ShopStatus = {}));
exports.shopSchema = new mongoose_1.default.Schema({
    userId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    // name
    name: {
        type: String,
        required: true,
    },
    // description
    description: {
        type: String,
        required: true,
    },
    // logo liên với ảnh
    logo: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Image",
        required: true,
    },
    // banner liên với ảnh
    banner: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Image",
        required: true,
    },
    rating: {
        type: Number,
        default: 0,
    },
    followCount: {
        type: Number,
        default: 0,
    },
    productCount: {
        type: Number,
        default: 0,
    },
    reviewCount: {
        type: Number,
        default: 0,
    },
    totalRevenue: {
        type: Number,
        default: 0,
    },
    // isActive
    status: {
        type: Boolean,
        default: ShopStatus.PENDING,
        enum: Object.values(ShopStatus),
    },
    //   Liên kết với product
    products: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: "Product",
    },
});
const ShopModel = mongoose_1.default.model("Shop", exports.shopSchema);
exports.default = ShopModel;
