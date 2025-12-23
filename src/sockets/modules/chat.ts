import { Namespace, Server, Socket } from 'socket.io';
import {
  SOCKET_CHAT_CHANNELS,
  SOCKET_EVENTS,
  SOCKET_NAMESPACES,
  SocketChatChannel,
  buildChatConversationRoom,
  buildDirectUserRoom,
} from '../../shared/config/socket';
import {
  SocketAuthMiddleware,
  SocketAuthedUser,
  getSocketUser,
} from '../types';

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
  type?: 'text' | 'product' | 'call' | 'image' | 'file'; // Message type for rendering
  attachments?: Array<{
    id?: string;
    url: string;
    type: string;
  }>;
  metadata?: Record<string, unknown>;
  // For creating new conversation
  conversationType?: 'admin' | 'shop'; // Conversation type (renamed to avoid conflict)
  targetId?: string; // shopId if conversationType is "shop"
}

const ensureAuthenticated = (
  socket: Socket,
  namespace: Namespace
): SocketAuthedUser => {
  const socketUser = getSocketUser(socket);

  if (!socketUser) {
    socket.emit(SOCKET_EVENTS.ERROR, { message: 'Unauthorized chat socket' });
    socket.disconnect(true);
    throw new Error('Unauthorized chat socket');
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
        message: 'Forbidden: role not allowed in chat channel',
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
        // Allow empty message if there are attachments
        const hasAttachments =
          payload.attachments && payload.attachments.length > 0;
        if (!payload?.message && !hasAttachments) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: 'Message or attachment is required',
          });
          return;
        }

        try {
          // Import ChatService dynamically to avoid circular dependency
          const ChatService = (await import('../../features/chat/chat.service'))
            .default;
          const UserModel = (await import('../../models/UserModel')).default;
          const ChatConversationModel = (
            await import('../../models/ChatConversation')
          ).default;
          const ChatMessageModel = (await import('../../models/ChatMessage'))
            .default;
          const ShopModel = (await import('../../models/ShopModel')).default;

          let conversationId = payload.conversationId;

          // If no conversationId, create a new conversation
          if (!conversationId) {
            const currentUser = await UserModel.findById(socketUser.userId)
              .select('name fullName email avatar role')
              .lean();

            if (!currentUser) {
              socket.emit(SOCKET_EVENTS.ERROR, { message: 'User not found' });
              return;
            }

            let participants: any[] = [
              {
                userId: socketUser.userId,
                name:
                  currentUser.fullName || currentUser.name || currentUser.email,
                avatar: currentUser.avatar,
                role: currentUser.role,
              },
            ];

            let conversationType: 'admin' | 'shop' | 'direct' = 'direct';
            let channel: 'admin' | 'shop' | 'ai' = options.channel;
            let metadata = payload.metadata || {};

            // Use conversationType from payload, fallback to type for backward compatibility
            const convType = payload.conversationType || (payload.type as any);

            if (convType === 'admin') {
              // Find an admin user
              const admin = await UserModel.findOne({
                role: { $in: ['admin', 'moderator'] },
              })
                .select('_id name fullName email avatar role')
                .lean();

              if (!admin) {
                socket.emit(SOCKET_EVENTS.ERROR, {
                  message: 'Không tìm thấy admin để chat',
                });
                return;
              }

              participants.push({
                userId: admin._id,
                name: admin.fullName || admin.name || admin.email,
                avatar: admin.avatar,
                role: admin.role,
              });

              conversationType = 'admin';
              channel = 'admin';
              metadata.context = metadata.context || 'CSKH';
              metadata.isSupport = true;
            } else if (convType === 'shop' && payload.targetId) {
              // Find shop owner
              const shop = await ShopModel.findById(payload.targetId)
                .populate('userId', 'name fullName email avatar role logo')
                .lean();

              if (!shop) {
                socket.emit(SOCKET_EVENTS.ERROR, {
                  message: 'Cửa hàng không tồn tại',
                });
                return;
              }

              const shopOwner = shop.userId as any;
              if (!shopOwner) {
                socket.emit(SOCKET_EVENTS.ERROR, {
                  message: 'Chủ cửa hàng không tồn tại',
                });
                return;
              }

              participants.push({
                userId: shopOwner._id,
                name: shop.name,
                avatar: shop.logo,
                role: 'shop',
              });

              conversationType = 'shop';
              channel = options.channel;
              metadata.shopId = payload.targetId;
              metadata.shopName = shop.name;
            } else {
              // Default to admin chat if no type specified
              const admin = await UserModel.findOne({
                role: { $in: ['admin', 'moderator'] },
              })
                .select('_id name fullName email avatar role')
                .lean();

              if (admin) {
                participants.push({
                  userId: admin._id,
                  name: admin.fullName || admin.name || admin.email,
                  avatar: admin.avatar,
                  role: admin.role,
                });
                conversationType = 'admin';
                channel = 'admin';
                metadata.context = 'CSKH';
                metadata.isSupport = true;
              } else {
                socket.emit(SOCKET_EVENTS.ERROR, {
                  message: 'Không thể tạo cuộc trò chuyện',
                });
                return;
              }
            }

            // Check if conversation already exists
            const existingConversation = await ChatConversationModel.findOne({
              'participants.userId': {
                $all: participants.map((p) => p.userId),
              },
              type: conversationType,
              channel: channel,
              ...(convType === 'shop' && payload.targetId
                ? { 'metadata.shopId': payload.targetId }
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

              // Emit conversationId back to sender when creating new conversation via CHAT_CONVERSATION_JOIN
              // This will be handled by the conversation update emit below
            }
          }

          // Verify conversation exists and user is participant
          const conversation = await ChatConversationModel.findOne({
            _id: conversationId,
            'participants.userId': socketUser.userId,
          });

          if (!conversation) {
            socket.emit(SOCKET_EVENTS.ERROR, {
              message: 'Cuộc trò chuyện không tồn tại',
            });
            return;
          }

          // Get sender info
          const sender = await UserModel.findById(socketUser.userId)
            .select('name fullName email avatar role')
            .lean();

          // Determine message type
          let messageType: 'text' | 'product' | 'call' | 'image' | 'file' =
            payload.type || 'text';

          // Auto-detect type from metadata if not provided
          if (!payload.type && payload.metadata?.productId) {
            messageType = 'product';
          }

          // Ensure message has a value (empty string is allowed if attachments exist)
          const messageText =
            payload.message != null ? String(payload.message) : '';

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
          const room = buildChatConversationRoom(
            options.channel,
            conversationId
          );
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

          namespace
            .to(room)
            .emit(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, enrichedPayload);

          // Also emit conversation update
          const updatedConversation = await ChatConversationModel.findById(
            conversationId
          )
            .populate('lastMessageId')
            .lean();

          if (updatedConversation) {
            // Populate participants
            const populatedParticipants = await Promise.all(
              updatedConversation.participants.map(async (p: any) => {
                const user = await UserModel.findById(p.userId)
                  .select('name fullName email avatar role')
                  .lean();
                return {
                  userId: p.userId.toString(),
                  name: user?.fullName || user?.name || user?.email || p.name,
                  avatar: user?.avatar || p.avatar,
                  role: user?.role || p.role,
                };
              })
            );

            // Emit conversation update for each participant with their own unread counts
            for (const participant of populatedParticipants) {
              const participantUserId = participant.userId;

              // Calculate unreadCountMe: messages from others that this participant hasn't read
              const unreadCountMe = await ChatMessageModel.countDocuments({
                conversationId,
                isRead: false,
                senderId: { $ne: participantUserId as any },
              });

              // Calculate unreadCountTo: messages from this participant that others haven't read
              const unreadCountTo = await ChatMessageModel.countDocuments({
                conversationId,
                isRead: false,
                senderId: participantUserId as any,
              });

              const conversationResponse = {
                _id: updatedConversation._id.toString(),
                participants: populatedParticipants,
                lastMessage: messageResponse,
                unreadCountMe, // Messages from others that this user hasn't read
                unreadCountTo, // Messages from this user that others haven't read
                unreadCount: unreadCountMe, // Backward compatibility
                type: updatedConversation.type || 'direct',
                channel: updatedConversation.channel
                  ? String(updatedConversation.channel)
                  : undefined,
                metadata: updatedConversation.metadata || {},
                createdAt:
                  updatedConversation.createdAt?.toISOString() ||
                  new Date().toISOString(),
                updatedAt:
                  updatedConversation.updatedAt?.toISOString() ||
                  new Date().toISOString(),
              };

              // Emit to this specific user's direct room
              const userRoom = buildDirectUserRoom(participantUserId);
              namespace
                .to(userRoom)
                .emit(SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, {
                  conversationId,
                  conversation: conversationResponse,
                });
            }

            // DON'T emit to conversation room with unreadCount
            // Each user already receives correct unreadCount via their direct room above
            // Emitting to conversation room would cause all users to receive wrong unreadCount
          }
        } catch (error: any) {
          console.error('[Chat Socket] Error sending message:', error);
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: error.message || 'Lỗi khi gửi tin nhắn',
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

    // ============= CALL EVENTS HANDLERS =============

    // Handle call initiation
    socket.on(
      SOCKET_EVENTS.CALL_INITIATE,
      async (payload: {
        conversationId: string;
        callType: 'voice' | 'video';
        metadata?: Record<string, any>;
      }) => {
        if (!payload?.conversationId || !payload?.callType) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: 'conversationId and callType are required',
          });
          return;
        }

        try {
          const ChatConversationModel = (
            await import('../../models/ChatConversation')
          ).default;
          const ChatMessageModel = (await import('../../models/ChatMessage'))
            .default;
          const UserModel = (await import('../../models/UserModel')).default;

          // Verify conversation exists and user is participant
          const conversation = await ChatConversationModel.findOne({
            _id: payload.conversationId,
            'participants.userId': socketUser.userId,
          });

          if (!conversation) {
            socket.emit(SOCKET_EVENTS.ERROR, {
              message: 'Conversation not found',
            });
            return;
          }

          // Generate unique call ID
          const callId = `call_${Date.now()}_${Math.random()
            .toString(36)
            .substring(7)}`;

          // Find receiver (the other participant)
          const receiver = conversation.participants.find(
            (p: any) => p.userId.toString() !== socketUser.userId.toString()
          );

          if (!receiver) {
            socket.emit(SOCKET_EVENTS.ERROR, {
              message: 'Receiver not found in conversation',
            });
            return;
          }

          // Get sender info
          const sender = await UserModel.findById(socketUser.userId)
            .select('name fullName email avatar role')
            .lean();

          // Create call message in database
          const callMessage = await ChatMessageModel.create({
            conversationId: payload.conversationId,
            senderId: socketUser.userId,
            senderName: sender?.fullName || sender?.name || sender?.email,
            senderAvatar: sender?.avatar,
            message:
              payload.callType === 'video'
                ? 'Cuộc gọi video'
                : 'Cuộc gọi thoại',
            type: 'call',
            metadata: {
              callId,
              callType: payload.callType,
              status: 'ringing',
              initiatorId: socketUser.userId,
              receiverId: receiver.userId.toString(),
              conversationId: payload.conversationId,
              ...payload.metadata,
            },
            isDelivered: false,
            isRead: false,
          });

          // Update conversation
          await ChatConversationModel.findByIdAndUpdate(
            payload.conversationId,
            {
              lastMessageId: callMessage._id,
              lastMessageAt: new Date(),
              updatedAt: new Date(),
            }
          );

          // Emit call to receiver
          const receiverRoom = buildDirectUserRoom(receiver.userId.toString());
          namespace.to(receiverRoom).emit(SOCKET_EVENTS.CALL_INCOMING, {
            callId,
            conversationId: payload.conversationId,
            callType: payload.callType,
            initiator: {
              userId: socketUser.userId,
              name: sender?.fullName || sender?.name || sender?.email,
              avatar: sender?.avatar,
            },
            metadata: payload.metadata || {},
          });

          // Emit ringing status to initiator
          socket.emit(SOCKET_EVENTS.CALL_RINGING, {
            callId,
            conversationId: payload.conversationId,
            status: 'ringing',
          });

          // Emit message to conversation room (for call history)
          const messageResponse = {
            _id: callMessage._id.toString(),
            conversationId: payload.conversationId,
            senderId: socketUser.userId,
            senderName: sender?.fullName || sender?.name || sender?.email,
            senderAvatar: sender?.avatar,
            message:
              payload.callType === 'video'
                ? 'Cuộc gọi video'
                : 'Cuộc gọi thoại',
            type: 'call',
            metadata: callMessage.metadata,
            isRead: false,
            isDelivered: false,
            createdAt: callMessage.createdAt.toISOString(),
            updatedAt: callMessage.updatedAt.toISOString(),
          };

          const conversationRoom = buildChatConversationRoom(
            options.channel,
            payload.conversationId
          );
          namespace
            .to(conversationRoom)
            .emit(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, {
              conversationId: payload.conversationId,
              message: messageResponse,
            });
        } catch (error: any) {
          console.error('[Chat Socket] Error initiating call:', error);
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: error.message || 'Failed to initiate call',
          });
        }
      }
    );

    // Handle call answer
    socket.on(
      SOCKET_EVENTS.CALL_ANSWER,
      async (payload: { callId: string; conversationId: string }) => {
        if (!payload?.callId || !payload?.conversationId) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: 'callId and conversationId are required',
          });
          return;
        }

        try {
          const ChatMessageModel = (await import('../../models/ChatMessage'))
            .default;
          const ChatConversationModel = (
            await import('../../models/ChatConversation')
          ).default;

          // Find call message by callId in metadata
          const callMessage = await ChatMessageModel.findOne({
            conversationId: payload.conversationId,
            type: 'call',
            'metadata.callId': payload.callId,
          });

          if (
            !callMessage ||
            callMessage.metadata?.receiverId !== socketUser.userId
          ) {
            socket.emit(SOCKET_EVENTS.ERROR, {
              message: 'Call not found or unauthorized',
            });
            return;
          }

          // Update call status
          const updatedMetadata = {
            ...callMessage.metadata,
            status: 'answered',
            startedAt: new Date().toISOString(),
          };

          await ChatMessageModel.findByIdAndUpdate(callMessage._id, {
            metadata: updatedMetadata,
          });

          // Emit to initiator
          const initiatorRoom = buildDirectUserRoom(
            callMessage.metadata?.initiatorId || ''
          );
          namespace.to(initiatorRoom).emit(SOCKET_EVENTS.CALL_STATUS, {
            callId: payload.callId,
            conversationId: payload.conversationId,
            status: 'answered',
            receiverId: socketUser.userId,
          });

          // Emit to conversation room
          const conversationRoom = buildChatConversationRoom(
            options.channel,
            payload.conversationId
          );
          namespace.to(conversationRoom).emit(SOCKET_EVENTS.CALL_STATUS, {
            callId: payload.callId,
            conversationId: payload.conversationId,
            status: 'answered',
          });
        } catch (error: any) {
          console.error('[Chat Socket] Error answering call:', error);
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: error.message || 'Failed to answer call',
          });
        }
      }
    );

    // Handle call rejection
    socket.on(
      SOCKET_EVENTS.CALL_REJECT,
      async (payload: {
        callId: string;
        conversationId: string;
        reason?: string;
      }) => {
        if (!payload?.callId || !payload?.conversationId) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: 'callId and conversationId are required',
          });
          return;
        }

        try {
          const ChatMessageModel = (await import('../../models/ChatMessage'))
            .default;

          // Find and update call message
          const callMessage = await ChatMessageModel.findOne({
            conversationId: payload.conversationId,
            type: 'call',
            'metadata.callId': payload.callId,
          });

          if (callMessage) {
            const updatedMetadata = {
              ...callMessage.metadata,
              status: 'rejected',
              endedAt: new Date().toISOString(),
              reason: payload.reason,
            };

            await ChatMessageModel.findByIdAndUpdate(callMessage._id, {
              metadata: updatedMetadata,
            });

            // Emit to initiator
            const initiatorRoom = buildDirectUserRoom(
              callMessage.metadata?.initiatorId || ''
            );
            namespace.to(initiatorRoom).emit(SOCKET_EVENTS.CALL_STATUS, {
              callId: payload.callId,
              conversationId: payload.conversationId,
              status: 'rejected',
              reason: payload.reason,
            });
          }
        } catch (error: any) {
          console.error('[Chat Socket] Error rejecting call:', error);
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: error.message || 'Failed to reject call',
          });
        }
      }
    );

    // Handle call end
    socket.on(
      SOCKET_EVENTS.CALL_END,
      async (payload: {
        callId: string;
        conversationId: string;
        duration?: number;
      }) => {
        if (!payload?.callId || !payload?.conversationId) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: 'callId and conversationId are required',
          });
          return;
        }

        try {
          const ChatMessageModel = (await import('../../models/ChatMessage'))
            .default;

          // Find and update call message
          const callMessage = await ChatMessageModel.findOne({
            conversationId: payload.conversationId,
            type: 'call',
            'metadata.callId': payload.callId,
          });

          if (callMessage) {
            const updatedMetadata = {
              ...callMessage.metadata,
              status: 'ended',
              endedAt: new Date().toISOString(),
              duration: payload.duration || 0,
            };

            await ChatMessageModel.findByIdAndUpdate(callMessage._id, {
              metadata: updatedMetadata,
            });

            // Emit to conversation room
            const conversationRoom = buildChatConversationRoom(
              options.channel,
              payload.conversationId
            );
            namespace.to(conversationRoom).emit(SOCKET_EVENTS.CALL_STATUS, {
              callId: payload.callId,
              conversationId: payload.conversationId,
              status: 'ended',
              duration: payload.duration,
            });
          }
        } catch (error: any) {
          console.error('[Chat Socket] Error ending call:', error);
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: error.message || 'Failed to end call',
          });
        }
      }
    );

    // Handle call cancel (initiator cancels before answer)
    socket.on(
      SOCKET_EVENTS.CALL_CANCEL,
      async (payload: { callId: string; conversationId: string }) => {
        if (!payload?.callId || !payload?.conversationId) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: 'callId and conversationId are required',
          });
          return;
        }

        try {
          const ChatMessageModel = (await import('../../models/ChatMessage'))
            .default;

          const callMessage = await ChatMessageModel.findOne({
            conversationId: payload.conversationId,
            type: 'call',
            'metadata.callId': payload.callId,
            'metadata.initiatorId': socketUser.userId,
          });

          if (callMessage && callMessage.metadata?.status === 'ringing') {
            const updatedMetadata = {
              ...callMessage.metadata,
              status: 'cancelled',
              endedAt: new Date().toISOString(),
            };

            await ChatMessageModel.findByIdAndUpdate(callMessage._id, {
              metadata: updatedMetadata,
            });

            // Emit to receiver
            const receiverRoom = buildDirectUserRoom(
              callMessage.metadata?.receiverId || ''
            );
            namespace.to(receiverRoom).emit(SOCKET_EVENTS.CALL_STATUS, {
              callId: payload.callId,
              conversationId: payload.conversationId,
              status: 'cancelled',
            });
          }
        } catch (error: any) {
          console.error('[Chat Socket] Error cancelling call:', error);
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: error.message || 'Failed to cancel call',
          });
        }
      }
    );

    // Handle WebRTC offer
    socket.on(
      SOCKET_EVENTS.CALL_OFFER,
      (payload: {
        callId: string;
        conversationId: string;
        offer: RTCSessionDescriptionInit;
      }) => {
        if (!payload?.callId || !payload?.conversationId || !payload?.offer) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: 'callId, conversationId, and offer are required',
          });
          return;
        }

        const conversationRoom = buildChatConversationRoom(
          options.channel,
          payload.conversationId
        );
        socket.to(conversationRoom).emit(SOCKET_EVENTS.CALL_OFFER, {
          callId: payload.callId,
          conversationId: payload.conversationId,
          offer: payload.offer,
          senderId: socketUser.userId,
        });
      }
    );

    // Handle WebRTC answer
    socket.on(
      SOCKET_EVENTS.CALL_ANSWER_SDP,
      (payload: {
        callId: string;
        conversationId: string;
        answer: RTCSessionDescriptionInit;
      }) => {
        if (!payload?.callId || !payload?.conversationId || !payload?.answer) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: 'callId, conversationId, and answer are required',
          });
          return;
        }

        const conversationRoom = buildChatConversationRoom(
          options.channel,
          payload.conversationId
        );
        socket.to(conversationRoom).emit(SOCKET_EVENTS.CALL_ANSWER_SDP, {
          callId: payload.callId,
          conversationId: payload.conversationId,
          answer: payload.answer,
          senderId: socketUser.userId,
        });
      }
    );

    // Handle ICE candidates
    socket.on(
      SOCKET_EVENTS.CALL_ICE_CANDIDATE,
      (payload: {
        callId: string;
        conversationId: string;
        candidate: RTCIceCandidateInit;
      }) => {
        if (
          !payload?.callId ||
          !payload?.conversationId ||
          !payload?.candidate
        ) {
          socket.emit(SOCKET_EVENTS.ERROR, {
            message: 'callId, conversationId, and candidate are required',
          });
          return;
        }

        const conversationRoom = buildChatConversationRoom(
          options.channel,
          payload.conversationId
        );
        socket.to(conversationRoom).emit(SOCKET_EVENTS.CALL_ICE_CANDIDATE, {
          callId: payload.callId,
          conversationId: payload.conversationId,
          candidate: payload.candidate,
          senderId: socketUser.userId,
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
