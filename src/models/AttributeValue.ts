import mongoose from "mongoose";

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
  },
  { timestamps: true }
);

const AttributeValueModel = mongoose.model(
  "AttributeValue",
  attributeValueSchema
);
export default AttributeValueModel;
