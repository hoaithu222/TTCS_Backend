import ShopModel from "../../models/ShopModel";
import ShopFollowerModel from "../../models/ShopFollower";
import { CreateShopRequest, UpdateShopRequest, ListShopQuery } from "./types";

export default class ShopService {
  static async get(id: string) {
    // Check if id is a valid ObjectId (24 hex characters)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(id);

    let item;
    if (isObjectId) {
      // Try to find by _id first
      item = await ShopModel.findById(id);
    }

    // If not found by _id or not an ObjectId, try to find by slug
    if (!item) {
      item = await ShopModel.findOne({ slug: id });
    }

    if (!item)
      return { ok: false as const, status: 404, message: "Shop không tồn tại" };
    return { ok: true as const, item };
  }

  static async create(data: CreateShopRequest) {
    try {
      const item = await ShopModel.create(data as any);
      return { ok: true as const, item };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }

  static async update(id: string, data: UpdateShopRequest) {
    const item = await ShopModel.findByIdAndUpdate(id, data as any, {
      new: true,
    });
    if (!item)
      return { ok: false as const, status: 404, message: "Shop không tồn tại" };
    return { ok: true as const, item };
  }

  static async delete(id: string) {
    const item = await ShopModel.findByIdAndDelete(id);
    if (!item)
      return { ok: false as const, status: 404, message: "Shop không tồn tại" };
    return { ok: true as const, item };
  }

  static async list(query: ListShopQuery) {
    try {
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
      if (query.userId) filter.userId = query.userId;
      if (query.status) filter.status = query.status;
      if (query.search) filter.name = { $regex: query.search, $options: "i" };
      const [items, total] = await Promise.all([
        ShopModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        ShopModel.countDocuments(filter),
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

  static async follow(shopId: string, userId: string) {
    const shop = await ShopModel.findById(shopId).select("_id followCount userId");
    if (!shop)
      return { ok: false as const, status: 404, message: "Shop không tồn tại" };
    if (shop.userId && shop.userId.toString() === userId) {
      return {
        ok: false as const,
        status: 400,
        message: "Bạn không thể theo dõi cửa hàng của chính mình",
      };
    }
    try {
      await ShopFollowerModel.create({ shopId, userId } as any);
    } catch (error) {
      // Duplicate follows should be idempotent
      if ((error as any).code !== 11000) {
        return {
          ok: false as const,
          status: 400,
          message: (error as Error).message,
        };
      }
    }
    const followersCount = await ShopFollowerModel.countDocuments({ shopId });
    await ShopModel.findByIdAndUpdate(shopId, { followCount: followersCount });
    return { ok: true as const, isFollowing: true, followersCount };
  }

  static async unfollow(shopId: string, userId: string) {
    const shop = await ShopModel.findById(shopId).select("_id");
    if (!shop)
      return { ok: false as const, status: 404, message: "Shop không tồn tại" };
    await ShopFollowerModel.findOneAndDelete({ shopId, userId });
    const followersCount = await ShopFollowerModel.countDocuments({ shopId });
    await ShopModel.findByIdAndUpdate(shopId, { followCount: followersCount });
    return { ok: true as const, isFollowing: false, followersCount };
  }

  static async isFollowing(shopId: string, userId: string) {
    const [doc, followersCount] = await Promise.all([
      ShopFollowerModel.findOne({ shopId, userId }).select("_id"),
      ShopFollowerModel.countDocuments({ shopId }),
    ]);
    return { ok: true as const, isFollowing: !!doc, followersCount };
  }

  static async followersCount(shopId: string) {
    const count = await ShopFollowerModel.countDocuments({ shopId });
    await ShopModel.findByIdAndUpdate(shopId, { followCount: count });
    return { ok: true as const, count };
  }

  // Lấy trạng thái shop của user
  static async getShopStatusByUserId(userId: string) {
    try {
      const shop = await ShopModel.findOne({ userId })
        .select("status name slug")
        .lean();
      if (!shop) {
        return {
          ok: true as const,
          shopStatus: "not_registered" as const,
          shop: null,
        };
      }
      // Map backend status to frontend status
      let shopStatus:
        | "not_registered"
        | "pending_review"
        | "approved"
        | "rejected"
        | "active"
        | "blocked"
        | "suspended";
      switch (shop.status) {
        case "pending":
          shopStatus = "pending_review";
          break;
        case "active":
          shopStatus = "active";
          break;
        case "blocked":
          shopStatus = "blocked";
          break;
        default:
          shopStatus = "pending_review";
      }
      return {
        ok: true as const,
        shopStatus,
        shop: {
          id: shop._id.toString(),
          name: shop.name,
          slug: shop.slug,
          status: shop.status,
        },
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }

  // Approve shop (admin only)
  static async approveShop(id: string) {
    try {
      const item = await ShopModel.findByIdAndUpdate(
        id,
        { status: "active" },
        { new: true }
      );
      if (!item) {
        return {
          ok: false as const,
          status: 404,
          message: "Shop không tồn tại",
        };
      }
      return { ok: true as const, item };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }

  // Reject shop (admin only)
  static async rejectShop(id: string) {
    try {
      const item = await ShopModel.findByIdAndUpdate(
        id,
        { status: "blocked" },
        { new: true }
      );
      if (!item) {
        return {
          ok: false as const,
          status: 404,
          message: "Shop không tồn tại",
        };
      }
      return { ok: true as const, item };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }

  // Suspend shop (admin only)
  static async suspendShop(id: string) {
    try {
      const item = await ShopModel.findByIdAndUpdate(
        id,
        { status: "blocked" },
        { new: true }
      );
      if (!item) {
        return {
          ok: false as const,
          status: 404,
          message: "Shop không tồn tại",
        };
      }
      return { ok: true as const, item };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }
}
