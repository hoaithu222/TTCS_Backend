import WishlistModel from "../../models/WishlistModel";
import ProductModel from "../../models/ProductModal";
import ShopModel from "../../models/ShopModel";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import type { WishlistItemResponse, WishlistResponse } from "./types";

export default class WishlistService {
  // Get or create wishlist for user
  static async getOrCreate(req: AuthenticatedRequest) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };

    let wishlist = await WishlistModel.findOne({ userId }).lean();
    if (!wishlist) {
      wishlist = await WishlistModel.create({ userId, items: [] });
      wishlist = await WishlistModel.findOne({ userId }).lean();
    }

    if (!wishlist) {
      return { ok: false as const, status: 500, message: "Failed to create wishlist" };
    }

    const populatedWishlist = await this.populateWishlistItems(wishlist);
    return { ok: true as const, wishlist: populatedWishlist };
  }

  // Add product to wishlist
  static async addItem(req: AuthenticatedRequest, productId: string) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };

    // Check if product exists
    const product = await ProductModel.findById(productId)
      .select("name images price discount shopId")
      .lean();
    if (!product) {
      return {
        ok: false as const,
        status: 404,
        message: "Sản phẩm không tồn tại",
      };
    }

    // Get or create wishlist
    let wishlist = await WishlistModel.findOne({ userId });
    if (!wishlist) {
      wishlist = await WishlistModel.create({ userId, items: [] });
    }

    // Check if product already in wishlist
    const existingItem = wishlist.items.find(
      (item) => item.productId.toString() === productId
    );
    if (existingItem) {
      const populatedWishlist = await this.populateWishlistItems(wishlist.toObject());
      return {
        ok: true as const,
        wishlist: populatedWishlist,
        message: "Sản phẩm đã có trong danh sách yêu thích",
      };
    }

    // Add product to wishlist
    wishlist.items.push({
      productId: productId as any,
      addedAt: new Date(),
    });
    await wishlist.save();

    const populatedWishlist = await this.populateWishlistItems(wishlist.toObject());
    return { ok: true as const, wishlist: populatedWishlist };
  }

  // Remove product from wishlist
  static async removeItem(req: AuthenticatedRequest, productId: string) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };

    const wishlist = await WishlistModel.findOne({ userId });
    if (!wishlist) {
      return {
        ok: false as const,
        status: 404,
        message: "Danh sách yêu thích không tồn tại",
      };
    }

    const initialLength = wishlist.items.length;
    const filteredItems = wishlist.items.filter(
      (item) => item.productId.toString() !== productId
    );

    if (filteredItems.length === initialLength) {
      return {
        ok: false as const,
        status: 404,
        message: "Sản phẩm không có trong danh sách yêu thích",
      };
    }

    wishlist.set("items", filteredItems);
    await wishlist.save();
    const populatedWishlist = await this.populateWishlistItems(wishlist.toObject());
    return { ok: true as const, wishlist: populatedWishlist };
  }

  // Clear entire wishlist
  static async clear(req: AuthenticatedRequest) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };

    const wishlist = await WishlistModel.findOne({ userId });
    if (!wishlist) {
      return {
        ok: false as const,
        status: 404,
        message: "Danh sách yêu thích không tồn tại",
      };
    }

    wishlist.set("items", []);
    await wishlist.save();

    const populatedWishlist = await this.populateWishlistItems(wishlist.toObject());
    return { ok: true as const, wishlist: populatedWishlist };
  }

  // Check if product is in wishlist
  static async checkItem(req: AuthenticatedRequest, productId: string) {
    const userId = (req as any).user?.userId;
    if (!userId)
      return { ok: false as const, status: 401, message: "Unauthorized" };

    const wishlist = await WishlistModel.findOne({ userId }).lean();
    if (!wishlist) {
      return { ok: true as const, isInWishlist: false };
    }

    const isInWishlist = wishlist.items.some(
      (item) => item.productId.toString() === productId
    );

    return { ok: true as const, isInWishlist };
  }

  // Helper: Populate wishlist items with product and shop data
  private static async populateWishlistItems(
    wishlist: any
  ): Promise<WishlistResponse> {
    if (!wishlist.items || wishlist.items.length === 0) {
      return {
        _id: wishlist._id.toString(),
        userId: wishlist.userId.toString(),
        items: [],
        itemCount: 0,
        createdAt: wishlist.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: wishlist.updatedAt?.toISOString() || new Date().toISOString(),
      };
    }

    const productIds = wishlist.items.map((item: any) => item.productId);
    const products = await ProductModel.find({ _id: { $in: productIds } })
      .populate("images", "url publicId")
      .populate("shopId", "name logo")
      .lean();

    const shopIds = products
      .map((p: any) => p.shopId)
      .filter(Boolean)
      .map((s: any) => (typeof s === "string" ? s : s._id));
    const shops = await ShopModel.find({ _id: { $in: shopIds } })
      .select("name logo")
      .lean();

    const shopMap = new Map(
      shops.map((shop: any) => [shop._id.toString(), shop])
    );

    const items: WishlistItemResponse[] = wishlist.items.map((item: any) => {
      const product = products.find(
        (p: any) => p._id.toString() === item.productId.toString()
      );
      if (!product) return null;

      const shopId =
        typeof product.shopId === "string"
          ? product.shopId
          : (product.shopId as any)?._id?.toString();
      const shop = shopId ? shopMap.get(shopId) : null;

      // Extract image URL
      let productImage: string | undefined;
      if (product.images && product.images.length > 0) {
        const firstImage = product.images[0];
        if (typeof firstImage === "string") {
          productImage = firstImage;
        } else if (firstImage && typeof firstImage === "object") {
          productImage = (firstImage as any).url;
        }
      }

      const discount = product.discount || 0;
      const finalPrice = product.price - discount;

      return {
        _id: item._id?.toString() || "",
        productId: product._id.toString(),
        productName: product.name,
        productImage,
        productPrice: product.price,
        productDiscount: discount > 0 ? discount : undefined,
        finalPrice,
        shopId: shopId || "",
        shopName: shop ? (shop as any).name : "",
        addedAt: item.addedAt?.toISOString() || new Date().toISOString(),
      };
    });

    return {
      _id: wishlist._id.toString(),
      userId: wishlist.userId.toString(),
      items: items.filter(Boolean) as WishlistItemResponse[],
      itemCount: items.filter(Boolean).length,
      createdAt: wishlist.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: wishlist.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}

