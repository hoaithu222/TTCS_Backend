import { Request, Response } from "express";
import AttributeTypeService from "./attributeType.service";
import { ResponseUtil } from "../../shared/utils/response.util";

export const getAttributeTypeController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await AttributeTypeService.get(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const createAttributeTypeController = async (
  req: Request,
  res: Response
) => {
  const result = await AttributeTypeService.create(req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.created(res, result.item);
};

export const updateAttributeTypeController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await AttributeTypeService.update(id, req.body);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const deleteAttributeTypeController = async (
  req: Request,
  res: Response
) => {
  const { id } = req.params;
  const result = await AttributeTypeService.delete(id);
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.item);
};

export const listAttributeTypeController = async (
  req: Request,
  res: Response
) => {
  const { page, limit, search, isActive } = req.query as any;
  const result = await AttributeTypeService.list({
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    search,
    isActive: typeof isActive === "string" ? isActive === "true" : undefined,
  });
  if (!result.ok) return ResponseUtil.error(res, result.message, result.status);
  return ResponseUtil.success(res, result.items, "Success", 200, 1, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.max(1, Math.ceil(result.total / result.limit)),
  });
};
