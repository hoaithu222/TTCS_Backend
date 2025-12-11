import { Request, Response } from "express";
import SubCategoryService from "./subCategory.service";
import { ResponseUtil } from "../../shared/utils/response.util";

export const getSubCategoryController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await SubCategoryService.getSubCategory(id);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.subCategory);
};

export const createSubCategoryController = async (
  req: Request,
  res: Response
) => {
  const result = await SubCategoryService.createSubCategory(req.body);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.created(res, result.subCategory, "Tạo danh mục phụ thành công");
};

export const updateSubCategoryController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await SubCategoryService.updateSubCategory(id, req.body);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.subCategory, "Cập nhật danh mục phụ thành công");
};

export const deleteSubCategoryController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await SubCategoryService.deleteSubCategory(id);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.subCategory, "Xóa danh mục phụ thành công");
};

export const listSubCategoryController = async (
  req: Request,
  res: Response
) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const categoryId =
    typeof req.query.categoryId === "string" ? req.query.categoryId : undefined;
  const search =
    typeof req.query.search === "string" ? req.query.search : undefined;
  const isActive =
    typeof req.query.isActive === "string"
      ? req.query.isActive === "true"
      : undefined;
  const result = await SubCategoryService.list({
    page,
    limit,
    categoryId,
    search,
    isActive,
  });
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.items, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};
