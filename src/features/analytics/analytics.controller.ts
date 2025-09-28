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
