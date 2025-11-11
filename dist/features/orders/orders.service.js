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
const OrderModel_1 = __importStar(require("../../models/OrderModel"));
const OrderItem_1 = __importDefault(require("../../models/OrderItem"));
const OrderHistory_1 = __importDefault(require("../../models/OrderHistory"));
class OrdersService {
    static async create(req, data) {
        try {
            const userId = req.user?.userId;
            if (!userId)
                return { ok: false, status: 401, message: "Unauthorized" };
            const orderItemsDocs = await OrderItem_1.default.insertMany((data.items || []).map((i) => ({
                orderId: undefined,
                productId: i.productId,
                variantId: i.variantId,
                quantity: i.quantity,
                price: i.price,
                totalPrice: i.totalPrice,
                discount: i.discount ?? 0,
                tax: i.tax ?? 0,
            })));
            const totalAmount = orderItemsDocs.reduce((sum, it) => sum + it.totalPrice, 0) +
                data.shippingFee;
            const order = await OrderModel_1.default.create({
                userId,
                shopId: data.shopId,
                totalAmount,
                shippingFee: data.shippingFee,
                status: OrderModel_1.OrderStatus.PENDING,
                addressId: data.addressId,
                paymentMethod: data.paymentMethod,
                notes: data.notes,
                voucherId: data.voucherId,
                isPay: false,
                discountAmount: 0,
                orderItems: orderItemsDocs.map((d) => d._id),
            });
            await OrderItem_1.default.updateMany({ _id: { $in: order.orderItems } }, { orderId: order._id });
            const history = await OrderHistory_1.default.create({
                orderId: order._id,
                status: OrderModel_1.OrderStatus.PENDING,
                description: "Order created",
            });
            await OrderModel_1.default.findByIdAndUpdate(order._id, {
                $push: { orderHistory: history._id },
            });
            return { ok: true, order };
        }
        catch (error) {
            return {
                ok: false,
                status: 400,
                message: error.message,
            };
        }
    }
    static async get(req, id) {
        const currentUser = req.currentUser;
        const order = await OrderModel_1.default.findById(id)
            .populate("orderItems")
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
                OrderModel_1.default.find(filter).skip(skip).limit(limit).sort(sort),
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
        return { ok: true, order: updated };
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
}
exports.default = OrdersService;
