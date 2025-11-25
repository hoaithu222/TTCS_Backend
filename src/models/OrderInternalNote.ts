import mongoose from "mongoose";

export const orderInternalNoteSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
      index: true,
    },
    note: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

orderInternalNoteSchema.index({ orderId: 1, createdAt: -1 });

const OrderInternalNoteModel = mongoose.model("OrderInternalNote", orderInternalNoteSchema);
export default OrderInternalNoteModel;

