import { Namespace, Server, Socket } from "socket.io";
import {
  SOCKET_EVENTS,
  SOCKET_NAMESPACES,
  buildNotificationRoom,
  buildDirectUserRoom,
} from "../../shared/config/socket";
import {
  SocketAuthMiddleware,
  SocketAuthedUser,
  getSocketUser,
} from "../types";

export interface NotificationNamespaceOptions {
  debug?: boolean;
  allowedRoles?: readonly string[];
}

const ensureAuthenticated = (
  socket: Socket,
  namespace: Namespace
): SocketAuthedUser | null => {
  const socketUser = getSocketUser(socket);

  if (!socketUser) {
    socket.emit(SOCKET_EVENTS.ERROR, {
      message: "Unauthorized notification socket",
    });
    socket.disconnect(true);
    return null; // Return null instead of throwing
  }

  return socketUser;
};

export const registerNotificationNamespace = (
  io: Server,
  authMiddleware: SocketAuthMiddleware,
  options: NotificationNamespaceOptions = {}
) => {
  const namespace = io.of(SOCKET_NAMESPACES.NOTIFICATIONS);
  namespace.use(authMiddleware);

  namespace.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
    try {
      const socketUser = ensureAuthenticated(socket, namespace);

      // Nếu không authenticated, đã disconnect trong ensureAuthenticated
      if (!socketUser) {
        return;
      }

      if (
        options.allowedRoles &&
        (!socketUser.role || !options.allowedRoles.includes(socketUser.role))
      ) {
        socket.emit(SOCKET_EVENTS.ERROR, {
          message: "Forbidden: role not allowed in notification channel",
        });
        socket.disconnect(true);
        return;
      }

    const personalRoom = buildNotificationRoom(socketUser.userId);
    const directRoom = buildDirectUserRoom(socketUser.userId);

    socket.join([personalRoom, directRoom]);

    if (options.debug) {
      console.log(
        `[socket][notifications] user ${socketUser.userId} đã tham gia vào ${personalRoom} phòng`
      );
    }

    socket.emit(SOCKET_EVENTS.SYSTEM_READY, {
      namespace: SOCKET_NAMESPACES.NOTIFICATIONS,
      rooms: [personalRoom, directRoom],
    });

    socket.on(SOCKET_EVENTS.NOTIFICATION_SUBSCRIBE, (payload) => {
      if (!payload?.room) {
        return;
      }
      socket.join(payload.room);

      if (options.debug) {
        console.log(
          `[socket][notifications] user ${socketUser.userId} đã đăng ký vào ${payload.room } phòng`
        );
      }
    });

    socket.on(SOCKET_EVENTS.NOTIFICATION_ACK, (payload) => {
      namespace.to(personalRoom).emit(SOCKET_EVENTS.NOTIFICATION_ACK, {
        ...payload,
        userId: socketUser.userId,
      });  
      if (options.debug) {
        console.log(
          `[socket][notifications] user ${socketUser.userId} đã xác nhận thông báo ${payload.notificationId}`
        );
      }
    });

    socket.on(SOCKET_EVENTS.ROOM_JOIN, (room: string) => {
      if (!room) return;
      socket.join(room);
    });

    socket.on(SOCKET_EVENTS.ROOM_LEAVE, (room: string) => {
      if (!room) return;
      socket.leave(room);
    });
          
    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      if (options.debug) {
        console.log(
          `[socket][notifications] user ${socketUser.userId} disconnected: ${reason}`
        );
      }
    });
    } catch (error) {
      // Bắt mọi lỗi không mong đợi trong connection handler
      console.error("[socket][notifications] Connection error:", error);
      socket.emit(SOCKET_EVENTS.ERROR, {
        message: "Connection error occurred",
      });
      socket.disconnect(true);
    }
  });

  return namespace;
};


