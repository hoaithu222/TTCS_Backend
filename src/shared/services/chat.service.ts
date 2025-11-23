import ChatConversationModel from "../../models/ChatConversation";
import ChatMessageModel from "../../models/ChatMessage";
import {
  SOCKET_EVENTS,
  SOCKET_NAMESPACES,
  SOCKET_CHAT_CHANNELS,
  buildChatConversationRoom,
  buildDirectUserRoom,
} from "../config/socket";
import { getSocketServer } from "../config/socket-server";
import UserModel from "../../models/UserModel";
import type { ChatMessageResponse, ChatConversationResponse } from "../../features/chat/types";

/**
 * Emit chat message to conversation room
 */
const emitChatMessage = (
  channel: string,
  conversationId: string,
  message: ChatMessageResponse,
  senderId: string
) => {
  const io = getSocketServer();
  if (!io) return;

  const namespacePath = getNamespaceForChannel(channel);
  if (!namespacePath) return;

  const namespace = io.of(namespacePath);
  const room = buildChatConversationRoom(channel as any, conversationId);

  // Emit to conversation room
  namespace.to(room).emit(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, {
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
  ChatConversationModel.findById(conversationId)
    .select("participants")
    .lean()
    .then((conversation) => {
      if (conversation) {
        conversation.participants.forEach((p: any) => {
          const userId = p.userId?.toString() || p.userId;
          if (userId && userId !== senderId) {
            const userRoom = buildDirectUserRoom(userId);
            namespace.to(userRoom).emit(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, {
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
const emitConversationUpdate = (
  channel: string,
  conversation: ChatConversationResponse
) => {
  const io = getSocketServer();
  if (!io) return;

  const namespacePath = getNamespaceForChannel(channel);
  if (!namespacePath) return;

  const namespace = io.of(namespacePath);
  const room = buildChatConversationRoom(channel as any, conversation._id);

  // Emit to conversation room
  const conversationPayload = {
    conversationId: conversation._id,
    conversation,
  };
  
  namespace.to(room).emit(SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, conversationPayload);
  
  console.log(`[Chat Service] Emitted conversation update to room ${room} for conversation ${conversation._id}`);

  // Also emit to each participant's direct room
  conversation.participants.forEach((participant) => {
    const userRoom = buildDirectUserRoom(participant.userId);
    namespace.to(userRoom).emit(SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, conversationPayload);
    console.log(`[Chat Service] Emitted conversation update to user room ${userRoom} for user ${participant.userId}`);
  });
};

/**
 * Get namespace path for channel
 */
const getNamespaceForChannel = (channel: string): string | null => {
  switch (channel) {
    case SOCKET_CHAT_CHANNELS.ADMIN:
      return SOCKET_NAMESPACES.ADMIN_CHAT;
    case SOCKET_CHAT_CHANNELS.SHOP:
      return SOCKET_NAMESPACES.SHOP_CHAT;
    case SOCKET_CHAT_CHANNELS.AI:
      return SOCKET_NAMESPACES.AI_CHAT;
    default:
      return null;
  }
};

/**
 * Transform conversation to response format
 * @param conversation - Conversation data
 * @param userId - Optional userId to calculate unreadCountMe and unreadCountTo for specific user
 */
const transformConversation = async (
  conversation: any,
  userId?: string
): Promise<ChatConversationResponse> => {
  // Calculate unread counts for specific user if userId is provided
  let unreadCountMe = 0;
  let unreadCountTo = 0;
  
  if (userId) {
    // Ensure conversationId and userId are properly formatted
    const conversationId = conversation._id?.toString() || conversation._id;
    // Convert userId to string to ensure consistent comparison with senderId (ObjectId)
    const userIdStr = String(userId);
    
    // unreadCountMe: messages from others that current user hasn't read
    // senderId != userId means messages from other participants
    unreadCountMe = await ChatMessageModel.countDocuments({
      conversationId: conversationId,
      isRead: false,
      senderId: { $ne: userIdStr as any },
    });
    
    // unreadCountTo: messages from current user that others haven't read
    // This counts messages sent by current user that are still unread
    // Note: This is a simplified approach - in a multi-user chat, isRead is global
    // For accurate per-user read status, you'd need a readBy array in the message model
    unreadCountTo = await ChatMessageModel.countDocuments({
      conversationId: conversationId,
      isRead: false,
      senderId: userIdStr as any,
    });
  } else if (conversation.unreadCountMe !== undefined && conversation.unreadCountTo !== undefined) {
    // Use provided counts if available
    unreadCountMe = conversation.unreadCountMe;
    unreadCountTo = conversation.unreadCountTo;
  } else if (conversation.unreadCount !== undefined) {
    // Fallback: use unreadCount as unreadCountMe (backward compatibility)
    unreadCountMe = conversation.unreadCount;
    unreadCountTo = 0;
  } else {
    // Fallback: count all unread messages (should be avoided, but kept for backward compatibility)
    const conversationId = conversation._id?.toString() || conversation._id;
    unreadCountMe = await ChatMessageModel.countDocuments({
      conversationId: conversationId,
      isRead: false,
    });
    unreadCountTo = 0;
  }

  const lastMessage = conversation.lastMessageId
    ? await transformMessage(conversation.lastMessageId)
    : undefined;

  // Populate participants
  const populatedParticipants = await Promise.all(
    conversation.participants.map(async (p: any) => {
      if (p.userId && typeof p.userId === "object") {
        return {
          userId: p.userId._id?.toString() || p.userId.toString(),
          name: p.name || p.userId.fullName || p.userId.name || p.userId.email,
          avatar: p.avatar || p.userId.avatar,
          role: p.role || p.userId.role,
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
};

/**
 * Transform message to response format
 */
const transformMessage = async (msg: any): Promise<ChatMessageResponse> => {
  if (!msg) return null as any;

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
};

export interface EmitMessageOptions {
  channel: string;
  conversationId: string;
  message: ChatMessageResponse;
  senderId: string;
}

export interface EmitConversationUpdateOptions {
  channel: string;
  conversationId: string;
}

export const chatService = {
  /**
   * Emit a new message to conversation participants via socket
   */
  async emitMessage(options: EmitMessageOptions) {
    const { channel, conversationId, message, senderId } = options;
    emitChatMessage(channel, conversationId, message, senderId);
  },

  /**
   * Emit conversation update to participants
   * Calculates unread count for each participant separately
   */
  async emitConversationUpdate(options: EmitConversationUpdateOptions) {
    const { channel, conversationId } = options;

    const conversation = await ChatConversationModel.findById(conversationId)
      .populate("lastMessageId")
      .lean();

    if (!conversation) {
      return;
    }

    const participants = conversation.participants || [];
    const namespacePath = getNamespaceForChannel(channel);
    if (!namespacePath) return;

    const io = getSocketServer();
    if (!io) return;

    const namespace = io.of(namespacePath);
    const room = buildChatConversationRoom(channel as any, conversationId);

    // Emit conversation update for each participant with their own unread count
    for (const participant of participants) {
      // Handle both ObjectId and string formats
      let userId: string;
      if (!participant.userId) continue;
      
      if (typeof participant.userId === 'object' && participant.userId._id) {
        userId = participant.userId._id.toString();
      } else if (typeof participant.userId === 'object') {
        userId = participant.userId.toString();
      } else {
        userId = String(participant.userId);
      }
      
      if (!userId) continue;

      // Transform conversation with userId to calculate correct unreadCount for this user
      const conversationResponse = await transformConversation(conversation, userId);

      // Debug logging
      console.log(`[Chat Service] Emitting conversation update for user ${userId}:`, {
        conversationId: conversationResponse._id,
        unreadCountMe: conversationResponse.unreadCountMe,
        unreadCountTo: conversationResponse.unreadCountTo,
        unreadCount: conversationResponse.unreadCount,
      });

      // Emit to this specific user's direct room
      const userRoom = buildDirectUserRoom(userId);
      namespace.to(userRoom).emit(SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, {
        conversationId: conversationResponse._id,
        conversation: conversationResponse,
      });
    }
  },

  /**
   * Emit message and update conversation after sending a message
   * This should be called after ChatService.sendMessage
   */
  async emitMessageAndUpdateConversation(
    channel: string,
    conversationId: string,
    message: ChatMessageResponse,
    senderId: string
  ) {
    // Emit the message
    emitChatMessage(channel, conversationId, message, senderId);

    // Update and emit conversation
    await this.emitConversationUpdate({ channel, conversationId });
  },

  /**
   * Emit typing indicator
   */
  emitTyping(
    channel: string,
    conversationId: string,
    userId: string,
    isTyping: boolean
  ) {
    const io = getSocketServer();
    if (!io) return;

    const namespacePath = getNamespaceForChannel(channel);
    if (!namespacePath) return;

    const namespace = io.of(namespacePath);
    const room = buildChatConversationRoom(channel as any, conversationId);

    namespace.to(room).emit(SOCKET_EVENTS.CHAT_TYPING, {
      conversationId,
      userId,
      isTyping,
      channel,
    });
  },

  /**
   * Emit message delivered status
   */
  emitDelivered(
    channel: string,
    conversationId: string,
    messageId: string,
    userId: string
  ) {
    const io = getSocketServer();
    if (!io) return;

    const namespacePath = getNamespaceForChannel(channel);
    if (!namespacePath) return;

    const namespace = io.of(namespacePath);
    const room = buildChatConversationRoom(channel as any, conversationId);

    namespace.to(room).emit(SOCKET_EVENTS.CHAT_DELIVERED, {
      conversationId,
      messageId,
      userId,
    });
  },

  /**
   * Emit message read status
   */
  emitSeen(
    channel: string,
    conversationId: string,
    messageId: string,
    userId: string
  ) {
    const io = getSocketServer();
    if (!io) return;

    const namespacePath = getNamespaceForChannel(channel);
    if (!namespacePath) return;

    const namespace = io.of(namespacePath);
    const room = buildChatConversationRoom(channel as any, conversationId);

    namespace.to(room).emit(SOCKET_EVENTS.CHAT_SEEN, {
      conversationId,
      messageId,
      userId,
    });
  },
};

