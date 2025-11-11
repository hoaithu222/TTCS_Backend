"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageSubSchema = exports.imageSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// Standalone Image schema for Image collection
exports.imageSchema = new mongoose_1.default.Schema({
    url: {
        type: String,
        required: true,
    },
    publicId: {
        type: String,
        required: true,
    },
}, { timestamps: true });
// Subdocument schema for embedding inside other models (no separate _id)
exports.imageSubSchema = new mongoose_1.default.Schema({
    url: {
        type: String,
        required: true,
    },
    publicId: {
        type: String,
        required: true,
    },
}, { timestamps: true, _id: false });
const ImageModel = mongoose_1.default.model("Image", exports.imageSchema);
exports.default = ImageModel;
