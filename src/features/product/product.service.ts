import ProductModel from "../../models/ProductModal";
import {
  CreateProductRequest,
  UpdateProductRequest,
  ListProductQuery,
} from "./types";

export default class ProductService {
  static async get(id: string) {
    const product = await ProductModel.findById(id);
    if (!product)
      return {
        ok: false as const,
        status: 404,
        message: "Product không tồn tại",
      };
    return { ok: true as const, product };
  }

  static async create(data: CreateProductRequest) {
    try {
      const product = await ProductModel.create(data as any);
      return { ok: true as const, product };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }

  static async update(id: string, data: UpdateProductRequest) {
    const product = await ProductModel.findByIdAndUpdate(id, data as any, {
      new: true,
    });
    if (!product)
      return {
        ok: false as const,
        status: 404,
        message: "Product không tồn tại",
      };
    return { ok: true as const, product };
  }

  static async delete(id: string) {
    const product = await ProductModel.findByIdAndDelete(id);
    if (!product)
      return {
        ok: false as const,
        status: 404,
        message: "Product không tồn tại",
      };
    return { ok: true as const, product };
  }

  static async list(query: ListProductQuery) {
    try {
      const page =
        Number.isFinite(query.page as number) && (query.page as number) > 0
          ? (query.page as number)
          : 1;
      const limit =
        Number.isFinite(query.limit as number) && (query.limit as number) > 0
          ? Math.min(query.limit as number, 500)
          : 50;
      const skip = (page - 1) * limit;
      const filter: any = {};
      if (typeof query.isActive === "boolean") filter.isActive = query.isActive;
      if (query.categoryId) filter.categoryId = query.categoryId;
      if (query.subCategoryId) filter.subCategoryId = query.subCategoryId;
      if (query.shopId) filter.shopId = query.shopId;
      if (query.minPrice != null || query.maxPrice != null) {
        filter.price = {};
        if (query.minPrice != null) filter.price.$gte = query.minPrice;
        if (query.maxPrice != null) filter.price.$lte = query.maxPrice;
      }
      if (query.search) filter.$text = { $search: query.search };

      const sortField = query.sortBy || "createdAt";
      const sortDir = (query.sortOrder || "desc") === "asc" ? 1 : -1;
      const sort: any = { [sortField]: sortDir };

      const [items, total] = await Promise.all([
        ProductModel.find(filter).skip(skip).limit(limit).sort(sort),
        ProductModel.countDocuments(filter),
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
