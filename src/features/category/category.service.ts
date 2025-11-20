import CategoryModel from "../../models/CategoryModel";
import SubCategoryModel from "../../models/SubCategoryModel";
import { CreateCategoryRequest, UpdateCategoryRequest } from "./types";

export default class CategoryService {
  static async getCategory(id: string) {
    const category = await CategoryModel.findById(id);
    if (!category) {
      return {
        ok: false as const,
        status: 400,
        message: "Category không tồn tại",
      };
    }

    // Fetch attributes for this category
    const AttributeTypeModel = (await import("../../models/AttributeType")).default;
    const AttributeValueModel = (await import("../../models/AttributeValue")).default;
    
    const attributeTypes = await AttributeTypeModel.find({ categoryId: id, isActive: true });
    
    // Populate values for each attribute type
    const attributesWithValues = await Promise.all(
      attributeTypes.map(async (attrType) => {
        const values = await AttributeValueModel.find({
          attributeTypeId: attrType._id,
          isActive: true,
        });
        return {
          id: attrType._id.toString(),
          _id: attrType._id.toString(),
          name: attrType.name,
          code: attrType.code,
          description: attrType.description,
          inputType: attrType.inputType || (attrType.is_multiple ? "multiselect" : "select"),
          isRequired: false, // Default, can be added to schema later
          helperText: attrType.helperText,
          isVariantAttribute: attrType.isVariantAttribute,
          values: values.map((val: any) => ({
            id: val._id.toString(),
            _id: val._id.toString(),
            value: val.value,
            label: val.label || val.value,
            code: val.code,
            colorCode: val.colorCode || undefined,
            sortOrder: val.sortOrder ?? 0,
          })),
        };
      })
    );

    // Convert category to plain object and add attributes
    const categoryObj = category.toObject ? category.toObject() : category;
    (categoryObj as any).attributes = attributesWithValues;

    return { ok: true as const, category: categoryObj };
  }
  static async createCategory(data: CreateCategoryRequest) {
    try {
      const category = await CategoryModel.create(data);
      return { ok: true as const, category };
    } catch (error) {
      return {
        ok: false as const,
        status: 400,
        message: (error as Error).message,
      };
    }
  }
  static async updateCategory(id: string, data: UpdateCategoryRequest) {
    const category = await CategoryModel.findByIdAndUpdate(id, data, {
      new: true,
    });
    if (!category) {
      return {
        ok: false as const,
        status: 404,
        message: "Category không tồn tại",
      };
    }
    return { ok: true as const, category };
  }
  static async deleteCategory(id: string) {
    const category = await CategoryModel.findByIdAndDelete(id);
    if (!category) {
      return {
        ok: false as const,
        status: 404,
        message: "Category không tồn tại",
      };
    }
    return { ok: true as const, category };
  }
  static async getCategories(
    page: number = 1,
    limit: number = 50,
    search?: string,
    isActive?: boolean
  ) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit =
        Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 50;
      const skip = (safePage - 1) * safeLimit;

      // Build filter query
      const filterQuery: any = {};

      // Add search filter (case insensitive)
      if (search && search.trim()) {
        filterQuery.name = { $regex: search.trim(), $options: "i" };
      }

      // Add isActive filter
      if (isActive !== undefined) {
        filterQuery.isActive = isActive;
      }

      const [categories, total] = await Promise.all([
        CategoryModel.find(filterQuery)
          .skip(skip)
          .limit(safeLimit)
          .sort({ order_display: 1, createdAt: -1 }),
        CategoryModel.countDocuments(filterQuery),
      ]);
      return {
        ok: true as const,
        categories,
        total,
        page: safePage,
        limit: safeLimit,
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }
  // lấy danh sách sub category với id category
  static async getSubCategories(
    id: string,
    page: number = 1,
    limit: number = 50
  ) {
    try {
      const safePage = Number.isFinite(page) && page > 0 ? page : 1;
      const safeLimit =
        Number.isFinite(limit) && limit > 0 ? Math.min(limit, 500) : 50;
      const skip = (safePage - 1) * safeLimit;
      const [subCategories, total] = await Promise.all([
        SubCategoryModel.find({ categoryId: id })
          .skip(skip)
          .limit(safeLimit)
          .sort({ order_display: 1, createdAt: -1 }),
        SubCategoryModel.countDocuments({ categoryId: id }),
      ]);
      return {
        ok: true as const,
        subCategories,
        total,
        page: safePage,
        limit: safeLimit,
      };
    } catch (error) {
      return {
        ok: false as const,
        status: 500,
        message: (error as Error).message,
      };
    }
  }
}
