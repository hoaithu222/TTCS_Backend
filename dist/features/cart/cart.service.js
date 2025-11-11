"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Cart_1 = __importDefault(require("../../models/Cart"));
const CartItem_1 = __importDefault(require("../../models/CartItem"));
class CartService {
    static async getOrCreate(req) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        let cart = await Cart_1.default.findOne({ userId }).populate("cartItems");
        if (!cart) {
            cart = await Cart_1.default.create({ userId, cartItems: [] });
        }
        return { ok: true, cart };
    }
    static async addItem(req, data) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        let cart = await Cart_1.default.findOne({ userId });
        if (!cart)
            cart = await Cart_1.default.create({ userId, cartItems: [] });
        const item = await CartItem_1.default.create({
            cartId: cart._id,
            productId: data.productId,
            variantId: data.variantId,
            quantity: data.quantity,
            priceAtTime: data.priceAtTime,
            shopId: data.shopId,
        });
        await Cart_1.default.findByIdAndUpdate(cart._id, {
            $push: { cartItems: item._id },
        });
        const populated = await Cart_1.default.findById(cart._id).populate("cartItems");
        return { ok: true, cart: populated };
    }
    static async updateItem(req, itemId, data) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        const item = await CartItem_1.default.findByIdAndUpdate(itemId, { $set: { ...data } }, { new: true });
        if (!item)
            return {
                ok: false,
                status: 404,
                message: "Cart item không tồn tại",
            };
        const cart = await Cart_1.default.findOne({ userId }).populate("cartItems");
        return { ok: true, cart };
    }
    static async removeItem(req, itemId) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        await CartItem_1.default.findByIdAndDelete(itemId);
        await Cart_1.default.updateOne({ userId }, { $pull: { cartItems: itemId } });
        const cart = await Cart_1.default.findOne({ userId }).populate("cartItems");
        return { ok: true, cart };
    }
    static async clear(req) {
        const userId = req.user?.userId;
        if (!userId)
            return { ok: false, status: 401, message: "Unauthorized" };
        const cart = await Cart_1.default.findOne({ userId });
        if (cart) {
            await CartItem_1.default.deleteMany({ _id: { $in: cart.cartItems } });
            await Cart_1.default.updateOne({ _id: cart._id }, { $set: { cartItems: [] } });
        }
        const refreshed = await Cart_1.default.findOne({ userId }).populate("cartItems");
        return { ok: true, cart: refreshed };
    }
}
exports.default = CartService;
