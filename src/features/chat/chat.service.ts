
import ChatConversationModel from "../../models/ChatConversation";
import ChatMessageModel from "../../models/ChatMessage";
import UserModel from "../../models/UserModel";
import ShopModel from "../../models/ShopModel";
import { Types } from "mongoose";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import { chatService } from "../../shared/services/chat.service";
import type {
  ChatConversationResponse,
  ChatMessageResponse,
  ConversationListQuery,
  MessageListQuery,
  SendMessageRequest,
  ConversationListResponse,
  MessageListResponse,
  CreateConversationRequest,
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
    const userIdFilters = this.buildUserIdMatchingFilters(userId);
    const currentUserId = userIdFilters.userIdStr;

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

    // Get unread counts for each conversation
    const conversationIds = conversations.map((c: any) => c._id);
    
    // unreadCountMe: messages from others that current user hasn't read
    const unreadCountsMe = await ChatMessageModel.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          isRead: false,
          senderId: userIdFilters.senderIsNotUser,
        },
      },
      {
        $group: {
          _id: "$conversationId",
          count: { $sum: 1 },
        },
      },
    ]);

    // unreadCountTo: messages from current user that others haven't read
    const unreadCountsTo = await ChatMessageModel.aggregate([
      {
        $match: {
          conversationId: { $in: conversationIds },
          isRead: false,
          senderId: userIdFilters.senderIsUser,
        },
      },
      {
        $group: {
          _id: "$conversationId",
          count: { $sum: 1 },
        },
      },
    ]);

    const unreadCountMeMap = new Map(
      unreadCountsMe.map((item) => [item._id.toString(), item.count])
    );
    const unreadCountToMap = new Map(
      unreadCountsTo.map((item) => [item._id.toString(), item.count])
    );

    // Transform conversations
    const conversationList: ChatConversationResponse[] = await Promise.all(
      conversations.map(async (conv: any) => {
        const lastMessage = conv.lastMessageId
          ? await this.transformMessage(conv.lastMessageId)
          : undefined;

        const unreadCountMe = unreadCountMeMap.get(conv._id.toString()) || 0;
        const unreadCountTo = unreadCountToMap.get(conv._id.toString()) || 0;

        // Populate participants with user info
        const populatedParticipants = await Promise.all(
          conv.participants.map(async (p: any) => {
            if (p.userId.toString() === currentUserId) {
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
          unreadCountMe,
          unreadCountTo,
          unreadCount: unreadCountMe, // Backward compatibility
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

  static async getOrCreateConversationForShop(shopUserId: string, customerId: string) {
    const existing = await ChatConversationModel.findOne({
      "participants.userId": { $all: [shopUserId, customerId] },
      type: "direct",
    });
    if (existing) return existing;

    const conversation = await ChatConversationModel.create({
      type: "direct",
      participants: [
        { userId: shopUserId, role: "shop" },
        { userId: customerId, role: "customer" },
      ],
    });
    return conversation;
  }

  // Create a new conversation
  static async createConversation(
    req: AuthenticatedRequest,
    data: CreateConversationRequest
  ) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }

    const currentUser = await UserModel.findById(userId)
      .select("name fullName email avatar role")
      .lean();

    if (!currentUser) {
      return { ok: false as const, status: 404, message: "User not found" };
    }
    const userIdFilters = this.buildUserIdMatchingFilters(userId);
    const currentUserId = userIdFilters.userIdStr;

    let participants: any[] = [
      {
        userId: userIdFilters.normalizedUserId,
        name: currentUser.fullName || currentUser.name || currentUser.email,
        avatar: currentUser.avatar,
        role: currentUser.role,
      },
    ];

    let conversationType: "admin" | "shop" | "ai" | "direct" = "direct";
    let channel: "admin" | "shop" | "ai" | undefined = undefined;
    let metadata = data.metadata || {};

    // Process and preserve product metadata if provided
    if (data.metadata?.productId) {
      console.log(`[Chat] Creating conversation with product metadata:`, {
        productId: data.metadata.productId,
        productName: data.metadata.productName,
        shopId: data.metadata.shopId,
      });
      // Product metadata will be preserved in conversation metadata
      // but product-specific info should be sent as message, not stored in conversation
    }

    if (data.type === "admin") {
      // Find an admin user
      const admin = await UserModel.findOne({ role: { $in: ["admin", "moderator"] } })
        .select("_id name fullName email avatar role")
        .lean();

      if (!admin) {
        return {
          ok: false as const,
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
      metadata.isSupport = true;
    } else if (data.type === "shop" && data.targetId) {
      // Find shop owner
      const shop = await ShopModel.findById(data.targetId)
        .populate("userId", "name fullName email avatar role")
        .lean();

      if (!shop) {
        return {
          ok: false as const,
          status: 404,
          message: "Cửa hàng không tồn tại",
        };
      }

      const shopOwner = shop.userId as any;
      if (!shopOwner) {
        return {
          ok: false as const,
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
      // Store shop info in metadata (always)
      metadata.shopId = data.targetId;
      metadata.shopName = shop.name;
      
      // Note: Product info from data.metadata will be preserved
      // but should be sent as a message, not stored in conversation metadata
      // to avoid creating separate conversations for each product
    } else if (data.type === "ai") {
      // AI conversation - no additional participant needed
      // AI responses will be generated via API
      conversationType = "ai";
      channel = "ai";
      metadata.isAi = true;
      metadata.context = metadata.context || "AI Assistant";
    } else {
      return {
        ok: false as const,
        status: 400,
        message: "Invalid conversation type or missing targetId",
      };
    }

    // Check if conversation already exists
    const existingConversation = await ChatConversationModel.findOne({
      "participants.userId": { $all: participants.map((p) => p.userId) },
      type: conversationType,
      channel: channel,
      ...(data.type === "shop" && data.targetId
        ? { "metadata.shopId": data.targetId }
        : data.type === "ai"
        ? { "metadata.isAi": true }
        : {}),
    }).lean();

    if (existingConversation) {
      // Return existing conversation - use getConversation logic
      const lastMessage = existingConversation.lastMessageId
        ? await this.transformMessage(existingConversation.lastMessageId)
        : undefined;

      // Calculate unreadCountMe: messages from others that current user hasn't read
      const unreadCountMe = await ChatMessageModel.countDocuments({
        conversationId: existingConversation._id,
        isRead: false,
        senderId: userIdFilters.senderIsNotUser,
      });

      // Calculate unreadCountTo: messages from current user that others haven't read
      const unreadCountTo = await ChatMessageModel.countDocuments({
        conversationId: existingConversation._id,
        isRead: false,
        senderId: userIdFilters.senderIsUser,
      });

      // Populate participants
      const populatedParticipants = await Promise.all(
        existingConversation.participants.map(async (p: any) => {
          if (p.userId.toString() === currentUserId) {
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
        _id: existingConversation._id.toString(),
        participants: populatedParticipants,
        lastMessage,
        unreadCountMe,
        unreadCountTo,
        unreadCount: unreadCountMe, // Backward compatibility
        type: existingConversation.type || "direct",
        channel: existingConversation.channel ? String(existingConversation.channel) : undefined,
        metadata: existingConversation.metadata || {},
        createdAt: existingConversation.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: existingConversation.updatedAt?.toISOString() || new Date().toISOString(),
      };

      return { ok: true as const, data: response };
    }

    // Create new conversation
    const conversation = await ChatConversationModel.create({
      participants,
      type: conversationType,
      channel,
      metadata,
    });

    // Send initial message if provided
    if (data.initialMessage) {
      // Determine type for initial message
      let initialMessageType: "text" | "product" | "call" | "image" | "file" = "text";
      if (metadata.productId) {
        initialMessageType = "product";
      }

      const message = await ChatMessageModel.create({
        conversationId: conversation._id,
        senderId: userIdFilters.normalizedUserId,
        senderName: currentUser.fullName || currentUser.name || currentUser.email,
        senderAvatar: currentUser.avatar,
        message: data.initialMessage,
        type: initialMessageType,
        metadata: metadata, // Include metadata for initial message
        isDelivered: false,
        isRead: false,
      });

      await ChatConversationModel.findByIdAndUpdate(conversation._id, {
        lastMessageId: message._id,
        lastMessageAt: new Date(),
      });

      // Emit message via socket
      const messageResponse = await this.transformMessage(message.toObject());
      await chatService.emitMessageAndUpdateConversation(
        channel!,
        conversation._id.toString(),
        messageResponse,
        currentUserId
      );
    }

    // Get the created conversation with populated data
    const createdConversation = await ChatConversationModel.findById(conversation._id)
      .populate("lastMessageId")
      .lean();

    const lastMessage = createdConversation?.lastMessageId
      ? await this.transformMessage(createdConversation.lastMessageId)
      : undefined;

    // Populate participants with user info
    const populatedParticipants = await Promise.all(
      participants.map(async (p: any) => {
        const user = await UserModel.findById(p.userId)
          .select("name fullName email avatar role")
          .lean();
        return {
          userId: p.userId.toString(),
          name: user?.fullName || user?.name || user?.email || p.name,
          avatar: user?.avatar || p.avatar,
          role: user?.role || p.role,
        };
      })
    );

    // Calculate unread counts for the conversation
    // unreadCountMe: messages from others that current user hasn't read
    const unreadCountMe = await ChatMessageModel.countDocuments({
      conversationId: conversation._id,
      isRead: false,
      senderId: userIdFilters.senderIsNotUser,
    });

    // unreadCountTo: messages from current user that others haven't read
    const unreadCountTo = await ChatMessageModel.countDocuments({
      conversationId: conversation._id,
      isRead: false,
      senderId: userIdFilters.senderIsUser,
    });

    const response: ChatConversationResponse = {
      _id: conversation._id.toString(),
      participants: populatedParticipants,
      lastMessage,
      unreadCountMe,
      unreadCountTo,
      unreadCount: unreadCountMe, // Backward compatibility
      type: conversationType,
      channel: channel,
      metadata: metadata,
      createdAt: conversation.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: conversation.updatedAt?.toISOString() || new Date().toISOString(),
    };

    // Emit conversation update to all participants so they receive the new conversation
    if (channel) {
      await chatService.emitConversationUpdate({
        channel,
        conversationId: conversation._id.toString(),
      });
    }

    return { ok: true as const, data: response };
  }

  // Get conversation detail
  static async getConversation(req: AuthenticatedRequest, conversationId: string) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }
    const userIdFilters = this.buildUserIdMatchingFilters(userId);
    const currentUserId = userIdFilters.userIdStr;

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

    // Calculate unreadCountMe: messages from others that current user hasn't read
    const unreadCountMe = await ChatMessageModel.countDocuments({
      conversationId,
      isRead: false,
      senderId: userIdFilters.senderIsNotUser,
    });

    // Calculate unreadCountTo: messages from current user that others haven't read
    const unreadCountTo = await ChatMessageModel.countDocuments({
      conversationId,
      isRead: false,
      senderId: userIdFilters.senderIsUser,
    });

    // Populate participants
    const populatedParticipants = await Promise.all(
      (conversation as any).participants.map(async (p: any) => {
        if (p.userId.toString() === currentUserId) {
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
      unreadCountMe,
      unreadCountTo,
      unreadCount: unreadCountMe, // Backward compatibility
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
    const userIdFilters = this.buildUserIdMatchingFilters(userId);
    const currentUserId = userIdFilters.userIdStr;

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

    // Process metadata - ensure product info is preserved
    const messageMetadata = data.metadata || {};
    
    // Check if this is an AI message (for AI conversations)
    // IMPORTANT: Only consider it AI message if explicitly marked as isAiMessage === true
    // User messages should NOT have isAiMessage set, or should have isAiMessage === false
    const isAiMessage = messageMetadata.isAiMessage === true;
    
    // Get sender info - for AI messages, use AI info
    let senderName: string;
    let senderAvatar: string | undefined;
    
    if (isAiMessage && conversation.type === "ai") {
      // AI message - use AI info
      senderName = "Chatbot";
      senderAvatar = undefined; // Will use default AI avatar in frontend
    } else {
      // User message - use user info
      const sender = await UserModel.findById(userId).select("name fullName email avatar role").lean();
      senderName = sender?.fullName || sender?.name || sender?.email || "User";
      senderAvatar = sender?.avatar || undefined;
    }
    
    // If metadata contains product info, ensure it's properly structured
    if (messageMetadata.productId) {
      // Log product metadata for tracking (optional)
      console.log(`[Chat] Message with product metadata:`, {
        conversationId,
        productId: messageMetadata.productId,
        productName: messageMetadata.productName,
        shopId: messageMetadata.shopId,
      });
    }

    // Determine message type based on metadata
    let messageType: "text" | "product" | "call" | "image" | "file" = data.type || "text";
    
    // Auto-detect type from metadata if not provided
    if (!data.type && messageMetadata.productId) {
      messageType = "product";
    }

    // Ensure message has a value (empty string is allowed if attachments exist)
    const messageText = data.message != null ? String(data.message) : "";
    
    // For AI messages, we still use a valid ObjectId but mark it clearly in metadata
    // We'll use a special ObjectId that represents AI (000000000000000000000000)
    // Or better: use conversationId as a base to create a deterministic but valid ObjectId
    // Actually, simplest: use userId but rely on metadata.isAiMessage and senderName to identify
    // For AI messages in AI conversations, we'll use a special approach:
    // - Keep using userIdFilters.normalizedUserId (valid ObjectId)
    // - But set senderName = "Chatbot" and metadata.isAiMessage = true
    // - Frontend will check metadata.isAiMessage and senderName to determine if it's AI
    
    // Create message
    const message = await ChatMessageModel.create({
      conversationId,
      senderId: userIdFilters.normalizedUserId, // Always use valid ObjectId
      senderName: senderName,
      senderAvatar: senderAvatar,
      message: messageText, // Can be empty string if attachments exist
      type: messageType,
      attachments: data.attachments || [],
      metadata: { ...messageMetadata, isAiMessage: isAiMessage }, // Store metadata including AI flag
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

    // Emit message via socket
    const channel = conversation.channel || "shop";
    await chatService.emitMessageAndUpdateConversation(
      channel,
      conversationId,
      response,
      currentUserId
    );

    return { ok: true as const, data: response };
  }

  // Mark conversation as read
  static async markAsRead(req: AuthenticatedRequest, conversationId: string) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }
    const userIdFilters = this.buildUserIdMatchingFilters(userId);

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
    const updateResult = await ChatMessageModel.updateMany(
      {
        conversationId,
        senderId: userIdFilters.senderIsNotUser,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      }
    );

    // Emit conversation update via socket
    const channel = conversation.channel || "shop";
    await chatService.emitConversationUpdate({ channel, conversationId });

    return { ok: true as const };
  }

  // Mark conversation as delivered
  static async markAsDelivered(req: AuthenticatedRequest, conversationId: string) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }
    const userIdFilters = this.buildUserIdMatchingFilters(userId);

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
    const updateResult = await ChatMessageModel.updateMany(
      {
        conversationId,
        senderId: userIdFilters.senderIsNotUser,
        isDelivered: false,
      },
      {
        isDelivered: true,
        deliveredAt: new Date(),
      }
    );

    // Emit conversation update via socket
    const channel = conversation.channel || "shop";
    await chatService.emitConversationUpdate({ channel, conversationId });

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
      type: msg.type || "text", // Include message type
      attachments: msg.attachments || [],
      metadata: msg.metadata || {},
      isRead: msg.isRead || false,
      isDelivered: msg.isDelivered || false,
      createdAt: msg.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: msg.updatedAt?.toISOString(),
    };
  }

  private static buildUserIdMatchingFilters(userId: string) {
    const userIdStr = String(userId);
    const variants: (string | Types.ObjectId)[] = [userIdStr];
    const isValidObjectId = Types.ObjectId.isValid(userIdStr);

    if (isValidObjectId) {
      variants.push(new Types.ObjectId(userIdStr));
    }

    return {
      userIdStr,
      normalizedUserId: isValidObjectId ? new Types.ObjectId(userIdStr) : userIdStr,
      senderIsUser: { $in: variants },
      senderIsNotUser: { $nin: variants },
    };
  }
}

