import mongoose from "mongoose";
import { imageSubSchema } from "./ImageModel";
import { subCategorySchema } from "./SubCategoryModel";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    // danh sách các ảnh
    image: [imageSubSchema],
    image_Background: imageSubSchema,
    image_Icon: imageSubSchema,
    isActive: {
      type: Boolean,
      default: true,
    },
    // thứ tự hiển thị
    order_display: {
      type: Number,
      default: 0,
    },
    subCategories: [subCategorySchema],
  },
  { timestamps: true }
);

const CategoryModel = mongoose.model("Category", categorySchema);

export default CategoryModel;
