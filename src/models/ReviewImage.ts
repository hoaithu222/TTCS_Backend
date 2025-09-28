import mongoose from "mongoose";

export const reviewImageSchema = new mongoose.Schema(
  {
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      required: true,
    },
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
      required: true,
    },
  },
  { timestamps: true }
);

const ReviewImageModel = mongoose.model("ReviewImage", reviewImageSchema);
export default ReviewImageModel;
