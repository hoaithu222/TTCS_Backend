import mongoose from "mongoose";

export const cartItemSchema = new mongoose.Schema({
  cartId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Cart",
    required: true,
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ProductVariant",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  priceAtTime: {
    type: Number,
    required: true,
  },
  shopId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop",
    required: true,
  },
});

const CartItemModel = mongoose.model("CartItem", cartItemSchema);
export default CartItemModel;
