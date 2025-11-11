"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const ImageModel_1 = require("./ImageModel");
const SubCategoryModel_1 = require("./SubCategoryModel");
const categorySchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    // danh sách các ảnh
    image: [ImageModel_1.imageSubSchema],
    image_Background: ImageModel_1.imageSubSchema,
    image_Icon: ImageModel_1.imageSubSchema,
    isActive: {
        type: Boolean,
        default: true,
    },
    // thứ tự hiển thị
    order_display: {
        type: Number,
        default: 0,
    },
    subCategories: [SubCategoryModel_1.subCategorySchema],
}, { timestamps: true });
const CategoryModel = mongoose_1.default.model("Category", categorySchema);
exports.default = CategoryModel;
