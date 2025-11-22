import { Namespace, Server, Socket } from "socket.io";
import {
  SOCKET_CHAT_CHANNELS,
  SOCKET_EVENTS,
  SOCKET_NAMESPACES,
  SocketChatChannel,
  buildChatConversationRoom,
  buildDirectUserRoom,
} from "../../shared/config/socket";
import {
  SocketAuthMiddleware,
  SocketAuthedUser,
  getSocketUser,
} from "../types";

const CHANNEL_TO_NAMESPACE: Record<SocketChatChannel, string> = {
  [SOCKET_CHAT_CHANNELS.ADMIN]: SOCKET_NAMESPACES.ADMIN_CHAT,
  [SOCKET_CHAT_CHANNELS.SHOP]: SOCKET_NAMESPACES.SHOP_CHAT,
  [SOCKET_CHAT_CHANNELS.AI]: SOCKET_NAMESPACES.AI_CHAT,
};

export interface ChatNamespaceOptions {
  channel: SocketChatChannel;
  debug?: boolean;
  allowedRoles?: readonly string[];
}

export interface ChatMessagePayload {
  conversationId?: string; // Optional - will create conversation if not provided
  message: string;
  type?: "text" | "product" | "call" | "image" | "file"; // Message type for rendering
  attachments?: Array<{
    id?: string;
    url: string;
    type: string;
  }>;
  metadata?: Record<string, unknown>;
  // For creating new conversation
  conversationType?: "admin" | "shop"; // Conversation type (renamed to avoid conflict)
  targetId?: string; // shopId if conversationType is "shop"
}

const ensureAuthenticated = (
  socket: Socket,
  namespace: Namespace
): SocketAuthedUser => {
  const socketUser = getSocketUser(socket);

  if (!socketUser) {
    socket.emit(SOCKET_EVENTS.ERROR, { message: "Unauthorized chat socket" });
    socket.disconnect(true);
    throw new Error("Unauthorized chat socket");
  }

  return socketUser;
};

