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
    required: false,
    default: null,
  },
  variantSnapshot: {
    type: {
      attributes: {
        type: mongoose.Schema.Types.Mixed,
      },
      sku: {
        type: String,
        trim: true,
      },
      price: {
        type: Number,
      },
      image: {
        type: String,
        trim: true,
      },
    },
    default: undefined,
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
