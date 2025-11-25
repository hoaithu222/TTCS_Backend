import mongoose from "mongoose";

export const orderItemSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: false, // Will be set after order creation
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProductVariant",
      required: false, // Not all products have variants
    },
    quantity: {
      type: Number,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    discount: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const OrderItemModel = mongoose.model("OrderItem", orderItemSchema);
export default OrderItemModel;
