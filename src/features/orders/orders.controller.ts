import { Request, Response } from "express";
import OrdersService from "./orders.service";
import { ResponseUtil } from "../../shared/utils/response.util";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

export const createOrderController = async (req: Request, res: Response) => {
  const result = await OrdersService.create(
    req as AuthenticatedRequest,
    req.body
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.created(res, result.order);
};

export const getOrderController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrdersService.get(req as AuthenticatedRequest, id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.order);
};

export const listOrdersController = async (req: Request, res: Response) => {
  const result = await OrdersService.list(
    req as AuthenticatedRequest,
    req.query as any
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};

export const updateOrderController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrdersService.update(
    req as AuthenticatedRequest,
    id,
    req.body
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.order);
};

export const updateOrderStatusController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const { status, description } = req.body as any;
  const result = await OrdersService.updateStatus(
    req as AuthenticatedRequest,
    id,
    status,
    description
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.order);
};

export const deleteOrderController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await OrdersService.delete(req as AuthenticatedRequest, id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.order);
};

export const cancelOrderByUserController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const { reason } = req.body as any;
  const result = await OrdersService.cancelByUser(
    req as AuthenticatedRequest,
    id,
    reason
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.order);
};
