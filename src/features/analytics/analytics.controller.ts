import { Request, Response } from "express";
import AnalyticsService from "./analytics.service";
import { ResponseUtil } from "../../shared/utils/response.util";

export const shopRevenueController = async (req: Request, res: Response) => {
  const { shopId } = req.params as { shopId: string };
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const result = await AnalyticsService.revenueByShop({ shopId, from, to });
  if (!result.ok)
    return ResponseUtil.error(
      res,
      (result as any).message,
      (result as any).status
    );
  return ResponseUtil.success(res, result.revenue);
};

export const adminRevenueController = async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const result = await AnalyticsService.revenueAllShops({ from, to });
  if (!result.ok)
    return ResponseUtil.error(
      res,
      (result as any).message,
      (result as any).status
    );
  return ResponseUtil.success(res, {
    items: result.items,
    totals: result.totals,
  });
};

export const revenueTimeSeriesController = async (
  req: Request,
  res: Response
) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const granularity = (req.query.granularity as any) || "day";
  const shopId = (req.query.shopId as string) || undefined;
  const result = await AnalyticsService.revenueTimeSeries({
    from,
    to,
    granularity,
    shopId,
  });
  if (!result.ok)
    return ResponseUtil.error(
      res,
      (result as any).message,
      (result as any).status
    );
  return ResponseUtil.success(res, result.items);
};

export const topProductsController = async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const shopId = (req.query.shopId as string) || undefined;
  const categoryId = (req.query.categoryId as string) || undefined;
  const subCategoryId = (req.query.subCategoryId as string) || undefined;
  const metric = (req.query.metric as "revenue" | "quantity") || undefined;
  const result = await AnalyticsService.topProducts({
    from,
    to,
    limit,
    shopId,
    categoryId,
    subCategoryId,
    metric,
  });
  if (!result.ok)
    return ResponseUtil.error(
      res,
      (result as any).message,
      (result as any).status
    );
  return ResponseUtil.success(res, result.items);
};

export const topShopsController = async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  const result = await AnalyticsService.topShops({ from, to, limit });
  if (!result.ok)
    return ResponseUtil.error(
      res,
      (result as any).message,
      (result as any).status
    );
  return ResponseUtil.success(res, result.items);
};

export const orderStatusDistributionController = async (
  req: Request,
  res: Response
) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const result = await AnalyticsService.orderStatusDistribution({ from, to });
  if (!result.ok)
    return ResponseUtil.error(
      res,
      (result as any).message,
      (result as any).status
    );
  return ResponseUtil.success(res, result.items);
};

export const averageOrderValueController = async (
  req: Request,
  res: Response
) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const shopId = (req.query.shopId as string) || undefined;
  const result = await AnalyticsService.averageOrderValue({ from, to, shopId });
  if (!result.ok)
    return ResponseUtil.error(
      res,
      (result as any).message,
      (result as any).status
    );
  return ResponseUtil.success(res, result);
};
