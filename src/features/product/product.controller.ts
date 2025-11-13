import { Request, Response } from "express";
import ProductService from "./product.service";
import { ResponseUtil } from "../../shared/utils/response.util";

export const getProductController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.get(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.product);
};

export const createProductController = async (req: Request, res: Response) => {
  const result = await ProductService.create(req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.created(res, result.product);
};

export const updateProductController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.update(id, req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.product);
};

export const deleteProductController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.delete(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.product);
};

export const listProductController = async (req: Request, res: Response) => {
  const {
    page,
    limit,
    categoryId,
    subCategoryId,
    shopId,
    search,
    minPrice,
    maxPrice,
    isActive,
    sortBy,
    sortOrder,
  } = req.query as any;
  const result = await ProductService.list({
    page: Number(page) || 1,
    limit: Number(limit) || 50,
    categoryId,
    subCategoryId,
    shopId,
    search,
    minPrice: minPrice != null ? Number(minPrice) : undefined,
    maxPrice: maxPrice != null ? Number(maxPrice) : undefined,
    isActive: typeof isActive === "string" ? isActive === "true" : undefined,
    sortBy,
    sortOrder,
  });
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};
