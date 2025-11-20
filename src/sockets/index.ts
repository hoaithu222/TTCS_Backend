import { Server, Socket } from "socket.io";
import Jwt from "../shared/utils/jwt";
import UserModel from "../models/UserModel";
import {
  SOCKET_CHAT_CHANNELS,
  SOCKET_EVENTS,
  SOCKET_ROLE_GROUPS,
} from "../shared/config/socket";
import { registerSocketServer } from "../shared/config/socket-server";
import {
  SocketAuthMiddleware,
  SocketAuthedUser,
  attachSocketUser,
  getSocketUser,
} from "./types";
import { registerNotificationNamespace } from "./modules/notifications";
import { registerChatNamespace } from "./modules/chat";

interface SocketAuth {
  userId?: string;
  token?: string;
}

const buildSocketAuthMiddleware = (): SocketAuthMiddleware => {
  return async (socket, next) => {
    try {
      const auth = socket.handshake.auth as SocketAuth;
      const authHeader = socket.handshake.headers.authorization;
      const token =
        auth?.token ||
        (authHeader && authHeader.startsWith("Bearer ")
          ? authHeader.split(" ")[1]
          : authHeader);

      if (token) {
        try {
          const decoded = Jwt.verifyAccessToken<{ userId: string }>(token);
          const user = await UserModel.findById(decoded.userId).select(
            "_id email name fullName avatar role"
          );
          if (user) {
            const authedUser: SocketAuthedUser = {
              userId: user._id.toString(),
              role: user.role,
              email: user.email,
              name: user.name,
              fullName: user.fullName ?? undefined,
              avatar: user.avatar ?? undefined,
            };
            attachSocketUser(socket, authedUser);
          }
        } catch (error) {
          console.error("Socket auth token invalid:", error);
        }
      } else if (auth?.userId) {
        attachSocketUser(socket, { userId: auth.userId });
      }

      next();
    } catch (error) {
      console.error("Socket auth error:", error);
      next();
    }
  };
};

const socketHandler = (io: Server) => {
  registerSocketServer(io);
  const socketAuthMiddleware = buildSocketAuthMiddleware();
  io.use(socketAuthMiddleware);

  const debugSockets =
    process.env.SOCKET_DEBUG === "true" ||
    process.env.NODE_ENV !== "production";

  io.on(SOCKET_EVENTS.CONNECTION, (socket: Socket) => {
    const socketUser = getSocketUser(socket);
    const userId = socketUser?.userId || socket.handshake.auth?.userId;
    console.log(
      `Socket connected: ${socket.id}${
        userId ? ` (userId: ${userId})` : ""
      }`
    );

    socket.on(SOCKET_EVENTS.DISCONNECT, (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  // Register namespaces for notifications & chats
  registerNotificationNamespace(io, socketAuthMiddleware, {
    debug: debugSockets,
    allowedRoles: SOCKET_ROLE_GROUPS.ANY_AUTHENTICATED,
  });

  registerChatNamespace(io, socketAuthMiddleware, {
    channel: SOCKET_CHAT_CHANNELS.ADMIN,
    debug: debugSockets,
    allowedRoles: SOCKET_ROLE_GROUPS.ADMIN_CHAT_PARTICIPANTS,
  });

  registerChatNamespace(io, socketAuthMiddleware, {
    channel: SOCKET_CHAT_CHANNELS.SHOP,
    debug: debugSockets,
    allowedRoles: SOCKET_ROLE_GROUPS.SHOP_CHAT_PARTICIPANTS,
  });

  registerChatNamespace(io, socketAuthMiddleware, {
    channel: SOCKET_CHAT_CHANNELS.AI,
    debug: debugSockets,
    allowedRoles: SOCKET_ROLE_GROUPS.AI_CHAT_PARTICIPANTS,
  });
};

export default socketHandler;

