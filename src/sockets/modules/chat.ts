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
  conversationId: string;
  message: string;
  attachments?: Array<{
    id?: string;
    url: string;
    type: string;
  }>;
  metadata?: Record<string, unknown>;
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
      (payload: ChatMessagePayload) => {
        if (!payload?.conversationId || !payload.message) {
          return;
        }

        const room = buildChatConversationRoom(
          options.channel,
          payload.conversationId
        );

        const enrichedPayload = {
          ...payload,
          room,
          channel: options.channel,
          senderId: socketUser.userId,
          sentAt: new Date().toISOString(),
        };

        namespace
          .to(room)
          .emit(SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, enrichedPayload);
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


