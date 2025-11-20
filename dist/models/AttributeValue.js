"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attributeValueSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const slugify_1 = require("../shared/utils/slugify");
exports.attributeValueSchema = new mongoose_1.default.Schema({
    attributeTypeId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "AttributeType",
        required: true,
    },
    value: {
        type: String,
        required: true,
    },
    label: {
        type: String,
    },
    code: {
        type: String,
        lowercase: true,
        trim: true,
    },
    colorCode: {
        type: String,
    },
    sortOrder: {
        type: Number,
        default: 0,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, { timestamps: true });
exports.attributeValueSchema.index({ attributeTypeId: 1, code: 1 }, { unique: true, sparse: true });
exports.attributeValueSchema.index({ attributeTypeId: 1, value: 1 }, { unique: true, sparse: true });
exports.attributeValueSchema.pre("validate", function (next) {
    if (this.value && !this.label) {
        this.label = this.value;
    }
    if (this.value && !this.code) {
        this.code = (0, slugify_1.slugify)(this.value, { separator: "_" });
    }
    if (this.code) {
        this.code = (0, slugify_1.slugify)(this.code, { separator: "_" });
    }
    next();
});
const AttributeValueModel = mongoose_1.default.model("AttributeValue", exports.attributeValueSchema);
exports.default = AttributeValueModel;
