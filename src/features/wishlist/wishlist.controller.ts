import { Request, Response } from "express";
import WishlistService from "./wishlist.service";
import { ResponseUtil } from "../../shared/utils/response.util";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

export const getWishlistController = async (req: Request, res: Response) => {
  const result = await WishlistService.getOrCreate(req as AuthenticatedRequest);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, { wishlist: result.wishlist });
};

export const addToWishlistController = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const result = await WishlistService.addItem(
    req as AuthenticatedRequest,
    productId
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, { wishlist: result.wishlist }, result.message);
};

export const removeFromWishlistController = async (
  req: Request,
  res: Response
) => {
  const { productId } = req.params;
  const result = await WishlistService.removeItem(
    req as AuthenticatedRequest,
    productId
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(
    res,
    { wishlist: result.wishlist },
    "Đã xóa sản phẩm khỏi danh sách yêu thích"
  );
};

export const clearWishlistController = async (req: Request, res: Response) => {
  const result = await WishlistService.clear(req as AuthenticatedRequest);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, { wishlist: result.wishlist }, "Đã xóa toàn bộ danh sách yêu thích");
};

export const checkWishlistController = async (req: Request, res: Response) => {
  const { productId } = req.params;
  const result = await WishlistService.checkItem(
    req as AuthenticatedRequest,
    productId
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, { isInWishlist: result.isInWishlist });
};

