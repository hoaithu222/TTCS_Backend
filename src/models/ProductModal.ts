import mongoose from "mongoose";

export const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    images: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Image",
      required: true,
      validate: {
        validator: (arr: unknown) => Array.isArray(arr) && arr.length > 0,
        message: "At least one image is required",
      },
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubCategory",
      required: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
      default: 0,
    },
    reviewCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    salesCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    warrantyInfo: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    weight: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    dimensions: {
      type: String,
      required: false,
      trim: true,
      default: "",
    },
    metaKeywords: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      default: "",
    },
    viewCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
    },
    // Product variants (for different colors, sizes, etc.)
    variants: {
      type: [
        {
          attributes: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
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
          image: {
            type: String,
            trim: true,
          },
          sku: {
            type: String,
            trim: true,
            maxlength: 64,
          },
        },
      ],
      default: [],
    },
    // Product attributes (non-variant attributes)
    attributes: {
      type: [
        {
          attribute_type_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AttributeType",
          },
          attribute_value_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AttributeValue",
          },
          value: String,
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Useful indexes for performance and searchability
productSchema.index({ shopId: 1, isActive: 1 });
productSchema.index({ categoryId: 1, subCategoryId: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ rating: -1 });
productSchema.index({ viewCount: -1 });
productSchema.index(
  { name: "text", description: "text", metaKeywords: "text" },
  {
    weights: { name: 5, metaKeywords: 3, description: 1 },
    name: "ProductTextIndex",
  }
);

const ProductModel = mongoose.model("Product", productSchema);

export default ProductModel;
