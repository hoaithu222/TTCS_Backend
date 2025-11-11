"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderHistorySchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const OrderModel_1 = require("./OrderModel");
exports.orderHistorySchema = new mongoose_1.default.Schema({
    orderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "Order",
        required: true,
    },
    status: {
        type: String,
        enum: Object.values(OrderModel_1.OrderStatus),
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
}, { timestamps: true });
const OrderHistoryModel = mongoose_1.default.model("OrderHistory", exports.orderHistorySchema);
exports.default = OrderHistoryModel;
