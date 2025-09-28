import { Request, Response } from "express";
import CartService from "./cart.service";
import { ResponseUtil } from "../../shared/utils/response.util";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

export const getCartController = async (req: Request, res: Response) => {
  const result = await CartService.getOrCreate(req as AuthenticatedRequest);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.cart);
};

export const addCartItemController = async (req: Request, res: Response) => {
  const result = await CartService.addItem(
    req as AuthenticatedRequest,
    req.body
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.cart);
};

export const updateCartItemController = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const result = await CartService.updateItem(
    req as AuthenticatedRequest,
    itemId,
    req.body
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.cart);
};

export const removeCartItemController = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const result = await CartService.removeItem(
    req as AuthenticatedRequest,
    itemId
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.cart);
};

export const clearCartController = async (req: Request, res: Response) => {
  const result = await CartService.clear(req as AuthenticatedRequest);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.cart);
};
