import OrderModel, { OrderStatus } from "../../models/OrderModel";
import OrderItemModel from "../../models/OrderItem";
import OrderHistoryModel from "../../models/OrderHistory";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

export interface CreateOrderItemInput {
  productId: string;
  variantId: string;
  quantity: number;
  price: number;
  totalPrice: number;
  discount?: number;
  tax?: number;
}

export interface CreateOrderRequest {
  shopId: string;
  addressId: string;
  paymentMethod: string;
  shippingFee: number;
  items: CreateOrderItemInput[];
  notes?: string;
  voucherId?: string;
}

export interface ListOrdersQuery {
  page?: number;
  limit?: number;
  status?: string;
  shopId?: string;
  userId?: string;
  sortBy?: "createdAt" | "totalAmount";
  sortOrder?: "asc" | "desc";
}

export default class OrdersService {
  static async create(req: AuthenticatedRequest, data: CreateOrderRequest) {
    try {
      const userId = (req as any).user?.userId;
      if (!userId)
        return { ok: false as const, status: 401, message: "Unauthorized" };

      const orderItemsDocs = await OrderItemModel.insertMany(
        (data.items || []).map((i) => ({
          orderId: undefined as any,
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price,
          totalPrice: i.totalPrice,
          discount: i.discount ?? 0,
          tax: i.tax ?? 0,
        }))
      );
      const totalAmount =
        orderItemsDocs.reduce((sum, it) => sum + (it as any).totalPrice, 0) +
        data.shippingFee;
      const order = await OrderModel.create({
        userId,
        shopId: data.shopId,
        totalAmount,
        shippingFee: data.shippingFee,
        status: OrderStatus.PENDING,
        addressId: data.addressId,
        paymentMethod: data.paymentMethod,
        notes: data.notes,
        voucherId: data.voucherId,
        isPay: false,
        discountAmount: 0,
        orderItems: orderItemsDocs.map((d) => d._id),
      });
      await OrderItemModel.updateMany(
        { _id: { $in: order.orderItems } },
        { orderId: order._id }
      );
      const history = await OrderHistoryModel.create({
        orderId: order._id,
        status: OrderStatus.PENDING,
        description: "Order created",
      });
      await OrderModel.findByIdAndUpdate(order._id, {
        $push: { orderHistory: history._id },
      });
      return { ok: true as const, order };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }

  static async get(req: AuthenticatedRequest, id: string) {
    const currentUser = (req as any).currentUser as any;
    const order = await OrderModel.findById(id)
      .populate("orderItems")
      .populate("orderHistory");
    if (!order)
      return {
        ok: false as const,
        status: 404,
        message: "Order không tồn tại",
      };
    if (
      currentUser.role !== "admin" &&
      order.userId.toString() !== currentUser.id.toString()
    ) {
      return { ok: false as const, status: 403, message: "Forbidden" };
    }
    return { ok: true as const, order };
  }

  static async list(req: AuthenticatedRequest, query: ListOrdersQuery) {
    try {
      const currentUser = (req as any).currentUser as any;
      const page =
        Number.isFinite(query.page as number) && (query.page as number) > 0
          ? (query.page as number)
          : 1;
      const limit =
        Number.isFinite(query.limit as number) && (query.limit as number) > 0
          ? Math.min(query.limit as number, 100)
          : 10;
      const skip = (page - 1) * limit;
      const filter: any = {};
      if (query.status) filter.status = query.status;
      if (query.shopId) filter.shopId = query.shopId;
      // Non-admins only see their own orders
      if (currentUser.role !== "admin") filter.userId = currentUser.id;
      else if (query.userId) filter.userId = query.userId;

      const sortField = query.sortBy || "createdAt";
      const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
      const sort: any = { [sortField]: sortDir };

      const [items, total] = await Promise.all([
        OrderModel.find(filter).skip(skip).limit(limit).sort(sort),
        OrderModel.countDocuments(filter),
      ]);
      return { ok: true as const, items, total, page, limit };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  static async update(req: AuthenticatedRequest, id: string, data: any) {
    const updated = await OrderModel.findByIdAndUpdate(id, data, { new: true });
    if (!updated)
      return {
        ok: false as const,
        status: 404,
        message: "Order không tồn tại",
      };
    return { ok: true as const, order: updated };
  }

  static async updateStatus(
    req: AuthenticatedRequest,
    id: string,
    status: OrderStatus,
    description?: string
  ) {
    const updated = await OrderModel.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    if (!updated)
      return {
        ok: false as const,
        status: 404,
        message: "Order không tồn tại",
      };
    const history = await OrderHistoryModel.create({
      orderId: updated._id,
      status,
      description: description || `Order status changed to ${status}`,
    });
    await OrderModel.findByIdAndUpdate(updated._id, {
      $push: { orderHistory: history._id },
    });
    return { ok: true as const, order: updated };
  }

  static async delete(req: AuthenticatedRequest, id: string) {
    const deleted = await OrderModel.findByIdAndDelete(id);
    if (!deleted)
      return {
        ok: false as const,
        status: 404,
        message: "Order không tồn tại",
      };
    return { ok: true as const, order: deleted };
  }
}
