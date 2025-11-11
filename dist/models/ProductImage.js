"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productImageSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.productImageSchema = new mongoose_1.default.Schema({
    productId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    imageId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Image",
        required: true,
    },
    displayOrder: {
        type: Number,
        required: true,
    },
    is_thumbnail: {
        type: Boolean,
        required: true,
    },
}, { timestamps: true });
const ProductImageModel = mongoose_1.default.model("ProductImage", exports.productImageSchema);
exports.default = ProductImageModel;
