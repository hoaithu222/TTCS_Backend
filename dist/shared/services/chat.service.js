"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatService = void 0;
const ChatConversation_1 = __importDefault(require("../../models/ChatConversation"));
const ChatMessage_1 = __importDefault(require("../../models/ChatMessage"));
const socket_1 = require("../config/socket");
const socket_server_1 = require("../config/socket-server");
const UserModel_1 = __importDefault(require("../../models/UserModel"));
/**
 * Emit chat message to conversation room
 */
const emitChatMessage = (channel, conversationId, message, senderId) => {
    const io = (0, socket_server_1.getSocketServer)();
    if (!io)
        return;
    const namespacePath = getNamespaceForChannel(channel);
    if (!namespacePath)
        return;
    const namespace = io.of(namespacePath);
    const room = (0, socket_1.buildChatConversationRoom)(channel, conversationId);
    // Emit to conversation room
    namespace.to(room).emit(socket_1.SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, {
        conversationId,
        message: {
            _id: message._id,
            conversationId: message.conversationId,
            senderId: message.senderId,
            senderName: message.senderName,
            senderAvatar: message.senderAvatar,
            message: message.message,
            attachments: message.attachments || [],
            metadata: message.metadata || {},
            isRead: message.isRead || false,
            isDelivered: message.isDelivered || false,
            createdAt: message.createdAt,
            updatedAt: message.updatedAt,
        },
    });
    // Also emit to each participant's direct room to ensure they receive it
    // Get conversation to find participants
    ChatConversation_1.default.findById(conversationId)
        .select("participants")
        .lean()
        .then((conversation) => {
        if (conversation) {
            conversation.participants.forEach((p) => {
                const userId = p.userId?.toString() || p.userId;
                if (userId && userId !== senderId) {
                    const userRoom = (0, socket_1.buildDirectUserRoom)(userId);
                    namespace.to(userRoom).emit(socket_1.SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, {
                        conversationId,
                        message: {
                            _id: message._id,
                            conversationId: message.conversationId,
                            senderId: message.senderId,
                            senderName: message.senderName,
                            senderAvatar: message.senderAvatar,
                            message: message.message,
                            attachments: message.attachments || [],
                            metadata: message.metadata || {},
                            isRead: message.isRead || false,
                            isDelivered: message.isDelivered || false,
                            createdAt: message.createdAt,
                            updatedAt: message.updatedAt,
                        },
                    });
                }
            });
        }
    })
        .catch(() => {
        // Ignore errors
    });
};
/**
 * Emit conversation update to participants
 */
const emitConversationUpdate = (channel, conversation) => {
    const io = (0, socket_server_1.getSocketServer)();
    if (!io)
        return;
    const namespacePath = getNamespaceForChannel(channel);
    if (!namespacePath)
        return;
    const namespace = io.of(namespacePath);
    const room = (0, socket_1.buildChatConversationRoom)(channel, conversation._id);
    // Emit to conversation room
    const conversationPayload = {
        conversationId: conversation._id,
        conversation,
    };
    namespace.to(room).emit(socket_1.SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, conversationPayload);
    console.log(`[Chat Service] Emitted conversation update to room ${room} for conversation ${conversation._id}`);
    // Also emit to each participant's direct room
    conversation.participants.forEach((participant) => {
        const userRoom = (0, socket_1.buildDirectUserRoom)(participant.userId);
        namespace.to(userRoom).emit(socket_1.SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, conversationPayload);
        console.log(`[Chat Service] Emitted conversation update to user room ${userRoom} for user ${participant.userId}`);
    });
};
/**
 * Get namespace path for channel
 */
const getNamespaceForChannel = (channel) => {
    switch (channel) {
        case socket_1.SOCKET_CHAT_CHANNELS.ADMIN:
            return socket_1.SOCKET_NAMESPACES.ADMIN_CHAT;
        case socket_1.SOCKET_CHAT_CHANNELS.SHOP:
            return socket_1.SOCKET_NAMESPACES.SHOP_CHAT;
        case socket_1.SOCKET_CHAT_CHANNELS.AI:
            return socket_1.SOCKET_NAMESPACES.AI_CHAT;
        default:
            return null;
    }
};
/**
 * Transform conversation to response format
 */
const transformConversation = async (conversation) => {
    // Get unread count
    const unreadCount = await ChatMessage_1.default.countDocuments({
        conversationId: conversation._id,
        isRead: false,
    });
    const lastMessage = conversation.lastMessageId
        ? await transformMessage(conversation.lastMessageId)
        : undefined;
    // Populate participants
    const populatedParticipants = await Promise.all(conversation.participants.map(async (p) => {
        if (p.userId && typeof p.userId === "object") {
            return {
                userId: p.userId._id?.toString() || p.userId.toString(),
                name: p.name || p.userId.fullName || p.userId.name || p.userId.email,
                avatar: p.avatar || p.userId.avatar,
                role: p.role || p.userId.role,
            };
        }
        const user = await UserModel_1.default.findById(p.userId)
            .select("name fullName email avatar role")
            .lean();
        return {
            userId: p.userId.toString(),
            name: user?.fullName || user?.name || user?.email,
            avatar: user?.avatar || p.avatar,
            role: user?.role || p.role,
        };
    }));
    return {
        _id: conversation._id.toString(),
        participants: populatedParticipants,
        lastMessage,
        unreadCount,
        type: conversation.type || "direct",
        channel: conversation.channel ? String(conversation.channel) : undefined,
        metadata: conversation.metadata || {},
        createdAt: conversation.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: conversation.updatedAt?.toISOString() || new Date().toISOString(),
    };
};
/**
 * Transform message to response format
 */
