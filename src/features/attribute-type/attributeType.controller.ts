import { Request, Response } from "express";
import AttributeTypeService from "./attributeType.service";
import { ResponseUtil } from "../../shared/utils/response.util";

export const getAttributeTypeController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await AttributeTypeService.get(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const createAttributeTypeController = async (
  req: Request,
  res: Response
) => {
  const result = await AttributeTypeService.create(req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.created(res, result.item, "Tạo loại thuộc tính thành công");
};

export const updateAttributeTypeController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await AttributeTypeService.update(id, req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item, "Cập nhật loại thuộc tính thành công");
};

export const deleteAttributeTypeController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await AttributeTypeService.delete(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item, "Xóa loại thuộc tính thành công");
};

export const listAttributeTypeController = async (
  req: Request,
  res: Response
) => {
  const { page, limit, search, isActive, categoryId, categoryIds } = req.query as any;
  const normalizedCategoryIds =
    typeof categoryIds === "string"
      ? categoryIds.split(",").map((id) => id.trim()).filter(Boolean)
      : Array.isArray(categoryIds)
        ? categoryIds.filter((id) => typeof id === "string" && id.trim().length > 0)
        : undefined;
  const result = await AttributeTypeService.list({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    search,
    isActive: typeof isActive === "string" ? isActive === "true" : undefined,
    categoryId,
    categoryIds: normalizedCategoryIds,
  });
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};

export const listAttributeTypesByCategoryController = async (
  req: Request,
  res: Response
) => {
  const { categoryId } = req.params;
  const result = await AttributeTypeService.listByCategory(categoryId);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items);
};