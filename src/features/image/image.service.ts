import ImageModel from "../../models/ImageModel";
import {
  CreateImageRequest,
  UpdateImageRequest,
  ListImageQuery,
} from "./types";

export default class ImageService {
  static async get(id: string) {
    const item = await ImageModel.findById(id);
    if (!item)
      return {
        ok: false as const,
        status: 404,
        message: "Image không tồn tại",
      };
    return { ok: true as const, item };
  }

  static async create(data: CreateImageRequest) {
    try {
      const item = await ImageModel.create(data as any);
      return { ok: true as const, item };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }

  static async update(id: string, data: UpdateImageRequest) {
    const item = await ImageModel.findByIdAndUpdate(id, data as any, {
      new: true,
    });
    if (!item)
      return {
        ok: false as const,
        status: 404,
        message: "Image không tồn tại",
      };
    return { ok: true as const, item };
  }

  static async delete(id: string) {
    const item = await ImageModel.findByIdAndDelete(id);
    if (!item)
      return {
        ok: false as const,
        status: 404,
        message: "Image không tồn tại",
      };
    return { ok: true as const, item };
  }

  static async list(query: ListImageQuery) {
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
      if (query.search) filter.url = { $regex: query.search, $options: "i" };
      const [items, total] = await Promise.all([
        ImageModel.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 }),
        ImageModel.countDocuments(filter),
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

