"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatMessageSchema = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
exports.chatMessageSchema = new mongoose_1.default.Schema({
    conversationId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "ChatConversation",
        required: true,
    },
    senderId: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    senderName: String,
    senderAvatar: String,
    message: {
        type: String,
        required: false, // Not strictly required - will validate in code
        default: "",
    },
    type: {
        type: String,
        enum: ["text", "product", "call", "image", "file"],
        default: "text",
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
        type: mongoose_1.default.Schema.Types.Mixed,
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
}, { timestamps: true });
// Indexes
exports.chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
exports.chatMessageSchema.index({ senderId: 1 });
exports.chatMessageSchema.index({ conversationId: 1, isRead: 1 });
const ChatMessageModel = mongoose_1.default.model("ChatMessage", exports.chatMessageSchema);
exports.default = ChatMessageModel;
