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
 */
const transformConversation = async (
  conversation: any
): Promise<ChatConversationResponse> => {
  // Get unread count
  const unreadCount = await ChatMessageModel.countDocuments({
    conversationId: conversation._id,
    isRead: false,
  });

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
   */
  async emitConversationUpdate(options: EmitConversationUpdateOptions) {
    const { channel, conversationId } = options;

    const conversation = await ChatConversationModel.findById(conversationId)
      .populate("lastMessageId")
      .lean();

    if (!conversation) {
      return;
    }

    // Get unread count
    const unreadCount = await ChatMessageModel.countDocuments({
      conversationId,
      isRead: false,
    });

    const conversationResponse = await transformConversation({
      ...conversation,
      unreadCount,
    });

    emitConversationUpdate(channel, conversationResponse);
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

