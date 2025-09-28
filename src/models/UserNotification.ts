import mongoose from "mongoose";

export const userNotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // title
  title: {
    type: String,
    required: true,
  },
  // content
  content: {
    type: String,
    required: true,
  },
  // isRead
  isRead: {
    type: Boolean,
    default: false,
  },
  // createdAt
  createdAt: {
    type: Date,
    default: Date.now,
  },
  // updatedAt
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const UserNotificationModel = mongoose.model(
  "UserNotification",
  userNotificationSchema
);

export default UserNotificationModel;
