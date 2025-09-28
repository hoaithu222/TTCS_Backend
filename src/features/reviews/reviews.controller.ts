import { Request, Response } from "express";
import ReviewsService from "./reviews.service";
import { ResponseUtil } from "../../shared/utils/response.util";
import { AuthenticatedRequest } from "../../shared/middlewares/auth.middleware";

export const createReviewController = async (req: Request, res: Response) => {
  const result = await ReviewsService.create(
    req as AuthenticatedRequest,
    req.body
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.created(res, result.review);
};

export const getReviewController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReviewsService.get(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.review);
};

export const listReviewsController = async (req: Request, res: Response) => {
  const result = await ReviewsService.list(req.query as any);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};

export const updateReviewController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReviewsService.update(
    req as AuthenticatedRequest,
    id,
    req.body
  );
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.review);
};

export const deleteReviewController = async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReviewsService.delete(req as AuthenticatedRequest, id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.review);
};
