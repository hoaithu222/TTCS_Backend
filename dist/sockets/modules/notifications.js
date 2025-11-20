"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerNotificationNamespace = void 0;
const socket_1 = require("../../shared/config/socket");
const types_1 = require("../types");
const ensureAuthenticated = (socket, namespace) => {
    const socketUser = (0, types_1.getSocketUser)(socket);
    if (!socketUser) {
        socket.emit(socket_1.SOCKET_EVENTS.ERROR, {
            message: "Unauthorized notification socket",
        });
        socket.disconnect(true);
        throw new Error("Unauthorized notification socket");
    }
    return socketUser;
};
const registerNotificationNamespace = (io, authMiddleware, options = {}) => {
    const namespace = io.of(socket_1.SOCKET_NAMESPACES.NOTIFICATIONS);
    namespace.use(authMiddleware);
    namespace.on(socket_1.SOCKET_EVENTS.CONNECTION, (socket) => {
        const socketUser = ensureAuthenticated(socket, namespace);
        if (options.allowedRoles &&
            (!socketUser.role || !options.allowedRoles.includes(socketUser.role))) {
            socket.emit(socket_1.SOCKET_EVENTS.ERROR, {
                message: "Forbidden: role not allowed in notification channel",
            });
            socket.disconnect(true);
            return;
        }
        const personalRoom = (0, socket_1.buildNotificationRoom)(socketUser.userId);
        const directRoom = (0, socket_1.buildDirectUserRoom)(socketUser.userId);
        socket.join([personalRoom, directRoom]);
        if (options.debug) {
            console.log(`[socket][notifications] user ${socketUser.userId} joined ${personalRoom}`);
        }
        socket.emit(socket_1.SOCKET_EVENTS.SYSTEM_READY, {
            namespace: socket_1.SOCKET_NAMESPACES.NOTIFICATIONS,
            rooms: [personalRoom, directRoom],
        });
        socket.on(socket_1.SOCKET_EVENTS.NOTIFICATION_SUBSCRIBE, (payload) => {
            if (!payload?.room) {
                return;
            }
            socket.join(payload.room);
            if (options.debug) {
                console.log(`[socket][notifications] user ${socketUser.userId} subscribed to ${payload.room}`);
            }
        });
        socket.on(socket_1.SOCKET_EVENTS.NOTIFICATION_ACK, (payload) => {
            namespace.to(personalRoom).emit(socket_1.SOCKET_EVENTS.NOTIFICATION_ACK, {
                ...payload,
                userId: socketUser.userId,
            });
        });
        socket.on(socket_1.SOCKET_EVENTS.ROOM_JOIN, (room) => {
            if (!room)
                return;
            socket.join(room);
        });
        socket.on(socket_1.SOCKET_EVENTS.ROOM_LEAVE, (room) => {
            if (!room)
                return;
            socket.leave(room);
        });
        socket.on(socket_1.SOCKET_EVENTS.DISCONNECT, (reason) => {
            if (options.debug) {
                console.log(`[socket][notifications] user ${socketUser.userId} disconnected: ${reason}`);
            }
        });
    });
    return namespace;
};
exports.registerNotificationNamespace = registerNotificationNamespace;