export const registerChatNamespace = (
  io: Server,
  authMiddleware: SocketAuthMiddleware,
  options: ChatNamespaceOptions
) => {
  const namespacePath = CHANNEL_TO_NAMESPACE[options.channel];
  const namespace = io.of(namespacePath);
  namespace.use(authMiddleware);

  namespace.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    const socketUser = ensureAuthenticated(socket, namespace);

    if (
      options.allowedRoles &&
      (!socketUser.role || !options.allowedRoles.includes(socketUser.role))
    ) {
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: "Forbidden: role not allowed in chat channel",
      });
      socket.disconnect(true);
      return;
    }

    const directRoom = buildDirectUserRoom(socketUser.userId);
    socket.join(directRoom);

    if (options.debug) {
      console.log(
        `[socket][${options.channel}] user ${socketUser.userId} connected (${socket.id})`
      );
    }

    socket.emit(SOCKET_EVENTS.SYSTEM_READY, {
      namespace: namespacePath,
      channel: options.channel,
      rooms: [directRoom],
    });

    const joinConversation = (conversationId?: string) => {
      if (!conversationId) return;
      const room = buildChatConversationRoom(options.channel, conversationId);
      socket.join(room);

      if (options.debug) {
        console.log(
          `[socket][${options.channel}] user ${socketUser.userId} joined ${room}`
        );
      }

      socket.emit(SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, {
        conversationId,
        room,
      });
    };

    const leaveConversation = (conversationId?: string) => {
      if (!conversationId) return;
      const room = buildChatConversationRoom(options.channel, conversationId);
      socket.leave(room);

      if (options.debug) {
        console.log(
          `[socket][${options.channel}] user ${socketUser.userId} left ${room}`
        );
      }

      socket.emit(SOCKET_EVENTS.CHAT_CONVERSATION_LEAVE, {
        conversationId,
        room,
      });
    };

    socket.on(
      SOCKET_EVENTS.CHAT_CONVERSATION_JOIN,
      ({ conversationId }: { conversationId?: string }) => {
        joinConversation(conversationId);
      }
    );

    socket.on(
      SOCKET_EVENTS.CHAT_CONVERSATION_LEAVE,
      ({ conversationId }: { conversationId?: string }) => {
        leaveConversation(conversationId);
      }
    );

    socket.on(SOCKET_EVENTS.ROOM_JOIN, (room: string) => {
      if (room) {
        socket.join(room);
      }
    });

    socket.on(SOCKET_EVENTS.ROOM_LEAVE, (room: string) => {
      if (room) {
        socket.leave(room);
      }
    });

    socket.on(
      SOCKET_EVENTS.CHAT_MESSAGE_SEND,
      async (payload: ChatMessagePayload) => {
        if (!payload?.message) {
          socket.emit(SOCKET_EVENTS.ERROR, { message: "Message is required" });
          return;
        }

        try {
          // Import ChatService dynamically to avoid circular dependency
          const ChatService = (await import("../../features/chat/chat.service")).default;
          const UserModel = (await import("../../models/UserModel")).default;
          const ChatConversationModel = (await import("../../models/ChatConversation")).default;
          const ChatMessageModel = (await import("../../models/ChatMessage")).default;
          const ShopModel = (await import("../../models/ShopModel")).default;

          let conversationId = payload.conversationId;

          // If no conversationId, create a new conversation
          if (!conversationId) {
            const currentUser = await UserModel.findById(socketUser.userId)
              .select("name fullName email avatar role")
              .lean();

            if (!currentUser) {
              socket.emit(SOCKET_EVENTS.ERROR, { message: "User not found" });
              return;
            }

            let participants: any[] = [
              {
                userId: socketUser.userId,
                name: currentUser.fullName || currentUser.name || currentUser.email,
                avatar: currentUser.avatar,
                role: currentUser.role,
              },
            ];

            let conversationType: "admin" | "shop" | "direct" = "direct";
            let channel: "admin" | "shop" | "ai" = options.channel;
            let metadata = payload.metadata || {};

            // Use conversationType from payload, fallback to type for backward compatibility
            const convType = payload.conversationType || (payload.type as any);

            if (convType === "admin") {
              // Find an admin user
              const admin = await UserModel.findOne({ role: { $in: ["admin", "moderator"] } })
                .select("_id name fullName email avatar role")
                .lean();

              if (!admin) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: "Không tìm thấy admin để chat" });
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
            } else if (convType === "shop" && payload.targetId) {
              // Find shop owner
              const shop = await ShopModel.findById(payload.targetId)
                .populate("userId", "name fullName email avatar role")
                .lean();

              if (!shop) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: "Cửa hàng không tồn tại" });
                return;
              }

              const shopOwner = shop.userId as any;
              if (!shopOwner) {
                socket.emit(SOCKET_EVENTS.ERROR, { message: "Chủ cửa hàng không tồn tại" });
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
            } else {
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
              } else {
                socket.emit(SOCKET_EVENTS.ERROR, { message: "Không thể tạo cuộc trò chuyện" });
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
            } else {
              // Create new conversation
              const conversation = await ChatConversationModel.create({
                participants,
                type: conversationType,
                channel,
                metadata,
              });
              conversationId = conversation._id.toString();
            }
          }

          // Verify conversation exists and user is participant
          const conversation = await ChatConversationModel.findOne({
            _id: conversationId,
            "participants.userId": socketUser.userId,
          });

          if (!conversation) {
            socket.emit(SOCKET_EVENTS.ERROR, { message: "Cuộc trò chuyện không tồn tại" });
            return;
          }

          // Get sender info
          const sender = await UserModel.findById(socketUser.userId)
            .select("name fullName email avatar role")
            .lean();

          // Determine message type
          let messageType: "text" | "product" | "call" | "image" | "file" = payload.type || "text";
          
          // Auto-detect type from metadata if not provided
          if (!payload.type && payload.metadata?.productId) {
            messageType = "product";
          }

          // Create message in database
          const message = await ChatMessageModel.create({
            conversationId,
            senderId: socketUser.userId,
            senderName: sender?.fullName || sender?.name || sender?.email,
            senderAvatar: sender?.avatar,
            message: payload.message,
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
          const room = buildChatConversationRoom(options.channel, conversationId);
          socket.join(room);

          // Transform message for socket
          const messageResponse = {
            _id: message._id.toString(),
            conversationId: conversationId,
            senderId: socketUser.userId,
            senderName: sender?.fullName || sender?.name || sender?.email,
            senderAvatar: sender?.avatar,
            message: payload.message,
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

          namespace.to(room).emit(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, enrichedPayload);

          // Also emit conversation update
          const updatedConversation = await ChatConversationModel.findById(conversationId)
            .populate("lastMessageId")
            .lean();

          if (updatedConversation) {
            // Get unread count
            const unreadCount = await ChatMessageModel.countDocuments({
              conversationId,
              isRead: false,
              senderId: { $ne: socketUser.userId as any },
            });

            // Populate participants
            const populatedParticipants = await Promise.all(
              updatedConversation.participants.map(async (p: any) => {
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

            const conversationResponse = {
              _id: updatedConversation._id.toString(),
              participants: populatedParticipants,
              lastMessage: messageResponse,
              unreadCount,
              type: updatedConversation.type || "direct",
              channel: updatedConversation.channel ? String(updatedConversation.channel) : undefined,
              metadata: updatedConversation.metadata || {},
              createdAt: updatedConversation.createdAt?.toISOString() || new Date().toISOString(),
              updatedAt: updatedConversation.updatedAt?.toISOString() || new Date().toISOString(),
            };

            namespace.to(room).emit(SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, {
              conversationId,
              conversation: conversationResponse,
            });

            // Also emit to each participant's direct room
            populatedParticipants.forEach((participant) => {
              const userRoom = buildDirectUserRoom(participant.userId);
              namespace.to(userRoom).emit(SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, {
                conversationId,
                conversation: conversationResponse,
              });
            });
          }
        } catch (error: any) {
          console.error("[Chat Socket] Error sending message:", error);
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: error.message || "Lỗi khi gửi tin nhắn",
          });
        }
      }
    );

    socket.on(
      SOCKET_EVENTS.CHAT_TYPING,
      (payload: { conversationId?: string; isTyping?: boolean }) => {
        if (!payload?.conversationId) return;
        const room = buildChatConversationRoom(
          options.channel,
          payload.conversationId
        );
        socket.to(room).emit(SOCKET_EVENTS.CHAT_TYPING, {
          ...payload,
          userId: socketUser.userId,
          channel: options.channel,
        });
      }
    );

    socket.on(
      SOCKET_EVENTS.CHAT_SEEN,
      (payload: { conversationId?: string; messageId?: string }) => {
        if (!payload?.conversationId || !payload?.messageId) return;
        const room = buildChatConversationRoom(
          options.channel,
          payload.conversationId
        );
        socket.to(room).emit(SOCKET_EVENTS.CHAT_SEEN, {
          ...payload,
          userId: socketUser.userId,
        });
      }
    );

    socket.on(
      SOCKET_EVENTS.CHAT_DELIVERED,
      (payload: { conversationId?: string; messageId?: string }) => {
        if (!payload?.conversationId || !payload?.messageId) return;
        const room = buildChatConversationRoom(
          options.channel,
          payload.conversationId
        );
        socket.to(room).emit(SOCKET_EVENTS.CHAT_DELIVERED, {
          ...payload,
          userId: socketUser.userId,
        });
      }
    );

    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      if (options.debug) {
        console.log(
          `[socket][${options.channel}] user ${socketUser.userId} disconnected (${reason})`
        );
      }
    });
  });

  return namespace;
};


