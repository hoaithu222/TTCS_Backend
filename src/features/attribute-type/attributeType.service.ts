import mongoose from "mongoose";
import AttributeTypeModel from "../../models/AttributeType";
import AttributeValueModel from "../../models/AttributeValue";
import {
  CreateAttributeTypeRequest,
  UpdateAttributeTypeRequest,
  ListAttributeTypeQuery,
  CreateAttributeValueItem,
} from "./types";
import { slugify, humanizeCode } from "../../shared/utils/slugify";

const INPUT_TYPES = ["text", "number", "select", "multiselect", "boolean", "date", "color"];

function normalizeInputType(inputType?: string, isMultiple?: boolean) {
  if (inputType && INPUT_TYPES.includes(inputType)) return inputType;
  if (isMultiple) return "multiselect";
  return "select";
}

function normalizeCategoryIds(categoryId?: string, categoryIds?: string[]) {
  const ids = Array.isArray(categoryIds)
    ? categoryIds.filter((id) => typeof id === "string" && id.trim().length > 0)
    : [];
  if (categoryId && !ids.includes(categoryId)) {
    ids.unshift(categoryId);
  }
  const deduped = Array.from(new Set(ids));
  const primaryCategoryId = deduped[0] || categoryId || undefined;
  return {
    primaryCategoryId,
    categoryIds: deduped,
  };
}

function normalizeAttributeCode(name?: string, code?: string) {
  const resolvedCode = slugify(code || name, { separator: "_" });
  if (!resolvedCode) throw new Error("Thiếu mã hệ thống cho thuộc tính (code).");
  return resolvedCode;
}

function normalizeAttributeValues(values?: CreateAttributeValueItem[]) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => ({
      value: value.value?.trim(),
      label: value.label?.trim() || value.value?.trim() || "",
      colorCode: value.colorCode,
      sortOrder: value.sortOrder ?? 0,
      isActive: value.isActive ?? true,
    }))
    .filter((item) => !!item.value);
}

