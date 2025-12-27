"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.productSchema = exports.ProductStatus = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var ProductStatus;
(function (ProductStatus) {
    ProductStatus["PENDING"] = "pending";
    ProductStatus["APPROVED"] = "approved";
    ProductStatus["HIDDEN"] = "hidden";
    ProductStatus["VIOLATED"] = "violated";
})(ProductStatus || (exports.ProductStatus = ProductStatus = {}));
exports.productSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200,
    },
    description: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000,
    },
    images: {
        type: [mongoose_1.default.Schema.Types.ObjectId],
        ref: "Image",
        required: true,
        validate: {
            validator: (arr) => Array.isArray(arr) && arr.length > 0,
            message: "At least one image is required",
        },
    },
    shopId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
    },
    subCategoryId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "SubCategory",
        required: true,
    },
    categoryId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    price: {
        type: Number,
        required: true,
        min: 0,
    },
    discount: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
        default: 0,
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    rating: {
        type: Number,
        required: true,
        min: 0,
        max: 5,
        default: 0,
    },
    reviewCount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    salesCount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    warrantyInfo: {
        type: String,
        required: false,
        trim: true,
        default: "",
    },
    weight: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    dimensions: {
        type: String,
        required: false,
        trim: true,
        default: "",
    },
    metaKeywords: {
        type: String,
        required: false,
        trim: true,
        lowercase: true,
        default: "",
    },
    viewCount: {
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    isActive: {
        type: Boolean,
        required: true,
        default: true,
    },
    status: {
        type: String,
        enum: Object.values(ProductStatus),
        default: ProductStatus.APPROVED,
        required: true,
    },
    violationNote: {
        type: String,
        trim: true,
        default: "",
    },
    reviewedAt: {
        type: Date,
    },
    reviewedBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
    },
    // Product variants (for different colors, sizes, etc.)
    variants: {
        type: [
            {
                attributes: {
                    type: mongoose_1.default.Schema.Types.Mixed,
                    required: true,
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
                image: {
                    type: String,
                    trim: true,
                },
                sku: {
                    type: String,
                    trim: true,
                    maxlength: 64,
                },
            },
        ],
        default: [],
    },
    // Product attributes (non-variant attributes)
    attributes: {
        type: [
            {
                attribute_type_id: {
                    type: mongoose_1.default.Schema.Types.ObjectId,
                    ref: "AttributeType",
                },
                attribute_value_id: {
                    type: mongoose_1.default.Schema.Types.ObjectId,
                    ref: "AttributeValue",
                },
                value: String,
            },
        ],
        default: [],
    },
}, { timestamps: true });
// Useful indexes for performance and searchability
exports.productSchema.index({ shopId: 1, isActive: 1 });
exports.productSchema.index({ shopId: 1, status: 1 });
exports.productSchema.index({ status: 1 });
exports.productSchema.index({ categoryId: 1, subCategoryId: 1, isActive: 1 });
exports.productSchema.index({ price: 1 });
exports.productSchema.index({ salesCount: -1 });
exports.productSchema.index({ rating: -1 });
exports.productSchema.index({ viewCount: -1 });
exports.productSchema.index({ name: "text", description: "text", metaKeywords: "text" }, {
    weights: { name: 5, metaKeywords: 3, description: 1 },
    name: "ProductTextIndex",
});
const ProductModel = mongoose_1.default.model("Product", exports.productSchema);
exports.default = ProductModel;
