import { Request, Response } from "express";
import ShopService from "./shop.service";
import { ResponseUtil } from "../../shared/utils/response.util";

export const getShopController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShopService.get(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const createShopController = async (req: Request, res: Response) => {
  const result = await ShopService.create(req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.created(res, result.item);
};

export const updateShopController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShopService.update(id, req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const deleteShopController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShopService.delete(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const listShopController = async (req: Request, res: Response) => {
  const { page, limit, userId, search, status } = req.query as any;
  const result = await ShopService.list({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    userId,
    search,
    status,
  });
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};
