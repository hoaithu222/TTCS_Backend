import mongoose from "mongoose";

export const categoryAttributeTypeSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  attributeTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AttributeType",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

const CategoryAttributeTypeModel = mongoose.model(
  "CategoryAttributeType",
  categoryAttributeTypeSchema
);
export default CategoryAttributeTypeModel;
