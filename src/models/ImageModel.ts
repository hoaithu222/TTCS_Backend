import mongoose from "mongoose";

// Standalone Image schema for Image collection
export const imageSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Subdocument schema for embedding inside other models (no separate _id)
export const imageSubSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
      required: true,
    },
  },
  { timestamps: true, _id: false }
);

const ImageModel = mongoose.model("Image", imageSchema);

export default ImageModel;
