"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatNamespace = void 0;
const socket_1 = require("../../shared/config/socket");
const types_1 = require("../types");
const CHANNEL_TO_NAMESPACE = {
    [socket_1.SOCKET_CHAT_CHANNELS.ADMIN]: socket_1.SOCKET_NAMESPACES.ADMIN_CHAT,
    [socket_1.SOCKET_CHAT_CHANNELS.SHOP]: socket_1.SOCKET_NAMESPACES.SHOP_CHAT,
    [socket_1.SOCKET_CHAT_CHANNELS.AI]: socket_1.SOCKET_NAMESPACES.AI_CHAT,
};
const ensureAuthenticated = (socket, namespace) => {
    const socketUser = (0, types_1.getSocketUser)(socket);
    if (!socketUser) {
        socket.emit(socket_1.SOCKET_EVENTS.ERROR, { message: "Unauthorized chat socket" });
        socket.disconnect(true);
        throw new Error("Unauthorized chat socket");
    }
    return socketUser;
};
const registerChatNamespace = (io, authMiddleware, options) => {
    const namespacePath = CHANNEL_TO_NAMESPACE[options.channel];
    const namespace = io.of(namespacePath);
    namespace.use(authMiddleware);
    namespace.on(socket_1.SOCKET_EVENTS.CONNECTION, (socket) => {
        const socketUser = ensureAuthenticated(socket, namespace);
        if (options.allowedRoles &&
            (!socketUser.role || !options.allowedRoles.includes(socketUser.role))) {
            socket.emit(socket_1.SOCKET_EVENTS.ERROR, {
                message: "Forbidden: role not allowed in chat channel",
            });
            socket.disconnect(true);
            return;
        }
        const directRoom = (0, socket_1.buildDirectUserRoom)(socketUser.userId);
        socket.join(directRoom);
        if (options.debug) {
            console.log(`[socket][${options.channel}] user ${socketUser.userId} connected (${socket.id})`);
        }
        socket.emit(socket_1.SOCKET_EVENTS.SYSTEM_READY, {
            namespace: namespacePath,
            channel: options.channel,
            rooms: [directRoom],
        });
        const joinConversation = (conversationId) => {
            if (!conversationId)
                return;
            const room = (0, socket_1.buildChatConversationRoom)(options.channel, conversationId);
            socket.join(room);
            if (options.debug) {
                console.log(`[socket][${options.channel}] user ${socketUser.userId} joined ${room}`);
            }
            socket.emit(socket_1.SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, {
                conversationId,
                room,
            });
        };
        const leaveConversation = (conversationId) => {
            if (!conversationId)
                return;
            const room = (0, socket_1.buildChatConversationRoom)(options.channel, conversationId);
            socket.leave(room);
            if (options.debug) {
                console.log(`[socket][${options.channel}] user ${socketUser.userId} left ${room}`);
            }
            socket.emit(socket_1.SOCKET_EVENTS.CHAT_CONVERSATION_LEAVE, {
                conversationId,
                room,
            });
        };
        socket.on(socket_1.SOCKET_EVENTS.CHAT_CONVERSATION_JOIN, ({ conversationId }) => {
            joinConversation(conversationId);
        });
        socket.on(socket_1.SOCKET_EVENTS.CHAT_CONVERSATION_LEAVE, ({ conversationId }) => {
            leaveConversation(conversationId);
        });
        socket.on(socket_1.SOCKET_EVENTS.ROOM_JOIN, (room) => {
            if (room) {
                socket.join(room);
            }
        });
        socket.on(socket_1.SOCKET_EVENTS.ROOM_LEAVE, (room) => {
            if (room) {
                socket.leave(room);
            }
        });
        socket.on(socket_1.SOCKET_EVENTS.CHAT_MESSAGE_SEND, (payload) => {
            if (!payload?.conversationId || !payload.message) {
                return;
            }
            const room = (0, socket_1.buildChatConversationRoom)(options.channel, payload.conversationId);
            const enrichedPayload = {
                ...payload,
                room,
                channel: options.channel,
                senderId: socketUser.userId,
                sentAt: new Date().toISOString(),
            };
            namespace
                .to(room)
                .emit(socket_1.SOCKET_EVENTS.CHAT_MESSAGE_RECEIVE, enrichedPayload);
        });
        socket.on(socket_1.SOCKET_EVENTS.CHAT_TYPING, (payload) => {
            if (!payload?.conversationId)
                return;
            const room = (0, socket_1.buildChatConversationRoom)(options.channel, payload.conversationId);
            socket.to(room).emit(socket_1.SOCKET_EVENTS.CHAT_TYPING, {
                ...payload,
                userId: socketUser.userId,
                channel: options.channel,
            });
        });
        socket.on(socket_1.SOCKET_EVENTS.CHAT_SEEN, (payload) => {
            if (!payload?.conversationId || !payload?.messageId)
                return;
            const room = (0, socket_1.buildChatConversationRoom)(options.channel, payload.conversationId);
            socket.to(room).emit(socket_1.SOCKET_EVENTS.CHAT_SEEN, {
                ...payload,
                userId: socketUser.userId,
            });
        });
        socket.on(socket_1.SOCKET_EVENTS.CHAT_DELIVERED, (payload) => {
            if (!payload?.conversationId || !payload?.messageId)
                return;
            const room = (0, socket_1.buildChatConversationRoom)(options.channel, payload.conversationId);
            socket.to(room).emit(socket_1.SOCKET_EVENTS.CHAT_DELIVERED, {
                ...payload,
                userId: socketUser.userId,
            });
        });
        socket.on(socket_1.SOCKET_EVENTS.DISCONNECT, (reason) => {
            if (options.debug) {
                console.log(`[socket][${options.channel}] user ${socketUser.userId} disconnected (${reason})`);
            }
        });
    });
    return namespace;
};
exports.registerChatNamespace = registerChatNamespace;
