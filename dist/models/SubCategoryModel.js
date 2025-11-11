"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subCategorySchema = exports.SubCategoryModel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ImageModel_1 = require("./ImageModel");
const subCategorySchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    image: ImageModel_1.imageSubSchema,
    image_Background: ImageModel_1.imageSubSchema,
    image_Icon: ImageModel_1.imageSubSchema,
    isActive: {
        type: Boolean,
        default: true,
    },
    order_display: {
        type: Number,
        default: 0,
    },
    categoryId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
        index: true,
    },
}, { timestamps: true });
exports.subCategorySchema = subCategorySchema;
exports.SubCategoryModel = mongoose_1.default.model("SubCategory", subCategorySchema);
exports.default = exports.SubCategoryModel;
