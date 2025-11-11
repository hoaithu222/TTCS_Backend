"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryAttributeTypeSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.categoryAttributeTypeSchema = new mongoose_1.default.Schema({
    categoryId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Category",
        required: true,
    },
    attributeTypeId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "AttributeType",
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
});
const CategoryAttributeTypeModel = mongoose_1.default.model("CategoryAttributeType", exports.categoryAttributeTypeSchema);
exports.default = CategoryAttributeTypeModel;
