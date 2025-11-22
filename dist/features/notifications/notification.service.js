"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const UserNotification_1 = __importDefault(require("../../models/UserNotification"));
const VALID_NOTIFICATION_TYPES = [
    "order",
    "promotion",
    "system",
    "product",
    "shop",
    "review",
];
function getValidNotificationType(type) {
    if (type && VALID_NOTIFICATION_TYPES.includes(type)) {
        return type;
    }
    return "system";
}
class NotificationService {
    // Get notifications list with pagination
    static async getNotifications(req, query = {}) {
        const userId = req.user?.userId;
        if (!userId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        const page = Math.max(1, parseInt(String(query.page || 1)));
        const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || 10))));
        const skip = (page - 1) * limit;
        // Build filter
        const filter = { userId };
        if (query.type) {
            filter.type = query.type;
        }
        if (query.isRead !== undefined) {
            filter.isRead = query.isRead;
        }
        // Build sort
        const sortBy = query.sortBy || "createdAt";
        const sortOrder = query.sortOrder === "asc" ? 1 : -1;
        const sort = { [sortBy]: sortOrder };
        // Get notifications
        const [notifications, total, unreadCount] = await Promise.all([
            UserNotification_1.default.find(filter)
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            UserNotification_1.default.countDocuments(filter),
            UserNotification_1.default.countDocuments({ userId, isRead: false }),
        ]);
        // Transform notifications
        const notificationList = notifications.map((notif) => ({
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
        const response = {
            notifications: notificationList,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            unreadCount,
        };
        return { ok: true, data: response };
    }
    // Mark notification as read
    static async markAsRead(req, notificationId) {
        const userId = req.user?.userId;
        if (!userId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        const notification = await UserNotification_1.default.findOne({
            _id: notificationId,
            userId,
        });
        if (!notification) {
            return {
                ok: false,
                status: 404,
                message: "Thông báo không tồn tại",
            };
        }
        if (!notification.isRead) {
            notification.isRead = true;
            notification.readAt = new Date();
            await notification.save();
        }
        const response = {
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
        return { ok: true, data: response };
    }
    // Mark all notifications as read
    static async markAllAsRead(req) {
        const userId = req.user?.userId;
        if (!userId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        await UserNotification_1.default.updateMany({ userId, isRead: false }, { isRead: true, readAt: new Date() });
        return { ok: true };
    }
    // Delete notification
    static async deleteNotification(req, notificationId) {
        const userId = req.user?.userId;
        if (!userId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        const notification = await UserNotification_1.default.findOneAndDelete({
            _id: notificationId,
            userId,
        });
        if (!notification) {
            return {
                ok: false,
                status: 404,
                message: "Thông báo không tồn tại",
            };
        }
        return { ok: true };
    }
    // Get unread count
    static async getUnreadCount(req) {
        const userId = req.user?.userId;
        if (!userId) {
            return { ok: false, status: 401, message: "Unauthorized" };
        }
        const unreadCount = await UserNotification_1.default.countDocuments({
            userId,
            isRead: false,
        });
        const response = { unreadCount };
        return { ok: true, data: response };
    }
}
exports.default = NotificationService;
