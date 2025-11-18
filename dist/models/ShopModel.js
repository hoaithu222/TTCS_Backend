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
    // logo (store image publicId or URL)
    logo: {
        type: String,
        required: true,
    },
    // banner (store image publicId or URL)
    banner: {
        type: String,
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
        type: String,
        default: ShopStatus.PENDING,
        enum: Object.values(ShopStatus),
    },
    //   Liên kết với product
    products: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: "Product",
    },
    // Contact information
    contactEmail: {
        type: String,
        required: true,
    },
    contactPhone: {
        type: String,
        required: true,
    },
    contactName: {
        type: String,
        required: true,
    },
    // Address
    address: {
        provinceCode: { type: Number },
        districtCode: { type: Number },
        wardCode: { type: Number },
    },
    // Business information
    slug: {
        type: String,
        unique: true,
        sparse: true,
    },
    businessType: {
        type: String,
        enum: ["individual", "household", "enterprise"],
        required: true,
    },
    taxId: {
        type: String,
    },
    repId: {
        type: String,
        required: true,
    },
    // Bank information
    bankName: {
        type: String,
        required: true,
    },
    bankAccount: {
        type: String,
        required: true,
    },
    bankHolder: {
        type: String,
        required: true,
    },
    // Documents
    idCardImages: [String],
    businessLicenseImages: [String],
    // Setup information
    shippingPolicy: {
        type: String,
    },
    returnPolicy: {
        type: String,
    },
    openHour: {
        type: String,
    },
    closeHour: {
        type: String,
    },
    workingDays: {
        type: String,
    },
    facebook: {
        type: String,
    },
    zalo: {
        type: String,
    },
    instagram: {
        type: String,
    },
});
const ShopModel = mongoose_1.default.model("Shop", exports.shopSchema);
exports.default = ShopModel;
