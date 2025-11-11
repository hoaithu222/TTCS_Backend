"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attributeValueSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
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
}, { timestamps: true });
const AttributeValueModel = mongoose_1.default.model("AttributeValue", exports.attributeValueSchema);
exports.default = AttributeValueModel;
