import mongoose from "mongoose";
import { imageSubSchema } from "./ImageModel";

// Banner item schema
const bannerItemSchema = new mongoose.Schema(
  {
    image: {
      type: imageSubSchema,
      required: true,
    },
    title: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    link: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true, timestamps: true }
);

// Side banner item schema - now uses categoryId instead of image
const sideBannerItemSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true, timestamps: true }
);

// Home configuration schema
const homeConfigurationSchema = new mongoose.Schema(
  {
    // Main carousel banners
    mainBanners: {
      type: [bannerItemSchema],
      default: [],
    },
    // Side banners (2 images on the right)
    sideBanners: {
      type: [sideBannerItemSchema],
      default: [],
    },
    // Feature cards configuration
    features: {
      type: [
        {
          icon: {
            type: String,
            required: true,
          },
          text: {
            type: String,
            required: true,
          },
          iconBg: {
            type: String,
            required: true,
          },
          hoverColor: {
            type: String,
            required: true,
          },
          order: {
            type: Number,
            default: 0,
          },
          isActive: {
            type: Boolean,
            default: true,
          },
        },
      ],
      default: [],
    },
    // Additional home page settings
    settings: {
      type: {
        autoSlideInterval: {
          type: Number,
          default: 5000, // milliseconds
        },
        showCounter: {
          type: Boolean,
          default: true,
        },
        showDots: {
          type: Boolean,
          default: true,
        },
      },
      default: {},
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Display type for different layouts
    displayType: {
      type: String,
      enum: ["default", "compact", "modern", "classic"],
      default: "default",
    },
  },
  { timestamps: true }
);

// Create index for active configurations
homeConfigurationSchema.index({ isActive: 1 });

const HomeConfigurationModel = mongoose.model(
  "HomeConfiguration",
  homeConfigurationSchema
);

export default HomeConfigurationModel;

