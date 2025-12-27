import { Request, Response } from "express";
import ProductService from "./product.service";
import ReviewsService from "../reviews/reviews.service";
import { ResponseUtil } from "../../shared/utils/response.util";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import type { CreateReviewRequest } from "../reviews/types";

export const getProductController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.get(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.product);
};

export const createProductController = async (req: Request, res: Response) => {
  const result = await ProductService.create(req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.created(res, result.product, "Tạo sản phẩm thành công");
};

export const updateProductController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.update(id, req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.product, "Cập nhật sản phẩm thành công");
};

export const deleteProductController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.delete(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.product, "Xóa sản phẩm thành công");
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
    status,
    sortBy,
    sortOrder,
    rating,
    inStock,
  } = req.query as any;
  
  console.log("[listProductController] Query params:", req.query);
  
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
    status: status as "approved" | "hidden" | "violated" | undefined,
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

export const searchProductController = async (req: Request, res: Response) => {
  const {
    page,
    limit,
    categoryId,
    subCategoryId,
    shopId,
    search,
    minPrice,
    maxPrice,
    rating,
    inStock,
    sortBy,
    sortOrder,
  } = req.query as any;
  
  console.log("[searchProductController] Query params:", req.query);
  
  const result = await ProductService.search({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    categoryId,
    subCategoryId,
    shopId,
    search,
    minPrice: minPrice != null ? Number(minPrice) : undefined,
    maxPrice: maxPrice != null ? Number(maxPrice) : undefined,
    rating: rating != null ? Number(rating) : undefined,
    inStock: inStock === "true" ? true : undefined,
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

export const getFeaturedProductsController = async (req: Request, res: Response) => {
  const {
    page,
    limit,
    categoryId,
    subCategoryId,
    shopId,
  } = req.query as any;
  const result = await ProductService.getFeatured({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    categoryId,
    subCategoryId,
    shopId,
  });
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};

export const getRecommendedProductsController = async (req: Request, res: Response) => {
  const {
    page,
    limit,
    categoryId,
    subCategoryId,
    shopId,
  } = req.query as any;
  const result = await ProductService.getRecommended({
    page: Number(page) || 1,
    limit: Number(limit) || 20,
    categoryId,
    subCategoryId,
    shopId,
  });
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};

export const getRelatedProductsController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { limit } = req.query as any;
  const result = await ProductService.getRelated(id, limit ? Number(limit) : 8);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items);
};

export const trackProductViewController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ProductService.trackView(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, {}, "Ghi nhận lượt xem sản phẩm thành công");
};

export const getProductReviewsController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { page, limit, sortBy } = req.query as any;
  const result = await ProductService.getReviews(id, {
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
    sortBy,
  });
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, {
    reviews: result.reviews,
    averageRating: result.averageRating,
    totalReviews: result.totalReviews,
    ratingDistribution: result.ratingDistribution,
    pagination: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
    },
  });
};

export const createProductReviewController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body as CreateReviewRequest;
  const result = await ReviewsService.create(req as AuthenticatedRequest, {
    ...payload,
    productId: id,
  });
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.created(res, result.review, "Tạo đánh giá sản phẩm thành công");
};

// Update product status (admin only)
export const updateProductStatusController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const payload = req.body;
  const result = await ProductService.updateStatus(req as AuthenticatedRequest, id, payload);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.product, "Cập nhật trạng thái sản phẩm thành công");
};