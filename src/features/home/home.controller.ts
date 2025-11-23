import { Request, Response } from "express";
import HomeService from "./home.service";
import { ResponseUtil } from "../../shared/utils/response.util";

export const getBannerController = async (req: Request, res: Response) => {
  const result = await HomeService.getBanner();
  if (!result.ok) {
    return ResponseUtil.error(res, result.message || "Failed to fetch banners", result.status || 500);
  }
  return ResponseUtil.success(res, result.banners);
};

export const getHomeCategoriesController = async (
  req: Request,
  res: Response
) => {
  const { page, limit } = req.query as any;
  const result = await HomeService.getHomeCategories({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    { categories: result.categories },
    "Success",
    200,
    1,
    result.pagination
  );
};

export const getBestSellerProductsController = async (
  req: Request,
  res: Response
) => {
  const { page, limit } = req.query as any;
  const result = await HomeService.getBestSellerProducts({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    { products: result.products },
    "Success",
    200,
    1,
    result.pagination
  );
};

export const getBestShopsController = async (req: Request, res: Response) => {
  const { page, limit } = req.query as any;
  const result = await HomeService.getBestShops({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    { shops: result.shops },
    "Success",
    200,
    1,
    result.pagination
  );
};

export const getFlashSaleProductsController = async (
  req: Request,
  res: Response
) => {
  const { page, limit } = req.query as any;
  const result = await HomeService.getFlashSaleProducts({
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    { products: result.products },
    "Success",
    200,
    1,
    result.pagination
  );
};

export const getSearchSuggestionsController = async (
  req: Request,
  res: Response
) => {
  const { q, page, limit } = req.query as any;
  if (!q) {
    return ResponseUtil.error(res, "Query parameter 'q' is required", 400);
  }
  const result = await HomeService.getSearchSuggestions({
    q: String(q),
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });
  if (!result.ok) {
    return ResponseUtil.error(res, result.message, result.status);
  }
  return ResponseUtil.success(
    res,
    { products: result.products },
    "Success",
    200,
    1,
    result.pagination
  );
};
