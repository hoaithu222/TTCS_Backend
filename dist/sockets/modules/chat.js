"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatNamespace = void 0;
const socket_1 = require("../../shared/config/socket");
const types_1 = require("../types");
const CHANNEL_TO_NAMESPACE = {
    [socket_1.SOCKET_CHAT_CHANNELS.ADMIN]: socket_1.SOCKET_NAMESPACES.ADMIN_CHAT,
    [socket_1.SOCKET_CHAT_CHANNELS.SHOP]: socket_1.SOCKET_NAMESPACES.SHOP_CHAT,
    [socket_1.SOCKET_CHAT_CHANNELS.AI]: socket_1.SOCKET_NAMESPACES.AI_CHAT,
};
const ensureAuthenticated = (socket, namespace) => {
    const socketUser = (0, types_1.getSocketUser)(socket);
    if (!socketUser) {
        socket.emit(socket_1.SOCKET_EVENTS.ERROR, { message: "Unauthorized chat socket" });
        socket.disconnect(true);
        throw new Error("Unauthorized chat socket");
    }
    return socketUser;
};
const registerChatNamespace = (io, authMiddleware, options) => {
    const namespacePath = CHANNEL_TO_NAMESPACE[options.channel];
    const namespace = io.of(namespacePath);
    namespace.use(authMiddleware);
    namespace.on(socket_1.SOCKET_EVENTS.CONNECTION, (socket) => {
        const socketUser = ensureAuthenticated(socket, namespace);
        if (options.allowedRoles &&
            (!socketUser.role || !options.allowedRoles.includes(socketUser.role))) {
            socket.emit(socket_1.SOCKET_EVENTS.ERROR, {
                message: "Forbidden: role not allowed in chat channel",
            });
            socket.disconnect(true);
            return;
        }
        const directRoom = (0, socket_1.buildDirectUserRoom)(socketUser.userId);
        socket.join(directRoom);
        if (options.debug) {
            console.log(`[socket][${options.channel}] user ${socketUser.userId} connected (${socket.id})`);
        }
        socket.emit(socket_1.SOCKET_EVENTS.SYSTEM_READY, {
            namespace: namespacePath,
            channel: options.channel,
            rooms: [directRoom],
        });
        const joinConversation = (conversationId) => {
            if (!conversationId)
                return;
            const room = (0, socket_1.buildChatConversationRoom)(options.channel, conversationId);
            socket.join(room);
            if (options.debug) {
                console.log(`[socket][${options.channel}] user ${socketUser.userId} joined ${room}`);
            }
            socket.emit(socket_1.SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, {
                conversationId,
                room,
            });
        };
        const leaveConversation = (conversationId) => {
            if (!conversationId)
                return;
            const room = (0, socket_1.buildChatConversationRoom)(options.channel, conversationId);
            socket.leave(room);
            if (options.debug) {
                console.log(`[socket][${options.channel}] user ${socketUser.userId} left ${room}`);
            }
            socket.emit(socket_1.SOCKET_EVENTS.CHAT_CONVERSATION_LEAVE, {
                conversationId,
                room,
            });
        };
        socket.on(socket_1.SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, ({ conversationId }) => {
            joinConversation(conversationId);
        });
        socket.on(socket_1.SOCKET_EVENTS.CHAT_CONVERSATION_LEAVE, ({ conversationId }) => {
            leaveConversation(conversationId);
        });
        socket.on(socket_1.SOCKET_EVENTS.ROOM_JOIN, (room) => {
            if (room) {
                socket.join(room);
            }
        });
        socket.on(socket_1.SOCKET_EVENTS.ROOM_LEAVE, (room) => {
            if (room) {
                socket.leave(room);
            }
        });
        socket.on(socket_1.SOCKET_EVENTS.CHAT_MESSAGE_SEND, async (payload) => {
            // Allow empty message if there are attachments
            const hasAttachments = payload.attachments && payload.attachments.length > 0;
            if (!payload?.message && !hasAttachments) {
                socket.emit(socket_1.SOCKET_EVENTS.ERROR, { message: "Message or attachment is required" });
                return;
            }
            try {
                // Import ChatService dynamically to avoid circular dependency
                const ChatService = (await Promise.resolve().then(() => __importStar(require("../../features/chat/chat.service")))).default;
                const UserModel = (await Promise.resolve().then(() => __importStar(require("../../models/UserModel")))).default;
                const ChatConversationModel = (await Promise.resolve().then(() => __importStar(require("../../models/ChatConversation")))).default;
                const ChatMessageModel = (await Promise.resolve().then(() => __importStar(require("../../models/ChatMessage")))).default;
                const ShopModel = (await Promise.resolve().then(() => __importStar(require("../../models/ShopModel")))).default;
                let conversationId = payload.conversationId;
                // If no conversationId, create a new conversation
                if (!conversationId) {
                    const currentUser = await UserModel.findById(socketUser.userId)
                        .select("name fullName email avatar role")
                        .lean();
                    if (!currentUser) {
                        socket.emit(socket_1.SOCKET_EVENTS.ERROR, { message: "User not found" });
                        return;
                    }
                    let participants = [
                        {
                            userId: socketUser.userId,
                            name: currentUser.fullName || currentUser.name || currentUser.email,
                            avatar: currentUser.avatar,
                            role: currentUser.role,
                        },
                    ];
                    let conversationType = "direct";
                    let channel = options.channel;
                    let metadata = payload.metadata || {};
                    // Use conversationType from payload, fallback to type for backward compatibility
                    const convType = payload.conversationType || payload.type;
                    if (convType === "admin") {
                        // Find an admin user
                        const admin = await UserModel.findOne({ role: { $in: ["admin", "moderator"] } })
                            .select("_id name fullName email avatar role")
                            .lean();
                        if (!admin) {
                            socket.emit(socket_1.SOCKET_EVENTS.ERROR, { message: "Không tìm thấy admin để chat" });
                            return;
                        }
                        participants.push({
                            userId: admin._id,
                            name: admin.fullName || admin.name || admin.email,
                            avatar: admin.avatar,
                            role: admin.role,
                        });
                        conversationType = "admin";
                        channel = "admin";
                        metadata.context = metadata.context || "CSKH";
                        metadata.isSupport = true;
                    }
                    else if (convType === "shop" && payload.targetId) {
                        // Find shop owner
                        const shop = await ShopModel.findById(payload.targetId)
                            .populate("userId", "name fullName email avatar role")
                            .lean();
                        if (!shop) {
                            socket.emit(socket_1.SOCKET_EVENTS.ERROR, { message: "Cửa hàng không tồn tại" });
                            return;
                        }
                        const shopOwner = shop.userId;
                        if (!shopOwner) {
                            socket.emit(socket_1.SOCKET_EVENTS.ERROR, { message: "Chủ cửa hàng không tồn tại" });
                            return;
                        }
                        participants.push({
                            userId: shopOwner._id,
                            name: shopOwner.fullName || shopOwner.name || shopOwner.email,
                            avatar: shopOwner.avatar,
                            role: shopOwner.role,
                        });
                        conversationType = "shop";
                        channel = options.channel;
                        metadata.shopId = payload.targetId;
                        metadata.shopName = shop.name;
                    }
                    else {
                        // Default to admin chat if no type specified
                        const admin = await UserModel.findOne({ role: { $in: ["admin", "moderator"] } })
                            .select("_id name fullName email avatar role")
                            .lean();
                        if (admin) {
                            participants.push({
                                userId: admin._id,
                                name: admin.fullName || admin.name || admin.email,
                                avatar: admin.avatar,
                                role: admin.role,
                            });
                            conversationType = "admin";
                            channel = "admin";
                            metadata.context = "CSKH";
                            metadata.isSupport = true;
                        }
                        else {
                            socket.emit(socket_1.SOCKET_EVENTS.ERROR, { message: "Không thể tạo cuộc trò chuyện" });
                            return;
                        }
                    }
                    // Check if conversation already exists
                    const existingConversation = await ChatConversationModel.findOne({
                        "participants.userId": { $all: participants.map((p) => p.userId) },
                        type: conversationType,
                        channel: channel,
                        ...(convType === "shop" && payload.targetId
                            ? { "metadata.shopId": payload.targetId }
                            : {}),
                    }).lean();
                    if (existingConversation) {
                        conversationId = existingConversation._id.toString();
                    }
                    else {
                        // Create new conversation
                        const conversation = await ChatConversationModel.create({
                            participants,
                            type: conversationType,
                            channel,
                            metadata,
                        });
                        conversationId = conversation._id.toString();
                        // Emit conversationId back to sender when creating new conversation via CHAT_CONVERSATION_JOIN
                        // This will be handled by the conversation update emit below
                    }
                }
                // Verify conversation exists and user is participant
                const conversation = await ChatConversationModel.findOne({
                    _id: conversationId,
                    "participants.userId": socketUser.userId,
                });
                if (!conversation) {
                    socket.emit(socket_1.SOCKET_EVENTS.ERROR, { message: "Cuộc trò chuyện không tồn tại" });
                    return;
                }
                // Get sender info
                const sender = await UserModel.findById(socketUser.userId)
                    .select("name fullName email avatar role")
                    .lean();
                // Determine message type
                let messageType = payload.type || "text";
                // Auto-detect type from metadata if not provided
                if (!payload.type && payload.metadata?.productId) {
                    messageType = "product";
                }
                // Ensure message has a value (empty string is allowed if attachments exist)
                const messageText = payload.message != null ? String(payload.message) : "";
                // Create message in database
                const message = await ChatMessageModel.create({
                    conversationId,
                    senderId: socketUser.userId,
                    senderName: sender?.fullName || sender?.name || sender?.email,
                    senderAvatar: sender?.avatar,
                    message: messageText, // Can be empty string if attachments exist
                    type: messageType,
                    attachments: payload.attachments || [],
                    metadata: payload.metadata || {},
                    isDelivered: false,
                    isRead: false,
                });
                // Update conversation
                await ChatConversationModel.findByIdAndUpdate(conversationId, {
                    lastMessageId: message._id,
                    lastMessageAt: new Date(),
                    updatedAt: new Date(),
                });
                // Join conversation room if not already joined
                const room = (0, socket_1.buildChatConversationRoom)(options.channel, conversationId);
                socket.join(room);
                // Transform message for socket
                const messageResponse = {
                    _id: message._id.toString(),
                    conversationId: conversationId,
                    senderId: socketUser.userId,
                    senderName: sender?.fullName || sender?.name || sender?.email,
                    senderAvatar: sender?.avatar,
                    message: messageText, // Can be empty string if attachments exist
                    type: messageType, // Include message type
                    attachments: payload.attachments || [],
                    metadata: payload.metadata || {},
                    isRead: false,
                    isDelivered: false,
                    createdAt: message.createdAt.toISOString(),
                    updatedAt: message.updatedAt.toISOString(),
                };
                // Emit message to conversation room
                const enrichedPayload = {
                    conversationId,
                    message: messageResponse,
                    room,
                    channel: options.channel,
                    senderId: socketUser.userId,
                    sentAt: message.createdAt.toISOString(),
                };
                namespace.to(room).emit(socket_1.SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, enrichedPayload);
                // Also emit conversation update
                const updatedConversation = await ChatConversationModel.findById(conversationId)
                    .populate("lastMessageId")
                    .lean();
                if (updatedConversation) {
                    // Populate participants
                    const populatedParticipants = await Promise.all(updatedConversation.participants.map(async (p) => {
                        const user = await UserModel.findById(p.userId)
                            .select("name fullName email avatar role")
                            .lean();
                        return {
                            userId: p.userId.toString(),
                            name: user?.fullName || user?.name || user?.email || p.name,
                            avatar: user?.avatar || p.avatar,
                            role: user?.role || p.role,
                        };
                    }));
                    // Emit conversation update for each participant with their own unread counts
                    for (const participant of populatedParticipants) {
                        const participantUserId = participant.userId;
                        // Calculate unreadCountMe: messages from others that this participant hasn't read
                        const unreadCountMe = await ChatMessageModel.countDocuments({
                            conversationId,
                            isRead: false,
                            senderId: { $ne: participantUserId },
                        });
                        // Calculate unreadCountTo: messages from this participant that others haven't read
                        const unreadCountTo = await ChatMessageModel.countDocuments({
                            conversationId,
                            isRead: false,
                            senderId: participantUserId,
                        });
                        const conversationResponse = {
                            _id: updatedConversation._id.toString(),
                            participants: populatedParticipants,
                            lastMessage: messageResponse,
                            unreadCountMe, // Messages from others that this user hasn't read
                            unreadCountTo, // Messages from this user that others haven't read
                            unreadCount: unreadCountMe, // Backward compatibility
                            type: updatedConversation.type || "direct",
                            channel: updatedConversation.channel ? String(updatedConversation.channel) : undefined,
                            metadata: updatedConversation.metadata || {},
                            createdAt: updatedConversation.createdAt?.toISOString() || new Date().toISOString(),
                            updatedAt: updatedConversation.updatedAt?.toISOString() || new Date().toISOString(),
                        };
                        // Emit to this specific user's direct room
                        const userRoom = (0, socket_1.buildDirectUserRoom)(participantUserId);
                        namespace.to(userRoom).emit(socket_1.SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, {
                            conversationId,
                            conversation: conversationResponse,
                        });
                    }
                    // DON'T emit to conversation room with unreadCount
                    // Each user already receives correct unreadCount via their direct room above
                    // Emitting to conversation room would cause all users to receive wrong unreadCount
                }
            }
            catch (error) {
                console.error("[Chat Socket] Error sending message:", error);
                socket.emit(socket_1.SOCKET_EVENTS.ERROR, {
                    message: error.message || "Lỗi khi gửi tin nhắn",
                });
            }
        });
        socket.on(socket_1.SOCKET_EVENTS.CHAT_TYPING, (payload) => {
            if (!payload?.conversationId)
                return;
            const room = (0, socket_1.buildChatConversationRoom)(options.channel, payload.conversationId);
            socket.to(room).emit(socket_1.SOCKET_EVENTS.CHAT_TYPING, {
                ...payload,
                userId: socketUser.userId,
                channel: options.channel,
            });
        });
        socket.on(socket_1.SOCKET_EVENTS.CHAT_SEEN, (payload) => {
            if (!payload?.conversationId || !payload?.messageId)
                return;
            const room = (0, socket_1.buildChatConversationRoom)(options.channel, payload.conversationId);
            socket.to(room).emit(socket_1.SOCKET_EVENTS.CHAT_SEEN, {
                ...payload,
                userId: socketUser.userId,
            });
        });
        socket.on(socket_1.SOCKET_EVENTS.CHAT_DELIVERED, (payload) => {
            if (!payload?.conversationId || !payload?.messageId)
                return;
            const room = (0, socket_1.buildChatConversationRoom)(options.channel, payload.conversationId);
            socket.to(room).emit(socket_1.SOCKET_EVENTS.CHAT_DELIVERED, {
                ...payload,
                userId: socketUser.userId,
            });
        });
        socket.on(socket_1.SOCKET_EVENTS.DISCONNECT, (reason) => {
            if (options.debug) {
                console.log(`[socket][${options.channel}] user ${socketUser.userId} disconnected (${reason})`);
            }
        });
    });
    return namespace;
};
exports.registerChatNamespace = registerChatNamespace;
