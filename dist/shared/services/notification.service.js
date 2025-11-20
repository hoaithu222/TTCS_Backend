"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = void 0;
const UserNotification_1 = __importDefault(require("../../models/UserNotification"));
const socket_1 = require("../config/socket");
const socket_server_1 = require("../config/socket-server");
const OrderModel_1 = require("../../models/OrderModel");
const UserModel_1 = __importDefault(require("../../models/UserModel"));
const ORDER_STATUS_LABELS = {
    [OrderModel_1.OrderStatus.PENDING]: "Đang chờ xác nhận",
    [OrderModel_1.OrderStatus.PROCESSING]: "Đang chuẩn bị",
    [OrderModel_1.OrderStatus.SHIPPED]: "Đang giao",
    [OrderModel_1.OrderStatus.DELIVERED]: "Đã giao thành công",
    [OrderModel_1.OrderStatus.CANCELLED]: "Đã hủy",
};
const formatCurrency = (amount) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount || 0);
const emitToUser = (userId, payload) => {
    const io = (0, socket_server_1.getSocketServer)();
    if (!io)
        return;
    io.of(socket_1.SOCKET_NAMESPACES.NOTIFICATIONS)
        .to((0, socket_1.buildNotificationRoom)(userId))
        .emit(socket_1.SOCKET_EVENTS.NOTIFICATION_SEND, payload);
};
exports.notificationService = {
    async createAndEmit(input) {
        const notification = await UserNotification_1.default.create({
            userId: input.userId,
            title: input.title,
            content: input.content,
            type: input.type || "system",
            icon: input.icon,
            actionUrl: input.actionUrl,
            metadata: input.metadata || {},
            priority: input.priority || "normal",
        });
        emitToUser(input.userId, {
            notificationId: notification._id,
            title: notification.title,
            content: notification.content,
            type: notification.type,
            icon: notification.icon,
            actionUrl: notification.actionUrl,
            metadata: notification.metadata,
            priority: notification.priority,
            createdAt: notification.createdAt,
        });
        return notification;
    },
    async notifyShopOrderCreated(options) {
        const orderCode = `DH${options.orderId.slice(-6).toUpperCase()}`;
        const title = "Đơn hàng mới";
        const content = `${options.buyerName || "Khách hàng"} vừa đặt ${orderCode} (${formatCurrency(options.totalAmount)})`;
        return this.createAndEmit({
            userId: options.shopOwnerId,
            title,
            content,
            type: "order:new",
            actionUrl: `/orders/${options.orderId}`,
            metadata: {
                orderId: options.orderId,
                orderCode,
                shopName: options.shopName,
                buyerName: options.buyerName,
                totalAmount: options.totalAmount,
            },
            priority: "high",
        });
    },
    async notifyUserOrderStatus(options) {
        const orderCode = `DH${options.orderId.slice(-6).toUpperCase()}`;
        const statusLabel = ORDER_STATUS_LABELS[options.status] || "được cập nhật";
        const title = "Cập nhật đơn hàng";
        const content = `${options.shopName || "Cửa hàng"} vừa cập nhật ${orderCode}: ${statusLabel}`;
        return this.createAndEmit({
            userId: options.userId,
            title,
            content,
            type: "order:status",
            actionUrl: `/orders/${options.orderId}`,
            metadata: {
                orderId: options.orderId,
                orderCode,
                status: options.status,
                statusLabel,
                shopName: options.shopName,
            },
        });
    },
    async notifyUserOrderPlaced(options) {
        const orderCode = `DH${options.orderId.slice(-6).toUpperCase()}`;
        const title = "Đặt hàng thành công";
        const content = `Bạn đã đặt ${orderCode} tại ${options.shopName || "cửa hàng"}: ${formatCurrency(options.totalAmount)}`;
        return this.createAndEmit({
            userId: options.userId,
            title,
            content,
            type: "order:placed",
            actionUrl: `/orders/${options.orderId}`,
            metadata: {
                orderId: options.orderId,
                orderCode,
                shopName: options.shopName,
                totalAmount: options.totalAmount,
            },
        });
    },
    async notifyShopOrderUpdate(options) {
        const orderCode = `DH${options.orderId.slice(-6).toUpperCase()}`;
        const title = "Cập nhật từ khách hàng";
        const statusLabel = ORDER_STATUS_LABELS[options.status] || options.status;
        const content = `${options.userName || "Khách hàng"} vừa cập nhật ${orderCode}: ${statusLabel}${options.note ? ` (${options.note})` : ""}`;
        return this.createAndEmit({
            userId: options.shopOwnerId,
            title,
            content,
            type: "order:customer:update",
            actionUrl: `/orders/${options.orderId}`,
            metadata: {
                orderId: options.orderId,
                orderCode,
                status: options.status,
                statusLabel,
            },
            priority: "normal",
        });
    },
    async notifyAdminsShopRegistrationPending(options) {
        const admins = await UserModel_1.default.find({
            role: { $in: ["admin", "moderator"] },
        })
            .select("_id name fullName email")
            .lean();
        if (!admins.length)
            return;
        const owner = await UserModel_1.default.findById(options.ownerId)
            .select("name fullName email")
            .lean();
        const ownerName = owner?.fullName || owner?.name || owner?.email || "Người bán";
        await Promise.all(admins.map((admin) => this.createAndEmit({
            userId: admin._id.toString(),
            title: "Shop mới cần duyệt",
            content: `${ownerName} vừa đăng ký shop ${options.shopName}`,
            type: "shop:pending",
            actionUrl: `/shops/${options.shopId}`,
            metadata: {
                shopId: options.shopId,
                shopName: options.shopName,
                ownerName,
            },
            priority: "high",
        })));
    },
    async notifyShopOwnerApproval(options) {
        const statusLabel = options.status === "approved"
            ? "đã được phê duyệt"
            : options.status === "rejected"
                ? "không được phê duyệt"
                : "bị tạm khóa";
        return this.createAndEmit({
            userId: options.ownerId,
            title: "Cập nhật trạng thái cửa hàng",
            content: `Cửa hàng ${options.shopName} ${statusLabel}`,
            type: `shop:${options.status}`,
            actionUrl: `/shop/${options.shopId}`,
            metadata: {
                shopId: options.shopId,
                status: options.status,
            },
        });
    },
    async notifyShopOwnerNewFollower(options) {
        return this.createAndEmit({
            userId: options.ownerId,
            title: "Có người theo dõi cửa hàng",
            content: `${options.followerName || "Một khách hàng"} vừa theo dõi ${options.shopName}`,
            type: "shop:follower",
            actionUrl: `/shop/${options.shopId}`,
            metadata: {
                shopId: options.shopId,
                shopName: options.shopName,
            },
        });
    },
};
