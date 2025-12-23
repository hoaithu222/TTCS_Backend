export const SOCKET_NAMESPACES = {
  ROOT: '/',
  NOTIFICATIONS: '/notifications',
  ADMIN_CHAT: '/chat/admin',
  SHOP_CHAT: '/chat/shop',
  AI_CHAT: '/chat/ai',
} as const;

export type SocketNamespace =
  (typeof SOCKET_NAMESPACES)[keyof typeof SOCKET_NAMESPACES];

export const SOCKET_EVENTS = {
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
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export const SOCKET_CHAT_CHANNELS = {
  ADMIN: 'admin',
  SHOP: 'shop',
  AI: 'ai',
} as const;

export type SocketChatChannel =
  (typeof SOCKET_CHAT_CHANNELS)[keyof typeof SOCKET_CHAT_CHANNELS];

export const SOCKET_ROLE_GROUPS = {
  ANY_AUTHENTICATED: ['admin', 'moderator', 'shop', 'user'],
  ADMIN_STAFF: ['admin', 'moderator'],
  ADMIN_CHAT_PARTICIPANTS: ['admin', 'moderator', 'user', 'shop'], // Shop và user đều có thể chat với admin
  SHOP_CHAT_PARTICIPANTS: ['shop', 'admin', 'moderator', 'user'],
  AI_CHAT_PARTICIPANTS: ['admin', 'moderator', 'shop', 'user'],
} as const;

export type SocketRoleGroup =
  (typeof SOCKET_ROLE_GROUPS)[keyof typeof SOCKET_ROLE_GROUPS];

export const buildNotificationRoom = (userId: string) =>
  `notification:user:${userId}`;

export const buildChatConversationRoom = (
  channel: SocketChatChannel,
  conversationId: string
) => `chat:${channel}:${conversationId}`;

export const buildDirectUserRoom = (userId: string) => `user:${userId}`;

export const SOCKET_NAMESPACE_DESCRIPTIONS: Record<
  Exclude<SocketNamespace, typeof SOCKET_NAMESPACES.ROOT>,
  string
> = {
  [SOCKET_NAMESPACES.NOTIFICATIONS]:
    'Realtime notification pipeline for system/user alerts',
  [SOCKET_NAMESPACES.ADMIN_CHAT]:
    'Customer service conversations between admin/CSKH and users',
  [SOCKET_NAMESPACES.SHOP_CHAT]:
    'Shop to customer realtime messaging for orders & support',
  [SOCKET_NAMESPACES.AI_CHAT]:
    'AI assistant conversations (placeholder for future integration)',
};
