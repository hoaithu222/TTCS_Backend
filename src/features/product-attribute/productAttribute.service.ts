import ProductAttributeModel from "../../models/ProductAttribute";
import {
  CreateProductAttributeRequest,
  UpdateProductAttributeRequest,
  ListProductAttributeQuery,
} from "./types";

export default class ProductAttributeService {
  static async get(id: string) {
    const item = await ProductAttributeModel.findById(id);
    if (!item)
      return {
        ok: false as const,
        status: 404,
        message: "ProductAttribute không tồn tại",
      };
    return { ok: true as const, item };
  }

  static async create(data: CreateProductAttributeRequest) {
    try {
      const item = await ProductAttributeModel.create(data as any);
      return { ok: true as const, item };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }

  static async update(id: string, data: UpdateProductAttributeRequest) {
    const item = await ProductAttributeModel.findByIdAndUpdate(
      id,
      data as any,
      { new: true }
    );
    if (!item)
      return {
        ok: false as const,
        status: 404,
        message: "ProductAttribute không tồn tại",
      };
    return { ok: true as const, item };
  }

  static async delete(id: string) {
    const item = await ProductAttributeModel.findByIdAndDelete(id);
    if (!item)
      return {
        ok: false as const,
        status: 404,
        message: "ProductAttribute không tồn tại",
      };
    return { ok: true as const, item };
  }

  static async list(query: ListProductAttributeQuery) {
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
      if (query.productId) filter.productId = query.productId;
      if (query.attributeTypeId) filter.attributeTypeId = query.attributeTypeId;
      const [items, total] = await Promise.all([
        ProductAttributeModel.find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ createdAt: -1 }),
        ProductAttributeModel.countDocuments(filter),
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
