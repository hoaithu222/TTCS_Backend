import mongoose from "mongoose";
import CartModel from "../../models/Cart";
import CartItemModel from "../../models/CartItem";
import ProductModel from "../../models/ProductModal";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

export interface AddCartItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
  priceAtTime?: number;
  shopId: string;
}

export interface UpdateCartItemRequest {
  quantity?: number;
  variantId?: string;
  priceAtTime?: number;
}

const CART_ITEM_POPULATE = {
  path: "cartItems",
  populate: [
    {
      path: "productId",
      select: "name images price discount stock variants",
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
};

const extractImageUrl = (value: any): string | undefined => {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (typeof value.url === "string") return value.url;
    if (Array.isArray(value) && value.length > 0) {
      const first = value[0];
      if (typeof first === "string") return first;
      if (first && typeof first === "object" && typeof first.url === "string") {
        return first.url;
      }
    }
  }
  return undefined;
};

export default class CartService {
  static async getOrCreate(req: AuthenticatedRequest) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    let cart = await CartModel.findOne({ userId }).populate(CART_ITEM_POPULATE);
    if (!cart) {
      cart = await CartModel.create({ userId, cartItems: [] });
      cart = await CartModel.findOne({ userId }).populate(CART_ITEM_POPULATE);
    }
    return { ok: true as const, cart };
  }

  static async addItem(req: AuthenticatedRequest, data: AddCartItemRequest) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };
    let cart = await CartModel.findOne({ userId });
    if (!cart) cart = await CartModel.create({ userId, cartItems: [] });

    const product = await ProductModel.findById(data.productId)
      .select("shopId price discount variants images name")
      .lean();
    if (!product)
      return {
        ok: false as const,
        status: 400,
        message: "Sản phẩm không tồn tại hoặc đã bị xóa",
      };

    const variantDetails = CartService.extractVariantDetails(
      product,
      data.variantId
    );
    if (data.variantId && !variantDetails)
      return {
        ok: false as const,
        status: 400,
        message: "Biến thể sản phẩm không hợp lệ",
      };

    const priceAtTime =
      typeof data.priceAtTime === "number"
        ? data.priceAtTime
        : variantDetails?.snapshot?.price ?? product.price ?? 0;

    const itemPayload: Record<string, any> = {
      cartId: cart._id,
      productId: product._id,
      quantity: data.quantity,
      priceAtTime,
      shopId: product.shopId,
    };
    if (variantDetails) {
      itemPayload.variantId = variantDetails.variantObjectId;
      itemPayload.variantSnapshot = variantDetails.snapshot;
    }

    const item = await CartItemModel.create(itemPayload);
    await CartModel.findByIdAndUpdate(cart._id, {
      $push: { cartItems: item._id },
    });
    const populated = await CartModel.findById(cart._id).populate(
      CART_ITEM_POPULATE
    );
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
    const cartItem = await CartItemModel.findById(itemId);
    if (!cartItem)
      return {
        ok: false as const,
        status: 404,
        message: "Cart item không tồn tại",
      };

    const updatePayload: Record<string, any> = {};
    if (typeof data.quantity === "number") {
      updatePayload.quantity = data.quantity;
    }

    if (data.variantId) {
      const product = await ProductModel.findById(cartItem.productId)
        .select("variants price discount images name")
        .lean();
      if (!product)
        return {
          ok: false as const,
          status: 400,
          message: "Không tìm thấy sản phẩm cho cart item",
        };

      const variantDetails = CartService.extractVariantDetails(
        product,
        data.variantId
      );
      if (!variantDetails)
        return {
          ok: false as const,
          status: 400,
          message: "Biến thể sản phẩm không hợp lệ",
        };

      updatePayload.variantId = variantDetails.variantObjectId;
      updatePayload.variantSnapshot = variantDetails.snapshot;
      updatePayload.priceAtTime =
        typeof data.priceAtTime === "number"
          ? data.priceAtTime
          : variantDetails.snapshot?.price ?? cartItem.priceAtTime;
    } else if (typeof data.priceAtTime === "number") {
      updatePayload.priceAtTime = data.priceAtTime;
    }

    await CartItemModel.findByIdAndUpdate(
      itemId,
      { $set: updatePayload },
      { new: true }
    );

    const cart = await CartModel.findOne({ userId }).populate(
      CART_ITEM_POPULATE
    );
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

  private static extractVariantDetails(product: any, variantId?: string) {
    if (!variantId || !product?.variants) return null;
    const variant = product.variants.find(
      (v: any) => v?._id?.toString() === variantId.toString()
    );
    if (!variant) return null;
    return {
      variantObjectId: variant._id as mongoose.Types.ObjectId,
      snapshot: {
        attributes: variant.attributes || {},
        sku: variant.sku,
        price: variant.price,
        image: extractImageUrl(variant.image),
      },
    };
  }
}
