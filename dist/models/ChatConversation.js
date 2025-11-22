"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatConversationSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.chatConversationSchema = new mongoose_1.default.Schema({
    participants: [
        {
            userId: {
                type: mongoose_1.default.Schema.Types.ObjectId,
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
        type: mongoose_1.default.Schema.Types.Mixed,
        default: {},
    },
    lastMessageId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "ChatMessage",
    },
    lastMessageAt: {
        type: Date,
    },
}, { timestamps: true });
// Indexes
exports.chatConversationSchema.index({ "participants.userId": 1, updatedAt: -1 });
exports.chatConversationSchema.index({ type: 1, channel: 1 });
exports.chatConversationSchema.index({ lastMessageAt: -1 });
const ChatConversationModel = mongoose_1.default.model("ChatConversation", exports.chatConversationSchema);
exports.default = ChatConversationModel;
