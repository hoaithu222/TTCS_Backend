import CategoryService from "./category.service";
import { Request, Response } from "express";
import { ResponseUtil } from "../../shared/utils/response.util";
export const getCategoryController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await CategoryService.getCategory(id);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.category);
};

export const createCategoryController = async (req: Request, res: Response) => {
  // Kiểm tra quyền admin
  const currentUser = (
    req as unknown as Request & { currentUser?: { role?: string } }
  ).currentUser;
  if (!currentUser || currentUser.role !== "admin") {
    return ResponseUtil.error(res, "Bạn không có quyền tạo danh mục", 403);
  }
  const result = await CategoryService.createCategory(req.body);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.category);
};

export const updateCategoryController = async (req: Request, res: Response) => {
  const currentUser = (
    req as unknown as Request & { currentUser?: { role?: string } }
  ).currentUser;
  if (!currentUser || currentUser.role !== "admin") {
    return ResponseUtil.error(res, "Bạn không có quyền cập nhật danh mục", 403);
  }
  const { id } = req.params;
  const result = await CategoryService.updateCategory(id, req.body);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.category);
};

export const deleteCategoryController = async (req: Request, res: Response) => {
  const currentUser = (
    req as unknown as Request & { currentUser?: { role?: string } }
  ).currentUser;
  if (!currentUser || currentUser.role !== "admin") {
    return ResponseUtil.error(res, "Bạn không có quyền xóa danh mục", 403);
  }
  const { id } = req.params;
  const result = await CategoryService.deleteCategory(id);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.category);
};

export const getSubCategoriesController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const result = await CategoryService.getSubCategories(id, page, limit);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.subCategories, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};

export const getCategoriesController = async (req: Request, res: Response) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const search = req.query.search as string | undefined;
  const isActive =
    req.query.isActive !== undefined
      ? String(req.query.isActive) === "true"
      : undefined;

  const result = await CategoryService.getCategories(
    page,
    limit,
    search,
    isActive
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.categories, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};
