import mongoose from "mongoose";

export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingFee: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(OrderStatus),
      required: true,
      default: OrderStatus.PENDING,
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "UserAddress",
      required: true,
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    trackingNumber: {
      type: String,
    },
    courierName: {
      type: String,
    },
    notes: {
      type: String,
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopVoucher",
    },
    isPay: {
      type: Boolean,
      required: true,
    },
    discountAmount: {
      type: Number,
      required: true,
    },
    cancellationReason: {
      type: String,
    },
    isReview: {
      type: Boolean,
      required: true,
      default: false,
    },
    orderItems: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "OrderItem",
      required: true,
    },
    orderHistory: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "OrderHistory",
    },
    shopVoucher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ShopVoucher",
    },
    review: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
    },
  },
  { timestamps: true }
);

// Helpful indexes for analytics
orderSchema.index({ shopId: 1, status: 1, createdAt: -1 });
orderSchema.index({ userId: 1, createdAt: -1 });

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;
