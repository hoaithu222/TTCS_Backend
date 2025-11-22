import mongoose from "mongoose";

export const chatMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatConversation",
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderName: String,
    senderAvatar: String,
    message: {
      type: String,
      required: true,
    },
    attachments: [
      {
        id: String,
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
        name: String,
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
chatMessageSchema.index({ senderId: 1 });
chatMessageSchema.index({ conversationId: 1, isRead: 1 });

const ChatMessageModel = mongoose.model("ChatMessage", chatMessageSchema);

export default ChatMessageModel;

