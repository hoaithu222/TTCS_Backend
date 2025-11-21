import mongoose from "mongoose";

export const wishlistSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

// Compound index to prevent duplicate products in wishlist
wishlistSchema.index({ userId: 1, "items.productId": 1 }, { unique: true });

const WishlistModel = mongoose.model("Wishlist", wishlistSchema);
export default WishlistModel;

