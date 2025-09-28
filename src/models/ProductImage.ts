import mongoose from "mongoose";

export const productImageSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    imageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
      required: true,
    },
    displayOrder: {
      type: Number,
      required: true,
    },
    is_thumbnail: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

const ProductImageModel = mongoose.model("ProductImage", productImageSchema);
export default ProductImageModel;
