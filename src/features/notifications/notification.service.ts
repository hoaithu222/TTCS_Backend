import UserNotificationModel from "../../models/UserNotification";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import type {
  NotificationResponse,
  NotificationListQuery,
  NotificationListResponse,
  UnreadCountResponse,
} from "./types";

const VALID_NOTIFICATION_TYPES: NotificationResponse["type"][] = [
  "order",
  "promotion",
  "system",
  "product",
  "shop",
  "review",
];

function getValidNotificationType(type: string | undefined | null): NotificationResponse["type"] {
  if (type && VALID_NOTIFICATION_TYPES.includes(type as NotificationResponse["type"])) {
    return type as NotificationResponse["type"];
  }
  return "system";
}

export default class NotificationService {
  // Get notifications list with pagination
  static async getNotifications(
    req: AuthenticatedRequest,
    query: NotificationListQuery = {}
  ) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }

    const page = Math.max(1, parseInt(String(query.page || 1)));
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 10))));
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { userId };
    if (query.type) {
      filter.type = query.type;
    }
    if (query.isRead !== undefined) {
      filter.isRead = query.isRead;
    }

    // Build sort
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder === "asc" ? 1 : -1;
    const sort: any = { [sortBy]: sortOrder };

    // Get notifications
    const [notifications, total, unreadCount] = await Promise.all([
      UserNotificationModel.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      UserNotificationModel.countDocuments(filter),
      UserNotificationModel.countDocuments({ userId, isRead: false }),
    ]);

    // Transform notifications
    const notificationList: NotificationResponse[] = notifications.map((notif: any) => ({
      _id: notif._id.toString(),
      userId: notif.userId.toString(),
      title: notif.title,
      message: notif.content, // Map content to message for frontend
      type: getValidNotificationType(notif.type),
      isRead: notif.isRead || false,
      data: notif.metadata || {},
      actionUrl: notif.actionUrl ?? undefined,
      createdAt: notif.createdAt?.toISOString() || new Date().toISOString(),
      readAt: notif.readAt?.toISOString(),
    }));

    const response: NotificationListResponse = {
      notifications: notificationList,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    };

    return { ok: true as const, data: response };
  }

  // Mark notification as read
  static async markAsRead(req: AuthenticatedRequest, notificationId: string) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }

    const notification = await UserNotificationModel.findOne({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return {
        ok: false as const,
        status: 404,
        message: "Thông báo không tồn tại",
      };
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    const response: NotificationResponse = {
      _id: notification._id.toString(),
      userId: notification.userId.toString(),
      title: notification.title,
      message: notification.content,
      type: getValidNotificationType(notification.type),
      isRead: notification.isRead,
      data: notification.metadata || {},
      actionUrl: notification.actionUrl ?? undefined,
      createdAt: notification.createdAt?.toISOString() || new Date().toISOString(),
      readAt: notification.readAt?.toISOString(),
    };

    return { ok: true as const, data: response };
  }

  // Mark all notifications as read
  static async markAllAsRead(req: AuthenticatedRequest) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }

    await UserNotificationModel.updateMany(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    return { ok: true as const };
  }

  // Delete notification
  static async deleteNotification(req: AuthenticatedRequest, notificationId: string) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }

    const notification = await UserNotificationModel.findOneAndDelete({
      _id: notificationId,
      userId,
    });

    if (!notification) {
      return {
        ok: false as const,
        status: 404,
        message: "Thông báo không tồn tại",
      };
    }

    return { ok: true as const };
  }

  // Get unread count
  static async getUnreadCount(req: AuthenticatedRequest) {
    const userId = (req as any).user?.userId;
    if (!userId) {
      return { ok: false as const, status: 401, message: "Unauthorized" };
    }

    const unreadCount = await UserNotificationModel.countDocuments({
      userId,
      isRead: false,
    });

    const response: UnreadCountResponse = { unreadCount };

    return { ok: true as const, data: response };
  }
}

