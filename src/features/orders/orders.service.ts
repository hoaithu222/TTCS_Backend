import mongoose from "mongoose";
import OrderModel, { OrderStatus } from "../../models/OrderModel";
import OrderItemModel from "../../models/OrderItem";
import OrderHistoryModel from "../../models/OrderHistory";
import ProductModel from "../../models/ProductModal";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

export interface CreateOrderItemInput {
  productId: string;
  variantId?: string; // Optional - not all products have variants
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
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    if (!data.items || data.items.length === 0) {
      return {
        ok: false as const,
        status: 400,
        message: "Danh sách sản phẩm không hợp lệ",
      };
    }

    const session = await mongoose.startSession();
    let createdOrder: any = null;
    try {
      await session.withTransaction(async () => {
        const sanitizedItems: Array<{
          productId: mongoose.Types.ObjectId;
          variantId?: mongoose.Types.ObjectId;
          quantity: number;
          price: number;
          totalPrice: number;
          discount: number;
          tax: number;
        }> = [];
        let subtotal = 0;
        let discountAmount = 0;

        for (const rawItem of data.items) {
          const product = await ProductModel.findById(rawItem.productId)
            .select("price discount stock variants shopId")
            .session(session);
          if (!product)
            throw new Error("Sản phẩm trong đơn hàng không tồn tại");
          if (data.shopId && product.shopId.toString() !== data.shopId) {
            throw new Error("Sản phẩm không thuộc cửa hàng đã chọn");
          }

          const quantity =
            Number.isFinite(rawItem.quantity) && rawItem.quantity > 0
              ? rawItem.quantity
              : 1;

          let variantDoc: any = null;
          if (rawItem.variantId) {
            variantDoc = product.variants.id(rawItem.variantId);
            if (!variantDoc)
              throw new Error("Biến thể sản phẩm không tồn tại");
            if ((variantDoc.stock || 0) < quantity)
              throw new Error("Số lượng biến thể không đủ");
          } else if ((product.stock || 0) < quantity) {
            throw new Error("Số lượng sản phẩm không đủ");
          }

          const basePrice = variantDoc?.price ?? product.price ?? 0;
          const discountPercent = Math.min(
            Math.max(product.discount ?? 0, 0),
            100
          );
          const discountedPrice =
            basePrice - (basePrice * discountPercent) / 100;
          const lineTotal = discountedPrice * quantity;

          sanitizedItems.push({
            productId: product._id,
            variantId: variantDoc?._id,
            quantity,
            price: basePrice,
            totalPrice: lineTotal,
            discount: discountPercent,
            tax: rawItem.tax ?? 0,
          });

          subtotal += lineTotal;
          discountAmount += (basePrice - discountedPrice) * quantity;

          if (variantDoc) {
            variantDoc.stock = Math.max(0, (variantDoc.stock || 0) - quantity);
          } else {
            product.stock = Math.max(0, (product.stock || 0) - quantity);
          }
          await product.save({ session });
        }

        const orderItemsDocs = await OrderItemModel.insertMany(
          sanitizedItems.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
            price: i.price,
            totalPrice: i.totalPrice,
            discount: i.discount,
            tax: i.tax,
          })),
          { session }
        );

        const shippingFee = Number.isFinite(data.shippingFee)
          ? data.shippingFee
          : 0;
        const totalAmount = subtotal + shippingFee;

        const [order] = await OrderModel.create(
          [
            {
              userId,
              shopId: data.shopId,
              totalAmount,
              shippingFee,
              status: OrderStatus.PENDING,
              addressId: data.addressId,
              paymentMethod: data.paymentMethod,
              notes: data.notes,
              voucherId: data.voucherId,
              isPay: false,
              discountAmount,
              orderItems: orderItemsDocs.map((d) => d._id),
            },
          ],
          { session }
        );

        await OrderItemModel.updateMany(
          { _id: { $in: order.orderItems } },
          { orderId: order._id },
          { session }
        );

        const [history] = await OrderHistoryModel.create(
          [
            {
              orderId: order._id,
              status: OrderStatus.PENDING,
              description: "Order created",
            },
          ],
          { session }
        );

        await OrderModel.findByIdAndUpdate(
          order._id,
          { $push: { orderHistory: history._id } },
          { session }
        );

        createdOrder = order;
      });

      if (!createdOrder)
        throw new Error("Không thể tạo đơn hàng, vui lòng thử lại");

      return { ok: true as const, order: createdOrder };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    } finally {
      await session.endSession();
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
        OrderModel.find(filter)
          .skip(skip)
          .limit(limit)
          .sort(sort)
          .populate("orderHistory"),
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

  static async cancelByUser(
    req: AuthenticatedRequest,
    id: string,
    reason?: string
  ) {
    const currentUser = (req as any).currentUser as any;
    const order = await OrderModel.findById(id);
    if (!order)
      return {
        ok: false as const,
        status: 404,
        message: "Order không tồn tại",
      };
    if (order.userId.toString() !== currentUser.id.toString()) {
      return { ok: false as const, status: 403, message: "Forbidden" };
    }
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PROCESSING
    ) {
      return {
        ok: false as const,
        status: 409,
        message: "Không thể hủy đơn hàng ở trạng thái hiện tại",
      };
    }

    order.status = OrderStatus.CANCELLED;
    if (reason) order.cancellationReason = reason;
    await order.save();
    await OrdersService.restoreInventory(order);

    const history = await OrderHistoryModel.create({
      orderId: order._id,
      status: OrderStatus.CANCELLED,
      description: reason || "Order cancelled by user",
    });
    await OrderModel.findByIdAndUpdate(order._id, {
      $push: { orderHistory: history._id },
    });

    return { ok: true as const, order };
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

  private static async restoreInventory(order: any) {
    if (!order?.orderItems?.length) return;
    const orderItems = await OrderItemModel.find({
      _id: { $in: order.orderItems },
    });

    for (const item of orderItems) {
      const product = await ProductModel.findById(item.productId).select(
        "stock variants"
      );
      if (!product) continue;

      if (item.variantId) {
        const variant = product.variants.id(item.variantId);
        if (variant) {
          variant.stock = (variant.stock || 0) + (item.quantity || 0);
        }
      } else {
        product.stock = (product.stock || 0) + (item.quantity || 0);
      }

      await product.save();
    }
  }
}
