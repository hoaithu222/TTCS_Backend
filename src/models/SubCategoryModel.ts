import mongoose from "mongoose";
import { imageSubSchema } from "./ImageModel";

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    image: imageSubSchema,
    image_Background: imageSubSchema,
    image_Icon: imageSubSchema,
    isActive: {
      type: Boolean,
      default: true,
    },
    order_display: {
      type: Number,
      default: 0,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

export const SubCategoryModel = mongoose.model(
  "SubCategory",
  subCategorySchema
);

export { subCategorySchema };

export default SubCategoryModel;
