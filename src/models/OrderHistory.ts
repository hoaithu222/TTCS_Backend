import mongoose from "mongoose";
import { OrderStatus } from "./OrderModel";

export const orderHistorySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const OrderHistoryModel = mongoose.model("OrderHistory", orderHistorySchema);
export default OrderHistoryModel;
