import ChatConversationModel from "../../models/ChatConversation";
import ChatMessageModel from "../../models/ChatMessage";
import UserModel from "../../models/UserModel";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import type {
  ChatConversationResponse,
  ChatMessageResponse,
  ConversationListQuery,
  MessageListQuery,
  SendMessageRequest,
  ConversationListResponse,
  MessageListResponse,
} from "./types";

export default class ChatService {
  // Get conversations list with pagination
  static async getConversations(
    req: AuthenticatedRequest,
    query: ConversationListQuery = {}
  ) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }

    const page = Math.max(1, parseInt(String(query.page || 1)));
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 10))));
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {
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
      ChatConversationModel.find(filter)
        .sort({ lastMessageAt: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("lastMessageId")
        .lean(),
      ChatConversationModel.countDocuments(filter),
    ]);

    // Get unread counts and last messages for each conversation
    const conversationIds = conversations.map((c: any) => c._id);
    const unreadCounts = await ChatMessageModel.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          isRead: false,
          senderId: { $ne: userId as any },
        },
      },
      {
        $group: {
          _id: "$conversationId",
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadCountMap = new Map(
      unreadCounts.map((item) => [item._id.toString(), item.count])
    );

    // Transform conversations
    const conversationList: ChatConversationResponse[] = await Promise.all(
      conversations.map(async (conv: any) => {
        const lastMessage = conv.lastMessageId
          ? await this.transformMessage(conv.lastMessageId)
          : undefined;

        const unreadCount = unreadCountMap.get(conv._id.toString()) || 0;

        // Populate participants with user info
        const populatedParticipants = await Promise.all(
          conv.participants.map(async (p: any) => {
            if (p.userId.toString() === userId) {
              return {
                userId: p.userId.toString(),
                name: p.name,
                avatar: p.avatar,
                role: p.role,
              };
            }
            const user = await UserModel.findById(p.userId)
              .select("name fullName email avatar role")
              .lean();
            return {
              userId: p.userId.toString(),
              name: user?.fullName || user?.name || user?.email,
              avatar: user?.avatar || p.avatar,
              role: user?.role || p.role,
            };
          })
        );

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
      })
    );

    const response: ConversationListResponse = {
      conversations: conversationList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return { ok: true as const, data: response };
  }

  // Get conversation detail
  static async getConversation(req: AuthenticatedRequest, conversationId: string) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }

    const conversation = await ChatConversationModel.findOne({
      _id: conversationId,
      "participants.userId": userId,
    })
      .populate("lastMessageId")
      .lean();

    if (!conversation) {
      return {
        ok: false as const,
        status: 404,
        message: "Cuộc trò chuyện không tồn tại",
      };
    }

    const lastMessage = conversation.lastMessageId
      ? await this.transformMessage(conversation.lastMessageId)
      : undefined;

    const unreadCount = await ChatMessageModel.countDocuments({
      conversationId,
      isRead: false,
      senderId: { $ne: userId as any },
    });

    // Populate participants
    const populatedParticipants = await Promise.all(
      (conversation as any).participants.map(async (p: any) => {
        if (p.userId.toString() === userId) {
          return {
            userId: p.userId.toString(),
            name: p.name,
            avatar: p.avatar,
            role: p.role,
          };
        }
        const user = await UserModel.findById(p.userId)
          .select("name fullName email avatar role")
          .lean();
        return {
          userId: p.userId.toString(),
          name: user?.fullName || user?.name || user?.email,
          avatar: user?.avatar || p.avatar,
          role: user?.role || p.role,
        };
      })
    );

    const response: ChatConversationResponse = {
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

    return { ok: true as const, data: response };
  }

  // Get messages in a conversation
  static async getMessages(
    req: AuthenticatedRequest,
    conversationId: string,
    query: MessageListQuery = {}
  ) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }

    // Verify user is participant
    const conversation = await ChatConversationModel.findOne({
      _id: conversationId,
      "participants.userId": userId,
    });

    if (!conversation) {
      return {
        ok: false as const,
        status: 404,
        message: "Cuộc trò chuyện không tồn tại",
      };
    }

    const page = Math.max(1, parseInt(String(query.page || 1)));
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 20))));
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { conversationId };
    if (query.before) {
      const beforeMessage = await ChatMessageModel.findById(query.before);
      if (beforeMessage) {
        filter.createdAt = { $lt: beforeMessage.createdAt };
      }
    }
    if (query.after) {
      const afterMessage = await ChatMessageModel.findById(query.after);
      if (afterMessage) {
        filter.createdAt = { $gt: afterMessage.createdAt };
      }
    }

    // Get messages
    const [messages, total] = await Promise.all([
      ChatMessageModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ChatMessageModel.countDocuments(filter),
    ]);

    // Transform messages
    const messageList: ChatMessageResponse[] = await Promise.all(
      messages.map((msg: any) => this.transformMessage(msg))
    );

    // Reverse to show oldest first
    messageList.reverse();

    const response: MessageListResponse = {
      messages: messageList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };

    return { ok: true as const, data: response };
  }

  // Send a message
  static async sendMessage(
    req: AuthenticatedRequest,
    conversationId: string,
    data: SendMessageRequest
  ) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }

    // Verify user is participant
    const conversation = await ChatConversationModel.findOne({
      _id: conversationId,
      "participants.userId": userId,
    });

    if (!conversation) {
      return {
        ok: false as const,
        status: 404,
        message: "Cuộc trò chuyện không tồn tại",
      };
    }

    // Get sender info
    const sender = await UserModel.findById(userId).select("name fullName email avatar role").lean();

    // Create message
    const message = await ChatMessageModel.create({
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
    await ChatConversationModel.findByIdAndUpdate(conversationId, {
      lastMessageId: message._id,
      lastMessageAt: new Date(),
      updatedAt: new Date(),
    });

    const response: ChatMessageResponse = await this.transformMessage(message.toObject());

    return { ok: true as const, data: response };
  }

  // Mark conversation as read
  static async markAsRead(req: AuthenticatedRequest, conversationId: string) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }

    // Verify user is participant
    const conversation = await ChatConversationModel.findOne({
      _id: conversationId,
      "participants.userId": userId,
    });

    if (!conversation) {
      return {
        ok: false as const,
        status: 404,
        message: "Cuộc trò chuyện không tồn tại",
      };
    }

    // Mark all messages as read
    await ChatMessageModel.updateMany(
      {
        conversationId,
        senderId: { $ne: userId as any },
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    return { ok: true as const };
  }

  // Mark conversation as delivered
  static async markAsDelivered(req: AuthenticatedRequest, conversationId: string) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }

    // Verify user is participant
    const conversation = await ChatConversationModel.findOne({
      _id: conversationId,
      "participants.userId": userId,
    });

    if (!conversation) {
      return {
        ok: false as const,
        status: 404,
        message: "Cuộc trò chuyện không tồn tại",
      };
    }

    // Mark all messages as delivered
    await ChatMessageModel.updateMany(
      {
        conversationId,
        senderId: { $ne: userId as any },
        isDelivered: false,
      },
      {
        isDelivered: true,
        deliveredAt: new Date(),
      }
    );

    return { ok: true as const };
  }

  // Helper: Transform message to response format
  private static async transformMessage(msg: any): Promise<ChatMessageResponse> {
    if (!msg) return null as any;

    // If msg is already populated with sender info, use it
    let senderName = msg.senderName;
    let senderAvatar = msg.senderAvatar;

    if (!senderName && msg.senderId) {
      const sender = await UserModel.findById(msg.senderId)
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

