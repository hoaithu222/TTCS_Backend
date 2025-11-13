import { Request, Response } from "express";
import ShopManagementService from "./shop-management.service";
import { ResponseUtil } from "../../shared/utils/response.util";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";
import {
  GetMyShopProductsQuery,
  GetMyShopOrdersQuery,
  UpdateOrderStatusRequest,
  GetAnalyticsQuery,
  GetReviewsQuery,
  GetFollowersQuery,
} from "./types";

// Lấy thông tin shop của user hiện tại
export const getMyShopController = async (req: Request, res: Response) => {
  const result = await ShopManagementService.getMyShop(req as AuthenticatedRequest);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.shop);
};

// Cập nhật thông tin shop
export const updateMyShopController = async (req: Request, res: Response) => {
  const result = await ShopManagementService.updateMyShop(req as AuthenticatedRequest, req.body);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.shop);
};

// Lấy danh sách sản phẩm của shop
export const getMyShopProductsController = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetMyShopProductsQuery;
  const result = await ShopManagementService.getMyShopProducts(req as AuthenticatedRequest, query);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.products, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};

// Tạo sản phẩm mới
export const createMyShopProductController = async (req: Request, res: Response) => {
  const result = await ShopManagementService.createMyShopProduct(
    req as AuthenticatedRequest,
    req.body
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.created(res, result.product);
};

// Cập nhật sản phẩm
export const updateMyShopProductController = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const result = await ShopManagementService.updateMyShopProduct(
    req as AuthenticatedRequest,
    productId,
    req.body
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.product);
};

// Xóa sản phẩm
export const deleteMyShopProductController = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const result = await ShopManagementService.deleteMyShopProduct(
    req as AuthenticatedRequest,
    productId
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.product);
};

// Lấy danh sách đơn hàng của shop
export const getMyShopOrdersController = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetMyShopOrdersQuery;
  const result = await ShopManagementService.getMyShopOrders(req as AuthenticatedRequest, query);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.orders, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};

// Lấy chi tiết đơn hàng
export const getMyShopOrderController = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const result = await ShopManagementService.getMyShopOrder(req as AuthenticatedRequest, orderId);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.order);
};

// Cập nhật trạng thái đơn hàng
export const updateMyShopOrderStatusController = async (req: Request, res: Response) => {
  const { orderId } = req.params;
  const data = req.body as UpdateOrderStatusRequest;
  const result = await ShopManagementService.updateMyShopOrderStatus(
    req as AuthenticatedRequest,
    orderId,
    data
  );
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.order);
};

// Lấy thống kê shop
export const getMyShopAnalyticsController = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetAnalyticsQuery;
  const result = await ShopManagementService.getMyShopAnalytics(req as AuthenticatedRequest, query);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.analytics);
};

// Lấy đánh giá shop
export const getMyShopReviewsController = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetReviewsQuery;
  const result = await ShopManagementService.getMyShopReviews(req as AuthenticatedRequest, query);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
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

// Lấy danh sách người theo dõi
export const getMyShopFollowersController = async (req: Request, res: Response) => {
  const query = req.query as unknown as GetFollowersQuery;
  const result = await ShopManagementService.getMyShopFollowers(req as AuthenticatedRequest, query);
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(res, result.followers, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};

