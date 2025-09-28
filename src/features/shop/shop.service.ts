import ShopModel from "../../models/ShopModel";
import { CreateShopRequest, UpdateShopRequest, ListShopQuery } from "./types";

export default class ShopService {
  static async get(id: string) {
    const item = await ShopModel.findById(id);
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
}
