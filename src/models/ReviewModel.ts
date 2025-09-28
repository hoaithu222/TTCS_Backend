import mongoose from "mongoose";

export const reviewSchema = new mongoose.Schema(
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
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
    },
    images: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Image",
    },
  },
  { timestamps: true }
);

const ReviewModel = mongoose.model("Review", reviewSchema);
export default ReviewModel;
