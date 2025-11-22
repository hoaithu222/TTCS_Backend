export interface NotificationResponse {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: "order" | "promotion" | "system" | "product" | "shop" | "review";
  isRead: boolean;
  data?: Record<string, any>;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface NotificationListQuery {
  page?: number;
  limit?: number;
  type?: NotificationResponse["type"];
  isRead?: boolean;
  sortBy?: "createdAt" | "readAt";
  sortOrder?: "asc" | "desc";
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  unreadCount: number;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

