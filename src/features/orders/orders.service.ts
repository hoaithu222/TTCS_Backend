import mongoose from "mongoose";
import OrderModel, { OrderStatus } from "../../models/OrderModel";
import OrderItemModel from "../../models/OrderItem";
import OrderHistoryModel from "../../models/OrderHistory";
import ProductModel from "../../models/ProductModal";
import PaymentModel from "../../models/PaymentModel";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import ShopModel from "../../models/ShopModel";
import UserModel from "../../models/UserModel";
import { notificationService } from "../../shared/services/notification.service";
import CartItemModel from "../../models/CartItem";
import CartModel from "../../models/Cart";
import CartService, { AddCartItemRequest } from "../cart/cart.service";

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

      // Remove ordered items from cart
      try {
        const cart = await CartModel.findOne({ userId });
        if (cart && cart.cartItems && cart.cartItems.length > 0) {
          // Get order items with productId and variantId
          const orderItems = await OrderItemModel.find({
            orderId: createdOrder._id,
          }).select("productId variantId quantity").lean();

          // Create a map of productId+variantId to quantity ordered
          const orderedItemsMap = new Map<string, number>();
          for (const orderItem of orderItems) {
            const key = `${orderItem.productId.toString()}_${orderItem.variantId?.toString() || 'none'}`;
            orderedItemsMap.set(key, (orderedItemsMap.get(key) || 0) + orderItem.quantity);
          }

          // Get all cart items
          const cartItems = await CartItemModel.find({
            cartId: cart._id,
          }).lean();

          // Find items to remove (match productId and variantId, remove up to ordered quantity)
          const itemsToRemove: mongoose.Types.ObjectId[] = [];
          const remainingQuantities = new Map(orderedItemsMap);

          for (const cartItem of cartItems) {
            const key = `${cartItem.productId.toString()}_${cartItem.variantId?.toString() || 'none'}`;
            const remainingQty = remainingQuantities.get(key);
            
            if (remainingQty && remainingQty > 0) {
              // Remove this cart item
              itemsToRemove.push(cartItem._id);
              // Decrease remaining quantity
              remainingQuantities.set(key, remainingQty - cartItem.quantity);
            }
          }

          // Remove matched cart items
          if (itemsToRemove.length > 0) {
            await CartItemModel.deleteMany({ _id: { $in: itemsToRemove } });
            await CartModel.updateOne(
              { _id: cart._id },
              { $pull: { cartItems: { $in: itemsToRemove } } }
            );
          }
        }
      } catch (cartError) {
        // Log error but don't fail the order creation
        console.error("[orders] Failed to remove items from cart:", cartError);
      }

      const shop = await ShopModel.findById(createdOrder.shopId).select(
        "userId name"
      );
      const buyer = (req as any).currentUser as any;
      const buyerName =
        buyer?.fullName || buyer?.name || buyer?.email || "Khách hàng";

      try {
        const notifyTasks = [
          notificationService.notifyUserOrderPlaced({
            userId,
            orderId: createdOrder._id.toString(),
            totalAmount: createdOrder.totalAmount,
            shopName: shop?.name,
          }),
        ];
        if (shop?.userId) {
          notifyTasks.push(
            notificationService.notifyShopOrderCreated({
              shopOwnerId: shop.userId.toString(),
              shopName: shop.name,
              orderId: createdOrder._id.toString(),
              totalAmount: createdOrder.totalAmount,
              buyerName,
            })
          );
        }
        await Promise.all(notifyTasks);
      } catch (notifyError) {
        console.error("[orders] notify order create failed:", notifyError);
      }

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
      .populate({
        path: "shopId",
        select: "_id name logo slug description",
      })
      .populate({
        path: "orderItems",
        populate: {
          path: "productId",
          select: "_id name images price discount",
          populate: {
            path: "images",
            select: "_id url publicId",
          },
        },
      })
      .populate({
        path: "addressId",
        select: "_id fullName phone address city district ward",
      })
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
      if (query.shopId) {
        filter.shopId = query.shopId;
        // Khi load danh sách đơn theo shop (dùng cho phía shop/admin),
        // chỉ hiển thị những đơn đã thanh toán (isPay = true)
        // để tránh trường hợp đơn chưa thanh toán vẫn tính vào đơn hàng của shop.
        filter.isPay = true;
      }
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
          .populate({
            path: "shopId",
            select: "_id name logo slug description",
          })
          .populate({
            path: "orderItems",
            populate: {
              path: "productId",
              select: "_id name images price discount",
              populate: {
                path: "images",
                select: "_id url publicId",
              },
            },
          })
          .populate({
            path: "addressId",
            select: "_id fullName phone address city district ward",
          })
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

  /**
   * Tự động hủy các đơn hàng chưa thanh toán sau 1 ngày.
   * - Áp dụng cho đơn ở trạng thái pending, isPay = false
   * - Khôi phục tồn kho sản phẩm
   * - Ghi lịch sử đơn hàng
   * - Gửi thông báo cho người dùng và chủ shop
   */
  static async autoCancelStaleUnpaidOrders() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h trước

    const staleOrders = await OrderModel.find({
      status: OrderStatus.PENDING,
      isPay: false,
      createdAt: { $lt: cutoff },
    }).lean();

    if (!staleOrders.length) {
      return { ok: true as const, cancelled: 0 };
    }

    let cancelledCount = 0;

    for (const order of staleOrders) {
      try {
        const updated = await OrderModel.findByIdAndUpdate(
          order._id,
          {
            status: OrderStatus.CANCELLED,
            cancellationReason:
              order.cancellationReason ||
              "Đơn hàng bị hệ thống tự động hủy do quá 24 giờ chưa thanh toán",
          },
          { new: true }
        );
        if (!updated) continue;

        await OrdersService.restoreInventory(updated);

        const history = await OrderHistoryModel.create({
          orderId: updated._id,
          status: OrderStatus.CANCELLED,
          description:
            "Đơn hàng bị hệ thống tự động hủy do quá 24 giờ chưa thanh toán",
        });
        await OrderModel.findByIdAndUpdate(updated._id, {
          $push: { orderHistory: history._id },
        });

        // Thông báo cho user về trạng thái đơn
        try {
          const shop = await ShopModel.findById(updated.shopId).select("name");
          await notificationService.notifyUserOrderStatus({
            userId: updated.userId.toString(),
            orderId: updated._id.toString(),
            status: OrderStatus.CANCELLED,
            shopName: shop?.name,
          });
        } catch (notifyError) {
          console.error(
            "[orders] auto-cancel notify user order status failed:",
            notifyError
          );
        }

        cancelledCount += 1;
      } catch (error) {
        console.error(
          "[orders] autoCancelStaleUnpaidOrders failed for order",
          (order as any)._id?.toString?.() || "",
          error
        );
      }
    }

    return { ok: true as const, cancelled: cancelledCount };
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

    // Handle wallet transfer based on order status
    try {
      const { default: WalletHelperService } = await import("../wallet/wallet-helper.service");
      
      if (status === OrderStatus.DELIVERED && updated.isPay && !updated.walletTransferred) {
        // Transfer money to shop wallet when order is delivered
        const payment = await PaymentModel.findOne({ orderId: updated._id }).sort({ createdAt: -1 });
        await WalletHelperService.transferToShopWallet(
          updated._id.toString(),
          updated.totalAmount,
          payment?._id.toString()
        );
      } else if (status === OrderStatus.CANCELLED && updated.isPay) {
        // Refund money when order is cancelled
        await WalletHelperService.refundOrder(
          updated._id.toString(),
          description || "Đơn hàng bị hủy"
        );
      }
    } catch (walletError) {
      console.error("[orders] wallet operation failed:", walletError);
      // Don't fail the order status update if wallet operation fails
    }

    try {
      const shop = await ShopModel.findById(updated.shopId).select("name");
      await notificationService.notifyUserOrderStatus({
        userId: updated.userId.toString(),
        orderId: updated._id.toString(),
        status,
        shopName: shop?.name,
      });
    } catch (notifyError) {
      console.error(
        "[orders] notify user order status failed:",
        notifyError
      );
    }

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

    // Refund money if order was paid
    try {
      if (order.isPay) {
        const { default: WalletHelperService } = await import("../wallet/wallet-helper.service");
        await WalletHelperService.refundOrder(
          order._id.toString(),
          reason || "Đơn hàng bị hủy bởi người dùng"
        );
      }
    } catch (walletError) {
      console.error("[orders] refund failed:", walletError);
      // Don't fail the cancellation if refund fails
    }

    try {
      const shop = await ShopModel.findById(order.shopId).select("userId name");
      if (shop?.userId) {
        const customer =
          ((req as any).currentUser as any) ||
          (await UserModel.findById(order.userId)
            .select("name fullName email")
            .lean());
        const customerName =
          customer?.fullName || customer?.name || customer?.email || "Khách hàng";
        await notificationService.notifyShopOrderUpdate({
          shopOwnerId: shop.userId.toString(),
          orderId: order._id.toString(),
          status: order.status,
          userName: customerName,
          note: reason,
        });
      }
    } catch (notifyError) {
      console.error("[orders] notify shop order update failed:", notifyError);
    }

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

  static async track(req: AuthenticatedRequest, id: string) {
    const currentUser = (req as any).currentUser as any;
    if (!currentUser)
      return { ok: false as const, status: 401, message: "Unauthorized" };

    const order = await OrderModel.findById(id)
      .populate({
        path: "shopId",
        select: "_id name logo slug description",
      })
      .populate({
        path: "orderItems",
        populate: {
          path: "productId",
          select: "_id name images price discount",
          populate: {
            path: "images",
            select: "_id url publicId",
          },
        },
      })
      .populate({
        path: "addressId",
        select: "_id fullName phone address city district ward",
      });

    if (!order)
      return { ok: false as const, status: 404, message: "Order không tồn tại" };

    const isOwner = order.userId.toString() === currentUser.id?.toString();
    if (currentUser.role !== "admin" && !isOwner) {
      return { ok: false as const, status: 403, message: "Forbidden" };
    }

    const historyDocs = await OrderHistoryModel.find({ orderId: order._id })
      .sort({ createdAt: 1 })
      .lean();

    const trackingHistory = historyDocs.map((entry) => ({
      status: entry.status,
      timestamp: entry.createdAt,
      note: entry.description,
    }));

    return { ok: true as const, order, trackingHistory };
  }

  static async reorder(req: AuthenticatedRequest, id: string) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };

    const order = await OrderModel.findById(id)
      .select("userId shopId orderItems")
      .lean();
    if (!order)
      return { ok: false as const, status: 404, message: "Order không tồn tại" };
    if (order.userId.toString() !== userId.toString()) {
      return { ok: false as const, status: 403, message: "Forbidden" };
    }

    const orderItems = await OrderItemModel.find({
      _id: { $in: order.orderItems },
    })
      .select("productId variantId quantity price")
      .lean();

    if (!orderItems.length) {
      return {
        ok: false as const,
        status: 400,
        message: "Đơn hàng không có sản phẩm để mua lại",
      };
    }

    for (const item of orderItems) {
      const payload: AddCartItemRequest = {
        productId: item.productId.toString(),
        variantId: item.variantId?.toString(),
        quantity: item.quantity || 1,
        priceAtTime: item.price,
        shopId: order.shopId.toString(),
      };
      const result = await CartService.addItem(req, payload);

      if (!result.ok) {
        return {
          ok: false as const,
          status: result.status ?? 400,
          message: result.message || "Không thể thêm sản phẩm vào giỏ hàng",
        };
      }
    }

    return { ok: true as const };
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
