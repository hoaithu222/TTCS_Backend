"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOCKET_NAMESPACE_DESCRIPTIONS = exports.buildDirectUserRoom = exports.buildChatConversationRoom = exports.buildNotificationRoom = exports.SOCKET_ROLE_GROUPS = exports.SOCKET_CHAT_CHANNELS = exports.SOCKET_EVENTS = exports.SOCKET_NAMESPACES = void 0;
exports.SOCKET_NAMESPACES = {
    ROOT: '/',
    NOTIFICATIONS: '/notifications',
    ADMIN_CHAT: '/chat/admin',
    SHOP_CHAT: '/chat/shop',
    AI_CHAT: '/chat/ai',
};
exports.SOCKET_EVENTS = {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    ERROR: 'error',
    SYSTEM_READY: 'system:ready',
    ROOM_JOIN: 'room:join',
    ROOM_LEAVE: 'room:leave',
    CHAT_CONVERSATION_JOIN: 'chat:conversation:join',
    CHAT_CONVERSATION_LEAVE: 'chat:conversation:leave',
    CHAT_MESSAGE_SEND: 'chat:message:send',
    CHAT_MESSAGE_RECEIVE: 'chat:message:receive',
    CHAT_TYPING: 'chat:typing',
    CHAT_DELIVERED: 'chat:delivered',
    CHAT_SEEN: 'chat:seen',
    // Call events
    CALL_INITIATE: 'call:initiate',
    CALL_INCOMING: 'call:incoming',
    CALL_ANSWER: 'call:answer',
    CALL_REJECT: 'call:reject',
    CALL_END: 'call:end',
    CALL_CANCEL: 'call:cancel',
    CALL_RINGING: 'call:ringing',
    CALL_STATUS: 'call:status',
    // WebRTC signaling events
    CALL_OFFER: 'call:offer',
    CALL_ANSWER_SDP: 'call:answer:sdp',
    CALL_ICE_CANDIDATE: 'call:ice:candidate',
    NOTIFICATION_SUBSCRIBE: 'notification:subscribe',
    NOTIFICATION_SEND: 'notification:send',
    NOTIFICATION_ACK: 'notification:ack',
};
exports.SOCKET_CHAT_CHANNELS = {
    ADMIN: 'admin',
    SHOP: 'shop',
    AI: 'ai',
};
exports.SOCKET_ROLE_GROUPS = {
    ANY_AUTHENTICATED: ['admin', 'moderator', 'shop', 'user'],
    ADMIN_STAFF: ['admin', 'moderator'],
    ADMIN_CHAT_PARTICIPANTS: ['admin', 'moderator', 'user', 'shop'], // Shop và user đều có thể chat với admin
    SHOP_CHAT_PARTICIPANTS: ['shop', 'admin', 'moderator', 'user'],
    AI_CHAT_PARTICIPANTS: ['admin', 'moderator', 'shop', 'user'],
};
const buildNotificationRoom = (userId) => `notification:user:${userId}`;
exports.buildNotificationRoom = buildNotificationRoom;
const buildChatConversationRoom = (channel, conversationId) => `chat:${channel}:${conversationId}`;
exports.buildChatConversationRoom = buildChatConversationRoom;
const buildDirectUserRoom = (userId) => `user:${userId}`;
exports.buildDirectUserRoom = buildDirectUserRoom;
exports.SOCKET_NAMESPACE_DESCRIPTIONS = {
    [exports.SOCKET_NAMESPACES.NOTIFICATIONS]: 'Realtime notification pipeline for system/user alerts',
    [exports.SOCKET_NAMESPACES.ADMIN_CHAT]: 'Customer service conversations between admin/CSKH and users',
    [exports.SOCKET_NAMESPACES.SHOP_CHAT]: 'Shop to customer realtime messaging for orders & support',
    [exports.SOCKET_NAMESPACES.AI_CHAT]: 'AI assistant conversations (placeholder for future integration)',
};
