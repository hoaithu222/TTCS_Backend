import { Server, Socket } from "socket.io";
import Jwt from "../shared/utils/jwt";
import UserModel from "../models/UserModel";

interface SocketAuth {
  userId?: string;
  token?: string;
}

const socketHandler = (io: Server) => {
  io.use(async (socket: Socket, next) => {
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
            (socket as any).user = {
              userId: user._id.toString(),
              user,
            };
          }
        } catch (error) {
          console.error("Socket auth token invalid:", error);
        }
      } else if (auth?.userId) {
        (socket as any).user = { userId: auth.userId };
      }

      next();
    } catch (error) {
      console.error("Socket auth error:", error);
      next();
    }
  });

  io.on("connection", (socket: Socket) => {
    const socketUser = (socket as any).user;
    const userId = socketUser?.userId || socket.handshake.auth?.userId;
    console.log(
      `Socket connected: ${socket.id}${userId ? ` (userId: ${userId})` : ""}`
    );

    socket.on("disconnect", (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });
};

export default socketHandler;

