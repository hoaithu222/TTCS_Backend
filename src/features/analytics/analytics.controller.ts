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
  
  // Debug: Log để kiểm tra dữ liệu
  console.log("🔍 [TopShops Controller] Result items:", JSON.stringify(result.items, null, 2));
  
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

// 1. Shop Strength Quadrant
export const shopStrengthQuadrantController = async (
  req: Request,
  res: Response
) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const period = (req.query.period as "day" | "week" | "month" | "year") || undefined;
  
  // Calculate date range based on period if not provided
  let dateFrom = from;
  let dateTo = to;
  if (!dateFrom && !dateTo && period) {
    const now = new Date();
    dateTo = new Date(now);
    dateFrom = new Date(now);
    switch (period) {
      case "day":
        dateFrom.setDate(dateFrom.getDate() - 1);
        break;
      case "week":
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case "month":
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case "year":
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
    }
  }
  
  const result = await AnalyticsService.shopStrengthQuadrant({ from: dateFrom, to: dateTo });
  if (!result.ok)
    return ResponseUtil.error(
      res,
      (result as any).message,
      (result as any).status
    );
  return ResponseUtil.success(res, result.items);
};

// 2. Cash Flow Growth with MA30 and Net Profit
export const cashFlowGrowthController = async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const period = (req.query.period as "day" | "week" | "month" | "year") || undefined;
  const granularity = (req.query.granularity as "day" | "month") || 
    (period === "year" ? "month" : "day");
  
  // Calculate date range based on period if not provided
  let dateFrom = from;
  let dateTo = to;
  if (!dateFrom && !dateTo && period) {
    const now = new Date();
    dateTo = new Date(now);
    dateFrom = new Date(now);
    switch (period) {
      case "day":
        dateFrom.setDate(dateFrom.getDate() - 1);
        break;
      case "week":
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case "month":
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case "year":
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
    }
  }
  
  const result = await AnalyticsService.cashFlowGrowth({
    from: dateFrom,
    to: dateTo,
    granularity,
  });
  if (!result.ok)
    return ResponseUtil.error(
      res,
      (result as any).message,
      (result as any).status
    );
  return ResponseUtil.success(res, result.items);
};

// 3. Payment Method & Device Type Distribution
export const paymentAndDeviceDistributionController = async (
  req: Request,
  res: Response
) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const period = (req.query.period as "day" | "week" | "month" | "year") || undefined;
  
  // Calculate date range based on period if not provided
  let dateFrom = from;
  let dateTo = to;
  if (!dateFrom && !dateTo && period) {
    const now = new Date();
    dateTo = new Date(now);
    dateFrom = new Date(now);
    switch (period) {
      case "day":
        dateFrom.setDate(dateFrom.getDate() - 1);
        break;
      case "week":
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case "month":
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case "year":
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
    }
  }
  
  const result = await AnalyticsService.paymentAndDeviceDistribution({
    from: dateFrom,
    to: dateTo,
  });
  if (!result.ok)
    return ResponseUtil.error(
      res,
      (result as any).message,
      (result as any).status
    );
  return ResponseUtil.success(res, {
    paymentMethods: result.paymentMethods,
    deviceTypes: result.deviceTypes,
  });
};

// 4. System Load Stats (API Request Tracking)
export const systemLoadStatsController = async (req: Request, res: Response) => {
  const from = req.query.from ? new Date(String(req.query.from)) : undefined;
  const to = req.query.to ? new Date(String(req.query.to)) : undefined;
  const period = (req.query.period as "day" | "week" | "month" | "year") || undefined;
  const granularity = (req.query.granularity as "hour" | "day") || 
    (period === "year" || period === "month" ? "day" : "hour");
  
  // Calculate date range based on period if not provided
  let dateFrom = from;
  let dateTo = to;
  if (!dateFrom && !dateTo && period) {
    const now = new Date();
    dateTo = new Date(now);
    dateFrom = new Date(now);
    switch (period) {
      case "day":
        dateFrom.setDate(dateFrom.getDate() - 1);
        break;
      case "week":
        dateFrom.setDate(dateFrom.getDate() - 7);
        break;
      case "month":
        dateFrom.setMonth(dateFrom.getMonth() - 1);
        break;
      case "year":
        dateFrom.setFullYear(dateFrom.getFullYear() - 1);
        break;
    }
  }
  
  const result = await AnalyticsService.systemLoadStats({
    from: dateFrom,
    to: dateTo,
    granularity,
  });
  if (!result.ok)
    return ResponseUtil.error(
      res,
      (result as any).message,
      (result as any).status
    );
  return ResponseUtil.success(res, result.items);
};