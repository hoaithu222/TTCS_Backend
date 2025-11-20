"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const OrderModel_1 = __importStar(require("../../models/OrderModel"));
const OrderItem_1 = __importDefault(require("../../models/OrderItem"));
const OrderHistory_1 = __importDefault(require("../../models/OrderHistory"));
const ProductModal_1 = __importDefault(require("../../models/ProductModal"));
const PaymentModel_1 = __importDefault(require("../../models/PaymentModel"));
const ShopModel_1 = __importDefault(require("../../models/ShopModel"));
const UserModel_1 = __importDefault(require("../../models/UserModel"));
const notification_service_1 = require("../../shared/services/notification.service");
const CartItem_1 = __importDefault(require("../../models/CartItem"));
const Cart_1 = __importDefault(require("../../models/Cart"));
class OrdersService {
    static async create(req, data) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        if (!data.items || data.items.length === 0) {
            return {
                ok: false,
                status: 400,
                message: "Danh sách sản phẩm không hợp lệ",
            };
        }
        const session = await mongoose_1.default.startSession();
        let createdOrder = null;
        try {
            await session.withTransaction(async () => {
                const sanitizedItems = [];
                let subtotal = 0;
                let discountAmount = 0;
                for (const rawItem of data.items) {
                    const product = await ProductModal_1.default.findById(rawItem.productId)
                        .select("price discount stock variants shopId")
                        .session(session);
                    if (!product)
                        throw new Error("Sản phẩm trong đơn hàng không tồn tại");
                    if (data.shopId && product.shopId.toString() !== data.shopId) {
                        throw new Error("Sản phẩm không thuộc cửa hàng đã chọn");
                    }
                    const quantity = Number.isFinite(rawItem.quantity) && rawItem.quantity > 0
                        ? rawItem.quantity
                        : 1;
                    let variantDoc = null;
                    if (rawItem.variantId) {
                        variantDoc = product.variants.id(rawItem.variantId);
                        if (!variantDoc)
                            throw new Error("Biến thể sản phẩm không tồn tại");
                        if ((variantDoc.stock || 0) < quantity)
                            throw new Error("Số lượng biến thể không đủ");
                    }
                    else if ((product.stock || 0) < quantity) {
                        throw new Error("Số lượng sản phẩm không đủ");
                    }
                    const basePrice = variantDoc?.price ?? product.price ?? 0;
                    const discountPercent = Math.min(Math.max(product.discount ?? 0, 0), 100);
                    const discountedPrice = basePrice - (basePrice * discountPercent) / 100;
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
                    }
                    else {
                        product.stock = Math.max(0, (product.stock || 0) - quantity);
                    }
                    await product.save({ session });
                }
                const orderItemsDocs = await OrderItem_1.default.insertMany(sanitizedItems.map((i) => ({
                    productId: i.productId,
                    variantId: i.variantId,
                    quantity: i.quantity,
                    price: i.price,
                    totalPrice: i.totalPrice,
                    discount: i.discount,
                    tax: i.tax,
                })), { session });
                const shippingFee = Number.isFinite(data.shippingFee)
                    ? data.shippingFee
                    : 0;
                const totalAmount = subtotal + shippingFee;
                const [order] = await OrderModel_1.default.create([
                    {
                        userId,
                        shopId: data.shopId,
                        totalAmount,
                        shippingFee,
                        status: OrderModel_1.OrderStatus.PENDING,
                        addressId: data.addressId,
                        paymentMethod: data.paymentMethod,
                        notes: data.notes,
                        voucherId: data.voucherId,
                        isPay: false,
                        discountAmount,
                        orderItems: orderItemsDocs.map((d) => d._id),
                    },
                ], { session });
                await OrderItem_1.default.updateMany({ _id: { $in: order.orderItems } }, { orderId: order._id }, { session });
                const [history] = await OrderHistory_1.default.create([
                    {
                        orderId: order._id,
                        status: OrderModel_1.OrderStatus.PENDING,
                        description: "Order created",
                    },
                ], { session });
                await OrderModel_1.default.findByIdAndUpdate(order._id, { $push: { orderHistory: history._id } }, { session });
                createdOrder = order;
            });
            if (!createdOrder)
                throw new Error("Không thể tạo đơn hàng, vui lòng thử lại");
            // Remove ordered items from cart
            try {
                const cart = await Cart_1.default.findOne({ userId });
                if (cart && cart.cartItems && cart.cartItems.length > 0) {
                    // Get order items with productId and variantId
                    const orderItems = await OrderItem_1.default.find({
                        orderId: createdOrder._id,
                    }).select("productId variantId quantity").lean();
                    // Create a map of productId+variantId to quantity ordered
                    const orderedItemsMap = new Map();
                    for (const orderItem of orderItems) {
                        const key = `${orderItem.productId.toString()}_${orderItem.variantId?.toString() || 'none'}`;
                        orderedItemsMap.set(key, (orderedItemsMap.get(key) || 0) + orderItem.quantity);
                    }
                    // Get all cart items
                    const cartItems = await CartItem_1.default.find({
                        cartId: cart._id,
                    }).lean();
                    // Find items to remove (match productId and variantId, remove up to ordered quantity)
                    const itemsToRemove = [];
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
                        await CartItem_1.default.deleteMany({ _id: { $in: itemsToRemove } });
                        await Cart_1.default.updateOne({ _id: cart._id }, { $pull: { cartItems: { $in: itemsToRemove } } });
                    }
                }
            }
            catch (cartError) {
                // Log error but don't fail the order creation
                console.error("[orders] Failed to remove items from cart:", cartError);
            }
            const shop = await ShopModel_1.default.findById(createdOrder.shopId).select("userId name");
            const buyer = req.currentUser;
            const buyerName = buyer?.fullName || buyer?.name || buyer?.email || "Khách hàng";
            try {
                const notifyTasks = [
                    notification_service_1.notificationService.notifyUserOrderPlaced({
                        userId,
                        orderId: createdOrder._id.toString(),
                        totalAmount: createdOrder.totalAmount,
                        shopName: shop?.name,
                    }),
                ];
                if (shop?.userId) {
                    notifyTasks.push(notification_service_1.notificationService.notifyShopOrderCreated({
                        shopOwnerId: shop.userId.toString(),
                        shopName: shop.name,
                        orderId: createdOrder._id.toString(),
                        totalAmount: createdOrder.totalAmount,
                        buyerName,
                    }));
                }
                await Promise.all(notifyTasks);
            }
            catch (notifyError) {
                console.error("[orders] notify order create failed:", notifyError);
            }
            return { ok: true, order: createdOrder };
        }
        catch (error) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
        finally {
            await session.endSession();
        }
    }
    static async get(req, id) {
        const currentUser = req.currentUser;
        const order = await OrderModel_1.default.findById(id)
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
                ok: false,
                status: 404,
                message: "Order không tồn tại",
            };
        if (currentUser.role !== "admin" &&
            order.userId.toString() !== currentUser.id.toString()) {
            return { ok: false, status: 403, message: "Forbidden" };
        }
        return { ok: true, order };
    }
    static async list(req, query) {
        try {
            const currentUser = req.currentUser;
            const page = Number.isFinite(query.page) && query.page > 0
                ? query.page
                : 1;
            const limit = Number.isFinite(query.limit) && query.limit > 0
                ? Math.min(query.limit, 100)
                : 10;
            const skip = (page - 1) * limit;
            const filter = {};
            if (query.status)
                filter.status = query.status;
            if (query.shopId)
                filter.shopId = query.shopId;
            // Non-admins only see their own orders
            if (currentUser.role !== "admin")
                filter.userId = currentUser.id;
            else if (query.userId)
                filter.userId = query.userId;
            const sortField = query.sortBy || "createdAt";
            const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
            const sort = { [sortField]: sortDir };
            const [items, total] = await Promise.all([
                OrderModel_1.default.find(filter)
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
                OrderModel_1.default.countDocuments(filter),
            ]);
            return { ok: true, items, total, page, limit };
        }
        catch (error) {
            return {
                ok: false,
                status: 500,
                message: error.message,
            };
        }
    }
    static async update(req, id, data) {
        const updated = await OrderModel_1.default.findByIdAndUpdate(id, data, { new: true });
        if (!updated)
            return {
                ok: false,
                status: 404,
                message: "Order không tồn tại",
            };
        return { ok: true, order: updated };
    }
    static async updateStatus(req, id, status, description) {
        const updated = await OrderModel_1.default.findByIdAndUpdate(id, { status }, { new: true });
        if (!updated)
            return {
                ok: false,
                status: 404,
                message: "Order không tồn tại",
            };
        const history = await OrderHistory_1.default.create({
            orderId: updated._id,
            status,
            description: description || `Order status changed to ${status}`,
        });
        await OrderModel_1.default.findByIdAndUpdate(updated._id, {
            $push: { orderHistory: history._id },
        });
        // Handle wallet transfer based on order status
        try {
            const { default: WalletHelperService } = await Promise.resolve().then(() => __importStar(require("../wallet/wallet-helper.service")));
            if (status === OrderModel_1.OrderStatus.DELIVERED && updated.isPay && !updated.walletTransferred) {
                // Transfer money to shop wallet when order is delivered
                const payment = await PaymentModel_1.default.findOne({ orderId: updated._id }).sort({ createdAt: -1 });
                await WalletHelperService.transferToShopWallet(updated._id.toString(), updated.totalAmount, payment?._id.toString());
            }
            else if (status === OrderModel_1.OrderStatus.CANCELLED && updated.isPay) {
                // Refund money when order is cancelled
                await WalletHelperService.refundOrder(updated._id.toString(), description || "Đơn hàng bị hủy");
            }
        }
        catch (walletError) {
            console.error("[orders] wallet operation failed:", walletError);
            // Don't fail the order status update if wallet operation fails
        }
        try {
            const shop = await ShopModel_1.default.findById(updated.shopId).select("name");
            await notification_service_1.notificationService.notifyUserOrderStatus({
                userId: updated.userId.toString(),
                orderId: updated._id.toString(),
                status,
                shopName: shop?.name,
            });
        }
        catch (notifyError) {
            console.error("[orders] notify user order status failed:", notifyError);
        }
        return { ok: true, order: updated };
    }
    static async cancelByUser(req, id, reason) {
        const currentUser = req.currentUser;
        const order = await OrderModel_1.default.findById(id);
        if (!order)
            return {
                ok: false,
                status: 404,
                message: "Order không tồn tại",
            };
        if (order.userId.toString() !== currentUser.id.toString()) {
            return { ok: false, status: 403, message: "Forbidden" };
        }
        if (order.status !== OrderModel_1.OrderStatus.PENDING &&
            order.status !== OrderModel_1.OrderStatus.PROCESSING) {
            return {
                ok: false,
                status: 409,
                message: "Không thể hủy đơn hàng ở trạng thái hiện tại",
            };
        }
        order.status = OrderModel_1.OrderStatus.CANCELLED;
        if (reason)
            order.cancellationReason = reason;
        await order.save();
        await OrdersService.restoreInventory(order);
        const history = await OrderHistory_1.default.create({
            orderId: order._id,
            status: OrderModel_1.OrderStatus.CANCELLED,
            description: reason || "Order cancelled by user",
        });
        await OrderModel_1.default.findByIdAndUpdate(order._id, {
            $push: { orderHistory: history._id },
        });
        // Refund money if order was paid
        try {
            if (order.isPay) {
                const { default: WalletHelperService } = await Promise.resolve().then(() => __importStar(require("../wallet/wallet-helper.service")));
                await WalletHelperService.refundOrder(order._id.toString(), reason || "Đơn hàng bị hủy bởi người dùng");
            }
        }
        catch (walletError) {
            console.error("[orders] refund failed:", walletError);
            // Don't fail the cancellation if refund fails
        }
        try {
            const shop = await ShopModel_1.default.findById(order.shopId).select("userId name");
            if (shop?.userId) {
                const customer = req.currentUser ||
                    (await UserModel_1.default.findById(order.userId)
                        .select("name fullName email")
                        .lean());
                const customerName = customer?.fullName || customer?.name || customer?.email || "Khách hàng";
                await notification_service_1.notificationService.notifyShopOrderUpdate({
                    shopOwnerId: shop.userId.toString(),
                    orderId: order._id.toString(),
                    status: order.status,
                    userName: customerName,
                    note: reason,
                });
            }
        }
        catch (notifyError) {
            console.error("[orders] notify shop order update failed:", notifyError);
        }
        return { ok: true, order };
    }
    static async delete(req, id) {
        const deleted = await OrderModel_1.default.findByIdAndDelete(id);
        if (!deleted)
            return {
                ok: false,
                status: 404,
                message: "Order không tồn tại",
            };
        return { ok: true, order: deleted };
    }
    static async restoreInventory(order) {
        if (!order?.orderItems?.length)
            return;
        const orderItems = await OrderItem_1.default.find({
            _id: { $in: order.orderItems },
        });
        for (const item of orderItems) {
            const product = await ProductModal_1.default.findById(item.productId).select("stock variants");
            if (!product)
                continue;
            if (item.variantId) {
                const variant = product.variants.id(item.variantId);
                if (variant) {
                    variant.stock = (variant.stock || 0) + (item.quantity || 0);
                }
            }
            else {
                product.stock = (product.stock || 0) + (item.quantity || 0);
            }
            await product.save();
        }
    }
}
exports.default = OrdersService;
