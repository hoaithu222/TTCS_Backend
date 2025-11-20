import mongoose from "mongoose";
import { slugify, humanizeCode } from "../shared/utils/slugify";

export const attributeTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    inputType: {
      type: String,
      enum: ["text", "number", "select", "multiselect", "boolean", "date", "color"],
      default: "select",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    is_multiple: {
      type: Boolean,
      default: false,
    },
    isVariantAttribute: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
    helperText: {
      type: String,
    },
  },
  { timestamps: true }
);

attributeTypeSchema.index({ categoryId: 1, code: 1 }, { unique: true, sparse: true });

attributeTypeSchema.pre("validate", function (next) {
  if (this.name && !this.code) {
    this.code = slugify(this.name, { separator: "_" });
  }
  if (this.code) {
    this.code = slugify(this.code, { separator: "_" });
    if (!this.name) {
      this.name = humanizeCode(this.code);
    }
  }
  next();
});

const AttributeTypeModel = mongoose.model("AttributeType", attributeTypeSchema);
export default AttributeTypeModel;
