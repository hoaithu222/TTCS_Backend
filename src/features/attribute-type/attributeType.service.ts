import AttributeTypeModel from "../../models/AttributeType";
import {
  CreateAttributeTypeRequest,
  UpdateAttributeTypeRequest,
  ListAttributeTypeQuery,
} from "./types";

export default class AttributeTypeService {
  static async get(id: string) {
    const item = await AttributeTypeModel.findById(id);
    if (!item)
      return {
        ok: false as const,
        status: 404,
        message: "AttributeType không tồn tại",
      };
    return { ok: true as const, item };
  }

  static async create(data: CreateAttributeTypeRequest) {
    try {
      const item = await AttributeTypeModel.create(data as any);
      return { ok: true as const, item };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }

  static async update(id: string, data: UpdateAttributeTypeRequest) {
    const item = await AttributeTypeModel.findByIdAndUpdate(id, data as any, {
      new: true,
    });
    if (!item)
      return {
        ok: false as const,
        status: 404,
        message: "AttributeType không tồn tại",
      };
    return { ok: true as const, item };
  }

  static async delete(id: string) {
    const item = await AttributeTypeModel.findByIdAndDelete(id);
    if (!item)
      return {
        ok: false as const,
        status: 404,
        message: "AttributeType không tồn tại",
      };
    return { ok: true as const, item };
  }

  static async list(query: ListAttributeTypeQuery) {
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
      if (typeof query.isActive === "boolean") filter.isActive = query.isActive;
      if (query.search) filter.name = { $regex: query.search, $options: "i" };
      const [items, total] = await Promise.all([
        AttributeTypeModel.find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        AttributeTypeModel.countDocuments(filter),
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
