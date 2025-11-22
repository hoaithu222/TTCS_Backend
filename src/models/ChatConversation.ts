import mongoose from "mongoose";

export const chatConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        name: String,
        avatar: String,
        role: String,
      },
    ],
    type: {
      type: String,
      enum: ["direct", "group", "admin", "shop", "ai"],
      default: "direct",
    },
    channel: {
      type: String,
      enum: ["admin", "shop", "ai"],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    lastMessageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ChatMessage",
    },
    lastMessageAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes
chatConversationSchema.index({ "participants.userId": 1, updatedAt: -1 });
chatConversationSchema.index({ type: 1, channel: 1 });
chatConversationSchema.index({ lastMessageAt: -1 });

const ChatConversationModel = mongoose.model(
  "ChatConversation",
  chatConversationSchema
);

export default ChatConversationModel;

