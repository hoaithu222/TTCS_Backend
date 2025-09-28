import SubCategoryModel from "../../models/SubCategoryModel";
import { CreateSubCategoryRequest, UpdateSubCategoryRequest } from "./types";

export default class SubCategoryService {
  static async getSubCategory(id: string) {
    const subCategory = await SubCategoryModel.findById(id);
    if (!subCategory) {
      return {
        ok: false as const,
        status: 404,
        message: "SubCategory không tồn tại",
      };
    }
    return { ok: true as const, subCategory };
  }

  static async createSubCategory(data: CreateSubCategoryRequest) {
    try {
      const subCategory = await SubCategoryModel.create(data as any);
      return { ok: true as const, subCategory };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }

  static async updateSubCategory(id: string, data: UpdateSubCategoryRequest) {
    const subCategory = await SubCategoryModel.findByIdAndUpdate(
      id,
      data as any,
      { new: true }
    );
    if (!subCategory) {
      return {
        ok: false as const,
        status: 404,
        message: "SubCategory không tồn tại",
      };
    }
    return { ok: true as const, subCategory };
  }

  static async deleteSubCategory(id: string) {
    const subCategory = await SubCategoryModel.findByIdAndDelete(id);
    if (!subCategory) {
      return {
        ok: false as const,
        status: 404,
        message: "SubCategory không tồn tại",
      };
    }
    return { ok: true as const, subCategory };
  }

  static async list(query: {
    page?: number;
    limit?: number;
    categoryId?: string;
    search?: string;
    isActive?: boolean;
  }) {
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
      if (query.categoryId) filter.categoryId = query.categoryId;
      if (typeof query.isActive === "boolean") filter.isActive = query.isActive;
      if (query.search) filter.name = { $regex: query.search, $options: "i" };
      const [items, total] = await Promise.all([
        SubCategoryModel.find(filter)
          .skip(skip)
          .limit(limit)
          .sort({ order_display: 1, createdAt: -1 }),
        SubCategoryModel.countDocuments(filter),
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
