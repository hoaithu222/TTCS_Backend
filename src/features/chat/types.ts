export interface ChatMessageResponse {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  message: string;
  type?: "text" | "product" | "call" | "image" | "file";
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
  type?: "text" | "product" | "call" | "image" | "file";
  attachments?: Array<{
    url: string;
    type: string;
    name?: string;
  }>;
  metadata?: Record<string, any> | ProductMetadata;
}

// Product metadata structure for shop chat
export interface ProductMetadata {
  productId?: string;
  productName?: string;
  productImage?: string;
  productPrice?: number;
  shopId?: string;
  shopName?: string;
  [key: string]: any; // Allow additional fields
}

export interface CreateConversationRequest {
  type: "admin" | "shop";
  targetId?: string; // shopId nếu type là "shop"
  metadata?: Record<string, any> | ShopConversationMetadata; // context: productId, orderId, etc.
  initialMessage?: string;
}

// Shop conversation metadata structure
export interface ShopConversationMetadata {
  shopId?: string;
  shopName?: string;
  productId?: string; // Optional: for initial product context
  productName?: string;
  productImage?: string;
  productPrice?: number;
  [key: string]: any; // Allow additional fields
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

