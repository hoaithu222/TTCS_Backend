import UserNotificationModel from "../../models/UserNotification";
import {
  SOCKET_EVENTS,
  SOCKET_NAMESPACES,
  buildNotificationRoom,
} from "../config/socket";
import { getSocketServer } from "../config/socket-server";
import { OrderStatus } from "../../models/OrderModel";
import UserModel from "../../models/UserModel";

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: "Đang chờ xác nhận",
  [OrderStatus.PROCESSING]: "Đang chuẩn bị",
  [OrderStatus.SHIPPED]: "Đang giao",
  [OrderStatus.DELIVERED]: "Đã giao thành công",
  [OrderStatus.CANCELLED]: "Đã hủy",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    amount || 0
  );

const emitToUser = (userId: string, payload: Record<string, unknown>) => {
  const io = getSocketServer();
  if (!io) return;

  io.of(SOCKET_NAMESPACES.NOTIFICATIONS)
    .to(buildNotificationRoom(userId))
    .emit(SOCKET_EVENTS.NOTIFICATION_SEND, payload);
};

export interface CreateNotificationInput {
  userId: string;
  title: string;
  content: string;
  type?: string;
  icon?: string;
  actionUrl?: string;
  metadata?: Record<string, unknown>;
  priority?: "low" | "normal" | "high";
}

export const notificationService = {
  async createAndEmit(input: CreateNotificationInput) {
    const notification = await UserNotificationModel.create({
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

  async notifyShopOrderCreated(options: {
    shopOwnerId: string;
    shopName?: string;
    orderId: string;
    totalAmount: number;
    buyerName?: string;
  }) {
    const orderCode = `DH${options.orderId.slice(-6).toUpperCase()}`;
    const title = "Đơn hàng mới";
    const content = `${options.buyerName || "Khách hàng"} vừa đặt ${orderCode} (${formatCurrency(
      options.totalAmount
    )})`;

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

  async notifyUserOrderStatus(options: {
    userId: string;
    orderId: string;
    status: OrderStatus;
    shopName?: string;
  }) {
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

  async notifyUserOrderPlaced(options: {
    userId: string;
    orderId: string;
    totalAmount: number;
    shopName?: string;
  }) {
    const orderCode = `DH${options.orderId.slice(-6).toUpperCase()}`;
    const title = "Đặt hàng thành công";
    const content = `Bạn đã đặt ${orderCode} tại ${
      options.shopName || "cửa hàng"
    }: ${formatCurrency(options.totalAmount)}`;

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

  async notifyShopOrderUpdate(options: {
    shopOwnerId: string;
    orderId: string;
    status: OrderStatus;
    userName?: string;
    note?: string;
  }) {
    const orderCode = `DH${options.orderId.slice(-6).toUpperCase()}`;
    const title = "Cập nhật từ khách hàng";
    const statusLabel = ORDER_STATUS_LABELS[options.status] || options.status;
    const content = `${
      options.userName || "Khách hàng"
    } vừa cập nhật ${orderCode}: ${statusLabel}${
      options.note ? ` (${options.note})` : ""
    }`;

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

  async notifyAdminsShopRegistrationPending(options: {
    shopId: string;
    shopName: string;
    ownerId: string;
  }) {
    const admins = await UserModel.find({
      role: { $in: ["admin", "moderator"] },
    })
      .select("_id name fullName email")
      .lean();

    if (!admins.length) return;

    const owner = await UserModel.findById(options.ownerId)
      .select("name fullName email")
      .lean();
    const ownerName =
      owner?.fullName || owner?.name || owner?.email || "Người bán";

    await Promise.all(
      admins.map((admin) =>
        this.createAndEmit({
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
        })
      )
    );
  },

  async notifyShopOwnerApproval(options: {
    ownerId: string;
    shopId: string;
    shopName: string;
    status: "approved" | "rejected" | "suspended";
  }) {
    const statusLabel =
      options.status === "approved"
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

  async notifyShopOwnerNewFollower(options: {
    ownerId: string;
    shopId: string;
    shopName: string;
    followerName?: string;
  }) {
    return this.createAndEmit({
      userId: options.ownerId,
      title: "Có người theo dõi cửa hàng",
      content: `${options.followerName || "Một khách hàng"} vừa theo dõi ${
        options.shopName
      }`,
      type: "shop:follower",
      actionUrl: `/shop/${options.shopId}`,
      metadata: {
        shopId: options.shopId,
        shopName: options.shopName,
      },
    });
  },
};


