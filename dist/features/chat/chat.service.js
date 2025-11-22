"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ChatConversation_1 = __importDefault(require("../../models/ChatConversation"));
const ChatMessage_1 = __importDefault(require("../../models/ChatMessage"));
const UserModel_1 = __importDefault(require("../../models/UserModel"));
const ShopModel_1 = __importDefault(require("../../models/ShopModel"));
const chat_service_1 = require("../../shared/services/chat.service");
class ChatService {
    // Get conversations list with pagination
    static async getConversations(req, query = {}) {
        const userId = req.user?.userId;
        if (!userId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        const page = Math.max(1, parseInt(String(query.page || 1)));
        const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 10))));
        const skip = (page - 1) * limit;
        // Build filter
        const filter = {
            "participants.userId": userId,
        };
        if (query.type) {
            filter.type = query.type;
        }
        if (query.channel) {
            filter.channel = query.channel;
        }
        // Get conversations
        const [conversations, total] = await Promise.all([
            ChatConversation_1.default.find(filter)
                .sort({ lastMessageAt: -1, updatedAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("lastMessageId")
                .lean(),
            ChatConversation_1.default.countDocuments(filter),
        ]);
        // Get unread counts and last messages for each conversation
        const conversationIds = conversations.map((c) => c._id);
        const unreadCounts = await ChatMessage_1.default.aggregate([
            {
                $match: {
                    conversationId: { $in: conversationIds },
                    isRead: false,
                    senderId: { $ne: userId },
                },
            },
            {
                $group: {
                    _id: "$conversationId",
                    count: { $sum: 1 },
                },
            },
        ]);
        const unreadCountMap = new Map(unreadCounts.map((item) => [item._id.toString(), item.count]));
        // Transform conversations
        const conversationList = await Promise.all(conversations.map(async (conv) => {
            const lastMessage = conv.lastMessageId
                ? await this.transformMessage(conv.lastMessageId)
                : undefined;
            const unreadCount = unreadCountMap.get(conv._id.toString()) || 0;
            // Populate participants with user info
            const populatedParticipants = await Promise.all(conv.participants.map(async (p) => {
                if (p.userId.toString() === userId) {
                    return {
                        userId: p.userId.toString(),
                        name: p.name,
                        avatar: p.avatar,
                        role: p.role,
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
                _id: conv._id.toString(),
                participants: populatedParticipants,
                lastMessage,
                unreadCount,
                type: conv.type || "direct",
                channel: conv.channel ? String(conv.channel) : undefined,
                metadata: conv.metadata || {},
                createdAt: conv.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: conv.updatedAt?.toISOString() || new Date().toISOString(),
            };
        }));
        const response = {
            conversations: conversationList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
        return { ok: true, data: response };
    }
    // Create a new conversation
    static async createConversation(req, data) {
        const userId = req.user?.userId;
        if (!userId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        const currentUser = await UserModel_1.default.findById(userId)
            .select("name fullName email avatar role")
            .lean();
        if (!currentUser) {
            return { ok: false, status: 404, message: "User not found" };
        }
        let participants = [
            {
                userId: userId,
                name: currentUser.fullName || currentUser.name || currentUser.email,
                avatar: currentUser.avatar,
                role: currentUser.role,
            },
        ];
        let conversationType = "direct";
        let channel = undefined;
        let metadata = data.metadata || {};
        if (data.type === "admin") {
            // Find an admin user
            const admin = await UserModel_1.default.findOne({ role: { $in: ["admin", "moderator"] } })
                .select("_id name fullName email avatar role")
                .lean();
            if (!admin) {
                return {
                    ok: false,
                    status: 404,
                    message: "Không tìm thấy admin để chat",
                };
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
        }
        else if (data.type === "shop" && data.targetId) {
            // Find shop owner
            const shop = await ShopModel_1.default.findById(data.targetId)
                .populate("userId", "name fullName email avatar role")
                .lean();
            if (!shop) {
                return {
                    ok: false,
                    status: 404,
                    message: "Cửa hàng không tồn tại",
                };
            }
            const shopOwner = shop.userId;
            if (!shopOwner) {
                return {
                    ok: false,
                    status: 404,
                    message: "Chủ cửa hàng không tồn tại",
                };
            }
            participants.push({
                userId: shopOwner._id,
                name: shopOwner.fullName || shopOwner.name || shopOwner.email,
                avatar: shopOwner.avatar,
                role: shopOwner.role,
            });
            conversationType = "shop";
            channel = "shop";
            metadata.shopId = data.targetId;
            metadata.shopName = shop.name;
        }
        else {
            return {
                ok: false,
                status: 400,
                message: "Invalid conversation type or missing targetId",
            };
        }
        // Check if conversation already exists
        const existingConversation = await ChatConversation_1.default.findOne({
            "participants.userId": { $all: participants.map((p) => p.userId) },
            type: conversationType,
            channel: channel,
            ...(data.type === "shop" && data.targetId
                ? { "metadata.shopId": data.targetId }
                : {}),
        }).lean();
        if (existingConversation) {
            // Return existing conversation - use getConversation logic
            const lastMessage = existingConversation.lastMessageId
                ? await this.transformMessage(existingConversation.lastMessageId)
                : undefined;
            const unreadCount = await ChatMessage_1.default.countDocuments({
                conversationId: existingConversation._id,
                isRead: false,
                senderId: { $ne: userId },
            });
            // Populate participants
            const populatedParticipants = await Promise.all(existingConversation.participants.map(async (p) => {
                if (p.userId.toString() === userId) {
                    return {
                        userId: p.userId.toString(),
                        name: p.name,
                        avatar: p.avatar,
                        role: p.role,
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
            const response = {
                _id: existingConversation._id.toString(),
                participants: populatedParticipants,
                lastMessage,
                unreadCount,
                type: existingConversation.type || "direct",
                channel: existingConversation.channel ? String(existingConversation.channel) : undefined,
                metadata: existingConversation.metadata || {},
                createdAt: existingConversation.createdAt?.toISOString() || new Date().toISOString(),
                updatedAt: existingConversation.updatedAt?.toISOString() || new Date().toISOString(),
            };
            return { ok: true, data: response };
        }
        // Create new conversation
        const conversation = await ChatConversation_1.default.create({
            participants,
            type: conversationType,
            channel,
            metadata,
        });
        // Send initial message if provided
        if (data.initialMessage) {
            const message = await ChatMessage_1.default.create({
                conversationId: conversation._id,
                senderId: userId,
                senderName: currentUser.fullName || currentUser.name || currentUser.email,
                senderAvatar: currentUser.avatar,
                message: data.initialMessage,
                isDelivered: false,
                isRead: false,
            });
            await ChatConversation_1.default.findByIdAndUpdate(conversation._id, {
                lastMessageId: message._id,
                lastMessageAt: new Date(),
            });
            // Emit message via socket
            const messageResponse = await this.transformMessage(message.toObject());
            await chat_service_1.chatService.emitMessageAndUpdateConversation(channel, conversation._id.toString(), messageResponse, userId);
        }
        // Get the created conversation with populated data
        const createdConversation = await ChatConversation_1.default.findById(conversation._id)
            .populate("lastMessageId")
            .lean();
        const lastMessage = createdConversation?.lastMessageId
            ? await this.transformMessage(createdConversation.lastMessageId)
            : undefined;
        // Populate participants with user info
        const populatedParticipants = await Promise.all(participants.map(async (p) => {
            const user = await UserModel_1.default.findById(p.userId)
                .select("name fullName email avatar role")
                .lean();
            return {
                userId: p.userId.toString(),
                name: user?.fullName || user?.name || user?.email || p.name,
                avatar: user?.avatar || p.avatar,
                role: user?.role || p.role,
            };
        }));
        const response = {
            _id: conversation._id.toString(),
            participants: populatedParticipants,
            lastMessage,
            unreadCount: 0,
            type: conversationType,
            channel: channel,
            metadata: metadata,
            createdAt: conversation.createdAt?.toISOString() || new Date().toISOString(),
            updatedAt: conversation.updatedAt?.toISOString() || new Date().toISOString(),
        };
        return { ok: true, data: response };
    }
    // Get conversation detail
    static async getConversation(req, conversationId) {
        const userId = req.user?.userId;
        if (!userId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        const conversation = await ChatConversation_1.default.findOne({
            _id: conversationId,
            "participants.userId": userId,
        })
            .populate("lastMessageId")
            .lean();
        if (!conversation) {
            return {
                ok: false,
                status: 404,
                message: "Cuộc trò chuyện không tồn tại",
            };
        }
        const lastMessage = conversation.lastMessageId
            ? await this.transformMessage(conversation.lastMessageId)
            : undefined;
        const unreadCount = await ChatMessage_1.default.countDocuments({
            conversationId,
            isRead: false,
            senderId: { $ne: userId },
        });
        // Populate participants
        const populatedParticipants = await Promise.all(conversation.participants.map(async (p) => {
            if (p.userId.toString() === userId) {
                return {
                    userId: p.userId.toString(),
                    name: p.name,
                    avatar: p.avatar,
                    role: p.role,
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
        const response = {
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
        return { ok: true, data: response };
    }
    // Get messages in a conversation
    static async getMessages(req, conversationId, query = {}) {
        const userId = req.user?.userId;
        if (!userId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        // Verify user is participant
        const conversation = await ChatConversation_1.default.findOne({
            _id: conversationId,
            "participants.userId": userId,
        });
        if (!conversation) {
            return {
                ok: false,
                status: 404,
                message: "Cuộc trò chuyện không tồn tại",
            };
        }
        const page = Math.max(1, parseInt(String(query.page || 1)));
        const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 20))));
        const skip = (page - 1) * limit;
        // Build filter
        const filter = { conversationId };
        if (query.before) {
            const beforeMessage = await ChatMessage_1.default.findById(query.before);
            if (beforeMessage) {
                filter.createdAt = { $lt: beforeMessage.createdAt };
            }
        }
        if (query.after) {
            const afterMessage = await ChatMessage_1.default.findById(query.after);
            if (afterMessage) {
                filter.createdAt = { $gt: afterMessage.createdAt };
            }
        }
        // Get messages
        const [messages, total] = await Promise.all([
            ChatMessage_1.default.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ChatMessage_1.default.countDocuments(filter),
        ]);
        // Transform messages
        const messageList = await Promise.all(messages.map((msg) => this.transformMessage(msg)));
        // Reverse to show oldest first
        messageList.reverse();
        const response = {
            messages: messageList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
        return { ok: true, data: response };
    }
    // Send a message
    static async sendMessage(req, conversationId, data) {
        const userId = req.user?.userId;
        if (!userId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        // Verify user is participant
        const conversation = await ChatConversation_1.default.findOne({
            _id: conversationId,
            "participants.userId": userId,
        });
        if (!conversation) {
            return {
                ok: false,
                status: 404,
                message: "Cuộc trò chuyện không tồn tại",
            };
        }
        // Get sender info
        const sender = await UserModel_1.default.findById(userId).select("name fullName email avatar role").lean();
        // Create message
        const message = await ChatMessage_1.default.create({
            conversationId,
            senderId: userId,
            senderName: sender?.fullName || sender?.name || sender?.email,
            senderAvatar: sender?.avatar,
            message: data.message,
            attachments: data.attachments || [],
            metadata: data.metadata || {},
            isDelivered: false,
            isRead: false,
        });
        // Update conversation
        await ChatConversation_1.default.findByIdAndUpdate(conversationId, {
            lastMessageId: message._id,
            lastMessageAt: new Date(),
            updatedAt: new Date(),
        });
        const response = await this.transformMessage(message.toObject());
        // Emit message via socket
        const channel = conversation.channel || "shop";
        await chat_service_1.chatService.emitMessageAndUpdateConversation(channel, conversationId, response, userId);
        return { ok: true, data: response };
    }
    // Mark conversation as read
    static async markAsRead(req, conversationId) {
        const userId = req.user?.userId;
        if (!userId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        // Verify user is participant
        const conversation = await ChatConversation_1.default.findOne({
            _id: conversationId,
            "participants.userId": userId,
        });
        if (!conversation) {
            return {
                ok: false,
                status: 404,
                message: "Cuộc trò chuyện không tồn tại",
            };
        }
        // Mark all messages as read
        const updateResult = await ChatMessage_1.default.updateMany({
            conversationId,
            senderId: { $ne: userId },
            isRead: false,
        }, {
            isRead: true,
            readAt: new Date(),
        });
        // Emit conversation update via socket
        const channel = conversation.channel || "shop";
        await chat_service_1.chatService.emitConversationUpdate({ channel, conversationId });
        return { ok: true };
    }
    // Mark conversation as delivered
    static async markAsDelivered(req, conversationId) {
        const userId = req.user?.userId;
        if (!userId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        // Verify user is participant
        const conversation = await ChatConversation_1.default.findOne({
            _id: conversationId,
            "participants.userId": userId,
        });
        if (!conversation) {
            return {
                ok: false,
                status: 404,
                message: "Cuộc trò chuyện không tồn tại",
            };
        }
        // Mark all messages as delivered
        const updateResult = await ChatMessage_1.default.updateMany({
            conversationId,
            senderId: { $ne: userId },
            isDelivered: false,
        }, {
            isDelivered: true,
            deliveredAt: new Date(),
        });
        // Emit conversation update via socket
        const channel = conversation.channel || "shop";
        await chat_service_1.chatService.emitConversationUpdate({ channel, conversationId });
        return { ok: true };
    }
    // Helper: Transform message to response format
    static async transformMessage(msg) {
        if (!msg)
            return null;
        // If msg is already populated with sender info, use it
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
    }
}
exports.default = ChatService;
