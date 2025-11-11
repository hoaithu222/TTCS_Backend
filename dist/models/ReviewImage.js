"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewImageSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.reviewImageSchema = new mongoose_1.default.Schema({
    reviewId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Review",
        required: true,
    },
    imageId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Image",
        required: true,
    },
}, { timestamps: true });
const ReviewImageModel = mongoose_1.default.model("ReviewImage", exports.reviewImageSchema);
exports.default = ReviewImageModel;
