"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productAttributeSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.productAttributeSchema = new mongoose_1.default.Schema({
    productId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Product",
        required: true,
    },
    attributeTypeId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "AttributeType",
        required: true,
    },
    combination: {
        type: mongoose_1.default.Schema.Types.Mixed,
        required: true,
        validate: {
            validator: (val) => val != null && typeof val === "object" && Object.keys(val).length > 0,
            message: "Combination must be a non-empty object",
        },
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    image_url: {
        type: String,
        trim: true,
    },
    barcode: {
        type: String,
        trim: true,
        maxlength: 64,
    },
}, { timestamps: true });
// Indexes to speed up lookups and enforce uniqueness per product+combination
exports.productAttributeSchema.index({ productId: 1, attributeTypeId: 1 });
exports.productAttributeSchema.index({ productId: 1, price: 1 });
exports.productAttributeSchema.index({ productId: 1, stock: 1 });
// Unique combination per product (stringified combination hash assumed via partial filter)
// If you add a stable combinationHash field in the future, convert this to a unique index.
const ProductAttributeModel = mongoose_1.default.model("ProductAttribute", exports.productAttributeSchema);
exports.default = ProductAttributeModel;
