"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = __importDefault(require("../shared/utils/jwt"));
const UserModel_1 = __importDefault(require("../models/UserModel"));
const socket_1 = require("../shared/config/socket");
const socket_server_1 = require("../shared/config/socket-server");
const types_1 = require("./types");
const notifications_1 = require("./modules/notifications");
const chat_1 = require("./modules/chat");
const buildSocketAuthMiddleware = () => {
    return async (socket, next) => {
        try {
            const auth = socket.handshake.auth;
            const authHeader = socket.handshake.headers.authorization;
            const token = auth?.token ||
                (authHeader && authHeader.startsWith("Bearer ")
                    ? authHeader.split(" ")[1]
                    : authHeader);
            if (token) {
                try {
                    const decoded = jwt_1.default.verifyAccessToken(token);
                    const user = await UserModel_1.default.findById(decoded.userId).select("_id email name fullName avatar role");
                    if (user) {
                        const authedUser = {
                            userId: user._id.toString(),
                            role: user.role,
                            email: user.email,
                            name: user.name,
                            fullName: user.fullName ?? undefined,
                            avatar: user.avatar ?? undefined,
                        };
                        (0, types_1.attachSocketUser)(socket, authedUser);
                    }
                }
                catch (error) {
                    console.error("Socket auth token invalid:", error);
                }
            }
            else if (auth?.userId) {
                (0, types_1.attachSocketUser)(socket, { userId: auth.userId });
            }
            next();
        }
        catch (error) {
            console.error("Socket auth error:", error);
            next();
        }
    };
};
const socketHandler = (io) => {
    (0, socket_server_1.registerSocketServer)(io);
    const socketAuthMiddleware = buildSocketAuthMiddleware();
    io.use(socketAuthMiddleware);
    const debugSockets = process.env.SOCKET_DEBUG === "true" ||
        process.env.NODE_ENV !== "production";
    io.on(socket_1.SOCKET_EVENTS.CONNECTION, (socket) => {
        const socketUser = (0, types_1.getSocketUser)(socket);
        const userId = socketUser?.userId || socket.handshake.auth?.userId;
        console.log(`Socket connected: ${socket.id}${userId ? ` (userId: ${userId})` : ""}`);
        socket.on(socket_1.SOCKET_EVENTS.DISCONNECT, (reason) => {
            console.log(`Socket disconnected: ${socket.id} (${reason})`);
        });
    });
    // Register namespaces for notifications & chats
    (0, notifications_1.registerNotificationNamespace)(io, socketAuthMiddleware, {
        debug: debugSockets,
        allowedRoles: socket_1.SOCKET_ROLE_GROUPS.ANY_AUTHENTICATED,
    });
    (0, chat_1.registerChatNamespace)(io, socketAuthMiddleware, {
        channel: socket_1.SOCKET_CHAT_CHANNELS.ADMIN,
        debug: debugSockets,
        allowedRoles: socket_1.SOCKET_ROLE_GROUPS.ADMIN_CHAT_PARTICIPANTS,
    });
    (0, chat_1.registerChatNamespace)(io, socketAuthMiddleware, {
        channel: socket_1.SOCKET_CHAT_CHANNELS.SHOP,
        debug: debugSockets,
        allowedRoles: socket_1.SOCKET_ROLE_GROUPS.SHOP_CHAT_PARTICIPANTS,
    });
    (0, chat_1.registerChatNamespace)(io, socketAuthMiddleware, {
        channel: socket_1.SOCKET_CHAT_CHANNELS.AI,
        debug: debugSockets,
        allowedRoles: socket_1.SOCKET_ROLE_GROUPS.AI_CHAT_PARTICIPANTS,
    });
};
exports.default = socketHandler;
