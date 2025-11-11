"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attributeTypeSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.attributeTypeSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    categoryId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Category",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    is_multiple: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });
const AttributeTypeModel = mongoose_1.default.model("AttributeType", exports.attributeTypeSchema);
exports.default = AttributeTypeModel;
