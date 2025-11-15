import CartModel from "../../models/Cart";
import CartItemModel from "../../models/CartItem";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

export interface AddCartItemRequest {
  productId: string;
  variantId: string;
  quantity: number;
  priceAtTime: number;
  shopId: string;
}

export interface UpdateCartItemRequest {
  quantity?: number;
}

export default class CartService {
  static async getOrCreate(req: AuthenticatedRequest) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    let cart = await CartModel.findOne({ userId }).populate({
      path: "cartItems",
      populate: [
        {
          path: "productId",
          select: "name images price discount stock",
          populate: {
            path: "images",
            select: "url publicId",
          },
        },
        {
          path: "shopId",
          select: "name logo",
        },
      ],
    });
    if (!cart) {
      cart = await CartModel.create({ userId, cartItems: [] });
    }
    return { ok: true as const, cart };
  }

  static async addItem(req: AuthenticatedRequest, data: AddCartItemRequest) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    let cart = await CartModel.findOne({ userId });
    if (!cart) cart = await CartModel.create({ userId, cartItems: [] });

    const item = await CartItemModel.create({
      cartId: cart._id,
      productId: data.productId,
      variantId: data.variantId,
      quantity: data.quantity,
      priceAtTime: data.priceAtTime,
      shopId: data.shopId,
    });
    await CartModel.findByIdAndUpdate(cart._id, {
      $push: { cartItems: item._id },
    });
    const populated = await CartModel.findById(cart._id).populate({
      path: "cartItems",
      populate: [
        {
          path: "productId",
          select: "name images price discount stock",
          populate: {
            path: "images",
            select: "url publicId",
          },
        },
        {
          path: "shopId",
          select: "name logo",
        },
      ],
    });
    return { ok: true as const, cart: populated };
  }

  static async updateItem(
    req: AuthenticatedRequest,
    itemId: string,
    data: UpdateCartItemRequest
  ) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    const item = await CartItemModel.findByIdAndUpdate(
      itemId,
      { $set: { ...data } },
      { new: true }
    );
    if (!item)
      return {
        ok: false as const,
        status: 404,
        message: "Cart item không tồn tại",
      };
    const cart = await CartModel.findOne({ userId }).populate({
      path: "cartItems",
      populate: [
        {
          path: "productId",
          select: "name images price discount stock",
          populate: {
            path: "images",
            select: "url publicId",
          },
        },
        {
          path: "shopId",
          select: "name logo",
        },
      ],
    });
    return { ok: true as const, cart };
  }

  static async removeItem(req: AuthenticatedRequest, itemId: string) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    await CartItemModel.findByIdAndDelete(itemId);
    await CartModel.updateOne({ userId }, { $pull: { cartItems: itemId } });
    const cart = await CartModel.findOne({ userId }).populate({
      path: "cartItems",
      populate: [
        {
          path: "productId",
          select: "name images price discount stock",
          populate: {
            path: "images",
            select: "url publicId",
          },
        },
        {
          path: "shopId",
          select: "name logo",
        },
      ],
    });
    return { ok: true as const, cart };
  }

  static async clear(req: AuthenticatedRequest) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    const cart = await CartModel.findOne({ userId });
    if (cart) {
      await CartItemModel.deleteMany({ _id: { $in: cart.cartItems } });
      await CartModel.updateOne({ _id: cart._id }, { $set: { cartItems: [] } });
    }
    const refreshed = await CartModel.findOne({ userId }).populate({
      path: "cartItems",
      populate: [
        {
          path: "productId",
          select: "name images price discount stock",
          populate: {
            path: "images",
            select: "url publicId",
          },
        },
        {
          path: "shopId",
          select: "name logo",
        },
      ],
    });
    return { ok: true as const, cart: refreshed };
  }
}
