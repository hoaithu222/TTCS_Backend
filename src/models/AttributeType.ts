import mongoose from "mongoose";

export const attributeTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    is_multiple: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const AttributeTypeModel = mongoose.model("AttributeType", attributeTypeSchema);
export default AttributeTypeModel;
