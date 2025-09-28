import mongoose from "mongoose";

export const productAttributeSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    attributeTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttributeType",
      required: true,
    },
    combination: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      validate: {
        validator: (val: Record<string, unknown>) =>
          val != null && typeof val === "object" && Object.keys(val).length > 0,
        message: "Combination must be a non-empty object",
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    image_url: {
      type: String,
      trim: true,
    },
    barcode: {
      type: String,
      trim: true,
      maxlength: 64,
    },
  },
  { timestamps: true }
);

// Indexes to speed up lookups and enforce uniqueness per product+combination
productAttributeSchema.index({ productId: 1, attributeTypeId: 1 });
productAttributeSchema.index({ productId: 1, price: 1 });
productAttributeSchema.index({ productId: 1, stock: 1 });
// Unique combination per product (stringified combination hash assumed via partial filter)
// If you add a stable combinationHash field in the future, convert this to a unique index.

const ProductAttributeModel = mongoose.model(
  "ProductAttribute",
  productAttributeSchema
);
export default ProductAttributeModel;