export default class AttributeTypeService {
  static async get(id: string) {
    const item = await AttributeTypeModel.findById(id)
      .populate("categoryId", "name")
      .populate("categoryIds", "name");
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
      const { values, code, name, ...typeData } = data;
      const normalizedCode = normalizeAttributeCode(name, code);
      const normalizedName = name || humanizeCode(normalizedCode);
      const { primaryCategoryId, categoryIds } = normalizeCategoryIds(
        typeData.categoryId,
        (typeData as any).categoryIds
      );

      if (categoryIds.length > 0) {
        const existing = await AttributeTypeModel.findOne({
          code: normalizedCode,
          categoryIds: { $in: categoryIds },
        });
        if (existing) {
          return {
            ok: false as const,
            status: 409,
            message: `Mã thuộc tính "${normalizedCode}" đã tồn tại trong một trong các danh mục đã chọn.`,
          };
        }
      }

      const item = await AttributeTypeModel.create({
        ...typeData,
        categoryId: primaryCategoryId,
        categoryIds,
        name: normalizedName,
        code: normalizedCode,
        inputType: normalizeInputType(typeData.inputType, typeData.is_multiple),
      } as any);

      // Create values if provided
      const normalizedValues = normalizeAttributeValues(values);
      if (normalizedValues.length > 0) {
        const valueDocs = normalizedValues.map((v) => ({
          attributeTypeId: item._id,
          ...v,
        }));
        await AttributeValueModel.insertMany(valueDocs);
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

  static async update(id: string, data: UpdateAttributeTypeRequest) {
    const current = await AttributeTypeModel.findById(id);
    if (!current) {
      return {
        ok: false as const,
        status: 404,
        message: "AttributeType không tồn tại",
      };
    }

    const { primaryCategoryId, categoryIds } = normalizeCategoryIds(
      data.categoryId ?? current.categoryId?.toString(),
      (data as any).categoryIds ?? current.categoryIds?.map((id: any) => id?.toString())
    );
    const updatePayload: any = { ...data };
    updatePayload.categoryId = primaryCategoryId;
    updatePayload.categoryIds = categoryIds;
    if (data.code || data.name) {
      updatePayload.code = normalizeAttributeCode(data.name, data.code);
      if (!data.name) {
        updatePayload.name = humanizeCode(updatePayload.code);
      }
      const existing = await AttributeTypeModel.findOne({
        _id: { $ne: id },
        code: updatePayload.code,
        categoryIds: { $in: categoryIds.length ? categoryIds : current.categoryIds },
      });
      if (existing) {
        return {
          ok: false as const,
          status: 409,
          message: `Mã thuộc tính "${updatePayload.code}" đã tồn tại trong danh mục này.`,
        };
      }
    }
    if (data.inputType || data.is_multiple !== undefined) {
      updatePayload.inputType = normalizeInputType(data.inputType, data.is_multiple);
    }
    if (data.values) {
      const normalizedValues = normalizeAttributeValues(data.values);
      if (normalizedValues.length > 0) {
        await AttributeValueModel.deleteMany({ attributeTypeId: id });
        await AttributeValueModel.insertMany(
          normalizedValues.map((value) => ({ attributeTypeId: id, ...value }))
        );
      }
      delete updatePayload.values;
    }

    const item = await AttributeTypeModel.findByIdAndUpdate(id, updatePayload, {
      new: true,
      runValidators: true,
    })
      .populate("categoryId", "name")
      .populate("categoryIds", "name");
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
      if (query.isActive !== undefined) filter.isActive = query.isActive;
      if (query.search) filter.name = { $regex: query.search, $options: "i" };
      if (query.categoryId) {
        filter.categoryIds = query.categoryId;
      } else if (Array.isArray(query.categoryIds) && query.categoryIds.length > 0) {
        filter.categoryIds = { $in: query.categoryIds };
      }
      const [items, total] = await Promise.all([
        AttributeTypeModel.find(filter)
          .populate("categoryId", "name")
          .populate("categoryIds", "name")
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

  static async listByCategory(categoryId: string) {
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return {
        ok: false as const,
        status: 400,
        message: "categoryId không hợp lệ",
      };
    }

    const categoryObjectId = new mongoose.Types.ObjectId(categoryId);

    const attributeTypes = await AttributeTypeModel.find({
      isActive: true,
      $or: [{ categoryId: categoryObjectId }, { categoryIds: categoryObjectId }],
    })
      .sort({ displayOrder: 1, createdAt: -1 })
      .lean();

    const attributeTypeIds = attributeTypes.map((attr) => attr._id);

    const values = attributeTypeIds.length
      ? await AttributeValueModel.find({
          attributeTypeId: { $in: attributeTypeIds },
          isActive: true,
        })
          .sort({ sortOrder: 1, createdAt: 1 })
          .lean()
      : [];

    const valueMap = values.reduce<Record<string, any[]>>((acc, value) => {
      const key = value.attributeTypeId?.toString();
      if (!key) return acc;
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        id: value._id.toString(),
        _id: value._id.toString(),
        value: value.value,
        label: value.label || value.value,
        colorCode: value.colorCode,
        sortOrder: value.sortOrder ?? 0,
      });
      return acc;
    }, {});

    const items = attributeTypes.map((attr) => ({
      id: attr._id.toString(),
      _id: attr._id.toString(),
      name: attr.name,
      code: attr.code,
      description: attr.description,
      helperText: (attr as any).helperText,
      inputType: attr.inputType || (attr.is_multiple ? "multiselect" : "select"),
      isVariantAttribute: attr.isVariantAttribute ?? true,
      categoryId: attr.categoryId?.toString(),
      categoryIds: Array.isArray(attr.categoryIds)
        ? attr.categoryIds.map((id: any) => id?.toString()).filter(Boolean)
        : [],
      values: valueMap[attr._id.toString()] || [],
    }));

    return { ok: true as const, items };
  }
}
