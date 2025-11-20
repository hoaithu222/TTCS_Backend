"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attributeTypeSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const slugify_1 = require("../shared/utils/slugify");
exports.attributeTypeSchema = new mongoose_1.default.Schema({
    name: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
    },
    categoryId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Category",
    },
    inputType: {
        type: String,
        enum: ["text", "number", "select", "multiselect", "boolean", "date", "color"],
        default: "select",
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    is_multiple: {
        type: Boolean,
        default: false,
    },
    isVariantAttribute: {
        type: Boolean,
        default: true,
    },
    displayOrder: {
        type: Number,
        default: 0,
    },
    helperText: {
        type: String,
    },
}, { timestamps: true });
exports.attributeTypeSchema.index({ categoryId: 1, code: 1 }, { unique: true, sparse: true });
exports.attributeTypeSchema.pre("validate", function (next) {
    if (this.name && !this.code) {
        this.code = (0, slugify_1.slugify)(this.name, { separator: "_" });
    }
    if (this.code) {
        this.code = (0, slugify_1.slugify)(this.code, { separator: "_" });
        if (!this.name) {
            this.name = (0, slugify_1.humanizeCode)(this.code);
        }
    }
    next();
});
const AttributeTypeModel = mongoose_1.default.model("AttributeType", exports.attributeTypeSchema);
exports.default = AttributeTypeModel;
