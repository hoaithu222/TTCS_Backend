import mongoose from "mongoose";
import { slugify } from "../shared/utils/slugify";

export const attributeValueSchema = new mongoose.Schema(
  {
    attributeTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AttributeType",
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    label: {
      type: String,
    },
    code: {
      type: String,
      lowercase: true,
      trim: true,
    },
    colorCode: {
      type: String,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

attributeValueSchema.index({ attributeTypeId: 1, code: 1 }, { unique: true, sparse: true });
attributeValueSchema.index({ attributeTypeId: 1, value: 1 }, { unique: true, sparse: true });

attributeValueSchema.pre("validate", function (next) {
  if (this.value && !this.label) {
    this.label = this.value;
  }
  if (this.value && !this.code) {
    this.code = slugify(this.value, { separator: "_" });
  }
  if (this.code) {
    this.code = slugify(this.code, { separator: "_" });
  }
  next();
});

const AttributeValueModel = mongoose.model(
  "AttributeValue",
  attributeValueSchema
);
export default AttributeValueModel;
