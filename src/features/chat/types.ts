export interface ChatMessageResponse {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  message: string;
  attachments?: Array<{
    id?: string;
    url: string;
    type: string;
    name?: string;
  }>;
  metadata?: Record<string, any>;
  isRead?: boolean;
  isDelivered?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ChatConversationResponse {
  _id: string;
  participants: Array<{
    userId: string;
    name?: string;
    avatar?: string;
    role?: string;
  }>;
  lastMessage?: ChatMessageResponse;
  unreadCount?: number;
  type?: "direct" | "group" | "admin" | "shop" | "ai";
  channel?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface ConversationListQuery {
  page?: number;
  limit?: number;
  type?: ChatConversationResponse["type"];
  channel?: string;
}

export interface MessageListQuery {
  page?: number;
  limit?: number;
  before?: string; // messageId to fetch messages before
  after?: string; // messageId to fetch messages after
}

export interface SendMessageRequest {
  message: string;
  attachments?: Array<{
    url: string;
    type: string;
    name?: string;
  }>;
  metadata?: Record<string, any>;
}

export interface ConversationListResponse {
  conversations: ChatConversationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface MessageListResponse {
  messages: ChatMessageResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

