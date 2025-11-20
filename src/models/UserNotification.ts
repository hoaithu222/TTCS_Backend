import mongoose from "mongoose";

export const userNotificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      default: "system",
    },
    icon: {
      type: String,
    },
    actionUrl: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    priority: {
      type: String,
      enum: ["low", "normal", "high"],
      default: "normal",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

userNotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const UserNotificationModel = mongoose.model(
  "UserNotification",
  userNotificationSchema
);

export default UserNotificationModel;
