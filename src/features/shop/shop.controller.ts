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
  const currentUser = (req as any).user as { userId: string } | undefined;
  if (!currentUser) return ResponseUtil.error(res, "Unauthorized", 401);

  const data = {
    ...req.body,
    userId: currentUser.userId,
  };

  const result = await ShopService.create(data);
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

export const followShopController = async (req: Request, res: Response) => {
  const { id } = req.params; // shopId
  const currentUser = (req as any).user as { userId: string } | undefined;
  if (!currentUser) return ResponseUtil.error(res, "Unauthorized", 401);
  const result = await ShopService.follow(id, currentUser.userId);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, { followed: true });
};

export const unfollowShopController = async (req: Request, res: Response) => {
  const { id } = req.params; // shopId
  const currentUser = (req as any).user as { userId: string } | undefined;
  if (!currentUser) return ResponseUtil.error(res, "Unauthorized", 401);
  const result = await ShopService.unfollow(id, currentUser.userId);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, { followed: false });
};

export const isFollowingShopController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params; // shopId
  const currentUser = (req as any).user as { userId: string } | undefined;
  if (!currentUser) return ResponseUtil.error(res, "Unauthorized", 401);
  const result = await ShopService.isFollowing(id, currentUser.userId);
  if (!result.ok) return ResponseUtil.error(res, "Error", 400);
  return ResponseUtil.success(res, { following: result.following });
};

export const followersCountController = async (req: Request, res: Response) => {
  const { id } = req.params; // shopId
  const result = await ShopService.followersCount(id);
  if (!result.ok) return ResponseUtil.error(res, "Error", 400);
  return ResponseUtil.success(res, { count: result.count });
};

export const getShopStatusByUserIdController = async (
  req: Request,
  res: Response
) => {
  const { userId } = req.params;
  const result = await ShopService.getShopStatusByUserId(userId);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, {
    shopStatus: result.shopStatus,
    shop: result.shop,
  });
};

export const approveShopController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShopService.approveShop(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const rejectShopController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShopService.rejectShop(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const suspendShopController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ShopService.suspendShop(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};
