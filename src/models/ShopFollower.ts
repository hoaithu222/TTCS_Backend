import mongoose from "mongoose";

export const shopFollowerSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate follow per user per shop
shopFollowerSchema.index({ shopId: 1, userId: 1 }, { unique: true });

const ShopFollowerModel = mongoose.model("ShopFollower", shopFollowerSchema);
export default ShopFollowerModel;
