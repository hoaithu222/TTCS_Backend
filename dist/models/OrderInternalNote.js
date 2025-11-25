"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderInternalNoteSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.orderInternalNoteSchema = new mongoose_1.default.Schema({
    orderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
        index: true,
    },
    shopId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Shop",
        required: true,
        index: true,
    },
    note: {
        type: String,
        required: true,
    },
    createdBy: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
}, { timestamps: true });
exports.orderInternalNoteSchema.index({ orderId: 1, createdAt: -1 });
const OrderInternalNoteModel = mongoose_1.default.model("OrderInternalNote", exports.orderInternalNoteSchema);
exports.default = OrderInternalNoteModel;