const transformMessage = async (msg) => {
    if (!msg)
        return null;
    let senderName = msg.senderName;
    let senderAvatar = msg.senderAvatar;
    if (!senderName && msg.senderId) {
        const sender = await UserModel_1.default.findById(msg.senderId)
            .select("name fullName email avatar")
            .lean();
        senderName = sender?.fullName || sender?.name || sender?.email;
        senderAvatar = sender?.avatar || senderAvatar;
    }
    return {
        _id: msg._id?.toString() || msg.toString(),
        conversationId: msg.conversationId?.toString() || "",
        senderId: msg.senderId?.toString() || "",
        senderName,
        senderAvatar,
        message: msg.message || "",
        attachments: msg.attachments || [],
        metadata: msg.metadata || {},
        isRead: msg.isRead || false,
        isDelivered: msg.isDelivered || false,
        createdAt: msg.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: msg.updatedAt?.toISOString(),
    };
};
exports.chatService = {
    /**
     * Emit a new message to conversation participants via socket
     */
    async emitMessage(options) {
        const { channel, conversationId, message, senderId } = options;
        emitChatMessage(channel, conversationId, message, senderId);
    },
    /**
     * Emit conversation update to participants
     * Calculates unread count for each participant separately
     */
    async emitConversationUpdate(options) {
        const { channel, conversationId } = options;
        const conversation = await ChatConversation_1.default.findById(conversationId)
            .populate("lastMessageId")
            .lean();
        if (!conversation) {
            return;
        }
        const participants = conversation.participants || [];
        const namespacePath = getNamespaceForChannel(channel);
        if (!namespacePath)
            return;
        const io = (0, socket_server_1.getSocketServer)();
        if (!io)
            return;
        const namespace = io.of(namespacePath);
        const room = (0, socket_1.buildChatConversationRoom)(channel, conversationId);
        // Emit conversation update for each participant with their own unread count
        for (const participant of participants) {
            const userId = participant.userId ? String(participant.userId) : '';
            if (!userId)
                continue;
            // Calculate unread count for this specific user (only messages from others)
            const unreadCount = await ChatMessage_1.default.countDocuments({
                conversationId,
                isRead: false,
                senderId: { $ne: userId },
            });
            const conversationResponse = await transformConversation({
                ...conversation,
                unreadCount, // Use calculated unread count for this user
            });
            // Emit to this specific user's direct room
            const userRoom = (0, socket_1.buildDirectUserRoom)(userId);
            namespace.to(userRoom).emit(socket_1.SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, {
                conversationId: conversationResponse._id,
                conversation: conversationResponse,
            });
            // Also emit to conversation room
            namespace.to(room).emit(socket_1.SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, {
                conversationId: conversationResponse._id,
                conversation: conversationResponse,
            });
        }
    },
    /**
     * Emit message and update conversation after sending a message
     * This should be called after ChatService.sendMessage
     */
    async emitMessageAndUpdateConversation(channel, conversationId, message, senderId) {
        // Emit the message
        emitChatMessage(channel, conversationId, message, senderId);
        // Update and emit conversation
        await this.emitConversationUpdate({ channel, conversationId });
    },
    /**
     * Emit typing indicator
     */
    emitTyping(channel, conversationId, userId, isTyping) {
        const io = (0, socket_server_1.getSocketServer)();
        if (!io)
            return;
        const namespacePath = getNamespaceForChannel(channel);
        if (!namespacePath)
            return;
        const namespace = io.of(namespacePath);
        const room = (0, socket_1.buildChatConversationRoom)(channel, conversationId);
        namespace.to(room).emit(socket_1.SOCKET_EVENTS.CHAT_TYPING, {
            conversationId,
            userId,
            isTyping,
            channel,
        });
    },
    /**
     * Emit message delivered status
     */
    emitDelivered(channel, conversationId, messageId, userId) {
        const io = (0, socket_server_1.getSocketServer)();
        if (!io)
            return;
        const namespacePath = getNamespaceForChannel(channel);
        if (!namespacePath)
            return;
        const namespace = io.of(namespacePath);
        const room = (0, socket_1.buildChatConversationRoom)(channel, conversationId);
        namespace.to(room).emit(socket_1.SOCKET_EVENTS.CHAT_DELIVERED, {
            conversationId,
            messageId,
            userId,
        });
    },
    /**
     * Emit message read status
     */
    emitSeen(channel, conversationId, messageId, userId) {
        const io = (0, socket_server_1.getSocketServer)();
        if (!io)
            return;
        const namespacePath = getNamespaceForChannel(channel);
        if (!namespacePath)
            return;
        const namespace = io.of(namespacePath);
        const room = (0, socket_1.buildChatConversationRoom)(channel, conversationId);
        namespace.to(room).emit(socket_1.SOCKET_EVENTS.CHAT_SEEN, {
            conversationId,
            messageId,
            userId,
        });
    },
};
